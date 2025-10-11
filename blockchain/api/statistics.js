const express = require('express');
const router = express.Router();
const { blockchain } = require('../scripts/add-sample-events');

/**
 * Advanced Statistics and Analytics Engine
 */

// GET /api/stats - Comprehensive statistics
router.get('/', (req, res) => {
    try {
        const events = blockchain.queryAllEvents();
        const chainInfo = blockchain.getChainInfo();

        // Event type breakdown
        const eventsByType = {};
        events.forEach(event => {
            eventsByType[event.eventType] = (eventsByType[event.eventType] || 0) + 1;
        });

        // User activity analysis
        const userActivity = {};
        const userComplianceScores = {};
        events.forEach(event => {
            const userId = event.anonymizedUserId;
            if (!userActivity[userId]) {
                userActivity[userId] = {
                    totalEvents: 0,
                    eventTypes: {},
                    firstSeen: event.timestamp,
                    lastSeen: event.timestamp,
                    riskFlags: 0
                };
            }
            userActivity[userId].totalEvents++;
            userActivity[userId].eventTypes[event.eventType] =
                (userActivity[userId].eventTypes[event.eventType] || 0) + 1;
            userActivity[userId].lastSeen = event.timestamp;

            if (event.eventType === 'auditFlag') {
                userActivity[userId].riskFlags++;
            }
        });

        // Calculate compliance scores
        Object.keys(userActivity).forEach(userId => {
            const activity = userActivity[userId];
            let score = 100;

            // Penalties
            score -= activity.riskFlags * 15;
            if (activity.eventTypes.payment < activity.eventTypes.filing) {
                score -= 20; // Payment deficiency
            }

            userComplianceScores[userId] = Math.max(0, Math.min(100, score));
        });

        // Top taxpayers by activity
        const topTaxpayers = Object.entries(userActivity)
            .sort((a, b) => b[1].totalEvents - a[1].totalEvents)
            .slice(0, 10)
            .map(([userId, activity]) => ({
                userId,
                totalEvents: activity.totalEvents,
                complianceScore: userComplianceScores[userId],
                riskFlags: activity.riskFlags
            }));

        // Time-based analytics
        const now = new Date();
        const last24h = events.filter(e =>
            (now - new Date(e.timestamp)) < 24 * 60 * 60 * 1000
        ).length;
        const last7days = events.filter(e =>
            (now - new Date(e.timestamp)) < 7 * 24 * 60 * 60 * 1000
        ).length;
        const last30days = events.filter(e =>
            (now - new Date(e.timestamp)) < 30 * 24 * 60 * 60 * 1000
        ).length;

        // Compliance rate
        const totalUsers = Object.keys(userActivity).length;
        const compliantUsers = Object.values(userComplianceScores)
            .filter(score => score >= 70).length;
        const complianceRate = totalUsers > 0
            ? ((compliantUsers / totalUsers) * 100).toFixed(2)
            : 0;

        // Risk distribution
        const highRisk = Object.values(userComplianceScores).filter(s => s < 40).length;
        const mediumRisk = Object.values(userComplianceScores).filter(s => s >= 40 && s < 70).length;
        const lowRisk = Object.values(userComplianceScores).filter(s => s >= 70).length;

        res.json({
            success: true,
            statistics: {
                overview: {
                    totalEvents: events.length,
                    totalBlocks: chainInfo.length,
                    totalUsers: totalUsers,
                    complianceRate: `${complianceRate}%`,
                    lastBlockHash: chainInfo.latestBlock?.hash
                },
                eventsByType,
                timeBasedMetrics: {
                    last24Hours: last24h,
                    last7Days: last7days,
                    last30Days: last30days,
                    avgEventsPerDay: (events.length / 30).toFixed(2)
                },
                topTaxpayers,
                riskDistribution: {
                    high: highRisk,
                    medium: mediumRisk,
                    low: lowRisk
                },
                complianceMetrics: {
                    averageScore: (
                        Object.values(userComplianceScores)
                            .reduce((a, b) => a + b, 0) / totalUsers || 0
                    ).toFixed(2),
                    compliantUsers,
                    nonCompliantUsers: totalUsers - compliantUsers
                }
            },
            generatedAt: new Date().toISOString()
        });
    } catch (error) {
        console.error('Statistics error:', error);
        res.status(500).json({ error: error.message });
    }
});

// GET /api/stats/user/:userId - User-specific statistics
router.get('/user/:userId', (req, res) => {
    try {
        const userId = req.params.userId;
        const events = blockchain.queryAllEvents()
            .filter(e => e.anonymizedUserId === userId);

        if (events.length === 0) {
            return res.status(404).json({
                error: 'No events found for this user'
            });
        }

        const eventsByType = {};
        let riskFlags = 0;
        events.forEach(event => {
            eventsByType[event.eventType] = (eventsByType[event.eventType] || 0) + 1;
            if (event.eventType === 'auditFlag') riskFlags++;
        });

        // Calculate compliance score
        let complianceScore = 100;
        complianceScore -= riskFlags * 15;
        if ((eventsByType.payment || 0) < (eventsByType.filing || 0)) {
            complianceScore -= 20;
        }
        complianceScore = Math.max(0, Math.min(100, complianceScore));

        res.json({
            success: true,
            userId,
            statistics: {
                totalEvents: events.length,
                eventsByType,
                complianceScore,
                riskLevel: complianceScore > 70 ? 'LOW' : complianceScore > 40 ? 'MEDIUM' : 'HIGH',
                riskFlags,
                firstEvent: events[0].timestamp,
                lastEvent: events[events.length - 1].timestamp
            }
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// GET /api/stats/trends - Trend analysis
router.get('/trends', (req, res) => {
    try {
        const events = blockchain.queryAllEvents();
        const days = parseInt(req.query.days) || 30;

        // Group by day
        const dailyStats = {};
        events.forEach(event => {
            const date = new Date(event.timestamp).toISOString().split('T')[0];
            if (!dailyStats[date]) {
                dailyStats[date] = { total: 0, byType: {} };
            }
            dailyStats[date].total++;
            dailyStats[date].byType[event.eventType] =
                (dailyStats[date].byType[event.eventType] || 0) + 1;
        });

        res.json({
            success: true,
            trends: {
                dailyStats,
                periodDays: days,
                summary: {
                    totalDays: Object.keys(dailyStats).length,
                    averageEventsPerDay: (events.length / Object.keys(dailyStats).length).toFixed(2),
                    peakDay: Object.entries(dailyStats)
                        .sort((a, b) => b[1].total - a[1].total)[0]
                }
            }
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
