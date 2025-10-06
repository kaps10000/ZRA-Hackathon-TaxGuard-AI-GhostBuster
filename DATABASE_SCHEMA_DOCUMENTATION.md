# 🗄️ ZRA TaxGuard Database Schema Documentation

**Database:** PostgreSQL  
**Architecture:** Shared Database with Schema-Based Modules  
**Branch:** main  
**Last Updated:** October 6, 2025

---

## 🏗️ Database Architecture Overview

### **Single Database Design**
```
zra_taxguard (PostgreSQL Database)
├── ocr             # OCR document processing
├── ghostbuster     # Ghost employee detection  
├── risk            # Risk scoring & analytics
├── compliance      # Tax compliance checks
├── audit           # Audit trails & logs
├── whistlepro      # Whistleblower reports
└── blockchain      # Blockchain integration
```

### **Why Shared Database?**
- ✅ **Transaction Consistency** - Atomic operations across modules
- ✅ **Data Integration** - Direct JOINs between modules without API calls
- ✅ **Performance** - No network overhead for cross-module queries
- ✅ **Simpler Deployment** - One PostgreSQL instance, one backup strategy

---

## 📋 Current Schema: OCR Module

### **Table: `ocr.documents`**

```sql
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
```

### **Indexes**
```sql
-- Performance indexes
CREATE INDEX idx_documents_document_id ON ocr.documents(document_id);
CREATE INDEX idx_documents_file_hash ON ocr.documents(file_hash);
CREATE INDEX idx_documents_status_uploaded ON ocr.documents(status, uploaded_at DESC);
CREATE INDEX idx_documents_verification_status ON ocr.documents(verification_status);
CREATE INDEX idx_documents_blockchain_tx ON ocr.documents(blockchain_tx_id);

-- JSONB indexes for metadata searches
CREATE INDEX idx_documents_metadata_gin ON ocr.documents USING gin(metadata jsonb_path_ops);
CREATE INDEX idx_documents_ocr_data_gin ON ocr.documents USING gin(ocr_data jsonb_path_ops);
```

---

## 📊 Field Descriptions

### **Document Identification**
| Field | Type | Description |
|-------|------|-------------|
| `id` | SERIAL | Auto-incrementing primary key |
| `document_id` | VARCHAR(100) | Unique business identifier (e.g., "DOC-20251006-001") |

### **File Information**
| Field | Type | Description |
|-------|------|-------------|
| `filename` | VARCHAR(255) | Stored filename |
| `original_name` | VARCHAR(255) | Original uploaded filename |
| `file_path` | VARCHAR(500) | Full path to stored file |
| `file_size` | BIGINT | File size in bytes |
| `mime_type` | VARCHAR(100) | MIME type (e.g., "application/pdf") |
| `file_hash` | VARCHAR(64) | SHA-256 hash for integrity |

### **Processing Status**
| Field | Type | Values | Description |
|-------|------|--------|-------------|
| `status` | ENUM | PENDING, PROCESSING, VERIFIED, FLAGGED, ERROR | Current processing status |
| `uploaded_by` | VARCHAR(100) | User identifier or 'anonymous' |
| `uploaded_at` | TIMESTAMP | When document was uploaded |

### **JSONB Fields (Flexible Data)**

#### **`metadata` JSONB**
```json
{
  "importerName": "ABC Corporation",
  "importerTpin": "1234567890",
  "declarationNumber": "DEC-2025-001",
  "customsOffice": "Lusaka",
  "uploadSource": "web_portal",
  "userAgent": "Mozilla/5.0...",
  "ipAddress": "192.168.1.100"
}
```

#### **`ocr_data` JSONB**
```json
{
  "extractedText": "INVOICE\nCompany: ABC Corp\nAmount: K50,000",
  "confidence": 0.95,
  "fields": {
    "invoiceNumber": "INV-001",
    "amount": 50000,
    "currency": "ZMW",
    "companyName": "ABC Corp"
  },
  "processingTime": 1500,
  "ocrEngine": "tesseract"
}
```

#### **`ai_metadata` JSONB**
```json
{
  "model": "tesseract-v5",
  "confidence": 0.95,
  "processingTime": 1200,
  "extractionMethod": "ocr",
  "languageDetected": "en",
  "qualityScore": 0.88
}
```

