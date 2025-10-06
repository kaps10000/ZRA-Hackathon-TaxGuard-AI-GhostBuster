const express = require('express');
const router = express.Router();
const asyncHandler = require('../middleware/async-handler');
const { optionalAuth } = require('../middleware/auth');
const logger = require('../utils/logger');
const Document = require('../models/Document');

/**
 * GET /api/proof/:id
 * Get blockchain proof for a document
 */
router.get('/:id', optionalAuth, asyncHandler(async (req, res) => {
  const { id } = req.params;

  // Find document by ID or document_id
  let document = await Document.findByPk(id);
  
  if (!document) {
    document = await Document.findByDocumentId(id);
  }

  if (!document) {
    return res.status(404).json({
      success: false,
      error: 'Document not found'
    });
  }

  // Check if document has blockchain proof
  if (!document.blockchainTxId && !document.blockchainProof) {
    return res.status(404).json({
      success: false,
      error: 'No blockchain proof available for this document'
    });
  }

  const proofData = {
    documentId: document.documentId,
    filename: document.filename,
    fileHash: document.fileHash,
    blockchainTxId: document.blockchainTxId,
    blockNumber: document.blockNumber,
    blockchainProof: document.blockchainProof,
    verificationStatus: document.verificationStatus,
    riskScore: document.riskScore,
    verifiedAt: document.verifiedAt,
    createdAt: document.createdAt
  };

  logger.info('Blockchain proof retrieved', { 
    documentId: document.documentId,
    txId: document.blockchainTxId,
    user: req.user?.username || 'anonymous'
  });

  res.json({
    success: true,
    data: {
      proof: proofData,
      verification: {
        isValid: !!document.blockchainTxId,
        timestamp: document.verifiedAt,
        confidence: document.riskScore ? (100 - document.riskScore) : null
      }
    }
  });
}));

/**
 * POST /api/proof/verify
 * Verify a blockchain proof hash
 */
router.post('/verify', optionalAuth, asyncHandler(async (req, res) => {
  const { txId, fileHash, documentId } = req.body;

  if (!txId && !fileHash && !documentId) {
    return res.status(400).json({
      success: false,
      error: 'Transaction ID, file hash, or document ID is required'
    });
  }

  let query = {};
  if (txId) query.blockchainTxId = txId;
  if (fileHash) query.fileHash = fileHash;
  if (documentId) query.documentId = documentId;

  const document = await Document.findOne({ where: query });

  if (!document) {
    return res.status(404).json({
      success: false,
      error: 'No document found matching the provided proof data'
    });
  }

  const isValid = !!(document.blockchainTxId && document.blockchainProof);

  logger.info('Proof verification requested', { 
    query,
    found: !!document,
    valid: isValid,
    user: req.user?.username || 'anonymous'
  });

  res.json({
    success: true,
    data: {
      valid: isValid,
      document: {
        documentId: document.documentId,
        filename: document.filename,
        verificationStatus: document.verificationStatus,
        riskScore: document.riskScore,
        verifiedAt: document.verifiedAt
      },
      blockchain: {
        txId: document.blockchainTxId,
        blockNumber: document.blockNumber,
        proof: document.blockchainProof
      }
    }
  });
}));

module.exports = router;
