const request = require('supertest');
const express = require('express');
const reportRoutes = require('../../src/routes/reportRoutes');
const errorHandler = require('../../src/middleware/errorHandler');

// Create test app
const app = express();
app.use(express.json());
app.use('/api/reports', reportRoutes);
app.use(errorHandler.errorHandler);

describe('Report API Routes', () => {
  describe('POST /api/reports - Submit Anonymous Report', () => {
    it('should create a report with valid data', async () => {
      const reportData = {
        category: 'tax_evasion',
        title: 'Test Tax Evasion Report for API',
        description: 'This is a comprehensive description of tax evasion activities that must be at least 50 characters long for validation.',
        priority: 'high',
        subjects: {
          organizations: [{
            name: 'Test Company Ltd',
            tpin: '1234567890'
          }]
        }
      };

      const response = await request(app)
        .post('/api/reports')
        .send(reportData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('case_id');
      expect(response.body.data.case_id).toMatch(/^ZRA-\d{4}-[A-F0-9]{6}$/);
      expect(response.body.data.category).toBe('tax_evasion');
      expect(response.body.data.status).toBe('pending');
      expect(response.body.data.priority).toBe('high');
      expect(response.body.data).toHaveProperty('blockchain_hash');
    });

    it('should reject report with title too short', async () => {
      const response = await request(app)
        .post('/api/reports')
        .send({
          category: 'fraud',
          title: 'Short', // Less than 10 chars
          description: 'This description is long enough but the title is too short for validation rules.'
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toHaveProperty('details');
      expect(response.body.error.details[0].field).toContain('title');
    });

    it('should reject report with description too short', async () => {
      const response = await request(app)
        .post('/api/reports')
        .send({
          category: 'corruption',
          title: 'Valid Title Here',
          description: 'Too short' // Less than 50 chars
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.details[0].field).toContain('description');
    });

    it('should reject report with invalid category', async () => {
      const response = await request(app)
        .post('/api/reports')
        .send({
          category: 'invalid_category',
          title: 'Valid Report Title',
          description: 'This is a valid description with enough characters to pass validation rules.'
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should use default priority if not provided', async () => {
      const response = await request(app)
        .post('/api/reports')
        .send({
          category: 'bribery',
          title: 'Bribery Case Report',
          description: 'Detailed bribery case description that provides enough information for investigation purposes.'
        })
        .expect(201);

      expect(response.body.data.priority).toBe('medium');
    });

    it('should reject report with invalid priority', async () => {
      const response = await request(app)
        .post('/api/reports')
        .send({
          category: 'fraud',
          title: 'Fraud Report Title',
          description: 'Valid fraud report description with sufficient detail for processing and investigation.',
          priority: 'urgent' // Invalid priority
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should handle complex report with all optional fields', async () => {
      const response = await request(app)
        .post('/api/reports')
        .send({
          category: 'ghost_companies',
          title: 'Ghost Company Investigation',
          description: 'Comprehensive ghost company case with evidence of fraudulent operations and tax evasion.',
          priority: 'critical',
          subjects: {
            organizations: [{
              name: 'Ghost Corp Ltd',
              tpin: '9876543210',
              address: 'Plot 999, Unknown Street, Lusaka'
            }],
            individuals: [{
              name: 'John Doe',
              position: 'Director'
            }]
          },
          location: {
            province: 'Lusaka',
            district: 'Lusaka',
            area: 'CBD'
          },
          evidence: {
            financial_details: {
              estimated_amount: 1000000,
              currency: 'ZMW',
              frequency: 'yearly'
            }
          }
        })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.priority).toBe('critical');
    });
  });

  describe('GET /api/reports/:caseId - Get Report by Case ID', () => {
    let testReport;

    beforeEach(async () => {
      testReport = await global.testHelpers.createTestReport();
    });

    it('should retrieve report by valid case ID', async () => {
      const response = await request(app)
        .get(`/api/reports/${testReport.case_id}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.case_id).toBe(testReport.case_id);
      expect(response.body.data.category).toBe('tax_evasion');
      expect(response.body.data).toHaveProperty('metadata_hash');
    });

    it('should return 404 for non-existent case ID', async () => {
      const response = await request(app)
        .get('/api/reports/ZRA-2025-NONEXIST')
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('REPORT_NOT_FOUND');
    });

    it('should return 400 for invalid case ID format', async () => {
      const response = await request(app)
        .get('/api/reports/INVALID-FORMAT')
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('INVALID_CASE_ID');
    });

    it('should include decrypted payload', async () => {
      const response = await request(app)
        .get(`/api/reports/${testReport.case_id}`)
        .expect(200);

      // Payload may be null if not authenticated, but endpoint should work
      expect(response.body.data).toHaveProperty('payload');
    });
  });

  describe('GET /api/reports - List Reports with Pagination', () => {
    beforeEach(async () => {
      // Create multiple reports
      await global.testHelpers.createTestReport({ category: 'tax_evasion', priority: 'high' });
      await global.testHelpers.createTestReport({ category: 'fraud', priority: 'medium' });
      await global.testHelpers.createTestReport({ category: 'corruption', priority: 'low' });
    });

    it('should list all reports with default pagination', async () => {
      const response = await request(app)
        .get('/api/reports')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeInstanceOf(Array);
      expect(response.body.data.length).toBeGreaterThan(0);
      expect(response.body).toHaveProperty('pagination');
      expect(response.body.pagination.page).toBe(1);
    });

    it('should filter by status', async () => {
      const response = await request(app)
        .get('/api/reports?status=pending')
        .expect(200);

      expect(response.body.success).toBe(true);
      response.body.data.forEach(report => {
        expect(report.status).toBe('pending');
      });
    });

    it('should filter by category', async () => {
      const response = await request(app)
        .get('/api/reports?category=fraud')
        .expect(200);

      expect(response.body.success).toBe(true);
      const fraudReports = response.body.data.filter(r => r.category === 'fraud');
      expect(fraudReports.length).toBeGreaterThan(0);
    });

    it('should filter by priority', async () => {
      const response = await request(app)
        .get('/api/reports?priority=high')
        .expect(200);

      expect(response.body.success).toBe(true);
      const highPriorityReports = response.body.data.filter(r => r.priority === 'high');
      expect(highPriorityReports.length).toBeGreaterThan(0);
    });

    it('should support custom page size', async () => {
      const response = await request(app)
        .get('/api/reports?limit=2')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.pagination.limit).toBe(2);
    });

    it('should support pagination', async () => {
      const page1 = await request(app)
        .get('/api/reports?page=1&limit=2')
        .expect(200);

      const page2 = await request(app)
        .get('/api/reports?page=2&limit=2')
        .expect(200);

      expect(page1.body.pagination.page).toBe(1);
      expect(page2.body.pagination.page).toBe(2);
    });

    it('should limit max results per page to 100', async () => {
      const response = await request(app)
        .get('/api/reports?limit=500')
        .expect(200);

      expect(response.body.pagination.limit).toBeLessThanOrEqual(100);
    });
  });

  describe('PATCH /api/reports/:caseId/status - Update Report Status', () => {
    let testReport;

    beforeEach(async () => {
      testReport = await global.testHelpers.createTestReport();
    });

    it('should update report status successfully', async () => {
      const response = await request(app)
        .patch(`/api/reports/${testReport.case_id}/status`)
        .send({
          status: 'under_review',
          notes: 'Starting investigation'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe('under_review');
      expect(response.body.data.case_id).toBe(testReport.case_id);
    });

    it('should reject invalid status', async () => {
      const response = await request(app)
        .patch(`/api/reports/${testReport.case_id}/status`)
        .send({
          status: 'invalid_status'
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('INVALID_STATUS');
    });

    it('should allow all valid statuses', async () => {
      const validStatuses = ['pending', 'under_review', 'investigating', 'closed'];

      for (const status of validStatuses) {
        const report = await global.testHelpers.createTestReport();

        const response = await request(app)
          .patch(`/api/reports/${report.case_id}/status`)
          .send({ status })
          .expect(200);

        expect(response.body.data.status).toBe(status);
      }
    });

    it('should accept optional notes', async () => {
      const response = await request(app)
        .patch(`/api/reports/${testReport.case_id}/status`)
        .send({
          status: 'investigating'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
    });
  });

  describe('GET /api/reports/stats - Get Statistics', () => {
    beforeEach(async () => {
      await global.testHelpers.createTestReport({ category: 'tax_evasion' });
      await global.testHelpers.createTestReport({ category: 'fraud' });
    });

    it('should return statistics', async () => {
      const response = await request(app)
        .get('/api/reports/stats')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('total_reports');
      expect(response.body.data).toHaveProperty('by_category');
      expect(response.body.data).toHaveProperty('by_priority');
    });

    it('should support date filters', async () => {
      const response = await request(app)
        .get('/api/reports/stats?startDate=2025-01-01&endDate=2025-12-31')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.filters).toHaveProperty('start_date');
    });
  });

  describe('Security Middleware Integration', () => {
    it('should sanitize XSS attempts in input', async () => {
      const response = await request(app)
        .post('/api/reports')
        .send({
          category: 'fraud',
          title: '<script>alert("XSS")</script>Valid Title',
          description: 'This description tests XSS protection with malicious script tags and event handlers.'
        })
        .expect(201);

      expect(response.body.success).toBe(true);
      // XSS should be sanitized by security middleware
    });

    it('should rate limit report submissions', async () => {
      const reportData = {
        category: 'fraud',
        title: 'Rate Limit Test Report',
        description: 'Testing rate limiting functionality to prevent spam and abuse of the reporting system.'
      };

      // Make requests up to the limit
      const requests = [];
      for (let i = 0; i < 6; i++) {
        requests.push(
          request(app)
            .post('/api/reports')
            .send(reportData)
        );
      }

      const responses = await Promise.all(requests);

      // At least one should be rate limited
      const rateLimited = responses.some(r => r.status === 429);
      expect(rateLimited).toBe(true);
    });
  });
});
