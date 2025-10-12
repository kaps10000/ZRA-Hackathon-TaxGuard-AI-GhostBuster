const logger = require('../utils/logger');

/**
 * Database Configuration Module
 * PostgreSQL (Sequelize) - Shared Database with Module Schemas
 */

let dbConnection = null;

/**
 * PostgreSQL Connection using Sequelize
 * Single database with schema-based module separation
 */
async function connectPostgreSQL() {
  const { Sequelize } = require('sequelize');

  try {
    const sequelize = new Sequelize(
      process.env.DB_NAME || 'zra_taxguard',
      process.env.DB_USER || 'postgres',
      process.env.DB_PASSWORD || 'postgres',
      {
        host: process.env.DB_HOST || 'localhost',
        port: process.env.DB_PORT || 5432,
        dialect: 'postgres',
        logging: process.env.NODE_ENV === 'development' ? (msg) => logger.debug(msg) : false,
        pool: {
          max: 10,
          min: 2,
          acquire: 30000,
          idle: 10000
        },
        dialectOptions: {
          connectTimeout: 10000,
          statement_timeout: 30000
        },
        define: {
          timestamps: true,
          underscored: true,
          freezeTableName: true
        }
      }
    );

    // Test connection
    await sequelize.authenticate();

    logger.info('✅ PostgreSQL connected successfully', {
      host: process.env.DB_HOST || 'localhost',
      database: process.env.DB_NAME || 'zra_taxguard',
      port: process.env.DB_PORT || 5432
    });

    dbConnection = sequelize;
    return sequelize;
  } catch (error) {
    logger.error('❌ PostgreSQL connection failed:', error);
    throw error;
  }
}

/**
 * Connect to database (PostgreSQL only)
 */
async function connectDatabase() {
  try {
    logger.info('🔌 Connecting to PostgreSQL database...');
    return await connectPostgreSQL();
  } catch (error) {
    logger.error('❌ Database connection failed:', error);
    throw error;
  }
}

/**
 * Test database connectivity
 */
async function testConnection() {
  try {
    if (!dbConnection) {
      await connectDatabase();
    }

    // Test PostgreSQL (Sequelize)
    await dbConnection.authenticate();
    return true;
  } catch (error) {
    logger.error('Database connection test failed:', error);
    return false;
  }
}

/**
 * Get current database connection
 */
function getConnection() {
  return dbConnection;
}

/**
 * Close database connection gracefully
 */
async function closeConnection() {
  try {
    if (!dbConnection) {
      return;
    }

    // Close PostgreSQL
    await dbConnection.close();
    logger.info('PostgreSQL connection closed');

    dbConnection = null;
  } catch (error) {
    logger.error('Error closing database connection:', error);
    throw error;
  }
}

module.exports = {
  connectDatabase,
  connectPostgreSQL,
  testConnection,
  getConnection,
  closeConnection
};
