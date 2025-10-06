const express = require('express');
const { v4: uuidv4 } = require('uuid');
const Document = require('../models/Document');
const { upload, handleUploadError, validateFileUpload, addFileHash } = require('../middleware/upload');
const { asyncHandler } = require('../middleware/error-handler');
const logger = require('../utils/logger');

const router = express.Router();

/**
 * POST /api/upload
 * Upload a document for OCR verification
 *
 * Request:
 *   - multipart/form-data
 *   - file: PDF or image file
 *   - metadata: JSON string with additional info
 *
 * Response:
 *   {
 *     "success": true,
 *     "documentId": "DOC-2025-001",
 *     "message": "Document uploaded successfully",
 *     "data": {...}
 *   }
 */
router.post('/',
  upload.single('file'),
  handleUploadError,
  validateFileUpload,
  addFileHash,
  asyncHandler(async (req, res) => {
    const startTime = Date.now();

    try {
      // Parse metadata from request
      let metadata = {};
      if (req.body.metadata) {
        try {
          metadata = typeof req.body.metadata === 'string'
            ? JSON.parse(req.body.metadata)
            : req.body.metadata;
        } catch (error) {
          logger.warn('Failed to parse metadata:', error.message);
        }
      }

      // Generate unique document ID
      const documentId = `DOC-${Date.now()}-${uuidv4().split('-')[0].toUpperCase()}`;

      logger.info('Creating document record:', {
        documentId,
        filename: req.file.filename,
        size: req.file.size,
        metadata
      });

      // Create document record in database
      const document = new Document({
        documentId,
        filename: req.file.filename,
        originalName: req.file.originalname,
        filePath: req.file.path,
        fileSize: req.file.size,
        mimeType: req.file.mimetype,
        fileHash: req.file.hash,
        status: 'PENDING',
        metadata: {
          importerName: metadata.importerName,
          declarationId: metadata.declarationId,
          documentType: metadata.documentType,
          additionalInfo: metadata.additionalInfo
        },
        uploadedBy: req.body.uploadedBy || req.headers['x-user-id'] || 'anonymous'
      });

      // Save to database
      await document.save();

      const processingTime = Date.now() - startTime;

      logger.info('Document uploaded successfully:', {
        documentId,
        processingTime: `${processingTime}ms`
      });

      // Return response
      res.status(201).json({
        success: true,
        message: 'Document uploaded successfully. Processing will begin shortly.',
        documentId,
        data: {
          documentId,
          filename: document.originalName,
          fileSize: document.fileSize,
          fileHash: document.fileHash,
          status: document.status,
          uploadedAt: document.uploadedAt,
          metadata: document.metadata
        },
        next: {
          verify: `/api/verify/${documentId}`,
          results: `/api/results/${documentId}`
        }
      });

    } catch (error) {
      logger.error('Error uploading document:', {
        error: error.message,
        stack: error.stack,
        file: req.file
      });

      // Cleanup uploaded file on error
      if (req.file && req.file.path) {
        const fs = require('fs');
        try {
          fs.unlinkSync(req.file.path);
          logger.info('Cleaned up file after error:', req.file.path);
        } catch (cleanupError) {
          logger.error('Failed to cleanup file:', cleanupError.message);
        }
      }

      throw error;
    }
  })
);

/**
 * GET /api/upload/status/:documentId
 * Check upload status of a document
 */
router.get('/status/:documentId', asyncHandler(async (req, res) => {
  const { documentId } = req.params;

  const document = await Document.findByDocumentId(documentId);

  if (!document) {
    return res.status(404).json({
      success: false,
      error: 'Document not found'
    });
  }

  res.json({
    success: true,
    documentId,
    status: document.status,
    uploadedAt: document.uploadedAt,
    metadata: document.metadata
  });
}));

/**
 * GET /api/upload/recent
 * Get recently uploaded documents
 */
router.get('/recent', asyncHandler(async (req, res) => {
  const limit = parseInt(req.query.limit) || 10;
  const skip = parseInt(req.query.skip) || 0;

  const documents = await Document.find()
    .sort({ uploadedAt: -1 })
    .limit(limit)
    .skip(skip)
    .select('documentId filename originalName status uploadedAt metadata');

  const total = await Document.countDocuments();

  res.json({
    success: true,
    count: documents.length,
    total,
    limit,
    skip,
    documents: documents.map(doc => ({
      documentId: doc.documentId,
      filename: doc.originalName,
      status: doc.status,
      uploadedAt: doc.uploadedAt,
      metadata: doc.metadata
    }))
  });
}));

module.exports = router;
