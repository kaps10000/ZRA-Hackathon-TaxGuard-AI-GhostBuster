const express = require('express');
const http = require('http');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const { blockchain } = require('../scripts/add-sample-events');
const monitoring = require('./monitoring');
const { validateEvent, rateLimiter, securityHeaders } = require('./validation');
const { initWebSocket, broadcastEvent, broadcastBlockchainUpdate } = require('./websocket');
const { EventEncryption, authenticateApiKey } = require('./encryption');
const { swaggerUi, specs } = require('./swagger');

const app = express();
const server = http.createServer(app);

// Initialize WebSocket
const io = initWebSocket(server);

app.use(express.json());
app.use(securityHeaders);
app.use(rateLimiter);

const PORT = process.env.PORT || 3001;

// Serve blockchain explorer
app.use('/explorer', express.static(path.join(__dirname, '../explorer')));

// Swagger documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs));

// Add monitoring routes
app.use('/api/monitoring', monitoring);

// Add new feature routes
const statistics = require('./statistics');
const siemExport = require('./siem-export');
const verification = require('./verification');
const templates = require('./templates');
const analyticsEngine = require('./analytics-engine');
const complianceTriggers = require('./compliance-triggers');
const multisig = require('./multisig');
const realtimeDashboard = require('./realtime-dashboard');

app.use('/api/stats', statistics);
app.use('/api/siem', siemExport);
app.use('/api/verify', verification);
app.use('/api/templates', templates);
app.use('/api/analytics', analyticsEngine);
app.use('/api/triggers', complianceTriggers);
app.use('/api/multisig', multisig);
app.use('/api/dashboard', realtimeDashboard);

/**
 * @swagger
 * /health:
 *   get:
 *     summary: Health check endpoint
 *     responses:
 *       200:
 *         description: Service is healthy
 */
app.get('/health', (req, res) => {
    res.json({ 
        status: 'healthy', 
        service: 'TaxGuard Blockchain API',
        version: '1.0.0',
        blockchain: blockchain.getChainInfo(),
        features: ['WebSocket', 'Encryption', 'Multi-node', 'Explorer']
    });
});

/**
 * @swagger
 * /api/events:
 *   post:
 *     summary: Create a new tax event
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/TaxEvent'
 *     responses:
 *       201:
 *         description: Event created successfully
 */
