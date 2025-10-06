const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');

// Simple in-memory storage for testing
const ocrVerifications = new Map();
const flaggedDocs = new Map();

// POST /api/ocr-verification/store - Store OCR verification proof
router.post('/store', (req, res) => {
    try {
        const { docId, docHash, extractedData, riskScore, aiMetadata, verificationStatus } = req.body;

        if (!docId || !docHash) {
            return res.status(400).json({
                success: false,
                error: 'docId and docHash are required'
            });
        }

        const transactionId = uuidv4();
        const timestamp = new Date().toISOString();
        
        const verification = {
            docId,
            docHash,
            extractedData,
            riskScore,
            aiMetadata,
            verificationStatus,
            transactionId,
            timestamp,
            blockNumber: ocrVerifications.size + 1
        };

        ocrVerifications.set(docId, verification);

        res.json({
            success: true,
            data: {
                transactionId,
                blockNumber: verification.blockNumber,
                verificationHash: docHash,
                timestamp,
                processingTime: 100
            }
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// GET /api/ocr-verification/verify/:docId - Get OCR verification proof
router.get('/verify/:docId', (req, res) => {
    try {
        const { docId } = req.params;
        const verification = ocrVerifications.get(docId);

        if (!verification) {
            return res.status(404).json({
                success: false,
                error: 'OCR verification not found'
            });
        }

        res.json({
            success: true,
            data: {
                docId: verification.docId,
                transactionId: verification.transactionId,
                blockNumber: verification.blockNumber,
                timestamp: verification.timestamp,
                verificationStatus: verification.verificationStatus,
                proof: verification
            }
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// POST /api/ocr-verification/flag - Flag OCR document
router.post('/flag', (req, res) => {
    try {
        const { docId, reason } = req.body;

        if (!docId || !reason) {
            return res.status(400).json({
                success: false,
                error: 'docId and reason are required'
            });
        }

        const transactionId = uuidv4();
        const timestamp = new Date().toISOString();
        
        flaggedDocs.set(docId, {
            docId,
            reason,
            flaggedAt: timestamp,
            transactionId
        });

        res.json({
            success: true,
            data: {
                transactionId,
                timestamp
            }
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// GET /api/ocr-verification/flagged - Get flagged documents
router.get('/flagged', (req, res) => {
    try {
        const documents = Array.from(flaggedDocs.values());

        res.json({
            success: true,
            data: {
                documents
            }
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// GET /api/ocr-verification/health - Health check
router.get('/health', (req, res) => {
    res.json({
        success: true,
        status: 'healthy',
        network: 'development',
        totalVerifications: ocrVerifications.size,
        totalFlagged: flaggedDocs.size
    });
});

module.exports = router;
