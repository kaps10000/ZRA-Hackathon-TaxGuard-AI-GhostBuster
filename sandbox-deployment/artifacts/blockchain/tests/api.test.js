const request = require('supertest');
const { TaxGuardBlockchain } = require('../scripts/deploy');

// Mock the blockchain for testing
jest.mock('../scripts/add-sample-events', () => ({
    blockchain: new (require('../scripts/deploy')).TaxGuardBlockchain()
}));

const app = require('../api/index');

describe('TaxGuard Blockchain API', () => {
    
    describe('GET /health', () => {
        it('should return health status', async () => {
            const res = await request(app).get('/health');
            expect(res.status).toBe(200);
            expect(res.body.status).toBe('healthy');
            expect(res.body.service).toBe('TaxGuard Blockchain API');
        });
    });

    describe('POST /api/events', () => {
        it('should create a new event', async () => {
            const eventData = {
                eventType: 'filing',
                anonymizedUserId: 'test-user-123',
                hashOfPayload: 'abc123def456',
                notes: 'Test tax filing event'
            };

            const res = await request(app)
                .post('/api/events')
                .send(eventData);

            expect(res.status).toBe(201);
            expect(res.body.success).toBe(true);
            expect(res.body.event.eventType).toBe('filing');
        });

        it('should reject invalid event type', async () => {
            const eventData = {
                eventType: 'invalid',
                anonymizedUserId: 'test-user-123',
                hashOfPayload: 'abc123def456'
            };

            const res = await request(app)
                .post('/api/events')
                .send(eventData);

            expect(res.status).toBe(400);
            expect(res.body.error).toContain('Invalid eventType');
        });

        it('should reject missing required fields', async () => {
            const eventData = {
                eventType: 'filing'
                // Missing required fields
            };

            const res = await request(app)
                .post('/api/events')
                .send(eventData);

            expect(res.status).toBe(400);
            expect(res.body.error).toContain('Missing required fields');
        });
    });

    describe('GET /api/events', () => {
        it('should return all events', async () => {
            const res = await request(app).get('/api/events');
            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(Array.isArray(res.body.events)).toBe(true);
        });
    });

    describe('GET /api/blockchain', () => {
        it('should return blockchain info', async () => {
            const res = await request(app).get('/api/blockchain');
            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.blockchain).toBeDefined();
        });
    });
});

describe('TaxGuard Blockchain Core', () => {
    let blockchain;

    beforeEach(() => {
        blockchain = new TaxGuardBlockchain();
    });

    it('should create genesis block', () => {
        expect(blockchain.chain.length).toBe(1);
        expect(blockchain.chain[0].index).toBe(0);
        expect(blockchain.chain[0].previousHash).toBe('0');
    });

    it('should create and store events', () => {
        const event = blockchain.createEvent(
            'test-001',
            'filing',
            '2025-10-01T10:00:00Z',
            'user-123',
            'hash123',
            'Test event'
        );

        expect(event.eventId).toBe('test-001');
        expect(blockchain.events.size).toBe(1);
        expect(blockchain.chain.length).toBe(2);
    });

    it('should calculate valid hashes', () => {
        blockchain.createEvent('test-001', 'filing', '2025-10-01T10:00:00Z', 'user-123', 'hash123', 'Test');
        
        const block = blockchain.chain[1];
        const calculatedHash = blockchain.calculateHash(
            block.index,
            block.timestamp,
            block.data,
            block.previousHash
        );
        
        expect(block.hash).toBe(calculatedHash);
    });
});
