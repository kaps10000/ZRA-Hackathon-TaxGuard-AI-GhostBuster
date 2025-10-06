const fs = require('fs');
const path = require('path');
const logger = require('../utils/logger');

/**
 * ZRA Verification Service
 * Simulates integration with ZRA internal systems for data cross-referencing
 */

// Load mock ZRA database
const ZRA_DB_PATH = path.join(__dirname, '../data/zra-mock-database.json');
let zraDatabase = null;

function loadZRADatabase() {
  try {
    const data = fs.readFileSync(ZRA_DB_PATH, 'utf8');
    zraDatabase = JSON.parse(data);
    logger.info('ZRA mock database loaded successfully');
    return zraDatabase;
  } catch (error) {
    logger.error('Failed to load ZRA database:', error.message);
    // Return empty database structure
    return {
      companies: [],
      hsCodes: [],
      declarations: [],
      countryRiskProfiles: {}
    };
  }
}

// Initialize database
if (!zraDatabase) {
  zraDatabase = loadZRADatabase();
}

/**
 * Verify company against ZRA registry
 * @param {string} companyName - Company name from document
 * @param {string} tpin - Tax Payer Identification Number
 * @returns {object} Verification result
 */
function verifyCompany(companyName, tpin = null) {
  const startTime = Date.now();

  try {
    if (!companyName) {
      return {
        verified: false,
        status: 'INVALID',
        reason: 'Company name not provided',
        riskFlags: ['MISSING_COMPANY_NAME']
      };
    }

    // Normalize company name for comparison
    const normalizedName = companyName.toLowerCase().trim();

    // Search for company in ZRA database
    const company = zraDatabase.companies.find(c =>
      c.companyName.toLowerCase().includes(normalizedName) ||
      normalizedName.includes(c.companyName.toLowerCase()) ||
      (tpin && c.tpin === tpin)
    );

    if (!company) {
      return {
        verified: false,
        status: 'SUSPICIOUS',
        reason: 'Company not found in ZRA registry',
        riskFlags: ['UNREGISTERED_COMPANY'],
        suggestion: 'Company may not be registered with ZRA or name mismatch'
      };
    }

    // Check company status
    const riskFlags = [];
    let status = 'VALID';

    if (company.status === 'FLAGGED') {
      riskFlags.push('COMPANY_FLAGGED');
      status = 'SUSPICIOUS';
    }

    if (company.riskRating === 'HIGH') {
      riskFlags.push('HIGH_RISK_COMPANY');
      status = 'SUSPICIOUS';
    }

    if (company.status === 'SUSPENDED' || company.status === 'REVOKED') {
      riskFlags.push('COMPANY_INACTIVE');
      status = 'INVALID';
    }

    if (company.flags && company.flags.length > 0) {
      riskFlags.push(...company.flags.map(f => f.toUpperCase().replace(/ /g, '_')));
    }

    const processingTime = Date.now() - startTime;

    return {
      verified: status === 'VALID',
      status,
      companyDetails: {
        companyId: company.companyId,
        companyName: company.companyName,
        tpin: company.tpin,
        registrationDate: company.registrationDate,
        businessType: company.businessType,
        riskRating: company.riskRating,
        verifiedImports: company.verifiedImports,
        totalImportValue: company.totalImportValue
      },
      riskFlags: riskFlags.length > 0 ? riskFlags : undefined,
      reason: status === 'VALID' ? 'Company verified in ZRA registry' : 'Company has risk flags',
      processingTime
    };

  } catch (error) {
    logger.error('Company verification error:', error);
    return {
      verified: false,
      status: 'ERROR',
      reason: 'Verification service error: ' + error.message,
      riskFlags: ['VERIFICATION_ERROR']
    };
  }
}

/**
 * Verify HS Code and validate pricing
 * @param {string} hsCode - Harmonized System code
 * @param {number} unitPrice - Unit price from invoice
 * @param {string} currency - Currency code
 * @returns {object} Verification result
 */
