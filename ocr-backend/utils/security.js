const crypto = require('crypto');
const fs = require('fs').promises;
const path = require('path');
const { promisify } = require('util');
const exec = promisify(require('child_process').exec);

/**
 * Security Utilities for Document Verification
 * Provides cryptographic hashing, integrity checks, and security validation
 */

class SecurityUtils {
    /**
     * Generate SHA-256 hash from file
     * @param {string} filePath - Path to file
     * @returns {Promise<string>} - Hex string of hash
     */
    static async generateSHA256(filePath) {
        try {
            const fileBuffer = await fs.readFile(filePath);
            const hash = crypto.createHash('sha256');
            hash.update(fileBuffer);
            return hash.digest('hex');
        } catch (error) {
            throw new Error(`SHA-256 generation failed: ${error.message}`);
        }
    }

    /**
     * Generate SHA-512 hash from file (stronger security)
     * @param {string} filePath - Path to file
     * @returns {Promise<string>} - Hex string of hash
     */
    static async generateSHA512(filePath) {
        try {
            const fileBuffer = await fs.readFile(filePath);
            const hash = crypto.createHash('sha512');
            hash.update(fileBuffer);
            return hash.digest('hex');
        } catch (error) {
            throw new Error(`SHA-512 generation failed: ${error.message}`);
        }
    }

    /**
     * Generate multiple hashes for comprehensive fingerprinting
     * @param {string} filePath - Path to file
     * @returns {Promise<Object>} - Object containing multiple hashes
     */
    static async generateDocumentFingerprint(filePath) {
        try {
            const fileBuffer = await fs.readFile(filePath);
            const fileStats = await fs.stat(filePath);

            return {
                sha256: crypto.createHash('sha256').update(fileBuffer).digest('hex'),
                sha512: crypto.createHash('sha512').update(fileBuffer).digest('hex'),
                md5: crypto.createHash('md5').update(fileBuffer).digest('hex'), // For legacy compatibility
                fileSize: fileStats.size,
                timestamp: new Date().toISOString(),
                filename: path.basename(filePath)
            };
        } catch (error) {
            throw new Error(`Document fingerprinting failed: ${error.message}`);
        }
    }

    /**
     * Verify file integrity by comparing hashes
     * @param {string} filePath - Path to file
     * @param {string} originalHash - Original hash to compare against
     * @param {string} algorithm - Hash algorithm (sha256, sha512, md5)
     * @returns {Promise<boolean>} - True if hashes match
     */
    static async verifyFileIntegrity(filePath, originalHash, algorithm = 'sha256') {
        try {
            const fileBuffer = await fs.readFile(filePath);
            const hash = crypto.createHash(algorithm);
            hash.update(fileBuffer);
            const currentHash = hash.digest('hex');

            return currentHash === originalHash;
        } catch (error) {
            throw new Error(`Integrity verification failed: ${error.message}`);
        }
    }

    /**
     * Extract EXIF metadata from image files
     * @param {string} filePath - Path to image file
     * @returns {Promise<Object>} - EXIF metadata object
     */
    static async extractEXIFData(filePath) {
        try {
            // Using exiftool command (requires exiftool installed)
            const { stdout, stderr } = await exec(`exiftool -json "${filePath}"`);

            if (stderr) {
                console.warn('EXIF extraction warning:', stderr);
            }

            const exifData = JSON.parse(stdout);
            return exifData[0] || {};
        } catch (error) {
            // If exiftool is not installed, return basic info
            console.warn('EXIF extraction not available:', error.message);
            return {
                error: 'EXIF extraction not available',
                message: 'Install exiftool for full metadata extraction'
            };
        }
    }

