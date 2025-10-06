// Blockchain monitoring and analytics endpoints

const express = require('express');
const router = express.Router();

// Get blockchain statistics
router.get('/stats', (req, res) => {
    const { blockchain } = require('../scripts/add-sample-events');
    const events = blockchain.queryAllEvents();
    
    const stats = {
        totalEvents: events.length,
        totalBlocks: blockchain.chain.length,
        eventsByType: {},
        recentActivity: events.slice(-5),
        networkHealth: 'healthy',
        lastBlockTime: blockchain.chain[blockchain.chain.length - 1]?.timestamp
    };
    
    // Count events by type
    events.forEach(event => {
        stats.eventsByType[event.eventType] = (stats.eventsByType[event.eventType] || 0) + 1;
    });
    
    res.json(stats);
});

// Get events by date range
router.get('/events/range', (req, res) => {
    const { blockchain } = require('../scripts/add-sample-events');
    const { startDate, endDate } = req.query;
    
    let events = blockchain.queryAllEvents();
    
    if (startDate || endDate) {
        events = events.filter(event => {
            const eventDate = new Date(event.timestamp);
            if (startDate && eventDate < new Date(startDate)) return false;
            if (endDate && eventDate > new Date(endDate)) return false;
            return true;
        });
    }
    
    res.json({ events, count: events.length });
});

// Get audit trail for specific user
router.get('/audit/:userId', (req, res) => {
    const { blockchain } = require('../scripts/add-sample-events');
    const { userId } = req.params;
    
    const userEvents = blockchain.queryAllEvents().filter(
        event => event.anonymizedUserId === userId
    );
    
    res.json({
        userId,
        eventCount: userEvents.length,
        events: userEvents,
        auditTrail: userEvents.map(event => ({
            timestamp: event.timestamp,
            action: event.eventType,
            details: event.notes,
            blockIndex: event.blockIndex
        }))
    });
});

module.exports = router;
