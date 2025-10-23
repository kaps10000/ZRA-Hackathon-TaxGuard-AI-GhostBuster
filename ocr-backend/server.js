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

// Database connection with retry logic
const { connectDatabase, getConnection } = require('./config/database');

async function connectWithRetry(retries = 5, delay = 5000) {
    for (let i = 0; i < retries; i++) {
        try {
            await connectDatabase();
            console.log('✅ Database connection established successfully');
            return true;
        } catch (err) {
            console.error(`❌ Unable to connect to database (attempt ${i + 1}/${retries}):`, err.message);
            if (i < retries - 1) {
                console.log(`⏳ Retrying in ${delay/1000} seconds...`);
                await new Promise(resolve => setTimeout(resolve, delay));
            }
        }
    }
    console.error('❌ Failed to connect to database after multiple attempts');
    return false;
}

// Initialize database connection and models
let models;
connectWithRetry().then(connected => {
    if (connected) {
        // Initialize models using the database module connection
        const { initializeModels } = require('./models');
        try {
            const sequelize = getConnection();
            models = initializeModels(sequelize);

            // Make models available globally
            app.locals.models = models;
            app.locals.sequelize = sequelize;
            console.log('✅ Models initialized successfully');
        } catch (err) {
            console.error('❌ Failed to initialize models:', err.message);
        }
    }
}).catch(err => {
    console.error('❌ Database connection failed:', err.message);
});

// =====================================================
// Routes
// =====================================================

// Health check endpoint
app.get('/health', async (req, res) => {
    try {
        const sequelize = getConnection();
        let dbStatus = 'disconnected';
        if (sequelize) {
            try {
                await sequelize.authenticate();
                dbStatus = 'connected';
            } catch (err) {
                dbStatus = 'error';
            }
        }

        res.json({
            status: 'healthy',
            service: 'ZRA TaxGuard OCR Backend',
            version: '1.0.0',
            timestamp: new Date().toISOString(),
            environment: process.env.NODE_ENV || 'development',
            database: dbStatus,
            services: {
                ocrAI: process.env.OCR_AI_SERVICE_URL || 'http://ocr-ai-service:8000',
                blockchain: process.env.BLOCKCHAIN_SERVICE_URL || 'http://blockchain-service:3001'
            }
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
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