function verifyHSCode(hsCode, unitPrice = null, currency = 'USD') {
  try {
    if (!hsCode) {
      return {
        verified: false,
        status: 'INVALID',
        reason: 'HS Code not provided',
        riskFlags: ['MISSING_HS_CODE']
      };
    }

    // Normalize HS code (remove dots, trim)
    const normalizedHSCode = hsCode.replace(/\./g, '').trim();

    // Find HS code in database (exact or partial match)
    const hsCodeData = zraDatabase.hsCodes.find(h => {
      const dbCode = h.hsCode.replace(/\./g, '');
      return dbCode === normalizedHSCode ||
             dbCode.startsWith(normalizedHSCode) ||
             normalizedHSCode.startsWith(dbCode);
    });

    if (!hsCodeData) {
      return {
        verified: false,
        status: 'SUSPICIOUS',
        reason: 'HS Code not found in tariff database',
        riskFlags: ['UNKNOWN_HS_CODE'],
        suggestion: 'Verify HS code classification'
      };
    }

    const riskFlags = [];
    let status = 'VALID';

    // Check if price is provided and validate
    if (unitPrice && hsCodeData.typicalUnitPrice) {
      const { min, max } = hsCodeData.typicalUnitPrice;

      if (unitPrice < min * 0.5) {
        riskFlags.push('SIGNIFICANT_UNDERVALUATION');
        status = 'SUSPICIOUS';
      } else if (unitPrice < min) {
        riskFlags.push('POSSIBLE_UNDERVALUATION');
      }

      if (unitPrice > max * 2) {
        riskFlags.push('SIGNIFICANT_OVERVALUATION');
        status = 'SUSPICIOUS';
      } else if (unitPrice > max) {
        riskFlags.push('POSSIBLE_OVERVALUATION');
      }
    }

    // Check restrictions
    if (hsCodeData.restrictions && hsCodeData.restrictions.length > 0) {
      riskFlags.push('IMPORT_RESTRICTIONS_APPLY');
    }

    return {
      verified: status === 'VALID',
      status,
      hsCodeDetails: {
        hsCode: hsCodeData.hsCode,
        description: hsCodeData.description,
        category: hsCodeData.category,
        dutyRate: hsCodeData.dutyRate,
        vatRate: hsCodeData.vatRate,
        restrictions: hsCodeData.restrictions,
        typicalPriceRange: hsCodeData.typicalUnitPrice
      },
      riskFlags: riskFlags.length > 0 ? riskFlags : undefined,
      reason: status === 'VALID' ? 'HS Code verified' : 'HS Code has risk flags'
    };

  } catch (error) {
    logger.error('HS Code verification error:', error);
    return {
      verified: false,
      status: 'ERROR',
      reason: 'Verification service error: ' + error.message,
      riskFlags: ['VERIFICATION_ERROR']
    };
  }
}

/**
 * Verify declaration ID
 * @param {string} declarationId - Declaration reference number
 * @returns {object} Verification result
 */
function verifyDeclaration(declarationId) {
  try {
    if (!declarationId) {
      return {
        verified: false,
        status: 'SUSPICIOUS',
        reason: 'Declaration ID not provided',
        riskFlags: ['MISSING_DECLARATION_ID']
      };
    }

    const declaration = zraDatabase.declarations.find(d =>
      d.declarationId === declarationId
    );

    if (!declaration) {
      return {
        verified: false,
        status: 'SUSPICIOUS',
        reason: 'Declaration not found in ZRA system',
        riskFlags: ['UNKNOWN_DECLARATION'],
        suggestion: 'Declaration may not be submitted yet or ID is incorrect'
      };
    }

    const riskFlags = [];
    let status = 'VALID';

    if (declaration.status === 'REJECTED' || declaration.status === 'CANCELLED') {
      riskFlags.push('DECLARATION_REJECTED');
      status = 'INVALID';
    }

    return {
      verified: status === 'VALID',
      status,
      declarationDetails: {
        declarationId: declaration.declarationId,
        status: declaration.status,
        declarationDate: declaration.declarationDate,
        totalValue: declaration.totalValue,
        currency: declaration.currency
      },
      riskFlags: riskFlags.length > 0 ? riskFlags : undefined,
      reason: status === 'VALID' ? 'Declaration found in ZRA system' : 'Declaration has issues'
    };

  } catch (error) {
    logger.error('Declaration verification error:', error);
    return {
      verified: false,
      status: 'ERROR',
      reason: 'Verification service error: ' + error.message,
      riskFlags: ['VERIFICATION_ERROR']
    };
  }
}

/**
 * Verify country of origin risk profile
 * @param {string} country - Country name
 * @returns {object} Verification result
 */
