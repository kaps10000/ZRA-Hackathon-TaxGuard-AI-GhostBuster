const express = require('express');
const router = express.Router();
const asyncHandler = require('../middleware/async-handler');
const logger = require('../utils/logger');
const zraVerificationService = require('../services/zra-verification-service');
const { storeVerificationWithFallback } = require('../services/blockchain-service');
const Document = require('../models/Document');

/**
 * POST /api/verify/document
 * Verify a complete document with all extracted data
 * Automatically stores proof on blockchain after successful verification
 */
router.post('/document', asyncHandler(async (req, res) => {
  const { documentId, extractedData } = req.body;

  if (!extractedData && !documentId) {
    return res.status(400).json({
      success: false,
      error: 'Either documentId or extractedData must be provided'
    });
  }

  let dataToVerify = extractedData;
  let document = null;

  // If documentId provided, fetch from database
  if (documentId) {
    document = await Document.findByDocumentId(documentId);

    if (!document) {
      return res.status(404).json({
        success: false,
        error: 'Document not found'
      });
    }

    // Use OCR data from document if no extractedData provided
    if (!extractedData && document.ocrData) {
      dataToVerify = document.ocrData.extractedData || document.ocrData;
    }
  }

  if (!dataToVerify) {
    return res.status(400).json({
      success: false,
      error: 'No data available for verification'
    });
  }

  logger.info('Performing document verification:', {
    documentId,
    hasExtractedData: !!extractedData,
    fields: Object.keys(dataToVerify)
  });

  // Perform comprehensive verification
  const verificationResult = await zraVerificationService.verifyDocument(dataToVerify);

  // If document exists, update with verification results
  if (document) {
    document.verificationResult = verificationResult;
    document.verificationStatus = verificationResult.overallStatus;

    // Update status based on verification
    if (verificationResult.overallStatus === 'INVALID') {
      document.status = 'FLAGGED';
    } else if (verificationResult.overallStatus === 'SUSPICIOUS') {
      document.status = 'FLAGGED';
    } else {
      document.status = 'VERIFIED';
    }

    await document.save();

    logger.info('Document updated with verification results:', {
      documentId: document.documentId,
      status: document.status,
      verificationStatus: document.verificationStatus
    });

    // **TASK 4: Automatically store proof on blockchain after successful verification**
    if (verificationResult.overallStatus === 'VALID' || verificationResult.overallStatus === 'SUSPICIOUS') {
      try {
        logger.info('Storing verification proof on blockchain:', { documentId: document.documentId });

        const blockchainResult = await storeVerificationWithFallback({
          docId: document.documentId,
          docHash: document.fileHash,
          extractedData: dataToVerify,
          riskScore: document.riskScore,
          aiMetadata: document.aiMetadata,
          verificationStatus: document.verificationStatus
        });

        // Update document with blockchain transaction details
        if (blockchainResult.success) {
          document.blockchainTxId = blockchainResult.transactionId;
          document.blockNumber = blockchainResult.blockNumber;
          document.blockchainProof = {
            transactionId: blockchainResult.transactionId,
            blockNumber: blockchainResult.blockNumber,
            verificationHash: blockchainResult.verificationHash,
            timestamp: blockchainResult.timestamp
          };
          await document.save();

          logger.info('Blockchain proof stored successfully:', {
            documentId: document.documentId,
            transactionId: blockchainResult.transactionId,
            blockNumber: blockchainResult.blockNumber
          });
        }
      } catch (blockchainError) {
        logger.error('Failed to store blockchain proof:', {
          documentId: document.documentId,
          error: blockchainError.message
        });
        // Continue with response even if blockchain storage fails
      }
    }
  }

  res.json({
    success: true,
    data: {
      verificationResult,
      document: document ? {
        documentId: document.documentId,
        status: document.status,
        verificationStatus: document.verificationStatus,
        blockchainTxId: document.blockchainTxId,
        blockNumber: document.blockNumber
      } : null
    }
  });
}));

/**
 * POST /api/verify/company
 * Verify company information against ZRA database
 */
router.post('/company', asyncHandler(async (req, res) => {
  const { tpin, companyName } = req.body;

  if (!tpin) {
    return res.status(400).json({
      success: false,
      error: 'TPIN is required'
    });
  }

  logger.info('Performing company verification:', { tpin, companyName });

  const verificationResult = await zraVerificationService.verifyCompany(tpin, companyName);

  res.json({
    success: true,
    data: verificationResult
  });
}));

