require('dotenv').config();
const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const logger = require('./utils/logger');
const ocrService = require('./services/ocr-service');
const fieldExtractor = require('./services/field-extractor');
const riskScorer = require('./services/risk-scorer');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Configure file upload
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = './uploads';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, `${uniqueSuffix}-${file.originalname}`);
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE || '10485760') // 10MB
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /pdf|jpg|jpeg|png/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (extname && mimetype) {
      return cb(null, true);
    }
    cb(new Error('Only PDF and image files are allowed'));
  }
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'AI/OCR Document Processing Service',
    version: '1.0.0',
    service: 'ZRA TaxGuard AI Service',
    endpoints: {
      health: 'GET /health',
      process: 'POST /process',
      extract: 'POST /ai/extract',
      stats: 'GET /stats'
    },
    documentation: 'Send POST requests to /process with multipart form-data file upload'
  });
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    success: true,
    status: 'healthy',
    service: 'AI OCR Document Processing',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

// Main processing endpoint
app.post('/process', upload.single('file'), async (req, res) => {
  const startTime = Date.now();
  let filePath = null;

  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No file uploaded'
      });
    }

    filePath = req.file.path;
    const metadata = req.body.metadata ? JSON.parse(req.body.metadata) : {};

    logger.info('Processing document:', {
      filename: req.file.originalname,
      size: req.file.size,
      mimetype: req.file.mimetype
    });

    // Step 1: OCR extraction
    logger.info('Step 1: Running OCR extraction...');
    const ocrResult = await ocrService.processDocument(filePath, req.file.mimetype);

    if (!ocrResult.success || !ocrResult.text) {
      throw new Error('OCR extraction failed - no text extracted');
    }

    // Step 2: Field extraction
    logger.info('Step 2: Extracting structured fields...');
    const extractionResult = fieldExtractor.extractFields(ocrResult.text);

    // Merge with metadata
    const mergedData = {
      ...extractionResult.extractedData,
      ...metadata // Override with provided metadata
    };

    // Step 3: Risk scoring
    logger.info('Step 3: Calculating risk score...');
    const riskAssessment = riskScorer.calculateRiskScore(
      mergedData,
      extractionResult.confidenceScores,
      ocrResult.confidence
    );

    const totalProcessingTime = Date.now() - startTime;

    // Cleanup uploaded file
    try {
      fs.unlinkSync(filePath);
      const preprocessed = filePath.replace(/\.[^.]+$/, '_preprocessed.png');
      if (fs.existsSync(preprocessed)) {
        fs.unlinkSync(preprocessed);
      }
    } catch (cleanupError) {
      logger.warn('File cleanup failed:', cleanupError.message);
    }

    // Prepare response
    const response = {
      success: true,
      message: 'Document processed successfully',
      extractedData: mergedData,
      riskScore: riskAssessment.riskScore,
      riskLevel: riskAssessment.riskLevel,
      confidence: extractionResult.overallConfidence,
      metadata: {
        model: 'tesseract-5.0 + regex-extraction',
        method: ocrResult.method,
        ocrConfidence: ocrResult.confidence,
        fieldsExtracted: extractionResult.fieldsExtracted,
        riskFlags: riskAssessment.riskFlags,
        processingTime: {
          total: totalProcessingTime,
          ocr: ocrResult.processingTime,
          extraction: extractionResult.processingTime
        }
      }
    };

    logger.info('Document processing completed:', {
      filename: req.file.originalname,
      riskScore: riskAssessment.riskScore,
      confidence: extractionResult.overallConfidence,
      totalTime: `${totalProcessingTime}ms`
    });

    res.json(response);

  } catch (error) {
    logger.error('Document processing error:', {
      error: error.message,
      stack: error.stack,
      filename: req.file?.originalname
    });

    // Cleanup on error
    if (filePath && fs.existsSync(filePath)) {
      try {
        fs.unlinkSync(filePath);
      } catch (cleanupError) {
        logger.error('Failed to cleanup file:', cleanupError);
      }
    }

    res.status(500).json({
      success: false,
      error: error.message,
      ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
    });
  }
});

// Legacy /ai/extract endpoint (same as /process)
app.post('/ai/extract', upload.single('file'), async (req, res, next) => {
  // Redirect to /process endpoint
  req.url = '/process';
  return app._router.handle(req, res, next);
});

// Get processing statistics
app.get('/stats', (req, res) => {
  // This would typically query a database
  res.json({
    success: true,
    message: 'Statistics endpoint - to be implemented',
    stats: {
      totalProcessed: 0,
      averageConfidence: 0,
      averageRiskScore: 0
    }
  });
});

// Error handling middleware
app.use((error, req, res, next) => {
  logger.error('Unhandled error:', error);

  res.status(error.status || 500).json({
    success: false,
    error: error.message || 'Internal server error'
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found',
    availableEndpoints: {
      health: 'GET /health',
      process: 'POST /process',
      extract: 'POST /ai/extract',
      stats: 'GET /stats'
    }
  });
});

// Start server
app.listen(PORT, () => {
  logger.info(`AI OCR Service started on port ${PORT}`);
  console.log('\n' + '='.repeat(60));
  console.log('🤖 AI/OCR Document Processing Service');
  console.log('='.repeat(60));
  console.log(`✅ Server:      http://localhost:${PORT}`);
  console.log(`🏥 Health:      http://localhost:${PORT}/health`);
  console.log(`🔍 Process:     POST http://localhost:${PORT}/process`);
  console.log(`📊 Extract:     POST http://localhost:${PORT}/ai/extract`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log('='.repeat(60) + '\n');
});

module.exports = app;
