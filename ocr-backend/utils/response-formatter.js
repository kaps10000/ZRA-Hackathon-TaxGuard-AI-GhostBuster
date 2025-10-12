/**
 * Standardized Response Formatter
 * Creates consistent response objects for frontend and blockchain integration
 */

/**
 * Format verification response for frontend consumption
 * @param {object} document - Document from database
 * @param {object} verificationResult - Verification result from ZRA service
 * @returns {object} Formatted response
 */
function formatVerificationResponse(document, verificationResult) {
  return {
    // Document Information
    document: {
      documentId: document.documentId,
      filename: document.filename,
      status: document.status,
      uploadedAt: document.uploadedAt,
      processedAt: document.processedAt,
      verifiedAt: document.verifiedAt
    },

    // Extracted Data (OCR Results)
    extractedData: document.ocrData?.extractedData || document.ocrData || {},

    // Verification Summary
    verification: {
      status: verificationResult.overallStatus,
      verified: verificationResult.overallVerified,
      riskScore: document.riskScore,
      riskLevel: getRiskLevel(document.riskScore),
      totalRiskFlags: verificationResult.allRiskFlags?.length || 0,
      riskFlags: verificationResult.allRiskFlags || [],
      recommendations: verificationResult.recommendations || []
    },

    // Detailed Verification Results
    verificationDetails: {
      company: verificationResult.companyVerification || null,
      hsCode: verificationResult.hsCodeVerification || null,
      declaration: verificationResult.declarationVerification || null,
      country: verificationResult.countryVerification || null,
      crossReferenceChecks: verificationResult.crossReferenceChecks || [],
      ruleBasedChecks: verificationResult.ruleBasedChecks || []
    },

    // Blockchain Information
    blockchain: {
      transactionId: document.blockchainTxId,
      blockNumber: document.blockNumber,
      verified: !!document.blockchainTxId,
      timestamp: document.blockchainProof?.timestamp
    },

    // Metadata
    metadata: {
      aiModel: document.aiMetadata?.model,
      aiConfidence: document.aiMetadata?.confidence,
      processingTime: verificationResult.metadata?.processingTime,
      verificationTimestamp: verificationResult.metadata?.verificationTimestamp,
      checksPerformed: verificationResult.metadata?.checksPerformed || []
    }
  };
}

/**
 * Format verification response for blockchain storage
 * @param {object} document - Document from database
 * @param {object} verificationResult - Verification result from ZRA service
 * @returns {object} Blockchain-ready payload
 */
function formatBlockchainPayload(document, verificationResult) {
  return {
    // Core Identifiers
    documentId: document.documentId,
    documentHash: document.fileHash,
    timestamp: new Date().toISOString(),

    // Verification Summary
    verificationStatus: verificationResult.overallStatus,
    verified: verificationResult.overallVerified,
    riskScore: document.riskScore,

    // Critical Data Points
    extractedData: {
      invoiceNumber: document.ocrData?.extractedData?.invoiceNumber,
      importerName: document.ocrData?.extractedData?.importerName || document.ocrData?.extractedData?.companyName,
      declarationId: document.ocrData?.extractedData?.declarationId,
      hsCode: document.ocrData?.extractedData?.hsCode,
      totalValue: document.ocrData?.extractedData?.totalValue,
      currency: document.ocrData?.extractedData?.currency,
      originCountry: document.ocrData?.extractedData?.originCountry
    },

    // Verification Flags
    riskFlags: verificationResult.allRiskFlags || [],

    // Company Verification
    companyVerified: verificationResult.companyVerification?.verified || false,
    companyTpin: verificationResult.companyVerification?.companyDetails?.tpin,

    // Validation Checksums
    checksPerformed: verificationResult.metadata?.checksPerformed || [],
    totalChecks: (verificationResult.crossReferenceChecks?.length || 0) +
                 (verificationResult.ruleBasedChecks?.length || 0),

    // Metadata
    metadata: {
      verificationEngine: 'ZRA-TaxGuard-v1.0',
      processingTime: verificationResult.metadata?.processingTime,
      aiConfidence: document.aiMetadata?.confidence
    }
  };
}

/**
 * Format summary response (for lists/dashboards)
 * @param {object} document - Document from database
 * @returns {object} Summary response
 */
