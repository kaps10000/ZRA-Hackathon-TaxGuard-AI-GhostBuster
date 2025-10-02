const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const { v4: uuidv4 } = require('uuid');
const { blockchain } = require('../../scripts/add-sample-events');
const { broadcastEvent } = require('../websocket');

/**
 * GhostBuster Integration API
 * For Ezra's phantom employee & ghost company detection module
 *
 * This API allows GhostBuster to record detection events on the blockchain
 * ensuring immutable audit trails for all phantom detections.
 */

// In-memory storage for detection metadata (use database in production)
const detections = new Map();

// POST /api/ghostbuster/detection - Record a phantom detection
router.post('/detection', async (req, res) => {
    try {
        const {
            detectionType,      // 'phantom_employee' | 'ghost_company'
            entityId,           // TPN or company registration number (anonymized)
            confidenceScore,    // 0-100
            detectionMethod,    // 'pattern_analysis' | 'cross_reference' | 'ai_model'
            indicators,         // Array of red flags
            severity,           // 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
            investigatorId,     // Who/what detected this (anonymized)
            evidenceHash,       // SHA256 hash of evidence bundle
            metadata            // Additional context
        } = req.body;

        // Validation
        if (!detectionType || !entityId || !confidenceScore || !evidenceHash) {
            return res.status(400).json({
                success: false,
                error: 'Required fields: detectionType, entityId, confidenceScore, evidenceHash'
            });
        }

        if (!['phantom_employee', 'ghost_company'].includes(detectionType)) {
            return res.status(400).json({
                success: false,
                error: 'detectionType must be phantom_employee or ghost_company'
            });
        }

        // Create detection event
        const detectionId = uuidv4();
        const timestamp = new Date().toISOString();

        // Create payload for blockchain
        const payload = {
            detectionId,
            detectionType,
            entityId,
            confidenceScore,
            severity: severity || calculateSeverity(confidenceScore),
            indicators: indicators || [],
            timestamp
        };

        const payloadHash = crypto.createHash('sha256')
            .update(JSON.stringify(payload))
            .digest('hex');

        // Verify evidence hash matches
        if (evidenceHash.length !== 64 || !/^[a-f0-9]{64}$/i.test(evidenceHash)) {
            return res.status(400).json({
                success: false,
                error: 'evidenceHash must be a valid 64-character SHA256 hex string'
            });
        }

        // Add to blockchain
        const blockchainEvent = blockchain.createEvent(
            detectionId,
            'auditFlag',  // Use auditFlag type for high-priority
            timestamp,
            `ghostbuster-${entityId}`,
            evidenceHash,
            `GhostBuster Detection: ${detectionType} | Confidence: ${confidenceScore}% | Severity: ${severity || calculateSeverity(confidenceScore)}`
        );

        // Store metadata off-chain
        const detection = {
            detectionId,
            detectionType,
            entityId,
            confidenceScore,
            detectionMethod: detectionMethod || 'unknown',
            indicators,
            severity: severity || calculateSeverity(confidenceScore),
            investigatorId: investigatorId || 'ghostbuster-ai',
            evidenceHash,
            payloadHash,
            blockchainEventId: blockchainEvent.eventId,
            blockIndex: blockchain.getChainInfo().length - 1,
            timestamp,
            metadata: metadata || {},
            status: 'detected',
            reviewStatus: 'pending',
            createdAt: timestamp
        };

        detections.set(detectionId, detection);

        // Broadcast for real-time dashboard
        broadcastEvent({
            type: 'ghostbuster_detection',
            detection: {
                detectionId,
                detectionType,
                confidenceScore,
                severity: detection.severity,
                timestamp
            }
        });

        res.status(201).json({
            success: true,
            message: 'Phantom detection recorded on blockchain',
            detection: {
                detectionId,
                blockchainEventId: blockchainEvent.eventId,
                blockIndex: detection.blockIndex,
                evidenceHash,
                payloadHash,
                timestamp
            },
            blockchain: blockchain.getChainInfo()
        });
    } catch (error) {
        console.error('GhostBuster detection error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// GET /api/ghostbuster/detections - Get all detections
router.get('/detections', (req, res) => {
    try {
        const { detectionType, severity, status, limit } = req.query;

        let results = Array.from(detections.values());

        // Filters
        if (detectionType) {
            results = results.filter(d => d.detectionType === detectionType);
        }
        if (severity) {
            results = results.filter(d => d.severity === severity.toUpperCase());
        }
        if (status) {
            results = results.filter(d => d.reviewStatus === status);
        }

        // Sort by confidence score (descending)
        results.sort((a, b) => b.confidenceScore - a.confidenceScore);

        // Limit
        if (limit) {
            results = results.slice(0, parseInt(limit));
        }

        res.json({
            success: true,
            count: results.length,
            detections: results.map(d => ({
                detectionId: d.detectionId,
                detectionType: d.detectionType,
                entityId: d.entityId,
                confidenceScore: d.confidenceScore,
                severity: d.severity,
                timestamp: d.timestamp,
                reviewStatus: d.reviewStatus,
                blockchainEventId: d.blockchainEventId
            }))
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// GET /api/ghostbuster/detection/:detectionId - Get specific detection
router.get('/detection/:detectionId', (req, res) => {
    try {
        const { detectionId } = req.params;
        const detection = detections.get(detectionId);

        if (!detection) {
            return res.status(404).json({
                success: false,
                error: 'Detection not found'
            });
        }

        // Get blockchain verification
        const blockchainEvent = blockchain.readEvent(detection.blockchainEventId);

        res.json({
            success: true,
            detection,
            blockchainVerification: {
                eventId: blockchainEvent?.eventId,
                timestamp: blockchainEvent?.timestamp,
                blockIndex: detection.blockIndex,
                integrity: blockchainEvent ? 'verified' : 'not_found'
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// PUT /api/ghostbuster/detection/:detectionId/review - Update review status
router.put('/detection/:detectionId/review', (req, res) => {
    try {
        const { detectionId } = req.params;
        const { reviewStatus, reviewerId, reviewNotes } = req.body;

        const detection = detections.get(detectionId);

        if (!detection) {
            return res.status(404).json({
                success: false,
                error: 'Detection not found'
            });
        }

        const validStatuses = ['pending', 'confirmed', 'false_positive', 'investigating', 'escalated'];
        if (!validStatuses.includes(reviewStatus)) {
            return res.status(400).json({
                success: false,
                error: `reviewStatus must be one of: ${validStatuses.join(', ')}`
            });
        }

        detection.reviewStatus = reviewStatus;
        detection.reviewerId = reviewerId;
        detection.reviewNotes = reviewNotes;
        detection.reviewedAt = new Date().toISOString();

        res.json({
            success: true,
            message: 'Review status updated',
            detection: {
                detectionId,
                reviewStatus,
                reviewerId,
                reviewedAt: detection.reviewedAt
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// GET /api/ghostbuster/stats - Detection statistics
router.get('/stats', (req, res) => {
    try {
        const allDetections = Array.from(detections.values());

        const stats = {
            total: allDetections.length,
            byType: {
                phantom_employee: allDetections.filter(d => d.detectionType === 'phantom_employee').length,
                ghost_company: allDetections.filter(d => d.detectionType === 'ghost_company').length
            },
            bySeverity: {
                CRITICAL: allDetections.filter(d => d.severity === 'CRITICAL').length,
                HIGH: allDetections.filter(d => d.severity === 'HIGH').length,
                MEDIUM: allDetections.filter(d => d.severity === 'MEDIUM').length,
                LOW: allDetections.filter(d => d.severity === 'LOW').length
            },
            byReviewStatus: {
                pending: allDetections.filter(d => d.reviewStatus === 'pending').length,
                confirmed: allDetections.filter(d => d.reviewStatus === 'confirmed').length,
                false_positive: allDetections.filter(d => d.reviewStatus === 'false_positive').length,
                investigating: allDetections.filter(d => d.reviewStatus === 'investigating').length,
                escalated: allDetections.filter(d => d.reviewStatus === 'escalated').length
            },
            averageConfidence: allDetections.length > 0
                ? (allDetections.reduce((sum, d) => sum + d.confidenceScore, 0) / allDetections.length).toFixed(2)
                : 0
        };

        res.json({
            success: true,
            stats,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// POST /api/ghostbuster/bulk-detection - Bulk detection upload
router.post('/bulk-detection', async (req, res) => {
    try {
        const { detections: bulkDetections } = req.body;

        if (!Array.isArray(bulkDetections)) {
            return res.status(400).json({
                success: false,
                error: 'detections must be an array'
            });
        }

        const results = [];
        const errors = [];

        for (const detection of bulkDetections) {
            try {
                // Reuse the detection creation logic
                const detectionId = uuidv4();
                const timestamp = new Date().toISOString();

                const payload = {
                    detectionId,
                    detectionType: detection.detectionType,
                    entityId: detection.entityId,
                    confidenceScore: detection.confidenceScore,
                    timestamp
                };

                const evidenceHash = detection.evidenceHash || crypto.createHash('sha256')
                    .update(JSON.stringify(payload))
                    .digest('hex');

                const blockchainEvent = blockchain.createEvent(
                    detectionId,
                    'auditFlag',
                    timestamp,
                    `ghostbuster-${detection.entityId}`,
                    evidenceHash,
                    `GhostBuster: ${detection.detectionType} | Confidence: ${detection.confidenceScore}%`
                );

                results.push({
                    detectionId,
                    blockchainEventId: blockchainEvent.eventId,
                    status: 'success'
                });
            } catch (err) {
                errors.push({
                    entityId: detection.entityId,
                    error: err.message
                });
            }
        }

        res.status(201).json({
            success: true,
            message: `Bulk upload completed: ${results.length} successful, ${errors.length} failed`,
            results,
            errors: errors.length > 0 ? errors : undefined
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Helper functions
function calculateSeverity(confidenceScore) {
    if (confidenceScore >= 90) return 'CRITICAL';
    if (confidenceScore >= 75) return 'HIGH';
    if (confidenceScore >= 50) return 'MEDIUM';
    return 'LOW';
}

module.exports = router;
