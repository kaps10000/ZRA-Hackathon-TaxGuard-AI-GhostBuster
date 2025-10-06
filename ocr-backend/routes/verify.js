const express = require('express');
const Document = require('../models/Document');
const { processDocumentWithFallback } = require('../services/ocr-service');
const { storeVerificationWithFallback } = require('../services/blockchain-service');
const { asyncHandler, NotFoundError } = require('../middleware/error-handler');
const logger = require('../utils/logger');

const router = express.Router();

/**
 * Determine verification status based on risk score
 */
function determineVerificationStatus(riskScore) {
  if (riskScore <= 30) return 'VALID';
  if (riskScore <= 60) return 'SUSPICIOUS';
  return 'FRAUDULENT';
}

/**
 * POST /api/verify/:documentId
 * Process document through OCR and blockchain verification
 *
 * Flow:
 *   1. Retrieve document from database
 *   2. Process through AI/OCR service (Dev 1)
 *   3. Store proof on blockchain (Dev 3)
 *   4. Update document with results
 *   5. Return verification results
 */
router.post('/:documentId', asyncHandler(async (req, res) => {
  const { documentId } = req.params;
  const startTime = Date.now();

  logger.info('Starting verification process:', { documentId });

  // 1. Find document in database
  const document = await Document.findByDocumentId(documentId);

  if (!document) {
    throw new NotFoundError(`Document ${documentId} not found`);
  }

  // Check if already verified
  if (document.status === 'VERIFIED') {
    logger.info('Document already verified:', { documentId });
    return res.json({
      success: true,
      message: 'Document already verified',
      documentId,
      data: {
        documentId: document.documentId,
        status: document.status,
        ocrData: document.ocrData,
        riskScore: document.riskScore,
        verificationStatus: document.verificationStatus,
        blockchainTxId: document.blockchainTxId,
        verifiedAt: document.verifiedAt
      }
    });
  }

  try {
    // Mark as processing
    document.markAsProcessing();
    await document.save();

    // 2. Process through AI/OCR service
    logger.info('Processing document through OCR service:', { documentId });
    const ocrStartTime = Date.now();

    const ocrResult = await processDocumentWithFallback(
      document.filePath,
      document.metadata
    );

    const ocrDuration = Date.now() - ocrStartTime;
    logger.info('OCR processing completed:', {
      documentId,
      duration: `${ocrDuration}ms`,
      riskScore: ocrResult.riskScore
    });

    // Update document with OCR results
    document.ocrData = ocrResult.extractedData;
    document.riskScore = ocrResult.riskScore;
    document.verificationStatus = determineVerificationStatus(ocrResult.riskScore);
    document.aiMetadata = ocrResult.aiMetadata;
    document.addProcessingStep('ocr_processing', 'completed', {
      riskScore: ocrResult.riskScore,
      confidence: ocrResult.confidence,
      duration: ocrDuration
    });

    // 3. Store verification on blockchain
    logger.info('Storing verification on blockchain:', { documentId });
    const blockchainStartTime = Date.now();

    const blockchainResult = await storeVerificationWithFallback({
      docId: documentId,
      docHash: document.fileHash,
      extractedData: ocrResult.extractedData,
      riskScore: ocrResult.riskScore,
      aiMetadata: ocrResult.aiMetadata,
      verificationStatus: document.verificationStatus
    });

    const blockchainDuration = Date.now() - blockchainStartTime;
    logger.info('Blockchain storage completed:', {
      documentId,
      txId: blockchainResult.transactionId,
      duration: `${blockchainDuration}ms`
    });

    // Update document with blockchain results
    document.blockchainTxId = blockchainResult.transactionId;
    document.blockNumber = blockchainResult.blockNumber;
    document.blockchainProof = {
      txId: blockchainResult.transactionId,
      blockNumber: blockchainResult.blockNumber,
      timestamp: blockchainResult.timestamp,
      verificationHash: blockchainResult.verificationHash
    };
    document.addProcessingStep('blockchain_storage', 'completed', {
      txId: blockchainResult.transactionId,
      duration: blockchainDuration
    });

    // 4. Mark as verified and save
    document.markAsVerified(
      ocrResult.extractedData,
      ocrResult.riskScore,
      document.verificationStatus
    );
    document.processedAt = new Date();

    await document.save();

    const totalDuration = Date.now() - startTime;

    logger.info('Verification completed successfully:', {
      documentId,
      totalDuration: `${totalDuration}ms`,
      verificationStatus: document.verificationStatus,
      riskScore: document.riskScore
    });

    // 5. Return response
    res.json({
      success: true,
      message: 'Document verified successfully',
      documentId,
      data: {
        documentId: document.documentId,
        filename: document.originalName,
        status: document.status,
        ocrData: document.ocrData,
        riskScore: document.riskScore,
        verificationStatus: document.verificationStatus,
        aiMetadata: document.aiMetadata,
        blockchain: {
          transactionId: document.blockchainTxId,
          blockNumber: document.blockNumber,
          timestamp: document.blockchainProof.timestamp
        },
        uploadedAt: document.uploadedAt,
        verifiedAt: document.verifiedAt,
        processingTime: {
          total: totalDuration,
          ocr: ocrDuration,
          blockchain: blockchainDuration
        }
      }
    });

  } catch (error) {
    logger.error('Verification failed:', {
      documentId,
      error: error.message,
      stack: error.stack
    });

    // Mark document as error
    document.markAsError('verification', error);
    await document.save();

    throw error;
  }
}));

