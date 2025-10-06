const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const logger = require('../utils/logger');

/**
 * OCR Service Integration - Connects to Dev 1's AI/OCR Service
 */

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:5000';
const AI_SERVICE_API_KEY = process.env.AI_SERVICE_API_KEY;
const AI_SERVICE_TIMEOUT = parseInt(process.env.AI_SERVICE_TIMEOUT || '60000'); // 60 seconds

/**
 * Process document through AI/OCR service
 * @param {string} filePath - Path to the uploaded file
 * @param {object} metadata - Additional metadata about the document
 * @returns {Promise<object>} OCR results with extracted data and risk score
 */
async function processDocument(filePath, metadata = {}) {
  const startTime = Date.now();

  try {
    logger.info('Calling AI/OCR service:', {
      service: AI_SERVICE_URL,
      filePath,
      metadata
    });

    // Create form data for file upload
    const formData = new FormData();
    formData.append('file', fs.createReadStream(filePath));
    formData.append('metadata', JSON.stringify(metadata));

    // Make request to AI service
    const response = await axios.post(
      `${AI_SERVICE_URL}/process`,
      formData,
      {
        headers: {
          ...formData.getHeaders(),
          ...(AI_SERVICE_API_KEY && { 'X-API-Key': AI_SERVICE_API_KEY })
        },
        timeout: AI_SERVICE_TIMEOUT,
        maxBodyLength: Infinity,
        maxContentLength: Infinity
      }
    );

    const processingTime = Date.now() - startTime;

    logger.info('AI/OCR processing completed:', {
      processingTime: `${processingTime}ms`,
      status: response.status,
      dataReceived: !!response.data
    });

    // Validate response structure
    if (!response.data) {
      throw new Error('No data received from AI service');
    }

    // Return standardized response
    const responseMetadata = response.data.metadata || {};
    return {
      success: true,
      extractedData: response.data.extractedData || response.data.data || {},
      riskScore: response.data.riskScore || 0,
      confidence: response.data.confidence || 0,
      aiMetadata: {
        model: responseMetadata.model || 'unknown',
        confidence: response.data.confidence || 0,
        processingTime: processingTime,
        extractionMethod: responseMetadata.method || 'ocr',
        ocrConfidence: responseMetadata.ocrConfidence || response.data.confidence || 0,
        fieldsExtracted: responseMetadata.fieldsExtracted || 0
      }
    };

  } catch (error) {
    const processingTime = Date.now() - startTime;

    logger.error('AI/OCR service error:', {
      error: error.message,
      processingTime: `${processingTime}ms`,
      filePath,
      service: AI_SERVICE_URL
    });

    // Handle specific error types
    if (error.code === 'ECONNREFUSED') {
      throw new Error(`AI service unavailable at ${AI_SERVICE_URL}`);
    }

    if (error.code === 'ETIMEDOUT' || error.code === 'ECONNABORTED') {
      throw new Error('AI service timeout - processing took too long');
    }

    if (error.response) {
      // AI service returned an error
      const statusCode = error.response.status;
      const errorMessage = error.response.data?.error || error.response.data?.message || 'Unknown error';

      logger.error('AI service returned error:', {
        statusCode,
        errorMessage,
        data: error.response.data
      });

      throw new Error(`AI service error (${statusCode}): ${errorMessage}`);
    }

    throw error;
  }
}

/**
 * Mock OCR processing for development/testing when AI service is unavailable
 */
async function mockProcessDocument(filePath, metadata = {}) {
  logger.warn('Using MOCK OCR processing - AI service not available');

  await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate processing delay

  // Generate mock extracted data
  const mockData = {
    invoiceNumber: `INV-${Date.now()}`,
    importerName: metadata.importerName || 'ABC Corporation',
    declarationId: metadata.declarationId || `DECL-${Date.now()}`,
    hsCode: '8471.30',
    description: 'Computer equipment',
    quantity: 100,
    unitPrice: 500,
    totalValue: 50000,
    currency: 'USD',
    originCountry: 'China',
    destinationCountry: 'Zambia',
    shipmentDate: new Date().toISOString().split('T')[0],
    documentType: 'commercial_invoice'
  };

  // Generate random risk score
  const riskScore = Math.floor(Math.random() * 100);

  return {
    success: true,
    extractedData: mockData,
    riskScore,
    confidence: 0.85,
    aiMetadata: {
      model: 'mock-ocr-v1',
      confidence: 0.85,
      processingTime: 1000,
      extractionMethod: 'mock',
      note: 'This is mock data for testing'
    }
  };
}

/**
 * Process document with fallback to mock if AI service unavailable
 */
async function processDocumentWithFallback(filePath, metadata = {}) {
  try {
    return await processDocument(filePath, metadata);
  } catch (error) {
    // If in development mode and AI service unavailable, use mock
    if (process.env.NODE_ENV === 'development' &&
        (error.message.includes('unavailable') || error.message.includes('ECONNREFUSED'))) {
      logger.warn('Falling back to mock OCR processing');
      return await mockProcessDocument(filePath, metadata);
    }
    throw error;
  }
}

/**
 * Check if AI service is available
 */
async function checkServiceHealth() {
  try {
    const response = await axios.get(`${AI_SERVICE_URL}/health`, {
      timeout: 5000,
      ...(AI_SERVICE_API_KEY && {
        headers: { 'X-API-Key': AI_SERVICE_API_KEY }
      })
    });

    return {
      available: true,
      status: response.data?.status || 'healthy',
      version: response.data?.version
    };
  } catch (error) {
    logger.warn('AI service health check failed:', error.message);
    return {
      available: false,
      error: error.message
    };
  }
}

module.exports = {
  processDocument,
  mockProcessDocument,
  processDocumentWithFallback,
  checkServiceHealth
};
