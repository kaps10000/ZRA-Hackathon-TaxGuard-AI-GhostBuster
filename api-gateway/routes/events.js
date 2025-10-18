const express = require('express');
const axios = require('axios');
const { body, param, validationResult } = require('express-validator');
const { authenticateToken, authorizeRole } = require('../middleware/auth');
const logger = require('../utils/logger');
const { trackBlockchainEvent, trackError } = require('../middleware/monitoring');

const router = express.Router();

const BLOCKCHAIN_API_URL = process.env.BLOCKCHAIN_API_URL || 'http://localhost:3001';

// POST /events - Submit new tax event (authenticated users)
router.post('/events', authenticateToken, [
    body('eventType').isIn(['filing', 'payment', 'auditFlag', 'adminChange', 'compliance', 'whistleblower'])
        .withMessage('Invalid event type'),
    body('anonymizedUserId').notEmpty().withMessage('Anonymized user ID is required'),
    body('hashOfPayload').isLength({ min: 64, max: 64 }).isHexadecimal()
        .withMessage('Hash must be 64-character hexadecimal string'),
    body('notes').optional().isLength({ max: 1000 }).withMessage('Notes must be less than 1000 characters')
], async (req, res) => {
    try {
        // Validate input
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            logger.warn('Event Submission Validation Failed', {
                userId: req.user.id,
                errors: errors.array(),
                ip: req.ip,
                timestamp: new Date().toISOString()
            });
            return res.status(400).json({
                error: 'Validation failed',
                details: errors.array()
            });
        }

        const { eventType, anonymizedUserId, hashOfPayload, notes } = req.body;

        // Log the event submission attempt
        logger.security.apiCall({
            userId: req.user.id,
            action: 'event_submission',
            eventType,
            anonymizedUserId,
            ip: req.ip,
            timestamp: new Date().toISOString()
        });

        // Prepare event data for blockchain
        const eventData = {
            eventType,
            anonymizedUserId,
            hashOfPayload,
            notes: notes || '',
            timestamp: new Date().toISOString(),
            submittedBy: req.user.id,
            submitterRole: req.user.role
        };

        // Submit to blockchain
        const blockchainResponse = await axios.post(`${BLOCKCHAIN_API_URL}/api/events`, eventData, {
            timeout: 10000,
            headers: {
                'Content-Type': 'application/json',
                'X-API-Gateway': 'taxguard-gateway',
                'X-User-ID': req.user.id.toString(),
                'X-User-Role': req.user.role
            }
        });

        // Track metric
        trackBlockchainEvent(eventType, req.user.role);

        // Log successful submission
        logger.info('Event Submitted Successfully', {
            userId: req.user.id,
            eventId: blockchainResponse.data.event?.eventId,
            eventType,
            blockIndex: blockchainResponse.data.event?.blockIndex,
            ip: req.ip,
            timestamp: new Date().toISOString()
        });

        res.status(201).json({
            success: true,
            message: 'Event submitted successfully',
            eventId: blockchainResponse.data.event?.eventId,
            blockIndex: blockchainResponse.data.event?.blockIndex,
            event: blockchainResponse.data.event,
            blockchain: {
                length: blockchainResponse.data.blockchain?.length,
                latestBlockHash: blockchainResponse.data.blockchain?.latestBlock?.hash
            }
        });

    } catch (error) {
        trackError('event_submission_failed', req.path);

        logger.error('Event Submission Failed', {
            userId: req.user?.id,
            error: error.message,
            stack: error.stack,
            blockchainError: error.response?.data,
            ip: req.ip,
            timestamp: new Date().toISOString()
        });

        if (error.response?.status === 400) {
            return res.status(400).json({
                error: 'Blockchain validation failed',
                message: error.response.data.error || 'Invalid event data'
            });
        }

        res.status(500).json({
            error: 'Event submission failed',
            message: 'Unable to submit event to blockchain'
        });
    }
});

