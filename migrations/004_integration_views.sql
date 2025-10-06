-- ============================================================================
-- Migration 004: Integration Views
-- ============================================================================
-- Purpose: Create cross-schema integration views for analytics and reporting
-- Author: Database Migration Team
-- Date: October 6, 2025
-- Dependencies: 001_core_schema.sql, 002_update_ocr_schema.sql, 003_update_whistlepro_schema.sql
-- ============================================================================

-- Verify all dependencies
DO $$
BEGIN
    -- Check core schema
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'core' AND table_name = 'companies') THEN
        RAISE EXCEPTION 'Migration 004 requires core.companies table from migration 001';
    END IF;
    
    -- Check OCR schema updates
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'ocr' AND table_name = 'documents' AND column_name = 'company_id') THEN
        RAISE EXCEPTION 'Migration 004 requires OCR schema updates from migration 002';
    END IF;
    
    -- Check WhistlePro schema updates
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'whistlepro' AND table_name = 'reports' AND column_name = 'company_id') THEN
        RAISE EXCEPTION 'Migration 004 requires WhistlePro schema updates from migration 003';
    END IF;
    
    RAISE NOTICE 'Migration 004: All dependencies verified, creating integration views';
END $$;

-- ============================================================================
-- VIEW 1: HIGH RISK COMPANIES
-- ============================================================================
-- Purpose: Identify companies with elevated risk profiles based on multiple factors
-- ============================================================================

CREATE OR REPLACE VIEW core.high_risk_companies AS
SELECT 
    c.id as company_id,
    c.tpin,
    c.company_name,
    c.industry_sector,
    c.tax_status,
    c.employee_count,
    c.annual_revenue,
    
    -- Document Risk Metrics
    COALESCE(doc_stats.total_documents, 0) as total_documents,
    COALESCE(ROUND(doc_stats.avg_document_risk, 2), 0) as avg_document_risk,
    COALESCE(doc_stats.high_risk_documents, 0) as high_risk_documents,
    doc_stats.last_document_date,
    
    -- Whistleblower Metrics
    COALESCE(wb_stats.whistleblower_reports, 0) as whistleblower_reports,
    COALESCE(wb_stats.active_investigations, 0) as active_investigations,
    wb_stats.last_report_date,
    
    -- Overall Risk Assessment
    CASE 
        WHEN COALESCE(wb_stats.whistleblower_reports, 0) > 0 AND COALESCE(doc_stats.avg_document_risk, 0) > 70 THEN 'CRITICAL'
        WHEN COALESCE(doc_stats.avg_document_risk, 0) > 80 THEN 'HIGH'
        WHEN COALESCE(wb_stats.whistleblower_reports, 0) > 0 THEN 'MEDIUM'
        ELSE 'LOW'
    END as overall_risk_level,
    
    -- Risk Score Calculation (0-100)
    LEAST(100, 
        COALESCE(doc_stats.avg_document_risk, 0) * 0.6 +
        CASE WHEN COALESCE(wb_stats.whistleblower_reports, 0) > 0 THEN 30 ELSE 0 END +
        CASE WHEN COALESCE(wb_stats.active_investigations, 0) > 0 THEN 20 ELSE 0 END +
        CASE WHEN c.tax_status != 'active' THEN 15 ELSE 0 END
    ) as calculated_risk_score,
    
    -- Timestamps
    c.created_at as company_registered,
    GREATEST(doc_stats.last_document_date, wb_stats.last_report_date) as last_activity_date

FROM core.companies c

-- Document statistics subquery
LEFT JOIN (
    SELECT 
        company_id,
        COUNT(*) as total_documents,
        AVG(risk_score) as avg_document_risk,
        COUNT(CASE WHEN risk_score > 75 THEN 1 END) as high_risk_documents,
        MAX(created_at) as last_document_date
    FROM ocr.documents 
    WHERE company_id IS NOT NULL
    GROUP BY company_id
) doc_stats ON doc_stats.company_id = c.id

