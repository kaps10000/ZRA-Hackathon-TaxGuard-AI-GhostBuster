const express = require('express');
const router = express.Router();
const SecurityScanner = require('../services/securityScanner');
const BlockchainService = require('../services/blockchainService');
const SecurityValidationMiddleware = require('../middleware/securityValidation');
const { getModels } = require('../models');
const { QueryTypes } = require('sequelize');

/**
 * Security Routes for ZRA Officers
 * Provides comprehensive security scanning, verification, and dashboard features
 */

// Initialize services
const scanner = new SecurityScanner();
const blockchain = new BlockchainService();

/**
 * @route   POST /api/security/scan/:documentId
 * @desc    Perform comprehensive security scan on uploaded document
 * @access  ZRA Officer Only
 */
router.post(
    '/scan/:documentId',
    SecurityValidationMiddleware.requireZRAOfficer,
    SecurityValidationMiddleware.validateSecurityScanRequest,
    SecurityValidationMiddleware.logSecurityEvent,
    async (req, res) => {
        try {
            const { documentId } = req.params;
            const { DocumentSecurity, sequelize } = getModels();

            // Fetch document from database to get file path
            const document = await sequelize.query(
                'SELECT document_id, file_path, filename FROM ocr.documents WHERE document_id = :documentId',
                {
                    replacements: { documentId },
                    type: QueryTypes.SELECT
                }
            );

            if (!document || document.length === 0) {
                return res.status(404).json({
                    success: false,
                    error: 'Document not found',
                    documentId
                });
            }

            const filePath = document[0].file_path;

            // Perform comprehensive security scan
            const scanResults = await scanner.performComprehensiveScan(filePath, {
                documentId,
                officerId: req.officer.id
            });

            // Submit to blockchain
            const blockchainResult = await blockchain.submitSecurityVerification(
                { documentId, filename: document[0].filename },
                scanResults,
                { officerId: req.officer.id }
            );

            // Save scan results to database (ocr.document_security table)
            const securityRecord = await DocumentSecurity.create({
                documentId: documentId,
                fileHashSha256: scanResults.fileIntegrity.sha256,
                fileHashSha512: scanResults.fileIntegrity.sha512,
                originalHash: scanResults.fileIntegrity.md5,
                hashVerified: scanResults.fileIntegrity.verified,

                // Physical security features
                watermarkDetected: scanResults.physicalFeatures.watermark.detected,
                watermarkConfidence: scanResults.physicalFeatures.watermark.confidence || 0,
                watermarkDetails: scanResults.physicalFeatures.watermark,

                hologramDetected: scanResults.physicalFeatures.hologram.detected,
                hologramConfidence: scanResults.physicalFeatures.hologram.confidence || 0,
                hologramDetails: scanResults.physicalFeatures.hologram,

                microprintingDetected: scanResults.physicalFeatures.microprinting.detected,
                microprintingConfidence: scanResults.physicalFeatures.microprinting.confidence || 0,
                microprintingDetails: scanResults.physicalFeatures.microprinting,

                securityThreadDetected: scanResults.physicalFeatures.securityThread.detected,
                securityThreadConfidence: scanResults.physicalFeatures.securityThread.confidence || 0,
                securityThreadDetails: scanResults.physicalFeatures.securityThread,

                uvFeaturesDetected: scanResults.physicalFeatures.uvFeatures.detected,
                uvFeaturesConfidence: scanResults.physicalFeatures.uvFeatures.confidence || 0,
                uvFeaturesDetails: scanResults.physicalFeatures.uvFeatures,

                // Digital security features
                qrCodeDetected: scanResults.digitalFeatures.qrCode.detected,
                qrCodeContent: scanResults.digitalFeatures.qrCode.content,
                qrCodeVerified: scanResults.digitalFeatures.qrCode.verified,
                qrCodeDetails: scanResults.digitalFeatures.qrCode,

                barcodeDetected: scanResults.digitalFeatures.barcode.detected,
                barcodeContent: scanResults.digitalFeatures.barcode.content,
                barcodeVerified: scanResults.digitalFeatures.barcode.verified,
                barcodeDetails: scanResults.digitalFeatures.barcode,

                digitalSignaturePresent: scanResults.digitalFeatures.digitalSignature.present,
                digitalSignatureValid: scanResults.digitalFeatures.digitalSignature.valid,
                digitalSignatureDetails: scanResults.digitalFeatures.digitalSignature,

                serialNumber: scanResults.digitalFeatures.serialNumber.number,
                serialNumberVerified: scanResults.digitalFeatures.serialNumber.verified,
                serialNumberDetails: scanResults.digitalFeatures.serialNumber,

                // Metadata security
                exifData: scanResults.metadataSecurity.exifData,
                exifAnomalies: scanResults.metadataSecurity.exifAnomalies,
                exifTamperingDetected: scanResults.metadataSecurity.tamperingDetected,

                fileFormatValid: scanResults.fileIntegrity.formatValid,
                fileFormatDetails: scanResults.fileIntegrity,

                // Security assessment
                securityScore: scanResults.securityScore,
                securityStatus: scanResults.securityStatus,
                securityFlags: scanResults.anomalies,
                scoreBreakdown: scanResults.scoreBreakdown,

                // Blockchain proof
                blockchainTxId: blockchainResult.blockchainTxId,
                blockchainTimestamp: blockchainResult.timestamp,
                blockchainProof: blockchainResult,

                // Flags
                flagged: scanResults.flagged || false,
                flagReason: scanResults.flagReason || null
            });

            // Log anomalies to anomaly_detection table
            if (scanResults.anomalies && scanResults.anomalies.length > 0) {
                for (const anomaly of scanResults.anomalies) {
                    await sequelize.query(
                        `INSERT INTO ocr.anomaly_detection
                        (document_id, anomaly_type, anomaly_description, confidence_score, severity, detection_method, detection_details)
                        VALUES (:documentId, :type, :description, :confidence, :severity, :method, :details)`,
                        {
                            replacements: {
                                documentId,
                                type: anomaly.type || 'UNKNOWN',
                                description: anomaly.message || anomaly.description,
                                confidence: anomaly.confidence || 0,
                                severity: anomaly.severity || 'MEDIUM',
                                method: anomaly.detectionMethod || 'RULE_BASED',
                                details: JSON.stringify(anomaly)
                            }
                        }
                    );
                }
            }

            res.json({
                success: true,
                message: 'Security scan completed successfully',
                data: {
                    documentId,
                    securityScore: scanResults.securityScore,
                    securityStatus: scanResults.securityStatus,
                    scanResults,
                    blockchain: blockchainResult,
                    databaseRecordId: securityRecord.id,
                    scannedAt: new Date().toISOString(),
                    scannedBy: req.officer.id
                }
            });
        } catch (error) {
            console.error('Security scan error:', error);
            res.status(500).json({
                success: false,
                error: 'Security scan failed',
                details: error.message
            });
        }
    }
);

