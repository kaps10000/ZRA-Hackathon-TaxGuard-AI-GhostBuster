const SecurityUtils = require('../utils/security');
const SecurityScanner = require('../services/securityScanner');
const path = require('path');
const fs = require('fs').promises;

/**
 * Security Validation Middleware
 * Validates and scans documents for security features before processing
 */

class SecurityValidationMiddleware {
    /**
     * Validate uploaded file security before processing
     * This middleware should be used AFTER file upload middleware
     */
    static async validateUploadedDocument(req, res, next) {
        try {
            // Check if file exists
            if (!req.file) {
                return res.status(400).json({
                    success: false,
                    error: 'No file uploaded',
                    code: 'NO_FILE'
                });
            }

            console.log(`🔒 Security validation started for: ${req.file.filename}`);

            // 1. Basic file validation
            const basicValidation = await SecurityValidationMiddleware.validateBasicSecurity(req.file);
            if (!basicValidation.valid) {
                // Delete uploaded file if it fails validation
                await fs.unlink(req.file.path).catch(err => console.error('File deletion error:', err));

                return res.status(400).json({
                    success: false,
                    error: basicValidation.error,
                    details: basicValidation.details,
                    code: basicValidation.code
                });
            }

            // 2. Generate document fingerprint (hashes)
            const fingerprint = await SecurityUtils.generateDocumentFingerprint(req.file.path);

            // 3. Check for duplicate documents (by hash)
            const duplicateCheck = await SecurityValidationMiddleware.checkForDuplicates(
                fingerprint.sha256,
                req
            );
            if (duplicateCheck.isDuplicate) {
                return res.status(409).json({
                    success: false,
                    error: 'Duplicate document detected',
                    details: duplicateCheck,
                    code: 'DUPLICATE_DOCUMENT'
                });
            }

            // 4. Perform comprehensive security scan
            const scanner = new SecurityScanner();
            const securityScan = await scanner.performComprehensiveScan(req.file.path, {
                documentId: req.body.documentId || SecurityUtils.generateDocumentId()
            });

            // 5. Check if security score meets minimum threshold
            const MIN_SECURITY_SCORE = process.env.MIN_SECURITY_SCORE || 40;
            if (securityScan.securityScore < MIN_SECURITY_SCORE) {
                // Don't reject, but flag for manual review
                securityScan.flagged = true;
                securityScan.flagReason = `Security score ${securityScan.securityScore} below threshold ${MIN_SECURITY_SCORE}`;
                console.warn(`⚠️  Document flagged for manual review: Low security score`);
            }

            // Attach security data to request for downstream processing
            req.securityData = {
                fingerprint,
                securityScan,
                validatedAt: new Date().toISOString(),
                validator: 'SecurityValidationMiddleware'
            };

            console.log(`✅ Security validation passed. Score: ${securityScan.securityScore}/100`);

            next();
        } catch (error) {
            console.error('❌ Security validation error:', error);

            // Don't block the request, but log the error
            req.securityData = {
                error: error.message,
                validationFailed: true
            };

            next();
        }
    }

    /**
     * Validate basic file security (size, type, format)
     * @param {Object} file - Multer file object
     * @returns {Promise<Object>} - Validation result
     */
    static async validateBasicSecurity(file) {
        const errors = [];

        // 1. File size check (max 50MB)
        const MAX_FILE_SIZE = process.env.MAX_FILE_SIZE || 50 * 1024 * 1024;
        if (file.size > MAX_FILE_SIZE) {
            errors.push({
                field: 'size',
                message: `File size (${(file.size / 1024 / 1024).toFixed(2)}MB) exceeds maximum ${(MAX_FILE_SIZE / 1024 / 1024)}MB`,
                severity: 'HIGH'
            });
        }

        // 2. File type check (whitelist)
        const ALLOWED_MIME_TYPES = [
            'application/pdf',
            'image/jpeg',
            'image/jpg',
            'image/png',
            'image/tiff',
            'image/bmp'
        ];

        if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
            errors.push({
                field: 'mimetype',
                message: `File type ${file.mimetype} not allowed`,
                severity: 'HIGH'
            });
        }

        // 3. File extension check
        const ext = path.extname(file.filename).toLowerCase();
        const ALLOWED_EXTENSIONS = ['.pdf', '.jpg', '.jpeg', '.png', '.tiff', '.tif', '.bmp'];

