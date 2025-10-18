const TaxGuardContract = require('../contracts/TaxGuardContract');

/**
 * Smart Contract Integration Layer
 * Bridges REST API with Hyperledger Fabric Smart Contract
 */
class ContractIntegration {
    constructor() {
        this.contract = new TaxGuardContract();
        this.mockContext = this.createMockContext();
    }

    /**
     * Create mock context for development/testing
     */
    createMockContext() {
        return {
            stub: {
                putState: async (key, value) => {
                    console.log(`📝 Storing: ${key}`);
                    return Promise.resolve();
                },
                getState: async (key) => {
                    console.log(`📖 Reading: ${key}`);
                    // Mock empty state for new events
                    return Promise.resolve(Buffer.from(''));
                },
                getStateByRange: async (start, end) => {
                    // Mock iterator for queryAllEvents
                    return {
                        next: async () => ({ done: true }),
                        close: async () => {}
                    };
                },
                setEvent: (eventName, payload) => {
                    console.log(`📡 Event emitted: ${eventName}`);
                },
                getTxID: () => `tx-${Date.now()}`
            },
            clientIdentity: {
                getID: () => 'mock-user-id',
                getAttributeValue: (attr) => {
                    // Default to producer role for API integration
                    if (attr === 'role') return 'producer';
                    return null;
                }
            }
        };
    }

    /**
     * Create event via smart contract
     */
    async createEvent(eventId, eventType, anonymizedUserId, hashOfPayload, notes = '') {
        try {
            const result = await this.contract.createEvent(
                this.mockContext,
                eventId,
                eventType,
                anonymizedUserId,
                hashOfPayload,
                notes
            );
            return JSON.parse(result);
        } catch (error) {
            throw new Error(`Smart Contract Error: ${error.message}`);
        }
    }

    /**
     * Read event via smart contract
     */
    async readEvent(eventId) {
        try {
            // Mock existing event for read operations
            this.mockContext.stub.getState = async (key) => {
                if (key === eventId) {
                    const mockEvent = {
                        eventId,
                        eventType: 'filing',
                        timestamp: new Date().toISOString(),
                        anonymizedUserId: 'mock-user',
                        hashOfPayload: 'mock-hash',
                        notes: 'Mock event for testing',
                        integrity: this.contract._calculateIntegrityHash(
                            eventId, 'filing', 'mock-user', 'mock-hash'
                        )
                    };
                    return Buffer.from(JSON.stringify(mockEvent));
                }
                return Buffer.from('');
            };

            const result = await this.contract.readEvent(this.mockContext, eventId);
            return JSON.parse(result);
        } catch (error) {
            throw new Error(`Smart Contract Error: ${error.message}`);
        }
    }

    /**
     * Query all events via smart contract
     */
    async queryAllEvents() {
        try {
            // Set auditor role for query operations
            this.mockContext.clientIdentity.getAttributeValue = (attr) => {
                if (attr === 'role') return 'auditor';
                return null;
            };

            const result = await this.contract.queryAllEvents(this.mockContext);
            return JSON.parse(result);
        } catch (error) {
            throw new Error(`Smart Contract Error: ${error.message}`);
        }
    }

    /**
     * Validate event data before smart contract submission
     */
    validateEventData(eventType, anonymizedUserId, hashOfPayload) {
        const validTypes = ['filing', 'payment', 'auditFlag', 'adminChange', 'compliance', 'whistleblower'];
        
        if (!validTypes.includes(eventType)) {
            throw new Error(`Invalid event type. Must be one of: ${validTypes.join(', ')}`);
        }

        if (!anonymizedUserId || anonymizedUserId.trim().length === 0) {
            throw new Error('Anonymized User ID is required');
        }

        if (!hashOfPayload || !/^[a-fA-F0-9]+$/.test(hashOfPayload)) {
            throw new Error('Hash of payload must be a valid hexadecimal string');
        }

        return true;
    }

    /**
     * Get contract information
     */
    getContractInfo() {
        return {
            name: 'TaxGuardContract',
            version: '1.0.0',
            supportedEventTypes: ['filing', 'payment', 'auditFlag', 'adminChange', 'compliance', 'whistleblower'],
            roles: ['producer', 'auditor', 'admin'],
            functions: [
                'initLedger',
                'createEvent', 
                'readEvent',
                'queryAllEvents',
                'queryEventsByType',
                'getEventHistory'
            ]
        };
    }
}

module.exports = ContractIntegration;
