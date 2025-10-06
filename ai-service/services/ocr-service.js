const Tesseract = require('tesseract.js');
const pdfParse = require('pdf-parse');
const sharp = require('sharp');
const fs = require('fs').promises;
const path = require('path');
const logger = require('../utils/logger');

/**
 * OCR Service - Extracts text from images and PDFs using Tesseract.js
 */

class OCRService {
  constructor() {
    this.confidenceThreshold = parseInt(process.env.OCR_CONFIDENCE_THRESHOLD || '60');
    this.language = process.env.TESSERACT_LANG || 'eng';
  }

  /**
   * Process document and extract text
   * @param {string} filePath - Path to the document file
   * @param {string} mimeType - MIME type of the file
   * @returns {Promise<object>} Extracted text and metadata
   */
  async processDocument(filePath, mimeType) {
    const startTime = Date.now();

    try {
      logger.info('Starting OCR processing:', { filePath, mimeType });

      let text = '';
      let confidence = 0;
      let method = '';

      // Handle PDF files
      if (mimeType === 'application/pdf') {
        const result = await this.processPDF(filePath);
        text = result.text;
        confidence = result.confidence;
        method = 'pdf-parse + tesseract';
      }
      // Handle image files
      else if (mimeType.startsWith('image/')) {
        const result = await this.processImage(filePath);
        text = result.text;
        confidence = result.confidence;
        method = 'tesseract-ocr';
      }
      else {
        throw new Error(`Unsupported file type: ${mimeType}`);
      }

      const processingTime = Date.now() - startTime;

      logger.info('OCR processing completed:', {
        filePath,
        textLength: text.length,
        confidence,
        processingTime: `${processingTime}ms`
      });

      return {
        text,
        confidence,
        method,
        processingTime,
        success: text.length > 0
      };

    } catch (error) {
      logger.error('OCR processing failed:', {
        filePath,
        error: error.message,
        stack: error.stack
      });
      throw error;
    }
  }

  /**
   * Process PDF file
   */
  async processPDF(filePath) {
    try {
      const dataBuffer = await fs.readFile(filePath);
      const pdfData = await pdfParse(dataBuffer);

      let text = pdfData.text.trim();
      let confidence = 85; // PDF text extraction is generally reliable

      // If PDF has no extractable text, try OCR on converted images
      if (text.length < 50) {
        logger.info('PDF has minimal text, attempting OCR conversion');
        // For now, return the limited text
        // In production, you'd convert PDF pages to images and run OCR
        confidence = 60;
      }

      return {
        text,
        confidence,
        pages: pdfData.numpages,
        info: pdfData.info
      };

    } catch (error) {
      logger.error('PDF processing error:', error);
      throw new Error(`Failed to process PDF: ${error.message}`);
    }
  }

  /**
   * Process image file with Tesseract OCR
   */
  async processImage(filePath) {
    try {
      // Preprocess image for better OCR results
      const preprocessedPath = await this.preprocessImage(filePath);

      // Run Tesseract OCR
      const result = await Tesseract.recognize(
        preprocessedPath,
        this.language,
        {
          logger: (m) => {
            if (m.status === 'recognizing text') {
              logger.debug(`OCR progress: ${Math.round(m.progress * 100)}%`);
            }
          }
        }
      );

      // Clean up preprocessed image if it's different from original
      if (preprocessedPath !== filePath) {
        await fs.unlink(preprocessedPath).catch(() => {});
      }

      const text = result.data.text.trim();
      const confidence = result.data.confidence;

      logger.info('Tesseract OCR completed:', {
        textLength: text.length,
        confidence: Math.round(confidence)
      });

      return {
        text,
        confidence: Math.round(confidence),
        details: {
          words: result.data.words.length,
          lines: result.data.lines.length,
          paragraphs: result.data.paragraphs.length
        }
      };

    } catch (error) {
      logger.error('Image OCR error:', error);
      throw new Error(`Failed to process image: ${error.message}`);
    }
  }

  /**
   * Preprocess image for better OCR results
   * - Convert to grayscale
   * - Increase contrast
   * - Resize if too small
   */
  async preprocessImage(filePath) {
    try {
      const outputPath = filePath.replace(/\.[^.]+$/, '_preprocessed.png');

      await sharp(filePath)
        .grayscale()
        .normalise()
        .sharpen()
        .resize({
          width: 2000,
          fit: 'inside',
          withoutEnlargement: false
        })
        .toFile(outputPath);

      logger.debug('Image preprocessed:', { input: filePath, output: outputPath });

      return outputPath;

    } catch (error) {
      logger.warn('Image preprocessing failed, using original:', error.message);
      return filePath; // Return original if preprocessing fails
    }
  }

  /**
   * Extract text from multiple files (batch processing)
   */
  async processBatch(files) {
    const results = [];

    for (const file of files) {
      try {
        const result = await this.processDocument(file.path, file.mimetype);
        results.push({
          filename: file.originalname,
          success: true,
          ...result
        });
      } catch (error) {
        results.push({
          filename: file.originalname,
          success: false,
          error: error.message
        });
      }
    }

    return results;
  }
}

module.exports = new OCRService();
