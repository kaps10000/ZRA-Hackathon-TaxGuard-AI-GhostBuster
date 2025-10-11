const request = require('supertest');
const app = require('../server');

describe('TaxGuard API Gateway', () => {
    let authToken;
    let auditorToken;

    beforeAll(async () => {
        // Login as taxpayer to get token
        const loginResponse = await request(app)
            .post('/api/auth/login')
            .send({
                username: 'taxpayer1',
                password: 'password123'
            });
        
        authToken = loginResponse.body.token;

        // Login as auditor
        const auditorResponse = await request(app)
            .post('/api/auth/login')
            .send({
                username: 'auditor1',
                password: 'password123'
            });
        
        auditorToken = auditorResponse.body.token;
    });

    describe('Health Check', () => {
        it('should return healthy status', async () => {
            const response = await request(app)
                .get('/health')
                .expect(200);

            expect(response.body.status).toBe('healthy');
            expect(response.body.service).toBe('TaxGuard API Gateway');
        });
    });

    describe('Authentication', () => {
        it('should login with valid credentials', async () => {
            const response = await request(app)
                .post('/api/auth/login')
                .send({
                    username: 'taxpayer1',
                    password: 'password123'
                })
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.token).toBeDefined();
            expect(response.body.user.role).toBe('taxpayer');
        });

        it('should reject invalid credentials', async () => {
            const response = await request(app)
                .post('/api/auth/login')
                .send({
                    username: 'taxpayer1',
                    password: 'wrongpassword'
                })
                .expect(401);

            expect(response.body.error).toBe('Invalid credentials');
        });

        it('should get user profile with valid token', async () => {
            const response = await request(app)
                .get('/api/auth/profile')
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.user.username).toBe('taxpayer1');
        });

        it('should reject requests without token', async () => {
            const response = await request(app)
                .get('/api/auth/profile')
                .expect(401);

            expect(response.body.error).toBe('Access denied');
        });
    });

    describe('Events API', () => {
        it('should submit event with valid token', async () => {
            const eventData = {
                eventType: 'filing',
                anonymizedUserId: 'user-test-001',
                hashOfPayload: 'a1b2c3d4e5f6789012345678901234567890abcdef1234567890abcdef123456',
                notes: 'Test event submission'
            };

            const response = await request(app)
                .post('/api/events')
                .set('Authorization', `Bearer ${authToken}`)
                .send(eventData)
                .expect(201);

            expect(response.body.success).toBe(true);
            expect(response.body.event).toBeDefined();
        });

        it('should reject event submission without token', async () => {
            const eventData = {
                eventType: 'filing',
                anonymizedUserId: 'user-test-002',
                hashOfPayload: 'b2c3d4e5f6789012345678901234567890abcdef1234567890abcdef123456',
                notes: 'Test event submission'
            };

            const response = await request(app)
                .post('/api/events')
                .send(eventData)
                .expect(401);

            expect(response.body.error).toBe('Access denied');
        });

        it('should reject invalid event data', async () => {
            const eventData = {
                eventType: 'invalid-type',
                anonymizedUserId: 'user-test-003',
                hashOfPayload: 'invalid-hash',
                notes: 'Test event submission'
            };

            const response = await request(app)
                .post('/api/events')
                .set('Authorization', `Bearer ${authToken}`)
                .send(eventData)
                .expect(400);

            expect(response.body.error).toBe('Validation failed');
        });

        it('should get events list with auditor token', async () => {
            const response = await request(app)
                .get('/api/events')
                .set('Authorization', `Bearer ${auditorToken}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.events).toBeDefined();
            expect(Array.isArray(response.body.events)).toBe(true);
        });

        it('should reject events list with taxpayer token', async () => {
            const response = await request(app)
                .get('/api/events')
                .set('Authorization', `Bearer ${authToken}`)
                .expect(403);

            expect(response.body.error).toBe('Insufficient permissions');
        });

        it('should get event stats with auditor token', async () => {
            const response = await request(app)
                .get('/api/events/stats')
                .set('Authorization', `Bearer ${auditorToken}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.stats).toBeDefined();
        });
    });

    describe('Error Handling', () => {
        it('should return 404 for non-existent endpoints', async () => {
            const response = await request(app)
                .get('/api/non-existent')
                .expect(404);

            expect(response.body.error).toBe('Endpoint not found');
        });

        it('should handle malformed JSON', async () => {
            const response = await request(app)
                .post('/api/auth/login')
                .set('Content-Type', 'application/json')
                .send('invalid json')
                .expect(400);
        });
    });
});

module.exports = app;
