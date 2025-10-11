const Report = require('../../src/models/Report');
const db = require('../../src/config/database');

describe('Report Model', () => {
  describe('generateCaseId()', () => {
    it('should generate a valid case ID with format ZRA-YYYY-XXXXXX', () => {
      const caseId = Report.generateCaseId();
      expect(caseId).toMatch(/^ZRA-\d{4}-[A-F0-9]{6}$/);
    });

    it('should include current year in case ID', () => {
      const caseId = Report.generateCaseId();
      const currentYear = new Date().getFullYear();
      expect(caseId).toContain(`ZRA-${currentYear}-`);
    });

    it('should generate unique case IDs', () => {
      const ids = new Set();
      for (let i = 0; i < 100; i++) {
        ids.add(Report.generateCaseId());
      }
      expect(ids.size).toBe(100); // All should be unique
    });
  });

  describe('create()', () => {
    it('should create a report with encrypted payload', async () => {
      const reportData = {
        category: 'tax_evasion',
        title: 'Test Tax Evasion Report',
        description: 'This is a detailed description of tax evasion activities that must be at least 50 characters long.',
        priority: 'high'
      };

      const metadata = {
        ip_hash: 'test_hash_123',
        user_agent_hash: 'test_ua_456'
      };

      const report = await Report.create(reportData, metadata);

      expect(report).toHaveProperty('case_id');
      expect(report).toHaveProperty('id');
      expect(report.case_id).toMatch(/^ZRA-\d{4}-[A-F0-9]{6}$/);
      expect(report.category).toBe('tax_evasion');
      expect(report.status).toBe('pending');
      expect(report.priority).toBe('high');
      expect(report).toHaveProperty('metadata_hash');
      expect(report).toHaveProperty('created_at');
    });

    it('should set default priority to medium', async () => {
      const reportData = {
        category: 'fraud',
        title: 'Fraud Report Without Priority',
        description: 'This report does not specify a priority level and should default to medium priority.'
      };

      const report = await Report.create(reportData, {});
      expect(report.priority).toBe('medium');
    });

    it('should create metadata hash for blockchain', async () => {
      const reportData = {
        category: 'corruption',
        title: 'Corruption Case Report',
        description: 'Detailed corruption case that requires blockchain verification and immutable proof.'
      };

      const report = await Report.create(reportData, {});
      expect(report.metadata_hash).toBeTruthy();
      expect(report.metadata_hash).toHaveLength(64); // SHA-256 produces 64 hex chars
    });

    it('should create audit log entry', async () => {
      const reportData = {
        category: 'bribery',
        title: 'Bribery Incident Report',
        description: 'This bribery case involves government officials and requires investigation immediately.'
      };

      const report = await Report.create(reportData, { ip_hash: 'test_ip' });

      // Check audit log was created
      const auditLogs = await db('audit_logs')
        .where({ action: 'report_created', target_id: report.id })
        .first();

      expect(auditLogs).toBeTruthy();
      expect(auditLogs.actor_type).toBe('anonymous');
      expect(auditLogs.target_type).toBe('report');
    });
  });

  describe('findByCaseId()', () => {
    let testReport;

    beforeEach(async () => {
      testReport = await global.testHelpers.createTestReport();
    });

    it('should find report by valid case ID', async () => {
      const report = await Report.findByCaseId(testReport.case_id);

      expect(report).toBeTruthy();
      expect(report.case_id).toBe(testReport.case_id);
      expect(report.category).toBe('tax_evasion');
    });

    it('should return null for non-existent case ID', async () => {
      const report = await Report.findByCaseId('ZRA-2025-NONEXIST');
      expect(report).toBeNull();
    });

    it('should decrypt payload when investigator ID provided', async () => {
      const investigator = await global.testHelpers.createTestInvestigator();
      const report = await Report.findByCaseId(testReport.case_id, investigator.id);

      expect(report.payload).toBeTruthy();
      expect(report.payload).toHaveProperty('title');
      expect(report.payload).toHaveProperty('description');
      expect(report.payload.title).toBe('Test Report - Tax Evasion');
    });

    it('should create audit log when investigator views report', async () => {
      const investigator = await global.testHelpers.createTestInvestigator();
      await Report.findByCaseId(testReport.case_id, investigator.id);

      const auditLog = await db('audit_logs')
        .where({
          action: 'report_viewed',
          actor_id: investigator.id,
          target_type: 'report'
        })
        .first();

      expect(auditLog).toBeTruthy();
      expect(auditLog.actor_type).toBe('investigator');
    });
  });

  describe('list()', () => {
    beforeEach(async () => {
      // Create multiple test reports
      await global.testHelpers.createTestReport({ category: 'tax_evasion', priority: 'high' });
      await global.testHelpers.createTestReport({ category: 'fraud', priority: 'medium' });
      await global.testHelpers.createTestReport({ category: 'corruption', priority: 'low' });
    });

    it('should list all reports with default pagination', async () => {
      const result = await Report.list({});

      expect(result.reports).toHaveLength(3);
      expect(result.pagination.total).toBe(3);
      expect(result.pagination.page).toBe(1);
      expect(result.pagination.limit).toBe(20);
    });

    it('should filter reports by status', async () => {
      const result = await Report.list({ status: 'pending' });

      expect(result.reports).toHaveLength(3);
      result.reports.forEach(report => {
        expect(report.status).toBe('pending');
      });
    });

    it('should filter reports by category', async () => {
      const result = await Report.list({ category: 'fraud' });

      expect(result.reports).toHaveLength(1);
      expect(result.reports[0].category).toBe('fraud');
    });

    it('should filter reports by priority', async () => {
      const result = await Report.list({ priority: 'high' });

      expect(result.reports).toHaveLength(1);
      expect(result.reports[0].priority).toBe('high');
    });

    it('should paginate results correctly', async () => {
      const page1 = await Report.list({ page: 1, limit: 2 });
      expect(page1.reports).toHaveLength(2);
      expect(page1.pagination.pages).toBe(2);

      const page2 = await Report.list({ page: 2, limit: 2 });
      expect(page2.reports).toHaveLength(1);
    });

    it('should order reports by created_at descending', async () => {
      const result = await Report.list({});

      for (let i = 1; i < result.reports.length; i++) {
        const prev = new Date(result.reports[i - 1].created_at);
        const curr = new Date(result.reports[i].created_at);
        expect(prev.getTime()).toBeGreaterThanOrEqual(curr.getTime());
      }
    });
  });

  describe('updateStatus()', () => {
    let testReport, investigator;

    beforeEach(async () => {
      testReport = await global.testHelpers.createTestReport();
      investigator = await global.testHelpers.createTestInvestigator();
    });

    it('should update report status successfully', async () => {
      const updated = await Report.updateStatus(
        testReport.case_id,
        'under_review',
        investigator.id,
        'Starting investigation'
      );

      expect(updated.status).toBe('under_review');
      expect(updated.case_id).toBe(testReport.case_id);
    });

    it('should create audit log for status change', async () => {
      await Report.updateStatus(
        testReport.case_id,
        'investigating',
        investigator.id
      );

      const auditLog = await db('audit_logs')
        .where({
          action: 'status_changed',
          actor_id: investigator.id
        })
        .first();

      expect(auditLog).toBeTruthy();
      expect(auditLog.metadata).toBeTruthy();
    });

    it('should throw error for non-existent report', async () => {
      await expect(
        Report.updateStatus('ZRA-2025-FAKE123', 'closed', investigator.id)
      ).rejects.toThrow('Report not found');
    });

    it('should update updated_at timestamp', async () => {
      const originalTime = new Date(testReport.created_at);

      // Wait a moment to ensure timestamp difference
      await new Promise(resolve => setTimeout(resolve, 100));

      const updated = await Report.updateStatus(
        testReport.case_id,
        'closed',
        investigator.id
      );

      const updatedTime = new Date(updated.updated_at);
      expect(updatedTime.getTime()).toBeGreaterThan(originalTime.getTime());
    });
  });

  describe('Database Integrity', () => {
    it('should enforce unique case_id constraint', async () => {
      const reportData = {
        category: 'fraud',
        title: 'Duplicate Case ID Test',
        description: 'Testing database constraints for unique case IDs to prevent duplicates.'
      };

      const report1 = await Report.create(reportData, {});

      // Try to insert with same case_id directly (bypassing model logic)
      await expect(
        db('reports').insert({
          case_id: report1.case_id,
          payload_encrypted: 'test',
          category: 'fraud',
          status: 'pending'
        })
      ).rejects.toThrow();
    });

    it('should require case_id field', async () => {
      await expect(
        db('reports').insert({
          payload_encrypted: 'test',
          category: 'fraud'
        })
      ).rejects.toThrow();
    });

    it('should require payload_encrypted field', async () => {
      await expect(
        db('reports').insert({
          case_id: 'ZRA-2025-TEST12',
          category: 'fraud'
        })
      ).rejects.toThrow();
    });

    it('should set default status to pending', async () => {
      const [report] = await db('reports')
        .insert({
          case_id: 'ZRA-2025-TEST99',
          payload_encrypted: 'encrypted_data',
          category: 'fraud'
        })
        .returning('*');

      expect(report.status).toBe('pending');
    });
  });
});
