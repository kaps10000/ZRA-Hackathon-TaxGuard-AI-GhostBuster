const { Contract } = require('fabric-contract-api');
const crypto = require('crypto');

/**
 * OCR Verification Smart Contract for ZRA Import/Export Document Verification
 * Integrates with existing TaxGuard blockchain infrastructure
 */
class OCRVerificationContract extends Contract {

    constructor() {
        super('OCRVerificationContract');
        this.verificationStatus = {
            VALID: 'VALID',
            SUSPICIOUS: 'SUSPICIOUS',
            FRAUDULENT: 'FRAUDULENT',
            PENDING: 'PENDING'
        };
    }

    /**
     * Initialize the OCR verification ledger
     */
    async initLedger(ctx) {
        console.log('🚀 Initializing OCR Verification Ledger...');

        const config = {
            contractVersion: '1.0.0',
            initialized: new Date().toISOString(),
            totalVerifications: 0,
            supportedDocTypes: [
                'invoice',
                'billOfLading',
                'customsForm',
                'manifest',
                'packingList',
                'certificate'
            ],
            riskThresholds: {
                low: 30,      // 0-30: Low risk
                medium: 60,   // 31-60: Medium risk
                high: 100     // 61-100: High risk
            }
        };

        await ctx.stub.putState('OCR_CONFIG', Buffer.from(JSON.stringify(config)));
        console.log('✅ OCR Verification Ledger initialized successfully');
        return JSON.stringify(config);
    }

    /**
     * Store document verification proof on blockchain
     * @param {Context} ctx - Transaction context
     * @param {string} docId - Unique document identifier
     * @param {string} docHash - SHA256 hash of document
     * @param {string} extractedData - JSON string of OCR extracted data
     * @param {string} riskScore - AI-calculated risk score (0-100)
     * @param {string} aiMetadata - JSON string of AI processing metadata
     */
    async storeDocumentProof(ctx, docId, docHash, extractedData, riskScore, aiMetadata) {
        // Validate inputs
        if (!docId || !docHash || !extractedData) {
            throw new Error('Missing required fields: docId, docHash, extractedData');
        }

        const score = parseInt(riskScore);
        if (isNaN(score) || score < 0 || score > 100) {
            throw new Error('Risk score must be between 0 and 100');
        }

        // Check if document already exists
        const existingDoc = await ctx.stub.getState(`DOC_${docId}`);
        if (existingDoc && existingDoc.length > 0) {
            throw new Error(`Document ${docId} already verified`);
        }

        // Parse extracted data
        const extracted = JSON.parse(extractedData);
        const metadata = JSON.parse(aiMetadata);

        // Determine verification status based on risk score
        const status = this._determineStatus(score);

        // Create verification proof
        const proof = {
            docId,
            docHash: this._sha256(docHash),
            extractedData: extracted,
            riskScore: score,
            verificationStatus: status,
            aiMetadata: metadata,
            timestamp: new Date().toISOString(),
            verifiedBy: ctx.clientIdentity.getID(),
            blockNumber: ctx.stub.getTxID(),
            flagged: false,
            integrity: this._calculateIntegrityHash(docId, docHash, extractedData, riskScore)
        };

        // Store on ledger
        await ctx.stub.putState(`DOC_${docId}`, Buffer.from(JSON.stringify(proof)));

        // Increment counter
        await this._incrementVerificationCounter(ctx);

        // Emit event
        ctx.stub.setEvent('DocumentVerified', Buffer.from(JSON.stringify({
            docId,
            status,
            riskScore: score,
            timestamp: proof.timestamp
        })));

        console.log(`✅ Document ${docId} verified with status: ${status}`);
        return JSON.stringify(proof);
    }

    /**
     * Retrieve document verification proof
     * @param {Context} ctx - Transaction context
     * @param {string} docId - Document identifier
     */
    async getDocumentProof(ctx, docId) {
        const proofBytes = await ctx.stub.getState(`DOC_${docId}`);

        if (!proofBytes || proofBytes.length === 0) {
            throw new Error(`Document ${docId} not found on blockchain`);
        }

        const proof = JSON.parse(proofBytes.toString());

        // Verify integrity
        const calculatedHash = this._calculateIntegrityHash(
            proof.docId,
            proof.docHash,
            JSON.stringify(proof.extractedData),
            proof.riskScore.toString()
        );

        proof.integrityVerified = (calculatedHash === proof.integrity);

        return JSON.stringify(proof);
    }

    /**
     * Flag a document as suspicious/fraudulent
     * @param {Context} ctx - Transaction context
     * @param {string} docId - Document identifier
     * @param {string} reason - Reason for flagging
     * @param {string} flaggedBy - Officer who flagged the document
     */
    async flagDocument(ctx, docId, reason, flaggedBy) {
        const proofBytes = await ctx.stub.getState(`DOC_${docId}`);

        if (!proofBytes || proofBytes.length === 0) {
            throw new Error(`Document ${docId} not found`);
        }

        const proof = JSON.parse(proofBytes.toString());

        // Update flagging information
        proof.flagged = true;
        proof.flagReason = reason;
        proof.flaggedBy = flaggedBy;
        proof.flaggedAt = new Date().toISOString();
        proof.flaggedByTxId = ctx.stub.getTxID();

        // Store updated proof
        await ctx.stub.putState(`DOC_${docId}`, Buffer.from(JSON.stringify(proof)));

        // Emit flag event
        ctx.stub.setEvent('DocumentFlagged', Buffer.from(JSON.stringify({
            docId,
            reason,
            flaggedBy,
            timestamp: proof.flaggedAt
        })));

        console.log(`🚩 Document ${docId} flagged: ${reason}`);
        return JSON.stringify(proof);
    }

