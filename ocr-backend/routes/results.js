const express = require('express');
const Document = require('../models/Document');
const { getVerification } = require('../services/blockchain-service');
const { asyncHandler, NotFoundError } = require('../middleware/error-handler');
const logger = require('../utils/logger');

const router = express.Router();

/**
 * GET /api/results/:documentId
 * Retrieve verification results for a document
 */
router.get('/:documentId', asyncHandler(async (req, res) => {
  const { documentId } = req.params;
  const includeBlockchain = req.query.includeBlockchain === 'true';

  logger.info('Retrieving results:', { documentId, includeBlockchain });

  // Find document in database
  const document = await Document.findByDocumentId(documentId);

  if (!document) {
    throw new NotFoundError(`Document ${documentId} not found`);
  }

  // Base response
  const response = {
    success: true,
    documentId,
    document: {
      documentId: document.documentId,
      filename: document.originalName,
      fileSize: document.fileSize,
      fileHash: document.fileHash,
      status: document.status,
      uploadedAt: document.uploadedAt,
      uploadedBy: document.uploadedBy,
      metadata: document.metadata
    }
  };

  // Add verification data if available
  if (document.status === 'VERIFIED' || document.status === 'FLAGGED') {
    response.verification = {
      status: document.verificationStatus,
      riskScore: document.riskScore,
      ocrData: document.ocrData,
      aiMetadata: document.aiMetadata,
      verifiedAt: document.verifiedAt,
      processingSteps: document.processingSteps
    };

    // Add blockchain proof
    if (document.blockchainTxId) {
      response.blockchain = {
        transactionId: document.blockchainTxId,
        blockNumber: document.blockNumber,
        proof: document.blockchainProof
      };

      // Optionally fetch fresh blockchain data
      if (includeBlockchain) {
        try {
          const blockchainData = await getVerification(documentId);
          if (blockchainData.success) {
            response.blockchain.verifiedOnChain = true;
            response.blockchain.chainData = blockchainData.proof;
          }
        } catch (error) {
          logger.warn('Failed to fetch blockchain verification:', error.message);
          response.blockchain.verifiedOnChain = false;
          response.blockchain.error = error.message;
        }
      }
    }

    // Add risk flags if any
    if (document.riskFlags && document.riskFlags.length > 0) {
      response.riskFlags = document.riskFlags;
    }
  }

  // Add error information if status is ERROR
  if (document.status === 'ERROR') {
    response.errors = document.errors;
  }

  // Add processing history
  if (req.query.includeHistory === 'true') {
    response.processingHistory = document.processingSteps;
  }

  res.json(response);
}));

/**
 * GET /api/results
 * Get all documents with optional filtering
 */
router.get('/', asyncHandler(async (req, res) => {
  const {
    status,
    verificationStatus,
    importerName,
    limit = 20,
    skip = 0,
    sortBy = 'uploadedAt',
    sortOrder = 'desc'
  } = req.query;

  // Build query
  const query = {};
  if (status) query.status = status;
  if (verificationStatus) query.verificationStatus = verificationStatus;
  if (importerName) query['metadata.importerName'] = new RegExp(importerName, 'i');

  // Execute query
  const documents = await Document.find(query)
    .sort({ [sortBy]: sortOrder === 'asc' ? 1 : -1 })
    .limit(parseInt(limit))
    .skip(parseInt(skip))
    .select('documentId originalName status verificationStatus riskScore uploadedAt metadata blockchainTxId');

  const total = await Document.countDocuments(query);

  res.json({
    success: true,
    count: documents.length,
    total,
    limit: parseInt(limit),
    skip: parseInt(skip),
    documents: documents.map(doc => ({
      documentId: doc.documentId,
      filename: doc.originalName,
      status: doc.status,
      verificationStatus: doc.verificationStatus,
      riskScore: doc.riskScore,
      uploadedAt: doc.uploadedAt,
      metadata: doc.metadata,
      blockchainTxId: doc.blockchainTxId
    }))
  });
}));

/**
 * GET /api/results/status/:status
 * Get documents by status
 */