/**
 * POST /api/verify/batch
 * Batch verify multiple documents
 */
router.post('/batch', asyncHandler(async (req, res) => {
  const { documentIds } = req.body;

  if (!documentIds || !Array.isArray(documentIds)) {
    return res.status(400).json({
      success: false,
      error: 'documentIds array is required'
    });
  }

  logger.info('Starting batch verification:', {
    count: documentIds.length,
    documentIds
  });

  const results = [];

  for (const documentId of documentIds) {
    try {
      // Process each document (reuse single verification logic)
      const document = await Document.findByDocumentId(documentId);

      if (!document) {
        results.push({
          documentId,
          success: false,
          error: 'Document not found'
        });
        continue;
      }

      // Skip if already verified
      if (document.status === 'VERIFIED') {
        results.push({
          documentId,
          success: true,
          message: 'Already verified',
          status: document.status,
          verificationStatus: document.verificationStatus
        });
        continue;
      }

      // Process document
      const ocrResult = await processDocumentWithFallback(document.filePath, document.metadata);
      const verificationStatus = determineVerificationStatus(ocrResult.riskScore);

      const blockchainResult = await storeVerificationWithFallback({
        docId: documentId,
        docHash: document.fileHash,
        extractedData: ocrResult.extractedData,
        riskScore: ocrResult.riskScore,
        aiMetadata: ocrResult.aiMetadata,
        verificationStatus
      });

      document.markAsVerified(ocrResult.extractedData, ocrResult.riskScore, verificationStatus);
      document.blockchainTxId = blockchainResult.transactionId;
      await document.save();

      results.push({
        documentId,
        success: true,
        status: document.status,
        verificationStatus,
        riskScore: ocrResult.riskScore,
        blockchainTxId: blockchainResult.transactionId
      });

    } catch (error) {
      logger.error('Batch verification error for document:', {
        documentId,
        error: error.message
      });

      results.push({
        documentId,
        success: false,
        error: error.message
      });
    }
  }

  const successCount = results.filter(r => r.success).length;
  const failureCount = results.length - successCount;

  res.json({
    success: true,
    message: `Batch verification completed: ${successCount} succeeded, ${failureCount} failed`,
    total: results.length,
    succeeded: successCount,
    failed: failureCount,
    results
  });
}));

module.exports = router;