    /**
     * Detect EXIF anomalies that might indicate tampering
     * @param {Object} exifData - EXIF metadata object
     * @returns {Array} - Array of detected anomalies
     */
    static detectEXIFAnomalies(exifData) {
        const anomalies = [];

        // Check for future dates
        if (exifData.CreateDate) {
            const createDate = new Date(exifData.CreateDate);
            if (createDate > new Date()) {
                anomalies.push({
                    type: 'FUTURE_DATE',
                    field: 'CreateDate',
                    value: exifData.CreateDate,
                    severity: 'HIGH',
                    description: 'Document creation date is in the future'
                });
            }
        }

        // Check for modification after creation
        if (exifData.CreateDate && exifData.ModifyDate) {
            const createDate = new Date(exifData.CreateDate);
            const modifyDate = new Date(exifData.ModifyDate);
            const daysDiff = (modifyDate - createDate) / (1000 * 60 * 60 * 24);

            if (daysDiff > 365) {
                anomalies.push({
                    type: 'LATE_MODIFICATION',
                    field: 'ModifyDate',
                    value: `${daysDiff.toFixed(0)} days after creation`,
                    severity: 'MEDIUM',
                    description: 'Document modified long after creation'
                });
            }
        }

        // Check for suspicious software
        const suspiciousSoftware = ['photoshop', 'gimp', 'paint.net', 'pixlr'];
        if (exifData.Software) {
            const software = exifData.Software.toLowerCase();
            if (suspiciousSoftware.some(s => software.includes(s))) {
                anomalies.push({
                    type: 'IMAGE_EDITOR_USED',
                    field: 'Software',
                    value: exifData.Software,
                    severity: 'MEDIUM',
                    description: 'Document processed with image editing software'
                });
            }
        }

        // Check for missing GPS data (if expected for mobile captures)
        if (exifData.Model && exifData.Model.includes('Phone') && !exifData.GPSLatitude) {
            anomalies.push({
                type: 'MISSING_GPS',
                field: 'GPS',
                value: null,
                severity: 'LOW',
                description: 'Mobile device photo missing GPS data'
            });
        }

        return anomalies;
    }

    /**
     * Validate file format and structure
     * @param {string} filePath - Path to file
     * @param {string} expectedMimeType - Expected MIME type
     * @returns {Promise<Object>} - Validation result
     */
    static async validateFileFormat(filePath, expectedMimeType) {
        try {
            const fileBuffer = await fs.readFile(filePath, { encoding: null });
            const fileExt = path.extname(filePath).toLowerCase();

            // Check file signatures (magic numbers)
            const signatures = {
                '.pdf': [0x25, 0x50, 0x44, 0x46], // %PDF
                '.jpg': [0xFF, 0xD8, 0xFF],
                '.jpeg': [0xFF, 0xD8, 0xFF],
                '.png': [0x89, 0x50, 0x4E, 0x47]
            };

            const expectedSignature = signatures[fileExt];
            if (expectedSignature) {
                const fileSignature = Array.from(fileBuffer.slice(0, expectedSignature.length));
                const signatureMatch = expectedSignature.every((byte, index) => byte === fileSignature[index]);

                if (!signatureMatch) {
                    return {
                        valid: false,
                        reason: 'File signature does not match extension',
                        severity: 'HIGH',
                        details: {
                            expectedExtension: fileExt,
                            actualSignature: fileSignature,
                            expectedSignature: expectedSignature
                        }
                    };
                }
            }

            // Additional PDF validation
            if (fileExt === '.pdf') {
                const pdfValidation = await this.validatePDFStructure(fileBuffer);
                if (!pdfValidation.valid) {
                    return pdfValidation;
                }
            }

            return {
                valid: true,
                format: fileExt,
                size: fileBuffer.length,
                mimeType: expectedMimeType
            };
        } catch (error) {
            return {
                valid: false,
                reason: error.message,
                severity: 'CRITICAL'
            };
        }
    }

    /**
     * Validate PDF structure
     * @param {Buffer} buffer - PDF file buffer
     * @returns {Object} - Validation result
     */
    static validatePDFStructure(buffer) {
        try {
            const pdfString = buffer.toString('binary');

            // Check for PDF header
            if (!pdfString.startsWith('%PDF-')) {
                return {
                    valid: false,
                    reason: 'Invalid PDF header',
                    severity: 'HIGH'
                };
            }

            // Check for PDF trailer
            if (!pdfString.includes('%%EOF')) {
                return {
                    valid: false,
                    reason: 'Missing PDF EOF marker',
                    severity: 'MEDIUM'
                };
            }

            // Check for suspicious embedded scripts
            const suspiciousPatterns = [
                '/JavaScript',
                '/JS',
                '/Launch',
                '/EmbeddedFile',
                '/OpenAction'
            ];

            const foundSuspicious = suspiciousPatterns.filter(pattern =>
                pdfString.includes(pattern)
            );

            if (foundSuspicious.length > 0) {
                return {
                    valid: true,
                    warnings: foundSuspicious,
                    reason: 'PDF contains potentially dangerous elements',
                    severity: 'MEDIUM',
                    details: {
                        suspiciousElements: foundSuspicious
                    }
                };
            }

            return {
                valid: true,
                version: pdfString.match(/%PDF-(\d+\.\d+)/)?.[1] || 'unknown'
            };
        } catch (error) {
            return {
                valid: false,
                reason: `PDF validation error: ${error.message}`,
                severity: 'HIGH'
            };
        }
    }

