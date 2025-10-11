const { v4: uuidv4 } = require('uuid');
const crypto = require('crypto');
const { BlockchainDB, EventDB } = require('./models');

/**
 * Database-Integrated Blockchain Implementation
 * PostgreSQL-backed blockchain with persistent storage
 */
class TaxGuardBlockchainDB {
    constructor() {
        this.initialized = false;
    }

    /**
     * Initialize the blockchain from database
     */
    async initialize() {
        try {
            // Check if genesis block exists
            const genesisBlock = await BlockchainDB.getBlockByIndex(0);

            if (!genesisBlock) {
                await this.createGenesisBlock();
            } else {
                console.log('✅ Genesis block found in database');
            }

            this.initialized = true;
            console.log('✅ Blockchain initialized from database');
        } catch (error) {
            console.error('❌ Failed to initialize blockchain:', error);
            throw error;
        }
    }

    /**
     * Create the genesis block
     */
    async createGenesisBlock() {
        const genesisBlock = {
            index: 0,
            timestamp: new Date().toISOString(),
            data: { message: 'Genesis Block - TaxGuard AI', system: 'TaxGuard' },
            previousHash: '0',
            hash: this.calculateHash(0, new Date().toISOString(), 'Genesis Block - TaxGuard AI', '0')
        };

        await BlockchainDB.createBlock(
            genesisBlock.index,
            genesisBlock.timestamp,
            genesisBlock.previousHash,
            genesisBlock.hash,
            genesisBlock.data
        );

        console.log('✅ Genesis block created in database');
    }

    /**
     * Calculate hash for a block
     */
    calculateHash(index, timestamp, data, previousHash) {
        return crypto.createHash('sha256')
            .update(index + timestamp + JSON.stringify(data) + previousHash)
            .digest('hex');
    }

    /**
     * Create a new event and add to blockchain
     */
    async createEvent(eventId, eventType, timestamp, anonymizedUserId, hashOfPayload, notes, metadata = null) {
        try {
            // Get the latest block
            const latestBlock = await BlockchainDB.getLatestBlock();
            const blockIndex = latestBlock.block_index + 1;

            // Create event object
            const event = {
                eventId,
                eventType,
                timestamp,
                anonymizedUserId,
                hashOfPayload,
                notes: notes || '',
                blockIndex
            };

            // Create new block
            const newBlock = {
                index: blockIndex,
                timestamp: new Date().toISOString(),
                data: event,
                previousHash: latestBlock.hash,
                hash: ''
            };

            newBlock.hash = this.calculateHash(
                newBlock.index,
                newBlock.timestamp,
                newBlock.data,
                newBlock.previousHash
            );

            // Save block to database
            await BlockchainDB.createBlock(
                newBlock.index,
                newBlock.timestamp,
                newBlock.previousHash,
                newBlock.hash,
                newBlock.data
            );

            // Save event to database
            await EventDB.createEvent(
                eventId,
                eventType,
                timestamp,
                anonymizedUserId,
                hashOfPayload,
                notes,
                blockIndex,
                metadata
            );

            console.log(`✅ Event ${eventId} added to blockchain (Block ${blockIndex})`);
            return event;
        } catch (error) {
            console.error('❌ Failed to create event:', error);
            throw error;
        }
    }

    /**
     * Read an event by ID
     */
    async readEvent(eventId) {
        try {
            return await EventDB.getEventById(eventId);
        } catch (error) {
            console.error('❌ Failed to read event:', error);
            throw error;
        }
    }

    /**
     * Query all events
     */
    async queryAllEvents() {
        try {
            return await EventDB.getAllEvents();
        } catch (error) {
            console.error('❌ Failed to query events:', error);
            throw error;
        }
    }

    /**
     * Get blockchain info
     */
    async getChainInfo() {
        try {
            const latestBlock = await BlockchainDB.getLatestBlock();
            const blockCount = await BlockchainDB.getBlockCount();
            const eventCount = await EventDB.getEventCount();

            return {
                length: blockCount,
                latestBlock: latestBlock,
                totalEvents: eventCount,
                valid: await this.validateChain()
            };
        } catch (error) {
            console.error('❌ Failed to get chain info:', error);
            throw error;
        }
    }

    /**
     * Validate the entire blockchain
     */
    async validateChain() {
        try {
            const blocks = await BlockchainDB.getAllBlocks();

            for (let i = 1; i < blocks.length; i++) {
                const currentBlock = blocks[i];
                const previousBlock = blocks[i - 1];

                // Verify hash
                const recalculatedHash = this.calculateHash(
                    currentBlock.block_index,
                    currentBlock.timestamp,
                    currentBlock.data,
                    currentBlock.previous_hash
                );

                if (currentBlock.hash !== recalculatedHash) {
                    console.error(`❌ Block ${i} has invalid hash`);
                    return false;
                }

                // Verify chain linkage
                if (currentBlock.previous_hash !== previousBlock.hash) {
                    console.error(`❌ Block ${i} has invalid previous hash`);
                    return false;
                }
            }

            console.log('✅ Blockchain validation passed');
            return true;
        } catch (error) {
            console.error('❌ Failed to validate chain:', error);
            return false;
        }
    }

    /**
     * Get chain statistics
     */
    async getStatistics() {
        try {
            const chainInfo = await this.getChainInfo();
            const eventsByType = await this.getEventsByType();

            return {
                blockchain: {
                    totalBlocks: chainInfo.length,
                    totalEvents: chainInfo.totalEvents,
                    isValid: chainInfo.valid
                },
                events: {
                    byType: eventsByType,
                    total: chainInfo.totalEvents
                }
            };
        } catch (error) {
            console.error('❌ Failed to get statistics:', error);
            throw error;
        }
    }

    /**
     * Get events grouped by type
     */
    async getEventsByType() {
        try {
            const allEvents = await EventDB.getAllEvents();
            const grouped = {};

            allEvents.forEach(event => {
                if (!grouped[event.event_type]) {
                    grouped[event.event_type] = 0;
                }
                grouped[event.event_type]++;
            });

            return grouped;
        } catch (error) {
            console.error('❌ Failed to group events by type:', error);
            throw error;
        }
    }

    /**
     * Get the entire chain
     */
    async getChain() {
        try {
            return await BlockchainDB.getAllBlocks();
        } catch (error) {
            console.error('❌ Failed to get chain:', error);
            throw error;
        }
    }
}

// Create and export singleton instance
const blockchainDB = new TaxGuardBlockchainDB();

module.exports = {
    TaxGuardBlockchainDB,
    blockchainDB
};
