/**
 * OCR Verification API Module
 * Integrates with existing blockchain/api/index.js
 *
 * Installation:
 * 1. Copy this file to: blockchain/api/ocr-verification.js
 * 2. Add to blockchain/api/index.js:
 *    const ocrVerification = require('./ocr-verification');
 *    app.use('/api/ocr-verification', ocrVerification);
 */

const express = require('express');
const router = express.Router();
const crypto = require('crypto');

// Import from existing blockchain infrastructure
// const { invokeContract, queryContract } = require('./contract-integration');

// For standalone testing, mock these functions:
const invokeContract = async (contractName, functionName, args) => {
    console.log(`Invoking ${contractName}.${functionName}`, args);
    return {
        txId: crypto.randomBytes(32).toString('hex'),
        blockNumber: Math.floor(Math.random() * 10000)
    };
};

const queryContract = async (contractName, functionName, args) => {
    console.log(`Querying ${contractName}.${functionName}`, args);
    return JSON.stringify({
        docId: args[0],
        docHash: crypto.randomBytes(32).toString('hex'),
        verificationStatus: 'VALID',
        riskScore: 15
    });
};

/**
 * @swagger
 * /api/ocr-verification/store:
 *   post:
 *     summary: Store OCR verification proof on blockchain
 *     tags: [OCR Verification]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               docId:
 *                 type: string
 *               docHash:
 *                 type: string
 *               extractedData:
 *                 type: object
 *               riskScore:
 *                 type: number
 *               aiMetadata:
 *                 type: object
 */
