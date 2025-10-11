-- ============================================================================
-- Migration 003: Update WhistlePro Schema
-- ============================================================================
-- Purpose: Update existing WhistlePro schema to integrate with core entities
-- Author: Database Migration Team
-- Date: October 6, 2025
-- Dependencies: 001_core_schema.sql (requires core.companies and core.taxpayers)
-- ============================================================================

-- Verify dependencies
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'core' AND table_name = 'companies') THEN
        RAISE EXCEPTION 'Migration 003 requires core.companies table from migration 001';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'core' AND table_name = 'taxpayers') THEN
        RAISE EXCEPTION 'Migration 003 requires core.taxpayers table from migration 001';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'whistlepro' AND table_name = 'reports') THEN
        RAISE EXCEPTION 'Migration 003 requires existing whistlepro.reports table';
    END IF;
    
    RAISE NOTICE 'Migration 003: Dependencies verified, proceeding with WhistlePro schema updates';
END $$;

-- ============================================================================
-- UPDATE WHISTLEPRO.REPORTS TABLE
-- ============================================================================
-- Purpose: Add foreign key relationships and case management fields
-- ============================================================================

-- Add new columns to existing whistlepro.reports table
ALTER TABLE whistlepro.reports 
ADD COLUMN IF NOT EXISTS company_id INTEGER,
ADD COLUMN IF NOT EXISTS taxpayer_id INTEGER,
ADD COLUMN IF NOT EXISTS assigned_to INTEGER,
ADD COLUMN IF NOT EXISTS resolved_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS resolution_notes TEXT,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW();

-- Add foreign key constraints
ALTER TABLE whistlepro.reports 
DROP CONSTRAINT IF EXISTS fk_reports_company;

ALTER TABLE whistlepro.reports 
ADD CONSTRAINT fk_reports_company 
FOREIGN KEY (company_id) REFERENCES core.companies(id) ON DELETE SET NULL;

ALTER TABLE whistlepro.reports 
DROP CONSTRAINT IF EXISTS fk_reports_taxpayer;

ALTER TABLE whistlepro.reports 
ADD CONSTRAINT fk_reports_taxpayer 
FOREIGN KEY (taxpayer_id) REFERENCES core.taxpayers(id) ON DELETE SET NULL;

ALTER TABLE whistlepro.reports 
DROP CONSTRAINT IF EXISTS fk_reports_assigned_to;

ALTER TABLE whistlepro.reports 
ADD CONSTRAINT fk_reports_assigned_to 
FOREIGN KEY (assigned_to) REFERENCES whistlepro.investigators(id) ON DELETE SET NULL;

-- Add column comments
COMMENT ON COLUMN whistlepro.reports.company_id IS 'Reference to the company being reported';
COMMENT ON COLUMN whistlepro.reports.taxpayer_id IS 'Reference to the individual taxpayer being reported';
COMMENT ON COLUMN whistlepro.reports.assigned_to IS 'Investigator assigned to handle this case';
COMMENT ON COLUMN whistlepro.reports.resolved_at IS 'Timestamp when case was resolved/closed';
COMMENT ON COLUMN whistlepro.reports.resolution_notes IS 'Final notes and outcome of the investigation';

-- ============================================================================
-- UPDATE WHISTLEPRO.INVESTIGATORS TABLE
-- ============================================================================
-- Purpose: Add activity tracking and audit fields
-- ============================================================================

-- Add new columns to existing whistlepro.investigators table
ALTER TABLE whistlepro.investigators 
ADD COLUMN IF NOT EXISTS last_login TIMESTAMP,
ADD COLUMN IF NOT EXISTS total_cases_assigned INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_cases_resolved INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW();

-- Add column comments
COMMENT ON COLUMN whistlepro.investigators.last_login IS 'Timestamp of last successful login';
COMMENT ON COLUMN whistlepro.investigators.total_cases_assigned IS 'Total number of cases ever assigned to this investigator';
COMMENT ON COLUMN whistlepro.investigators.total_cases_resolved IS 'Total number of cases successfully resolved';

