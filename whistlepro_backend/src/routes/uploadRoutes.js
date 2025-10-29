const express = require('express');
const rateLimit = require('express-rate-limit');
const { upload, handleUploadError } = require('../middleware/upload');
const {
  uploadFiles,
  getFile,
  downloadFile,
  deleteFile,
  getUploadStats
} = require('../controllers/uploadController');

const router = express.Router();

// Rate limiting for file uploads
const uploadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // Max 20 upload requests per 15 minutes
  message: {
    error: 'Too many upload requests from this IP, please try again later.',
    retryAfter: 900
  },
  standardHeaders: true,
  legacyHeaders: false
});

/**
 * @route   POST /api/upload
 * @desc    Upload one or multiple files
 * @access  Public (rate limited)
 *
 * Usage:
 * - Send files as multipart/form-data
 * - Field name: 'files' (can upload multiple)
 * - Max 10 files per request
 * - Max 10MB per file
 * - Allowed types: PDF, JPG, PNG, DOC, DOCX, MP4, MOV
 */
router.post('/',
  uploadLimiter,
  upload.array('files', 10),
  handleUploadError,
  uploadFiles
);

/**
 * @route   GET /api/upload/:fileId
 * @desc    Get file metadata by ID
 * @access  Public
 */
router.get('/:fileId',
  getFile
);

/**
 * @route   GET /api/upload/:fileId/download
 * @desc    Download file
 * @access  Public
 */
router.get('/:fileId/download',
  downloadFile
);

/**
 * @route   DELETE /api/upload/:fileId
 * @desc    Delete file
 * @access  Public (should be restricted in production)
 */
router.delete('/:fileId',
  deleteFile
);

/**
 * @route   GET /api/upload/stats
 * @desc    Get upload statistics
 * @access  Public
 */
router.get('/stats',
  getUploadStats
);

module.exports = router;
