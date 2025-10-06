-- ============================================================================
-- Migration 001: Core Schema Creation
-- ============================================================================
-- Purpose: Create core schema with shared entities for ZRA TaxGuard AI system
-- Author: Database Migration Team
-- Date: October 6, 2025
-- Dependencies: None (base migration)
-- ============================================================================

-- Create core schema
CREATE SCHEMA IF NOT EXISTS core;

-- ============================================================================
-- COMPANIES TABLE
-- ============================================================================
-- Purpose: Central registry of all companies in the tax system
-- ============================================================================

CREATE TABLE IF NOT EXISTS core.companies (
    -- Primary Key
    id SERIAL PRIMARY KEY,
    
    -- Business Identifiers
    tpin VARCHAR(20) UNIQUE NOT NULL,
    company_name VARCHAR(255) NOT NULL,
    registration_number VARCHAR(50) UNIQUE,
    
    -- Business Classification
    industry_sector VARCHAR(100),
    registration_date DATE,
    tax_status VARCHAR(20) DEFAULT 'active' CHECK (tax_status IN ('active', 'suspended', 'dormant')),
    
    -- Business Metrics
    employee_count INTEGER DEFAULT 0 CHECK (employee_count >= 0),
    annual_revenue DECIMAL(15,2) DEFAULT 0.00,
    
    -- Contact Information
    contact_email VARCHAR(255),
    contact_phone VARCHAR(20),
    contact_person VARCHAR(255),
    
    -- Address Information
    physical_address TEXT,
    postal_address TEXT,
    city VARCHAR(100),
    province VARCHAR(100),
    postal_code VARCHAR(20),
    
    -- Flexible Metadata
    metadata JSONB DEFAULT '{}',
    
    -- Audit Timestamps
    created_at TIMESTAMP DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Add table comment
COMMENT ON TABLE core.companies IS 'Central registry of all companies registered with ZRA for tax compliance tracking';
COMMENT ON COLUMN core.companies.tpin IS 'Tax Payer Identification Number - unique business identifier';
COMMENT ON COLUMN core.companies.tax_status IS 'Current tax compliance status: active, suspended, or dormant';
COMMENT ON COLUMN core.companies.metadata IS 'Additional company data in JSON format for extensibility';

-- ============================================================================
-- TAXPAYERS TABLE
-- ============================================================================
-- Purpose: Individual taxpayer registry with employment relationships
-- ============================================================================

CREATE TABLE IF NOT EXISTS core.taxpayers (
    -- Primary Key
    id SERIAL PRIMARY KEY,
    
    -- Personal Identifiers
    nrc VARCHAR(20) UNIQUE NOT NULL,
    tpin VARCHAR(20) UNIQUE,
    
    -- Personal Information
    full_name VARCHAR(255) NOT NULL,
    date_of_birth DATE,
    gender VARCHAR(10) CHECK (gender IN ('male', 'female', 'other')),
    
    -- Tax Information
    tax_status VARCHAR(20) DEFAULT 'active' CHECK (tax_status IN ('active', 'inactive', 'deceased')),
    employer_id INTEGER,
    
    -- Contact Information
    contact_email VARCHAR(255),
    contact_phone VARCHAR(20),
    
    -- Address Information
    physical_address TEXT,
    postal_address TEXT,
    city VARCHAR(100),
    province VARCHAR(100),
    postal_code VARCHAR(20),
    
    -- Flexible Metadata
    metadata JSONB DEFAULT '{}',
    
    -- Audit Timestamps
    created_at TIMESTAMP DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP DEFAULT NOW() NOT NULL,
    
    -- Foreign Key Constraints
    CONSTRAINT fk_taxpayers_employer FOREIGN KEY (employer_id) 
        REFERENCES core.companies(id) ON DELETE SET NULL
);

-- Add table comment
COMMENT ON TABLE core.taxpayers IS 'Registry of individual taxpayers with employment and contact information';
COMMENT ON COLUMN core.taxpayers.nrc IS 'National Registration Card number - unique citizen identifier';
COMMENT ON COLUMN core.taxpayers.tpin IS 'Tax Payer Identification Number for individuals';
COMMENT ON COLUMN core.taxpayers.employer_id IS 'Reference to employing company, NULL for self-employed';

-- ============================================================================
-- SYSTEM AUDIT TABLE
-- ============================================================================
-- Purpose: Comprehensive audit trail for all database changes across schemas
-- ============================================================================

CREATE TABLE IF NOT EXISTS core.system_audit (
    -- Primary Key
    id SERIAL PRIMARY KEY,
    
    -- Target Information
    schema_name VARCHAR(50) NOT NULL,
    table_name VARCHAR(100) NOT NULL,
    action VARCHAR(10) NOT NULL CHECK (action IN ('INSERT', 'UPDATE', 'DELETE')),
    record_id INTEGER,
    
    -- Actor Information
    user_id VARCHAR(100),
    user_type VARCHAR(50) DEFAULT 'system',
    
    -- Change Data
    old_data JSONB,
    new_data JSONB,
    
    -- Request Context
    ip_address INET,
    user_agent TEXT,
    
    -- Timestamp
    created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Add table comment
COMMENT ON TABLE core.system_audit IS 'System-wide audit trail tracking all data changes across all schemas';
COMMENT ON COLUMN core.system_audit.old_data IS 'Previous record state in JSON format (NULL for INSERT)';
COMMENT ON COLUMN core.system_audit.new_data IS 'New record state in JSON format (NULL for DELETE)';
COMMENT ON COLUMN core.system_audit.ip_address IS 'Client IP address where change originated';

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

-- Companies indexes
CREATE INDEX IF NOT EXISTS idx_companies_tpin ON core.companies(tpin);
CREATE INDEX IF NOT EXISTS idx_companies_tax_status ON core.companies(tax_status);
CREATE INDEX IF NOT EXISTS idx_companies_industry ON core.companies(industry_sector);
CREATE INDEX IF NOT EXISTS idx_companies_created ON core.companies(created_at DESC);

-- Taxpayers indexes
CREATE INDEX IF NOT EXISTS idx_taxpayers_nrc ON core.taxpayers(nrc);
CREATE INDEX IF NOT EXISTS idx_taxpayers_tpin ON core.taxpayers(tpin);
CREATE INDEX IF NOT EXISTS idx_taxpayers_employer ON core.taxpayers(employer_id);
CREATE INDEX IF NOT EXISTS idx_taxpayers_tax_status ON core.taxpayers(tax_status);

-- System audit indexes
CREATE INDEX IF NOT EXISTS idx_audit_schema_table ON core.system_audit(schema_name, table_name);
CREATE INDEX IF NOT EXISTS idx_audit_created ON core.system_audit(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_user ON core.system_audit(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_record ON core.system_audit(schema_name, table_name, record_id);

-- ============================================================================
-- TRIGGERS FOR AUTOMATIC TIMESTAMP UPDATES
-- ============================================================================

-- Function to update timestamp
CREATE OR REPLACE FUNCTION core.update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for companies table
DROP TRIGGER IF EXISTS trigger_companies_updated_at ON core.companies;
CREATE TRIGGER trigger_companies_updated_at
    BEFORE UPDATE ON core.companies
    FOR EACH ROW
    EXECUTE FUNCTION core.update_timestamp();

-- Triggers for taxpayers table
DROP TRIGGER IF EXISTS trigger_taxpayers_updated_at ON core.taxpayers;
CREATE TRIGGER trigger_taxpayers_updated_at
    BEFORE UPDATE ON core.taxpayers
    FOR EACH ROW
    EXECUTE FUNCTION core.update_timestamp();

-- ============================================================================
-- INITIAL DATA SETUP
-- ============================================================================

-- Insert system user for audit trail
INSERT INTO core.companies (tpin, company_name, registration_number, industry_sector, tax_status)
VALUES ('SYSTEM001', 'ZRA System', 'SYS-001', 'Government', 'active')
ON CONFLICT (tpin) DO NOTHING;

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Verify schema creation
DO $$
BEGIN
    -- Check if core schema exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.schemata WHERE schema_name = 'core') THEN
        RAISE EXCEPTION 'Core schema was not created successfully';
    END IF;
    
    -- Check if all tables exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'core' AND table_name = 'companies') THEN
        RAISE EXCEPTION 'Companies table was not created successfully';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'core' AND table_name = 'taxpayers') THEN
        RAISE EXCEPTION 'Taxpayers table was not created successfully';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'core' AND table_name = 'system_audit') THEN
        RAISE EXCEPTION 'System audit table was not created successfully';
    END IF;
    
    RAISE NOTICE 'Migration 001: Core schema created successfully';
END $$;

-- ============================================================================
-- ROLLBACK INSTRUCTIONS (COMMENTED)
-- ============================================================================
-- To rollback this migration, run:
-- DROP SCHEMA IF EXISTS core CASCADE;
-- 
-- WARNING: This will delete all core data and break foreign key relationships
-- Only use in development environments
-- ============================================================================