/**
 * @route   GET /api/security/report/:documentId
 * @desc    Get detailed security report for document
 * @access  ZRA Officer Only
 */
router.get(
    '/report/:documentId',
    SecurityValidationMiddleware.requireZRAOfficer,
    SecurityValidationMiddleware.validateSecurityScanRequest,
    SecurityValidationMiddleware.logSecurityEvent,
    async (req, res) => {
        try {
            const { documentId } = req.params;
            const { DocumentSecurity, sequelize } = getModels();

            // Fetch security report from database
            const securityReport = await DocumentSecurity.findOne({
                where: { documentId }
            });

            if (!securityReport) {
                return res.status(404).json({
                    success: false,
                    error: 'Security report not found for this document',
                    documentId,
                    note: 'Document may not have been scanned yet. Use POST /api/security/scan/:documentId to scan.'
                });
            }

            // Fetch anomalies for this document
            const anomalies = await sequelize.query(
                `SELECT * FROM ocr.anomaly_detection
                 WHERE document_id = :documentId
                 ORDER BY severity DESC, detected_at DESC`,
                {
                    replacements: { documentId },
                    type: QueryTypes.SELECT
                }
            );

            res.json({
                success: true,
                data: {
                    documentId,
                    report: {
                        // File integrity
                        fileIntegrity: {
                            sha256: securityReport.fileHashSha256,
                            sha512: securityReport.fileHashSha512,
                            verified: securityReport.hashVerified
                        },
                        // Physical security features
                        physicalFeatures: {
                            watermark: {
                                detected: securityReport.watermarkDetected,
                                confidence: securityReport.watermarkConfidence,
                                details: securityReport.watermarkDetails
                            },
                            hologram: {
                                detected: securityReport.hologramDetected,
                                confidence: securityReport.hologramConfidence,
                                details: securityReport.hologramDetails
                            },
                            microprinting: {
                                detected: securityReport.microprintingDetected,
                                confidence: securityReport.microprintingConfidence,
                                details: securityReport.microprintingDetails
                            },
                            securityThread: {
                                detected: securityReport.securityThreadDetected,
                                confidence: securityReport.securityThreadConfidence,
                                details: securityReport.securityThreadDetails
                            },
                            uvFeatures: {
                                detected: securityReport.uvFeaturesDetected,
                                confidence: securityReport.uvFeaturesConfidence,
                                details: securityReport.uvFeaturesDetails
                            }
                        },
                        // Digital security features
                        digitalFeatures: {
                            qrCode: {
                                detected: securityReport.qrCodeDetected,
                                content: securityReport.qrCodeContent,
                                verified: securityReport.qrCodeVerified,
                                details: securityReport.qrCodeDetails
                            },
                            barcode: {
                                detected: securityReport.barcodeDetected,
                                content: securityReport.barcodeContent,
                                verified: securityReport.barcodeVerified,
                                details: securityReport.barcodeDetails
                            },
                            digitalSignature: {
                                present: securityReport.digitalSignaturePresent,
                                valid: securityReport.digitalSignatureValid,
                                details: securityReport.digitalSignatureDetails
                            },
                            serialNumber: {
                                number: securityReport.serialNumber,
                                verified: securityReport.serialNumberVerified,
                                details: securityReport.serialNumberDetails
                            }
                        },
                        // Metadata security
                        metadataSecurity: {
                            exifData: securityReport.exifData,
                            exifAnomalies: securityReport.exifAnomalies,
                            tamperingDetected: securityReport.exifTamperingDetected,
                            fileFormatValid: securityReport.fileFormatValid
                        },
                        // Security assessment
                        securityAssessment: {
                            score: securityReport.securityScore,
                            status: securityReport.securityStatus,
                            scoreBreakdown: securityReport.scoreBreakdown,
                            flags: securityReport.securityFlags
                        },
                        // Blockchain proof
                        blockchain: {
                            txId: securityReport.blockchainTxId,
                            timestamp: securityReport.blockchainTimestamp,
                            proof: securityReport.blockchainProof
                        },
                        // Officer verification
                        verification: {
                            verified: securityReport.verifiedBy !== null,
                            verifiedBy: securityReport.verifiedBy,
                            verifiedAt: securityReport.verificationTimestamp,
                            notes: securityReport.officerNotes
                        },
                        // Flags
                        flagged: securityReport.flagged,
                        flagReason: securityReport.flagReason,
                        // Anomalies
                        anomalies: anomalies,
                        anomalyCount: anomalies.length,
                        // Timestamps
                        scannedAt: securityReport.createdAt,
                        lastUpdated: securityReport.updatedAt
                    }
                }
            });
        } catch (error) {
            console.error('Security report error:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to retrieve security report',
                details: error.message
            });
        }
    }
);