-- Whistleblower statistics subquery
LEFT JOIN (
    SELECT 
        company_id,
        COUNT(*) as whistleblower_reports,
        COUNT(CASE WHEN status IN ('investigating', 'under_review') THEN 1 END) as active_investigations,
        MAX(created_at) as last_report_date
    FROM whistlepro.reports 
    WHERE company_id IS NOT NULL
    GROUP BY company_id
) wb_stats ON wb_stats.company_id = c.id

-- Filter: Only show companies with elevated risk
WHERE 
    COALESCE(doc_stats.avg_document_risk, 0) > 50 
    OR COALESCE(wb_stats.whistleblower_reports, 0) > 0
    OR c.tax_status != 'active'

ORDER BY 
    CASE 
        WHEN COALESCE(wb_stats.whistleblower_reports, 0) > 0 AND COALESCE(doc_stats.avg_document_risk, 0) > 70 THEN 1
        WHEN COALESCE(doc_stats.avg_document_risk, 0) > 80 THEN 2
        WHEN COALESCE(wb_stats.whistleblower_reports, 0) > 0 THEN 3
        ELSE 4
    END,
    COALESCE(doc_stats.avg_document_risk, 0) DESC,
    COALESCE(wb_stats.whistleblower_reports, 0) DESC;

COMMENT ON VIEW core.high_risk_companies IS 'Companies with elevated risk profiles based on document analysis and whistleblower reports. Risk levels: CRITICAL (reports + high doc risk), HIGH (doc risk >80), MEDIUM (has reports), LOW (other)';

-- ============================================================================
-- VIEW 2: ACTIVE INVESTIGATIONS
-- ============================================================================
-- Purpose: Current active investigations with comprehensive context
-- ============================================================================

CREATE OR REPLACE VIEW core.active_investigations AS
SELECT 
    -- Case Information
    wr.id as report_id,
    wr.case_id,
    wr.category,
    wr.priority,
    wr.status,
    wr.created_at as reported_date,
    EXTRACT(DAYS FROM (NOW() - wr.created_at)) as days_open,
    
    -- Company Information
    c.company_name,
    c.tpin as company_tpin,
    c.industry_sector,
    c.tax_status as company_tax_status,
    c.employee_count,
    
    -- Investigator Information
    i.full_name as investigator_name,
    i.email as investigator_email,
    i.department as investigator_department,
    i.role as investigator_role,
    
    -- Taxpayer Information (if applicable)
    t.full_name as taxpayer_name,
    t.nrc as taxpayer_nrc,
    
    -- Related Documents Analysis
    COALESCE(doc_stats.related_documents, 0) as related_documents_count,
    COALESCE(ROUND(doc_stats.avg_document_risk, 2), 0) as avg_document_risk,
    COALESCE(doc_stats.max_document_risk, 0) as max_document_risk,
    doc_stats.latest_document_date,
    
    -- Investigation Priority Score (0-100)
    (
        CASE wr.priority
            WHEN 'critical' THEN 40
            WHEN 'high' THEN 30
            WHEN 'medium' THEN 20
            WHEN 'low' THEN 10
        END +
        CASE 
            WHEN EXTRACT(DAYS FROM (NOW() - wr.created_at)) > 30 THEN 25
            WHEN EXTRACT(DAYS FROM (NOW() - wr.created_at)) > 14 THEN 15
            WHEN EXTRACT(DAYS FROM (NOW() - wr.created_at)) > 7 THEN 10
            ELSE 5
        END +
        CASE 
            WHEN COALESCE(doc_stats.avg_document_risk, 0) > 80 THEN 20
            WHEN COALESCE(doc_stats.avg_document_risk, 0) > 60 THEN 15
            WHEN COALESCE(doc_stats.avg_document_risk, 0) > 40 THEN 10
            ELSE 5
        END +
        CASE WHEN wr.assigned_to IS NULL THEN 15 ELSE 0 END
    ) as investigation_priority_score

FROM whistlepro.reports wr

-- Join with companies
LEFT JOIN core.companies c ON c.id = wr.company_id

-- Join with investigators
LEFT JOIN whistlepro.investigators i ON i.id = wr.assigned_to

