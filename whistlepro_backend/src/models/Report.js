const db = require('../config/database');
const { v4: uuidv4 } = require('uuid');
const crypto = require('crypto');
const encryptionService = require('../services/encryptionService');
const auditService = require('../services/auditService');
const BlockchainService = require('../services/blockchainService');

class Report {
  static tableName = 'reports';

  /**
   * Generate a unique case ID
   * Format: ZRA-YYYY-XXXXXX (e.g., ZRA-2023-A1B2C3)
   */
  static generateCaseId() {
    const year = new Date().getFullYear();
    const randomPart = crypto.randomBytes(3).toString('hex').toUpperCase();
    return `ZRA-${year}-${randomPart}`;
  }

  /**
   * Create a new report
   */
  static async create(reportData, metadata = {}) {
    const caseId = this.generateCaseId();
    
    // Encrypt the payload
    const encryptedPayload = encryptionService.encrypt(JSON.stringify(reportData));
    
    // Create hash for blockchain
    const metadataHash = crypto
      .createHash('sha256')
      .update(JSON.stringify({ caseId, ...reportData }))
      .digest('hex');

    const report = {
      case_id: caseId,
      payload_encrypted: encryptedPayload,
      category: reportData.category || 'general',
      status: 'pending',
      priority: reportData.priority || 'medium',
      metadata_hash: metadataHash,
      created_at: new Date(),
      updated_at: new Date()
    };

    try {
      const [newReport] = await db(this.tableName)
        .insert(report)
        .returning('*');

      // Log audit trail
      await auditService.log({
        actor_id: null,
        actor_type: 'anonymous',
        action: 'report_created',
        target_type: 'report',
        target_id: newReport.id,
        ip_hash: metadata.ip_hash,
        user_agent_hash: metadata.user_agent_hash,
        metadata: {
          case_id: caseId,
          category: report.category,
          priority: report.priority
        }
      });

      // ✨ NEW: Submit to blockchain for immutable storage
      try {
        const blockchainResult = await BlockchainService.submitReportToBlockchain(newReport);

        if (blockchainResult.success) {
          console.log(`🔗 Report ${caseId} linked to blockchain event ${blockchainResult.blockchainEventId}`);

          // Optionally store blockchain reference in database
          // (Could add a blockchain_event_id column to reports table)
        } else if (blockchainResult.fallback) {
          console.warn(`⚠️  Report ${caseId} saved locally, blockchain integration failed`);
        }
      } catch (blockchainError) {
        // Log blockchain error but don't fail the report creation
        console.error('Blockchain integration error (non-critical):', blockchainError.message);
      }

      return {
        id: newReport.id,
        case_id: newReport.case_id,
        category: newReport.category,
        status: newReport.status,
        priority: newReport.priority,
        created_at: newReport.created_at,
        metadata_hash: newReport.metadata_hash
      };
    } catch (error) {
      throw new Error(`Failed to create report: ${error.message}`);
    }
  }

  /**
   * Find report by case ID (for investigators)
   */
  static async findByCaseId(caseId, investigatorId = null) {
    try {
      const report = await db(this.tableName)
        .where('case_id', caseId)
        .first();

      if (!report) {
        return null;
      }

      // Decrypt payload for investigators
      let decryptedPayload = null;
      if (investigatorId) {
        try {
          decryptedPayload = JSON.parse(encryptionService.decrypt(report.payload_encrypted));
        } catch (error) {
          console.error('Failed to decrypt report payload:', error.message);
        }

        // Log audit trail for viewing
        await auditService.log({
          actor_id: investigatorId,
          actor_type: 'investigator',
          action: 'report_viewed',
          target_type: 'report',
          target_id: report.id,
          metadata: { case_id: caseId }
        });
      }

      return {
        id: report.id,
        case_id: report.case_id,
        category: report.category,
        status: report.status,
        priority: report.priority,
        created_at: report.created_at,
        updated_at: report.updated_at,
        metadata_hash: report.metadata_hash,
        payload: decryptedPayload
      };
    } catch (error) {
      throw new Error(`Failed to find report: ${error.message}`);
    }
  }

  /**
   * List reports with pagination and filtering (for investigators)
   */
  static async list(options = {}) {
    const {
      page = 1,
      limit = 20,
      status,
      category,
      priority,
      investigatorId
    } = options;

    const offset = (page - 1) * limit;

    try {
      let query = db(this.tableName).select(
        'id',
        'case_id',
        'category',
        'status',
        'priority',
        'created_at',
        'updated_at'
      );

      // Apply filters
      if (status) {
        query = query.where('status', status);
      }
      if (category) {
        query = query.where('category', category);
      }
      if (priority) {
        query = query.where('priority', priority);
      }

      // Get paginated results
      const reports = await query
        .orderBy('created_at', 'desc')
        .limit(limit)
        .offset(offset);

      // Get total count for pagination
      const [{ count }] = await db(this.tableName)
        .count('* as count')
        .where((builder) => {
          if (status) builder.where('status', status);
          if (category) builder.where('category', category);
          if (priority) builder.where('priority', priority);
        });

      // Log audit trail for listing
      if (investigatorId) {
        await auditService.log({
          actor_id: investigatorId,
          actor_type: 'investigator',
          action: 'reports_listed',
          target_type: 'report',
          metadata: {
            filters: { status, category, priority },
            page,
            limit,
            total_results: parseInt(count)
          }
        });
      }

      return {
        reports,
        pagination: {
          page,
          limit,
          total: parseInt(count),
          pages: Math.ceil(count / limit)
        }
      };
    } catch (error) {
      throw new Error(`Failed to list reports: ${error.message}`);
    }
  }

  /**
   * Update report status (for investigators)
   */
  static async updateStatus(caseId, newStatus, investigatorId, notes = null) {
    try {
      const [updatedReport] = await db(this.tableName)
        .where('case_id', caseId)
        .update({
          status: newStatus,
          updated_at: new Date()
        })
        .returning('*');

      if (!updatedReport) {
        throw new Error('Report not found');
      }

      // Log audit trail
      await auditService.log({
        actor_id: investigatorId,
        actor_type: 'investigator',
        action: 'status_changed',
        target_type: 'report',
        target_id: updatedReport.id,
        metadata: {
          case_id: caseId,
          old_status: updatedReport.status,
          new_status: newStatus,
          notes
        }
      });

      return {
        id: updatedReport.id,
        case_id: updatedReport.case_id,
        status: updatedReport.status,
        updated_at: updatedReport.updated_at
      };
    } catch (error) {
      throw new Error(`Failed to update report status: ${error.message}`);
    }
  }
}

module.exports = Report;