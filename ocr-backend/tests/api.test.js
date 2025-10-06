const request = require('supertest');
const app = require('../server');

describe('API Endpoints', () => {
  let authToken;

  beforeAll(async () => {
    // Get auth token for protected routes
    const loginResponse = await request(app)
      .post('/api/auth/login')
      .send({
        username: 'zra_admin',
        password: 'password'
      });
    
    authToken = loginResponse.body.data.token;
  });

  describe('GET /healthcheck', () => {
    it('should return health status', async () => {
      const response = await request(app).get('/healthcheck');
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('ZRA OCR Backend is running');
    });
  });

  describe('GET /api', () => {
    it('should return API documentation', async () => {
      const response = await request(app).get('/api');
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.endpoints).toBeDefined();
    });
  });

  describe('Protected Routes', () => {
    it('should reject requests without auth token', async () => {
      const response = await request(app)
        .get('/api/results');
      
      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Access token required');
    });

    it('should accept requests with valid auth token', async () => {
      const response = await request(app)
        .get('/api/results')
        .set('Authorization', `Bearer ${authToken}`);
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
  });

  describe('Rate Limiting', () => {
    it('should apply rate limiting to API routes', async () => {
      // Make multiple requests quickly
      const requests = Array(5).fill().map(() => 
        request(app).get('/api')
      );
      
      const responses = await Promise.all(requests);
      
      // All should succeed (within rate limit)
      responses.forEach(response => {
        expect(response.status).toBe(200);
      });
    });
  });

  describe('CORS Headers', () => {
    it('should include CORS headers', async () => {
      const response = await request(app)
        .get('/healthcheck')
        .set('Origin', 'http://localhost:3001');
      
      expect(response.headers['access-control-allow-origin']).toBeDefined();
    });
  });
});
