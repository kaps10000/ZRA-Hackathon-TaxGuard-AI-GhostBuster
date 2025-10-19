const logger = require('../utils/logger');

/**
 * Field Extractor Service
 * Extracts structured data from OCR text using regex patterns and NLP
 */

class FieldExtractor {
  constructor() {
    // Regex patterns for common document fields
    this.patterns = {
      // Invoice patterns
      invoiceNumber: [
        /invoice\s*#?\s*:?\s*([A-Z0-9\-]+)/i,
        /inv\s*#?\s*:?\s*([A-Z0-9\-]+)/i,
        /bill\s*#?\s*:?\s*([A-Z0-9\-]+)/i,
        /reference\s*:?\s*([A-Z0-9\-]+)/i
      ],

      // Date patterns
      date: [
        /date\s*:?\s*(\d{1,2}[-\/]\d{1,2}[-\/]\d{2,4})/i,
        /(\d{1,2}[-\/]\d{1,2}[-\/]\d{2,4})/,
        /(\d{4}[-\/]\d{1,2}[-\/]\d{1,2})/
      ],

      // Company/Importer name
      companyName: [
        /(?:company|importer|seller|vendor)\s*:?\s*([A-Za-z0-9\s&.,'-]+)/i,
        /from\s*:?\s*([A-Za-z0-9\s&.,'-]+)/i
      ],

      // HS Code (Harmonized System Code)
      hsCode: [
        /hs\s*code\s*:?\s*(\d{4,10}[\.\-]?\d*)/i,
        /harmonized\s*code\s*:?\s*(\d{4,10}[\.\-]?\d*)/i,
        /tariff\s*code\s*:?\s*(\d{4,10}[\.\-]?\d*)/i,
        /(\d{4}\.\d{2}(?:\.\d{2})?)/  // Format: 8471.30.00
      ],

      // Amount/Value patterns
      totalAmount: [
        /total\s*:?\s*\$?([0-9,]+\.?\d*)/i,
        /amount\s*:?\s*\$?([0-9,]+\.?\d*)/i,
        /grand\s*total\s*:?\s*\$?([0-9,]+\.?\d*)/i,
        /\$\s*([0-9,]+\.?\d{2})/
      ],

      // Currency
      currency: [
        /currency\s*:?\s*([A-Z]{3})/i,
        /(USD|EUR|GBP|ZMW|CNY)/
      ],

      // Quantity
      quantity: [
        /quantity\s*:?\s*(\d+)/i,
        /qty\s*:?\s*(\d+)/i,
        /units\s*:?\s*(\d+)/i
      ],

      // Declaration ID
      declarationId: [
        /declaration\s*#?\s*:?\s*([A-Z0-9\-]+)/i,
        /decl\s*#?\s*:?\s*([A-Z0-9\-]+)/i,
        /customs\s*ref\s*:?\s*([A-Z0-9\-]+)/i
      ],

      // Country patterns
      originCountry: [
        /origin\s*:?\s*([A-Za-z\s]+)/i,
        /from\s*country\s*:?\s*([A-Za-z\s]+)/i,
        /made\s*in\s*:?\s*([A-Za-z\s]+)/i
      ],

      destinationCountry: [
        /destination\s*:?\s*([A-Za-z\s]+)/i,
        /to\s*country\s*:?\s*([A-Za-z\s]+)/i,
        /ship\s*to\s*:?\s*([A-Za-z\s]+)/i
      ],

      // Description
      description: [
        /description\s*:?\s*([A-Za-z0-9\s,.-]+)/i,
        /item\s*:?\s*([A-Za-z0-9\s,.-]+)/i,
        /goods\s*:?\s*([A-Za-z0-9\s,.-]+)/i
      ]
    };
  }

  /**
   * Extract all fields from OCR text
   * @param {string} text - Raw OCR text
   * @returns {object} Extracted fields with confidence scores
   */
  extractFields(text) {
    const startTime = Date.now();

    try {
      logger.info('Starting field extraction from text:', {
        textLength: text.length
      });

      const extracted = {};
      const confidenceScores = {};

      // Extract each field type
      for (const [fieldName, patterns] of Object.entries(this.patterns)) {
        const result = this.extractField(text, patterns, fieldName);
        if (result.value) {
          extracted[fieldName] = result.value;
          confidenceScores[fieldName] = result.confidence;
        }
      }

      // Post-processing and validation
      const processed = this.postProcess(extracted);

      // Calculate overall confidence
      const overallConfidence = this.calculateOverallConfidence(confidenceScores);

      const processingTime = Date.now() - startTime;

      logger.info('Field extraction completed:', {
        fieldsExtracted: Object.keys(processed).length,
        overallConfidence,
        processingTime: `${processingTime}ms`
      });

      return {
        extractedData: processed,
        confidenceScores,
        overallConfidence,
        fieldsExtracted: Object.keys(processed).length,
        processingTime
      };

    } catch (error) {
      logger.error('Field extraction error:', error);
      throw error;
    }
  }

  /**
   * Extract a single field using multiple regex patterns
   */
  extractField(text, patterns, fieldName) {
    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match && match[1]) {
        const value = match[1].trim();

        // Validate the extracted value
        const isValid = this.validateField(fieldName, value);

        if (isValid) {
          logger.debug(`Extracted ${fieldName}:`, value);
          return {
            value: this.cleanValue(value, fieldName),
            confidence: this.calculateFieldConfidence(fieldName, value, pattern)
          };
        }
      }
    }

    return { value: null, confidence: 0 };
  }

  /**
   * Clean and normalize extracted values
   */
  cleanValue(value, fieldName) {
    // Remove extra whitespace
    value = value.replace(/\s+/g, ' ').trim();

    // Field-specific cleaning
    switch (fieldName) {
      case 'totalAmount':
      case 'quantity':
        return value.replace(/,/g, '');

      case 'companyName':
        return value.replace(/\s{2,}/g, ' ').substring(0, 100);

      case 'hsCode':
        return value.replace(/[^\d.]/g, '');

      case 'currency':
        return value.toUpperCase();

      default:
        return value;
    }
  }

  /**
   * Validate extracted field values
   */
  validateField(fieldName, value) {
    if (!value || value.length === 0) return false;

    switch (fieldName) {
      case 'invoiceNumber':
      case 'declarationId':
        return value.length >= 3 && value.length <= 50;

      case 'hsCode':
        return /^\d{4,10}\.?\d*$/.test(value.replace(/[^\d.]/g, ''));

      case 'totalAmount':
      case 'quantity':
        return !isNaN(value.replace(/,/g, ''));

      case 'currency':
        return /^[A-Z]{3}$/.test(value);

      case 'companyName':
        return value.length >= 2 && value.length <= 150;

      default:
        return true;
    }
  }

  /**
   * Calculate confidence score for a field extraction
   */
  calculateFieldConfidence(fieldName, value, pattern) {
    let confidence = 70; // Base confidence

    // Increase confidence for strict patterns
    if (pattern.toString().includes('^') || pattern.toString().includes('$')) {
      confidence += 10;
    }

    // Increase confidence for specific keywords
    if (fieldName === 'invoiceNumber' && /invoice/i.test(pattern.toString())) {
      confidence += 15;
    }

    // Adjust based on value characteristics
    if (fieldName === 'hsCode' && /^\d{4}\.\d{2}/.test(value)) {
      confidence += 10; // Proper HS code format
    }

    if (fieldName === 'currency' && ['USD', 'EUR', 'GBP'].includes(value)) {
      confidence += 10; // Common currencies
    }

    return Math.min(confidence, 95); // Cap at 95%
  }

  /**
   * Calculate overall extraction confidence
   */
  calculateOverallConfidence(confidenceScores) {
    const scores = Object.values(confidenceScores);
    if (scores.length === 0) return 0;

    const average = scores.reduce((a, b) => a + b, 0) / scores.length;

    // Bonus for extracting critical fields
    const criticalFields = ['invoiceNumber', 'totalAmount', 'companyName'];
    const criticalFound = criticalFields.filter(field =>
      confidenceScores[field] && confidenceScores[field] > 60
    ).length;

    const bonus = (criticalFound / criticalFields.length) * 10;

    return Math.min(Math.round(average + bonus), 95);
  }

  /**
   * Post-process extracted data
   */
  postProcess(extracted) {
    const processed = { ...extracted };

    // Parse numeric values
    if (processed.totalAmount) {
      processed.totalValue = parseFloat(processed.totalAmount.replace(/,/g, ''));
    }

    if (processed.quantity) {
      processed.quantity = parseInt(processed.quantity);
    }

    // Set defaults
    if (!processed.currency && processed.totalAmount) {
      processed.currency = 'USD'; // Default currency
    }

    if (!processed.destinationCountry) {
      processed.destinationCountry = 'Zambia'; // Default for ZRA
    }

    // Format dates
    if (processed.date) {
      processed.shipmentDate = this.normalizeDate(processed.date);
    }

    // Document type inference
    if (processed.invoiceNumber) {
      processed.documentType = 'commercial_invoice';
    }

    return processed;
  }

  /**
   * Normalize date to YYYY-MM-DD format
   */
  normalizeDate(dateStr) {
    try {
      const date = new Date(dateStr);
      if (!isNaN(date)) {
        return date.toISOString().split('T')[0];
      }
    } catch (e) {
      logger.warn('Date normalization failed:', dateStr);
    }
    return dateStr;
  }
}

module.exports = new FieldExtractor();
