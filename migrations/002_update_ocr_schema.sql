-- ============================================================================
-- Migration 002: Update OCR Schema
-- ============================================================================
-- Purpose: Update existing OCR schema to integrate with core entities
-- Author: Database Migration Team
-- Date: October 6, 2025
-- Dependencies: 001_core_schema.sql (requires core.companies and core.taxpayers)
-- ============================================================================

-- Verify dependencies
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'core' AND table_name = 'companies') THEN
        RAISE EXCEPTION 'Migration 002 requires core.companies table from migration 001';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'core' AND table_name = 'taxpayers') THEN
        RAISE EXCEPTION 'Migration 002 requires core.taxpayers table from migration 001';
    END IF;
    
    RAISE NOTICE 'Migration 002: Dependencies verified, proceeding with OCR schema updates';
END $$;

-- ============================================================================
-- UPDATE OCR.DOCUMENTS TABLE
-- ============================================================================
-- Purpose: Add foreign key relationships to core entities
-- ============================================================================

-- Add new columns to existing ocr.documents table
ALTER TABLE ocr.documents 
ADD COLUMN IF NOT EXISTS company_id INTEGER,
ADD COLUMN IF NOT EXISTS taxpayer_id INTEGER,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW();

-- Add foreign key constraints
ALTER TABLE ocr.documents 
DROP CONSTRAINT IF EXISTS fk_documents_company;

ALTER TABLE ocr.documents 
ADD CONSTRAINT fk_documents_company 
FOREIGN KEY (company_id) REFERENCES core.companies(id) ON DELETE SET NULL;

ALTER TABLE ocr.documents 
DROP CONSTRAINT IF EXISTS fk_documents_taxpayer;

ALTER TABLE ocr.documents 
ADD CONSTRAINT fk_documents_taxpayer 
FOREIGN KEY (taxpayer_id) REFERENCES core.taxpayers(id) ON DELETE SET NULL;

-- Add column comments
COMMENT ON COLUMN ocr.documents.company_id IS 'Reference to the company that submitted this document';
COMMENT ON COLUMN ocr.documents.taxpayer_id IS 'Reference to the individual taxpayer associated with this document';
COMMENT ON COLUMN ocr.documents.updated_at IS 'Timestamp of last update to this record';

-- ============================================================================
-- CREATE PERFORMANCE INDEXES
-- ============================================================================

-- Foreign key indexes for JOIN performance
CREATE INDEX IF NOT EXISTS idx_ocr_documents_company_id ON ocr.documents(company_id);
CREATE INDEX IF NOT EXISTS idx_ocr_documents_taxpayer_id ON ocr.documents(taxpayer_id);

-- Risk-based filtering index (partial index for better performance)
CREATE INDEX IF NOT EXISTS idx_ocr_documents_high_risk 
ON ocr.documents(risk_score DESC) 
WHERE risk_score > 50;

-- Status and date composite index for common queries
CREATE INDEX IF NOT EXISTS idx_ocr_documents_status_created 
ON ocr.documents(status, created_at DESC);

-- Verification status index
CREATE INDEX IF NOT EXISTS idx_ocr_documents_verification_status 
ON ocr.documents(verification_status) 
WHERE verification_status IS NOT NULL;

-- Blockchain transaction index
CREATE INDEX IF NOT EXISTS idx_ocr_documents_blockchain_tx 
ON ocr.documents(blockchain_tx_id) 
WHERE blockchain_tx_id IS NOT NULL;

-- ============================================================================
-- CREATE UPDATED_AT TRIGGER
-- ============================================================================

-- Create trigger to automatically update timestamp on row changes
DROP TRIGGER IF EXISTS trigger_ocr_documents_updated_at ON ocr.documents;

CREATE TRIGGER trigger_ocr_documents_updated_at
    BEFORE UPDATE ON ocr.documents
    FOR EACH ROW
    EXECUTE FUNCTION core.update_timestamp();

-- ============================================================================
-- CREATE AUDIT TRIGGER FOR OCR DOCUMENTS
-- ============================================================================