function verifyCountryRisk(country) {
  try {
    if (!country) {
      return {
        verified: true,
        status: 'VALID',
        reason: 'Country not specified',
        riskLevel: 'UNKNOWN'
      };
    }

    const countryProfile = zraDatabase.countryRiskProfiles[country];

    if (!countryProfile) {
      return {
        verified: true,
        status: 'VALID',
        reason: 'Country not in risk database',
        riskLevel: 'UNKNOWN',
        suggestion: 'Manual review may be required'
      };
    }

    const riskFlags = [];

    if (countryProfile.riskLevel === 'HIGH') {
      riskFlags.push('HIGH_RISK_ORIGIN_COUNTRY');
    }

    if (countryProfile.requiresAdditionalChecks) {
      riskFlags.push('ADDITIONAL_CHECKS_REQUIRED');
    }

    return {
      verified: true,
      status: countryProfile.riskLevel === 'HIGH' ? 'SUSPICIOUS' : 'VALID',
      countryProfile: {
        country,
        riskLevel: countryProfile.riskLevel,
        commonFraudTypes: countryProfile.commonFraudTypes,
        requiresAdditionalChecks: countryProfile.requiresAdditionalChecks
      },
      riskFlags: riskFlags.length > 0 ? riskFlags : undefined,
      reason: `Country risk level: ${countryProfile.riskLevel}`
    };

  } catch (error) {
    logger.error('Country verification error:', error);
    return {
      verified: true,
      status: 'VALID',
      reason: 'Country verification error',
      riskLevel: 'UNKNOWN'
    };
  }
}

/**
 * Perform comprehensive document verification
 * @param {object} extractedData - Data extracted from OCR
 * @param {object} existingDeclaration - Existing declaration data (optional)
 * @returns {object} Complete verification result
 */
