-- =====================================================
-- ZRA TaxGuard OCR - Security Tables Migration
-- =====================================================
-- Database: zra_taxguard
-- Schema: ocr
-- Purpose: Create security-related tables for document verification
-- Date: 2025-10-11
-- =====================================================

-- Ensure OCR schema exists
CREATE SCHEMA IF NOT EXISTS ocr;

-- =====================================================
-- Table 1: ocr.document_security
-- =====================================================
-- Stores comprehensive security scan results for each document
-- Links to ocr.documents table via document_id foreign key

CREATE TABLE IF NOT EXISTS ocr.document_security (
    id SERIAL PRIMARY KEY,
    document_id VARCHAR(100) NOT NULL REFERENCES ocr.documents(document_id) ON DELETE CASCADE,

    -- File Integrity
    file_hash_sha256 VARCHAR(64) NOT NULL,
    file_hash_sha512 VARCHAR(128) NOT NULL,
    original_hash VARCHAR(128) NOT NULL,
    hash_verified BOOLEAN DEFAULT FALSE,
    hash_verification_time TIMESTAMP,

    -- Physical Security Features
    watermark_detected BOOLEAN DEFAULT FALSE,
    watermark_confidence DECIMAL(5,2),
    watermark_details JSONB DEFAULT '{}',

    hologram_detected BOOLEAN DEFAULT FALSE,
    hologram_confidence DECIMAL(5,2),
    hologram_details JSONB DEFAULT '{}',

    microprinting_detected BOOLEAN DEFAULT FALSE,
    microprinting_confidence DECIMAL(5,2),
    microprinting_details JSONB DEFAULT '{}',

    security_thread_detected BOOLEAN DEFAULT FALSE,
    security_thread_confidence DECIMAL(5,2),
    security_thread_details JSONB DEFAULT '{}',

    uv_features_detected BOOLEAN DEFAULT FALSE,
    uv_features_confidence DECIMAL(5,2),
    uv_features_details JSONB DEFAULT '{}',

    -- Digital Security Features
    qr_code_detected BOOLEAN DEFAULT FALSE,
    qr_code_content TEXT,
    qr_code_verified BOOLEAN DEFAULT FALSE,
    qr_code_details JSONB DEFAULT '{}',

    barcode_detected BOOLEAN DEFAULT FALSE,
    barcode_content TEXT,
    barcode_verified BOOLEAN DEFAULT FALSE,
    barcode_details JSONB DEFAULT '{}',

    digital_signature_present BOOLEAN DEFAULT FALSE,
    digital_signature_valid BOOLEAN DEFAULT FALSE,
    digital_signature_details JSONB DEFAULT '{}',

    serial_number VARCHAR(255),
    serial_number_verified BOOLEAN DEFAULT FALSE,
    serial_number_details JSONB DEFAULT '{}',

    -- Metadata Security
    exif_data JSONB DEFAULT '{}',
    exif_anomalies JSONB DEFAULT '[]',
    exif_tampering_detected BOOLEAN DEFAULT FALSE,

    file_format_valid BOOLEAN DEFAULT TRUE,
    file_format_details JSONB DEFAULT '{}',

    -- Overall Security Assessment
    security_score DECIMAL(5,2) DEFAULT 0,
    security_status VARCHAR(50), -- SECURE, ACCEPTABLE, SUSPICIOUS, COMPROMISED
    security_flags JSONB DEFAULT '[]',
    score_breakdown JSONB DEFAULT '{}',

    -- Blockchain Proof
    blockchain_timestamp VARCHAR(100),
    blockchain_tx_id VARCHAR(100),
    blockchain_proof JSONB DEFAULT '{}',

    -- Officer Verification
    verified_by VARCHAR(100),
    verification_timestamp TIMESTAMP,
    officer_notes TEXT,

    -- Flags
    flagged BOOLEAN DEFAULT FALSE,
    flag_reason TEXT,

    -- Audit
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for document_security table
CREATE INDEX IF NOT EXISTS idx_document_security_doc_id ON ocr.document_security(document_id);
CREATE INDEX IF NOT EXISTS idx_document_security_status ON ocr.document_security(security_status);
CREATE INDEX IF NOT EXISTS idx_document_security_score ON ocr.document_security(security_score);
CREATE INDEX IF NOT EXISTS idx_document_security_blockchain ON ocr.document_security(blockchain_tx_id);
CREATE INDEX IF NOT EXISTS idx_document_security_verified_by ON ocr.document_security(verified_by);
CREATE INDEX IF NOT EXISTS idx_document_security_flagged ON ocr.document_security(flagged);
CREATE INDEX IF NOT EXISTS idx_document_security_created ON ocr.document_security(created_at);

-- =====================================================
-- Table 2: ocr.security_audit_log
-- =====================================================
-- Comprehensive audit trail for all security-related actions
-- Tracks document scans, officer verifications, anomaly resolutions

CREATE TABLE IF NOT EXISTS ocr.security_audit_log (
    id SERIAL PRIMARY KEY,
    document_id VARCHAR(100) NOT NULL,
    event_type VARCHAR(100) NOT NULL, -- SCAN, VERIFY, FLAG, APPROVE, REJECT, RESOLVE_ANOMALY
    event_category VARCHAR(50), -- UPLOAD, SECURITY_CHECK, BLOCKCHAIN, OFFICER_ACTION
    event_details JSONB DEFAULT '{}',
    severity VARCHAR(20), -- INFO, WARNING, CRITICAL
    officer_id VARCHAR(100),
    officer_name VARCHAR(255),
    ip_address VARCHAR(45),
    user_agent TEXT,
    endpoint VARCHAR(255),
    http_method VARCHAR(10),
    timestamp TIMESTAMP DEFAULT NOW()
);

-- Indexes for security_audit_log table
CREATE INDEX IF NOT EXISTS idx_security_audit_doc_id ON ocr.security_audit_log(document_id);
CREATE INDEX IF NOT EXISTS idx_security_audit_timestamp ON ocr.security_audit_log(timestamp);
CREATE INDEX IF NOT EXISTS idx_security_audit_officer ON ocr.security_audit_log(officer_id);
CREATE INDEX IF NOT EXISTS idx_security_audit_severity ON ocr.security_audit_log(severity);
CREATE INDEX IF NOT EXISTS idx_security_audit_event_type ON ocr.security_audit_log(event_type);

-- =====================================================
-- Table 3: ocr.anomaly_detection
-- =====================================================
-- Stores detected anomalies and suspicious patterns
-- Allows ZRA officers to review, resolve, or mark as false positives

CREATE TABLE IF NOT EXISTS ocr.anomaly_detection (
    id SERIAL PRIMARY KEY,
    document_id VARCHAR(100) NOT NULL,
    anomaly_type VARCHAR(100) NOT NULL, -- METADATA, FORMAT, CONTENT, BEHAVIOR, EXIF
    anomaly_description TEXT NOT NULL,
    confidence_score DECIMAL(5,2),
    severity VARCHAR(20), -- LOW, MEDIUM, HIGH, CRITICAL
    detection_method VARCHAR(100), -- AI, RULE_BASED, STATISTICAL, EXIF_ANALYSIS
    detection_details JSONB DEFAULT '{}',
    false_positive BOOLEAN DEFAULT FALSE,
    resolved BOOLEAN DEFAULT FALSE,
    resolved_by VARCHAR(100),
    resolved_at TIMESTAMP,
    resolution_notes TEXT,
    detected_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for anomaly_detection table
CREATE INDEX IF NOT EXISTS idx_anomaly_doc_id ON ocr.anomaly_detection(document_id);
CREATE INDEX IF NOT EXISTS idx_anomaly_type ON ocr.anomaly_detection(anomaly_type);
CREATE INDEX IF NOT EXISTS idx_anomaly_severity ON ocr.anomaly_detection(severity);
CREATE INDEX IF NOT EXISTS idx_anomaly_resolved ON ocr.anomaly_detection(resolved);
CREATE INDEX IF NOT EXISTS idx_anomaly_detected_at ON ocr.anomaly_detection(detected_at);
CREATE INDEX IF NOT EXISTS idx_anomaly_false_positive ON ocr.anomaly_detection(false_positive);

-- =====================================================
-- Comments for Documentation
-- =====================================================

COMMENT ON TABLE ocr.document_security IS 'Stores comprehensive security scan results for uploaded documents';
COMMENT ON TABLE ocr.security_audit_log IS 'Audit trail for all security-related actions and events';
COMMENT ON TABLE ocr.anomaly_detection IS 'Detected anomalies and suspicious patterns requiring officer review';

COMMENT ON COLUMN ocr.document_security.security_score IS 'Weighted security score from 0-100 based on detected features';
COMMENT ON COLUMN ocr.document_security.security_status IS 'Overall security classification: SECURE (90+), ACCEPTABLE (70-89), SUSPICIOUS (50-69), COMPROMISED (<50)';
COMMENT ON COLUMN ocr.document_security.blockchain_tx_id IS 'Transaction ID from blockchain API (port 3001) for immutable proof';

COMMENT ON COLUMN ocr.security_audit_log.event_type IS 'Type of security event: SCAN, VERIFY, FLAG, APPROVE, REJECT, etc.';
COMMENT ON COLUMN ocr.security_audit_log.severity IS 'Event severity level for filtering and alerting';

COMMENT ON COLUMN ocr.anomaly_detection.anomaly_type IS 'Category of anomaly: METADATA, FORMAT, CONTENT, BEHAVIOR, EXIF';
COMMENT ON COLUMN ocr.anomaly_detection.false_positive IS 'Marked true by officer if anomaly is not actually suspicious';

-- =====================================================
-- Trigger: Update updated_at timestamp
-- =====================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_document_security_updated_at
    BEFORE UPDATE ON ocr.document_security
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- Grant Permissions (optional - adjust based on your setup)
-- =====================================================

-- Grant permissions to application user (if needed)
-- GRANT ALL PRIVILEGES ON TABLE ocr.document_security TO ocr_backend_user;
-- GRANT ALL PRIVILEGES ON TABLE ocr.security_audit_log TO ocr_backend_user;
-- GRANT ALL PRIVILEGES ON TABLE ocr.anomaly_detection TO ocr_backend_user;
-- GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA ocr TO ocr_backend_user;

-- =====================================================
-- Migration Complete
-- =====================================================

SELECT 'Security tables migration completed successfully!' AS status;
