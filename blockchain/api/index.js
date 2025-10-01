const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { TaxGuardBlockchain } = require('../scripts/deploy');

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3001;

// Initialize blockchain
const blockchain = new TaxGuardBlockchain();

// Health check
app.get('/health', (req, res) => {
    res.json({ 
        status: 'healthy', 
        service: 'TaxGuard Blockchain API',
        blockchain: blockchain.getChainInfo()
    });
});

// POST /api/events - Create new tax event
app.post('/api/events', async (req, res) => {
    try {
        const { eventType, anonymizedUserId, hashOfPayload, notes } = req.body;
        
        // Validate required fields
        if (!eventType || !anonymizedUserId || !hashOfPayload) {
            return res.status(400).json({ 
                error: 'Missing required fields: eventType, anonymizedUserId, hashOfPayload' 
            });
        }

        // Validate event type
        const validTypes = ['filing', 'payment', 'auditFlag', 'adminChange'];
        if (!validTypes.includes(eventType)) {
            return res.status(400).json({ 
                error: 'Invalid eventType. Must be one of: ' + validTypes.join(', ') 
            });
        }

        const eventId = uuidv4();
        const timestamp = new Date().toISOString();
        
        const event = blockchain.createEvent(
            eventId,
            eventType,
            timestamp,
            anonymizedUserId,
            hashOfPayload,
            notes
        );
        
        res.status(201).json({
            success: true,
            event,
            blockchain: blockchain.getChainInfo()
        });
    } catch (error) {
        console.error('Error creating event:', error);
        res.status(500).json({ error: error.message });
    }
});

// GET /api/events/:id - Read specific event
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

// GET /api/events - Get all events
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
        chain: blockchain.chain
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
        
        res.json({ success: true, event });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.listen(PORT, () => {
    console.log(`🚀 TaxGuard Blockchain API running on port ${PORT}`);
    console.log(`📊 Blockchain initialized with ${blockchain.getChainInfo().totalEvents} events`);
});