-- ============================================================================
-- UPDATE WHISTLEPRO.AUDIT_LOGS TABLE
-- ============================================================================
-- Purpose: Add cross-schema relationship tracking
-- ============================================================================

-- Add new columns to existing whistlepro.audit_logs table
ALTER TABLE whistlepro.audit_logs 
ADD COLUMN IF NOT EXISTS related_company_id INTEGER,
ADD COLUMN IF NOT EXISTS related_taxpayer_id INTEGER;

-- Add foreign key constraints
ALTER TABLE whistlepro.audit_logs 
DROP CONSTRAINT IF EXISTS fk_audit_logs_company;

ALTER TABLE whistlepro.audit_logs 
ADD CONSTRAINT fk_audit_logs_company 
FOREIGN KEY (related_company_id) REFERENCES core.companies(id) ON DELETE SET NULL;

ALTER TABLE whistlepro.audit_logs 
DROP CONSTRAINT IF EXISTS fk_audit_logs_taxpayer;

ALTER TABLE whistlepro.audit_logs 
ADD CONSTRAINT fk_audit_logs_taxpayer 
FOREIGN KEY (related_taxpayer_id) REFERENCES core.taxpayers(id) ON DELETE SET NULL;

-- Add column comments
COMMENT ON COLUMN whistlepro.audit_logs.related_company_id IS 'Company related to this audit action, if applicable';
COMMENT ON COLUMN whistlepro.audit_logs.related_taxpayer_id IS 'Taxpayer related to this audit action, if applicable';

-- ============================================================================
-- CREATE PERFORMANCE INDEXES
-- ============================================================================

-- Reports table indexes
CREATE INDEX IF NOT EXISTS idx_whistlepro_reports_company_id ON whistlepro.reports(company_id);
CREATE INDEX IF NOT EXISTS idx_whistlepro_reports_taxpayer_id ON whistlepro.reports(taxpayer_id);
CREATE INDEX IF NOT EXISTS idx_whistlepro_reports_assigned_to ON whistlepro.reports(assigned_to);
CREATE INDEX IF NOT EXISTS idx_whistlepro_reports_category ON whistlepro.reports(category);
CREATE INDEX IF NOT EXISTS idx_whistlepro_reports_status_priority_created 
ON whistlepro.reports(status, priority, created_at DESC);

-- Investigators table indexes
CREATE INDEX IF NOT EXISTS idx_whistlepro_investigators_active_dept 
ON whistlepro.investigators(is_active, department);
CREATE INDEX IF NOT EXISTS idx_whistlepro_investigators_role_active 
ON whistlepro.investigators(role, is_active);

