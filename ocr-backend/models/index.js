/**
 * Models Index - Centralized Model Exports
 * Initializes all Sequelize models with database connection
 */

const { getConnection } = require('../config/database');
const defineDocumentSecurityModel = require('./DocumentSecurity');

// Models cache
let models = null;

/**
 * Initialize all models with Sequelize connection
 * @param {Sequelize} sequelize - Sequelize instance
 * @returns {Object} - Object containing all models
 */
function initializeModels(sequelize) {
    if (models) {
        return models; // Return cached models if already initialized
    }

    if (!sequelize) {
        sequelize = getConnection();
    }

    if (!sequelize) {
        throw new Error('Database connection not initialized. Call connectDatabase() first.');
    }

    // Initialize models
    const DocumentSecurity = defineDocumentSecurityModel(sequelize);

    // Store models
    models = {
        DocumentSecurity,
        sequelize
    };

    return models;
}

/**
 * Get initialized models
 * @returns {Object} - Models object
 */
function getModels() {
    if (!models) {
        throw new Error('Models not initialized. Call initializeModels() first.');
    }
    return models;
}

/**
 * Security Audit Log Model (Dynamic Query)
 * Since this doesn't have a Sequelize model yet, we'll use raw queries
 */
async function SecurityAuditLog() {
    const { sequelize } = getModels();
    return sequelize;
}

/**
 * Anomaly Detection Model (Dynamic Query)
 * Since this doesn't have a Sequelize model yet, we'll use raw queries
 */
async function AnomalyDetection() {
    const { sequelize } = getModels();
    return sequelize;
}

module.exports = {
    initializeModels,
    getModels,
    SecurityAuditLog,
    AnomalyDetection
};
