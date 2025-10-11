const { v4: uuidv4 } = require('uuid');
const crypto = require('crypto');

// Simple blockchain simulator for development
class TaxGuardBlockchain {
    constructor() {
        this.chain = [];
        this.events = new Map();
        this.createGenesisBlock();
    }

    createGenesisBlock() {
        const genesisBlock = {
            index: 0,
            timestamp: new Date().toISOString(),
            data: 'Genesis Block - TaxGuard AI',
            previousHash: '0',
            hash: this.calculateHash(0, new Date().toISOString(), 'Genesis Block - TaxGuard AI', '0')
        };
        this.chain.push(genesisBlock);
        console.log('✅ Genesis block created');
    }

    calculateHash(index, timestamp, data, previousHash) {
        return crypto.createHash('sha256')
            .update(index + timestamp + JSON.stringify(data) + previousHash)
            .digest('hex');
    }

    createEvent(eventId, eventType, timestamp, anonymizedUserId, hashOfPayload, notes) {
        const event = {
            eventId,
            eventType,
            timestamp,
            anonymizedUserId,
            hashOfPayload,
            notes: notes || '',
            blockIndex: this.chain.length
        };

        // Store event
        this.events.set(eventId, event);

        // Create block
        const newBlock = {
            index: this.chain.length,
            timestamp: new Date().toISOString(),
            data: event,
            previousHash: this.chain[this.chain.length - 1].hash,
            hash: ''
        };

        newBlock.hash = this.calculateHash(
            newBlock.index,
            newBlock.timestamp,
            newBlock.data,
            newBlock.previousHash
        );

        this.chain.push(newBlock);
        console.log(`✅ Event ${eventId} added to blockchain`);
        return event;
    }

    readEvent(eventId) {
        return this.events.get(eventId);
    }

    queryAllEvents() {
        return Array.from(this.events.values());
    }

    getChainInfo() {
        return {
            length: this.chain.length,
            latestBlock: this.chain[this.chain.length - 1],
            totalEvents: this.events.size
        };
    }
}

// Initialize blockchain
const blockchain = new TaxGuardBlockchain();

// Test with sample events
console.log('🚀 Deploying TaxGuard Blockchain...');

// Sample event 1
blockchain.createEvent(
    'evt-001',
    'filing',
    '2025-10-01T10:30:00Z',
    'user-abc123',
    'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
    'VAT return for September 2025'
);

// Sample event 2
blockchain.createEvent(
    'evt-002',
    'payment',
    '2025-10-01T11:00:00Z',
    'user-def456',
    '5d41402abc4b2a76b9719d911017c592',
    'Income tax payment'
);

// Sample event 3
blockchain.createEvent(
    'evt-003',
    'auditFlag',
    '2025-10-01T12:15:00Z',
    'user-ghi789',
    'd2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2',
    'Flagged for unusual VAT filing variance'
);

console.log('\n📊 Blockchain Status:');
console.log(blockchain.getChainInfo());

console.log('\n📋 All Events:');
console.log(blockchain.queryAllEvents());

module.exports = { TaxGuardBlockchain, blockchain };