-- Function to log changes to system audit
CREATE OR REPLACE FUNCTION ocr.audit_documents_changes()
RETURNS TRIGGER AS $$
BEGIN
    -- Insert audit record for all changes
    INSERT INTO core.system_audit (
        schema_name,
        table_name,
        action,
        record_id,
        user_id,
        user_type,
        old_data,
        new_data,
        created_at
    ) VALUES (
        'ocr',
        'documents',
        TG_OP,
        COALESCE(NEW.id, OLD.id),
        COALESCE(NEW.uploaded_by, OLD.uploaded_by, 'system'),
        'ocr_system',
        CASE WHEN TG_OP = 'DELETE' THEN row_to_json(OLD) ELSE NULL END,
        CASE WHEN TG_OP = 'INSERT' THEN row_to_json(NEW) 
             WHEN TG_OP = 'UPDATE' THEN row_to_json(NEW) 
             ELSE NULL END,
        NOW()
    );
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Create audit triggers
DROP TRIGGER IF EXISTS trigger_ocr_documents_audit ON ocr.documents;

CREATE TRIGGER trigger_ocr_documents_audit
    AFTER INSERT OR UPDATE OR DELETE ON ocr.documents
    FOR EACH ROW
    EXECUTE FUNCTION ocr.audit_documents_changes();

-- ============================================================================
-- DATA MIGRATION HELPER FUNCTIONS
-- ============================================================================

-- Function to link documents to companies based on TPIN in metadata
CREATE OR REPLACE FUNCTION ocr.link_documents_to_companies()
RETURNS INTEGER AS $$
DECLARE
    updated_count INTEGER := 0;
BEGIN
    -- Update documents with company_id based on TPIN in metadata
    UPDATE ocr.documents 
    SET company_id = c.id
    FROM core.companies c
    WHERE ocr.documents.company_id IS NULL
    AND ocr.documents.metadata->>'importerTpin' = c.tpin;
    
    GET DIAGNOSTICS updated_count = ROW_COUNT;
    
    RAISE NOTICE 'Linked % documents to companies based on TPIN', updated_count;
    RETURN updated_count;
END;
$$ LANGUAGE plpgsql;

-- Function to link documents to taxpayers based on NRC in metadata
CREATE OR REPLACE FUNCTION ocr.link_documents_to_taxpayers()
RETURNS INTEGER AS $$
DECLARE
    updated_count INTEGER := 0;
BEGIN
    -- Update documents with taxpayer_id based on NRC in metadata
    UPDATE ocr.documents 
    SET taxpayer_id = t.id
    FROM core.taxpayers t
    WHERE ocr.documents.taxpayer_id IS NULL
    AND ocr.documents.metadata->>'uploaderNrc' = t.nrc;
    
    GET DIAGNOSTICS updated_count = ROW_COUNT;
    
    RAISE NOTICE 'Linked % documents to taxpayers based on NRC', updated_count;
    RETURN updated_count;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- ENHANCED METADATA INDEXES
-- ============================================================================

-- GIN indexes for JSONB metadata searches
CREATE INDEX IF NOT EXISTS idx_ocr_documents_metadata_tpin 
ON ocr.documents USING gin((metadata->'importerTpin'));

CREATE INDEX IF NOT EXISTS idx_ocr_documents_metadata_nrc 
ON ocr.documents USING gin((metadata->'uploaderNrc'));

CREATE INDEX IF NOT EXISTS idx_ocr_documents_ocr_data 
ON ocr.documents USING gin(ocr_data);

-- ============================================================================
-- VERIFICATION AND STATISTICS
-- ============================================================================

-- Create view for OCR document statistics
CREATE OR REPLACE VIEW ocr.document_statistics AS
SELECT 
    COUNT(*) as total_documents,
    COUNT(company_id) as documents_with_company,
    COUNT(taxpayer_id) as documents_with_taxpayer,
    COUNT(CASE WHEN risk_score > 75 THEN 1 END) as high_risk_documents,
    COUNT(CASE WHEN verification_status = 'FRAUDULENT' THEN 1 END) as fraudulent_documents,
    COUNT(CASE WHEN blockchain_tx_id IS NOT NULL THEN 1 END) as blockchain_verified,
    AVG(risk_score) as average_risk_score,
    MAX(created_at) as latest_document,
    MIN(created_at) as earliest_document
