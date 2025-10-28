const express = require('express');
const router = express.Router();
const axios = require('axios');

const BLOCKCHAIN_SERVICE_URL = process.env.BLOCKCHAIN_API || 'http://localhost:3001';

// POST /api/blockchain/record - Record OCR or other documents to blockchain
router.post('/record', async (req, res) => {
  try {
    const { documentHash, fileName, status, riskScore, timestamp, action, extractedData } = req.body;

    if (!documentHash || !fileName) {
      return res.status(400).json({
        success: false,
        error: 'documentHash and fileName are required'
      });
    }

    // Prepare blockchain event
    const blockchainEvent = {
      eventType: action || 'DOCUMENT_RECORDED',
      anonymizedUserId: 'OCR_SCANNER',
      hashOfPayload: documentHash,
      notes: `OCR Document: ${fileName} | Status: ${status} | Risk Score: ${riskScore}`,
      metadata: {
        fileName,
        status,
        riskScore,
        timestamp,
        source: 'OCR_SCANNER'
      }
    };

    // Send to blockchain service
    const response = await axios.post(`${BLOCKCHAIN_SERVICE_URL}/api/events`, blockchainEvent, {
      timeout: 10000
    });

    res.json({
      success: true,
      transactionHash: response.data.event?.hashOfPayload || documentHash,
      blockNumber: response.data.event?.blockIndex,
      message: 'Document successfully recorded on blockchain'
    });

  } catch (error) {
    console.error('Blockchain record error:', error.message);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to record to blockchain'
    });
  }
});

// GET /api/blockchain/verify/:hash - Verify document on blockchain
router.get('/verify/:hash', async (req, res) => {
  try {
    const { hash } = req.params;

    // Query blockchain for the hash
    const response = await axios.get(`${BLOCKCHAIN_SERVICE_URL}/api/events`, {
      timeout: 5000
    });

    const events = response.data.events || [];
    const event = events.find(e => e.hashOfPayload === hash);

    if (event) {
      res.json({
        success: true,
        verified: true,
        event: event
      });
    } else {
      res.json({
        success: false,
        verified: false,
        message: 'Document hash not found on blockchain'
      });
    }

  } catch (error) {
    console.error('Blockchain verify error:', error.message);
    res.status(500).json({
      success: false,
      error: 'Failed to verify on blockchain'
    });
  }
});

module.exports = router;