-- Join with taxpayers
LEFT JOIN core.taxpayers t ON t.id = wr.taxpayer_id

-- Related documents analysis
LEFT JOIN (
    SELECT 
        company_id,
        COUNT(*) as related_documents,
        AVG(risk_score) as avg_document_risk,
        MAX(risk_score) as max_document_risk,
        MAX(created_at) as latest_document_date
    FROM ocr.documents 
    WHERE company_id IS NOT NULL
    GROUP BY company_id
) doc_stats ON doc_stats.company_id = wr.company_id

-- Filter: Only active investigations
WHERE wr.status IN ('investigating', 'under_review')

ORDER BY 
    wr.priority DESC,
    investigation_priority_score DESC,
    wr.created_at ASC;

COMMENT ON VIEW core.active_investigations IS 'Active whistleblower investigations with company context, investigator assignments, and related document analysis. Includes priority scoring for case management.';

-- ============================================================================
-- VIEW 3: COMPANY RISK DASHBOARD
-- ============================================================================
-- Purpose: Comprehensive risk dashboard for all companies
-- ============================================================================

CREATE OR REPLACE VIEW core.company_risk_dashboard AS
SELECT 
    -- Company Basic Information
    c.id as company_id,
    c.tpin,
    c.company_name,
    c.registration_number,
    c.industry_sector,
    c.tax_status,
    c.employee_count,
    c.annual_revenue,
    c.created_at as registration_date,
    
    -- Document Processing Metrics
    COALESCE(doc_metrics.document_count, 0) as document_count,
    COALESCE(ROUND(doc_metrics.avg_risk_score, 2), 0) as avg_risk_score,
    COALESCE(doc_metrics.max_risk_score, 0) as max_risk_score,
    COALESCE(doc_metrics.high_risk_documents, 0) as high_risk_documents,
    COALESCE(doc_metrics.fraudulent_documents, 0) as fraudulent_documents,
    COALESCE(doc_metrics.blockchain_verified_docs, 0) as blockchain_verified_docs,
    doc_metrics.last_document_upload,
    
    -- Whistleblower Activity
    COALESCE(wb_metrics.whistleblower_count, 0) as whistleblower_count,
    COALESCE(wb_metrics.active_investigations, 0) as active_investigations_count,
    COALESCE(wb_metrics.resolved_cases, 0) as resolved_cases_count,
    wb_metrics.last_whistleblower_report,
    wb_metrics.latest_case_status,
    
    -- Employee Risk Indicators
    COALESCE(emp_metrics.total_employees_in_system, 0) as total_employees_in_system,
    COALESCE(emp_metrics.high_risk_employees, 0) as high_risk_employees,
    
    -- Overall Risk Assessment
    CASE 
        WHEN COALESCE(wb_metrics.active_investigations, 0) > 0 THEN 'UNDER_INVESTIGATION'
        WHEN COALESCE(doc_metrics.fraudulent_documents, 0) > 0 THEN 'FRAUD_DETECTED'
        WHEN COALESCE(doc_metrics.avg_risk_score, 0) > 80 THEN 'HIGH_RISK'
        WHEN COALESCE(wb_metrics.whistleblower_count, 0) > 0 THEN 'REPORTED'
        WHEN COALESCE(doc_metrics.avg_risk_score, 0) > 60 THEN 'MEDIUM_RISK'
        WHEN COALESCE(doc_metrics.document_count, 0) = 0 THEN 'NO_ACTIVITY'
        ELSE 'LOW_RISK'
    END as risk_category,
    
    -- Compliance Score (0-100, higher is better)
    GREATEST(0, LEAST(100,
        100 
        - COALESCE(doc_metrics.avg_risk_score, 0) * 0.4
        - CASE WHEN COALESCE(wb_metrics.whistleblower_count, 0) > 0 THEN 25 ELSE 0 END
        - CASE WHEN COALESCE(doc_metrics.fraudulent_documents, 0) > 0 THEN 30 ELSE 0 END
        - CASE WHEN c.tax_status != 'active' THEN 20 ELSE 0 END
        + CASE WHEN COALESCE(doc_metrics.blockchain_verified_docs, 0) > 0 THEN 10 ELSE 0 END
    )) as compliance_score,
    
    -- Activity Indicators
    CASE 
        WHEN doc_metrics.last_document_upload >= (NOW() - INTERVAL '30 days') THEN 'ACTIVE'
        WHEN doc_metrics.last_document_upload >= (NOW() - INTERVAL '90 days') THEN 'RECENT'
        WHEN doc_metrics.last_document_upload IS NOT NULL THEN 'INACTIVE'
        ELSE 'NO_DOCUMENTS'
    END as activity_status,
    
    -- Last Activity
    GREATEST(
        doc_metrics.last_document_upload,
        wb_metrics.last_whistleblower_report,
        c.updated_at
    ) as last_activity_date

