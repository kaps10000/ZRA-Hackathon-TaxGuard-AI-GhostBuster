const axios = require('axios');
const crypto = require('crypto');
const logger = require('../utils/logger');

/**
 * Blockchain Service Integration - Multiple connection strategies
 */

const BLOCKCHAIN_API_URL = process.env.BLOCKCHAIN_API_URL || 'http://localhost:3001/api/ocr-verification';
const BLOCKCHAIN_BASE_URL = process.env.BLOCKCHAIN_BASE_URL || 'http://localhost:3001/api';
const BLOCKCHAIN_API_KEY = process.env.BLOCKCHAIN_API_KEY;
const BLOCKCHAIN_TIMEOUT = parseInt(process.env.BLOCKCHAIN_TIMEOUT || '30000');

/**
 * Strategy 1: Use dedicated OCR endpoints (preferred)
 */
async function storeVerificationDedicated(documentData) {
  const response = await axios.post(
    `${BLOCKCHAIN_API_URL}/store`,
    documentData,
    {
      headers: {
        'Content-Type': 'application/json',
        ...(BLOCKCHAIN_API_KEY && { 'X-API-Key': BLOCKCHAIN_API_KEY })
      },
      timeout: BLOCKCHAIN_TIMEOUT
    }
  );

  return {
    success: true,
    transactionId: response.data.data?.transactionId,
    blockNumber: response.data.data?.blockNumber,
    verificationHash: response.data.data?.verificationHash,
    timestamp: response.data.data?.timestamp,
    processingTime: response.data.data?.processingTime
  };
}

/**
 * Strategy 2: Use existing events API (fallback)
 */
async function storeVerificationEvents(documentData) {
  const { docId, docHash, extractedData, riskScore, aiMetadata, verificationStatus } = documentData;

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
    `${BLOCKCHAIN_BASE_URL}/events`,
    payload,
    {
      headers: {
        'Content-Type': 'application/json',
        ...(BLOCKCHAIN_API_KEY && { 'X-API-Key': BLOCKCHAIN_API_KEY })
      },
      timeout: BLOCKCHAIN_TIMEOUT
    }
  );

  return {
    success: true,
    transactionId: response.data.eventId,
    blockNumber: response.data.blockIndex,
    verificationHash: response.data.hash,
    timestamp: response.data.timestamp,
    processingTime: 500
  };
}

/**
 * Store document verification proof on blockchain (Multi-strategy)
 */
async function storeVerification(documentData) {
  const startTime = Date.now();

  try {
    const { docId, riskScore, verificationStatus } = documentData;

    logger.info('Storing verification on blockchain:', {
      docId,
      riskScore,
      verificationStatus
    });

    let result;

    // Strategy 1: Try dedicated OCR endpoints first
    try {
      result = await storeVerificationDedicated(documentData);
      logger.info('Used dedicated OCR endpoints');
    } catch (error) {
      logger.warn('Dedicated OCR endpoints failed, trying events API:', error.message);
      
      // Strategy 2: Fallback to events API
      result = await storeVerificationEvents(documentData);
      logger.info('Used events API fallback');
    }

    const processingTime = Date.now() - startTime;
    result.processingTime = processingTime;

    logger.info('Blockchain storage completed:', {
      docId,
      txId: result.transactionId,
      processingTime: `${processingTime}ms`
    });

    return result;

  } catch (error) {
    const processingTime = Date.now() - startTime;

    logger.error('All blockchain strategies failed:', {
      error: error.message,
      processingTime: `${processingTime}ms`,
      docId: documentData.docId
    });

    // Handle specific error types
    if (error.code === 'ECONNREFUSED') {
      throw new Error(`Blockchain service unavailable`);
    }

    if (error.code === 'ETIMEDOUT' || error.code === 'ECONNABORTED') {
      throw new Error('Blockchain service timeout');
    }

    throw error;
  }
}

/**
 * Retrieve document proof from blockchain
 * @param {string} docId - Document ID
 * @returns {Promise<object>} Document proof from blockchain
 */
