// Test setup - runs before all tests
require('dotenv').config({ path: '.env.test' });
const db = require('../src/config/database');

// Global test timeout
jest.setTimeout(10000);

// Setup database before all tests
beforeAll(async () => {
  try {
    // Run migrations
    await db.migrate.latest();
    console.log('✅ Test database migrations completed');
  } catch (error) {
    console.error('❌ Test database setup failed:', error);
    throw error;
  }
});

// Clean up database after each test
afterEach(async () => {
  try {
    // Clean all tables except knex migrations
    await db('audit_logs').del();
    await db('reports').del();
    await db('investigators').del();
  } catch (error) {
    console.error('Warning: Failed to clean test database:', error.message);
  }
});

// Teardown database after all tests
afterAll(async () => {
  try {
    await db.destroy();
    console.log('✅ Test database connection closed');
  } catch (error) {
    console.error('Warning: Failed to close database connection:', error.message);
  }
});

// Global test helpers
global.testHelpers = {
  createTestInvestigator: async () => {
    const bcrypt = require('bcryptjs');
    const passwordHash = await bcrypt.hash('test123', 10);

    const [investigator] = await db('investigators')
      .insert({
        email: 'test@zra.gov.zm',
        password_hash: passwordHash,
        full_name: 'Test Investigator',
        badge_number: 'TEST001',
        role: 'investigator',
        department: 'tax_evasion',
        is_active: true
      })
      .returning('*');

    return investigator;
  },

  createTestReport: async (reportData = {}) => {
    const Report = require('../src/models/Report');

    const defaultData = {
      category: 'tax_evasion',
      title: 'Test Report - Tax Evasion',
      description: 'This is a test report for unit testing purposes. It contains at least 50 characters as required.',
      priority: 'medium',
      ...reportData
    };

    return await Report.create(defaultData, {
      ip_hash: 'test_hash_123',
      user_agent_hash: 'test_ua_hash'
    });
  },

  generateJWT: (investigator) => {
    const { generateToken } = require('../src/middleware/auth');
    return generateToken(investigator);
  }
};
