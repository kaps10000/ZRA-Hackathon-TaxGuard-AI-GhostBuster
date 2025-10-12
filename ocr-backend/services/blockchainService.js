const axios = require('axios');
const SecurityUtils = require('../utils/security');

/**
 * Blockchain Service for OCR Document Verification
 * Integrates with the main blockchain API (port 3001) for immutable timestamping
 * and security proof storage
 */

class BlockchainService {
    constructor() {
        // Blockchain API configuration
        this.blockchainApiUrl = process.env.BLOCKCHAIN_API_URL || 'http://localhost:3001';
        this.apiTimeout = process.env.BLOCKCHAIN_TIMEOUT || 10000; // 10 seconds
        this.retryAttempts = process.env.BLOCKCHAIN_RETRY_ATTEMPTS || 3;
        this.retryDelay = process.env.BLOCKCHAIN_RETRY_DELAY || 2000; // 2 seconds
    }

    /**
     * Submit document security verification to blockchain
     * Creates immutable timestamp and proof of security validation
     *
     * @param {Object} documentData - Document information
     * @param {Object} securityScan - Security scan results
     * @param {Object} options - Additional options
     * @returns {Promise<Object>} - Blockchain transaction result
     */
    async submitSecurityVerification(documentData, securityScan, options = {}) {
        try {
            console.log(`📤 Submitting security verification to blockchain: ${documentData.documentId}`);

            // Prepare blockchain payload
            const payload = this.prepareSecurityPayload(documentData, securityScan, options);

            // Submit to blockchain with retry logic
            const result = await this.submitWithRetry(
                '/api/ocr-verification/store',
                payload
            );

            console.log(`✅ Blockchain submission successful. TX ID: ${result.transactionId}`);

            return {
                success: true,
                blockchainTxId: result.transactionId,
                blockNumber: result.blockNumber,
                timestamp: result.timestamp,
                verificationProof: result.verificationProof,
                blockchainUrl: `${this.blockchainApiUrl}/api/ocr-verification/${documentData.documentId}`
            };
        } catch (error) {
            console.error('❌ Blockchain submission failed:', error.message);

            // Don't throw error - graceful degradation
            // Document can still be processed without blockchain
            return {
                success: false,
                error: error.message,
                blockchainAvailable: false
            };
        }
    }

    /**
     * Prepare security payload for blockchain submission
     * @param {Object} documentData - Document data
     * @param {Object} securityScan - Security scan results
     * @param {Object} options - Additional options
     * @returns {Object} - Blockchain payload
     */
    prepareSecurityPayload(documentData, securityScan, options = {}) {
        return {
            // Document identification
            docId: documentData.documentId,
            docHash: securityScan.fileIntegrity.sha256,
            originalHash: securityScan.fileIntegrity.sha512,

            // Extracted data (if available from OCR)
            extractedData: documentData.ocrData || {},

            // Security assessment
            riskScore: 100 - securityScan.securityScore, // Invert score (0 = secure, 100 = risky)
            verificationStatus: securityScan.securityStatus,

            // Security features detected
            securityFeatures: {
                watermark: securityScan.physicalFeatures.watermark.detected,
                hologram: securityScan.physicalFeatures.hologram.detected,
                microprinting: securityScan.physicalFeatures.microprinting.detected,
                securityThread: securityScan.physicalFeatures.securityThread.detected,
                qrCode: securityScan.digitalFeatures.qrCode.detected,
                barcode: securityScan.digitalFeatures.barcode.detected,
                digitalSignature: securityScan.digitalFeatures.digitalSignature.present
            },

            // AI & metadata
            aiMetadata: {
                securityScore: securityScan.securityScore,
                scoreBreakdown: securityScan.scoreBreakdown,
                anomalyCount: securityScan.anomalies.length,
                metadataTampering: securityScan.metadataSecurity.tamperingDetected,
                scannedAt: securityScan.scannedAt,
                scanMethod: 'comprehensive_security_scan_v1'
            },

            // Officer information (if provided)
            verifiedBy: options.officerId || 'system',
            officerNotes: options.officerNotes || '',

            // Timestamps
            uploadedAt: documentData.uploadedAt || new Date().toISOString(),
            verificationTimestamp: new Date().toISOString(),

            // Additional metadata
            metadata: {
                filename: documentData.filename,
                fileSize: securityScan.fileIntegrity.fileSize,
                mimeType: documentData.mimeType,
                documentType: documentData.documentType || 'UNKNOWN',
                flagged: securityScan.flagged || false,
                flagReason: securityScan.flagReason || null
            }
        };
    }