async function getVerification(docId) {
  try {
    logger.info('Retrieving verification from blockchain:', { docId });

    const response = await axios.get(
      `${BLOCKCHAIN_API_URL}/verify/${docId}`,
      {
        headers: {
          ...(BLOCKCHAIN_API_KEY && { 'X-API-Key': BLOCKCHAIN_API_KEY })
        },
        timeout: BLOCKCHAIN_TIMEOUT
      }
    );

    if (!response.data || !response.data.success) {
      throw new Error('Blockchain verification not found');
    }

    return {
      success: true,
      proof: response.data.data
    };

  } catch (error) {
    logger.error('Error retrieving blockchain verification:', {
      docId,
      error: error.message
    });

    if (error.response?.status === 404) {
      return {
        success: false,
        error: 'Verification not found on blockchain'
      };
    }

    throw error;
  }
}

/**
 * Flag document on blockchain
 * @param {string} docId - Document ID
 * @param {string} reason - Reason for flagging
 * @returns {Promise<object>} Flag transaction details
 */
async function flagDocument(docId, reason) {
  try {
    logger.info('Flagging document on blockchain:', { docId, reason });

    const response = await axios.post(
      `${BLOCKCHAIN_API_URL}/flag`,
      { docId, reason },
      {
        headers: {
          'Content-Type': 'application/json',
          ...(BLOCKCHAIN_API_KEY && { 'X-API-Key': BLOCKCHAIN_API_KEY })
        },
        timeout: BLOCKCHAIN_TIMEOUT
      }
    );

    return {
      success: true,
      transactionId: response.data.data?.transactionId,
      timestamp: response.data.data?.timestamp || new Date().toISOString()
    };

  } catch (error) {
    logger.error('Error flagging document on blockchain:', {
      docId,
      error: error.message
    });
    throw error;
  }
}

/**
 * Query flagged documents from blockchain
 * @returns {Promise<Array>} List of flagged documents
 */
async function getFlaggedDocuments() {
  try {
    const response = await axios.get(
      `${BLOCKCHAIN_API_URL}/flagged`,
      {
        headers: {
          ...(BLOCKCHAIN_API_KEY && { 'X-API-Key': BLOCKCHAIN_API_KEY })
        },
        timeout: BLOCKCHAIN_TIMEOUT
      }
    );

    return {
      success: true,
      documents: response.data.data?.documents || []
    };

  } catch (error) {
    logger.error('Error retrieving flagged documents:', error.message);
    throw error;
  }
}

/**
 * Mock blockchain storage for development/testing
 */
async function mockStoreVerification(documentData) {
  logger.warn('Using MOCK blockchain storage - Blockchain service not available');

  await new Promise(resolve => setTimeout(resolve, 500)); // Simulate delay

  const mockTxId = `0x${crypto.randomBytes(32).toString('hex')}`;
  const mockBlockNumber = Math.floor(Math.random() * 1000000) + 1000000;

  return {
    success: true,
    transactionId: mockTxId,
    blockNumber: mockBlockNumber,
    verificationHash: crypto.createHash('sha256')
      .update(JSON.stringify(documentData))
      .digest('hex'),
    timestamp: new Date().toISOString(),
    processingTime: 500,
    note: 'This is mock blockchain data for testing'
  };
}

/**
 * Store verification with fallback to mock
 */
async function storeVerificationWithFallback(documentData) {
  try {
    return await storeVerification(documentData);
  } catch (error) {
    // If in development mode and blockchain service unavailable, use mock
    if (process.env.NODE_ENV === 'development' &&
        (error.message.includes('unavailable') || error.message.includes('ECONNREFUSED'))) {
      logger.warn('Falling back to mock blockchain storage');
      return await mockStoreVerification(documentData);
    }
    throw error;
  }
}

/**
 * Check if blockchain service is available
 */
async function checkServiceHealth() {
  try {
    const response = await axios.get(`${BLOCKCHAIN_API_URL}/health`, {
      timeout: 5000,
      ...(BLOCKCHAIN_API_KEY && {
        headers: { 'X-API-Key': BLOCKCHAIN_API_KEY }
      })
    });

    return {
      available: true,
      status: response.data?.status || 'healthy',
      network: response.data?.network
    };
  } catch (error) {
    logger.warn('Blockchain service health check failed:', error.message);
    return {
      available: false,
      error: error.message
    };
  }
}

module.exports = {
  storeVerification,
  getVerification,
  flagDocument,
  getFlaggedDocuments,
  mockStoreVerification,
  storeVerificationWithFallback,
  checkServiceHealth
};
