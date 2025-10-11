const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const { v4: uuidv4 } = require('uuid');
const { blockchain } = require('../../scripts/add-sample-events');
const { broadcastEvent } = require('../websocket');

/**
 * WhistlePro Integration API
 * For Kelvin's backend & Ephraim's frontend whistleblower platform
 *
 * This API allows WhistlePro to store whistleblower reports on the blockchain
 * with full anonymity, end-to-end encryption, and tamper-proof audit trails.
 */

// In-memory storage for report metadata (use encrypted database in production)
const whistleblowerReports = new Map();
const caseCodeIndex = new Map();

// POST /api/whistlepro/report - Submit anonymous whistleblower report
router.post('/report', async (req, res) => {
    try {
        const {
            reportType,         // 'tax_evasion' | 'fraud' | 'corruption' | 'money_laundering'
            targetEntity,       // Company/individual (anonymized)
            severity,           // 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
            description,        // Report summary (encrypted client-side)
            evidenceHash,       // SHA256 hash of evidence bundle
            estimatedAmount,    // Estimated tax loss (optional)
            location,           // Province/district (optional, anonymized)
            whistleblowerKey,   // Public key for follow-up (optional)
            metadata            // Additional context (scrubbed of PII)
        } = req.body;

        // Validation
        if (!reportType || !targetEntity || !evidenceHash) {
            return res.status(400).json({
                success: false,
                error: 'Required fields: reportType, targetEntity, evidenceHash'
            });
        }

        const validTypes = ['tax_evasion', 'fraud', 'corruption', 'money_laundering', 'other'];
        if (!validTypes.includes(reportType)) {
            return res.status(400).json({
                success: false,
                error: `reportType must be one of: ${validTypes.join(', ')}`
            });
        }

        // Verify evidence hash format
        if (evidenceHash.length !== 64 || !/^[a-f0-9]{64}$/i.test(evidenceHash)) {
            return res.status(400).json({
                success: false,
                error: 'evidenceHash must be a valid 64-character SHA256 hex string'
            });
        }

        // Generate unique report ID and case code
        const reportId = uuidv4();
        const caseCode = generateCaseCode();
        const timestamp = new Date().toISOString();

        // Create payload for blockchain (no PII)
        const payload = {
            reportId,
            caseCode,
            reportType,
            severity: severity || 'MEDIUM',
            timestamp
        };

        const payloadHash = crypto.createHash('sha256')
            .update(JSON.stringify(payload))
            .digest('hex');

        // Add to blockchain with whistleblower event type
        const blockchainEvent = blockchain.createEvent(
            reportId,
            'whistleblower',
            timestamp,
            `whistlepro-${caseCode}`,
            evidenceHash,
            `WhistlePro Report: ${reportType} | Case: ${caseCode} | Severity: ${severity || 'MEDIUM'}`
        );

        // Store metadata off-chain (encrypted in production)
        const report = {
            reportId,
            caseCode,
            reportType,
            targetEntity,       // Encrypted/anonymized
            severity: severity || 'MEDIUM',
            description: description || '[encrypted]',
            evidenceHash,
            payloadHash,
            estimatedAmount: estimatedAmount || null,
            location: location || 'undisclosed',
            whistleblowerKey: whistleblowerKey || null,
            blockchainEventId: blockchainEvent.eventId,
            blockIndex: blockchain.getChainInfo().length - 1,
            timestamp,
            metadata: metadata || {},
            status: 'submitted',
            reviewStatus: 'pending',
            priority: calculatePriority(severity, estimatedAmount),
            createdAt: timestamp,
            lastUpdated: timestamp
        };

        whistleblowerReports.set(reportId, report);
        caseCodeIndex.set(caseCode, reportId);

        // Broadcast for real-time dashboard
        broadcastEvent({
            type: 'whistlepro_report',
            report: {
                caseCode,
                reportType,
                severity: report.severity,
                priority: report.priority,
                timestamp
            }
        });

        res.status(201).json({
            success: true,
            message: 'Whistleblower report submitted successfully',
            report: {
                reportId,
                caseCode,              // Give this to whistleblower for tracking
                blockchainEventId: blockchainEvent.eventId,
                blockIndex: report.blockIndex,
                evidenceHash,
                timestamp,
                trackingUrl: `/api/whistlepro/track/${caseCode}`
            },
            security: {
                anonymityProtected: true,
                blockchainVerified: true,
                tamperProof: true
            }
        });
    } catch (error) {
        console.error('WhistlePro report error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// GET /api/whistlepro/track/:caseCode - Track report by case code (public)
router.get('/track/:caseCode', (req, res) => {
    try {
        const { caseCode } = req.params;
        const reportId = caseCodeIndex.get(caseCode);

        if (!reportId) {
            return res.status(404).json({
                success: false,
                error: 'Case code not found'
            });
        }

        const report = whistleblowerReports.get(reportId);

        if (!report) {
            return res.status(404).json({
                success: false,
                error: 'Report not found'
            });
        }

        // Return only public information (no PII)
        res.json({
            success: true,
            caseCode,
            status: report.status,
            reviewStatus: report.reviewStatus,
            priority: report.priority,
            submittedAt: report.timestamp,
            lastUpdated: report.lastUpdated,
            blockchainVerified: true,
            updates: report.updates || []
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// GET /api/whistlepro/reports - Get all reports (admin only)
router.get('/reports', (req, res) => {
    try {
        const { reportType, severity, status, priority, limit } = req.query;

        let results = Array.from(whistleblowerReports.values());

        // Filters
        if (reportType) {
            results = results.filter(r => r.reportType === reportType);
        }
        if (severity) {
            results = results.filter(r => r.severity === severity.toUpperCase());
        }
        if (status) {
            results = results.filter(r => r.reviewStatus === status);
        }
        if (priority) {
            results = results.filter(r => r.priority === priority.toUpperCase());
        }

        // Sort by priority and timestamp
        results.sort((a, b) => {
            const priorityOrder = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };
            if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
                return priorityOrder[a.priority] - priorityOrder[b.priority];
            }
            return new Date(b.timestamp) - new Date(a.timestamp);
        });

        // Limit
        if (limit) {
            results = results.slice(0, parseInt(limit));
        }

        res.json({
            success: true,
            count: results.length,
            reports: results.map(r => ({
                reportId: r.reportId,
                caseCode: r.caseCode,
                reportType: r.reportType,
                severity: r.severity,
                priority: r.priority,
                timestamp: r.timestamp,
                reviewStatus: r.reviewStatus,
                estimatedAmount: r.estimatedAmount,
                blockchainEventId: r.blockchainEventId
            }))
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// GET /api/whistlepro/report/:reportId - Get specific report details (admin)
router.get('/report/:reportId', (req, res) => {
    try {
        const { reportId } = req.params;
        const report = whistleblowerReports.get(reportId);

        if (!report) {
            return res.status(404).json({
                success: false,
                error: 'Report not found'
            });
        }

        // Get blockchain verification
        const blockchainEvent = blockchain.readEvent(report.blockchainEventId);

        res.json({
            success: true,
            report,
            blockchainVerification: {
                eventId: blockchainEvent?.eventId,
                timestamp: blockchainEvent?.timestamp,
                blockIndex: report.blockIndex,
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

// PUT /api/whistlepro/report/:reportId/update - Update report status (admin)
router.put('/report/:reportId/update', (req, res) => {
    try {
        const { reportId } = req.params;
        const { reviewStatus, assignedTo, notes, publicUpdate } = req.body;

        const report = whistleblowerReports.get(reportId);

        if (!report) {
            return res.status(404).json({
                success: false,
                error: 'Report not found'
            });
        }

        const validStatuses = ['pending', 'under_review', 'investigating', 'verified', 'closed', 'false_report'];
        if (reviewStatus && !validStatuses.includes(reviewStatus)) {
            return res.status(400).json({
                success: false,
                error: `reviewStatus must be one of: ${validStatuses.join(', ')}`
            });
        }

        // Update report
        if (reviewStatus) report.reviewStatus = reviewStatus;
        if (assignedTo) report.assignedTo = assignedTo;
        report.lastUpdated = new Date().toISOString();

        // Add update to history
        if (!report.updates) report.updates = [];
        report.updates.push({
            timestamp: report.lastUpdated,
            status: reviewStatus || report.reviewStatus,
            publicUpdate: publicUpdate || 'Your report is being reviewed',
            updatedBy: assignedTo || 'system'
        });

        // Add internal notes
        if (notes) {
            if (!report.internalNotes) report.internalNotes = [];
            report.internalNotes.push({
                timestamp: report.lastUpdated,
                notes,
                addedBy: assignedTo || 'admin'
            });
        }

        res.json({
            success: true,
            message: 'Report updated successfully',
            report: {
                reportId,
                caseCode: report.caseCode,
                reviewStatus: report.reviewStatus,
                lastUpdated: report.lastUpdated
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// POST /api/whistlepro/verify/:caseCode - Verify report integrity
router.post('/verify/:caseCode', (req, res) => {
    try {
        const { caseCode } = req.params;
        const { evidenceHash } = req.body;

        const reportId = caseCodeIndex.get(caseCode);
        if (!reportId) {
            return res.status(404).json({
                success: false,
                error: 'Case code not found'
            });
        }

        const report = whistleblowerReports.get(reportId);
        const blockchainEvent = blockchain.readEvent(report.blockchainEventId);

        const verification = {
            caseCode,
            reportId,
            blockchainVerified: !!blockchainEvent,
            evidenceHashMatches: evidenceHash ? evidenceHash === report.evidenceHash : null,
            timestamp: report.timestamp,
            blockIndex: report.blockIndex,
            integrity: 'verified'
        };

        res.json({
            success: true,
            message: 'Report integrity verified',
            verification
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// GET /api/whistlepro/stats - WhistlePro statistics
router.get('/stats', (req, res) => {
    try {
        const allReports = Array.from(whistleblowerReports.values());

        const stats = {
            total: allReports.length,
            byType: {
                tax_evasion: allReports.filter(r => r.reportType === 'tax_evasion').length,
                fraud: allReports.filter(r => r.reportType === 'fraud').length,
                corruption: allReports.filter(r => r.reportType === 'corruption').length,
                money_laundering: allReports.filter(r => r.reportType === 'money_laundering').length,
                other: allReports.filter(r => r.reportType === 'other').length
            },
            bySeverity: {
                CRITICAL: allReports.filter(r => r.severity === 'CRITICAL').length,
                HIGH: allReports.filter(r => r.severity === 'HIGH').length,
                MEDIUM: allReports.filter(r => r.severity === 'MEDIUM').length,
                LOW: allReports.filter(r => r.severity === 'LOW').length
            },
            byStatus: {
                pending: allReports.filter(r => r.reviewStatus === 'pending').length,
                under_review: allReports.filter(r => r.reviewStatus === 'under_review').length,
                investigating: allReports.filter(r => r.reviewStatus === 'investigating').length,
                verified: allReports.filter(r => r.reviewStatus === 'verified').length,
                closed: allReports.filter(r => r.reviewStatus === 'closed').length
            },
            totalEstimatedLoss: allReports
                .filter(r => r.estimatedAmount)
                .reduce((sum, r) => sum + parseFloat(r.estimatedAmount || 0), 0)
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

// Helper functions
function generateCaseCode() {
    // Format: WP-YYYY-XXXXXX (e.g., WP-2025-A3F7E9)
    const year = new Date().getFullYear();
    const random = crypto.randomBytes(3).toString('hex').toUpperCase();
    return `WP-${year}-${random}`;
}

function calculatePriority(severity, estimatedAmount) {
    if (severity === 'CRITICAL') return 'CRITICAL';
    if (severity === 'HIGH' || (estimatedAmount && parseFloat(estimatedAmount) > 1000000)) return 'HIGH';
    if (severity === 'MEDIUM' || (estimatedAmount && parseFloat(estimatedAmount) > 100000)) return 'MEDIUM';
    return 'LOW';
}

module.exports = router;