#### **`verification_result` JSONB**
```json
{
  "companyVerification": {
    "tpinValid": true,
    "companyExists": true,
    "status": "ACTIVE"
  },
  "hsCodeVerification": {
    "codeValid": true,
    "description": "Motor vehicles",
    "dutyRate": 25.0
  },
  "documentVerification": {
    "formatValid": true,
    "signatureValid": false,
    "dateValid": true
  }
}
```

#### **`risk_flags` JSONB Array**
```json
[
  {
    "type": "amount_mismatch",
    "severity": "medium",
    "message": "Declared amount differs from invoice by 15%",
    "timestamp": "2025-10-06T15:30:00Z"
  },
  {
    "type": "company_blacklist",
    "severity": "high", 
    "message": "Company found in suspicious entities list",
    "timestamp": "2025-10-06T15:31:00Z"
  }
]
```

#### **`processing_steps` JSONB Array**
```json
[
  {
    "step": "upload",
    "status": "completed",
    "timestamp": "2025-10-06T15:30:00Z",
    "result": {"fileSize": 1024000}
  },
  {
    "step": "ocr_processing",
    "status": "completed", 
    "timestamp": "2025-10-06T15:30:15Z",
    "result": {"confidence": 0.95}
  },
  {
    "step": "verification",
    "status": "completed",
    "timestamp": "2025-10-06T15:30:30Z",
    "result": {"riskScore": 25, "status": "VALID"}
  }
]
```

---

## 🔍 Common Queries

### **Find Documents by Status**
```sql
SELECT document_id, filename, status, uploaded_at 
FROM ocr.documents 
WHERE status = 'PENDING' 
ORDER BY uploaded_at ASC;
```

### **Search by Company Name**
```sql
SELECT document_id, metadata->>'importerName' as company
FROM ocr.documents 
WHERE metadata->>'importerName' ILIKE '%ABC Corp%';
```

### **High Risk Documents**
```sql
SELECT document_id, risk_score, verification_status
FROM ocr.documents 
WHERE risk_score > 75 
ORDER BY risk_score DESC;
```

### **Documents with Specific Risk Flags**
```sql
SELECT document_id, risk_flags
FROM ocr.documents 
WHERE risk_flags @> '[{"type": "amount_mismatch"}]';
```

### **Processing Statistics**
```sql
SELECT 
  status,
  COUNT(*) as count,
  AVG(risk_score) as avg_risk_score
FROM ocr.documents 
GROUP BY status;
```

### **Recent Blockchain Transactions**
```sql
SELECT document_id, blockchain_tx_id, block_number, verified_at
FROM ocr.documents 
WHERE blockchain_tx_id IS NOT NULL 
ORDER BY verified_at DESC 
LIMIT 10;
```

---

## 🚀 Future Schema Expansion

### **Planned Schemas (Other Modules)**

#### **`ghostbuster.employees`**
```sql
CREATE TABLE ghostbuster.employees (
    id SERIAL PRIMARY KEY,
    employee_id VARCHAR(50) UNIQUE,
    tpin VARCHAR(20),
    full_name VARCHAR(255),
    nrc_number VARCHAR(20),
    status VARCHAR(20),
    risk_score DECIMAL(5,2),
    verification_status VARCHAR(20),
    created_at TIMESTAMP DEFAULT NOW()
);
```

#### **`risk.scores`**
```sql
CREATE TABLE risk.scores (
    id SERIAL PRIMARY KEY,
    entity_type VARCHAR(50), -- 'document', 'company', 'employee'
    entity_id VARCHAR(100),
    risk_score DECIMAL(5,2),
    risk_factors JSONB,
    calculated_at TIMESTAMP DEFAULT NOW()
);
```

#### **`compliance.violations`**
```sql
CREATE TABLE compliance.violations (
    id SERIAL PRIMARY KEY,
    violation_type VARCHAR(100),
    entity_type VARCHAR(50),
    entity_id VARCHAR(100),
    severity VARCHAR(20),
    description TEXT,
    detected_at TIMESTAMP DEFAULT NOW()
);
```

