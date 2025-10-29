const Attachment = require('../models/Attachment');
const { asyncHandler } = require('../middleware/errorHandler');
const path = require('path');
const fs = require('fs');

/**
 * Upload files
 * POST /api/upload
 */
const uploadFiles = asyncHandler(async (req, res) => {
  // Check if files were uploaded
  if (!req.files || req.files.length === 0) {
    return res.status(400).json({
      success: false,
      error: {
        message: 'No files uploaded',
        code: 'NO_FILES'
      }
    });
  }

  try {
    // Process each uploaded file
    const uploadedFiles = [];

    for (const file of req.files) {
      const attachment = await Attachment.create(file);
      uploadedFiles.push(attachment);
    }

    console.log(`📎 ${uploadedFiles.length} file(s) uploaded successfully`);

    res.status(201).json({
      success: true,
      message: `${uploadedFiles.length} file(s) uploaded successfully`,
      data: {
        files: uploadedFiles,
        total: uploadedFiles.length
      }
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({
      success: false,
      error: {
        message: 'Failed to process uploaded files',
        code: 'UPLOAD_PROCESSING_ERROR',
        details: error.message
      }
    });
  }
});

/**
 * Get file by ID
 * GET /api/upload/:fileId
 */
const getFile = asyncHandler(async (req, res) => {
  const { fileId } = req.params;

  const attachment = await Attachment.findByFileId(fileId);

  if (!attachment) {
    return res.status(404).json({
      success: false,
      error: {
        message: 'File not found',
        code: 'FILE_NOT_FOUND'
      }
    });
  }

  res.json({
    success: true,
    data: attachment
  });
});

/**
 * Download file
 * GET /api/upload/:fileId/download
 */
const downloadFile = asyncHandler(async (req, res) => {
  const { fileId } = req.params;

  const attachment = await Attachment.findByFileId(fileId);

  if (!attachment) {
    return res.status(404).json({
      success: false,
      error: {
        message: 'File not found',
        code: 'FILE_NOT_FOUND'
      }
    });
  }

  // Check if file exists on disk
  if (!fs.existsSync(attachment.file_path)) {
    return res.status(404).json({
      success: false,
      error: {
        message: 'File not found on server',
        code: 'FILE_MISSING'
      }
    });
  }

  // Set headers for file download
  res.setHeader('Content-Type', attachment.mime_type);
  res.setHeader('Content-Disposition', `attachment; filename="${attachment.original_name}"`);
  res.setHeader('Content-Length', attachment.file_size);

  // Stream file to response
  const fileStream = fs.createReadStream(attachment.file_path);
  fileStream.pipe(res);
});

/**
 * Delete file
 * DELETE /api/upload/:fileId
 */
const deleteFile = asyncHandler(async (req, res) => {
  const { fileId } = req.params;

  const deleted = await Attachment.delete(fileId);

  if (!deleted) {
    return res.status(404).json({
      success: false,
      error: {
        message: 'File not found',
        code: 'FILE_NOT_FOUND'
      }
    });
  }

  res.json({
    success: true,
    message: 'File deleted successfully',
    data: { file_id: fileId }
  });
});

/**
 * Get upload statistics
 * GET /api/upload/stats
 */
const getUploadStats = asyncHandler(async (req, res) => {
  // This is a placeholder for statistics
  // You can implement actual database queries here
  res.json({
    success: true,
    data: {
      total_uploads: 0,
      total_size: 0,
      by_type: {
        documents: 0,
        images: 0,
        videos: 0
      }
    }
  });
});

module.exports = {
  uploadFiles,
  getFile,
  downloadFile,
  deleteFile,
  getUploadStats
};