// GET /events/:id - Retrieve specific event (auditor+ role required)
router.get('/events/:id', authenticateToken, authorizeRole(['auditor', 'admin']), [
    param('id').notEmpty().withMessage('Event ID is required')
], async (req, res) => {
    try {
        // Validate input
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                error: 'Validation failed',
                details: errors.array()
            });
        }

        const eventId = req.params.id;

        // Log the data access
        logger.security.dataAccess({
            userId: req.user.id,
            action: 'event_retrieval',
            eventId,
            userRole: req.user.role,
            ip: req.ip,
            timestamp: new Date().toISOString()
        });

        // Retrieve from blockchain
        const blockchainResponse = await axios.get(`${BLOCKCHAIN_API_URL}/api/events`, {
            timeout: 10000,
            headers: {
                'X-API-Gateway': 'taxguard-gateway',
                'X-User-ID': req.user.id.toString(),
                'X-User-Role': req.user.role
            }
        });

        // Find the specific event
        const events = blockchainResponse.data.events || blockchainResponse.data;
        const event = events.find(e => e.eventId === eventId);

        if (!event) {
            logger.warn('Event Not Found', {
                userId: req.user.id,
                eventId,
                ip: req.ip,
                timestamp: new Date().toISOString()
            });
            return res.status(404).json({
                error: 'Event not found',
                message: `Event with ID ${eventId} does not exist`
            });
        }

        // Log successful retrieval
        logger.info('Event Retrieved Successfully', {
            userId: req.user.id,
            eventId,
            eventType: event.eventType,
            ip: req.ip,
            timestamp: new Date().toISOString()
        });

        res.json({
            success: true,
            event
        });

    } catch (error) {
        logger.error('Event Retrieval Failed', {
            userId: req.user?.id,
            eventId: req.params.id,
            error: error.message,
            stack: error.stack,
            ip: req.ip,
            timestamp: new Date().toISOString()
        });

        res.status(500).json({
            error: 'Event retrieval failed',
            message: 'Unable to retrieve event from blockchain'
        });
    }
});

// GET /events - List all events (auditor+ role required)
router.get('/events', authenticateToken, authorizeRole(['auditor', 'admin']), async (req, res) => {
    try {
        const { limit = 50, offset = 0, eventType, startDate, endDate } = req.query;

        // Log the data access
        logger.security.dataAccess({
            userId: req.user.id,
            action: 'events_list',
            userRole: req.user.role,
            filters: { limit, offset, eventType, startDate, endDate },
            ip: req.ip,
            timestamp: new Date().toISOString()
        });

        // Retrieve from blockchain
        const blockchainResponse = await axios.get(`${BLOCKCHAIN_API_URL}/api/events`, {
            timeout: 10000,
            headers: {
                'X-API-Gateway': 'taxguard-gateway',
                'X-User-ID': req.user.id.toString(),
                'X-User-Role': req.user.role
            }
        });

        let events = blockchainResponse.data.events || blockchainResponse.data;

        // Apply filters
        if (eventType) {
            events = events.filter(e => e.eventType === eventType);
        }

        if (startDate) {
            events = events.filter(e => new Date(e.timestamp) >= new Date(startDate));
        }

        if (endDate) {
            events = events.filter(e => new Date(e.timestamp) <= new Date(endDate));
        }

        // Apply pagination
        const totalEvents = events.length;
        const paginatedEvents = events.slice(parseInt(offset), parseInt(offset) + parseInt(limit));

        // Log successful retrieval
        logger.info('Events Listed Successfully', {
            userId: req.user.id,
            totalEvents,
            returnedEvents: paginatedEvents.length,
            filters: { eventType, startDate, endDate },
            ip: req.ip,
            timestamp: new Date().toISOString()
        });

        res.json({
            success: true,
            events: paginatedEvents,
            pagination: {
                total: totalEvents,
                limit: parseInt(limit),
                offset: parseInt(offset),
                hasMore: parseInt(offset) + parseInt(limit) < totalEvents
            }
        });

    } catch (error) {
        logger.error('Events List Failed', {
            userId: req.user?.id,
            error: error.message,
            stack: error.stack,
            ip: req.ip,
            timestamp: new Date().toISOString()
        });

        res.status(500).json({
            error: 'Events retrieval failed',
            message: 'Unable to retrieve events from blockchain'
        });
    }
});

// GET /events/stats - Get event statistics (auditor+ role required)
router.get('/events/stats', authenticateToken, authorizeRole(['auditor', 'admin']), async (req, res) => {
    try {
        // Log the data access
        logger.security.dataAccess({
            userId: req.user.id,
            action: 'events_stats',
            userRole: req.user.role,
            ip: req.ip,
            timestamp: new Date().toISOString()
        });

        // Get blockchain stats
        const blockchainResponse = await axios.get(`${BLOCKCHAIN_API_URL}/api/monitoring/stats`, {
            timeout: 10000,
            headers: {
                'X-API-Gateway': 'taxguard-gateway',
                'X-User-ID': req.user.id.toString(),
                'X-User-Role': req.user.role
            }
        });

        res.json({
            success: true,
            stats: blockchainResponse.data
        });

    } catch (error) {
        logger.error('Events Stats Failed', {
            userId: req.user?.id,
            error: error.message,
            stack: error.stack,
            ip: req.ip,
            timestamp: new Date().toISOString()
        });

        res.status(500).json({
            error: 'Stats retrieval failed',
            message: 'Unable to retrieve statistics from blockchain'
        });
    }
});

module.exports = router;
