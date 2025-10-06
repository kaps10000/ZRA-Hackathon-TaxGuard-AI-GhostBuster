const request = require('supertest');
const app = require('../server');

describe('Blockchain Integration Tests', () => {
  let authToken;
  let testDocumentId;

  beforeAll(async () => {
    // Get auth token
    const loginResponse = await request(app)
      .post('/api/auth/login')
      .send({
        username: 'zra_admin',
        password: 'password'
      });
    
    authToken = loginResponse.body.data.token;
  });

  describe('Blockchain Service Health', () => {
    it('should check blockchain service health', async () => {
      const response = await request(app)
        .get('/api/blockchain/health');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.integration).toBeDefined();
    });
  });

  describe('Store Proof Endpoint', () => {
    it('should store document proof on blockchain', async () => {
      const response = await request(app)
        .post('/api/blockchain/store-proof')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          documentId: 'TEST-DOC-001',
          fileHash: 'sha256:test-hash-123',
          verificationResult: {
            overallStatus: 'VALID',
            riskScore: 25.5
          }
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.transactionId).toBeDefined();
      expect(response.body.data.blockNumber).toBeDefined();
      expect(response.body.data.timestamp).toBeDefined();
    });

    it('should require authentication for store-proof', async () => {
      const response = await request(app)
        .post('/api/blockchain/store-proof')
        .send({
          documentId: 'TEST-DOC-001',
          fileHash: 'sha256:test-hash-123'
        });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    it('should validate required fields', async () => {
      const response = await request(app)
        .post('/api/blockchain/store-proof')
        .set('Authorization', `Bearer ${authToken}`)
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Document ID');
    });
  });

  describe('Get Proof Endpoint', () => {
    it('should retrieve blockchain proof by document ID', async () => {
      const response = await request(app)
        .get('/api/blockchain/get-proof/TEST-DOC-001');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.document).toBeDefined();
      expect(response.body.data.blockchain).toBeDefined();
      expect(response.body.data.verification).toBeDefined();
    });

    it('should handle non-existent document', async () => {
      const response = await request(app)
        .get('/api/blockchain/get-proof/NON-EXISTENT-DOC');

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });
  });

  describe('Hash Verification', () => {
    it('should verify document hash', async () => {
      const response = await request(app)
        .post('/api/blockchain/verify-hash')
        .send({
          hash: 'sha256:test-hash-123',
          hashType: 'fileHash'
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.verified).toBeDefined();
    });

    it('should handle invalid hash', async () => {
      const response = await request(app)
        .post('/api/blockchain/verify-hash')
        .send({
          hash: 'invalid-hash-123'
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.verified).toBe(false);
    });
  });

  describe('Document Flagging', () => {
    it('should flag document on blockchain', async () => {
      const response = await request(app)
        .post('/api/blockchain/flag-document')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          documentId: 'TEST-DOC-001',
          reason: 'Suspicious activity detected'
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.transactionId).toBeDefined();
    });

    it('should require authentication for flagging', async () => {
      const response = await request(app)
        .post('/api/blockchain/flag-document')
        .send({
          documentId: 'TEST-DOC-001',
          reason: 'Test reason'
        });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });
  });

  describe('Flagged Documents', () => {
    it('should retrieve flagged documents', async () => {
      const response = await request(app)
        .get('/api/blockchain/flagged-documents')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.documents).toBeDefined();
      expect(Array.isArray(response.body.data.documents)).toBe(true);
    });
  });

  describe('Automatic Blockchain Integration', () => {
    it('should automatically store proof after document verification', async () => {
      // This test would require a full document verification flow
      // For now, we test the endpoint structure
      const response = await request(app)
        .post('/api/verify/document')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          extractedData: {
            importerName: 'Test Company',
            importerTpin: '1234567890',
            invoiceAmount: 50000
          }
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.verificationResult).toBeDefined();
    });
  });
});