-- Audit logs table indexes
CREATE INDEX IF NOT EXISTS idx_whistlepro_audit_actor_created 
ON whistlepro.audit_logs(actor_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_whistlepro_audit_company 
ON whistlepro.audit_logs(related_company_id);
CREATE INDEX IF NOT EXISTS idx_whistlepro_audit_taxpayer 
ON whistlepro.audit_logs(related_taxpayer_id);

-- ============================================================================
-- CREATE UPDATED_AT TRIGGERS
-- ============================================================================

-- Trigger for reports table
DROP TRIGGER IF EXISTS trigger_whistlepro_reports_updated_at ON whistlepro.reports;

CREATE TRIGGER trigger_whistlepro_reports_updated_at
    BEFORE UPDATE ON whistlepro.reports
    FOR EACH ROW
    EXECUTE FUNCTION core.update_timestamp();

-- Trigger for investigators table
DROP TRIGGER IF EXISTS trigger_whistlepro_investigators_updated_at ON whistlepro.investigators;

CREATE TRIGGER trigger_whistlepro_investigators_updated_at
    BEFORE UPDATE ON whistlepro.investigators
    FOR EACH ROW
    EXECUTE FUNCTION core.update_timestamp();

-- ============================================================================
-- CREATE CASE MANAGEMENT TRIGGERS
-- ============================================================================

-- Function to update investigator statistics when cases are assigned/resolved
CREATE OR REPLACE FUNCTION whistlepro.update_investigator_stats()
RETURNS TRIGGER AS $$
BEGIN
    -- Handle case assignment
    IF TG_OP = 'UPDATE' AND OLD.assigned_to IS DISTINCT FROM NEW.assigned_to THEN
        -- Increment assigned count for new investigator
        IF NEW.assigned_to IS NOT NULL THEN
            UPDATE whistlepro.investigators 
            SET total_cases_assigned = total_cases_assigned + 1
            WHERE id = NEW.assigned_to;
        END IF;
    END IF;
    
    -- Handle case resolution
    IF TG_OP = 'UPDATE' AND OLD.status != 'closed' AND NEW.status = 'closed' THEN
        -- Set resolved timestamp
        NEW.resolved_at = NOW();
        
        -- Increment resolved count for assigned investigator
        IF NEW.assigned_to IS NOT NULL THEN
            UPDATE whistlepro.investigators 
            SET total_cases_resolved = total_cases_resolved + 1
            WHERE id = NEW.assigned_to;
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create case management trigger
DROP TRIGGER IF EXISTS trigger_whistlepro_case_management ON whistlepro.reports;

CREATE TRIGGER trigger_whistlepro_case_management
    BEFORE UPDATE ON whistlepro.reports
    FOR EACH ROW
    EXECUTE FUNCTION whistlepro.update_investigator_stats();

-- ============================================================================
-- CREATE AUDIT TRIGGERS FOR WHISTLEPRO TABLES
-- ============================================================================

-- Function to log changes to system audit for reports
CREATE OR REPLACE FUNCTION whistlepro.audit_reports_changes()
RETURNS TRIGGER AS $$
BEGIN
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
        'whistlepro',
        'reports',
        TG_OP,
        COALESCE(NEW.id, OLD.id),
        COALESCE(
            (SELECT email FROM whistlepro.investigators WHERE id = COALESCE(NEW.assigned_to, OLD.assigned_to)),
            'anonymous'
        ),
        'whistlepro_system',
        CASE WHEN TG_OP = 'DELETE' THEN row_to_json(OLD) ELSE NULL END,
        CASE WHEN TG_OP = 'INSERT' THEN row_to_json(NEW) 
             WHEN TG_OP = 'UPDATE' THEN row_to_json(NEW) 
             ELSE NULL END,
        NOW()
    );
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Create audit trigger for reports
DROP TRIGGER IF EXISTS trigger_whistlepro_reports_audit ON whistlepro.reports;

CREATE TRIGGER trigger_whistlepro_reports_audit
    AFTER INSERT OR UPDATE OR DELETE ON whistlepro.reports
    FOR EACH ROW
    EXECUTE FUNCTION whistlepro.audit_reports_changes();

-- ============================================================================
-- DATA MIGRATION HELPER FUNCTIONS
-- ============================================================================

-- Function to recalculate investigator statistics
CREATE OR REPLACE FUNCTION whistlepro.recalculate_investigator_stats()
RETURNS INTEGER AS $$
DECLARE
    updated_count INTEGER := 0;
BEGIN
    -- Update all investigator statistics based on current data
    UPDATE whistlepro.investigators 
    SET 
        total_cases_assigned = COALESCE(assigned.count, 0),
        total_cases_resolved = COALESCE(resolved.count, 0)
    FROM (
        SELECT assigned_to, COUNT(*) as count
        FROM whistlepro.reports 
        WHERE assigned_to IS NOT NULL
        GROUP BY assigned_to
    ) assigned
    FULL OUTER JOIN (
        SELECT assigned_to, COUNT(*) as count
        FROM whistlepro.reports 
        WHERE assigned_to IS NOT NULL AND status = 'closed'
        GROUP BY assigned_to
    ) resolved ON assigned.assigned_to = resolved.assigned_to
    WHERE whistlepro.investigators.id = COALESCE(assigned.assigned_to, resolved.assigned_to);
    
    GET DIAGNOSTICS updated_count = ROW_COUNT;
    
    RAISE NOTICE 'Recalculated statistics for % investigators', updated_count;
    RETURN updated_count;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- CREATE WHISTLEPRO VIEWS