app.post('/api/events', validateEvent, async (req, res) => {
    try {
        const { eventType, anonymizedUserId, hashOfPayload, notes } = req.body;
        
        const eventId = uuidv4();
        const timestamp = new Date().toISOString();
        
        // Create encrypted version for sensitive data
        const encryptedData = EventEncryption.encryptEventData({
            originalUserId: req.body.originalUserId || 'anonymous',
            sensitiveNotes: req.body.sensitiveNotes || ''
        });
        
        const event = blockchain.createEvent(
            eventId,
            eventType,
            timestamp,
            anonymizedUserId,
            hashOfPayload,
            notes
        );
        
        // Broadcast real-time update
        broadcastEvent(event);
        broadcastBlockchainUpdate(blockchain.getChainInfo());
        
        res.status(201).json({
            success: true,
            event,
            blockchain: blockchain.getChainInfo(),
            encrypted: encryptedData.hash // Only return hash, not encrypted data
        });
    } catch (error) {
        console.error('Error creating event:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * @swagger
 * /api/events/{id}:
 *   get:
 *     summary: Get a specific event by ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 */
app.get('/api/events/:id', async (req, res) => {
    try {
        const eventId = req.params.id;
        const event = blockchain.readEvent(eventId);
        
        if (!event) {
            return res.status(404).json({ error: 'Event not found' });
        }
        
        res.json({
            success: true,
            event
        });
    } catch (error) {
        console.error('Error reading event:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * @swagger
 * /api/events:
 *   get:
 *     summary: Get all blockchain events
 *     responses:
 *       200:
 *         description: List of all events
 */
app.get('/api/events', async (req, res) => {
    try {
        const events = blockchain.queryAllEvents();
        
        res.json({
            success: true,
            count: events.length,
            events,
            blockchain: blockchain.getChainInfo()
        });
    } catch (error) {
        console.error('Error querying events:', error);
        res.status(500).json({ error: error.message });
    }
});

// GET /api/blockchain - Get blockchain info
app.get('/api/blockchain', (req, res) => {
    res.json({
        success: true,
        blockchain: blockchain.getChainInfo(),
        chain: blockchain.chain.map(block => ({
            ...block,
            data: typeof block.data === 'object' ? block.data : 'Genesis Block'
        }))
    });
});

// Integration endpoints for other modules
app.post('/api/integration/whistlepro', async (req, res) => {
    try {
        const { reportId, reportHash } = req.body;
        
        const event = blockchain.createEvent(
            uuidv4(),
            'auditFlag',
            new Date().toISOString(),
            `whistlepro-${reportId}`,
            reportHash,
            'WhistlePro report submitted'
        );
        
        broadcastEvent(event);
        res.json({ success: true, event });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/integration/ai-risk', async (req, res) => {
    try {
        const { userId, riskScore, riskHash } = req.body;
        
        const event = blockchain.createEvent(
            uuidv4(),
            'auditFlag',
            new Date().toISOString(),
            userId,
            riskHash,
            `AI Risk Score: ${riskScore}`
        );
        
        broadcastEvent(event);
        res.json({ success: true, event });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Secure admin endpoints (require API key)
app.post('/api/admin/reset', authenticateApiKey, (req, res) => {
    // Reset blockchain (development only)
    blockchain.chain = [];
    blockchain.events.clear();
    blockchain.createGenesisBlock();
    
    res.json({ message: 'Blockchain reset successfully' });
});

// Error handling middleware
app.use((error, req, res, next) => {
    console.error('API Error:', error);
    res.status(500).json({
        error: 'Internal server error',
        message: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
    });
});

// Root endpoint
app.get('/', (req, res) => {
    res.json({
        service: 'TaxGuard Blockchain API',
        version: '1.0.0',
        status: 'running',
        endpoints: {
            'GET /health': 'Server health check',
            'GET /api/events': 'Get all tax events',
            'POST /api/events': 'Create new tax event',
            'GET /api/blockchain': 'Get full blockchain',
            'GET /api/stats': 'Comprehensive statistics & analytics',
            'GET /api/siem/export/{format}': 'Export events to SIEM (Splunk/ELK/Syslog/CSV)',
            'GET /api/verify/:eventId': 'Verify event integrity',
            'GET /api/templates': 'Tax event templates',
            'POST /api/analytics/risk-score': 'Calculate user risk score',
            'POST /api/analytics/pattern-detection': 'Detect suspicious patterns',
            'POST /api/triggers/evaluate': 'Evaluate compliance triggers',
            'POST /api/multisig/create': 'Create multi-signature event',
            'GET /api/dashboard/overview': 'Real-time monitoring dashboard',
            'GET /explorer': 'Blockchain explorer interface',
            'GET /api-docs': 'API documentation'
        },
        features: [
            'WebSocket Real-Time',
            'Multi-Signature Approvals',
            'AI Risk Scoring',
            'SIEM Integration',
            'Event Verification',
            'Compliance Automation',
            'Pattern Detection',
            'Live Dashboard',
            'Encryption',
            'Multi-node'
        ],
        timestamp: new Date().toISOString()
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({
        error: 'Endpoint not found',
        availableEndpoints: [
            'GET /',
            'GET /health',
            'GET /api/events',
            'POST /api/events',
            'GET /api/blockchain',
            'GET /api/monitoring/stats',
            'GET /explorer',
            'GET /api-docs'
        ]
    });
});

server.listen(PORT, () => {
    console.log(`🚀 TaxGuard Blockchain API running on port ${PORT}`);
    console.log(`📊 Blockchain initialized with ${blockchain.getChainInfo().totalEvents} events`);
    console.log(`🌐 Explorer UI: http://localhost:${PORT}/explorer`);
    console.log(`📚 API Docs: http://localhost:${PORT}/api-docs`);
    console.log(`📡 WebSocket: Real-time events enabled`);
    console.log(`🔒 Security: Encryption and validation active`);
});

module.exports = app;
