# 🗄️ ZRA TaxGuard - Merged Database Structure

**After Branch Merging:** Complete Database Architecture  
**Database:** PostgreSQL (`zra_taxguard`)  
**Architecture:** Shared Database with Schema-Based Modules  
**Date:** October 6, 2025

---

## 🏗️ Complete Database Architecture

### **Single PostgreSQL Database: `zra_taxguard`**

```
zra_taxguard (PostgreSQL Database)
├── ocr             # OCR document processing (IMPLEMENTED)
├── ghostbuster     # Ghost employee detection (PLANNED)
├── risk            # Risk scoring & analytics (PLANNED)
├── compliance      # Tax compliance checks (PLANNED)
├── audit           # Audit trails & logs (PLANNED)
├── whistlepro      # Whistleblower reports (KELVIN'S TABLES)
└── blockchain      # Blockchain integration (PLANNED)
```

---

## 📊 Schema 1: OCR Module (Main Branch - IMPLEMENTED)

### **Table: `ocr.documents`**

```sql
CREATE SCHEMA IF NOT EXISTS ocr;

CREATE TABLE ocr.documents (
    -- Primary Key
    id SERIAL PRIMARY KEY,
    
    -- Document Identification
    document_id VARCHAR(100) UNIQUE NOT NULL,
    
    -- File Information
    filename VARCHAR(255) NOT NULL,
    original_name VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    file_size BIGINT NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    file_hash VARCHAR(64) NOT NULL,
    
    -- Upload Metadata
    uploaded_at TIMESTAMP DEFAULT NOW(),
    uploaded_by VARCHAR(100) DEFAULT 'anonymous',
    
    -- Processing Status
    status VARCHAR(20) DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'PROCESSING', 'VERIFIED', 'FLAGGED', 'ERROR')),
    
    -- Custom Metadata (JSONB for flexibility)
    metadata JSONB DEFAULT '{}',
    
    -- OCR/AI Processing Results
    ocr_data JSONB DEFAULT NULL,
    ai_metadata JSONB DEFAULT NULL,
    
    -- Risk Assessment
    risk_score DECIMAL(5,2) CHECK (risk_score >= 0 AND risk_score <= 100),
    verification_status VARCHAR(20) CHECK (verification_status IN ('VALID', 'SUSPICIOUS', 'FRAUDULENT', 'INVALID')),
    risk_flags JSONB DEFAULT '[]',
    
    -- ZRA Verification Result
    verification_result JSONB DEFAULT NULL,
    
    -- Blockchain Integration
    blockchain_tx_id VARCHAR(100),
    block_number INTEGER,
    blockchain_proof JSONB DEFAULT NULL,
    
    -- Processing History
    processing_steps JSONB DEFAULT '[]',
    error_logs JSONB DEFAULT '[]',
    
    -- Timestamps
    processed_at TIMESTAMP,
    verified_at TIMESTAMP,
    last_updated TIMESTAMP DEFAULT NOW(),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for OCR module
CREATE INDEX idx_ocr_documents_document_id ON ocr.documents(document_id);
CREATE INDEX idx_ocr_documents_status_uploaded ON ocr.documents(status, uploaded_at DESC);
CREATE INDEX idx_ocr_documents_verification_status ON ocr.documents(verification_status);
CREATE INDEX idx_ocr_documents_metadata_gin ON ocr.documents USING gin(metadata jsonb_path_ops);
```

---

## 📊 Schema 2: WhistlePro Module (Kelvin's Branch - TO BE MERGED)

### **Table: `whistlepro.reports`**

```sql
CREATE SCHEMA IF NOT EXISTS whistlepro;

CREATE TABLE whistlepro.reports (
    -- Primary Key
    id SERIAL PRIMARY KEY,
    
    -- Case Management
    case_id VARCHAR(20) UNIQUE NOT NULL,
    
    -- Encrypted Data
    payload_encrypted TEXT NOT NULL,
    
    -- Classification
    category VARCHAR(50),
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'under_review', 'investigating', 'closed')),
    priority VARCHAR(20) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
    
    -- Blockchain Integration
    metadata_hash TEXT,
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Indexes for WhistlePro reports
CREATE INDEX idx_whistlepro_reports_case_id ON whistlepro.reports(case_id);
CREATE INDEX idx_whistlepro_reports_status ON whistlepro.reports(status);
CREATE INDEX idx_whistlepro_reports_status_created ON whistlepro.reports(status, created_at);
CREATE INDEX idx_whistlepro_reports_category_status ON whistlepro.reports(category, status);
```

### **Table: `whistlepro.investigators`**

