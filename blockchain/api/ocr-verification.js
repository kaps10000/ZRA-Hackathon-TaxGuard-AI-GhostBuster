const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const { TaxGuardBlockchain } = require('../scripts/deploy');

// Initialize blockchain instance
const blockchain = new TaxGuardBlockchain();

/**
 * OCR Verification Integration Endpoints
 * Connects OCR backend with blockchain storage
 */

// POST /api/ocr-verification/store - Store OCR verification proof
router.post('/store', (req, res) => {
    try {
        const { docId, docHash, extractedData, riskScore, aiMetadata, verificationStatus } = req.body;

        if (!docId || !docHash) {
            return res.status(400).json({
                success: false,
                error: 'docId and docHash are required'
            });
        }

        // Create blockchain event
        const eventId = uuidv4();
        const timestamp = new Date().toISOString();
        
        const result = blockchain.createEvent(
            eventId,
            'OCR_VERIFICATION',
            timestamp,
            `ocr_${docId}`,
            docHash,
            JSON.stringify({
                docId,
                extractedData,
                riskScore,
                aiMetadata,
                verificationStatus
            })
        );

        res.json({
            success: true,
            data: {
                transactionId: eventId,
                blockNumber: blockchain.chain.length,
                verificationHash: docHash,
                timestamp: timestamp,
                processingTime: 100
            }
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// GET /api/ocr-verification/verify/:docId - Get OCR verification proof
router.get('/verify/:docId', (req, res) => {
    try {
        const { docId } = req.params;

        // Find OCR verification event
        const events = blockchain.getAllEvents();
        const ocrEvent = events.find(event => 
            event.eventType === 'OCR_VERIFICATION' && 
            event.anonymizedUserId === `ocr_${docId}`
        );

        if (!ocrEvent) {
            return res.status(404).json({
                success: false,
                error: 'OCR verification not found'
            });
        }

        const payload = JSON.parse(ocrEvent.eventData);

        res.json({
            success: true,
            data: {
                docId: payload.docId,
                transactionId: ocrEvent.eventId,
                blockNumber: ocrEvent.blockIndex,
                timestamp: ocrEvent.timestamp,
                verificationStatus: payload.verificationStatus,
                proof: payload
            }
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// POST /api/ocr-verification/flag - Flag OCR document
router.post('/flag', (req, res) => {
    try {
        const { docId, reason } = req.body;

        if (!docId || !reason) {
            return res.status(400).json({
                success: false,
                error: 'docId and reason are required'
            });
        }

        const eventId = uuidv4();
        const timestamp = new Date().toISOString();
        
        blockchain.createEvent(
            eventId,
            'OCR_FLAG',
            timestamp,
            `ocr_${docId}`,
            `flag_${docId}`,
            JSON.stringify({ docId, reason, flaggedAt: timestamp })
        );

        res.json({
            success: true,
            data: {
                transactionId: eventId,
                timestamp: timestamp
            }
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// GET /api/ocr-verification/flagged - Get flagged documents
router.get('/flagged', (req, res) => {
    try {
        const events = blockchain.getAllEvents();
        const flaggedDocs = events
            .filter(event => event.eventType === 'OCR_FLAG')
            .map(event => {
                const payload = JSON.parse(event.eventData);
                return {
                    docId: payload.docId,
                    reason: payload.reason,
                    flaggedAt: payload.flaggedAt,
                    transactionId: event.eventId
                };
            });

        res.json({
            success: true,
            data: {
                documents: flaggedDocs
            }
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// GET /api/ocr-verification/health - Health check
router.get('/health', (req, res) => {
    res.json({
        success: true,
        status: 'healthy',
        network: 'development',
        chainLength: blockchain.chain.length,
        totalEvents: blockchain.getAllEvents().length
    });
});

module.exports = router;