async function verifyDocument(extractedData, existingDeclaration = null) {
  const startTime = Date.now();

  try {
    const verificationResults = {
      companyVerification: null,
      hsCodeVerification: null,
      declarationVerification: null,
      countryVerification: null,
      crossReferenceChecks: [],
      ruleBasedChecks: [],
      overallStatus: 'VALID',
      overallVerified: true,
      allRiskFlags: [],
      recommendations: []
    };

    // 1. Verify company
    if (extractedData.importerName || extractedData.companyName) {
      const companyName = extractedData.importerName || extractedData.companyName;
      verificationResults.companyVerification = verifyCompany(companyName, extractedData.tpin);

      if (verificationResults.companyVerification.status !== 'VALID') {
        verificationResults.overallStatus = verificationResults.companyVerification.status;
        verificationResults.overallVerified = false;
      }

      if (verificationResults.companyVerification.riskFlags) {
        verificationResults.allRiskFlags.push(...verificationResults.companyVerification.riskFlags);
      }
    }

    // 2. Verify HS Code
    if (extractedData.hsCode) {
      const unitPrice = extractedData.unitPrice ||
                       (extractedData.totalValue && extractedData.quantity ?
                        extractedData.totalValue / extractedData.quantity : null);

      verificationResults.hsCodeVerification = verifyHSCode(
        extractedData.hsCode,
        unitPrice,
        extractedData.currency
      );

      if (verificationResults.hsCodeVerification.status === 'SUSPICIOUS' ||
          verificationResults.hsCodeVerification.status === 'INVALID') {
        verificationResults.overallStatus = verificationResults.hsCodeVerification.status;
        verificationResults.overallVerified = false;
      }

      if (verificationResults.hsCodeVerification.riskFlags) {
        verificationResults.allRiskFlags.push(...verificationResults.hsCodeVerification.riskFlags);
      }
    }

    // 3. Verify declaration
    if (extractedData.declarationId) {
      verificationResults.declarationVerification = verifyDeclaration(extractedData.declarationId);

      if (verificationResults.declarationVerification.riskFlags) {
        verificationResults.allRiskFlags.push(...verificationResults.declarationVerification.riskFlags);
      }
    }

    // 4. Verify country risk
    if (extractedData.originCountry) {
      verificationResults.countryVerification = verifyCountryRisk(extractedData.originCountry);

      if (verificationResults.countryVerification.riskFlags) {
        verificationResults.allRiskFlags.push(...verificationResults.countryVerification.riskFlags);
      }
    }

    // 5. Cross-reference checks (if declaration data provided)
    if (existingDeclaration && verificationResults.declarationVerification?.declarationDetails) {
      const declData = verificationResults.declarationVerification.declarationDetails;

      // Check value mismatch
      if (extractedData.totalValue && declData.totalValue) {
        const valueDiff = Math.abs(extractedData.totalValue - declData.totalValue);
        const percentDiff = (valueDiff / declData.totalValue) * 100;

        if (percentDiff > 10) {
          verificationResults.crossReferenceChecks.push({
            check: 'INVOICE_VALUE_MISMATCH',
            status: 'FAILED',
            severity: percentDiff > 25 ? 'HIGH' : 'MEDIUM',
            details: {
              invoiceValue: extractedData.totalValue,
              declarationValue: declData.totalValue,
              difference: valueDiff,
              percentageDifference: percentDiff.toFixed(2)
            },
            reason: `Invoice value differs from declaration by ${percentDiff.toFixed(1)}%`
          });
          verificationResults.allRiskFlags.push('VALUE_MISMATCH');
          verificationResults.overallStatus = 'SUSPICIOUS';
          verificationResults.overallVerified = false;
        } else {
          verificationResults.crossReferenceChecks.push({
            check: 'INVOICE_VALUE_MATCH',
            status: 'PASSED',
            severity: 'LOW',
            details: { percentageDifference: percentDiff.toFixed(2) }
          });
        }
      }
    }

    // 6. Rule-based checks
    const ruleChecks = performRuleBasedChecks(extractedData);
    verificationResults.ruleBasedChecks = ruleChecks;

    // Add rule check flags
    ruleChecks.forEach(check => {
      if (check.status === 'FAILED') {
        verificationResults.allRiskFlags.push(check.check);
        if (check.severity === 'HIGH') {
          verificationResults.overallStatus = 'SUSPICIOUS';
          verificationResults.overallVerified = false;
        }
      }
    });

    // 7. Generate recommendations
    if (verificationResults.allRiskFlags.length > 0) {
      verificationResults.recommendations = generateRecommendations(verificationResults);
    }

    const processingTime = Date.now() - startTime;
    verificationResults.metadata = {
      verificationTimestamp: new Date().toISOString(),
      processingTime,
      checksPerformed: [
        verificationResults.companyVerification ? 'COMPANY' : null,
        verificationResults.hsCodeVerification ? 'HS_CODE' : null,
        verificationResults.declarationVerification ? 'DECLARATION' : null,
        verificationResults.countryVerification ? 'COUNTRY' : null,
        'RULE_BASED_CHECKS'
      ].filter(Boolean),
      totalRiskFlags: verificationResults.allRiskFlags.length
    };

    logger.info('Document verification completed:', {
      status: verificationResults.overallStatus,
      riskFlags: verificationResults.allRiskFlags.length,
      processingTime
    });

    return verificationResults;

  } catch (error) {
    logger.error('Document verification error:', error);
    throw error;
  }
}

/**
 * Perform rule-based validation checks
 * @param {object} data - Extracted document data
 * @returns {array} Array of check results
 */