```sql
CREATE TABLE whistlepro.investigators (
    -- Primary Key
    id SERIAL PRIMARY KEY,
    
    -- Authentication
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    
    -- Personal Info
    full_name VARCHAR(255) NOT NULL,
    badge_number VARCHAR(50) UNIQUE,
    
    -- Role & Department
    role VARCHAR(50) DEFAULT 'investigator' CHECK (role IN ('investigator', 'senior_investigator', 'supervisor', 'admin')),
    department VARCHAR(50) DEFAULT 'general' CHECK (department IN ('tax_evasion', 'fraud', 'compliance', 'general')),
    
    -- Status
    is_active BOOLEAN DEFAULT TRUE NOT NULL,
    
    -- Activity Tracking
    last_login TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Indexes for investigators
CREATE INDEX idx_whistlepro_investigators_email_active ON whistlepro.investigators(email, is_active);
CREATE INDEX idx_whistlepro_investigators_role_active ON whistlepro.investigators(role, is_active);
```

### **Table: `whistlepro.audit_logs`**

```sql
CREATE TABLE whistlepro.audit_logs (
    -- Primary Key
    id SERIAL PRIMARY KEY,
    
    -- Actor Information
    actor_id INTEGER,
    actor_type VARCHAR(50) NOT NULL,
    
    -- Action Details
    action VARCHAR(100) NOT NULL,
    target_type VARCHAR(50) NOT NULL,
    target_id INTEGER,
    
    -- Security Data (Hashed)
    ip_hash VARCHAR(64),
    user_agent_hash TEXT,
    
    -- Additional Context
    metadata JSON,
    
    -- Timestamp
    created_at TIMESTAMP DEFAULT NOW() NOT NULL,
    
    -- Foreign Key Constraints
    FOREIGN KEY (actor_id) REFERENCES whistlepro.investigators(id) ON DELETE SET NULL
);

-- Indexes for audit logs
CREATE INDEX idx_whistlepro_audit_actor_created ON whistlepro.audit_logs(actor_id, created_at);
CREATE INDEX idx_whistlepro_audit_action_created ON whistlepro.audit_logs(action, created_at);
CREATE INDEX idx_whistlepro_audit_target ON whistlepro.audit_logs(target_type, target_id);
```

---

## 📊 Schema 3: GhostBuster Module (PLANNED - Future Implementation)

```sql
CREATE SCHEMA IF NOT EXISTS ghostbuster;

CREATE TABLE ghostbuster.employees (
    id SERIAL PRIMARY KEY,
    employee_id VARCHAR(50) UNIQUE,
    tpin VARCHAR(20),
    full_name VARCHAR(255),
    nrc_number VARCHAR(20),
    status VARCHAR(20),
    risk_score DECIMAL(5,2),
    verification_status VARCHAR(20),
    anomaly_flags JSONB DEFAULT '[]',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE ghostbuster.anomalies (
    id SERIAL PRIMARY KEY,
    employee_id VARCHAR(50),
    anomaly_type VARCHAR(100),
    severity VARCHAR(20),
    description TEXT,
    detected_at TIMESTAMP DEFAULT NOW(),
    resolved_at TIMESTAMP,
    FOREIGN KEY (employee_id) REFERENCES ghostbuster.employees(employee_id)
);
```

---

## 📊 Schema 4: Risk Module (PLANNED - Future Implementation)

```sql
CREATE SCHEMA IF NOT EXISTS risk;

CREATE TABLE risk.scores (
    id SERIAL PRIMARY KEY,
    entity_type VARCHAR(50), -- 'document', 'company', 'employee'
    entity_id VARCHAR(100),
    risk_score DECIMAL(5,2),
    risk_factors JSONB,
    calculated_at TIMESTAMP DEFAULT NOW(),
    expires_at TIMESTAMP
);

CREATE TABLE risk.factors (
    id SERIAL PRIMARY KEY,
    factor_name VARCHAR(100),
    factor_type VARCHAR(50),
    weight DECIMAL(3,2),
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE
);
```

---

## 📊 Schema 5: Compliance Module (PLANNED - Future Implementation)

```sql
CREATE SCHEMA IF NOT EXISTS compliance;

CREATE TABLE compliance.violations (
    id SERIAL PRIMARY KEY,
    violation_type VARCHAR(100),
    entity_type VARCHAR(50),
    entity_id VARCHAR(100),
    severity VARCHAR(20),
    description TEXT,
    detected_at TIMESTAMP DEFAULT NOW(),
    resolved_at TIMESTAMP,
    resolution_notes TEXT
);

CREATE TABLE compliance.rules (
    id SERIAL PRIMARY KEY,
    rule_name VARCHAR(100),
    rule_type VARCHAR(50),
    conditions JSONB,
    actions JSONB,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW()
);
```

---

## 📊 Schema 6: Audit Module (PLANNED - Future Implementation)

