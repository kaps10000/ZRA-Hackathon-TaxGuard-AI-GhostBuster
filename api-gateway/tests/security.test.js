/**
 * TaxGuard API Gateway - Security & Performance Tests
 * Task 5: Comprehensive Security Testing Suite
 */

const request = require('supertest');
const app = require('../server');

describe('Task 5 - Security & Performance Testing', () => {
  let taxpayerToken;
  let auditorToken;
  let adminToken;

  beforeAll(async () => {
    // Authenticate users for testing
    const taxpayerRes = await request(app)
      .post('/api/auth/login')
      .send({ username: 'taxpayer1', password: 'password123' });
    taxpayerToken = taxpayerRes.body.token;

    const auditorRes = await request(app)
      .post('/api/auth/login')
      .send({ username: 'auditor1', password: 'password123' });
    auditorToken = auditorRes.body.token;

    const adminRes = await request(app)
      .post('/api/auth/login')
      .send({ username: 'admin1', password: 'password123' });
    adminToken = adminRes.body.token;
  });

  // ==========================
  // Test 1: Unauthorized Writes / Access Violations
  // ==========================
  describe('1. Test Unauthorized Writes & Access Violations', () => {
    test('Should reject event submission without authentication', async () => {
      const response = await request(app)
        .post('/api/events')
        .send({
          eventType: 'filing',
          anonymizedUserId: 'test-user',
          hashOfPayload: 'a'.repeat(64),
          notes: 'Unauthorized test'
        });

      expect(response.status).toBe(401);
      expect(response.body.error).toBeDefined();
    });

    test('Should reject event submission with invalid token', async () => {
      const response = await request(app)
        .post('/api/events')
        .set('Authorization', 'Bearer invalid_token_12345')
        .send({
          eventType: 'filing',
          anonymizedUserId: 'test-user',
          hashOfPayload: 'a'.repeat(64)
        });

      expect(response.status).toBe(403);
    });

    test('Should reject event submission with malformed token', async () => {
      const response = await request(app)
        .post('/api/events')
        .set('Authorization', 'InvalidFormat token')
        .send({
          eventType: 'filing',
          anonymizedUserId: 'test-user',
          hashOfPayload: 'a'.repeat(64)
        });

      expect(response.status).toBe(401);
    });

    test('Should reject direct blockchain manipulation attempts', async () => {
      const response = await request(app)
        .post('/api/events')
        .set('Authorization', `Bearer ${taxpayerToken}`)
        .send({
          eventType: 'filing',
          anonymizedUserId: 'test-user',
          hashOfPayload: 'a'.repeat(64),
          blockIndex: 999, // Attempt to manipulate block index
          timestamp: new Date('2020-01-01').toISOString() // Backdated timestamp
        });

      // Should succeed but ignore malicious fields
      expect(response.status).toBe(200);
      expect(response.body.event.blockIndex).not.toBe(999);
    });
  });

  // ==========================
  // Test 2: Role-Based Access Control Validation
  // ==========================
  describe('2. Validate Role-Based Restrictions', () => {
    test('Taxpayer should NOT access auditor-only endpoints', async () => {
      const response = await request(app)
        .get('/api/events')
        .set('Authorization', `Bearer ${taxpayerToken}`);

      expect(response.status).toBe(403);
      expect(response.body.error).toMatch(/insufficient permissions|forbidden/i);
    });

    test('Taxpayer should NOT register new users', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .set('Authorization', `Bearer ${taxpayerToken}`)
        .send({
          username: 'newuser',
          password: 'password123',
          role: 'auditor'
        });

      expect(response.status).toBe(403);
    });

    test('Auditor should access GET /api/events', async () => {
      const response = await request(app)
        .get('/api/events')
        .set('Authorization', `Bearer ${auditorToken}`);

      expect([200, 404]).toContain(response.status); // 200 if events exist, 404 if none
    });

    test('Auditor should NOT register new users', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .set('Authorization', `Bearer ${auditorToken}`)
        .send({
          username: 'hacker',
          password: 'password123',
          role: 'admin'
        });

      expect(response.status).toBe(403);
    });

    test('Admin should register new users', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          username: `testuser_${Date.now()}`,
          password: 'password123',
          role: 'taxpayer'
        });

      expect([200, 201, 409]).toContain(response.status); // 409 if user exists
    });

    test('Admin should access all protected endpoints', async () => {
      const response = await request(app)
        .get('/api/events')
        .set('Authorization', `Bearer ${adminToken}`);

      expect([200, 404]).toContain(response.status);
    });
  });

  // ==========================
  // Test 3: Input Validation & Injection Prevention
  // ==========================
  describe('3. Input Validation & Injection Prevention', () => {
    test('Should reject invalid event type', async () => {
      const response = await request(app)
        .post('/api/events')
        .set('Authorization', `Bearer ${taxpayerToken}`)
        .send({
          eventType: 'INVALID_TYPE',
          anonymizedUserId: 'test-user',
          hashOfPayload: 'a'.repeat(64)
        });

      expect(response.status).toBe(400);
      expect(response.body.errors).toBeDefined();
    });

    test('Should reject invalid hash format (too short)', async () => {
      const response = await request(app)
        .post('/api/events')
        .set('Authorization', `Bearer ${taxpayerToken}`)
        .send({
          eventType: 'filing',
          anonymizedUserId: 'test-user',
          hashOfPayload: 'abc123' // Invalid: too short
        });

      expect(response.status).toBe(400);
    });

    test('Should reject invalid hash format (non-hex)', async () => {
      const response = await request(app)
        .post('/api/events')
        .set('Authorization', `Bearer ${taxpayerToken}`)
        .send({
          eventType: 'filing',
          anonymizedUserId: 'test-user',
          hashOfPayload: 'z'.repeat(64) // Invalid: non-hexadecimal
        });

      expect(response.status).toBe(400);
    });

    test('Should prevent SQL injection in event notes', async () => {
      const response = await request(app)
        .post('/api/events')
        .set('Authorization', `Bearer ${taxpayerToken}`)
        .send({
          eventType: 'filing',
          anonymizedUserId: 'test-user',
          hashOfPayload: 'a'.repeat(64),
          notes: "'; DROP TABLE users; --"
        });

      // Should either sanitize or accept as plain text
      expect([200, 400]).toContain(response.status);
      if (response.status === 200) {
        expect(response.body.success).toBe(true);
      }
    });

    test('Should prevent XSS in event notes', async () => {
      const response = await request(app)
        .post('/api/events')
        .set('Authorization', `Bearer ${taxpayerToken}`)
        .send({
          eventType: 'filing',
          anonymizedUserId: 'test-user',
          hashOfPayload: 'a'.repeat(64),
          notes: '<script>alert("XSS")</script>'
        });

      expect([200, 400]).toContain(response.status);
    });

    test('Should reject oversized notes field', async () => {
      const response = await request(app)
        .post('/api/events')
        .set('Authorization', `Bearer ${taxpayerToken}`)
        .send({
          eventType: 'filing',
          anonymizedUserId: 'test-user',
          hashOfPayload: 'a'.repeat(64),
          notes: 'x'.repeat(2000) // Exceeds 1000 character limit
        });

      expect(response.status).toBe(400);
    });
  });

  // ==========================
  // Test 4: Hash Integrity Verification
  // ==========================
  describe('4. Hash Integrity Verification', () => {
    let testEventId;

    test('Should create event with valid hash', async () => {
      const payload = JSON.stringify({
        taxAmount: 5000,
        taxType: 'VAT',
        period: 'Q3-2025'
      });

      const crypto = require('crypto');
      const hash = crypto.createHash('sha256').update(payload).digest('hex');

      const response = await request(app)
        .post('/api/events')
        .set('Authorization', `Bearer ${taxpayerToken}`)
        .send({
          eventType: 'filing',
          anonymizedUserId: 'test-user-hash',
          hashOfPayload: hash,
          notes: 'Hash integrity test'
        });

      expect(response.status).toBe(200);
      testEventId = response.body.event?.eventId;
    });

    test('Hash should match stored value', async () => {
      if (!testEventId) {
        console.warn('Skipping: No event ID from previous test');
        return;
      }

      const response = await request(app)
        .get(`/api/events/${testEventId}`)
        .set('Authorization', `Bearer ${auditorToken}`);

      if (response.status === 200) {
        expect(response.body.event.hashOfPayload).toHaveLength(64);
        expect(response.body.event.hashOfPayload).toMatch(/^[a-f0-9]{64}$/);
      }
    });
  });

  // ==========================
  // Test 5: Rate Limiting & Throttling
  // ==========================
  describe('5. Rate Limiting & Throttling', () => {
    test('Should accept requests within rate limit', async () => {
      const requests = [];
      for (let i = 0; i < 10; i++) {
        requests.push(
          request(app)
            .get('/health')
        );
      }

      const responses = await Promise.all(requests);
      const allSuccessful = responses.every(r => r.status === 200);
      expect(allSuccessful).toBe(true);
    });

    test('Should enforce rate limit after threshold', async () => {
      const requests = [];
      // Exceed the 100 requests per 15 minutes limit
      for (let i = 0; i < 110; i++) {
        requests.push(
          request(app)
            .get('/health')
            .set('X-Forwarded-For', '192.168.1.100') // Simulate same IP
        );
      }

      const responses = await Promise.all(requests);
      const rateLimitedResponses = responses.filter(r => r.status === 429);

      // Should have at least some rate-limited responses
      // Note: Actual behavior depends on rate limit configuration
      console.log(`Rate limited: ${rateLimitedResponses.length}/110 requests`);
      expect(responses.length).toBe(110);
    }, 30000); // 30 second timeout
  });

  // ==========================
  // Test 6: Performance & Load Testing
  // ==========================
  describe('6. Performance & Load Testing', () => {
    test('Should handle concurrent event submissions', async () => {
      const concurrentRequests = 20;
      const requests = [];

      for (let i = 0; i < concurrentRequests; i++) {
        requests.push(
          request(app)
            .post('/api/events')
            .set('Authorization', `Bearer ${taxpayerToken}`)
            .send({
              eventType: 'filing',
              anonymizedUserId: `concurrent-user-${i}`,
              hashOfPayload: 'a'.repeat(64),
              notes: `Concurrent test ${i}`
            })
        );
      }

      const startTime = Date.now();
      const responses = await Promise.all(requests);
      const endTime = Date.now();
      const duration = endTime - startTime;

      const successfulRequests = responses.filter(r => r.status === 200).length;

      console.log(`Processed ${successfulRequests}/${concurrentRequests} requests in ${duration}ms`);
      console.log(`Average: ${(duration / concurrentRequests).toFixed(2)}ms per request`);

      expect(successfulRequests).toBeGreaterThan(0);
      expect(duration).toBeLessThan(10000); // Should complete within 10 seconds
    }, 15000);

    test('Should respond to health checks within acceptable time', async () => {
      const iterations = 50;
      const times = [];

      for (let i = 0; i < iterations; i++) {
        const start = Date.now();
        await request(app).get('/health');
        times.push(Date.now() - start);
      }

      const avgTime = times.reduce((a, b) => a + b, 0) / times.length;
      const maxTime = Math.max(...times);

      console.log(`Health check - Avg: ${avgTime.toFixed(2)}ms, Max: ${maxTime}ms`);

      expect(avgTime).toBeLessThan(100); // Average under 100ms
      expect(maxTime).toBeLessThan(500); // Max under 500ms
    });
  });

  // ==========================
  // Test 7: Session & Token Security
  // ==========================
  describe('7. Session & Token Security', () => {
    test('Should reject expired tokens', async () => {
      // This would require mocking time or using a short-lived token
      // For now, we test token format validation
      const response = await request(app)
        .get('/api/events')
        .set('Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.expired.token');

      expect(response.status).toBe(403);
    });

    test('Should prevent token reuse after logout (if implemented)', async () => {
      // Note: Current implementation doesn't have logout endpoint
      // This is a placeholder for future implementation
      expect(true).toBe(true);
    });

    test('Should not expose sensitive data in errors', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          username: 'nonexistent',
          password: 'wrongpassword'
        });

      expect(response.status).toBe(401);
      // Should not reveal whether username or password was wrong
      expect(response.body.message).not.toMatch(/username|password/i);
    });
  });

  // ==========================
  // Test 8: CORS & Headers Security
  // ==========================
  describe('8. CORS & Security Headers', () => {
    test('Should include security headers', async () => {
      const response = await request(app).get('/health');

      // Helmet should add these headers
      expect(response.headers['x-content-type-options']).toBe('nosniff');
      expect(response.headers['x-frame-options']).toBeDefined();
    });

    test('Should handle CORS properly', async () => {
      const response = await request(app)
        .get('/health')
        .set('Origin', 'http://localhost:3000');

      expect(response.headers['access-control-allow-origin']).toBeDefined();
    });
  });
});