/**
 * @route   POST /api/security/verify/:documentId
 * @desc    ZRA officer manual verification/approval of document
 * @access  ZRA Officer Only
 */
router.post(
    '/verify/:documentId',
    SecurityValidationMiddleware.requireZRAOfficer,
    SecurityValidationMiddleware.validateSecurityScanRequest,
    SecurityValidationMiddleware.sanitizeMetadata,
    SecurityValidationMiddleware.logSecurityEvent,
    async (req, res) => {
        try {
            const { documentId } = req.params;
            const { action, notes } = req.body;
            const { DocumentSecurity, sequelize } = getModels();

            // Validate action
            const validActions = ['APPROVE', 'REJECT', 'FLAG', 'REQUEST_REVIEW'];
            if (!validActions.includes(action)) {
                return res.status(400).json({
                    success: false,
                    error: 'Invalid action',
                    validActions
                });
            }

            // Update database with officer verification
            const securityRecord = await DocumentSecurity.findOne({
                where: { documentId }
            });

            if (!securityRecord) {
                return res.status(404).json({
                    success: false,
                    error: 'Security record not found. Document must be scanned first.',
                    documentId
                });
            }

            // Update verification fields
            await securityRecord.update({
                verifiedBy: req.officer.id,
                verificationTimestamp: new Date(),
                officerNotes: notes,
                flagged: action === 'FLAG' || action === 'REJECT',
                flagReason: action === 'FLAG' || action === 'REJECT' ? notes : null
            });

            // Log to audit trail
            await sequelize.query(
                `INSERT INTO ocr.security_audit_log
                (document_id, event_type, event_category, event_details, severity, officer_id, endpoint, http_method)
                VALUES (:documentId, :eventType, :eventCategory, :eventDetails, :severity, :officerId, :endpoint, :httpMethod)`,
                {
                    replacements: {
                        documentId,
                        eventType: action === 'APPROVE' ? 'APPROVE' : action === 'REJECT' ? 'REJECT' : action === 'FLAG' ? 'FLAG' : 'REQUEST_REVIEW',
                        eventCategory: 'OFFICER_ACTION',
                        eventDetails: JSON.stringify({ action, notes, officerId: req.officer.id }),
                        severity: action === 'REJECT' || action === 'FLAG' ? 'WARNING' : 'INFO',
                        officerId: req.officer.id,
                        endpoint: req.originalUrl,
                        httpMethod: 'POST'
                    }
                }
            );

            // Submit verification action to blockchain
            let blockchainResult = null;
            try {
                if (action === 'APPROVE') {
                    blockchainResult = await blockchain.submitSecurityVerification(
                        { documentId, filename: `${documentId}.pdf` },
                        {
                            securityScore: securityRecord.securityScore,
                            securityStatus: securityRecord.securityStatus,
                            fileIntegrity: { sha256: securityRecord.fileHashSha256 }
                        },
                        {
                            officerId: req.officer.id,
                            officerNotes: notes,
                            action: 'APPROVED'
                        }
                    );
                } else if (action === 'FLAG') {
                    blockchainResult = await blockchain.flagDocument(
                        documentId,
                        notes,
                        req.officer.id
                    );
                }
            } catch (blockchainError) {
                console.error('Blockchain submission error:', blockchainError);
                // Continue even if blockchain fails (graceful degradation)
            }

            res.json({
                success: true,
                message: `Document ${action.toLowerCase()}ed successfully`,
                data: {
                    documentId,
                    action,
                    officerId: req.officer.id,
                    notes,
                    verifiedAt: new Date().toISOString(),
                    blockchain: blockchainResult
                }
            });
        } catch (error) {
            console.error('Verification error:', error);
            res.status(500).json({
                success: false,
                error: 'Verification failed',
                details: error.message
            });
        }
    }
);