    /**
     * Generate blockchain-ready payload
     * @param {Object} documentData - Document information
     * @returns {Object} - Blockchain payload
     */
    static generateBlockchainPayload(documentData) {
        return {
            docId: documentData.documentId,
            docHash: documentData.fileHash,
            timestamp: new Date().toISOString(),
            securityFingerprint: {
                sha256: documentData.sha256,
                sha512: documentData.sha512,
                fileSize: documentData.fileSize
            },
            securityFeatures: documentData.securityFeatures || {},
            securityScore: documentData.securityScore || 0,
            verifiedBy: documentData.officerId || 'system',
            metadata: {
                filename: documentData.filename,
                uploadedAt: documentData.uploadedAt,
                verificationStatus: documentData.verificationStatus
            }
        };
    }

    /**
     * Calculate comprehensive security score
     * @param {Object} securityData - Security validation results
     * @returns {Object} - Score and status
     */
    static calculateSecurityScore(securityData) {
        let score = 0;
        const weights = {
            hashIntegrity: 20,
            physicalFeatures: 30,
            digitalFeatures: 25,
            metadataSecurity: 15,
            blockchainProof: 10
        };

        // Hash integrity (20 points)
        if (securityData.hashVerified) {
            score += weights.hashIntegrity;
        }

        // Physical features (30 points)
        if (securityData.watermarkDetected) score += 8;
        if (securityData.hologramDetected) score += 8;
        if (securityData.microprintingDetected) score += 7;
        if (securityData.securityThreadDetected) score += 7;

        // Digital features (25 points)
        if (securityData.qrCodeVerified) score += 8;
        if (securityData.digitalSignatureValid) score += 10;
        if (securityData.serialNumberVerified) score += 7;

        // Metadata security (15 points)
        if (!securityData.exifTamperingDetected) score += 8;
        if (securityData.fileFormatValid) score += 7;

        // Blockchain proof (10 points)
        if (securityData.blockchainTxId) score += 10;

        // Determine status
        let status;
        if (score >= 90) status = 'SECURE';
        else if (score >= 70) status = 'ACCEPTABLE';
        else if (score >= 50) status = 'SUSPICIOUS';
        else status = 'COMPROMISED';

        return {
            score,
            status,
            breakdown: {
                hashIntegrity: securityData.hashVerified ? weights.hashIntegrity : 0,
                physicalFeatures: this.calculatePhysicalScore(securityData),
                digitalFeatures: this.calculateDigitalScore(securityData),
                metadataSecurity: this.calculateMetadataScore(securityData),
                blockchainProof: securityData.blockchainTxId ? weights.blockchainProof : 0
            }
        };
    }

    static calculatePhysicalScore(data) {
        let score = 0;
        if (data.watermarkDetected) score += 8;
        if (data.hologramDetected) score += 8;
        if (data.microprintingDetected) score += 7;
        if (data.securityThreadDetected) score += 7;
        return score;
    }

    static calculateDigitalScore(data) {
        let score = 0;
        if (data.qrCodeVerified) score += 8;
        if (data.digitalSignatureValid) score += 10;
        if (data.serialNumberVerified) score += 7;
        return score;
    }

    static calculateMetadataScore(data) {
        let score = 0;
        if (!data.exifTamperingDetected) score += 8;
        if (data.fileFormatValid) score += 7;
        return score;
    }

    /**
     * Generate unique document ID
     * @param {string} prefix - Optional prefix (default: DOC)
     * @returns {string} - Unique document ID
     */
    static generateDocumentId(prefix = 'DOC') {
        const timestamp = Date.now();
        const random = Math.random().toString(36).substring(2, 8).toUpperCase();
        return `${prefix}-${timestamp}-${random}`;
    }

    /**
     * Sanitize filename to prevent directory traversal
     * @param {string} filename - Original filename
     * @returns {string} - Sanitized filename
     */
    static sanitizeFilename(filename) {
        return path.basename(filename).replace(/[^a-zA-Z0-9._-]/g, '_');
    }
}

module.exports = SecurityUtils;