function performRuleBasedChecks(data) {
  const checks = [];

  // Check 1: Missing critical fields
  const criticalFields = ['invoiceNumber', 'totalValue', 'importerName'];
  const missingFields = criticalFields.filter(field => !data[field]);

  if (missingFields.length > 0) {
    checks.push({
      check: 'MISSING_CRITICAL_FIELDS',
      status: 'FAILED',
      severity: 'HIGH',
      details: { missingFields },
      reason: `Missing required fields: ${missingFields.join(', ')}`
    });
  } else {
    checks.push({
      check: 'CRITICAL_FIELDS_PRESENT',
      status: 'PASSED',
      severity: 'LOW'
    });
  }

  // Check 2: Quantity and value consistency
  if (data.quantity && data.unitPrice && data.totalValue) {
    const calculatedTotal = data.quantity * data.unitPrice;
    const diff = Math.abs(calculatedTotal - data.totalValue);
    const percentDiff = (diff / data.totalValue) * 100;

    if (percentDiff > 5) {
      checks.push({
        check: 'QUANTITY_VALUE_MISMATCH',
        status: 'FAILED',
        severity: percentDiff > 15 ? 'HIGH' : 'MEDIUM',
        details: {
          quantity: data.quantity,
          unitPrice: data.unitPrice,
          calculatedTotal,
          declaredTotal: data.totalValue,
          difference: diff,
          percentageDifference: percentDiff.toFixed(2)
        },
        reason: `Calculated total differs from declared total by ${percentDiff.toFixed(1)}%`
      });
    } else {
      checks.push({
        check: 'QUANTITY_VALUE_CONSISTENT',
        status: 'PASSED',
        severity: 'LOW'
      });
    }
  }

  // Check 3: Unusual values
  if (data.totalValue) {
    if (data.totalValue > 1000000) {
      checks.push({
        check: 'HIGH_VALUE_TRANSACTION',
        status: 'WARNING',
        severity: 'MEDIUM',
        details: { totalValue: data.totalValue },
        reason: 'Transaction value exceeds $1M - requires additional scrutiny'
      });
    }

    if (data.totalValue < 100 && data.quantity > 10) {
      checks.push({
        check: 'SUSPICIOUSLY_LOW_VALUE',
        status: 'FAILED',
        severity: 'HIGH',
        details: { totalValue: data.totalValue, quantity: data.quantity },
        reason: 'Unusually low value for declared quantity'
      });
    }
  }

  // Check 4: Round number suspicion (common in fraud)
  if (data.totalValue && data.totalValue % 1000 === 0 && data.totalValue > 10000) {
    checks.push({
      check: 'ROUND_NUMBER_VALUE',
      status: 'WARNING',
      severity: 'LOW',
      details: { totalValue: data.totalValue },
      reason: 'Invoice total is a perfect round number - may warrant review'
    });
  }

  // Check 5: Date consistency
  if (data.invoiceDate && data.shipmentDate) {
    const invoiceDate = new Date(data.invoiceDate);
    const shipmentDate = new Date(data.shipmentDate);

    if (shipmentDate < invoiceDate) {
      checks.push({
        check: 'DATE_INCONSISTENCY',
        status: 'FAILED',
        severity: 'MEDIUM',
        details: { invoiceDate: data.invoiceDate, shipmentDate: data.shipmentDate },
        reason: 'Shipment date is before invoice date'
      });
    }
  }

  return checks;
}

/**
 * Generate recommendations based on verification results
 * @param {object} verificationResults - Verification results object
 * @returns {array} Array of recommendations
 */
function generateRecommendations(verificationResults) {
  const recommendations = [];

  if (verificationResults.allRiskFlags.includes('UNREGISTERED_COMPANY')) {
    recommendations.push({
      type: 'ACTION_REQUIRED',
      priority: 'HIGH',
      action: 'Verify company registration with ZRA before processing'
    });
  }

  if (verificationResults.allRiskFlags.includes('SIGNIFICANT_UNDERVALUATION')) {
    recommendations.push({
      type: 'VALUATION_REVIEW',
      priority: 'HIGH',
      action: 'Conduct market price verification for declared goods'
    });
  }

  if (verificationResults.allRiskFlags.includes('HIGH_RISK_ORIGIN_COUNTRY')) {
    recommendations.push({
      type: 'ADDITIONAL_CHECKS',
      priority: 'MEDIUM',
      action: 'Perform enhanced due diligence based on country risk profile'
    });
  }

  if (verificationResults.allRiskFlags.includes('VALUE_MISMATCH')) {
    recommendations.push({
      type: 'CROSS_REFERENCE_REVIEW',
      priority: 'HIGH',
      action: 'Reconcile invoice value with customs declaration'
    });
  }

  if (verificationResults.allRiskFlags.includes('IMPORT_RESTRICTIONS_APPLY')) {
    recommendations.push({
      type: 'COMPLIANCE_CHECK',
      priority: 'HIGH',
      action: 'Verify compliance with import restrictions and licensing requirements'
    });
  }

  if (verificationResults.overallStatus === 'SUSPICIOUS' && recommendations.length === 0) {
    recommendations.push({
      type: 'MANUAL_REVIEW',
      priority: 'MEDIUM',
      action: 'Flag for manual review by customs officer'
    });
  }

  return recommendations;
}

module.exports = {
  verifyDocument,
  verifyCompany,
  verifyHSCode,
  verifyDeclaration,
  verifyCountryRisk,
  loadZRADatabase
};
