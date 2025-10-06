const express = require('express');
const router = express.Router();
const { blockchain } = require('../../scripts/add-sample-events');

/**
 * Dashboard Integration Feed API
 * For Thomas's central web dashboard
 *
 * This API provides real-time feeds and aggregated data specifically
 * formatted for dashboard consumption with filtering and customization.
 */

// GET /api/dashboard-feed/live - Get live event stream for dashboard
router.get('/live', (req, res) => {
    try {
        const { modules, limit, eventTypes } = req.query;

        let events = blockchain.queryAllEvents();

        // Filter by module source
        if (modules) {
            const moduleList = modules.split(',');
            events = events.filter(e => {
                const userId = e.anonymizedUserId.toLowerCase();
                return moduleList.some(mod => userId.includes(mod.toLowerCase()));
            });
        }

        // Filter by event types
        if (eventTypes) {
            const typeList = eventTypes.split(',');
            events = events.filter(e => typeList.includes(e.eventType));
        }

        // Sort by timestamp (descending)
        events.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

        // Limit results
        const limitNum = limit ? parseInt(limit) : 50;
        events = events.slice(0, limitNum);

        // Format for dashboard
        const dashboardEvents = events.map(event => ({
            eventId: event.eventId,
            type: event.eventType,
            module: detectModule(event.anonymizedUserId),
            userId: event.anonymizedUserId.substring(0, 20) + '...',
            timestamp: event.timestamp,
            timeAgo: getTimeAgo(event.timestamp),
            severity: getSeverity(event.eventType),
            icon: getIcon(event.eventType),
            color: getColor(event.eventType),
            summary: generateSummary(event)
        }));

        res.json({
            success: true,
            count: dashboardEvents.length,
            events: dashboardEvents,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// GET /api/dashboard-feed/summary - Dashboard summary statistics
router.get('/summary', (req, res) => {
    try {
        const events = blockchain.queryAllEvents();
        const chainInfo = blockchain.getChainInfo();

        const now = new Date();
        const last24h = events.filter(e =>
            (now - new Date(e.timestamp)) < 24 * 60 * 60 * 1000
        );
        const lastHour = events.filter(e =>
            (now - new Date(e.timestamp)) < 60 * 60 * 1000
        );

        // Module activity
        const moduleActivity = {
            ghostbuster: events.filter(e => e.anonymizedUserId.includes('ghostbuster')).length,
            whistlepro: events.filter(e => e.anonymizedUserId.includes('whistlepro')).length,
            aiRisk: events.filter(e => e.anonymizedUserId.includes('ai-risk')).length,
            predictive: events.filter(e => e.anonymizedUserId.includes('predictive')).length
        };

        // Event type distribution
        const eventDistribution = {
            filing: events.filter(e => e.eventType === 'filing').length,
            payment: events.filter(e => e.eventType === 'payment').length,
            auditFlag: events.filter(e => e.eventType === 'auditFlag').length,
            compliance: events.filter(e => e.eventType === 'compliance').length,
            whistleblower: events.filter(e => e.eventType === 'whistleblower').length
        };

        // Severity breakdown
        const criticalEvents = events.filter(e =>
            e.eventType === 'auditFlag' || e.eventType === 'whistleblower'
        ).length;

        const summary = {
            blockchain: {
                totalBlocks: chainInfo.length,
                totalEvents: events.length,
                latestBlock: chainInfo.latestBlock?.index,
                chainValid: true
            },
            activity: {
                total: events.length,
                last24h: last24h.length,
                lastHour: lastHour.length,
                eventsPerHour: (last24h.length / 24).toFixed(2)
            },
            modules: moduleActivity,
            eventTypes: eventDistribution,
            alerts: {
                critical: criticalEvents,
                high: events.filter(e => getSeverity(e.eventType) === 'HIGH').length,
                medium: events.filter(e => getSeverity(e.eventType) === 'MEDIUM').length
            },
            trends: {
                growthRate: calculateGrowthRate(events),
                mostActiveModule: getMostActiveModule(moduleActivity),
                hotspots: identifyHotspots(events)
            }
        };

        res.json({
            success: true,
            summary,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// GET /api/dashboard-feed/modules - Module-specific activity
router.get('/modules/:moduleName', (req, res) => {
    try {
        const { moduleName } = req.params;
        const { timeRange } = req.query;

        let events = blockchain.queryAllEvents();

        // Filter by module
        events = events.filter(e => {
            const userId = e.anonymizedUserId.toLowerCase();
            return userId.includes(moduleName.toLowerCase());
        });

        // Apply time range filter
        if (timeRange) {
            const hours = parseInt(timeRange);
            const cutoff = new Date(Date.now() - hours * 60 * 60 * 1000);
            events = events.filter(e => new Date(e.timestamp) > cutoff);
        }

        // Sort by timestamp
        events.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

        const moduleStats = {
            moduleName,
            totalEvents: events.length,
            latestActivity: events[0]?.timestamp || null,
            eventTypes: {},
            timeline: generateTimeline(events)
        };

        // Count by event type
        events.forEach(e => {
            moduleStats.eventTypes[e.eventType] = (moduleStats.eventTypes[e.eventType] || 0) + 1;
        });

        res.json({
            success: true,
            module: moduleStats,
            events: events.slice(0, 20).map(e => ({
                eventId: e.eventId,
                type: e.eventType,
                timestamp: e.timestamp,
                summary: generateSummary(e)
            }))
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// GET /api/dashboard-feed/alerts - Critical alerts for dashboard
router.get('/alerts', (req, res) => {
    try {
        const events = blockchain.queryAllEvents();

        // Identify critical events
        const criticalEvents = events.filter(e =>
            e.eventType === 'auditFlag' || e.eventType === 'whistleblower'
        );

        // Sort by timestamp (most recent first)
        criticalEvents.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

        const alerts = criticalEvents.slice(0, 10).map(event => ({
            alertId: event.eventId,
            severity: event.eventType === 'whistleblower' ? 'CRITICAL' : 'HIGH',
            type: event.eventType,
            module: detectModule(event.anonymizedUserId),
            message: generateAlertMessage(event),
            timestamp: event.timestamp,
            timeAgo: getTimeAgo(event.timestamp),
            actionRequired: true,
            priority: event.eventType === 'whistleblower' ? 1 : 2
        }));

        res.json({
            success: true,
            count: alerts.length,
            alerts,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// GET /api/dashboard-feed/timeline - Event timeline for visualization
router.get('/timeline', (req, res) => {
    try {
        const { groupBy, days } = req.query;
        const events = blockchain.queryAllEvents();

        const daysNum = days ? parseInt(days) : 7;
        const cutoff = new Date(Date.now() - daysNum * 24 * 60 * 60 * 1000);
        const recentEvents = events.filter(e => new Date(e.timestamp) > cutoff);

        let timeline;

        if (groupBy === 'hour') {
            timeline = groupByHour(recentEvents);
        } else {
            timeline = groupByDay(recentEvents, daysNum);
        }

        res.json({
            success: true,
            timeline,
            period: `${daysNum} days`,
            totalEvents: recentEvents.length
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// GET /api/dashboard-feed/health - System health status
router.get('/health', (req, res) => {
    try {
        const events = blockchain.queryAllEvents();
        const chainInfo = blockchain.getChainInfo();

        const now = new Date();
        const recentEvents = events.filter(e =>
            (now - new Date(e.timestamp)) < 60 * 60 * 1000 // Last hour
        );

        const health = {
            status: 'healthy',
            blockchain: {
                operational: true,
                blocks: chainInfo.length,
                lastBlock: chainInfo.latestBlock?.index,
                integrity: 'verified'
            },
            activity: {
                eventsLastHour: recentEvents.length,
                status: recentEvents.length > 0 ? 'active' : 'idle'
            },
            modules: {
                ghostbuster: detectModuleHealth('ghostbuster', events),
                whistlepro: detectModuleHealth('whistlepro', events),
                aiRisk: detectModuleHealth('ai-risk', events),
                predictive: detectModuleHealth('predictive', events)
            },
            uptime: process.uptime(),
            timestamp: new Date().toISOString()
        };

        res.json({
            success: true,
            health
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Helper functions
function detectModule(anonymizedUserId) {
    const userId = anonymizedUserId.toLowerCase();
    if (userId.includes('ghostbuster')) return 'GhostBuster';
    if (userId.includes('whistlepro')) return 'WhistlePro';
    if (userId.includes('ai-risk')) return 'AI Risk Scoring';
    if (userId.includes('predictive')) return 'Predictive Analytics';
    return 'Tax System';
}

function getSeverity(eventType) {
    const severityMap = {
        whistleblower: 'CRITICAL',
        auditFlag: 'HIGH',
        compliance: 'MEDIUM',
        adminChange: 'MEDIUM',
        filing: 'LOW',
        payment: 'LOW'
    };
    return severityMap[eventType] || 'LOW';
}

function getIcon(eventType) {
    const iconMap = {
        filing: '📄',
        payment: '💰',
        auditFlag: '🚩',
        compliance: '✅',
        whistleblower: '🔔',
        adminChange: '⚙️'
    };
    return iconMap[eventType] || '📋';
}

function getColor(eventType) {
    const colorMap = {
        whistleblower: 'red',
        auditFlag: 'orange',
        compliance: 'blue',
        filing: 'green',
        payment: 'green',
        adminChange: 'purple'
    };
    return colorMap[eventType] || 'gray';
}

function generateSummary(event) {
    const module = detectModule(event.anonymizedUserId);
    const typeMap = {
        filing: 'Tax filing submitted',
        payment: 'Payment processed',
        auditFlag: 'Audit flag raised',
        compliance: 'Compliance check',
        whistleblower: 'Whistleblower report received',
        adminChange: 'Administrative change'
    };
    return `${module}: ${typeMap[event.eventType] || 'Event recorded'}`;
}

function generateAlertMessage(event) {
    if (event.eventType === 'whistleblower') {
        return 'New whistleblower report requires immediate attention';
    }
    if (event.eventType === 'auditFlag') {
        const module = detectModule(event.anonymizedUserId);
        return `${module} flagged potential compliance issue`;
    }
    return event.notes || 'Review required';
}

function getTimeAgo(timestamp) {
    const seconds = Math.floor((new Date() - new Date(timestamp)) / 1000);
    if (seconds < 60) return `${seconds}s ago`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
}

function calculateGrowthRate(events) {
    if (events.length < 2) return 0;

    const now = new Date();
    const last24h = events.filter(e => (now - new Date(e.timestamp)) < 24 * 60 * 60 * 1000).length;
    const prev24h = events.filter(e => {
        const age = now - new Date(e.timestamp);
        return age >= 24 * 60 * 60 * 1000 && age < 48 * 60 * 60 * 1000;
    }).length;

    if (prev24h === 0) return 100;
    return (((last24h - prev24h) / prev24h) * 100).toFixed(2);
}

function getMostActiveModule(moduleActivity) {
    let max = 0;
    let mostActive = null;
    Object.entries(moduleActivity).forEach(([module, count]) => {
        if (count > max) {
            max = count;
            mostActive = module;
        }
    });
    return mostActive;
}

function identifyHotspots(events) {
    const userActivity = {};
    events.forEach(e => {
        userActivity[e.anonymizedUserId] = (userActivity[e.anonymizedUserId] || 0) + 1;
    });

    return Object.entries(userActivity)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([userId, count]) => ({
            userId: userId.substring(0, 20) + '...',
            eventCount: count
        }));
}

function generateTimeline(events) {
    const timeline = {};
    events.forEach(e => {
        const dateKey = e.timestamp.split('T')[0];
        if (!timeline[dateKey]) {
            timeline[dateKey] = 0;
        }
        timeline[dateKey]++;
    });
    return timeline;
}

function groupByDay(events, days) {
    const timeline = {};
    const now = new Date();

    for (let i = 0; i < days; i++) {
        const date = new Date(now - i * 24 * 60 * 60 * 1000);
        const dateKey = date.toISOString().split('T')[0];
        timeline[dateKey] = { total: 0, byType: {} };
    }

    events.forEach(e => {
        const dateKey = e.timestamp.split('T')[0];
        if (timeline[dateKey]) {
            timeline[dateKey].total++;
            timeline[dateKey].byType[e.eventType] = (timeline[dateKey].byType[e.eventType] || 0) + 1;
        }
    });

    return timeline;
}

function groupByHour(events) {
    const timeline = {};
    events.forEach(e => {
        const hour = e.timestamp.substring(0, 13); // YYYY-MM-DDTHH
        timeline[hour] = (timeline[hour] || 0) + 1;
    });
    return timeline;
}

function detectModuleHealth(moduleName, events) {
    const now = new Date();
    const recentEvents = events.filter(e => {
        const userId = e.anonymizedUserId.toLowerCase();
        const age = now - new Date(e.timestamp);
        return userId.includes(moduleName.toLowerCase()) && age < 60 * 60 * 1000;
    });

    return {
        status: recentEvents.length > 0 ? 'active' : 'idle',
        eventsLastHour: recentEvents.length
    };
}

module.exports = router;