-- ============================================================================

-- View for active cases with investigator details
CREATE OR REPLACE VIEW whistlepro.active_cases AS
SELECT 
    r.case_id,
    r.category,
    r.priority,
    r.status,
    r.created_at as reported_date,
    c.company_name,
    c.tpin as company_tpin,
    t.full_name as taxpayer_name,
    t.nrc as taxpayer_nrc,
    i.full_name as investigator_name,
    i.department as investigator_department,
    i.email as investigator_email,
    EXTRACT(DAYS FROM (NOW() - r.created_at)) as days_open
FROM whistlepro.reports r
LEFT JOIN core.companies c ON c.id = r.company_id
LEFT JOIN core.taxpayers t ON t.id = r.taxpayer_id
LEFT JOIN whistlepro.investigators i ON i.id = r.assigned_to
WHERE r.status IN ('pending', 'under_review', 'investigating');

COMMENT ON VIEW whistlepro.active_cases IS 'Active whistleblower cases with related entity and investigator information';

-- View for investigator workload
CREATE OR REPLACE VIEW whistlepro.investigator_workload AS
SELECT 
    i.id,
    i.full_name,
    i.email,
    i.department,
    i.role,
    i.is_active,
    i.total_cases_assigned,
    i.total_cases_resolved,
    COALESCE(active.active_cases, 0) as current_active_cases,
    CASE 
        WHEN i.total_cases_assigned > 0 
        THEN ROUND((i.total_cases_resolved::DECIMAL / i.total_cases_assigned) * 100, 2)
        ELSE 0 
    END as resolution_rate_percent,
    i.last_login
FROM whistlepro.investigators i
LEFT JOIN (
    SELECT assigned_to, COUNT(*) as active_cases
    FROM whistlepro.reports 
    WHERE status IN ('under_review', 'investigating')
    GROUP BY assigned_to
) active ON active.assigned_to = i.id
WHERE i.is_active = true
ORDER BY current_active_cases DESC, resolution_rate_percent DESC;

COMMENT ON VIEW whistlepro.investigator_workload IS 'Current workload and performance metrics for active investigators';

-- ============================================================================
-- RUN DATA MIGRATION
-- ============================================================================

-- Recalculate investigator statistics based on existing data
SELECT whistlepro.recalculate_investigator_stats();

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

DO $$
DECLARE
    reports_columns INTEGER;
    investigators_columns INTEGER;
    audit_columns INTEGER;
    index_count INTEGER;
    trigger_count INTEGER;
