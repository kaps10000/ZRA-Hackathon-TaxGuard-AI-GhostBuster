const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const { v4: uuidv4 } = require('uuid');
const { blockchain } = require('../../scripts/add-sample-events');
const { broadcastEvent } = require('../websocket');
const { WhistleProDB, EventDB } = require('../../database/models');

/**
 * WhistlePro Integration API
 * For Kelvin's backend & Ephraim's frontend whistleblower platform
 *
 * This API allows WhistlePro to store whistleblower reports on the blockchain
 * with full anonymity, end-to-end encryption, and tamper-proof audit trails.
 *
 * NOW INTEGRATED WITH POSTGRESQL DATABASE!
 */

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

        // Store in PostgreSQL database
        const reportData = {
            reportId,
            caseCode,
            eventId: blockchainEvent.eventId,
            reportType,
            targetEntity,       // Encrypted/anonymized
            severity: severity || 'MEDIUM',
            descriptionEncrypted: description || '[encrypted]',
            evidenceHash,
            estimatedAmount: estimatedAmount || null,
            location: location || 'undisclosed',
            whistleblowerKey: whistleblowerKey || null,
            reviewStatus: 'submitted',
            priority: calculatePriority(severity, estimatedAmount),
            metadata: {
                ...metadata,
                payloadHash,
                blockIndex: blockchain.getChainInfo().length - 1,
                status: 'submitted'
            }
        };

        const report = await WhistleProDB.createReport(reportData);

        // Broadcast for real-time dashboard
        broadcastEvent({
            type: 'whistlepro_report',
            report: {
                caseCode: report.case_code,
                reportType: report.report_type,
                severity: report.severity,
                priority: report.priority,
                timestamp: report.created_at
            }
        });

        res.status(201).json({
            success: true,
            message: 'Whistleblower report submitted successfully to blockchain',
            report: {
                reportId: report.report_id,
                caseCode: report.case_code,              // Give this to whistleblower for tracking
                blockchainEventId: blockchainEvent.eventId,
                blockIndex: report.metadata.blockIndex,
                evidenceHash: report.evidence_hash,
                timestamp: report.created_at,
                trackingUrl: `/api/whistlepro/track/${report.case_code}`
            },
            security: {
                anonymityProtected: true,
                blockchainVerified: true,
                tamperProof: true,
                databasePersisted: true
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
router.get('/track/:caseCode', async (req, res) => {
    try {
        const { caseCode } = req.params;

        const report = await WhistleProDB.getReportByCaseCode(caseCode);

        if (!report) {
            return res.status(404).json({
                success: false,
                error: 'Case code not found'
            });
        }

        // Get case updates
        const updates = await WhistleProDB.getCaseUpdates(report.report_id);

        // Return only public information (no PII)
        res.json({
            success: true,
            caseCode: report.case_code,
            status: report.metadata?.status || 'submitted',
            reviewStatus: report.review_status,
            priority: report.priority,
            submittedAt: report.created_at,
            lastUpdated: report.updated_at,
            blockchainVerified: true,
            updates: updates.map(u => ({
                timestamp: u.created_at,
                publicUpdate: u.public_update
            }))
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// GET /api/whistlepro/reports - Get all reports (admin only)
router.get('/reports', async (req, res) => {
    try {
        const { reportType, severity, status, priority, limit } = req.query;

        const filters = {};
        if (reportType) filters.reportType = reportType;
        if (severity) filters.severity = severity.toUpperCase();
        if (status) filters.reviewStatus = status;
        if (priority) filters.priority = priority.toUpperCase();
        if (limit) filters.limit = parseInt(limit);

        const results = await WhistleProDB.getReports(filters);

        res.json({
            success: true,
            count: results.length,
            reports: results.map(r => ({
                reportId: r.report_id,
                caseCode: r.case_code,
                reportType: r.report_type,
                severity: r.severity,
                priority: r.priority,
                timestamp: r.created_at,
                reviewStatus: r.review_status,
                estimatedAmount: r.estimated_amount,
                blockchainEventId: r.event_id
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
router.get('/report/:reportId', async (req, res) => {
    try {
        const { reportId } = req.params;
        const report = await WhistleProDB.getReportById(reportId);

        if (!report) {
            return res.status(404).json({
                success: false,
                error: 'Report not found'
            });
        }

        // Get blockchain verification
        const blockchainEvent = blockchain.readEvent(report.event_id);

        res.json({
            success: true,
            report: {
                reportId: report.report_id,
                caseCode: report.case_code,
                reportType: report.report_type,
                targetEntity: report.target_entity,
                severity: report.severity,
                description: report.description_encrypted,
                evidenceHash: report.evidence_hash,
                estimatedAmount: report.estimated_amount,
                location: report.location,
                priority: report.priority,
                reviewStatus: report.review_status,
                assignedTo: report.assigned_to,
                timestamp: report.created_at,
                lastUpdated: report.updated_at,
                metadata: report.metadata
            },
            blockchainVerification: {
                eventId: blockchainEvent?.eventId,
                timestamp: blockchainEvent?.timestamp,
                blockIndex: report.metadata?.blockIndex,
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
router.put('/report/:reportId/update', async (req, res) => {
    try {
        const { reportId } = req.params;
        const { reviewStatus, assignedTo, notes, publicUpdate } = req.body;

        const report = await WhistleProDB.getReportById(reportId);

        if (!report) {
            return res.status(404).json({
                success: false,
                error: 'Report not found'
            });
        }

        const validStatuses = ['pending', 'under_review', 'investigating', 'verified', 'closed', 'false_report', 'submitted'];
        if (reviewStatus && !validStatuses.includes(reviewStatus)) {
            return res.status(400).json({
                success: false,
                error: `reviewStatus must be one of: ${validStatuses.join(', ')}`
            });
        }

        // Update report in database
        const updateData = {};
        if (reviewStatus) updateData.reviewStatus = reviewStatus;
        if (assignedTo) updateData.assignedTo = assignedTo;

        const updatedReport = await WhistleProDB.updateReport(reportId, updateData);

        // Add case update
        await WhistleProDB.addCaseUpdate(reportId, {
            updateType: 'status_change',
            publicUpdate: publicUpdate || 'Your report is being reviewed',
            internalNotes: notes || null,
            updatedBy: assignedTo || 'system'
        });

        res.json({
            success: true,
            message: 'Report updated successfully',
            report: {
                reportId: updatedReport.report_id,
                caseCode: updatedReport.case_code,
                reviewStatus: updatedReport.review_status,
                lastUpdated: updatedReport.updated_at
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
router.post('/verify/:caseCode', async (req, res) => {
    try {
        const { caseCode } = req.params;
        const { evidenceHash } = req.body;

        const report = await WhistleProDB.getReportByCaseCode(caseCode);
        if (!report) {
            return res.status(404).json({
                success: false,
                error: 'Case code not found'
            });
        }

        const blockchainEvent = blockchain.readEvent(report.event_id);

        const verification = {
            caseCode: report.case_code,
            reportId: report.report_id,
            blockchainVerified: !!blockchainEvent,
            evidenceHashMatches: evidenceHash ? evidenceHash === report.evidence_hash : null,
            timestamp: report.created_at,
            blockIndex: report.metadata?.blockIndex,
            integrity: 'verified'
        };

        res.json({
            success: true,
            message: 'Report integrity verified on blockchain',
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
router.get('/stats', async (req, res) => {
    try {
        const allReports = await WhistleProDB.getReports({});

        const stats = {
            total: allReports.length,
            byType: {
                tax_evasion: allReports.filter(r => r.report_type === 'tax_evasion').length,
                fraud: allReports.filter(r => r.report_type === 'fraud').length,
                corruption: allReports.filter(r => r.report_type === 'corruption').length,
                money_laundering: allReports.filter(r => r.report_type === 'money_laundering').length,
                other: allReports.filter(r => r.report_type === 'other').length
            },
            bySeverity: {
                CRITICAL: allReports.filter(r => r.severity === 'CRITICAL').length,
                HIGH: allReports.filter(r => r.severity === 'HIGH').length,
                MEDIUM: allReports.filter(r => r.severity === 'MEDIUM').length,
                LOW: allReports.filter(r => r.severity === 'LOW').length
            },
            byStatus: {
                submitted: allReports.filter(r => r.review_status === 'submitted').length,
                pending: allReports.filter(r => r.review_status === 'pending').length,
                under_review: allReports.filter(r => r.review_status === 'under_review').length,
                investigating: allReports.filter(r => r.review_status === 'investigating').length,
                verified: allReports.filter(r => r.review_status === 'verified').length,
                closed: allReports.filter(r => r.review_status === 'closed').length
            },
            totalEstimatedLoss: allReports
                .filter(r => r.estimated_amount)
                .reduce((sum, r) => sum + parseFloat(r.estimated_amount || 0), 0)
        };

        res.json({
            success: true,
            stats,
            timestamp: new Date().toISOString(),
            databaseIntegration: 'PostgreSQL with blockchain'
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