```sql
CREATE SCHEMA IF NOT EXISTS audit;

CREATE TABLE audit.system_logs (
    id SERIAL PRIMARY KEY,
    module VARCHAR(50),
    action VARCHAR(100),
    user_id VARCHAR(100),
    ip_address INET,
    user_agent TEXT,
    request_data JSONB,
    response_data JSONB,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE audit.data_changes (
    id SERIAL PRIMARY KEY,
    table_name VARCHAR(100),
    record_id INTEGER,
    operation VARCHAR(10), -- INSERT, UPDATE, DELETE
    old_values JSONB,
    new_values JSONB,
    changed_by VARCHAR(100),
    changed_at TIMESTAMP DEFAULT NOW()
);
```

---

## 📊 Schema 7: Blockchain Module (PLANNED - Future Implementation)

```sql
CREATE SCHEMA IF NOT EXISTS blockchain;

CREATE TABLE blockchain.transactions (
    id SERIAL PRIMARY KEY,
    tx_hash VARCHAR(66) UNIQUE,
    block_number BIGINT,
    module VARCHAR(50),
    entity_type VARCHAR(50),
    entity_id VARCHAR(100),
    data_hash VARCHAR(64),
    timestamp TIMESTAMP DEFAULT NOW()
);

CREATE TABLE blockchain.proofs (
    id SERIAL PRIMARY KEY,
    proof_hash VARCHAR(64) UNIQUE,
    entity_type VARCHAR(50),
    entity_id VARCHAR(100),
    proof_data JSONB,
    verified_at TIMESTAMP DEFAULT NOW()
);
```

---

## 🔗 Cross-Schema Relationships (After Merge)

### **Document-Employee Verification:**
```sql
-- Link OCR documents to GhostBuster employee verification
SELECT 
    d.document_id,
    d.metadata->>'importerTpin' as tpin,
    e.full_name,
    e.risk_score as employee_risk,
    d.risk_score as document_risk
FROM ocr.documents d
JOIN ghostbuster.employees e ON e.tpin = d.metadata->>'importerTpin'
WHERE d.risk_score > 75 OR e.risk_score > 80;
```

### **Whistleblower-Document Correlation:**
```sql
-- Find documents related to whistleblower reports
SELECT 
    wr.case_id,
    wr.category,
    d.document_id,
    d.verification_status
FROM whistlepro.reports wr
JOIN ocr.documents d ON d.metadata->>'importerName' ILIKE '%' || wr.category || '%'
WHERE wr.status = 'investigating';
```

### **Risk Aggregation:**
```sql
-- Aggregate risk scores across all modules
SELECT 
    entity_id,
    AVG(risk_score) as avg_risk,
    COUNT(*) as risk_assessments
FROM (
    SELECT metadata->>'importerTpin' as entity_id, risk_score FROM ocr.documents WHERE risk_score IS NOT NULL
    UNION ALL
    SELECT tpin as entity_id, risk_score FROM ghostbuster.employees WHERE risk_score IS NOT NULL
    UNION ALL
    SELECT entity_id, risk_score FROM risk.scores WHERE entity_type = 'company'
) combined_risks
GROUP BY entity_id
HAVING AVG(risk_score) > 70
ORDER BY avg_risk DESC;
```

---

## 🚀 Migration Strategy

### **Phase 1: Current State (Main Branch)**
```sql
-- Already implemented
CREATE SCHEMA ocr;
-- OCR tables created and operational
```

### **Phase 2: Merge Kelvin's WhistlePro**
```sql
-- Add WhistlePro schema
CREATE SCHEMA whistlepro;
-- Migrate Kelvin's tables to whistlepro schema
-- Update foreign key references
```

### **Phase 3: Add Remaining Modules**
```sql
-- Create remaining schemas
CREATE SCHEMA ghostbuster;
CREATE SCHEMA risk;
CREATE SCHEMA compliance;
CREATE SCHEMA audit;
CREATE SCHEMA blockchain;
-- Implement tables as modules are developed
```

---

## 📊 Final Database Structure Summary

### **After All Merges:**

**Schemas:** 7 total
- ✅ `ocr` - Document processing (IMPLEMENTED)
- ✅ `whistlepro` - Whistleblower reports (KELVIN - TO MERGE)
- 🔄 `ghostbuster` - Employee verification (PLANNED)
- 🔄 `risk` - Risk scoring (PLANNED)
- 🔄 `compliance` - Compliance checking (PLANNED)
- 🔄 `audit` - System auditing (PLANNED)
- 🔄 `blockchain` - Blockchain integration (PLANNED)

**Tables:** 15+ total (2 implemented, 3 from Kelvin, 10+ planned)

**Benefits:**
- ✅ **Unified Database** - Single PostgreSQL instance
- ✅ **Cross-Module Queries** - Direct JOINs between schemas
- ✅ **Transaction Consistency** - ACID compliance across modules
- ✅ **Performance** - No network overhead
- ✅ **Scalability** - Schema-based organization
- ✅ **Security** - Unified access control

**The merged database will be a comprehensive, integrated system supporting all ZRA TaxGuard AI modules!** 🎯