BEGIN
    -- Verify new columns in reports table
    SELECT COUNT(*) INTO reports_columns
    FROM information_schema.columns 
    WHERE table_schema = 'whistlepro' 
    AND table_name = 'reports' 
    AND column_name IN ('company_id', 'taxpayer_id', 'assigned_to', 'resolved_at', 'resolution_notes', 'updated_at');
    
    -- Verify new columns in investigators table
    SELECT COUNT(*) INTO investigators_columns
    FROM information_schema.columns 
    WHERE table_schema = 'whistlepro' 
    AND table_name = 'investigators' 
    AND column_name IN ('last_login', 'total_cases_assigned', 'total_cases_resolved', 'created_at', 'updated_at');
    
    -- Verify new columns in audit_logs table
    SELECT COUNT(*) INTO audit_columns
    FROM information_schema.columns 
    WHERE table_schema = 'whistlepro' 
    AND table_name = 'audit_logs' 
    AND column_name IN ('related_company_id', 'related_taxpayer_id');
    
    -- Verify indexes
    SELECT COUNT(*) INTO index_count
    FROM pg_indexes 
    WHERE schemaname = 'whistlepro' 
    AND indexname LIKE 'idx_whistlepro_%';
    
    -- Verify triggers
    SELECT COUNT(*) INTO trigger_count
    FROM information_schema.triggers 
    WHERE event_object_schema = 'whistlepro';
    
    IF reports_columns < 6 THEN
        RAISE EXCEPTION 'Not all required columns were added to whistlepro.reports';
    END IF;
    
    IF investigators_columns < 5 THEN
        RAISE EXCEPTION 'Not all required columns were added to whistlepro.investigators';
    END IF;
    
    IF audit_columns < 2 THEN
        RAISE EXCEPTION 'Not all required columns were added to whistlepro.audit_logs';
    END IF;
    
    RAISE NOTICE 'Migration 003: WhistlePro schema updated successfully';
    RAISE NOTICE 'Reports: % columns, Investigators: % columns, Audit: % columns', 
                 reports_columns, investigators_columns, audit_columns;
    RAISE NOTICE 'Created % indexes and % triggers', index_count, trigger_count;
END $$;

-- Display current statistics
SELECT 'Active Cases' as metric, COUNT(*) as count FROM whistlepro.active_cases
UNION ALL
SELECT 'Active Investigators', COUNT(*) FROM whistlepro.investigator_workload
UNION ALL
SELECT 'Total Reports', COUNT(*) FROM whistlepro.reports;

-- ============================================================================
-- ROLLBACK INSTRUCTIONS (COMMENTED)
-- ============================================================================
-- To rollback this migration, run:
-- 
-- DROP VIEW IF EXISTS whistlepro.active_cases;
-- DROP VIEW IF EXISTS whistlepro.investigator_workload;
-- DROP TRIGGER IF EXISTS trigger_whistlepro_reports_updated_at ON whistlepro.reports;
-- DROP TRIGGER IF EXISTS trigger_whistlepro_investigators_updated_at ON whistlepro.investigators;
-- DROP TRIGGER IF EXISTS trigger_whistlepro_case_management ON whistlepro.reports;
-- DROP TRIGGER IF EXISTS trigger_whistlepro_reports_audit ON whistlepro.reports;
-- DROP FUNCTION IF EXISTS whistlepro.update_investigator_stats();
-- DROP FUNCTION IF EXISTS whistlepro.audit_reports_changes();
-- DROP FUNCTION IF EXISTS whistlepro.recalculate_investigator_stats();
-- 
-- ALTER TABLE whistlepro.reports 
-- DROP CONSTRAINT IF EXISTS fk_reports_company,
-- DROP CONSTRAINT IF EXISTS fk_reports_taxpayer,
-- DROP CONSTRAINT IF EXISTS fk_reports_assigned_to,
-- DROP COLUMN IF EXISTS company_id,
-- DROP COLUMN IF EXISTS taxpayer_id,
-- DROP COLUMN IF EXISTS assigned_to,
-- DROP COLUMN IF EXISTS resolved_at,
-- DROP COLUMN IF EXISTS resolution_notes,
-- DROP COLUMN IF EXISTS updated_at;
-- 
-- ALTER TABLE whistlepro.investigators 
-- DROP COLUMN IF EXISTS last_login,
-- DROP COLUMN IF EXISTS total_cases_assigned,
-- DROP COLUMN IF EXISTS total_cases_resolved,
-- DROP COLUMN IF EXISTS created_at,
-- DROP COLUMN IF EXISTS updated_at;
-- 
-- ALTER TABLE whistlepro.audit_logs 
-- DROP CONSTRAINT IF EXISTS fk_audit_logs_company,
-- DROP CONSTRAINT IF EXISTS fk_audit_logs_taxpayer,
-- DROP COLUMN IF EXISTS related_company_id,
-- DROP COLUMN IF EXISTS related_taxpayer_id;
-- ============================================================================