    /**
     * Submit data to blockchain with retry logic
     * @param {string} endpoint - API endpoint
     * @param {Object} payload - Data payload
     * @returns {Promise<Object>} - Response data
     */
    async submitWithRetry(endpoint, payload) {
        let lastError;

        for (let attempt = 1; attempt <= this.retryAttempts; attempt++) {
            try {
                console.log(`🔄 Blockchain submission attempt ${attempt}/${this.retryAttempts}`);

                const response = await axios.post(
                    `${this.blockchainApiUrl}${endpoint}`,
                    payload,
                    {
                        timeout: this.apiTimeout,
                        headers: {
                            'Content-Type': 'application/json',
                            'X-Service-Name': 'OCR-Backend',
                            'X-Request-ID': this.generateRequestId()
                        }
                    }
                );

                // Check if response is successful
                if (response.data && response.data.success) {
                    return response.data.data || response.data;
                }

                throw new Error(response.data.error || 'Blockchain submission failed');
            } catch (error) {
                lastError = error;

                if (error.code === 'ECONNREFUSED') {
                    console.warn(`⚠️  Blockchain API not available (attempt ${attempt})`);
                } else if (error.code === 'ETIMEDOUT') {
                    console.warn(`⚠️  Blockchain request timeout (attempt ${attempt})`);
                } else {
                    console.warn(`⚠️  Blockchain error: ${error.message} (attempt ${attempt})`);
                }

                // Wait before retry (except on last attempt)
                if (attempt < this.retryAttempts) {
                    await this.delay(this.retryDelay);
                }
            }
        }

        // All retries failed
        throw new Error(`Blockchain submission failed after ${this.retryAttempts} attempts: ${lastError.message}`);
    }

    /**
     * Retrieve document verification from blockchain
     * @param {string} documentId - Document ID
     * @returns {Promise<Object>} - Blockchain verification record
     */
    async getVerification(documentId) {
        try {
            const response = await axios.get(
                `${this.blockchainApiUrl}/api/ocr-verification/${documentId}`,
                {
                    timeout: this.apiTimeout
                }
            );

            if (response.data && response.data.success) {
                return {
                    success: true,
                    data: response.data.data
                };
            }

            return {
                success: false,
                error: 'Verification not found'
            };
        } catch (error) {
            return {
                success: false,
                error: error.message,
                blockchainAvailable: error.code !== 'ECONNREFUSED'
            };
        }
    }

