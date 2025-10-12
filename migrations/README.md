# 🗄️ ZRA TaxGuard Database Migrations

**Complete PostgreSQL migration suite for ZRA TaxGuard AI system integration**

---

## 📋 Migration Overview

This directory contains 4 sequential SQL migration files that transform the ZRA TaxGuard database from isolated schemas into a fully integrated system with cross-schema relationships and analytics views.

### **Migration Sequence:**
1. **001_core_schema.sql** - Create core shared entities
2. **002_update_ocr_schema.sql** - Integrate OCR with core entities  
3. **003_update_whistlepro_schema.sql** - Integrate WhistlePro with core entities
4. **004_integration_views.sql** - Create cross-schema analytics views

---

## 🚀 Quick Start

### **Automated Execution:**
```bash
# Run all migrations in sequence
./run_migrations.sh
```

### **Manual Execution:**
```bash
# Execute migrations one by one
psql zra_taxguard < 001_core_schema.sql
psql zra_taxguard < 002_update_ocr_schema.sql  
psql zra_taxguard < 003_update_whistlepro_schema.sql
psql zra_taxguard < 004_integration_views.sql
```

---

## 📊 Migration Details

### **Migration 001: Core Schema**
**Purpose:** Create shared entities for system-wide integration

**Creates:**
- `core.companies` - Central company registry with TPIN
- `core.taxpayers` - Individual taxpayer registry with NRC
- `core.system_audit` - System-wide audit trail

**Key Features:**
- TPIN and NRC unique constraints
- Flexible JSONB metadata fields
- Automatic timestamp triggers
- Performance indexes

### **Migration 002: OCR Schema Updates**
**Purpose:** Integrate existing OCR documents with core entities

**Adds to `ocr.documents`:**
- `company_id` - Foreign key to core.companies
- `taxpayer_id` - Foreign key to core.taxpayers  
- `updated_at` - Automatic timestamp tracking

**Key Features:**
- Automatic linking based on metadata TPIN/NRC
- Performance indexes for JOINs
- Audit trail integration
- Data migration functions

### **Migration 003: WhistlePro Schema Updates**
**Purpose:** Integrate WhistlePro reporting system with core entities

**Updates:**
- `whistlepro.reports` - Add company/taxpayer links, case management
- `whistlepro.investigators` - Add performance tracking
- `whistlepro.audit_logs` - Add cross-schema relationships

**Key Features:**
- Case assignment and resolution tracking
- Investigator performance metrics
- Cross-schema audit trails
- Workload management views

### **Migration 004: Integration Views**
**Purpose:** Create analytics views for cross-schema reporting

**Creates:**
- `core.high_risk_companies` - Risk-based company analysis
- `core.active_investigations` - Current investigation dashboard
- `core.company_risk_dashboard` - Comprehensive company overview

**Key Features:**
- Risk scoring algorithms
- Priority calculations
- Compliance metrics
- Real-time analytics

---

## 🔍 Verification Tests

After migration completion, verify with these queries:

### **Test 1: Core Schema**
```sql
SELECT COUNT(*) FROM core.companies;
SELECT COUNT(*) FROM core.taxpayers;
SELECT COUNT(*) FROM core.system_audit;
```

### **Test 2: Foreign Key Relationships**
```sql
-- OCR-Company relationship
SELECT d.document_id, c.company_name, d.risk_score
FROM ocr.documents d
JOIN core.companies c ON c.id = d.company_id
LIMIT 5;

-- WhistlePro-Company relationship  
SELECT wr.case_id, c.company_name, wr.status
FROM whistlepro.reports wr
JOIN core.companies c ON c.id = wr.company_id
LIMIT 5;
```

### **Test 3: Integration Views**
```sql
-- High risk companies
SELECT * FROM core.high_risk_companies LIMIT 5;

-- Active investigations
SELECT * FROM core.active_investigations LIMIT 5;

-- Company dashboard
SELECT * FROM core.company_risk_dashboard LIMIT 5;
```