router.get('/status/:status', asyncHandler(async (req, res) => {
  const { status } = req.params;
  const limit = parseInt(req.query.limit) || 20;

  const documents = await Document.findByStatus(status.toUpperCase())
    .limit(limit)
    .select('documentId originalName status uploadedAt metadata');

  res.json({
    success: true,
    status: status.toUpperCase(),
    count: documents.length,
    documents: documents.map(doc => ({
      documentId: doc.documentId,
      filename: doc.originalName,
      status: doc.status,
      uploadedAt: doc.uploadedAt,
      metadata: doc.metadata
    }))
  });
}));

/**
 * GET /api/results/verification/:verificationStatus
 * Get documents by verification status
 */
router.get('/verification/:verificationStatus', asyncHandler(async (req, res) => {
  const { verificationStatus } = req.params;
  const limit = parseInt(req.query.limit) || 20;

  const documents = await Document.findByVerificationStatus(verificationStatus.toUpperCase())
    .limit(limit)
    .select('documentId originalName verificationStatus riskScore uploadedAt metadata blockchainTxId');

  res.json({
    success: true,
    verificationStatus: verificationStatus.toUpperCase(),
    count: documents.length,
    documents: documents.map(doc => ({
      documentId: doc.documentId,
      filename: doc.originalName,
      verificationStatus: doc.verificationStatus,
      riskScore: doc.riskScore,
      uploadedAt: doc.uploadedAt,
      metadata: doc.metadata,
      blockchainTxId: doc.blockchainTxId
    }))
  });
}));

/**
 * GET /api/results/statistics
 * Get overall statistics
 */
router.get('/stats/overview', asyncHandler(async (req, res) => {
  const stats = await Document.getStatistics();

  const totalDocuments = await Document.countDocuments();
  const verifiedCount = await Document.countDocuments({ status: 'VERIFIED' });
  const pendingCount = await Document.countDocuments({ status: 'PENDING' });
  const processingCount = await Document.countDocuments({ status: 'PROCESSING' });
  const flaggedCount = await Document.countDocuments({ status: 'FLAGGED' });
  const errorCount = await Document.countDocuments({ status: 'ERROR' });

  // Risk score statistics
  const validCount = await Document.countDocuments({ verificationStatus: 'VALID' });
  const suspiciousCount = await Document.countDocuments({ verificationStatus: 'SUSPICIOUS' });
  const fraudulentCount = await Document.countDocuments({ verificationStatus: 'FRAUDULENT' });

  // Average risk score
  const avgRiskScoreResult = await Document.aggregate([
    { $match: { riskScore: { $ne: null } } },
    { $group: { _id: null, avgRiskScore: { $avg: '$riskScore' } } }
  ]);
  const avgRiskScore = avgRiskScoreResult.length > 0 ? avgRiskScoreResult[0].avgRiskScore : 0;

  res.json({
    success: true,
    statistics: {
      total: totalDocuments,
      byStatus: {
        pending: pendingCount,
        processing: processingCount,
        verified: verifiedCount,
        flagged: flaggedCount,
        error: errorCount
      },
      byVerificationStatus: {
        valid: validCount,
        suspicious: suspiciousCount,
        fraudulent: fraudulentCount
      },
      riskScore: {
        average: Math.round(avgRiskScore * 100) / 100
      },
      detailed: stats
    }
  });
}));

/**
 * DELETE /api/results/:documentId
 * Delete a document (soft delete - mark as deleted)
 */
router.delete('/:documentId', asyncHandler(async (req, res) => {
  const { documentId } = req.params;

  const document = await Document.findByDocumentId(documentId);

  if (!document) {
    throw new NotFoundError(`Document ${documentId} not found`);
  }

  // Soft delete - just update status or actually delete from DB
  // For now, we'll actually delete
  await Document.deleteOne({ documentId });

  // Also delete the physical file
  const fs = require('fs');
  if (fs.existsSync(document.filePath)) {
    fs.unlinkSync(document.filePath);
    logger.info('Deleted physical file:', document.filePath);
  }

  logger.info('Document deleted:', { documentId });

  res.json({
    success: true,
    message: 'Document deleted successfully',
    documentId
  });
}));

module.exports = router;
