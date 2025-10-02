const express = require('express');
const router = express.Router();
const { blockchain } = require('../scripts/add-sample-events');

/**
 * Real-Time Anomaly Detection Dashboard
 * Live monitoring and alerting system
 */

// In-memory alert storage
const activeAlerts = [];
const alertThresholds = {
    highFrequency: 10,      // events per hour
    riskScore: 75,          // risk score threshold
    consecutiveFlags: 3,    // consecutive audit flags
    suspiciousPattern: 5    // suspicious pattern count
};

// GET /api/dashboard/overview - Dashboard overview
router.get('/overview', (req, res) => {
    try {
        const events = blockchain.queryAllEvents();
        const chainInfo = blockchain.getChainInfo();

        // Calculate real-time metrics
        const now = new Date();
        const last24h = events.filter(e =>
            (now - new Date(e.timestamp)) < 24 * 60 * 60 * 1000
        );
        const lastHour = events.filter(e =>
            (now - new Date(e.timestamp)) < 60 * 60 * 1000
        );

        // Event type distribution
        const eventDistribution = {};
        events.forEach(e => {
            eventDistribution[e.eventType] = (eventDistribution[e.eventType] || 0) + 1;
        });

        // Active alerts
        const criticalAlerts = activeAlerts.filter(a => a.severity === 'CRITICAL').length;
        const highAlerts = activeAlerts.filter(a => a.severity === 'HIGH').length;

        // User activity
        const activeUsers = new Set(last24h.map(e => e.anonymizedUserId)).size;

        // Risk metrics
        const auditFlags = last24h.filter(e => e.eventType === 'auditFlag').length;
        const complianceEvents = last24h.filter(e => e.eventType === 'compliance').length;

        res.json({
            success: true,
            dashboard: {
                timestamp: new Date().toISOString(),
                blockchain: {
                    totalBlocks: chainInfo.length,
                    totalEvents: events.length,
                    latestBlockHash: chainInfo.latestBlock?.hash?.substring(0, 16) + '...'
                },
                realTimeMetrics: {
                    eventsLast24h: last24h.length,
                    eventsLastHour: lastHour.length,
                    eventsPerHour: (last24h.length / 24).toFixed(2),
                    activeUsers24h: activeUsers
                },
                eventDistribution,
                alerts: {
                    total: activeAlerts.length,
                    critical: criticalAlerts,
                    high: highAlerts,
                    medium: activeAlerts.filter(a => a.severity === 'MEDIUM').length,
                    low: activeAlerts.filter(a => a.severity === 'LOW').length
                },
                riskMetrics: {
                    auditFlagsToday: auditFlags,
                    complianceChecks: complianceEvents,
                    riskLevel: auditFlags > 5 ? 'HIGH' : auditFlags > 2 ? 'MEDIUM' : 'LOW'
                },
                systemHealth: {
                    status: 'OPERATIONAL',
                    uptime: process.uptime(),
                    memoryUsage: (process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2) + ' MB'
                }
            }
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// GET /api/dashboard/alerts - Get active alerts
router.get('/alerts', (req, res) => {
    try {
        const severity = req.query.severity;

        let alerts = activeAlerts;
        if (severity) {
            alerts = alerts.filter(a => a.severity === severity.toUpperCase());
        }

        // Sort by severity and timestamp
        alerts.sort((a, b) => {
            const severityOrder = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };
            if (severityOrder[a.severity] !== severityOrder[b.severity]) {
                return severityOrder[a.severity] - severityOrder[b.severity];
            }
            return new Date(b.timestamp) - new Date(a.timestamp);
        });

        res.json({
            success: true,
            count: alerts.length,
            alerts
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// POST /api/dashboard/detect-anomalies - Run anomaly detection
router.post('/detect-anomalies', (req, res) => {
    try {
        const events = blockchain.queryAllEvents();
        const anomalies = detectAnomalies(events);

        // Create alerts for detected anomalies
        anomalies.forEach(anomaly => {
            const alert = {
                id: `ALERT-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                type: anomaly.type,
                severity: anomaly.severity,
                description: anomaly.description,
                userId: anomaly.userId,
                data: anomaly.data,
                timestamp: new Date().toISOString(),
                status: 'active'
            };
            activeAlerts.push(alert);
        });

        res.json({
            success: true,
            anomaliesDetected: anomalies.length,
            newAlerts: anomalies.length,
            anomalies
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// GET /api/dashboard/activity-stream - Live activity stream
router.get('/activity-stream', (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 20;
        const events = blockchain.queryAllEvents()
            .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
            .slice(0, limit);

        const activityStream = events.map(event => ({
            eventId: event.eventId,
            type: event.eventType,
            userId: event.anonymizedUserId.substring(0, 16) + '...',
            timestamp: event.timestamp,
            timeAgo: getTimeAgo(event.timestamp),
            severity: getSeverityForEvent(event.eventType),
            blockIndex: event.blockIndex
        }));

        res.json({
            success: true,
            count: activityStream.length,
            activityStream
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// GET /api/dashboard/heatmap - Activity heatmap
router.get('/heatmap', (req, res) => {
    try {
        const days = parseInt(req.query.days) || 7;
        const events = blockchain.queryAllEvents();

        const heatmap = {};
        const now = new Date();

        for (let i = 0; i < days; i++) {
            const date = new Date(now - i * 24 * 60 * 60 * 1000);
            const dateKey = date.toISOString().split('T')[0];
            heatmap[dateKey] = { total: 0, byType: {} };
        }

        events.forEach(event => {
            const dateKey = event.timestamp.split('T')[0];
            if (heatmap[dateKey]) {
                heatmap[dateKey].total++;
                heatmap[dateKey].byType[event.eventType] =
                    (heatmap[dateKey].byType[event.eventType] || 0) + 1;
            }
        });

        res.json({
            success: true,
            period: `${days} days`,
            heatmap
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// PUT /api/dashboard/alerts/:alertId/acknowledge - Acknowledge alert
router.put('/alerts/:alertId/acknowledge', (req, res) => {
    try {
        const alertId = req.params.alertId;
        const { acknowledgedBy, notes } = req.body;

        const alert = activeAlerts.find(a => a.id === alertId);

        if (!alert) {
            return res.status(404).json({
                error: 'Alert not found'
            });
        }

        alert.status = 'acknowledged';
        alert.acknowledgedBy = acknowledgedBy;
        alert.acknowledgedAt = new Date().toISOString();
        alert.notes = notes;

        res.json({
            success: true,
            message: 'Alert acknowledged',
            alert
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// DELETE /api/dashboard/alerts/:alertId - Dismiss alert
router.delete('/alerts/:alertId', (req, res) => {
    try {
        const alertId = req.params.alertId;
        const index = activeAlerts.findIndex(a => a.id === alertId);

        if (index === -1) {
            return res.status(404).json({
                error: 'Alert not found'
            });
        }

        const alert = activeAlerts.splice(index, 1)[0];

        res.json({
            success: true,
            message: 'Alert dismissed',
            alert
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// GET /api/dashboard/top-users - Top active users
router.get('/top-users', (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 10;
        const events = blockchain.queryAllEvents();

        const userActivity = {};
        events.forEach(event => {
            const userId = event.anonymizedUserId;
            if (!userActivity[userId]) {
                userActivity[userId] = {
                    userId,
                    totalEvents: 0,
                    riskEvents: 0,
                    lastActivity: event.timestamp
                };
            }
            userActivity[userId].totalEvents++;
            if (event.eventType === 'auditFlag') {
                userActivity[userId].riskEvents++;
            }
        });

        const topUsers = Object.values(userActivity)
            .sort((a, b) => b.totalEvents - a.totalEvents)
            .slice(0, limit);

        res.json({
            success: true,
            count: topUsers.length,
            topUsers
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Helper functions
function detectAnomalies(events) {
    const anomalies = [];
    const now = new Date();
    const lastHour = now - 60 * 60 * 1000;

    // High frequency detection
    const recentEvents = events.filter(e => new Date(e.timestamp) > lastHour);
    const userFreq = {};
    recentEvents.forEach(e => {
        userFreq[e.anonymizedUserId] = (userFreq[e.anonymizedUserId] || 0) + 1;
    });

    Object.entries(userFreq).forEach(([userId, count]) => {
        if (count > alertThresholds.highFrequency) {
            anomalies.push({
                type: 'HIGH_FREQUENCY',
                severity: 'HIGH',
                description: `Unusual high activity: ${count} events in last hour`,
                userId,
                data: { eventsCount: count, threshold: alertThresholds.highFrequency }
            });
        }
    });

    // Consecutive audit flags
    const userEvents = {};
    events.forEach(e => {
        if (!userEvents[e.anonymizedUserId]) userEvents[e.anonymizedUserId] = [];
        userEvents[e.anonymizedUserId].push(e);
    });

    Object.entries(userEvents).forEach(([userId, userEvts]) => {
        const recent = userEvts.slice(-5);
        const flags = recent.filter(e => e.eventType === 'auditFlag').length;
        if (flags >= alertThresholds.consecutiveFlags) {
            anomalies.push({
                type: 'CONSECUTIVE_FLAGS',
                severity: 'CRITICAL',
                description: `Multiple audit flags: ${flags} in last 5 events`,
                userId,
                data: { flagCount: flags }
            });
        }
    });

    return anomalies;
}

function getSeverityForEvent(eventType) {
    const severityMap = {
        auditFlag: 'HIGH',
        whistleblower: 'CRITICAL',
        compliance: 'MEDIUM',
        adminChange: 'MEDIUM',
        filing: 'LOW',
        payment: 'LOW'
    };
    return severityMap[eventType] || 'LOW';
}

function getTimeAgo(timestamp) {
    const seconds = Math.floor((new Date() - new Date(timestamp)) / 1000);

    if (seconds < 60) return `${seconds}s ago`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
}

module.exports = router;
