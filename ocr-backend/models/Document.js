const { DataTypes } = require('sequelize');
const { getConnection } = require('../config/database');

/**
 * Document Model for OCR Verification System (PostgreSQL/Sequelize)
 * Stores uploaded documents and their verification results
 * Schema: ocr.documents
 */

function defineDocumentModel(sequelize) {
  const Document = sequelize.define('Document', {
    // Primary Key
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },

    // Document Identification
    documentId: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true,
      field: 'document_id'
    },

    // File Information
    filename: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    originalName: {
      type: DataTypes.STRING(255),
      allowNull: false,
      field: 'original_name'
    },
    filePath: {
      type: DataTypes.STRING(500),
      allowNull: false,
      field: 'file_path'
    },
    fileSize: {
      type: DataTypes.BIGINT,
      allowNull: false,
      field: 'file_size'
    },
    mimeType: {
      type: DataTypes.STRING(100),
      allowNull: false,
      field: 'mime_type'
    },
    fileHash: {
      type: DataTypes.STRING(64),
      allowNull: false,
      field: 'file_hash'
    },

    // Upload Metadata
    uploadedAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
      field: 'uploaded_at'
    },
    uploadedBy: {
      type: DataTypes.STRING(100),
      defaultValue: 'anonymous',
      field: 'uploaded_by'
    },

    // Processing Status
    status: {
      type: DataTypes.ENUM('PENDING', 'PROCESSING', 'VERIFIED', 'FLAGGED', 'ERROR'),
      defaultValue: 'PENDING',
      allowNull: false
    },

    // Custom Metadata (JSONB for flexible structure)
    metadata: {
      type: DataTypes.JSONB,
      defaultValue: {}
    },

    // OCR/AI Processing Results
    ocrData: {
      type: DataTypes.JSONB,
      defaultValue: null,
      field: 'ocr_data'
    },
    aiMetadata: {
      type: DataTypes.JSONB,
      defaultValue: null,
      field: 'ai_metadata'
    },

    // Risk Assessment
    riskScore: {
      type: DataTypes.DECIMAL(5, 2),
      defaultValue: null,
      field: 'risk_score',
      validate: {
        min: 0,
        max: 100
      }
    },
    verificationStatus: {
      type: DataTypes.ENUM('VALID', 'SUSPICIOUS', 'FRAUDULENT', 'INVALID'),
      defaultValue: null,
      field: 'verification_status'
    },
    riskFlags: {
      type: DataTypes.JSONB,
      defaultValue: [],
      field: 'risk_flags'
    },

    // ZRA Verification Result
    verificationResult: {
      type: DataTypes.JSONB,
      defaultValue: null,
      field: 'verification_result'
    },

    // Blockchain Integration
    blockchainTxId: {
      type: DataTypes.STRING(100),
      defaultValue: null,
      field: 'blockchain_tx_id'
    },
    blockNumber: {
      type: DataTypes.INTEGER,
      defaultValue: null,
      field: 'block_number'
    },
    blockchainProof: {
      type: DataTypes.JSONB,
      defaultValue: null,
      field: 'blockchain_proof'
    },

    // Processing History
    processingSteps: {
      type: DataTypes.JSONB,
      defaultValue: [],
      field: 'processing_steps'
    },

    // Error Handling (renamed from 'errors' to avoid reserved keyword)
    errorLogs: {
      type: DataTypes.JSONB,
      defaultValue: [],
      field: 'error_logs'
    },

    // Timestamps
    processedAt: {
      type: DataTypes.DATE,
      defaultValue: null,
      field: 'processed_at'
    },
    verifiedAt: {
      type: DataTypes.DATE,
      defaultValue: null,
      field: 'verified_at'
    },
    lastUpdated: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
      field: 'last_updated'
    }
  }, {
    tableName: 'documents',
    schema: 'ocr',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
      { fields: ['document_id'], unique: true },
      { fields: ['file_hash'] },
      { fields: ['status', 'uploaded_at'] },
      { fields: ['verification_status'] },
      { fields: ['blockchain_tx_id'] },
      { fields: [{ attribute: 'metadata', operator: 'jsonb_path_ops' }], using: 'gin' }
    ],
    hooks: {
      beforeSave: (document) => {
        document.lastUpdated = new Date();
      }
    }
  });

  // Instance Methods
  Document.prototype.addProcessingStep = function(step, status, result = null, error = null) {
    const steps = this.processingSteps || [];
    steps.push({
      step,
      status,
      timestamp: new Date(),
      result,
      error
    });
    this.processingSteps = steps;
  };

  Document.prototype.addError = function(stage, message, stack = null) {
    const logs = this.errorLogs || [];
    logs.push({
      stage,
      message,
      stack,
      timestamp: new Date()
    });
    this.errorLogs = logs;
  };

  Document.prototype.markAsProcessing = function() {
    this.status = 'PROCESSING';
    this.addProcessingStep('start_processing', 'started');
  };

  Document.prototype.markAsVerified = function(ocrData, riskScore, verificationStatus) {
    this.status = 'VERIFIED';
    this.ocrData = ocrData;
    this.riskScore = riskScore;
    this.verificationStatus = verificationStatus;
    this.verifiedAt = new Date();
    this.addProcessingStep('verification', 'completed', { riskScore, verificationStatus });
  };

  Document.prototype.markAsFlagged = function(reason) {
    this.status = 'FLAGGED';
    const flags = this.riskFlags || [];
    flags.push({
      type: 'manual',
      reason,
      severity: 'high',
      timestamp: new Date()
    });
    this.riskFlags = flags;
    this.addProcessingStep('flag', 'flagged', { reason });
  };

  Document.prototype.markAsError = function(stage, error) {
    this.status = 'ERROR';
    this.addError(stage, error.message, error.stack);
    this.addProcessingStep(stage, 'failed', null, error.message);
  };

  // Class Methods
  Document.findByDocumentId = function(documentId) {
    return this.findOne({ where: { documentId } });
  };

  Document.findByStatus = function(status) {
    return this.findAll({
      where: { status },
      order: [['uploaded_at', 'DESC']]
    });
  };

  Document.findByVerificationStatus = function(verificationStatus) {
    return this.findAll({
      where: { verificationStatus },
      order: [['uploaded_at', 'DESC']]
    });
  };

  Document.findPending = function() {
    return this.findAll({
      where: { status: 'PENDING' },
      order: [['uploaded_at', 'ASC']]
    });
  };

  Document.getStatistics = async function() {
    const { sequelize } = this;

    const statusStats = await this.findAll({
      attributes: [
        'status',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count']
      ],
      group: ['status'],
      raw: true
    });

    const verificationStats = await this.findAll({
      attributes: [
        'verification_status',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count'],
        [sequelize.fn('AVG', sequelize.col('risk_score')), 'avgRiskScore']
      ],
      where: {
        verificationStatus: { [sequelize.Op.ne]: null }
      },
      group: ['verification_status'],
      raw: true
    });

    return {
      statusCounts: statusStats,
      verificationStats
    };
  };

  return Document;
}

// Singleton pattern for model initialization
let DocumentModel = null;

function getDocumentModel() {
  if (!DocumentModel) {
    const sequelize = getConnection();
    if (!sequelize) {
      throw new Error('Database connection not initialized');
    }
    DocumentModel = defineDocumentModel(sequelize);
  }
  return DocumentModel;
}

module.exports = getDocumentModel;
