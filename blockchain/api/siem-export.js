const express = require('express');
const router = express.Router();
const { blockchain } = require('../scripts/add-sample-events');

/**
 * SIEM Integration and Export Module
 * Supports: Splunk, ELK Stack, Syslog, JSON exports
 */

// GET /api/siem/export/splunk - Export in Splunk format
router.get('/export/splunk', (req, res) => {
    try {
        const events = blockchain.queryAllEvents();

        const splunkEvents = events.map(event => ({
            time: new Date(event.timestamp).getTime() / 1000,
            host: 'taxguard-blockchain',
            source: 'blockchain:events',
            sourcetype: 'taxguard:event',
            event: {
                eventId: event.eventId,
                eventType: event.eventType,
                userId: event.anonymizedUserId,
                blockIndex: event.blockIndex,
                hash: event.hashOfPayload,
                notes: event.notes,
                severity: getSeverity(event.eventType),
                category: 'tax_compliance'
            }
        }));

        res.json({
            success: true,
            format: 'splunk',
            count: splunkEvents.length,
            events: splunkEvents
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// GET /api/siem/export/elk - Export in ELK (Elasticsearch) format
router.get('/export/elk', (req, res) => {
    try {
        const events = blockchain.queryAllEvents();

        const elkEvents = events.map(event => ({
            '@timestamp': event.timestamp,
            '@version': '1',
            message: `Tax event: ${event.eventType} for user ${event.anonymizedUserId}`,
            tags: ['blockchain', 'tax', event.eventType],
            fields: {
                event_id: event.eventId,
                event_type: event.eventType,
                user_id: event.anonymizedUserId,
                block_index: event.blockIndex,
                payload_hash: event.hashOfPayload,
                notes: event.notes,
                severity: getSeverity(event.eventType),
                system: 'taxguard'
            }
        }));

        res.json({
            success: true,
            format: 'elasticsearch',
            count: elkEvents.length,
            events: elkEvents
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// GET /api/siem/export/syslog - Export in Syslog format
router.get('/export/syslog', (req, res) => {
    try {
        const events = blockchain.queryAllEvents();

        const syslogEvents = events.map(event => {
            const priority = getPriority(event.eventType);
            const timestamp = new Date(event.timestamp).toISOString();
            const hostname = 'taxguard-blockchain';
            const appName = 'blockchain';
            const procId = event.blockIndex;
            const msgId = event.eventType.toUpperCase();

            // RFC 5424 format
            return `<${priority}>1 ${timestamp} ${hostname} ${appName} ${procId} ${msgId} - ` +
                   `eventId="${event.eventId}" userId="${event.anonymizedUserId}" ` +
                   `type="${event.eventType}" hash="${event.hashOfPayload}" ` +
                   `notes="${event.notes.replace(/"/g, '\\"')}"`;
        });

        res.setHeader('Content-Type', 'text/plain');
        res.send(syslogEvents.join('\n'));
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// GET /api/siem/export/json - Export raw JSON for forensic analysis
router.get('/export/json', (req, res) => {
    try {
        const events = blockchain.queryAllEvents();
        const chainInfo = blockchain.getChainInfo();

        const forensicExport = {
            exportMetadata: {
                exportedAt: new Date().toISOString(),
                version: '1.0.0',
                source: 'TaxGuard Blockchain',
                integrity: 'SHA256',
                totalEvents: events.length,
                blockchainLength: chainInfo.length
            },
            blockchain: {
                latestBlockHash: chainInfo.latestBlock?.hash,
                latestBlockIndex: chainInfo.latestBlock?.index,
                genesisBlockHash: blockchain.chain[0]?.hash
            },
            events: events.map(event => ({
                ...event,
                exportedFields: {
                    severity: getSeverity(event.eventType),
                    category: getCategory(event.eventType),
                    riskLevel: getRiskLevel(event),
                    complianceImpact: getComplianceImpact(event.eventType)
                }
            }))
        };

        res.setHeader('Content-Disposition',
            `attachment; filename="taxguard-export-${Date.now()}.json"`);
        res.json(forensicExport);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// GET /api/siem/export/csv - Export as CSV for Excel analysis
router.get('/export/csv', (req, res) => {
    try {
        const events = blockchain.queryAllEvents();

        // CSV header
        let csv = 'EventID,Timestamp,EventType,UserID,BlockIndex,Hash,Notes,Severity,Category\n';

        // CSV rows
        events.forEach(event => {
            csv += `"${event.eventId}",` +
                   `"${event.timestamp}",` +
                   `"${event.eventType}",` +
                   `"${event.anonymizedUserId}",` +
                   `${event.blockIndex},` +
                   `"${event.hashOfPayload}",` +
                   `"${event.notes.replace(/"/g, '""')}",` +
                   `"${getSeverity(event.eventType)}",` +
                   `"${getCategory(event.eventType)}"\n`;
        });

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition',
            `attachment; filename="taxguard-events-${Date.now()}.csv"`);
        res.send(csv);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// POST /api/siem/stream - Real-time SIEM streaming endpoint
router.post('/stream', (req, res) => {
    const { endpoint, format, filter } = req.body;

    // This would set up real-time streaming to external SIEM
    res.json({
        success: true,
        message: 'SIEM streaming configured',
        config: {
            endpoint,
            format: format || 'json',
            filter: filter || 'all',
            status: 'active'
        }
    });
});

// Helper functions
function getSeverity(eventType) {
    const severityMap = {
        auditFlag: 'HIGH',
        compliance: 'MEDIUM',
        whistleblower: 'HIGH',
        adminChange: 'MEDIUM',
        filing: 'LOW',
        payment: 'LOW'
    };
    return severityMap[eventType] || 'LOW';
}

function getPriority(eventType) {
    // Syslog priority: facility * 8 + severity
    // Facility 16 (local0), Severity based on event type
    const facility = 16;
    const severityMap = {
        auditFlag: 2,        // Critical
        whistleblower: 2,    // Critical
        compliance: 4,       // Warning
        adminChange: 5,      // Notice
        filing: 6,           // Informational
        payment: 6           // Informational
    };
    return facility * 8 + (severityMap[eventType] || 6);
}

function getCategory(eventType) {
    const categoryMap = {
        auditFlag: 'RISK_DETECTION',
        compliance: 'COMPLIANCE_CHECK',
        whistleblower: 'FRAUD_REPORT',
        adminChange: 'SYSTEM_ADMIN',
        filing: 'TAX_FILING',
        payment: 'TAX_PAYMENT'
    };
    return categoryMap[eventType] || 'GENERAL';
}

function getRiskLevel(event) {
    if (event.eventType === 'auditFlag' || event.eventType === 'whistleblower') {
        return 'HIGH';
    }
    if (event.notes.toLowerCase().includes('late') ||
        event.notes.toLowerCase().includes('penalty')) {
        return 'MEDIUM';
    }
    return 'LOW';
}

function getComplianceImpact(eventType) {
    const impactMap = {
        auditFlag: 'NEGATIVE',
        whistleblower: 'NEGATIVE',
        compliance: 'NEUTRAL',
        adminChange: 'NEUTRAL',
        filing: 'POSITIVE',
        payment: 'POSITIVE'
    };
    return impactMap[eventType] || 'NEUTRAL';
}

module.exports = router;