function formatSummaryResponse(document) {
  return {
    documentId: document.documentId,
    filename: document.filename,
    status: document.status,
    verificationStatus: document.verificationStatus,
    riskScore: document.riskScore,
    riskLevel: getRiskLevel(document.riskScore),
    uploadedAt: document.uploadedAt,
    verifiedAt: document.verifiedAt,
    metadata: {
      importerName: document.metadata?.importerName || document.ocrData?.extractedData?.importerName,
      declarationId: document.metadata?.declarationId || document.ocrData?.extractedData?.declarationId,
      totalValue: document.ocrData?.extractedData?.totalValue
    },
    blockchain: {
      verified: !!document.blockchainTxId,
      transactionId: document.blockchainTxId
    }
  };
}

/**
 * Format error response
 * @param {string} message - Error message
 * @param {object} details - Additional error details
 * @param {number} statusCode - HTTP status code
 * @returns {object} Error response
 */
function formatErrorResponse(message, details = {}, statusCode = 500) {
  return {
    success: false,
    error: {
      message,
      statusCode,
      timestamp: new Date().toISOString(),
      ...details
    }
  };
}

/**
 * Format success response
 * @param {string} message - Success message
 * @param {object} data - Response data
 * @returns {object} Success response
 */
function formatSuccessResponse(message, data = {}) {
  return {
    success: true,
    message,
    timestamp: new Date().toISOString(),
    ...data
  };
}

/**
 * Get risk level from risk score
 * @param {number} riskScore - Risk score (0-100)
 * @returns {string} Risk level
 */
function getRiskLevel(riskScore) {
  if (riskScore === null || riskScore === undefined) {
    return 'UNKNOWN';
  }

  if (riskScore >= 70) return 'HIGH';
  if (riskScore >= 40) return 'MEDIUM';
  return 'LOW';
}

/**
 * Format verification result for frontend display
 * @param {object} verificationResult - Raw verification result
 * @returns {object} User-friendly verification result
 */
function formatUserFriendlyVerification(verificationResult) {
  const checks = {
    company: {
      label: 'Company Registration',
      status: verificationResult.companyVerification?.status || 'NOT_CHECKED',
      verified: verificationResult.companyVerification?.verified || false,
      details: verificationResult.companyVerification?.companyDetails,
      issues: verificationResult.companyVerification?.riskFlags || []
    },
    hsCode: {
      label: 'HS Code Validation',
      status: verificationResult.hsCodeVerification?.status || 'NOT_CHECKED',
      verified: verificationResult.hsCodeVerification?.verified || false,
      details: verificationResult.hsCodeVerification?.hsCodeDetails,
      issues: verificationResult.hsCodeVerification?.riskFlags || []
    },
    declaration: {
      label: 'Declaration Verification',
      status: verificationResult.declarationVerification?.status || 'NOT_CHECKED',
      verified: verificationResult.declarationVerification?.verified || false,
      details: verificationResult.declarationVerification?.declarationDetails,
      issues: verificationResult.declarationVerification?.riskFlags || []
    },
    country: {
      label: 'Origin Country Risk',
      status: verificationResult.countryVerification?.status || 'NOT_CHECKED',
      verified: verificationResult.countryVerification?.verified || false,
      details: verificationResult.countryVerification?.countryProfile,
      issues: verificationResult.countryVerification?.riskFlags || []
    }
  };

  const summary = {
    overall: {
      status: verificationResult.overallStatus,
      verified: verificationResult.overallVerified,
      totalIssues: verificationResult.allRiskFlags?.length || 0
    },
    checks,
    issues: {
      critical: verificationResult.ruleBasedChecks?.filter(c => c.severity === 'HIGH') || [],
      warnings: verificationResult.ruleBasedChecks?.filter(c => c.severity === 'MEDIUM') || [],
      info: verificationResult.ruleBasedChecks?.filter(c => c.severity === 'LOW') || []
    },
    recommendations: verificationResult.recommendations || [],
    timestamp: verificationResult.metadata?.verificationTimestamp
  };

  return summary;
}

module.exports = {
  formatVerificationResponse,
  formatBlockchainPayload,
  formatSummaryResponse,
  formatErrorResponse,
  formatSuccessResponse,
  formatUserFriendlyVerification,
  getRiskLevel
};