### **Cross-Schema Queries (Future)**
```sql
-- Find high-risk documents with employee anomalies
SELECT 
    d.document_id,
    d.risk_score as doc_risk,
    e.risk_score as employee_risk,
    d.metadata->>'importerName' as company
FROM ocr.documents d
JOIN ghostbuster.employees e ON e.tpin = d.metadata->>'importerTpin'
WHERE d.risk_score > 75 AND e.risk_score > 80;
```

---

## ⚙️ Database Setup Instructions

### **1. Install PostgreSQL**
```bash
# Ubuntu/Debian
sudo apt-get install postgresql postgresql-contrib

# Start service
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

### **2. Create Database & User**
```bash
sudo -u postgres psql

CREATE DATABASE zra_taxguard;
CREATE USER zra_user WITH PASSWORD 'secure_password';
GRANT ALL PRIVILEGES ON DATABASE zra_taxguard TO zra_user;
\q
```

### **3. Run Setup Script**
```bash
cd ocr-backend
./scripts/setup-postgres.sh
```

### **4. Initialize Database**
```bash
node config/init-database.js
```

---

## 🔧 Environment Configuration

### **`.env` File**
```env
# PostgreSQL Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=zra_taxguard
DB_USER=postgres
DB_PASSWORD=postgres

# Connection Pool
DB_POOL_MAX=10
DB_POOL_MIN=2
DB_TIMEOUT=30000
```

---

## 📈 Performance Considerations

### **Indexing Strategy**
- ✅ **Primary Keys** - Automatic B-tree indexes
- ✅ **Status Fields** - For filtering queries
- ✅ **JSONB Fields** - GIN indexes for metadata searches
- ✅ **Composite Indexes** - For common query patterns

### **Query Optimization**
- Use `EXPLAIN ANALYZE` to check query performance
- JSONB queries with `@>`, `?`, `?&` operators are optimized
- Avoid `SELECT *` in production queries
- Use pagination for large result sets

### **Monitoring**
```sql
-- Check table sizes
SELECT schemaname, tablename, pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
FROM pg_tables 
WHERE schemaname = 'ocr';

-- Check index usage
SELECT schemaname, tablename, indexname, idx_scan, idx_tup_read, idx_tup_fetch
FROM pg_stat_user_indexes 
WHERE schemaname = 'ocr';
```

---

## 🛠️ Model Usage (Sequelize)

### **Basic Operations**
```javascript
const getDocumentModel = require('./models/DocumentSequelize');
const Document = getDocumentModel();

// Create
const doc = await Document.create({
  documentId: 'DOC-' + Date.now(),
  filename: 'invoice.pdf',
  originalName: 'invoice.pdf',
  filePath: '/uploads/invoice.pdf',
  fileSize: 1024000,
  mimeType: 'application/pdf',
  fileHash: 'abc123...',
  metadata: {
    importerName: 'ABC Corp',
    importerTpin: '1234567890'
  }
});

// Find
const doc = await Document.findByDocumentId('DOC-123');

// Update
await doc.update({
  status: 'VERIFIED',
  riskScore: 25,
  verificationStatus: 'VALID'
});

// Custom methods
doc.markAsProcessing();
doc.addProcessingStep('ocr', 'completed', {confidence: 0.95});
doc.markAsVerified(ocrData, 25, 'VALID');
await doc.save();
```

---

## ✅ Summary

**Current Status:**
- ✅ **PostgreSQL Database** - Fully configured and operational
- ✅ **OCR Schema** - Complete with all tables and indexes
- ✅ **Sequelize Models** - Full ORM integration with custom methods
- ✅ **JSONB Support** - Flexible metadata and processing data
- ✅ **Performance Optimized** - Proper indexing strategy
- ✅ **Future Ready** - Schema structure for all modules

**Next Steps for Team:**
1. **Review Schema** - Understand the table structure and JSONB fields
2. **Test Queries** - Run sample queries to understand data access patterns
3. **Add Module Schemas** - Extend with ghostbuster, risk, compliance schemas
4. **Cross-Schema Integration** - Implement JOINs between modules

**Database is ready for production use!** 🚀
