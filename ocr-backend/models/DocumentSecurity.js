const { DataTypes } = require('sequelize');
const { getConnection } = require('../config/database');

/**
 * DocumentSecurity Model
 * Stores comprehensive security validation results for documents
 * Schema: ocr.document_security
 */

function defineDocumentSecurityModel(sequelize) {
  const DocumentSecurity = sequelize.define('DocumentSecurity', {
    // Primary Key
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },

    // Foreign Key to Document
    documentId: {
      type: DataTypes.STRING(100),
      allowNull: false,
      field: 'document_id',
      references: {
        model: 'documents',
        key: 'document_id'
      }
    },

    // ==== FILE INTEGRITY ====
    fileHashSha256: {
      type: DataTypes.STRING(64),
      allowNull: false,
      field: 'file_hash_sha256'
    },
    fileHashSha512: {
      type: DataTypes.STRING(128),
      allowNull: false,
      field: 'file_hash_sha512'
    },
    originalHash: {
      type: DataTypes.STRING(128),
      allowNull: false,
      field: 'original_hash'
    },
    hashVerified: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      field: 'hash_verified'
    },
    hashVerificationTime: {
      type: DataTypes.DATE,
      field: 'hash_verification_time'
    },

    // ==== PHYSICAL SECURITY FEATURES ====
    watermarkDetected: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      field: 'watermark_detected'
    },
    watermarkConfidence: {
      type: DataTypes.DECIMAL(5, 2),
      field: 'watermark_confidence'
    },
    watermarkDetails: {
      type: DataTypes.JSONB,
      defaultValue: {},
      field: 'watermark_details'
    },

    hologramDetected: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      field: 'hologram_detected'
    },
    hologramConfidence: {
      type: DataTypes.DECIMAL(5, 2),
      field: 'hologram_confidence'
    },
    hologramDetails: {
      type: DataTypes.JSONB,
      defaultValue: {},
      field: 'hologram_details'
    },

    microprintingDetected: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      field: 'microprinting_detected'
    },
    microprintingConfidence: {
      type: DataTypes.DECIMAL(5, 2),
      field: 'microprinting_confidence'
    },
    microprintingDetails: {
      type: DataTypes.JSONB,
      defaultValue: {},
      field: 'microprinting_details'
    },

    securityThreadDetected: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      field: 'security_thread_detected'
    },
    securityThreadConfidence: {
      type: DataTypes.DECIMAL(5, 2),
      field: 'security_thread_confidence'
    },
    securityThreadDetails: {
      type: DataTypes.JSONB,
      defaultValue: {},
      field: 'security_thread_details'
    },

    uvFeaturesDetected: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      field: 'uv_features_detected'
    },
    uvFeaturesConfidence: {
      type: DataTypes.DECIMAL(5, 2),
      field: 'uv_features_confidence'
    },
    uvFeaturesDetails: {
      type: DataTypes.JSONB,
      defaultValue: {},
      field: 'uv_features_details'
    },

    // ==== DIGITAL SECURITY FEATURES ====
    qrCodeDetected: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      field: 'qr_code_detected'
    },
    qrCodeContent: {
      type: DataTypes.TEXT,
      field: 'qr_code_content'
    },
    qrCodeVerified: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      field: 'qr_code_verified'
    },
    qrCodeDetails: {
      type: DataTypes.JSONB,
      defaultValue: {},
      field: 'qr_code_details'
    },

    barcodeDetected: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      field: 'barcode_detected'
    },
    barcodeContent: {
      type: DataTypes.TEXT,
      field: 'barcode_content'
    },
    barcodeVerified: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      field: 'barcode_verified'
    },
    barcodeDetails: {
      type: DataTypes.JSONB,
      defaultValue: {},
      field: 'barcode_details'
    },

    digitalSignaturePresent: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      field: 'digital_signature_present'
    },
    digitalSignatureValid: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      field: 'digital_signature_valid'
    },
    digitalSignatureDetails: {
      type: DataTypes.JSONB,
      defaultValue: {},
      field: 'digital_signature_details'
    },

    serialNumber: {
      type: DataTypes.STRING(255),
      field: 'serial_number'
    },
    serialNumberVerified: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      field: 'serial_number_verified'
    },
    serialNumberDetails: {
      type: DataTypes.JSONB,
      defaultValue: {},
      field: 'serial_number_details'
    },

    // ==== METADATA SECURITY ====
    exifData: {
      type: DataTypes.JSONB,
      defaultValue: {},
      field: 'exif_data'
    },
    exifAnomalies: {
      type: DataTypes.JSONB,
      defaultValue: [],
      field: 'exif_anomalies'
    },
    exifTamperingDetected: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      field: 'exif_tampering_detected'
    },

    fileFormatValid: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      field: 'file_format_valid'
    },
    fileFormatDetails: {
      type: DataTypes.JSONB,
      defaultValue: {},
      field: 'file_format_details'
    },

    // ==== OVERALL SECURITY ASSESSMENT ====
    securityScore: {
      type: DataTypes.DECIMAL(5, 2),
      defaultValue: 0,
      field: 'security_score',
      validate: {
        min: 0,
        max: 100
      }
    },
    securityStatus: {
      type: DataTypes.ENUM('SECURE', 'ACCEPTABLE', 'SUSPICIOUS', 'COMPROMISED', 'UNKNOWN'),
      defaultValue: 'UNKNOWN',
      field: 'security_status'
    },
    securityFlags: {
      type: DataTypes.JSONB,
      defaultValue: [],
      field: 'security_flags'
    },
    scoreBreakdown: {
      type: DataTypes.JSONB,
      defaultValue: {},
      field: 'score_breakdown'
    },

    // ==== BLOCKCHAIN PROOF ====
    blockchainTimestamp: {
      type: DataTypes.STRING(100),
      field: 'blockchain_timestamp'
    },
    blockchainTxId: {
      type: DataTypes.STRING(100),
      field: 'blockchain_tx_id'
    },
    blockchainProof: {
      type: DataTypes.JSONB,
      defaultValue: {},
      field: 'blockchain_proof'
    },

    // ==== OFFICER VERIFICATION ====
    verifiedBy: {
      type: DataTypes.STRING(100),
      field: 'verified_by'
    },
    verificationTimestamp: {
      type: DataTypes.DATE,
      field: 'verification_timestamp'
    },
    officerNotes: {
      type: DataTypes.TEXT,
      field: 'officer_notes'
    },

    // ==== AUDIT ====
    createdAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
      field: 'created_at'
    },
    updatedAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
      field: 'updated_at'
    }
  }, {
    tableName: 'document_security',
    schema: 'ocr',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
      { fields: ['document_id'] },
      { fields: ['security_status'] },
      { fields: ['security_score'] },
      { fields: ['blockchain_tx_id'] },
      { fields: ['verified_by'] },
      { fields: ['created_at'] }
    ]
  });

  // Instance Methods
  DocumentSecurity.prototype.markAsVerified = function(officerId, notes = '') {
    this.verifiedBy = officerId;
    this.verificationTimestamp = new Date();
    this.officerNotes = notes;
  };

  DocumentSecurity.prototype.addSecurityFlag = function(flag) {
    const flags = this.securityFlags || [];
    flags.push({
      ...flag,
      timestamp: new Date()
    });
    this.securityFlags = flags;
  };

  // Class Methods
  DocumentSecurity.findByDocumentId = function(documentId) {
    return this.findOne({ where: { documentId } });
  };

  DocumentSecurity.findBySecurityStatus = function(status) {
    return this.findAll({
      where: { securityStatus: status },
      order: [['created_at', 'DESC']]
    });
  };

  DocumentSecurity.findSuspicious = function() {
    return this.findAll({
      where: {
        securityStatus: ['SUSPICIOUS', 'COMPROMISED']
      },
      order: [['security_score', 'ASC']]
    });
  };

  DocumentSecurity.getStatistics = async function() {
    const { sequelize } = this;

    const stats = await this.findAll({
      attributes: [
        'security_status',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count'],
        [sequelize.fn('AVG', sequelize.col('security_score')), 'avgScore']
      ],
      group: ['security_status'],
      raw: true
    });

    const totalDocs = stats.reduce((sum, s) => sum + parseInt(s.count), 0);
    const avgScore = stats.reduce((sum, s) => sum + (parseFloat(s.avgScore) * parseInt(s.count)), 0) / totalDocs;

    return {
      totalDocuments: totalDocs,
      averageSecurityScore: avgScore.toFixed(2),
      statusDistribution: stats
    };
  };

  return DocumentSecurity;
}

// Singleton pattern
let DocumentSecurityModel = null;

function getDocumentSecurityModel() {
  if (!DocumentSecurityModel) {
    const sequelize = getConnection();
    if (!sequelize) {
      throw new Error('Database connection not initialized');
    }
    DocumentSecurityModel = defineDocumentSecurityModel(sequelize);
  }
  return DocumentSecurityModel;
}

module.exports = getDocumentSecurityModel;