FROM core.companies c

-- Document metrics subquery
LEFT JOIN (
    SELECT 
        company_id,
        COUNT(*) as document_count,
        AVG(risk_score) as avg_risk_score,
        MAX(risk_score) as max_risk_score,
        COUNT(CASE WHEN risk_score > 75 THEN 1 END) as high_risk_documents,
        COUNT(CASE WHEN verification_status = 'FRAUDULENT' THEN 1 END) as fraudulent_documents,
        COUNT(CASE WHEN blockchain_tx_id IS NOT NULL THEN 1 END) as blockchain_verified_docs,
        MAX(created_at) as last_document_upload
    FROM ocr.documents 
    WHERE company_id IS NOT NULL
    GROUP BY company_id
) doc_metrics ON doc_metrics.company_id = c.id

-- Whistleblower metrics subquery
LEFT JOIN (
    SELECT 
        company_id,
        COUNT(*) as whistleblower_count,
        COUNT(CASE WHEN status IN ('investigating', 'under_review') THEN 1 END) as active_investigations,
        COUNT(CASE WHEN status = 'closed' THEN 1 END) as resolved_cases,
        MAX(created_at) as last_whistleblower_report,
        (SELECT status FROM whistlepro.reports wr2 
         WHERE wr2.company_id = wr.company_id 
         ORDER BY wr2.created_at DESC LIMIT 1) as latest_case_status
    FROM whistlepro.reports wr
    WHERE company_id IS NOT NULL
    GROUP BY company_id
) wb_metrics ON wb_metrics.company_id = c.id

-- Employee metrics subquery (placeholder for future ghostbuster integration)
LEFT JOIN (
    SELECT 
        employer_id as company_id,
        COUNT(*) as total_employees_in_system,
        0 as high_risk_employees  -- Placeholder for future implementation
    FROM core.taxpayers 
    WHERE employer_id IS NOT NULL
    GROUP BY employer_id
) emp_metrics ON emp_metrics.company_id = c.id

ORDER BY 
    CASE 
        WHEN COALESCE(wb_metrics.active_investigations, 0) > 0 THEN 1
        WHEN COALESCE(doc_metrics.fraudulent_documents, 0) > 0 THEN 2
        WHEN COALESCE(doc_metrics.avg_risk_score, 0) > 80 THEN 3
        WHEN COALESCE(wb_metrics.whistleblower_count, 0) > 0 THEN 4
        ELSE 5
    END,
    COALESCE(doc_metrics.avg_risk_score, 0) DESC,
    c.company_name;

COMMENT ON VIEW core.company_risk_dashboard IS 'Comprehensive risk dashboard showing all companies with document processing metrics, whistleblower activity, compliance scores, and overall risk categorization. No filters - shows complete company portfolio.';

-- ============================================================================
-- CREATE SUPPORTING FUNCTIONS FOR VIEWS
-- ============================================================================

