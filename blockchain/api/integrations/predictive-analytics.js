const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const { v4: uuidv4 } = require('uuid');
const { blockchain } = require('../../scripts/add-sample-events');
const { broadcastEvent } = require('../websocket');

/**
 * Predictive Analytics Integration API
 * For Emmanuel's forecasting and trend analysis module
 *
 * This API allows the Predictive Analytics system to record forecasts,
 * trends, and predictions on the blockchain for accountability and audit trails.
 */

// In-memory storage for predictions (use database in production)
const predictions = new Map();
const forecastModels = new Map();

// POST /api/predictive/forecast - Submit predictive forecast
router.post('/forecast', async (req, res) => {
    try {
        const {
            forecastType,       // 'revenue' | 'compliance' | 'risk' | 'evasion' | 'collection'
            targetEntity,       // TPN or sector (anonymized)
            timeframe,          // Forecast period (e.g., 'Q4-2025', '2026')
            prediction,         // Predicted value/outcome
            confidence,         // Confidence interval (0-100)
            methodology,        // ML model/statistical method used
            factors,            // Key influencing factors
            historicalData,     // Hash of historical data used
            modelVersion,       // Prediction model version
            metadata            // Additional context
        } = req.body;

        // Validation
        if (!forecastType || !targetEntity || !timeframe || prediction === undefined) {
            return res.status(400).json({
                success: false,
                error: 'Required fields: forecastType, targetEntity, timeframe, prediction'
            });
        }

        const validTypes = ['revenue', 'compliance', 'risk', 'evasion', 'collection', 'trend'];
        if (!validTypes.includes(forecastType)) {
            return res.status(400).json({
                success: false,
                error: `forecastType must be one of: ${validTypes.join(', ')}`
            });
        }

        // Generate forecast ID
        const forecastId = uuidv4();
        const timestamp = new Date().toISOString();

        // Create payload for blockchain
        const payload = {
            forecastId,
            forecastType,
            targetEntity,
            timeframe,
            prediction: typeof prediction === 'object' ? prediction : { value: prediction },
            confidence: confidence || null,
            timestamp
        };

        const payloadHash = crypto.createHash('sha256')
            .update(JSON.stringify(payload))
            .digest('hex');

        // Hash of input data
        const dataHash = historicalData || crypto.createHash('sha256')
            .update(JSON.stringify({ forecastId, ...payload }))
            .digest('hex');

        // Add to blockchain
        const blockchainEvent = blockchain.createEvent(
            forecastId,
            'compliance',
            timestamp,
            `predictive-${targetEntity}`,
            dataHash,
            `Predictive Forecast: ${forecastType} | Timeframe: ${timeframe} | Confidence: ${confidence || 'N/A'}%`
        );

        // Store forecast details off-chain
        const forecast = {
            forecastId,
            forecastType,
            targetEntity,
            timeframe,
            prediction,
            confidence: confidence || null,
            methodology: methodology || 'unknown',
            factors: factors || [],
            modelVersion: modelVersion || 'v1.0',
            dataHash,
            payloadHash,
            blockchainEventId: blockchainEvent.eventId,
            blockIndex: blockchain.getChainInfo().length - 1,
            timestamp,
            metadata: metadata || {},
            status: 'active',
            actualOutcome: null,
            accuracy: null,
            verifiedAt: null,
            createdAt: timestamp
        };

        predictions.set(forecastId, forecast);

        // Broadcast for real-time dashboard
        broadcastEvent({
            type: 'predictive_forecast',
            forecast: {
                forecastId,
                forecastType,
                targetEntity: targetEntity.substring(0, 16) + '...',
                timeframe,
                confidence,
                timestamp
            }
        });

        res.status(201).json({
            success: true,
            message: 'Predictive forecast recorded on blockchain',
            forecast: {
                forecastId,
                blockchainEventId: blockchainEvent.eventId,
                blockIndex: forecast.blockIndex,
                forecastType,
                timeframe,
                dataHash,
                payloadHash,
                timestamp
            },
            blockchain: blockchain.getChainInfo()
        });
    } catch (error) {
        console.error('Predictive forecast error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// GET /api/predictive/forecasts - Get all forecasts
router.get('/forecasts', (req, res) => {
    try {
        const { forecastType, timeframe, minConfidence, status, limit } = req.query;

        let results = Array.from(predictions.values());

        // Filters
        if (forecastType) {
            results = results.filter(f => f.forecastType === forecastType);
        }
        if (timeframe) {
            results = results.filter(f => f.timeframe === timeframe);
        }
        if (minConfidence) {
            results = results.filter(f => f.confidence >= parseFloat(minConfidence));
        }
        if (status) {
            results = results.filter(f => f.status === status);
        }

        // Sort by timestamp (descending)
        results.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

        // Limit
        if (limit) {
            results = results.slice(0, parseInt(limit));
        }

        res.json({
            success: true,
            count: results.length,
            forecasts: results.map(f => ({
                forecastId: f.forecastId,
                forecastType: f.forecastType,
                targetEntity: f.targetEntity.substring(0, 16) + '...',
                timeframe: f.timeframe,
                prediction: f.prediction,
                confidence: f.confidence,
                timestamp: f.timestamp,
                status: f.status,
                accuracy: f.accuracy,
                blockchainEventId: f.blockchainEventId
            }))
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// GET /api/predictive/forecast/:forecastId - Get specific forecast
router.get('/forecast/:forecastId', (req, res) => {
    try {
        const { forecastId } = req.params;
        const forecast = predictions.get(forecastId);

        if (!forecast) {
            return res.status(404).json({
                success: false,
                error: 'Forecast not found'
            });
        }

        // Get blockchain verification
        const blockchainEvent = blockchain.readEvent(forecast.blockchainEventId);

        res.json({
            success: true,
            forecast,
            blockchainVerification: {
                eventId: blockchainEvent?.eventId,
                timestamp: blockchainEvent?.timestamp,
                blockIndex: forecast.blockIndex,
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

// PUT /api/predictive/forecast/:forecastId/verify - Verify forecast with actual outcome
router.put('/forecast/:forecastId/verify', (req, res) => {
    try {
        const { forecastId } = req.params;
        const { actualOutcome, verifiedBy, notes } = req.body;

        const forecast = predictions.get(forecastId);

        if (!forecast) {
            return res.status(404).json({
                success: false,
                error: 'Forecast not found'
            });
        }

        if (actualOutcome === undefined) {
            return res.status(400).json({
                success: false,
                error: 'actualOutcome is required'
            });
        }

        // Calculate accuracy
        const accuracy = calculateAccuracy(forecast.prediction, actualOutcome);

        forecast.actualOutcome = actualOutcome;
        forecast.accuracy = accuracy;
        forecast.verifiedBy = verifiedBy || 'system';
        forecast.verifiedAt = new Date().toISOString();
        forecast.verificationNotes = notes;
        forecast.status = 'verified';

        res.json({
            success: true,
            message: 'Forecast verified with actual outcome',
            forecast: {
                forecastId,
                prediction: forecast.prediction,
                actualOutcome,
                accuracy,
                verifiedAt: forecast.verifiedAt
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// POST /api/predictive/trend - Record trend analysis
router.post('/trend', async (req, res) => {
    try {
        const {
            trendType,          // 'compliance_trend' | 'revenue_trend' | 'risk_trend'
            direction,          // 'increasing' | 'decreasing' | 'stable'
            magnitude,          // Strength of trend (0-100)
            timeWindow,         // Period analyzed (e.g., '6 months', '1 year')
            dataPoints,         // Number of data points analyzed
            significance,       // Statistical significance (p-value)
            description,        // Trend description
            dataHash            // Hash of analyzed data
        } = req.body;

        if (!trendType || !direction || !timeWindow) {
            return res.status(400).json({
                success: false,
                error: 'Required fields: trendType, direction, timeWindow'
            });
        }

        const trendId = uuidv4();
        const timestamp = new Date().toISOString();

        const payload = {
            trendId,
            trendType,
            direction,
            magnitude,
            timeWindow,
            timestamp
        };

        const payloadHash = crypto.createHash('sha256')
            .update(JSON.stringify(payload))
            .digest('hex');

        const analysisHash = dataHash || payloadHash;

        const blockchainEvent = blockchain.createEvent(
            trendId,
            'compliance',
            timestamp,
            'predictive-trend',
            analysisHash,
            `Trend Analysis: ${trendType} | Direction: ${direction} | Window: ${timeWindow}`
        );

        res.status(201).json({
            success: true,
            message: 'Trend analysis recorded on blockchain',
            trend: {
                trendId,
                blockchainEventId: blockchainEvent.eventId,
                trendType,
                direction,
                magnitude,
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

// POST /api/predictive/model/register - Register prediction model
router.post('/model/register', (req, res) => {
    try {
        const {
            modelName,
            modelVersion,
            modelType,          // 'ml' | 'statistical' | 'ensemble'
            features,           // Features used
            performance,        // Performance metrics
            trainedOn,          // Training data hash
            description
        } = req.body;

        if (!modelName || !modelVersion) {
            return res.status(400).json({
                success: false,
                error: 'Required fields: modelName, modelVersion'
            });
        }

        const modelId = uuidv4();
        const timestamp = new Date().toISOString();

        const model = {
            modelId,
            modelName,
            modelVersion,
            modelType: modelType || 'unknown',
            features: features || [],
            performance: performance || {},
            trainedOn,
            description: description || '',
            registeredAt: timestamp,
            status: 'active',
            forecastCount: 0
        };

        forecastModels.set(modelId, model);

        res.status(201).json({
            success: true,
            message: 'Prediction model registered',
            model: {
                modelId,
                modelName,
                modelVersion,
                registeredAt: timestamp
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// GET /api/predictive/models - Get all registered models
router.get('/models', (req, res) => {
    try {
        const models = Array.from(forecastModels.values());

        res.json({
            success: true,
            count: models.length,
            models: models.map(m => ({
                modelId: m.modelId,
                modelName: m.modelName,
                modelVersion: m.modelVersion,
                modelType: m.modelType,
                registeredAt: m.registeredAt,
                forecastCount: m.forecastCount
            }))
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// GET /api/predictive/stats - Predictive analytics statistics
router.get('/stats', (req, res) => {
    try {
        const allForecasts = Array.from(predictions.values());
        const verifiedForecasts = allForecasts.filter(f => f.status === 'verified');

        const stats = {
            total: allForecasts.length,
            byType: {
                revenue: allForecasts.filter(f => f.forecastType === 'revenue').length,
                compliance: allForecasts.filter(f => f.forecastType === 'compliance').length,
                risk: allForecasts.filter(f => f.forecastType === 'risk').length,
                evasion: allForecasts.filter(f => f.forecastType === 'evasion').length,
                collection: allForecasts.filter(f => f.forecastType === 'collection').length
            },
            verified: verifiedForecasts.length,
            pending: allForecasts.filter(f => f.status === 'active').length,
            averageConfidence: allForecasts.filter(f => f.confidence).length > 0
                ? (allForecasts.filter(f => f.confidence).reduce((sum, f) => sum + f.confidence, 0) /
                   allForecasts.filter(f => f.confidence).length).toFixed(2)
                : null,
            averageAccuracy: verifiedForecasts.length > 0
                ? (verifiedForecasts.reduce((sum, f) => sum + (f.accuracy || 0), 0) / verifiedForecasts.length).toFixed(2)
                : null,
            modelCount: forecastModels.size
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

// GET /api/predictive/accuracy-report - Model accuracy report
router.get('/accuracy-report', (req, res) => {
    try {
        const { modelVersion, forecastType } = req.query;

        let forecasts = Array.from(predictions.values()).filter(f => f.status === 'verified');

        if (modelVersion) {
            forecasts = forecasts.filter(f => f.modelVersion === modelVersion);
        }
        if (forecastType) {
            forecasts = forecasts.filter(f => f.forecastType === forecastType);
        }

        if (forecasts.length === 0) {
            return res.json({
                success: true,
                message: 'No verified forecasts available for accuracy report',
                report: null
            });
        }

        const accuracies = forecasts.map(f => f.accuracy).filter(a => a !== null);
        const averageAccuracy = accuracies.reduce((sum, a) => sum + a, 0) / accuracies.length;

        const report = {
            totalVerified: forecasts.length,
            averageAccuracy: averageAccuracy.toFixed(2),
            highAccuracy: accuracies.filter(a => a >= 90).length,
            mediumAccuracy: accuracies.filter(a => a >= 70 && a < 90).length,
            lowAccuracy: accuracies.filter(a => a < 70).length,
            byType: {}
        };

        // Group by forecast type
        const types = [...new Set(forecasts.map(f => f.forecastType))];
        types.forEach(type => {
            const typeForecasts = forecasts.filter(f => f.forecastType === type);
            const typeAccuracies = typeForecasts.map(f => f.accuracy).filter(a => a !== null);
            report.byType[type] = {
                count: typeForecasts.length,
                averageAccuracy: (typeAccuracies.reduce((sum, a) => sum + a, 0) / typeAccuracies.length).toFixed(2)
            };
        });

        res.json({
            success: true,
            report,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Helper functions
function calculateAccuracy(prediction, actualOutcome) {
    try {
        let predicted, actual;

        // Handle object predictions
        if (typeof prediction === 'object' && prediction.value !== undefined) {
            predicted = prediction.value;
        } else {
            predicted = prediction;
        }

        if (typeof actualOutcome === 'object' && actualOutcome.value !== undefined) {
            actual = actualOutcome.value;
        } else {
            actual = actualOutcome;
        }

        // For numeric predictions
        if (typeof predicted === 'number' && typeof actual === 'number') {
            const error = Math.abs(predicted - actual);
            const range = Math.max(Math.abs(predicted), Math.abs(actual));
            const accuracy = range > 0 ? Math.max(0, 100 - (error / range * 100)) : 100;
            return parseFloat(accuracy.toFixed(2));
        }

        // For categorical predictions
        if (predicted === actual) {
            return 100;
        } else {
            return 0;
        }
    } catch (error) {
        return null;
    }
}

module.exports = router;
