/**
 * Standalone Test Server for OCR Verification API
 * Run: node test-server.js
 */

const express = require('express');
const crypto = require('crypto');

const app = express();
app.use(express.json());

// Simple CORS
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Content-Type');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
    next();
});

// Mock blockchain storage (in-memory for testing)
const verificationStore = new Map();
let verificationCount = 0;

// Mock contract invocation
const invokeContract = async (contractName, functionName, args) => {
    console.log(`📝 Invoking ${contractName}.${functionName}`, args);
    return {
        txId: crypto.randomBytes(32).toString('hex'),
        blockNumber: Math.floor(Math.random() * 10000) + 1000
    };
};

// Mock contract query
const queryContract = async (contractName, functionName, args) => {
    console.log(`🔍 Querying ${contractName}.${functionName}`, args);
    return verificationStore.get(args[0]) || null;
};

// Helper to determine status from risk score
const getStatus = (score) => {
    if (score <= 30) return 'VALID';
    if (score <= 60) return 'SUSPICIOUS';
    return 'FRAUDULENT';
};

// Helper to calculate hash
const sha256 = (data) => {
    return crypto.createHash('sha256').update(data).digest('hex');
};

// ==================== OCR VERIFICATION ENDPOINTS ====================

/**
 * POST /api/ocr-verification/store
 * Store OCR verification proof
 */
