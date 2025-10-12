const { connectDatabase, getConnection } = require('./database');
const logger = require('../utils/logger');

/**
 * Initialize PostgreSQL Database
 * Creates schemas and syncs all models
 */

async function initializeDatabase() {
  try {
    logger.info('🔧 Initializing PostgreSQL database...');

    // Connect to database
    const sequelize = await connectDatabase();

    // Create schemas if they don't exist
    await sequelize.query('CREATE SCHEMA IF NOT EXISTS ocr');
    await sequelize.query('CREATE SCHEMA IF NOT EXISTS ghostbuster');
    await sequelize.query('CREATE SCHEMA IF NOT EXISTS risk');
    await sequelize.query('CREATE SCHEMA IF NOT EXISTS compliance');
    await sequelize.query('CREATE SCHEMA IF NOT EXISTS audit');
    await sequelize.query('CREATE SCHEMA IF NOT EXISTS whistlepro');
    await sequelize.query('CREATE SCHEMA IF NOT EXISTS blockchain');

    logger.info('✅ Database schemas created successfully');

    // Import and sync OCR models
    const getDocumentModel = require('../models/DocumentSequelize');
    const Document = getDocumentModel();

    // Sync models (create tables)
    await Document.sync({ alter: true }); // alter: true updates existing tables

    logger.info('✅ Database tables synced successfully');

    // Create indexes
    logger.info('📊 Creating database indexes...');
    await sequelize.query(`
      CREATE INDEX IF NOT EXISTS idx_documents_status_uploaded
      ON ocr.documents(status, uploaded_at DESC);
    `);
    await sequelize.query(`
      CREATE INDEX IF NOT EXISTS idx_documents_verification_status
      ON ocr.documents(verification_status);
    `);
    await sequelize.query(`
      CREATE INDEX IF NOT EXISTS idx_documents_metadata_gin
      ON ocr.documents USING gin(metadata jsonb_path_ops);
    `);

    logger.info('✅ Database indexes created successfully');

    logger.info('🎉 Database initialization completed');

    return sequelize;
  } catch (error) {
    logger.error('❌ Database initialization failed:', error);
    throw error;
  }
}

// Run if called directly
if (require.main === module) {
  initializeDatabase()
    .then(() => {
      logger.info('Database initialization script completed');
      process.exit(0);
    })
    .catch((error) => {
      logger.error('Database initialization script failed:', error);
      process.exit(1);
    });
}

module.exports = { initializeDatabase };
