const axios = require('axios');
const crypto = require('crypto');
const logger = require('../utils/logger');

/**
 * Alternative Blockchain Service - Uses existing Kaps blockchain endpoints
 */

const BLOCKCHAIN_API_URL = process.env.BLOCKCHAIN_API_URL || 'http://localhost:3001/api';
const BLOCKCHAIN_API_KEY = process.env.BLOCKCHAIN_API_KEY;
const BLOCKCHAIN_TIMEOUT = parseInt(process.env.BLOCKCHAIN_TIMEOUT || '30000');

/**
 * Store verification using existing blockchain event system
 */
async function storeVerificationAlternative(documentData) {
  try {
    const { docId, docHash, extractedData, riskScore, aiMetadata, verificationStatus } = documentData;

    // Use existing /api/events endpoint to store OCR verification
    const payload = {
      eventType: 'OCR_VERIFICATION',
      anonymizedUserId: `ocr_${docId}`,
      payload: {
        docId,
        docHash,
        extractedData,
        riskScore,
        aiMetadata,
        verificationStatus,
        timestamp: new Date().toISOString()
      }
    };

    const response = await axios.post(
      `${BLOCKCHAIN_API_URL}/events`,
      payload,
      {
        headers: {
          'Content-Type': 'application/json',
          ...(BLOCKCHAIN_API_KEY && { 'X-API-Key': BLOCKCHAIN_API_KEY })
        },
        timeout: BLOCKCHAIN_TIMEOUT
      }
    );

    logger.info('OCR verification stored via events API:', { docId });

    return {
      success: true,
      transactionId: response.data.eventId,
      blockNumber: response.data.blockIndex,
      verificationHash: response.data.hash,
      timestamp: response.data.timestamp,
      processingTime: 500
    };

  } catch (error) {
    logger.error('Alternative blockchain storage error:', error.message);
    throw error;
  }
}

/**
 * Get verification using existing verify endpoint
 */
async function getVerificationAlternative(docId) {
  try {
    // Search for OCR verification events
    const response = await axios.get(
      `${BLOCKCHAIN_API_URL}/events`,
      {
        headers: {
          ...(BLOCKCHAIN_API_KEY && { 'X-API-Key': BLOCKCHAIN_API_KEY })
        },
        timeout: BLOCKCHAIN_TIMEOUT
      }
    );

    const events = response.data.events || [];
    const ocrEvent = events.find(event => 
      event.eventType === 'OCR_VERIFICATION' && 
      event.payload.docId === docId
    );

    if (!ocrEvent) {
      return {
        success: false,
        error: 'Verification not found on blockchain'
      };
    }

    return {
      success: true,
      proof: {
        docId: ocrEvent.payload.docId,
        transactionId: ocrEvent.eventId,
        blockNumber: ocrEvent.blockIndex,
        timestamp: ocrEvent.timestamp,
        verificationStatus: ocrEvent.payload.verificationStatus,
        proof: ocrEvent.payload
      }
    };

  } catch (error) {
    logger.error('Alternative blockchain retrieval error:', error.message);
    throw error;
  }
}

module.exports = {
  storeVerificationAlternative,
  getVerificationAlternative
};