/**
 * @route   GET /api/security/dashboard
 * @desc    Security overview dashboard for ZRA officers
 * @access  ZRA Officer Only
 */
router.get(
    '/dashboard',
    SecurityValidationMiddleware.requireZRAOfficer,
    SecurityValidationMiddleware.logSecurityEvent,
    async (req, res) => {
        try {
            const { sequelize } = getModels();

            // Fetch real statistics from database
            const [overviewStats] = await sequelize.query(
                `SELECT
                    COUNT(*) as total_documents,
                    COUNT(*) FILTER (WHERE verified_by IS NULL) as pending_review,
                    COUNT(*) FILTER (WHERE flagged = true) as flagged_documents,
                    COUNT(*) FILTER (WHERE verified_by IS NOT NULL AND DATE(verification_timestamp) = CURRENT_DATE) as verified_today
                FROM ocr.document_security`,
                { type: QueryTypes.SELECT }
            );

            const [securityScoreStats] = await sequelize.query(
                `SELECT
                    ROUND(AVG(security_score), 2) as average_score,
                    COUNT(*) FILTER (WHERE security_status = 'SECURE') as secure_count,
                    COUNT(*) FILTER (WHERE security_status = 'ACCEPTABLE') as acceptable_count,
                    COUNT(*) FILTER (WHERE security_status = 'SUSPICIOUS') as suspicious_count,
                    COUNT(*) FILTER (WHERE security_status = 'COMPROMISED') as compromised_count
                FROM ocr.document_security`,
                { type: QueryTypes.SELECT }
            );

            const [anomalyStats] = await sequelize.query(
                `SELECT
                    COUNT(*) as total,
                    COUNT(*) FILTER (WHERE severity = 'HIGH' AND resolved = false) as unresolved_high,
                    COUNT(*) FILTER (WHERE severity = 'MEDIUM' AND resolved = false) as unresolved_medium,
                    COUNT(*) FILTER (WHERE severity = 'LOW' AND resolved = false) as unresolved_low,
                    COUNT(*) FILTER (WHERE resolved = true AND DATE(resolved_at) = CURRENT_DATE) as resolved_today
                FROM ocr.anomaly_detection`,
                { type: QueryTypes.SELECT }
            );

            const recentActivity = await sequelize.query(
                `SELECT
                    event_type,
                    document_id,
                    officer_id,
                    severity,
                    timestamp,
                    event_details
                FROM ocr.security_audit_log
                ORDER BY timestamp DESC
                LIMIT 10`,
                { type: QueryTypes.SELECT }
            );

            // Get blockchain statistics
            const blockchainStats = await blockchain.getStatistics();

            res.json({
                success: true,
                data: {
                    overview: {
                        totalDocuments: parseInt(overviewStats.total_documents) || 0,
                        pendingReview: parseInt(overviewStats.pending_review) || 0,
                        flaggedDocuments: parseInt(overviewStats.flagged_documents) || 0,
                        verifiedToday: parseInt(overviewStats.verified_today) || 0
                    },
                    securityScores: {
                        averageScore: parseFloat(securityScoreStats.average_score) || 0,
                        secureCount: parseInt(securityScoreStats.secure_count) || 0,
                        acceptableCount: parseInt(securityScoreStats.acceptable_count) || 0,
                        suspiciousCount: parseInt(securityScoreStats.suspicious_count) || 0,
                        compromisedCount: parseInt(securityScoreStats.compromised_count) || 0
                    },
                    anomalies: {
                        total: parseInt(anomalyStats.total) || 0,
                        unresolvedHigh: parseInt(anomalyStats.unresolved_high) || 0,
                        unresolvedMedium: parseInt(anomalyStats.unresolved_medium) || 0,
                        unresolvedLow: parseInt(anomalyStats.unresolved_low) || 0,
                        resolvedToday: parseInt(anomalyStats.resolved_today) || 0
                    },
                    recentActivity: recentActivity,
                    blockchain: blockchainStats.statistics || {},
                    lastUpdated: new Date().toISOString()
                }
            });
        } catch (error) {
            console.error('Dashboard error:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to load dashboard',
                details: error.message
            });
        }
    }
);