router.post('/store', async (req, res) => {
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

        // Invoke blockchain contract
        const result = await invokeContract(
            'OCRVerificationContract',
            'storeDocumentProof',
            [
                docId,
                docHash,
                JSON.stringify(extractedData),
                riskScore.toString(),
                JSON.stringify(aiMetadata || {})
            ]
        );

        res.json({
            success: true,
            message: 'Document verification stored on blockchain',
            data: {
                docId,
                transactionId: result.txId,
                blockNumber: result.blockNumber,
                timestamp: new Date().toISOString(),
                riskScore,
                verificationStatus: riskScore <= 30 ? 'VALID' : riskScore <= 60 ? 'SUSPICIOUS' : 'FRAUDULENT'
            }
        });

    } catch (error) {
        console.error('Error storing OCR verification:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * @swagger
 * /api/ocr-verification/{docId}:
 *   get:
 *     summary: Retrieve verification proof from blockchain
 *     tags: [OCR Verification]
 *     parameters:
 *       - in: path
 *         name: docId
 *         required: true
 *         schema:
 *           type: string
 */
router.get('/:docId', async (req, res) => {
    try {
        const { docId } = req.params;

        if (!docId) {
            return res.status(400).json({
                success: false,
                error: 'Document ID is required'
            });
        }

        // Query blockchain
        const result = await queryContract(
            'OCRVerificationContract',
            'getDocumentProof',
            [docId]
        );

        const proof = JSON.parse(result);

        res.json({
            success: true,
            data: proof
        });

    } catch (error) {
        console.error('Error retrieving verification:', error);
        res.status(404).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * @swagger
 * /api/ocr-verification/flag:
 *   post:
 *     summary: Flag a document as suspicious/fraudulent
 *     tags: [OCR Verification]
 */
router.post('/flag', async (req, res) => {
    try {
        const { docId, reason, flaggedBy } = req.body;

        if (!docId || !reason || !flaggedBy) {
            return res.status(400).json({
                success: false,
                error: 'Missing required fields: docId, reason, flaggedBy'
            });
        }

        // Invoke blockchain contract
        const result = await invokeContract(
            'OCRVerificationContract',
            'flagDocument',
            [docId, reason, flaggedBy]
        );

        res.json({
            success: true,
            message: 'Document flagged successfully',
            data: {
                docId,
                reason,
                flaggedBy,
                transactionId: result.txId,
                timestamp: new Date().toISOString()
            }
        });

    } catch (error) {
        console.error('Error flagging document:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * @swagger
 * /api/ocr-verification/query/status/{status}:
 *   get:
 *     summary: Query documents by verification status
 *     tags: [OCR Verification]
 *     parameters:
 *       - in: path
 *         name: status
 *         required: true
 *         schema:
 *           type: string
 *           enum: [VALID, SUSPICIOUS, FRAUDULENT, PENDING]
 */
router.get('/query/status/:status', async (req, res) => {
    try {
        const { status } = req.params;

        const validStatuses = ['VALID', 'SUSPICIOUS', 'FRAUDULENT', 'PENDING'];
        if (!validStatuses.includes(status.toUpperCase())) {
            return res.status(400).json({
                success: false,
                error: `Invalid status. Must be one of: ${validStatuses.join(', ')}`
            });
        }

        const result = await queryContract(
            'OCRVerificationContract',
            'queryByStatus',
            [status.toUpperCase()]
        );

        res.json({
            success: true,
            status: status.toUpperCase(),
            data: JSON.parse(result)
        });

    } catch (error) {
        console.error('Error querying by status:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * @swagger
 * /api/ocr-verification/query/risk-range:
 *   get:
 *     summary: Query documents by risk score range
 *     tags: [OCR Verification]
 */
router.get('/query/risk-range', async (req, res) => {
    try {
        const { min = 0, max = 100 } = req.query;

        const minScore = parseInt(min);
        const maxScore = parseInt(max);

        if (isNaN(minScore) || isNaN(maxScore) || minScore < 0 || maxScore > 100 || minScore > maxScore) {
            return res.status(400).json({
                success: false,
                error: 'Invalid risk range. Min and max must be between 0-100, with min <= max'
            });
        }

        const result = await queryContract(
            'OCRVerificationContract',
            'queryByRiskRange',
            [minScore.toString(), maxScore.toString()]
        );

        res.json({
            success: true,
            riskRange: { min: minScore, max: maxScore },
            data: JSON.parse(result)
        });

    } catch (error) {
        console.error('Error querying by risk range:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * @swagger
 * /api/ocr-verification/flagged:
 *   get:
 *     summary: Get all flagged documents
 *     tags: [OCR Verification]
 */
router.get('/flagged', async (req, res) => {
    try {
        const result = await queryContract(
            'OCRVerificationContract',
            'getFlaggedDocuments',
            []
        );

        res.json({
            success: true,
            data: JSON.parse(result)
        });

    } catch (error) {
        console.error('Error retrieving flagged documents:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * @swagger
 * /api/ocr-verification/statistics:
 *   get:
 *     summary: Get verification statistics
 *     tags: [OCR Verification]
 */
router.get('/statistics', async (req, res) => {
    try {
        const result = await queryContract(
            'OCRVerificationContract',
            'getStatistics',
            []
        );

        res.json({
            success: true,
            data: JSON.parse(result)
        });

    } catch (error) {
        console.error('Error retrieving statistics:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * @swagger
 * /api/ocr-verification/batch:
 *   post:
 *     summary: Batch verify multiple documents
 *     tags: [OCR Verification]
 */
router.post('/batch', async (req, res) => {
    try {
        const { documents } = req.body;

        if (!documents || !Array.isArray(documents) || documents.length === 0) {
            return res.status(400).json({
                success: false,
                error: 'Documents array is required and must not be empty'
            });
        }

        // Validate each document has required fields
        for (const doc of documents) {
            if (!doc.docId || !doc.docHash || !doc.extractedData || doc.riskScore === undefined) {
                return res.status(400).json({
                    success: false,
                    error: 'Each document must have: docId, docHash, extractedData, riskScore'
                });
            }
        }

        const result = await invokeContract(
            'OCRVerificationContract',
            'batchVerify',
            [JSON.stringify(documents)]
        );

        res.json({
            success: true,
            message: `Batch verification of ${documents.length} documents completed`,
            data: {
                totalDocuments: documents.length,
                transactionId: result.txId,
                blockNumber: result.blockNumber,
                timestamp: new Date().toISOString()
            }
        });

    } catch (error) {
        console.error('Error in batch verification:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * Health check endpoint
 */
router.get('/health', (req, res) => {
    res.json({
        success: true,
        service: 'OCR Verification API',
        status: 'healthy',
        timestamp: new Date().toISOString()
    });
});

module.exports = router;
