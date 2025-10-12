const multer = require('multer');
const path = require('path');
const crypto = require('crypto');
const fs = require('fs');
const logger = require('../utils/logger');
const { ValidationError } = require('./error-handler');

// Ensure uploads directory exists
const uploadsDir = process.env.UPLOAD_DIR || './uploads';
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
  logger.info('Created uploads directory:', uploadsDir);
}

// Configure storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    // Generate unique filename: timestamp-randomhash-originalname
    const timestamp = Date.now();
    const randomHash = crypto.randomBytes(8).toString('hex');
    const ext = path.extname(file.originalname);
    const basename = path.basename(file.originalname, ext);
    const sanitizedBasename = basename.replace(/[^a-zA-Z0-9]/g, '_');
    const filename = `${timestamp}-${randomHash}-${sanitizedBasename}${ext}`;
    cb(null, filename);
  }
});

// File filter - only allow specific file types
const fileFilter = (req, file, cb) => {
  const allowedTypes = process.env.ALLOWED_FILE_TYPES || '.pdf,.jpg,.jpeg,.png';
  const allowedExtensions = allowedTypes.split(',').map(ext => ext.trim().toLowerCase());
  const fileExt = path.extname(file.originalname).toLowerCase();

  // Check file extension
  if (!allowedExtensions.includes(fileExt)) {
    logger.warn('File upload rejected - invalid type:', {
      filename: file.originalname,
      extension: fileExt,
      allowed: allowedExtensions
    });
    return cb(new ValidationError(
      `Invalid file type. Allowed types: ${allowedExtensions.join(', ')}`
    ), false);
  }

  // Check MIME type
  const allowedMimeTypes = [
    'application/pdf',
    'image/jpeg',
    'image/jpg',
    'image/png'
  ];

  if (!allowedMimeTypes.includes(file.mimetype)) {
    logger.warn('File upload rejected - invalid MIME type:', {
      filename: file.originalname,
      mimetype: file.mimetype
    });
    return cb(new ValidationError(
      `Invalid file MIME type. Allowed: ${allowedMimeTypes.join(', ')}`
    ), false);
  }

  logger.info('File upload accepted:', {
    filename: file.originalname,
    mimetype: file.mimetype,
    size: file.size
  });

  cb(null, true);
};

// Multer configuration
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE || '10485760'), // 10MB default
    files: 1 // Only one file per upload
  }
});

// Middleware to handle multer errors
const handleUploadError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    logger.error('Multer error:', err);

    if (err.code === 'LIMIT_FILE_SIZE') {
      const maxSize = parseInt(process.env.MAX_FILE_SIZE || '10485760');
      const maxSizeMB = (maxSize / (1024 * 1024)).toFixed(2);
      return res.status(400).json({
        success: false,
        error: `File too large. Maximum size: ${maxSizeMB}MB`
      });
    }

    if (err.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({
        success: false,
        error: 'Too many files. Only one file allowed per upload'
      });
    }

    if (err.code === 'LIMIT_UNEXPECTED_FILE') {
      return res.status(400).json({
        success: false,
        error: 'Unexpected file field. Use "file" as the field name'
      });
    }

    return res.status(400).json({
      success: false,
      error: err.message
    });
  }

  next(err);
};

// Validation middleware - ensure file was uploaded
const validateFileUpload = (req, res, next) => {
  if (!req.file) {
    logger.warn('No file uploaded in request');
    return res.status(400).json({
      success: false,
      error: 'No file uploaded. Please provide a file in the "file" field'
    });
  }

  logger.info('File uploaded successfully:', {
    originalName: req.file.originalname,
    filename: req.file.filename,
    size: req.file.size,
    mimetype: req.file.mimetype,
    path: req.file.path
  });

  next();
};

// Calculate file hash (SHA-256)
const calculateFileHash = (filePath) => {
  return new Promise((resolve, reject) => {
    const hash = crypto.createHash('sha256');
    const stream = fs.createReadStream(filePath);

    stream.on('data', (data) => hash.update(data));
    stream.on('end', () => resolve(hash.digest('hex')));
    stream.on('error', (error) => reject(error));
  });
};

// Add file hash to request
const addFileHash = async (req, res, next) => {
  try {
    if (req.file) {
      req.file.hash = await calculateFileHash(req.file.path);
      logger.info('File hash calculated:', {
        filename: req.file.filename,
        hash: req.file.hash
      });
    }
    next();
  } catch (error) {
    logger.error('Error calculating file hash:', error);
    next(error);
  }
};

// Cleanup uploaded file on error
const cleanupOnError = (filePath) => {
  if (filePath && fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
    logger.info('Cleaned up uploaded file:', filePath);
  }
};

module.exports = {
  upload,
  handleUploadError,
  validateFileUpload,
  calculateFileHash,
  addFileHash,
  cleanupOnError
};
