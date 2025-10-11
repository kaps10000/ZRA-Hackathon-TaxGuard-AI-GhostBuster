/**
 * ZRA TaxGuard OCR Backend - Main Server
 * Node.js + Express backend for OCR document verification
 * Integrates with PostgreSQL, OCR AI Service, and Blockchain
 */

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
require('dotenv').config();

// =====================================================
// Express App Initialization
// =====================================================

const app = express();
const PORT = process.env.PORT || 5000;

// =====================================================
// Middleware
// =====================================================

// Security
app.use(helmet());

// CORS
const corsOptions = {
    origin: process.env.ALLOWED_ORIGINS
        ? process.env.ALLOWED_ORIGINS.split(',')
        : ['http://localhost:3000', 'http://localhost:8080'],
    credentials: true
};
app.use(cors(corsOptions));

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging
if (process.env.NODE_ENV === 'production') {
    app.use(morgan('combined'));
} else {
    app.use(morgan('dev'));
}

// =====================================================
// Database Connection
// =====================================================

const { Sequelize } = require('sequelize');

const sequelize = new Sequelize({
    dialect: 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'zra_taxguard',
    username: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'zrapassword',
    logging: process.env.NODE_ENV !== 'production' ? console.log : false,
    pool: {
        max: 5,
        min: 0,
        acquire: 30000,
        idle: 10000
    }
});

// Test database connection
sequelize.authenticate()
    .then(() => {
        console.log('✅ Database connection established successfully');
    })
    .catch(err => {
        console.error('❌ Unable to connect to database:', err.message);
    });

// Initialize models
const { initializeModels } = require('./models');
const models = initializeModels(sequelize);

// Make models available globally
app.locals.models = models;
app.locals.sequelize = sequelize;

// =====================================================
// Routes
// =====================================================

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({
        status: 'healthy',
        service: 'ZRA TaxGuard OCR Backend',
        version: '1.0.0',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development',
        database: sequelize.authenticate() ? 'connected' : 'disconnected',
        services: {
            ocrAI: process.env.OCR_AI_SERVICE_URL || 'http://ocr-ai-service:8000',
            blockchain: process.env.BLOCKCHAIN_SERVICE_URL || 'http://blockchain-service:3001'
        }
    });
});

// Root endpoint
app.get('/', (req, res) => {
    res.json({
        service: 'ZRA TaxGuard OCR Backend',
        version: '1.0.0',
        endpoints: {
            health: '/health',
            security: '/api/security/*',
            documentation: 'See TESTING_GUIDE.md'
        },
        status: 'operational'
    });
});

// Security routes
try {
    const securityRoutes = require('./routes/security');
    app.use('/api/security', securityRoutes);
    console.log('✅ Security routes loaded');
} catch (err) {
    console.warn('⚠️  Security routes not available:', err.message);
}

// Upload endpoint (simple version)
app.post('/api/upload', (req, res) => {
    res.json({
        success: true,
        message: 'Upload endpoint - implementation in progress',
        documentId: 'TEST-DOC-' + Date.now()
    });
});

// Document scan endpoint (simple version)
app.post('/api/documents/:id/scan', (req, res) => {
    const { id } = req.params;
    res.json({
        success: true,
        message: `Scan triggered for document ${id}`,
        documentId: id,
        status: 'processing'
    });
});

// =====================================================
// Error Handling
// =====================================================

// 404 handler
app.use((req, res) => {
    res.status(404).json({
        error: 'Not Found',
        message: `Cannot ${req.method} ${req.path}`,
        availableEndpoints: {
            health: 'GET /health',
            root: 'GET /',
            security: 'GET /api/security/*'
        }
    });
});

// Global error handler
app.use((err, req, res, next) => {
    console.error('Error:', err.message);
    console.error(err.stack);

    res.status(err.status || 500).json({
        error: err.message || 'Internal Server Error',
        ...(process.env.NODE_ENV !== 'production' && { stack: err.stack })
    });
});

// =====================================================
// Server Start
// =====================================================

const server = app.listen(PORT, '0.0.0.0', () => {
    console.log('');
    console.log('🚀 ===================================');
    console.log(`   ZRA TaxGuard OCR Backend`);
    console.log('   ===================================');
    console.log(`   Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`   Port: ${PORT}`);
    console.log(`   Database: ${process.env.DB_HOST || 'localhost'}:${process.env.DB_PORT || 5432}`);
    console.log(`   OCR AI: ${process.env.OCR_AI_SERVICE_URL || 'http://ocr-ai-service:8000'}`);
    console.log(`   Blockchain: ${process.env.BLOCKCHAIN_SERVICE_URL || 'http://blockchain-service:3001'}`);
    console.log('   ===================================');
    console.log(`   Server running at http://0.0.0.0:${PORT}`);
    console.log('   Press Ctrl+C to stop');
    console.log('   ===================================');
    console.log('');
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('SIGTERM received, closing server gracefully...');
    server.close(() => {
        console.log('Server closed');
        sequelize.close();
        process.exit(0);
    });
});

process.on('SIGINT', () => {
    console.log('\nSIGINT received, closing server gracefully...');
    server.close(() => {
        console.log('Server closed');
        sequelize.close();
        process.exit(0);
    });
});

module.exports = app;