/**
 * POST /api/verify/hscode
 * Verify HS Code against ZRA database
 */
router.post('/hscode', asyncHandler(async (req, res) => {
  const { hsCode, description } = req.body;

  if (!hsCode) {
    return res.status(400).json({
      success: false,
      error: 'HS Code is required'
    });
  }

  logger.info('Performing HS Code verification:', { hsCode, description });

  const verificationResult = await zraVerificationService.verifyHSCode(hsCode, description);

  res.json({
    success: true,
    data: verificationResult
  });
}));

module.exports = router;
  }

  res.json({
    success: true,
    message: 'Document verification completed',
    documentId: document?.documentId,
    verification: {
      status: verificationResult.overallStatus,
      verified: verificationResult.overallVerified,
      riskFlags: verificationResult.allRiskFlags,
      companyCheck: verificationResult.companyVerification,
      hsCodeCheck: verificationResult.hsCodeVerification,
      declarationCheck: verificationResult.declarationVerification,
      countryCheck: verificationResult.countryVerification,
      crossReferenceChecks: verificationResult.crossReferenceChecks,
      ruleBasedChecks: verificationResult.ruleBasedChecks,
      recommendations: verificationResult.recommendations,
      metadata: verificationResult.metadata
    }
  });
}));

/**
 * POST /api/verify/company
 * Verify a company against ZRA registry
 *
 * Body:
 * - companyName: Company name to verify
 * - tpin (optional): Tax Payer Identification Number
 */
router.post('/company', asyncHandler(async (req, res) => {
  const { companyName, tpin } = req.body;

  if (!companyName) {
    return res.status(400).json({
      success: false,
      error: 'Company name is required'
    });
  }

  logger.info('Verifying company:', { companyName, tpin });

  const verificationResult = zraVerificationService.verifyCompany(companyName, tpin);

  res.json({
    success: true,
    message: 'Company verification completed',
    company: {
      name: companyName,
      tpin: tpin || 'Not provided'
    },
    verification: verificationResult
  });
}));

/**
 * POST /api/verify/hscode
 * Verify HS Code and pricing
 *
 * Body:
 * - hsCode: Harmonized System code
 * - unitPrice (optional): Unit price for validation
 * - currency (optional): Currency code (default: USD)
 */
router.post('/hscode', asyncHandler(async (req, res) => {
  const { hsCode, unitPrice, currency = 'USD' } = req.body;

  if (!hsCode) {
    return res.status(400).json({
      success: false,
      error: 'HS Code is required'
    });
  }

  logger.info('Verifying HS Code:', { hsCode, unitPrice, currency });

  const verificationResult = zraVerificationService.verifyHSCode(hsCode, unitPrice, currency);

  res.json({
    success: true,
    message: 'HS Code verification completed',
    hsCode,
    verification: verificationResult
  });
}));

/**
 * POST /api/verify/declaration
 * Verify declaration ID
 *
 * Body:
 * - declarationId: Declaration reference number
 */
router.post('/declaration', asyncHandler(async (req, res) => {
  const { declarationId } = req.body;

  if (!declarationId) {
    return res.status(400).json({
      success: false,
      error: 'Declaration ID is required'
    });
  }

  logger.info('Verifying declaration:', { declarationId });

  const verificationResult = zraVerificationService.verifyDeclaration(declarationId);

  res.json({
    success: true,
    message: 'Declaration verification completed',
    declarationId,
    verification: verificationResult
  });
}));

/**
 * POST /api/verify/country
 * Verify country risk profile
 *
 * Body:
 * - country: Country name
 */
router.post('/country', asyncHandler(async (req, res) => {
  const { country } = req.body;

  if (!country) {
    return res.status(400).json({
      success: false,
      error: 'Country is required'
    });
  }

  logger.info('Verifying country risk:', { country });

  const verificationResult = zraVerificationService.verifyCountryRisk(country);

  res.json({
    success: true,
    message: 'Country verification completed',
    country,
    verification: verificationResult
  });
}));

/**
 * GET /api/verify/database/reload
 * Reload ZRA mock database (for development/testing)
 */
router.get('/database/reload', asyncHandler(async (req, res) => {
  logger.info('Reloading ZRA database');

  zraVerificationService.loadZRADatabase();

  res.json({
    success: true,
    message: 'ZRA database reloaded successfully'
  });
}));

module.exports = router;
