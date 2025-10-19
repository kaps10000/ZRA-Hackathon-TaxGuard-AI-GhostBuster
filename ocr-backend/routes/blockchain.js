const express = require('express');
const router = express.Router();
const { 
  storeVerificationWithFallback, 
  getVerification, 
  checkServiceHealth 
} = require('../services/blockchain-service');
const logger = require('../utils/logger');

/**
 * POST /blockchain/store-proof
 * Store document verification proof on blockchain
 */
router.post('/store-proof', async (req, res) => {
  try {
    const { docId, docHash, extractedData, riskScore, aiMetadata, verificationStatus } = req.body;

    if (!docId || !docHash) {
      return res.status(400).json({
        success: false,
        error: 'docId and docHash are required'
      });
    }

    logger.info('Blockchain store-proof request:', { docId, verificationStatus });

    const result = await storeVerificationWithFallback({
      docId,
      docHash,
      extractedData,
      riskScore,
      aiMetadata,
      verificationStatus
    });

    res.json({
      success: true,
      data: {
        transactionId: result.transactionId,
        blockNumber: result.blockNumber,
        verificationHash: result.verificationHash,
        timestamp: result.timestamp,
        processingTime: result.processingTime
      }
    });

  } catch (error) {
    logger.error('Blockchain store-proof error:', error.message);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /blockchain/get-proof/:hash
 * Retrieve document proof from blockchain
 */
router.get('/get-proof/:hash', async (req, res) => {
  try {
    const { hash } = req.params;

    if (!hash) {
      return res.status(400).json({
        success: false,
        error: 'Document hash is required'
      });
    }

    logger.info('Blockchain get-proof request:', { hash });

    const result = await getVerification(hash);

    if (!result.success) {
      return res.status(404).json({
        success: false,
        error: result.error || 'Proof not found'
      });
    }

    res.json({
      success: true,
      data: result.proof
    });

  } catch (error) {
    logger.error('Blockchain get-proof error:', error.message);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /blockchain/health
 * Check blockchain service health
 */
router.get('/health', async (req, res) => {
  try {
    const health = await checkServiceHealth();
    
    res.json({
      success: true,
      data: health
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;