/**
 * @route   GET /api/security/anomalies
 * @desc    Get list of detected anomalies
 * @access  ZRA Officer Only
 */
router.get(
    '/anomalies',
    SecurityValidationMiddleware.requireZRAOfficer,
    SecurityValidationMiddleware.logSecurityEvent,
    async (req, res) => {
        try {
            const { severity, status, limit = 50, offset = 0 } = req.query;
            const { sequelize } = getModels();

            // Build query with optional filters
            let whereClause = [];
            let replacements = {
                limit: parseInt(limit),
                offset: parseInt(offset)
            };

            if (severity) {
                whereClause.push('severity = :severity');
                replacements.severity = severity;
            }

            if (status === 'resolved') {
                whereClause.push('resolved = true');
            } else if (status === 'unresolved') {
                whereClause.push('resolved = false');
            }

            const whereString = whereClause.length > 0 ? `WHERE ${whereClause.join(' AND ')}` : '';

            // Query database for anomalies
            const anomalies = await sequelize.query(
                `SELECT * FROM ocr.anomaly_detection
                 ${whereString}
                 ORDER BY detected_at DESC
                 LIMIT :limit OFFSET :offset`,
                {
                    replacements,
                    type: QueryTypes.SELECT
                }
            );

            // Get total count
            const [countResult] = await sequelize.query(
                `SELECT COUNT(*) as total FROM ocr.anomaly_detection ${whereString}`,
                {
                    replacements,
                    type: QueryTypes.SELECT
                }
            );

            res.json({
                success: true,
                data: {
                    anomalies: anomalies,
                    total: parseInt(countResult.total),
                    limit: parseInt(limit),
                    offset: parseInt(offset),
                    filters: { severity, status }
                }
            });
        } catch (error) {
            console.error('Anomalies retrieval error:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to retrieve anomalies',
                details: error.message
            });
        }
    }
);

