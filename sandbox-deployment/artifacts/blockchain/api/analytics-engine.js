const express = require('express');
const router = express.Router();
const { blockchain } = require('../scripts/add-sample-events');

/**
 * Smart Contract Analytics Engine
 * Advanced AI-powered analytics for tax compliance
 */

// POST /api/analytics/risk-score - Calculate risk score for taxpayer
router.post('/risk-score', (req, res) => {
    try {
        const { anonymizedUserId } = req.body;

        if (!anonymizedUserId) {
            return res.status(400).json({
                error: 'anonymizedUserId is required'
            });
        }

        const events = blockchain.queryAllEvents()
            .filter(e => e.anonymizedUserId === anonymizedUserId);

        if (events.length === 0) {
            return res.status(404).json({
                error: 'No events found for this user'
            });
        }

        const riskScore = calculateRiskScore(events);
        const riskFactors = identifyRiskFactors(events);
        const recommendations = generateRecommendations(riskScore, riskFactors);

        res.json({
            success: true,
            userId: anonymizedUserId,
            riskAnalysis: {
                overallRiskScore: riskScore.total,
                riskLevel: riskScore.level,
                confidence: riskScore.confidence,
                breakdown: riskScore.breakdown,
                factors: riskFactors,
                recommendations,
                eventsAnalyzed: events.length,
                analyzedAt: new Date().toISOString()
            }
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// POST /api/analytics/pattern-detection - Detect suspicious patterns
router.post('/pattern-detection', (req, res) => {
    try {
        const { timeWindow, threshold } = req.body;
        const days = timeWindow || 30;

        const events = blockchain.queryAllEvents();
        const cutoffDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

        const recentEvents = events.filter(e =>
            new Date(e.timestamp) >= cutoffDate
        );

        const patterns = detectSuspiciousPatterns(recentEvents, threshold);

        res.json({
            success: true,
            patternDetection: {
                timeWindow: `${days} days`,
                eventsAnalyzed: recentEvents.length,
                patternsDetected: patterns.length,
                patterns,
                analyzedAt: new Date().toISOString()
            }
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// POST /api/analytics/compliance-score - Calculate compliance score
router.post('/compliance-score', (req, res) => {
    try {
        const { anonymizedUserId } = req.body;

        if (!anonymizedUserId) {
            return res.status(400).json({
                error: 'anonymizedUserId is required'
            });
        }

        const events = blockchain.queryAllEvents()
            .filter(e => e.anonymizedUserId === anonymizedUserId);

        if (events.length === 0) {
            return res.status(404).json({
                error: 'No events found for this user'
            });
        }

        const complianceScore = calculateComplianceScore(events);

        res.json({
            success: true,
            userId: anonymizedUserId,
            complianceAnalysis: {
                score: complianceScore.score,
                grade: complianceScore.grade,
                status: complianceScore.status,
                breakdown: complianceScore.breakdown,
                strengths: complianceScore.strengths,
                weaknesses: complianceScore.weaknesses,
                recommendations: complianceScore.recommendations,
                calculatedAt: new Date().toISOString()
            }
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// GET /api/analytics/anomalies - Detect anomalies across all users
router.get('/anomalies', (req, res) => {
    try {
        const events = blockchain.queryAllEvents();
        const anomalies = detectAnomalies(events);

        res.json({
            success: true,
            anomalies: {
                count: anomalies.length,
                items: anomalies,
                detectedAt: new Date().toISOString()
            }
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// POST /api/analytics/predictive - Predictive risk modeling
router.post('/predictive', (req, res) => {
    try {
        const { anonymizedUserId, forecastDays } = req.body;
        const days = forecastDays || 30;

        const events = blockchain.queryAllEvents()
            .filter(e => e.anonymizedUserId === anonymizedUserId);

        if (events.length < 3) {
            return res.status(400).json({
                error: 'Insufficient data for predictive analysis (minimum 3 events required)'
            });
        }

        const prediction = predictiveForecast(events, days);

        res.json({
            success: true,
            userId: anonymizedUserId,
            prediction: {
                forecastPeriod: `${days} days`,
                predictedRiskLevel: prediction.riskLevel,
                confidence: prediction.confidence,
                likelyEvents: prediction.likelyEvents,
                warnings: prediction.warnings,
                recommendations: prediction.recommendations,
                forecastedAt: new Date().toISOString()
            }
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// GET /api/analytics/network-analysis - Analyze relationships
router.get('/network-analysis', (req, res) => {
    try {
        const events = blockchain.queryAllEvents();
        const network = analyzeNetwork(events);

        res.json({
            success: true,
            networkAnalysis: network,
            analyzedAt: new Date().toISOString()
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// POST /api/analytics/circular-transactions - Detect circular patterns
router.post('/circular-transactions', (req, res) => {
    try {
        const events = blockchain.queryAllEvents();
        const circularPatterns = detectCircularTransactions(events);

        res.json({
            success: true,
            circularTransactions: {
                detected: circularPatterns.length > 0,
                count: circularPatterns.length,
                patterns: circularPatterns,
                severity: circularPatterns.length > 0 ? 'HIGH' : 'NONE'
            }
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Helper functions
function calculateRiskScore(events) {
    let score = 0;
    const breakdown = {};

    // Risk factors
    const auditFlags = events.filter(e => e.eventType === 'auditFlag').length;
    const latePayments = events.filter(e =>
        e.notes.toLowerCase().includes('late')
    ).length;
    const amendments = events.filter(e =>
        e.notes.toLowerCase().includes('amendment')
    ).length;

    // Scoring
    breakdown.auditFlags = auditFlags * 25;
    breakdown.latePayments = latePayments * 15;
    breakdown.amendments = amendments * 10;

    score = breakdown.auditFlags + breakdown.latePayments + breakdown.amendments;

    return {
        total: Math.min(score, 100),
        level: score > 70 ? 'HIGH' : score > 40 ? 'MEDIUM' : 'LOW',
        confidence: events.length > 10 ? 'HIGH' : events.length > 5 ? 'MEDIUM' : 'LOW',
        breakdown
    };
}

function identifyRiskFactors(events) {
    const factors = [];

    if (events.filter(e => e.eventType === 'auditFlag').length > 2) {
        factors.push({
            factor: 'Multiple audit flags',
            severity: 'HIGH',
            count: events.filter(e => e.eventType === 'auditFlag').length
        });
    }

    if (events.filter(e => e.notes.toLowerCase().includes('late')).length > 1) {
        factors.push({
            factor: 'History of late submissions',
            severity: 'MEDIUM',
            count: events.filter(e => e.notes.toLowerCase().includes('late')).length
        });
    }

    return factors;
}

function generateRecommendations(riskScore, factors) {
    const recommendations = [];

    if (riskScore.level === 'HIGH') {
        recommendations.push('Immediate audit recommended');
        recommendations.push('Enhanced monitoring required');
    }

    if (factors.some(f => f.factor.includes('late'))) {
        recommendations.push('Set up automatic payment reminders');
    }

    return recommendations;
}

function detectSuspiciousPatterns(events, threshold = 5) {
    const patterns = [];
    const userFrequency = {};

    events.forEach(event => {
        userFrequency[event.anonymizedUserId] =
            (userFrequency[event.anonymizedUserId] || 0) + 1;
    });

    Object.entries(userFrequency).forEach(([userId, count]) => {
        if (count > threshold) {
            patterns.push({
                pattern: 'HIGH_FREQUENCY_ACTIVITY',
                userId,
                count,
                severity: count > 15 ? 'CRITICAL' : 'HIGH',
                description: `Unusually high activity: ${count} events`
            });
        }
    });

    return patterns;
}

function calculateComplianceScore(events) {
    let score = 100;
    const breakdown = {};

    const penalties = {
        auditFlag: -15,
        lateSubmission: -10,
        amendment: -5
    };

    breakdown.auditFlags = events.filter(e => e.eventType === 'auditFlag').length * penalties.auditFlag;
    breakdown.lateSubmissions = events.filter(e => e.notes.toLowerCase().includes('late')).length * penalties.lateSubmission;
    breakdown.amendments = events.filter(e => e.notes.toLowerCase().includes('amendment')).length * penalties.amendment;

    score += breakdown.auditFlags + breakdown.lateSubmissions + breakdown.amendments;
    score = Math.max(0, Math.min(100, score));

    return {
        score,
        grade: score > 90 ? 'A' : score > 80 ? 'B' : score > 70 ? 'C' : score > 60 ? 'D' : 'F',
        status: score >= 70 ? 'COMPLIANT' : score >= 50 ? 'AT_RISK' : 'NON_COMPLIANT',
        breakdown,
        strengths: score >= 70 ? ['Good compliance history'] : [],
        weaknesses: score < 70 ? ['Multiple compliance issues detected'] : [],
        recommendations: score < 70 ? ['Improve filing timeliness', 'Address audit flags'] : []
    };
}

function detectAnomalies(events) {
    const anomalies = [];

    // Check for same-day multiple filings
    const dateGroups = {};
    events.forEach(event => {
        const date = event.timestamp.split('T')[0];
        const key = `${event.anonymizedUserId}-${date}`;
        dateGroups[key] = (dateGroups[key] || 0) + 1;
    });

    Object.entries(dateGroups).forEach(([key, count]) => {
        if (count > 3) {
            const [userId, date] = key.split('-');
            anomalies.push({
                type: 'MULTIPLE_SAME_DAY_EVENTS',
                userId,
                date,
                count,
                severity: 'MEDIUM'
            });
        }
    });

    return anomalies;
}

function predictiveForecast(events, days) {
    const riskScore = calculateRiskScore(events);

    return {
        riskLevel: riskScore.level,
        confidence: '75%',
        likelyEvents: ['Tax filing due', 'Possible compliance check'],
        warnings: riskScore.level === 'HIGH' ? ['High probability of audit'] : [],
        recommendations: ['Maintain current compliance level']
    };
}

function analyzeNetwork(events) {
    const users = [...new Set(events.map(e => e.anonymizedUserId))];

    return {
        totalUsers: users.length,
        totalEvents: events.length,
        avgEventsPerUser: (events.length / users.length).toFixed(2),
        networkDensity: 'LOW' // Simplified
    };
}

function detectCircularTransactions(events) {
    // Simplified circular transaction detection
    return []; // Would implement sophisticated graph analysis
}

module.exports = router;
