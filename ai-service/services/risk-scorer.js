const logger = require('../utils/logger');

/**
 * Risk Scorer Service
 * Calculates fraud risk scores based on extracted data and patterns
 */

class RiskScorer {
  constructor() {
    // Risk weights for different factors
    this.weights = {
      lowConfidence: 25,
      missingCriticalFields: 20,
      suspiciousValues: 30,
      anomalousPatterns: 15,
      documentQuality: 10
    };
  }

  /**
   * Calculate risk score for extracted document data
   * @param {object} extractedData - Extracted fields from document
   * @param {object} confidenceScores - Confidence scores for each field
   * @param {number} ocrConfidence - Overall OCR confidence
   * @returns {object} Risk assessment with score and flags
   */
  calculateRiskScore(extractedData, confidenceScores, ocrConfidence) {
    const startTime = Date.now();

    try {
      logger.info('Calculating risk score...');

      let totalRisk = 0;
      const riskFlags = [];

      // Factor 1: Low OCR/extraction confidence
      const confidenceRisk = this.assessConfidenceRisk(confidenceScores, ocrConfidence);
      totalRisk += confidenceRisk.score;
      if (confidenceRisk.flags.length > 0) {
        riskFlags.push(...confidenceRisk.flags);
      }

      // Factor 2: Missing critical fields
      const missingFieldsRisk = this.assessMissingFields(extractedData);
      totalRisk += missingFieldsRisk.score;
      if (missingFieldsRisk.flags.length > 0) {
        riskFlags.push(...missingFieldsRisk.flags);
      }

      // Factor 3: Suspicious values
      const suspiciousValuesRisk = this.assessSuspiciousValues(extractedData);
      totalRisk += suspiciousValuesRisk.score;
      if (suspiciousValuesRisk.flags.length > 0) {
        riskFlags.push(...suspiciousValuesRisk.flags);
      }

      // Factor 4: Anomalous patterns
      const anomalyRisk = this.assessAnomalies(extractedData);
      totalRisk += anomalyRisk.score;
      if (anomalyRisk.flags.length > 0) {
        riskFlags.push(...anomalyRisk.flags);
      }

      // Cap risk score at 100
      const riskScore = Math.min(Math.round(totalRisk), 100);

      // Determine risk level
      const riskLevel = this.determineRiskLevel(riskScore);

      const processingTime = Date.now() - startTime;

      logger.info('Risk assessment completed:', {
        riskScore,
        riskLevel,
        flagsCount: riskFlags.length,
        processingTime: `${processingTime}ms`
      });

      return {
        riskScore,
        riskLevel,
        riskFlags,
        breakdown: {
          confidence: confidenceRisk.score,
          missingFields: missingFieldsRisk.score,
          suspiciousValues: suspiciousValuesRisk.score,
          anomalies: anomalyRisk.score
        }
      };

    } catch (error) {
      logger.error('Risk scoring error:', error);
      throw error;
    }
  }

  /**
   * Assess risk based on confidence scores
   */
  assessConfidenceRisk(confidenceScores, ocrConfidence) {
    let risk = 0;
    const flags = [];

    // Check OCR confidence
    if (ocrConfidence < 60) {
      risk += 20;
      flags.push({
        type: 'low_ocr_confidence',
        severity: 'high',
        message: `OCR confidence very low: ${ocrConfidence}%`
      });
    } else if (ocrConfidence < 75) {
      risk += 10;
      flags.push({
        type: 'moderate_ocr_confidence',
        severity: 'medium',
        message: `OCR confidence below threshold: ${ocrConfidence}%`
      });
    }

    // Check field-level confidence
    const lowConfidenceFields = Object.entries(confidenceScores)
      .filter(([_, conf]) => conf < 70);

    if (lowConfidenceFields.length > 0) {
      risk += lowConfidenceFields.length * 3;
      flags.push({
        type: 'low_field_confidence',
        severity: 'medium',
        message: `${lowConfidenceFields.length} fields have low confidence`,
        fields: lowConfidenceFields.map(([field, _]) => field)
      });
    }

    return {
      score: Math.min(risk, this.weights.lowConfidence),
      flags
    };
  }

  /**
   * Assess risk based on missing critical fields
   */
  assessMissingFields(extractedData) {
    const criticalFields = [
      'invoiceNumber',
      'companyName',
      'totalAmount',
      'hsCode'
    ];

    const missingFields = criticalFields.filter(field => !extractedData[field]);

    let risk = missingFields.length * 7;
    const flags = [];

    if (missingFields.length > 0) {
      flags.push({
        type: 'missing_critical_fields',
        severity: missingFields.length > 2 ? 'high' : 'medium',
        message: `${missingFields.length} critical fields missing`,
        fields: missingFields
      });
    }

    return {
      score: Math.min(risk, this.weights.missingCriticalFields),
      flags
    };
  }

