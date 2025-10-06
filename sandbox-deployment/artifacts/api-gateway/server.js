const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const eventRoutes = require('./routes/events');
const logger = require('./utils/logger');
const { errorHandler } = require('./middleware/errorHandler');

const app = express();
const PORT = process.env.PORT || 4000;

// Security middleware
app.use(helmet());
app.use(cors({
    origin: process.env.NODE_ENV === 'production' ? ['https://zra.gov.zm'] : true,
    credentials: true
}));

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: 'Too many requests from this IP, please try again later.'
});
app.use(limiter);

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Request logging
app.use((req, res, next) => {
    logger.info('API Request', {
        method: req.method,
        url: req.url,
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        timestamp: new Date().toISOString()
    });
    next();
});

// Health check
app.get('/health', (req, res) => {
    res.json({
        status: 'healthy',
        service: 'TaxGuard API Gateway',
        version: '1.0.0',
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
    });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api', eventRoutes);

// API documentation
app.get('/api-docs', (req, res) => {
    res.json({
        title: 'TaxGuard API Gateway',
        version: '1.0.0',
        description: 'Secure API Gateway for TaxGuard Blockchain System',
        endpoints: {
            'POST /api/auth/login': 'Authenticate user and get JWT token',
            'POST /api/auth/register': 'Register new user (admin only)',
            'POST /api/events': 'Submit new tax event (authenticated)',
            'GET /api/events/:id': 'Retrieve tax event by ID (auditor+)',
            'GET /api/events': 'List all events (auditor+)',
            'GET /health': 'Health check endpoint',
            'GET /api-docs': 'This documentation'
        },
        authentication: 'JWT Bearer Token required for protected endpoints',
        roles: ['taxpayer', 'auditor', 'admin']
    });
});

// 404 handler
app.use('*', (req, res) => {
    logger.warn('404 Not Found', {
        method: req.method,
        url: req.originalUrl,
        ip: req.ip
    });
    res.status(404).json({
        error: 'Endpoint not found',
        message: 'The requested resource does not exist',
        availableEndpoints: ['/health', '/api-docs', '/api/auth/login', '/api/events']
    });
});

// Error handling
app.use(errorHandler);

// Start server
app.listen(PORT, () => {
    logger.info('Server Started', {
        port: PORT,
        environment: process.env.NODE_ENV,
        timestamp: new Date().toISOString()
    });
    console.log(`🚀 TaxGuard API Gateway running on port ${PORT}`);
    console.log(`📚 API Documentation: http://localhost:${PORT}/api-docs`);
    console.log(`🏥 Health Check: http://localhost:${PORT}/health`);
});

module.exports = app;