    /**
     * Query documents by verification status
     * @param {Context} ctx - Transaction context
     * @param {string} status - VALID, SUSPICIOUS, FRAUDULENT, PENDING
     */
    async queryByStatus(ctx, status) {
        const query = {
            selector: {
                verificationStatus: status
            }
        };

        const iterator = await ctx.stub.getQueryResult(JSON.stringify(query));
        return await this._getAllResults(iterator);
    }

    /**
     * Query documents by risk score range
     * @param {Context} ctx - Transaction context
     * @param {string} minScore - Minimum risk score
     * @param {string} maxScore - Maximum risk score
     */
    async queryByRiskRange(ctx, minScore, maxScore) {
        const query = {
            selector: {
                riskScore: {
                    $gte: parseInt(minScore),
                    $lte: parseInt(maxScore)
                }
            }
        };

        const iterator = await ctx.stub.getQueryResult(JSON.stringify(query));
        return await this._getAllResults(iterator);
    }

    /**
     * Get flagged documents
     * @param {Context} ctx - Transaction context
     */
    async getFlaggedDocuments(ctx) {
        const query = {
            selector: {
                flagged: true
            }
        };

        const iterator = await ctx.stub.getQueryResult(JSON.stringify(query));
        return await this._getAllResults(iterator);
    }

    /**
     * Get verification statistics
     * @param {Context} ctx - Transaction context
     */
    async getStatistics(ctx) {
        const configBytes = await ctx.stub.getState('OCR_CONFIG');
        const config = JSON.parse(configBytes.toString());

        const stats = {
            totalVerifications: config.totalVerifications || 0,
            lastUpdated: new Date().toISOString()
        };

        // Count by status
        for (const status of Object.values(this.verificationStatus)) {
            const results = await this.queryByStatus(ctx, status);
            const parsed = JSON.parse(results);
            stats[`${status.toLowerCase()}Count`] = parsed.length;
        }

        return JSON.stringify(stats);
    }

    /**
     * Batch verify multiple documents
     * @param {Context} ctx - Transaction context
     * @param {string} documentsJson - JSON array of documents to verify
     */
    async batchVerify(ctx, documentsJson) {
        const documents = JSON.parse(documentsJson);
        const results = [];

        for (const doc of documents) {
            try {
                const result = await this.storeDocumentProof(
                    ctx,
                    doc.docId,
                    doc.docHash,
                    JSON.stringify(doc.extractedData),
                    doc.riskScore.toString(),
                    JSON.stringify(doc.aiMetadata)
                );
                results.push({ docId: doc.docId, success: true, result });
            } catch (error) {
                results.push({ docId: doc.docId, success: false, error: error.message });
            }
        }

        return JSON.stringify(results);
    }

    // ==================== PRIVATE HELPER METHODS ====================

    /**
     * Determine verification status based on risk score
     */
    _determineStatus(score) {
        if (score <= 30) return this.verificationStatus.VALID;
        if (score <= 60) return this.verificationStatus.SUSPICIOUS;
        return this.verificationStatus.FRAUDULENT;
    }

    /**
     * Calculate SHA256 hash
     */
    _sha256(data) {
        return crypto.createHash('sha256').update(data).digest('hex');
    }

    /**
     * Calculate integrity hash for verification
     */
    _calculateIntegrityHash(docId, docHash, extractedData, riskScore) {
        const combined = `${docId}${docHash}${extractedData}${riskScore}`;
        return this._sha256(combined);
    }

    /**
     * Increment verification counter
     */
    async _incrementVerificationCounter(ctx) {
        const configBytes = await ctx.stub.getState('OCR_CONFIG');
        const config = JSON.parse(configBytes.toString());

        config.totalVerifications = (config.totalVerifications || 0) + 1;
        config.lastVerification = new Date().toISOString();

        await ctx.stub.putState('OCR_CONFIG', Buffer.from(JSON.stringify(config)));
    }

    /**
     * Get all results from iterator
     */
    async _getAllResults(iterator) {
        const allResults = [];
        let result = await iterator.next();

        while (!result.done) {
            const jsonRes = {};
            jsonRes.Key = result.value.key;

            try {
                jsonRes.Record = JSON.parse(result.value.value.toString('utf8'));
            } catch (err) {
                console.error(err);
                jsonRes.Record = result.value.value.toString('utf8');
            }

            allResults.push(jsonRes);
            result = await iterator.next();
        }

        await iterator.close();
        return JSON.stringify(allResults);
    }
}

module.exports = OCRVerificationContract;