        if (!ALLOWED_EXTENSIONS.includes(ext)) {
            errors.push({
                field: 'extension',
                message: `File extension ${ext} not allowed`,
                severity: 'HIGH'
            });
        }

        // 4. Validate file signature (magic numbers)
        try {
            const formatValidation = await SecurityUtils.validateFileFormat(file.path, file.mimetype);

            if (!formatValidation.valid) {
                errors.push({
                    field: 'signature',
                    message: formatValidation.reason || 'Invalid file signature',
                    severity: formatValidation.severity || 'HIGH',
                    details: formatValidation.details
                });
            }
        } catch (error) {
            errors.push({
                field: 'signature',
                message: `File signature validation failed: ${error.message}`,
                severity: 'MEDIUM'
            });
        }

        // Return validation result
        if (errors.length > 0) {
            return {
                valid: false,
                error: 'File validation failed',
                details: errors,
                code: 'INVALID_FILE'
            };
        }

        return {
            valid: true,
            message: 'File passed basic security validation'
        };
    }

    /**
     * Check if document already exists in database (by hash)
     * @param {string} sha256Hash - SHA-256 hash of document
     * @param {Object} req - Express request object
     * @returns {Promise<Object>} - Duplicate check result
     */
    static async checkForDuplicates(sha256Hash, req) {
        try {
            // TODO: Query database for existing document with same hash
            // For now, return no duplicate
            // In production, this would check the ocr.documents table

            /*
            const existingDoc = await db.query(
                'SELECT document_id, uploaded_at FROM ocr.documents WHERE file_hash_sha256 = $1',
                [sha256Hash]
            );

            if (existingDoc.rows.length > 0) {
                return {
                    isDuplicate: true,
                    existingDocumentId: existingDoc.rows[0].document_id,
                    uploadedAt: existingDoc.rows[0].uploaded_at
                };
            }
            */

            return {
                isDuplicate: false,
                checked: true,
                hash: sha256Hash
            };
        } catch (error) {
            console.error('Duplicate check error:', error);
            return {
                isDuplicate: false,
                checked: false,
                error: error.message
            };
        }
    }

    /**
     * Rate limiting middleware for security endpoints
     * Prevents abuse and automated attacks
     */
    static rateLimitSecurity(req, res, next) {
        // TODO: Implement rate limiting logic
        // For now, pass through
        // In production, use express-rate-limit or similar

        /*
        const limit = rateLimit({
            windowMs: 15 * 60 * 1000, // 15 minutes
            max: 100, // limit each IP to 100 requests per windowMs
            message: 'Too many requests from this IP, please try again later'
        });
        return limit(req, res, next);
        */

        next();
    }

    /**
     * Role-based access control for security endpoints
     * Only authorized ZRA officers can access security features
     */
    static async requireZRAOfficer(req, res, next) {
        try {
            // Check for officer authentication
            const officerId = req.headers['x-officer-id'];
            const officerToken = req.headers['authorization'];

            if (!officerId || !officerToken) {
                return res.status(401).json({
                    success: false,
                    error: 'Unauthorized: ZRA officer authentication required',
                    code: 'UNAUTHORIZED'
                });
            }

            // TODO: Verify officer token with authentication service
            // For now, simple validation
            if (!officerToken.startsWith('Bearer ')) {
                return res.status(401).json({
                    success: false,
                    error: 'Invalid authorization format',
                    code: 'INVALID_AUTH'
                });
            }

            // Attach officer info to request
            req.officer = {
                id: officerId,
                verified: true,
                role: 'zra_officer'
            };

            next();
        } catch (error) {
            return res.status(500).json({
                success: false,
                error: 'Authentication error',
                details: error.message
            });
        }
    }

    /**
     * Validate request body for security scan
     */
    static validateSecurityScanRequest(req, res, next) {
        const { documentId } = req.params;

        if (!documentId) {
            return res.status(400).json({
                success: false,
                error: 'Document ID is required',
                code: 'MISSING_DOCUMENT_ID'
            });
        }

        // Validate document ID format
        if (!/^DOC-\d+-[A-Z0-9]{6}$/.test(documentId)) {
            return res.status(400).json({
                success: false,
                error: 'Invalid document ID format',
                code: 'INVALID_DOCUMENT_ID',
                expectedFormat: 'DOC-{timestamp}-{random}'
            });
        }

        next();
    }

    /**
     * Validate anomaly resolution request
     */
    static validateAnomalyResolution(req, res, next) {
        const { anomalyId } = req.params;
        const { resolution, notes } = req.body;

        const errors = [];

        if (!anomalyId) {
            errors.push('Anomaly ID is required');
        }

        if (!resolution) {
            errors.push('Resolution is required');
        }

        if (resolution && !['RESOLVED', 'FALSE_POSITIVE', 'ESCALATED'].includes(resolution)) {
            errors.push('Invalid resolution value. Must be RESOLVED, FALSE_POSITIVE, or ESCALATED');
        }

        if (!notes || notes.trim().length < 10) {
            errors.push('Resolution notes required (minimum 10 characters)');
        }

        if (errors.length > 0) {
            return res.status(400).json({
                success: false,
                error: 'Validation failed',
                details: errors
            });
        }

        next();
    }

    /**
     * Sanitize file metadata to prevent injection attacks
     */
    static sanitizeMetadata(req, res, next) {
        if (req.body.metadata && typeof req.body.metadata === 'string') {
            try {
                req.body.metadata = JSON.parse(req.body.metadata);
            } catch (error) {
                return res.status(400).json({
                    success: false,
                    error: 'Invalid metadata JSON format'
                });
            }
        }

        // Sanitize string fields
        const sanitizeString = (str) => {
            if (typeof str !== 'string') return str;
            return str
                .replace(/[<>]/g, '') // Remove angle brackets
                .replace(/javascript:/gi, '') // Remove javascript: protocol
                .replace(/on\w+=/gi, '') // Remove inline event handlers
                .trim();
        };

        if (req.body.metadata) {
            Object.keys(req.body.metadata).forEach(key => {
                if (typeof req.body.metadata[key] === 'string') {
                    req.body.metadata[key] = sanitizeString(req.body.metadata[key]);
                }
            });
        }

        if (req.body.notes) {
            req.body.notes = sanitizeString(req.body.notes);
        }

        next();
    }

    /**
     * Log security events to audit trail
     */
    static async logSecurityEvent(req, res, next) {
        try {
            const eventData = {
                timestamp: new Date().toISOString(),
                endpoint: req.originalUrl,
                method: req.method,
                officerId: req.officer?.id || 'anonymous',
                ipAddress: req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress,
                userAgent: req.headers['user-agent'],
                documentId: req.params.documentId || req.body.documentId,
                action: SecurityValidationMiddleware.deriveAction(req)
            };

            // TODO: Store in database (ocr.security_audit_log table)
            console.log('🔐 Security Event:', JSON.stringify(eventData, null, 2));

            // Attach to request for later use
            req.securityAudit = eventData;

            next();
        } catch (error) {
            console.error('Security audit logging error:', error);
            next(); // Don't block request if logging fails
        }
    }

    /**
     * Derive action type from request
     * @param {Object} req - Express request
     * @returns {string} - Action type
     */
    static deriveAction(req) {
        const { method, path } = req;

        if (method === 'POST' && path.includes('/scan')) return 'SECURITY_SCAN';
        if (method === 'POST' && path.includes('/verify')) return 'OFFICER_VERIFICATION';
        if (method === 'POST' && path.includes('/resolve')) return 'ANOMALY_RESOLUTION';
        if (method === 'POST' && path.includes('/flag')) return 'DOCUMENT_FLAG';
        if (method === 'GET' && path.includes('/report')) return 'VIEW_SECURITY_REPORT';
        if (method === 'GET' && path.includes('/dashboard')) return 'VIEW_DASHBOARD';
        if (method === 'POST' && path.includes('/upload')) return 'DOCUMENT_UPLOAD';

        return 'UNKNOWN_ACTION';
    }

    /**
     * Error handler for security middleware
     */
    static handleSecurityError(error, req, res, next) {
        console.error('Security middleware error:', error);

        // Don't expose internal error details in production
        const isDevelopment = process.env.NODE_ENV === 'development';

        res.status(500).json({
            success: false,
            error: 'Security validation failed',
            message: isDevelopment ? error.message : 'An error occurred during security validation',
            code: 'SECURITY_ERROR',
            ...(isDevelopment && { stack: error.stack })
        });
    }
}

module.exports = SecurityValidationMiddleware;