/**
 * @route   POST /api/security/resolve-anomaly/:anomalyId
 * @desc    Resolve or mark anomaly as false positive
 * @access  ZRA Officer Only
 */
router.post(
    '/resolve-anomaly/:anomalyId',
    SecurityValidationMiddleware.requireZRAOfficer,
    SecurityValidationMiddleware.validateAnomalyResolution,
    SecurityValidationMiddleware.sanitizeMetadata,
    SecurityValidationMiddleware.logSecurityEvent,
    async (req, res) => {
        try {
            const { anomalyId } = req.params;
            const { resolution, notes } = req.body;
            const { sequelize } = getModels();

            // Check if anomaly exists
            const [anomaly] = await sequelize.query(
                `SELECT * FROM ocr.anomaly_detection WHERE id = :anomalyId`,
                {
                    replacements: { anomalyId },
                    type: QueryTypes.SELECT
                }
            );

            if (!anomaly) {
                return res.status(404).json({
                    success: false,
                    error: 'Anomaly not found',
                    anomalyId
                });
            }

            // Update database
            await sequelize.query(
                `UPDATE ocr.anomaly_detection
                 SET resolved = true,
                     false_positive = :falsePositive,
                     resolved_by = :resolvedBy,
                     resolved_at = NOW(),
                     resolution_notes = :notes
                 WHERE id = :anomalyId`,
                {
                    replacements: {
                        anomalyId,
                        falsePositive: resolution === 'FALSE_POSITIVE',
                        resolvedBy: req.officer.id,
                        notes
                    }
                }
            );

            // Log to audit trail
            await sequelize.query(
                `INSERT INTO ocr.security_audit_log
                (document_id, event_type, event_category, event_details, severity, officer_id, endpoint, http_method)
                VALUES (:documentId, :eventType, :eventCategory, :eventDetails, :severity, :officerId, :endpoint, :httpMethod)`,
                {
                    replacements: {
                        documentId: anomaly.document_id,
                        eventType: 'RESOLVE_ANOMALY',
                        eventCategory: 'OFFICER_ACTION',
                        eventDetails: JSON.stringify({ anomalyId, resolution, notes }),
                        severity: 'INFO',
                        officerId: req.officer.id,
                        endpoint: req.originalUrl,
                        httpMethod: 'POST'
                    }
                }
            );

            res.json({
                success: true,
                message: 'Anomaly resolved successfully',
                data: {
                    anomalyId,
                    resolution,
                    resolvedBy: req.officer.id,
                    resolvedAt: new Date().toISOString(),
                    notes,
                    documentId: anomaly.document_id
                }
            });
        } catch (error) {
            console.error('Anomaly resolution error:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to resolve anomaly',
                details: error.message
            });
        }
    }
);

/**
 * @route   GET /api/security/audit-log/:documentId
 * @desc    Get complete audit trail for document
 * @access  ZRA Officer Only
 */
router.get(
    '/audit-log/:documentId',
    SecurityValidationMiddleware.requireZRAOfficer,
    SecurityValidationMiddleware.validateSecurityScanRequest,
    SecurityValidationMiddleware.logSecurityEvent,
    async (req, res) => {
        try {
            const { documentId } = req.params;
            const { sequelize } = getModels();

            // Query database for audit trail
            const auditTrail = await sequelize.query(
                `SELECT * FROM ocr.security_audit_log
                 WHERE document_id = :documentId
                 ORDER BY timestamp DESC`,
                {
                    replacements: { documentId },
                    type: QueryTypes.SELECT
                }
            );

            // Also get blockchain history
            const blockchainHistory = await blockchain.getDocumentHistory(documentId);

            res.json({
                success: true,
                data: {
                    documentId,
                    auditTrail: auditTrail,
                    blockchainHistory: blockchainHistory.history || [],
                    totalEvents: auditTrail.length
                }
            });
        } catch (error) {
            console.error('Audit log retrieval error:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to retrieve audit log',
                details: error.message
            });
        }
    }
);