### **Test 4: Cross-Schema Analytics**
```sql
-- Complete integration test
SELECT 
    c.company_name,
    COUNT(DISTINCT d.id) as documents,
    COUNT(DISTINCT wr.id) as reports,
    AVG(d.risk_score) as avg_risk
FROM core.companies c
LEFT JOIN ocr.documents d ON d.company_id = c.id
LEFT JOIN whistlepro.reports wr ON wr.company_id = c.id
GROUP BY c.company_name
ORDER BY avg_risk DESC NULLS LAST
LIMIT 10;
```

---

## 📈 Expected Results

### **After Migration 001:**
- ✅ Core schema created with 3 tables
- ✅ Shared entities ready for integration
- ✅ Audit trail system operational

### **After Migration 002:**
- ✅ OCR documents linked to companies/taxpayers
- ✅ Performance indexes created
- ✅ Automatic data linking based on metadata

### **After Migration 003:**
- ✅ WhistlePro integrated with core entities
- ✅ Case management enhanced
- ✅ Investigator performance tracking

### **After Migration 004:**
- ✅ Cross-schema analytics available
- ✅ Risk scoring operational
- ✅ Management dashboards ready

---

## 🛡️ Safety Features

### **Idempotent Operations:**
- All migrations use `IF NOT EXISTS` where appropriate
- Safe to run multiple times
- No data loss on re-execution

### **Error Handling:**
- Dependency verification before execution
- Rollback instructions in each file
- Comprehensive error messages

### **Data Preservation:**
- Existing data is preserved
- Only adds new columns/relationships
- No destructive operations

---

## 🔄 Rollback Instructions

Each migration file contains detailed rollback instructions in comments. To rollback:

### **Rollback Migration 004:**
```sql
DROP VIEW IF EXISTS core.high_risk_companies;
DROP VIEW IF EXISTS core.active_investigations;
DROP VIEW IF EXISTS core.company_risk_dashboard;
DROP FUNCTION IF EXISTS core.refresh_risk_statistics();
```

### **Rollback Migration 003:**
```sql
-- See 003_update_whistlepro_schema.sql for complete rollback
ALTER TABLE whistlepro.reports DROP COLUMN IF EXISTS company_id;
-- ... (full rollback in migration file)
```

### **Rollback Migration 002:**
```sql
-- See 002_update_ocr_schema.sql for complete rollback
ALTER TABLE ocr.documents DROP COLUMN IF EXISTS company_id;
-- ... (full rollback in migration file)
```

### **Rollback Migration 001:**
```sql
-- WARNING: This breaks all foreign key relationships
DROP SCHEMA IF EXISTS core CASCADE;
```

---

## 📊 Performance Considerations

### **Indexes Created:**
- **Primary Keys:** Automatic B-tree indexes
- **Foreign Keys:** Explicit indexes for JOIN performance
- **Risk Queries:** Partial indexes for high-risk filtering
- **JSONB Fields:** GIN indexes for metadata searches
- **Composite:** Multi-column indexes for common query patterns

### **Query Optimization:**
- Views use efficient subqueries
- Proper JOIN order for performance
- Filtered indexes where appropriate
- Statistics functions for dashboard optimization

---

## 🎯 Success Criteria

After successful migration:

✅ **Schema Integration:** All schemas connected via foreign keys  
✅ **Data Integrity:** No data loss, all relationships valid  
✅ **Performance:** Queries execute efficiently with proper indexes  
✅ **Analytics:** Cross-schema views provide business insights  
✅ **Audit Trail:** Complete system activity tracking  
✅ **Scalability:** Ready for additional module integration  

---

## 📞 Support

For migration issues:

1. **Check Logs:** Review PostgreSQL logs for detailed errors
2. **Verify Dependencies:** Ensure all prerequisite tables exist
3. **Test Queries:** Run verification tests to identify issues
4. **Rollback:** Use rollback instructions if needed
5. **Re-run:** Migrations are idempotent and safe to retry

---

**Migration Status: Production Ready** 🚀  
**Database Version:** PostgreSQL 12+  
**Compatibility:** All ZRA TaxGuard AI modules