    /**
     * Query blockchain for documents by security status
     * @param {string} status - Security status (SECURE, ACCEPTABLE, SUSPICIOUS, COMPROMISED)
     * @returns {Promise<Object>} - Query results
     */
    async queryBySecurityStatus(status) {
        try {
            const response = await axios.get(
                `${this.blockchainApiUrl}/api/ocr-verification/query/status/${status}`,
                {
                    timeout: this.apiTimeout
                }
            );

            if (response.data && response.data.success) {
                return {
                    success: true,
                    documents: response.data.data,
                    count: response.data.count
                };
            }

            return {
                success: false,
                error: 'Query failed'
            };
        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Get blockchain statistics
     * @returns {Promise<Object>} - Statistics
     */
    async getStatistics() {
        try {
            const response = await axios.get(
                `${this.blockchainApiUrl}/api/ocr-verification/statistics`,
                {
                    timeout: this.apiTimeout
                }
            );

            if (response.data && response.data.success) {
                return {
                    success: true,
                    statistics: response.data.data
                };
            }

            return {
                success: false,
                error: 'Statistics not available'
            };
        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Flag document on blockchain as suspicious
     * @param {string} documentId - Document ID
     * @param {string} reason - Flag reason
     * @param {string} officerId - Officer ID
     * @returns {Promise<Object>} - Flag result
     */
    async flagDocument(documentId, reason, officerId) {
        try {
            const response = await axios.post(
                `${this.blockchainApiUrl}/api/ocr-verification/flag`,
                {
                    docId: documentId,
                    reason: reason,
                    flaggedBy: officerId,
                    flaggedAt: new Date().toISOString()
                },
                {
                    timeout: this.apiTimeout
                }
            );

            if (response.data && response.data.success) {
                return {
                    success: true,
                    flagged: true,
                    transactionId: response.data.transactionId
                };
            }

            return {
                success: false,
                error: 'Flag operation failed'
            };
        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Get complete document history from blockchain
     * @param {string} documentId - Document ID
     * @returns {Promise<Object>} - Document history
     */
    async getDocumentHistory(documentId) {
        try {
            const response = await axios.get(
                `${this.blockchainApiUrl}/api/ocr-verification/history/${documentId}`,
                {
                    timeout: this.apiTimeout
                }
            );

            if (response.data && response.data.success) {
                return {
                    success: true,
                    history: response.data.data
                };
            }

            return {
                success: false,
                error: 'History not found'
            };
        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Check if blockchain API is available
     * @returns {Promise<boolean>} - True if available
     */
    async isBlockchainAvailable() {
        try {
            const response = await axios.get(
                `${this.blockchainApiUrl}/api/ocr-verification/health`,
                {
                    timeout: 3000
                }
            );

            return response.status === 200 && response.data.success === true;
        } catch (error) {
            return false;
        }
    }

    /**
     * Generate unique request ID for tracking
     * @returns {string} - Request ID
     */
    generateRequestId() {
        return `ocr-${Date.now()}-${Math.random().toString(36).substring(2, 10)}`;
    }

    /**
     * Delay helper for retry logic
     * @param {number} ms - Milliseconds to delay
     * @returns {Promise} - Promise that resolves after delay
     */
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Generate blockchain verification certificate (for download/display)
     * @param {Object} verificationData - Verification data from blockchain
     * @returns {Object} - Certificate data
     */
    generateVerificationCertificate(verificationData) {
        return {
            certificateId: `CERT-${verificationData.docId}-${Date.now()}`,
            documentId: verificationData.docId,
            blockchainTxId: verificationData.transactionId,
            blockNumber: verificationData.blockNumber,
            documentHash: verificationData.docHash,
            securityScore: verificationData.aiMetadata?.securityScore || 0,
            verificationStatus: verificationData.verificationStatus,
            timestamp: verificationData.timestamp,
            verifiedBy: verificationData.verifiedBy,

            certificate: {
                statement: `This is to certify that the document ${verificationData.docId} has been verified and recorded on the ZRA TaxGuard blockchain.`,
                blockchainProof: {
                    transactionId: verificationData.transactionId,
                    blockNumber: verificationData.blockNumber,
                    timestamp: verificationData.timestamp
                },
                securityAssessment: {
                    score: verificationData.aiMetadata?.securityScore || 0,
                    status: verificationData.verificationStatus,
                    riskLevel: this.getRiskLevel(verificationData.riskScore)
                },
                verificationUrl: `${this.blockchainApiUrl}/api/ocr-verification/${verificationData.docId}`,
                issuedAt: new Date().toISOString(),
                issuer: 'Zambia Revenue Authority - TaxGuard AI System'
            }
        };
    }

    /**
     * Get human-readable risk level
     * @param {number} riskScore - Risk score (0-100)
     * @returns {string} - Risk level
     */
    getRiskLevel(riskScore) {
        if (riskScore <= 10) return 'MINIMAL';
        if (riskScore <= 30) return 'LOW';
        if (riskScore <= 50) return 'MODERATE';
        if (riskScore <= 70) return 'HIGH';
        return 'CRITICAL';
    }
}

module.exports = BlockchainService;