-- Function to refresh materialized view statistics (for future optimization)
CREATE OR REPLACE FUNCTION core.refresh_risk_statistics()
RETURNS TABLE(
    companies_analyzed INTEGER,
    high_risk_companies INTEGER,
    active_investigations INTEGER,
    avg_compliance_score DECIMAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        (SELECT COUNT(*)::INTEGER FROM core.companies) as companies_analyzed,
        (SELECT COUNT(*)::INTEGER FROM core.high_risk_companies) as high_risk_companies,
        (SELECT COUNT(*)::INTEGER FROM core.active_investigations) as active_investigations,
        (SELECT ROUND(AVG(compliance_score), 2) FROM core.company_risk_dashboard) as avg_compliance_score;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION core.refresh_risk_statistics() IS 'Generate summary statistics for risk analysis dashboard';

-- ============================================================================
-- CREATE INDEXES FOR VIEW PERFORMANCE
-- ============================================================================

-- Indexes to optimize view performance (if not already created)
CREATE INDEX IF NOT EXISTS idx_companies_tax_status_active ON core.companies(tax_status) WHERE tax_status = 'active';
CREATE INDEX IF NOT EXISTS idx_documents_company_risk ON ocr.documents(company_id, risk_score) WHERE company_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_reports_company_status ON whistlepro.reports(company_id, status) WHERE company_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_taxpayers_employer_active ON core.taxpayers(employer_id) WHERE employer_id IS NOT NULL;

-- ============================================================================
-- VERIFICATION AND TESTING
-- ============================================================================

-- Test all views are accessible and return data
DO $$
DECLARE
    high_risk_count INTEGER;
    active_inv_count INTEGER;
    dashboard_count INTEGER;
BEGIN
    -- Test high risk companies view
    SELECT COUNT(*) INTO high_risk_count FROM core.high_risk_companies;
    RAISE NOTICE 'High risk companies view: % records', high_risk_count;
    
    -- Test active investigations view
    SELECT COUNT(*) INTO active_inv_count FROM core.active_investigations;
    RAISE NOTICE 'Active investigations view: % records', active_inv_count;
    
    -- Test company risk dashboard view
    SELECT COUNT(*) INTO dashboard_count FROM core.company_risk_dashboard;
    RAISE NOTICE 'Company risk dashboard view: % records', dashboard_count;
    
    -- Test supporting function
    PERFORM core.refresh_risk_statistics();
    RAISE NOTICE 'Risk statistics function: working';
    
    RAISE NOTICE 'Migration 004: All integration views created and tested successfully';
END $$;

-- Display sample data from each view
SELECT 'HIGH RISK COMPANIES' as view_name, COUNT(*) as record_count FROM core.high_risk_companies
UNION ALL
SELECT 'ACTIVE INVESTIGATIONS', COUNT(*) FROM core.active_investigations  
UNION ALL
SELECT 'COMPANY RISK DASHBOARD', COUNT(*) FROM core.company_risk_dashboard;

-- Show risk distribution
SELECT 
    risk_category,
    COUNT(*) as company_count,
    ROUND(AVG(compliance_score), 2) as avg_compliance_score
FROM core.company_risk_dashboard 
GROUP BY risk_category 
ORDER BY 
    CASE risk_category
        WHEN 'UNDER_INVESTIGATION' THEN 1
        WHEN 'FRAUD_DETECTED' THEN 2
        WHEN 'HIGH_RISK' THEN 3
        WHEN 'REPORTED' THEN 4
        WHEN 'MEDIUM_RISK' THEN 5
        WHEN 'LOW_RISK' THEN 6
        WHEN 'NO_ACTIVITY' THEN 7
    END;

-- ============================================================================
-- ROLLBACK INSTRUCTIONS (COMMENTED)
-- ============================================================================
-- To rollback this migration, run:
-- 
-- DROP VIEW IF EXISTS core.high_risk_companies;
-- DROP VIEW IF EXISTS core.active_investigations;
-- DROP VIEW IF EXISTS core.company_risk_dashboard;
-- DROP FUNCTION IF EXISTS core.refresh_risk_statistics();
-- 
-- DROP INDEX IF EXISTS idx_companies_tax_status_active;
-- DROP INDEX IF EXISTS idx_documents_company_risk;
-- DROP INDEX IF EXISTS idx_reports_company_status;
-- DROP INDEX IF EXISTS idx_taxpayers_employer_active;
-- ============================================================================
