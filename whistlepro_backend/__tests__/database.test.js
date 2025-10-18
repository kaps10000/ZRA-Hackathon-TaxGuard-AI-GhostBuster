const db = require('../src/config/database');

describe('Database Integration Tests', () => {
  describe('Database Connection', () => {
    it('should connect to test database successfully', async () => {
      const result = await db.raw('SELECT 1+1 AS result');
      expect(result.rows[0].result).toBe(2);
    });

    it('should have all required tables', async () => {
      const tables = await db('information_schema.tables')
        .select('table_name')
        .where('table_schema', 'public')
        .whereIn('table_name', ['reports', 'investigators', 'audit_logs']);

      const tableNames = tables.map(t => t.table_name);
      expect(tableNames).toContain('reports');
      expect(tableNames).toContain('investigators');
      expect(tableNames).toContain('audit_logs');
    });
  });

  describe('Reports Table', () => {
    it('should have correct schema', async () => {
      const columns = await db('information_schema.columns')
        .select('column_name', 'data_type', 'is_nullable')
        .where({ table_name: 'reports', table_schema: 'public' });

      const columnNames = columns.map(c => c.column_name);
      expect(columnNames).toContain('id');
      expect(columnNames).toContain('case_id');
      expect(columnNames).toContain('payload_encrypted');
      expect(columnNames).toContain('category');
      expect(columnNames).toContain('status');
      expect(columnNames).toContain('priority');
      expect(columnNames).toContain('metadata_hash');
      expect(columnNames).toContain('created_at');
      expect(columnNames).toContain('updated_at');
    });

    it('should have unique case_id constraint', async () => {
      const constraints = await db.raw(`
        SELECT constraint_name, constraint_type
        FROM information_schema.table_constraints
        WHERE table_name = 'reports' AND constraint_type = 'UNIQUE'
      `);

      const uniqueConstraints = constraints.rows.map(r => r.constraint_name);
      const hasCaseIdUnique = uniqueConstraints.some(c => c.includes('case_id'));
      expect(hasCaseIdUnique).toBe(true);
    });

    it('should have indexes on important columns', async () => {
      const indexes = await db.raw(`
        SELECT indexname FROM pg_indexes WHERE tablename = 'reports'
      `);

      const indexNames = indexes.rows.map(r => r.indexname);
      expect(indexNames.some(i => i.includes('case_id'))).toBe(true);
      expect(indexNames.some(i => i.includes('status'))).toBe(true);
      expect(indexNames.some(i => i.includes('created_at'))).toBe(true);
    });
  });

  describe('Investigators Table', () => {
    it('should have correct schema', async () => {
      const columns = await db('information_schema.columns')
        .select('column_name')
        .where({ table_name: 'investigators', table_schema: 'public' });

      const columnNames = columns.map(c => c.column_name);
      expect(columnNames).toContain('id');
      expect(columnNames).toContain('email');
      expect(columnNames).toContain('password_hash');
      expect(columnNames).toContain('full_name');
      expect(columnNames).toContain('badge_number');
      expect(columnNames).toContain('role');
      expect(columnNames).toContain('department');
      expect(columnNames).toContain('is_active');
    });

    it('should have unique email constraint', async () => {
      const constraints = await db.raw(`
        SELECT constraint_name
        FROM information_schema.table_constraints
        WHERE table_name = 'investigators' AND constraint_type = 'UNIQUE'
      `);

      const uniqueConstraints = constraints.rows.map(r => r.constraint_name);
      const hasEmailUnique = uniqueConstraints.some(c => c.includes('email'));
      expect(hasEmailUnique).toBe(true);
    });
  });

  describe('Audit Logs Table', () => {
    it('should have correct schema', async () => {
      const columns = await db('information_schema.columns')
        .select('column_name')
        .where({ table_name: 'audit_logs', table_schema: 'public' });

      const columnNames = columns.map(c => c.column_name);
      expect(columnNames).toContain('id');
      expect(columnNames).toContain('actor_id');
      expect(columnNames).toContain('actor_type');
      expect(columnNames).toContain('action');
      expect(columnNames).toContain('target_type');
      expect(columnNames).toContain('target_id');
      expect(columnNames).toContain('ip_hash');
      expect(columnNames).toContain('metadata');
      expect(columnNames).toContain('created_at');
    });

    it('should have foreign key to investigators', async () => {
      const fkeys = await db.raw(`
        SELECT constraint_name
        FROM information_schema.table_constraints
        WHERE table_name = 'audit_logs' AND constraint_type = 'FOREIGN KEY'
      `);

      expect(fkeys.rows.length).toBeGreaterThan(0);
    });
  });

  describe('Data Operations', () => {
    it('should insert and query reports', async () => {
      const [report] = await db('reports')
        .insert({
          case_id: 'ZRA-2025-TEST01',
          payload_encrypted: 'test_encrypted_data',
          category: 'tax_evasion',
          status: 'pending',
          priority: 'medium'
        })
        .returning('*');

      expect(report.case_id).toBe('ZRA-2025-TEST01');
      expect(report.category).toBe('tax_evasion');

      const found = await db('reports')
        .where('case_id', 'ZRA-2025-TEST01')
        .first();

      expect(found).toBeTruthy();
      expect(found.id).toBe(report.id);
    });

    it('should update reports', async () => {
      const [report] = await db('reports')
        .insert({
          case_id: 'ZRA-2025-UPDATE01',
          payload_encrypted: 'data',
          category: 'fraud'
        })
        .returning('*');

      await db('reports')
        .where('id', report.id)
        .update({ status: 'investigating' });

      const updated = await db('reports').where('id', report.id).first();
      expect(updated.status).toBe('investigating');
    });

    it('should delete reports', async () => {
      const [report] = await db('reports')
        .insert({
          case_id: 'ZRA-2025-DELETE01',
          payload_encrypted: 'data',
          category: 'corruption'
        })
        .returning('*');

      await db('reports').where('id', report.id).del();

      const deleted = await db('reports').where('id', report.id).first();
      expect(deleted).toBeUndefined();
    });
  });

  describe('Transaction Support', () => {
    it('should support transactions', async () => {
      const trx = await db.transaction();

      try {
        await trx('reports').insert({
          case_id: 'ZRA-2025-TRX001',
          payload_encrypted: 'data',
          category: 'fraud'
        });

        await trx.rollback();

        const report = await db('reports')
          .where('case_id', 'ZRA-2025-TRX001')
          .first();

        expect(report).toBeUndefined(); // Should be rolled back
      } catch (error) {
        await trx.rollback();
        throw error;
      }
    });

    it('should commit transactions', async () => {
      const trx = await db.transaction();

      try {
        await trx('reports').insert({
          case_id: 'ZRA-2025-TRX002',
          payload_encrypted: 'data',
          category: 'fraud'
        });

        await trx.commit();

        const report = await db('reports')
          .where('case_id', 'ZRA-2025-TRX002')
          .first();

        expect(report).toBeTruthy(); // Should be committed
      } catch (error) {
        await trx.rollback();
        throw error;
      }
    });
  });
});