/**
 * @route   POST /api/security/flag/:documentId
 * @desc    Flag document as suspicious
 * @access  ZRA Officer Only
 */
router.post(
    '/flag/:documentId',
    SecurityValidationMiddleware.requireZRAOfficer,
    SecurityValidationMiddleware.validateSecurityScanRequest,
    SecurityValidationMiddleware.sanitizeMetadata,
    SecurityValidationMiddleware.logSecurityEvent,
    async (req, res) => {
        try {
            const { documentId } = req.params;
            const { reason, severity = 'MEDIUM' } = req.body;

            if (!reason || reason.trim().length < 10) {
                return res.status(400).json({
                    success: false,
                    error: 'Flag reason required (minimum 10 characters)'
                });
            }

            // Submit flag to blockchain
            const blockchainResult = await blockchain.flagDocument(
                documentId,
                reason,
                req.officer.id
            );

            // Update database - flag the document in document_security table
            const { DocumentSecurity, sequelize } = getModels();

            const securityRecord = await DocumentSecurity.findOne({
                where: { documentId }
            });

            if (securityRecord) {
                await securityRecord.update({
                    flagged: true,
                    flagReason: reason
                });
            }

            // Log to audit trail
            await sequelize.query(
                `INSERT INTO ocr.security_audit_log
                (document_id, event_type, event_category, event_details, severity, officer_id, endpoint, http_method)
                VALUES (:documentId, :eventType, :eventCategory, :eventDetails, :severity, :officerId, :endpoint, :httpMethod)`,
                {
                    replacements: {
                        documentId,
                        eventType: 'FLAG',
                        eventCategory: 'OFFICER_ACTION',
                        eventDetails: JSON.stringify({ reason, severity, flaggedBy: req.officer.id }),
                        severity: severity.toUpperCase(),
                        officerId: req.officer.id,
                        endpoint: req.originalUrl,
                        httpMethod: 'POST'
                    }
                }
            );

            res.json({
                success: true,
                message: 'Document flagged successfully',
                data: {
                    documentId,
                    flagged: true,
                    reason,
                    severity,
                    flaggedBy: req.officer.id,
                    flaggedAt: new Date().toISOString(),
                    blockchain: blockchainResult
                }
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                error: 'Failed to flag document',
                details: error.message
            });
        }
    }
);

/**
 * @route   GET /api/security/flagged
 * @desc    Get all flagged documents
 * @access  ZRA Officer Only
 */
router.get(
    '/flagged',
    SecurityValidationMiddleware.requireZRAOfficer,
    SecurityValidationMiddleware.logSecurityEvent,
    async (req, res) => {
        try {
            const { limit = 50, offset = 0 } = req.query;
            const { DocumentSecurity, sequelize } = getModels();

            // Query database for flagged documents
            const flaggedDocuments = await DocumentSecurity.findAll({
                where: { flagged: true },
                order: [['updatedAt', 'DESC']],
                limit: parseInt(limit),
                offset: parseInt(offset)
            });

            // Get total count
            const total = await DocumentSecurity.count({
                where: { flagged: true }
            });

            res.json({
                success: true,
                data: {
                    flaggedDocuments: flaggedDocuments.map(doc => ({
                        documentId: doc.documentId,
                        securityScore: doc.securityScore,
                        securityStatus: doc.securityStatus,
                        flagged: doc.flagged,
                        flagReason: doc.flagReason,
                        verifiedBy: doc.verifiedBy,
                        createdAt: doc.createdAt,
                        updatedAt: doc.updatedAt
                    })),
                    total: total,
                    limit: parseInt(limit),
                    offset: parseInt(offset)
                }
            });
        } catch (error) {
            console.error('Flagged documents retrieval error:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to retrieve flagged documents',
                details: error.message
            });
        }
    }
);