  /**
   * Assess risk based on suspicious values
   */
  assessSuspiciousValues(extractedData) {
    let risk = 0;
    const flags = [];

    // Check for unusually high values
    if (extractedData.totalValue) {
      const value = extractedData.totalValue;

      if (value > 1000000) {
        risk += 15;
        flags.push({
          type: 'unusually_high_value',
          severity: 'high',
          message: `Extremely high value: $${value}`,
          value
        });
      } else if (value > 500000) {
        risk += 8;
        flags.push({
          type: 'high_value',
          severity: 'medium',
          message: `High value transaction: $${value}`,
          value
        });
      }

      // Check for suspiciously round numbers
      if (value >= 10000 && value % 10000 === 0) {
        risk += 5;
        flags.push({
          type: 'round_number',
          severity: 'low',
          message: `Suspiciously round value: $${value}`
        });
      }
    }

    // Check for suspicious HS codes (example: common fraud patterns)
    if (extractedData.hsCode) {
      const hsCode = extractedData.hsCode;

      // Check if HS code is too generic (first 4 digits only)
      if (/^\d{4}$/.test(hsCode)) {
        risk += 10;
        flags.push({
          type: 'generic_hs_code',
          severity: 'medium',
          message: `HS code too generic: ${hsCode}`
        });
      }
    }

    // Check for known high-risk origin countries (example)
    const highRiskCountries = ['North Korea', 'Syria', 'Iran'];
    if (extractedData.originCountry &&
        highRiskCountries.some(country =>
          extractedData.originCountry.toLowerCase().includes(country.toLowerCase())
        )) {
      risk += 20;
      flags.push({
        type: 'high_risk_origin',
        severity: 'high',
        message: `Document from high-risk country: ${extractedData.originCountry}`
      });
    }

    return {
      score: Math.min(risk, this.weights.suspiciousValues),
      flags
    };
  }

  /**
   * Assess risk based on anomalous patterns
   */
  assessAnomalies(extractedData) {
    let risk = 0;
    const flags = [];

    // Check for inconsistencies between quantity and value
    if (extractedData.quantity && extractedData.totalValue) {
      const unitPrice = extractedData.totalValue / extractedData.quantity;

      if (unitPrice < 0.01) {
        risk += 12;
        flags.push({
          type: 'suspiciously_low_unit_price',
          severity: 'high',
          message: `Unit price suspiciously low: $${unitPrice.toFixed(2)}`
        });
      } else if (unitPrice > 100000) {
        risk += 10;
        flags.push({
          type: 'suspiciously_high_unit_price',
          severity: 'high',
          message: `Unit price suspiciously high: $${unitPrice.toFixed(2)}`
        });
      }
    }

    // Check for missing but related fields
    if (extractedData.totalAmount && !extractedData.currency) {
      risk += 5;
      flags.push({
        type: 'missing_currency',
        severity: 'low',
        message: 'Amount specified but currency missing'
      });
    }

    // Check for date anomalies
    if (extractedData.shipmentDate) {
      const date = new Date(extractedData.shipmentDate);
      const now = new Date();

      // Future date
      if (date > now) {
        const daysDiff = Math.ceil((date - now) / (1000 * 60 * 60 * 24));
        if (daysDiff > 90) {
          risk += 8;
          flags.push({
            type: 'future_shipment_date',
            severity: 'medium',
            message: `Shipment date far in future: ${daysDiff} days`
          });
        }
      }

      // Very old date
      const oneYearAgo = new Date();
      oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

      if (date < oneYearAgo) {
        risk += 6;
        flags.push({
          type: 'old_document',
          severity: 'low',
          message: 'Document date more than 1 year old'
        });
      }
    }

    return {
      score: Math.min(risk, this.weights.anomalousPatterns),
      flags
    };
  }

  /**
   * Determine risk level based on score
   */
  determineRiskLevel(riskScore) {
    if (riskScore <= 30) return 'LOW';
    if (riskScore <= 60) return 'MEDIUM';
    return 'HIGH';
  }

  /**
   * Generate human-readable risk summary
   */
  generateRiskSummary(riskAssessment) {
    const { riskScore, riskLevel, riskFlags } = riskAssessment;

    let summary = `Risk Score: ${riskScore}/100 (${riskLevel} RISK)\\n\\n`;

    if (riskFlags.length === 0) {
      summary += 'No significant risk factors detected.';
    } else {
      summary += 'Risk Factors:\\n';
      riskFlags.forEach((flag, index) => {
        summary += `${index + 1}. [${flag.severity.toUpperCase()}] ${flag.message}\\n`;
      });
    }

    return summary;
  }
}

module.exports = new RiskScorer();
