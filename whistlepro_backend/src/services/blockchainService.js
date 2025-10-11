const axios = require('axios');
const crypto = require('crypto');

/**
 * Blockchain Integration Service
 * Connects WhistlePro Backend with Kaps' Blockchain API
 *
 * This service sends whistleblower reports to the blockchain for
 * tamper-proof, immutable storage with full anonymity protection.
 */

const BLOCKCHAIN_API_URL = process.env.BLOCKCHAIN_API_URL || 'http://localhost:3001';

class BlockchainService {
  /**
   * Submit a report to the blockchain
   * @param {Object} report - Report data from WhistlePro
   * @returns {Promise<Object>} Blockchain response with event ID and verification
   */
  static async submitReportToBlockchain(report) {
    try {
      // Map WhistlePro report fields to blockchain API format
      const blockchainPayload = {
        reportType: this.mapCategory(report.category),
        targetEntity: 'Anonymous Entity',  // Keep anonymized
        severity: this.mapPriority(report.priority),
        description: `[Encrypted Report]`,  // Don't send actual content
        evidenceHash: report.metadata_hash,  // Use the hash from WhistlePro
        estimatedAmount: null,  // Can be added if available
        location: 'undisclosed',
        whistleblowerKey: null,  // Optional: for secure follow-up
        metadata: {
          whistleproCaseId: report.case_id,
          status: report.status,
          submittedAt: report.created_at
        }
      };

      console.log(`📡 Submitting report ${report.case_id} to blockchain...`);

      const response = await axios.post(
        `${BLOCKCHAIN_API_URL}/api/whistlepro/report`,
        blockchainPayload,
        {
          headers: {
            'Content-Type': 'application/json'
          },
          timeout: 10000  // 10 second timeout
        }
      );

      if (response.data && response.data.success) {
        console.log(`✅ Report ${report.case_id} successfully recorded on blockchain`);
        console.log(`   Blockchain Event ID: ${response.data.report.blockchainEventId}`);
        console.log(`   Block Index: ${response.data.report.blockIndex}`);

        return {
          success: true,
          blockchainEventId: response.data.report.blockchainEventId,
          blockchainCaseCode: response.data.report.caseCode,
          blockIndex: response.data.report.blockIndex,
          evidenceHash: response.data.report.evidenceHash,
          timestamp: response.data.report.timestamp,
          trackingUrl: response.data.report.trackingUrl
        };
      } else {
        throw new Error('Blockchain API returned unsuccessful response');
      }
    } catch (error) {
      console.error('❌ Blockchain submission error:', error.message);

      // Don't fail the entire report submission if blockchain fails
      // Log the error and continue
      return {
        success: false,
        error: error.message,
        fallback: true,
        note: 'Report saved locally but blockchain integration failed'
      };
    }
  }

  /**
   * Verify a report's integrity on the blockchain
   * @param {string} blockchainCaseCode - Blockchain case code (WP-YYYY-XXXXXX)
   * @param {string} evidenceHash - Evidence hash to verify
   * @returns {Promise<Object>} Verification result
   */
  static async verifyReportIntegrity(blockchainCaseCode, evidenceHash) {
    try {
      const response = await axios.post(
        `${BLOCKCHAIN_API_URL}/api/whistlepro/verify/${blockchainCaseCode}`,
        { evidenceHash },
        {
          headers: {
            'Content-Type': 'application/json'
          },
          timeout: 5000
        }
      );

      return response.data;
    } catch (error) {
      console.error('Blockchain verification error:', error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Track a report on the blockchain (public tracking)
   * @param {string} blockchainCaseCode - Blockchain case code
   * @returns {Promise<Object>} Tracking information
   */
  static async trackReportOnBlockchain(blockchainCaseCode) {
    try {
      const response = await axios.get(
        `${BLOCKCHAIN_API_URL}/api/whistlepro/track/${blockchainCaseCode}`,
        {
          timeout: 5000
        }
      );

      return response.data;
    } catch (error) {
      console.error('Blockchain tracking error:', error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get blockchain statistics
   * @returns {Promise<Object>} Blockchain statistics
   */
  static async getBlockchainStats() {
    try {
      const response = await axios.get(
        `${BLOCKCHAIN_API_URL}/api/whistlepro/stats`,
        {
          timeout: 5000
        }
      );

      return response.data;
    } catch (error) {
      console.error('Blockchain stats error:', error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Map WhistlePro category to blockchain reportType
   */
  static mapCategory(category) {
    const mapping = {
      'tax_evasion': 'tax_evasion',
      'fraud': 'fraud',
      'corruption': 'corruption',
      'phantom_employees': 'fraud',
      'ghost_companies': 'fraud',
      'money_laundering': 'money_laundering',
      'bribery': 'corruption',
      'other': 'other'
    };

    return mapping[category] || 'other';
  }

  /**
   * Map WhistlePro priority to blockchain severity
   */
  static mapPriority(priority) {
    const mapping = {
      'low': 'LOW',
      'medium': 'MEDIUM',
      'high': 'HIGH',
      'critical': 'CRITICAL'
    };

    return mapping[priority] || 'MEDIUM';
  }

  /**
   * Check if blockchain is available
   * @returns {Promise<Boolean>} True if blockchain is accessible
   */
  static async checkBlockchainHealth() {
    try {
      const response = await axios.get(`${BLOCKCHAIN_API_URL}/health`, {
        timeout: 3000
      });

      return response.status === 200 && response.data.status === 'healthy';
    } catch (error) {
      console.warn('⚠️  Blockchain health check failed:', error.message);
      return false;
    }
  }
}

module.exports = BlockchainService;