/**
 * @route   GET /api/security/statistics
 * @desc    Get comprehensive security statistics
 * @access  ZRA Officer Only
 */
router.get(
    '/statistics',
    SecurityValidationMiddleware.requireZRAOfficer,
    async (req, res) => {
        try {
            const { sequelize } = getModels();

            // Get blockchain statistics
            const blockchainStats = await blockchain.getStatistics();

            // Get database statistics
            const [dbStats] = await sequelize.query(
                `SELECT
                    COUNT(*) as total_documents,
                    COUNT(*) FILTER (WHERE flagged = true) as flagged_count,
                    ROUND(AVG(security_score), 2) as avg_security_score,
                    COUNT(*) FILTER (WHERE security_status = 'SECURE') as secure_count,
                    COUNT(*) FILTER (WHERE security_status = 'ACCEPTABLE') as acceptable_count,
                    COUNT(*) FILTER (WHERE security_status = 'SUSPICIOUS') as suspicious_count,
                    COUNT(*) FILTER (WHERE security_status = 'COMPROMISED') as compromised_count,
                    COUNT(*) FILTER (WHERE qr_code_detected = true) as qr_code_count,
                    COUNT(*) FILTER (WHERE barcode_detected = true) as barcode_count,
                    COUNT(*) FILTER (WHERE watermark_detected = true) as watermark_count,
                    COUNT(*) FILTER (WHERE digital_signature_valid = true) as valid_signatures_count
                FROM ocr.document_security`,
                { type: QueryTypes.SELECT }
            );

            res.json({
                success: true,
                data: {
                    database: {
                        totalDocuments: parseInt(dbStats.total_documents) || 0,
                        flaggedCount: parseInt(dbStats.flagged_count) || 0,
                        avgSecurityScore: parseFloat(dbStats.avg_security_score) || 0,
                        securityStatusDistribution: {
                            secure: parseInt(dbStats.secure_count) || 0,
                            acceptable: parseInt(dbStats.acceptable_count) || 0,
                            suspicious: parseInt(dbStats.suspicious_count) || 0,
                            compromised: parseInt(dbStats.compromised_count) || 0
                        },
                        featureDetection: {
                            qrCodes: parseInt(dbStats.qr_code_count) || 0,
                            barcodes: parseInt(dbStats.barcode_count) || 0,
                            watermarks: parseInt(dbStats.watermark_count) || 0,
                            validSignatures: parseInt(dbStats.valid_signatures_count) || 0
                        }
                    },
                    blockchain: blockchainStats.statistics || {},
                    generatedAt: new Date().toISOString()
                }
            });
        } catch (error) {
            console.error('Statistics retrieval error:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to retrieve statistics',
                details: error.message
            });
        }
    }
);

/**
 * @route   GET /api/security/certificate/:documentId
 * @desc    Generate verification certificate for document
 * @access  Public (for verification purposes)
 */
router.get(
    '/certificate/:documentId',
    SecurityValidationMiddleware.validateSecurityScanRequest,
    async (req, res) => {
        try {
            const { documentId } = req.params;

            // Get verification from blockchain
            const verification = await blockchain.getVerification(documentId);

            if (!verification.success) {
                return res.status(404).json({
                    success: false,
                    error: 'Verification certificate not found'
                });
            }

            // Generate certificate
            const certificate = blockchain.generateVerificationCertificate(verification.data);

            res.json({
                success: true,
                data: certificate
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                error: 'Failed to generate certificate',
                details: error.message
            });
        }
    }
);

/**
 * @route   GET /api/security/health
 * @desc    Health check for security service
 * @access  Public
 */
router.get('/health', async (req, res) => {
    try {
        const blockchainAvailable = await blockchain.isBlockchainAvailable();

        res.json({
            success: true,
            service: 'OCR Security Service',
            status: 'healthy',
            components: {
                api: 'operational',
                blockchain: blockchainAvailable ? 'operational' : 'degraded',
                scanner: 'operational'
            },
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Health check failed',
            details: error.message
        });
    }
});

module.exports = router;
