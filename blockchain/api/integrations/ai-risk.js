const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const { v4: uuidv4 } = require('uuid');
const { blockchain } = require('../../scripts/add-sample-events');
const { broadcastEvent } = require('../websocket');

/**
 * AI Risk Scoring Integration API
 * For Shuan's machine learning risk assessment module
 *
 * This API allows the AI Risk Scoring system to record risk assessments
 * on the blockchain, ensuring transparency and auditability of ML predictions.
 */

// In-memory storage for risk assessments (use database in production)
const riskAssessments = new Map();
const userRiskIndex = new Map();

// POST /api/ai-risk/assessment - Submit AI risk assessment
router.post('/assessment', async (req, res) => {
    try {
        const {
            taxpayerId,         // Anonymized taxpayer ID
            riskScore,          // 0-100 ML-generated risk score
            riskLevel,          // 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
            modelVersion,       // ML model version used
            features,           // Feature importance scores
            predictions,        // Specific predictions
            confidence,         // Model confidence (0-100)
            riskFactors,        // Array of identified risk factors
            recommendations,    // Recommended actions
            dataHash,           // Hash of input data
            metadata            // Additional ML context
        } = req.body;

        // Validation
        if (!taxpayerId || riskScore === undefined || !dataHash) {
            return res.status(400).json({
                success: false,
                error: 'Required fields: taxpayerId, riskScore, dataHash'
            });
        }

        if (riskScore < 0 || riskScore > 100) {
            return res.status(400).json({
                success: false,
                error: 'riskScore must be between 0 and 100'
            });
        }

        // Verify data hash format
        if (dataHash.length !== 64 || !/^[a-f0-9]{64}$/i.test(dataHash)) {
            return res.status(400).json({
                success: false,
                error: 'dataHash must be a valid 64-character SHA256 hex string'
            });
        }

        // Generate assessment ID
        const assessmentId = uuidv4();
        const timestamp = new Date().toISOString();

        // Calculate risk level if not provided
        const calculatedRiskLevel = riskLevel || calculateRiskLevel(riskScore);

        // Create payload for blockchain
        const payload = {
            assessmentId,
            taxpayerId,
            riskScore,
            riskLevel: calculatedRiskLevel,
            modelVersion: modelVersion || 'v1.0',
            timestamp
        };

        const payloadHash = crypto.createHash('sha256')
            .update(JSON.stringify(payload))
            .digest('hex');

        // Determine event type based on risk level
        const eventType = calculatedRiskLevel === 'CRITICAL' || calculatedRiskLevel === 'HIGH'
            ? 'auditFlag'
            : 'compliance';

        // Add to blockchain
        const blockchainEvent = blockchain.createEvent(
            assessmentId,
            eventType,
            timestamp,
            `ai-risk-${taxpayerId}`,
            dataHash,
            `AI Risk Assessment: Score ${riskScore}/100 | Level: ${calculatedRiskLevel} | Model: ${modelVersion || 'v1.0'}`
        );

        // Store assessment details off-chain
        const assessment = {
            assessmentId,
            taxpayerId,
            riskScore,
            riskLevel: calculatedRiskLevel,
            modelVersion: modelVersion || 'v1.0',
            features: features || {},
            predictions: predictions || {},
            confidence: confidence || null,
            riskFactors: riskFactors || [],
            recommendations: recommendations || [],
            dataHash,
            payloadHash,
            blockchainEventId: blockchainEvent.eventId,
            blockIndex: blockchain.getChainInfo().length - 1,
            timestamp,
            metadata: metadata || {},
            status: 'active',
            reviewedBy: null,
            createdAt: timestamp
        };

        riskAssessments.set(assessmentId, assessment);

        // Update user risk index
        if (!userRiskIndex.has(taxpayerId)) {
            userRiskIndex.set(taxpayerId, []);
        }
        userRiskIndex.get(taxpayerId).push({
            assessmentId,
            riskScore,
            riskLevel: calculatedRiskLevel,
            timestamp
        });

        // Broadcast for real-time dashboard
        broadcastEvent({
            type: 'ai_risk_assessment',
            assessment: {
                assessmentId,
                taxpayerId: taxpayerId.substring(0, 16) + '...',
                riskScore,
                riskLevel: calculatedRiskLevel,
                timestamp
            }
        });

        res.status(201).json({
            success: true,
            message: 'Risk assessment recorded on blockchain',
            assessment: {
                assessmentId,
                blockchainEventId: blockchainEvent.eventId,
                blockIndex: assessment.blockIndex,
                riskScore,
                riskLevel: calculatedRiskLevel,
                dataHash,
                payloadHash,
                timestamp
            },
            blockchain: blockchain.getChainInfo()
        });
    } catch (error) {
        console.error('AI Risk assessment error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// GET /api/ai-risk/assessments - Get all assessments
router.get('/assessments', (req, res) => {
    try {
        const { riskLevel, modelVersion, minScore, maxScore, limit } = req.query;

        let results = Array.from(riskAssessments.values());

        // Filters
        if (riskLevel) {
            results = results.filter(a => a.riskLevel === riskLevel.toUpperCase());
        }
        if (modelVersion) {
            results = results.filter(a => a.modelVersion === modelVersion);
        }
        if (minScore) {
            results = results.filter(a => a.riskScore >= parseFloat(minScore));
        }
        if (maxScore) {
            results = results.filter(a => a.riskScore <= parseFloat(maxScore));
        }

        // Sort by risk score (descending)
        results.sort((a, b) => b.riskScore - a.riskScore);

        // Limit
        if (limit) {
            results = results.slice(0, parseInt(limit));
        }

        res.json({
            success: true,
            count: results.length,
            assessments: results.map(a => ({
                assessmentId: a.assessmentId,
                taxpayerId: a.taxpayerId.substring(0, 16) + '...',
                riskScore: a.riskScore,
                riskLevel: a.riskLevel,
                modelVersion: a.modelVersion,
                confidence: a.confidence,
                timestamp: a.timestamp,
                blockchainEventId: a.blockchainEventId
            }))
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// GET /api/ai-risk/assessment/:assessmentId - Get specific assessment
router.get('/assessment/:assessmentId', (req, res) => {
    try {
        const { assessmentId } = req.params;
        const assessment = riskAssessments.get(assessmentId);

        if (!assessment) {
            return res.status(404).json({
                success: false,
                error: 'Assessment not found'
            });
        }

        // Get blockchain verification
        const blockchainEvent = blockchain.readEvent(assessment.blockchainEventId);

        res.json({
            success: true,
            assessment,
            blockchainVerification: {
                eventId: blockchainEvent?.eventId,
                timestamp: blockchainEvent?.timestamp,
                blockIndex: assessment.blockIndex,
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

// GET /api/ai-risk/taxpayer/:taxpayerId/history - Get risk history for taxpayer
router.get('/taxpayer/:taxpayerId/history', (req, res) => {
    try {
        const { taxpayerId } = req.params;
        const history = userRiskIndex.get(taxpayerId);

        if (!history || history.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'No risk assessments found for this taxpayer'
            });
        }

        // Sort by timestamp (descending)
        history.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

        // Calculate trends
        const scores = history.map(h => h.riskScore);
        const trend = calculateTrend(scores);
        const averageScore = scores.reduce((sum, s) => sum + s, 0) / scores.length;

        res.json({
            success: true,
            taxpayerId,
            count: history.length,
            latestRiskScore: history[0].riskScore,
            latestRiskLevel: history[0].riskLevel,
            averageRiskScore: averageScore.toFixed(2),
            trend,
            history: history.map(h => ({
                assessmentId: h.assessmentId,
                riskScore: h.riskScore,
                riskLevel: h.riskLevel,
                timestamp: h.timestamp
            }))
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// POST /api/ai-risk/batch-assessment - Batch assessment submission
router.post('/batch-assessment', async (req, res) => {
    try {
        const { assessments: batchAssessments } = req.body;

        if (!Array.isArray(batchAssessments)) {
            return res.status(400).json({
                success: false,
                error: 'assessments must be an array'
            });
        }

        const results = [];
        const errors = [];

        for (const assessment of batchAssessments) {
            try {
                const assessmentId = uuidv4();
                const timestamp = new Date().toISOString();

                const payload = {
                    assessmentId,
                    taxpayerId: assessment.taxpayerId,
                    riskScore: assessment.riskScore,
                    timestamp
                };

                const dataHash = assessment.dataHash || crypto.createHash('sha256')
                    .update(JSON.stringify(payload))
                    .digest('hex');

                const riskLevel = calculateRiskLevel(assessment.riskScore);
                const eventType = riskLevel === 'CRITICAL' || riskLevel === 'HIGH' ? 'auditFlag' : 'compliance';

                const blockchainEvent = blockchain.createEvent(
                    assessmentId,
                    eventType,
                    timestamp,
                    `ai-risk-${assessment.taxpayerId}`,
                    dataHash,
                    `AI Risk: ${assessment.riskScore}/100 | ${riskLevel}`
                );

                results.push({
                    assessmentId,
                    taxpayerId: assessment.taxpayerId,
                    riskScore: assessment.riskScore,
                    blockchainEventId: blockchainEvent.eventId,
                    status: 'success'
                });
            } catch (err) {
                errors.push({
                    taxpayerId: assessment.taxpayerId,
                    error: err.message
                });
            }
        }

        res.status(201).json({
            success: true,
            message: `Batch assessment completed: ${results.length} successful, ${errors.length} failed`,
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

// GET /api/ai-risk/stats - AI Risk statistics
router.get('/stats', (req, res) => {
    try {
        const allAssessments = Array.from(riskAssessments.values());

        const stats = {
            total: allAssessments.length,
            byRiskLevel: {
                CRITICAL: allAssessments.filter(a => a.riskLevel === 'CRITICAL').length,
                HIGH: allAssessments.filter(a => a.riskLevel === 'HIGH').length,
                MEDIUM: allAssessments.filter(a => a.riskLevel === 'MEDIUM').length,
                LOW: allAssessments.filter(a => a.riskLevel === 'LOW').length
            },
            byModelVersion: {},
            averageRiskScore: allAssessments.length > 0
                ? (allAssessments.reduce((sum, a) => sum + a.riskScore, 0) / allAssessments.length).toFixed(2)
                : 0,
            averageConfidence: allAssessments.filter(a => a.confidence).length > 0
                ? (allAssessments.filter(a => a.confidence).reduce((sum, a) => sum + a.confidence, 0) /
                   allAssessments.filter(a => a.confidence).length).toFixed(2)
                : null,
            highRiskCount: allAssessments.filter(a => a.riskScore >= 75).length,
            uniqueTaxpayers: userRiskIndex.size
        };

        // Group by model version
        allAssessments.forEach(a => {
            const version = a.modelVersion;
            if (!stats.byModelVersion[version]) {
                stats.byModelVersion[version] = 0;
            }
            stats.byModelVersion[version]++;
        });

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

// POST /api/ai-risk/model/update - Record model update/retraining
router.post('/model/update', (req, res) => {
    try {
        const {
            modelVersion,
            updateType,         // 'retrain' | 'parameter_update' | 'feature_update'
            performance,        // Model performance metrics
            changesHash,        // Hash of model changes
            notes
        } = req.body;

        if (!modelVersion || !changesHash) {
            return res.status(400).json({
                success: false,
                error: 'Required fields: modelVersion, changesHash'
            });
        }

        const updateId = uuidv4();
        const timestamp = new Date().toISOString();

        const blockchainEvent = blockchain.createEvent(
            updateId,
            'adminChange',
            timestamp,
            'ai-risk-model',
            changesHash,
            `AI Model Update: ${modelVersion} | Type: ${updateType || 'update'}`
        );

        res.status(201).json({
            success: true,
            message: 'Model update recorded on blockchain',
            update: {
                updateId,
                modelVersion,
                blockchainEventId: blockchainEvent.eventId,
                timestamp
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Helper functions
function calculateRiskLevel(riskScore) {
    if (riskScore >= 90) return 'CRITICAL';
    if (riskScore >= 75) return 'HIGH';
    if (riskScore >= 50) return 'MEDIUM';
    return 'LOW';
}

function calculateTrend(scores) {
    if (scores.length < 2) return 'insufficient_data';

    const recent = scores.slice(0, Math.min(3, scores.length));
    const older = scores.slice(Math.min(3, scores.length));

    if (older.length === 0) return 'new_taxpayer';

    const recentAvg = recent.reduce((sum, s) => sum + s, 0) / recent.length;
    const olderAvg = older.reduce((sum, s) => sum + s, 0) / older.length;

    const diff = recentAvg - olderAvg;

    if (diff > 10) return 'increasing';
    if (diff < -10) return 'decreasing';
    return 'stable';
}

module.exports = router;