FROM ocr.documents;

COMMENT ON VIEW ocr.document_statistics IS 'Summary statistics for OCR document processing and verification';

-- ============================================================================
-- RUN DATA MIGRATION
-- ============================================================================

-- Attempt to link existing documents to companies and taxpayers
SELECT ocr.link_documents_to_companies();
SELECT ocr.link_documents_to_taxpayers();

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

DO $$
DECLARE
    column_count INTEGER;
    index_count INTEGER;
    trigger_count INTEGER;
BEGIN
    -- Verify new columns exist
    SELECT COUNT(*) INTO column_count
    FROM information_schema.columns 
    WHERE table_schema = 'ocr' 
    AND table_name = 'documents' 
    AND column_name IN ('company_id', 'taxpayer_id', 'updated_at');
    
    IF column_count < 3 THEN
        RAISE EXCEPTION 'Not all required columns were added to ocr.documents';
    END IF;
    
    -- Verify indexes exist
    SELECT COUNT(*) INTO index_count
    FROM pg_indexes 
    WHERE schemaname = 'ocr' 
    AND tablename = 'documents'
    AND indexname LIKE 'idx_ocr_documents_%';
    
    IF index_count < 5 THEN
        RAISE WARNING 'Some indexes may not have been created properly';
    END IF;
    
    -- Verify triggers exist
    SELECT COUNT(*) INTO trigger_count
    FROM information_schema.triggers 
    WHERE event_object_schema = 'ocr' 
    AND event_object_table = 'documents';
    
    IF trigger_count < 2 THEN
        RAISE WARNING 'Some triggers may not have been created properly';
    END IF;
    
    RAISE NOTICE 'Migration 002: OCR schema updated successfully';
    RAISE NOTICE 'Added % columns, created % indexes, % triggers', column_count, index_count, trigger_count;
END $$;

-- Display current document statistics
SELECT * FROM ocr.document_statistics;

-- ============================================================================
-- ROLLBACK INSTRUCTIONS (COMMENTED)
-- ============================================================================
-- To rollback this migration, run:
-- 
-- DROP TRIGGER IF EXISTS trigger_ocr_documents_updated_at ON ocr.documents;
-- DROP TRIGGER IF EXISTS trigger_ocr_documents_audit ON ocr.documents;
-- DROP FUNCTION IF EXISTS ocr.audit_documents_changes();
-- DROP FUNCTION IF EXISTS ocr.link_documents_to_companies();
-- DROP FUNCTION IF EXISTS ocr.link_documents_to_taxpayers();
-- DROP VIEW IF EXISTS ocr.document_statistics;
-- 
-- ALTER TABLE ocr.documents 
-- DROP CONSTRAINT IF EXISTS fk_documents_company,
-- DROP CONSTRAINT IF EXISTS fk_documents_taxpayer,
-- DROP COLUMN IF EXISTS company_id,
-- DROP COLUMN IF EXISTS taxpayer_id,
-- DROP COLUMN IF EXISTS updated_at;
-- 
-- DROP INDEX IF EXISTS idx_ocr_documents_company_id;
-- DROP INDEX IF EXISTS idx_ocr_documents_taxpayer_id;
-- DROP INDEX IF EXISTS idx_ocr_documents_high_risk;
-- DROP INDEX IF EXISTS idx_ocr_documents_status_created;
-- DROP INDEX IF EXISTS idx_ocr_documents_verification_status;
-- DROP INDEX IF EXISTS idx_ocr_documents_blockchain_tx;
-- DROP INDEX IF EXISTS idx_ocr_documents_metadata_tpin;
-- DROP INDEX IF EXISTS idx_ocr_documents_metadata_nrc;
-- DROP INDEX IF EXISTS idx_ocr_documents_ocr_data;
-- ============================================================================