app.post('/api/ocr-verification/store', async (req, res) => {
    try {
        const { docId, docHash, extractedData, riskScore, aiMetadata } = req.body;

        // Validate inputs
        if (!docId || !docHash || !extractedData || riskScore === undefined) {
            return res.status(400).json({
                success: false,
                error: 'Missing required fields: docId, docHash, extractedData, riskScore'
            });
        }

        if (riskScore < 0 || riskScore > 100) {
            return res.status(400).json({
                success: false,
                error: 'Risk score must be between 0 and 100'
            });
        }

        // Check if already exists
        if (verificationStore.has(docId)) {
            return res.status(409).json({
                success: false,
                error: `Document ${docId} already verified`
            });
        }

        // Create verification proof
        const status = getStatus(riskScore);
        const timestamp = new Date().toISOString();

        const proof = {
            docId,
            docHash: sha256(docHash),
            extractedData,
            riskScore,
            verificationStatus: status,
            aiMetadata: aiMetadata || {},
            timestamp,
            verifiedBy: 'test-user',
            flagged: false
        };

        // Invoke contract (mock)
        const result = await invokeContract(
            'OCRVerificationContract',
            'storeDocumentProof',
            [docId, docHash, JSON.stringify(extractedData), riskScore.toString(), JSON.stringify(aiMetadata || {})]
        );

        // Store in mock database
        verificationStore.set(docId, JSON.stringify(proof));
        verificationCount++;

        console.log(`✅ Stored verification for ${docId} with status: ${status}`);

        res.json({
            success: true,
            message: 'Document verification stored on blockchain',
            data: {
                docId,
                transactionId: result.txId,
                blockNumber: result.blockNumber,
                timestamp,
                riskScore,
                verificationStatus: status
            }
        });

    } catch (error) {
        console.error('❌ Error storing verification:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * GET /api/ocr-verification/health
 * Health check
 */
app.get('/api/ocr-verification/health', (req, res) => {
    res.json({
        success: true,
        service: 'OCR Verification API',
        status: 'healthy',
        timestamp: new Date().toISOString(),
        statistics: {
            totalVerifications: verificationCount,
            storedDocuments: verificationStore.size
        }
    });
});

/**
 * GET /api/ocr-verification/:docId
 * Retrieve verification proof
 */
app.get('/api/ocr-verification/:docId', async (req, res) => {
    try {
        const { docId } = req.params;

        if (!docId) {
            return res.status(400).json({
                success: false,
                error: 'Document ID is required'
            });
        }

        // Query contract (mock)
        const result = await queryContract('OCRVerificationContract', 'getDocumentProof', [docId]);

        if (!result) {
            return res.status(404).json({
                success: false,
                error: `Document ${docId} not found on blockchain`
            });
        }

        const proof = JSON.parse(result);

        console.log(`📄 Retrieved verification for ${docId}`);

        res.json({
            success: true,
            data: proof
        });

    } catch (error) {
        console.error('❌ Error retrieving verification:', error);
        res.status(404).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * POST /api/ocr-verification/flag
 * Flag a document as suspicious
 */
app.post('/api/ocr-verification/flag', async (req, res) => {
    try {
        const { docId, reason, flaggedBy } = req.body;

        if (!docId || !reason || !flaggedBy) {
            return res.status(400).json({
                success: false,
                error: 'Missing required fields: docId, reason, flaggedBy'
            });
        }

        // Get existing proof
        const existingProof = verificationStore.get(docId);
        if (!existingProof) {
            return res.status(404).json({
                success: false,
                error: `Document ${docId} not found`
            });
        }

        // Update with flag
        const proof = JSON.parse(existingProof);
        proof.flagged = true;
        proof.flagReason = reason;
        proof.flaggedBy = flaggedBy;
        proof.flaggedAt = new Date().toISOString();

        verificationStore.set(docId, JSON.stringify(proof));

        const result = await invokeContract('OCRVerificationContract', 'flagDocument', [docId, reason, flaggedBy]);

        console.log(`🚩 Flagged document ${docId}: ${reason}`);

        res.json({
            success: true,
            message: 'Document flagged successfully',
            data: {
                docId,
                reason,
                flaggedBy,
                transactionId: result.txId,
                timestamp: proof.flaggedAt
            }
        });

    } catch (error) {
        console.error('❌ Error flagging document:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * GET /api/ocr-verification/query/status/:status
 * Query documents by status
 */
app.get('/api/ocr-verification/query/status/:status', async (req, res) => {
    try {
        const { status } = req.params;

        const validStatuses = ['VALID', 'SUSPICIOUS', 'FRAUDULENT', 'PENDING'];
        if (!validStatuses.includes(status.toUpperCase())) {
            return res.status(400).json({
                success: false,
                error: `Invalid status. Must be one of: ${validStatuses.join(', ')}`
            });
        }

        // Filter by status
        const results = [];
        for (const [key, value] of verificationStore.entries()) {
            const proof = JSON.parse(value);
            if (proof.verificationStatus === status.toUpperCase()) {
                results.push({ Key: key, Record: proof });
            }
        }

        console.log(`🔍 Found ${results.length} documents with status: ${status}`);

        res.json({
            success: true,
            status: status.toUpperCase(),
            data: results
        });

    } catch (error) {
        console.error('❌ Error querying by status:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * GET /api/ocr-verification/flagged
 * Get all flagged documents
 */
app.get('/api/ocr-verification/flagged', async (req, res) => {
    try {
        const results = [];
        for (const [key, value] of verificationStore.entries()) {
            const proof = JSON.parse(value);
            if (proof.flagged) {
                results.push({ Key: key, Record: proof });
            }
        }

        console.log(`🚩 Found ${results.length} flagged documents`);

        res.json({
            success: true,
            data: results
        });

    } catch (error) {
        console.error('❌ Error retrieving flagged documents:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * GET /api/ocr-verification/statistics
 * Get verification statistics
 */
app.get('/api/ocr-verification/statistics', async (req, res) => {
    try {
        const stats = {
            totalVerifications: verificationCount,
            validCount: 0,
            suspiciousCount: 0,
            fraudulentCount: 0,
            flaggedCount: 0,
            lastUpdated: new Date().toISOString()
        };

        for (const [, value] of verificationStore.entries()) {
            const proof = JSON.parse(value);
            if (proof.verificationStatus === 'VALID') stats.validCount++;
            if (proof.verificationStatus === 'SUSPICIOUS') stats.suspiciousCount++;
            if (proof.verificationStatus === 'FRAUDULENT') stats.fraudulentCount++;
            if (proof.flagged) stats.flaggedCount++;
        }

        console.log(`📊 Statistics: ${stats.totalVerifications} total, ${stats.flaggedCount} flagged`);

        res.json({
            success: true,
            data: stats
        });

    } catch (error) {
        console.error('❌ Error retrieving statistics:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * POST /api/ocr-verification/batch
 * Batch verify multiple documents
 */
app.post('/api/ocr-verification/batch', async (req, res) => {
    try {
        const { documents } = req.body;

        if (!documents || !Array.isArray(documents) || documents.length === 0) {
            return res.status(400).json({
                success: false,
                error: 'Documents array is required and must not be empty'
            });
        }

        const results = [];

        for (const doc of documents) {
            try {
                if (!doc.docId || !doc.docHash || !doc.extractedData || doc.riskScore === undefined) {
                    results.push({ docId: doc.docId, success: false, error: 'Missing required fields' });
                    continue;
                }

                const status = getStatus(doc.riskScore);
                const proof = {
                    docId: doc.docId,
                    docHash: sha256(doc.docHash),
                    extractedData: doc.extractedData,
                    riskScore: doc.riskScore,
                    verificationStatus: status,
                    aiMetadata: doc.aiMetadata || {},
                    timestamp: new Date().toISOString(),
                    verifiedBy: 'test-user',
                    flagged: false
                };

                verificationStore.set(doc.docId, JSON.stringify(proof));
                verificationCount++;

                results.push({ docId: doc.docId, success: true, status });
            } catch (error) {
                results.push({ docId: doc.docId, success: false, error: error.message });
            }
        }

        const result = await invokeContract('OCRVerificationContract', 'batchVerify', [JSON.stringify(documents)]);

        console.log(`📦 Batch verified ${documents.length} documents`);

        res.json({
            success: true,
            message: `Batch verification of ${documents.length} documents completed`,
            data: {
                totalDocuments: documents.length,
                results,
                transactionId: result.txId,
                blockNumber: result.blockNumber,
                timestamp: new Date().toISOString()
            }
        });

    } catch (error) {
        console.error('❌ Error in batch verification:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Start server
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log('╔═══════════════════════════════════════════════════════════╗');
    console.log('║     🚀 OCR Verification Test Server Running              ║');
    console.log('╚═══════════════════════════════════════════════════════════╝');
    console.log(`\n📡 Server: http://localhost:${PORT}`);
    console.log(`🏥 Health: http://localhost:${PORT}/api/ocr-verification/health`);
    console.log(`\n📚 Available Endpoints:`);
    console.log(`   POST /api/ocr-verification/store`);
    console.log(`   GET  /api/ocr-verification/:docId`);
    console.log(`   POST /api/ocr-verification/flag`);
    console.log(`   GET  /api/ocr-verification/query/status/:status`);
    console.log(`   GET  /api/ocr-verification/flagged`);
    console.log(`   GET  /api/ocr-verification/statistics`);
    console.log(`   POST /api/ocr-verification/batch`);
    console.log(`\n✅ Ready for testing!\n`);
});
