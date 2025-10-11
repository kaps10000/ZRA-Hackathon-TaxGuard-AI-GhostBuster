# PostgreSQL Migration Guide - ZRA TaxGuard AI System

## Overview

The ZRA TaxGuard system now uses **PostgreSQL** as the primary database with a **shared database, schema-based architecture** for optimal data integration and transaction consistency across all modules.

## Architecture Design

### Single Database: `zra_taxguard`

**Module Schemas:**
- `ocr` - OCR document processing and verification
- `ghostbuster` - Ghost employee detection
- `risk` - Risk scoring and analytics
- `compliance` - Tax compliance checks
- `audit` - Audit trails and system logs
- `whistlepro` - Whistleblower reports
- `blockchain` - Blockchain integration data

### Why Shared Database?

1. **Data Interdependencies** - Modules heavily cross-reference data
2. **Transaction Consistency** - Atomic operations across modules
3. **Simpler Deployment** - One PostgreSQL instance vs 7 databases
4. **Better Performance** - JOINs across schemas vs external API calls
5. **Unified Reporting** - Dashboard aggregates from all modules

## Setup Instructions

### 1. Prerequisites

```bash
# Check PostgreSQL installation
psql --version  # Should show PostgreSQL 17.x

# Check if PostgreSQL is running
pg_isready
```

### 2. Database Setup

#### Option A: Automated Setup (Recommended)

```bash
cd ocr-backend
./scripts/setup-postgres.sh
```

This will:
- Create `zra_taxguard` database
- Create all 7 module schemas
- Initialize tables with Sequelize
- Create indexes

#### Option B: Manual Setup

```bash
# Create database
sudo -u postgres psql <<EOF
CREATE DATABASE zra_taxguard;
GRANT ALL PRIVILEGES ON DATABASE zra_taxguard TO postgres;
EOF

# Initialize schemas and tables
cd ocr-backend
node config/init-database.js
```

### 3. Environment Configuration

Update `.env` file:

```env
# PostgreSQL Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=zra_taxguard
DB_USER=postgres
DB_PASSWORD=postgres

# Remove MongoDB config
# MONGODB_URI=...  (delete this line)
```

### 4. Start Application

```bash
npm start
```

## Database Schema Structure

### OCR Schema (`ocr.documents`)

```sql
CREATE TABLE ocr.documents (
    id SERIAL PRIMARY KEY,
    document_id VARCHAR(100) UNIQUE NOT NULL,
    filename VARCHAR(255) NOT NULL,
    original_name VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    file_size BIGINT NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    file_hash VARCHAR(64) NOT NULL,

    -- Status & Processing
    status VARCHAR(20) DEFAULT 'PENDING',
    ocr_data JSONB,
    ai_metadata JSONB,

    -- Risk Assessment
    risk_score DECIMAL(5,2),
    verification_status VARCHAR(20),
    risk_flags JSONB DEFAULT '[]',
    verification_result JSONB,

    -- Blockchain
    blockchain_tx_id VARCHAR(100),
    block_number INTEGER,
    blockchain_proof JSONB,

    -- Audit
    processing_steps JSONB DEFAULT '[]',
    error_logs JSONB DEFAULT '[]',

    -- Timestamps
    uploaded_at TIMESTAMP DEFAULT NOW(),
    processed_at TIMESTAMP,
    verified_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_documents_status ON ocr.documents(status, uploaded_at DESC);
CREATE INDEX idx_documents_verification ON ocr.documents(verification_status);
CREATE INDEX idx_documents_metadata_gin ON ocr.documents USING gin(metadata jsonb_path_ops);
```

## Model Usage

### Sequelize Model (New)

```javascript
const getDocumentModel = require('./models/DocumentSequelize');
const Document = getDocumentModel();

// Create document
const doc = await Document.create({
    documentId: 'DOC-123',
    filename: 'invoice.pdf',
    status: 'PENDING'
});

// Find by documentId
const doc = await Document.findByDocumentId('DOC-123');

// Update
await doc.update({ status: 'VERIFIED', riskScore: 25 });

// Get statistics
const stats = await Document.getStatistics();
```

### Mongoose Model (Old - Deprecated)

```javascript
// ❌ Old way - No longer supported
const Document = require('./models/Document');
```

## Migration Checklist

### For Each Developer Branch

- [ ] Update `config/database.js` (PostgreSQL only)
- [ ] Replace Mongoose models with Sequelize models
- [ ] Update `.env` with PostgreSQL credentials
- [ ] Run database initialization: `node config/init-database.js`
- [ ] Update route handlers to use Sequelize syntax
- [ ] Test all CRUD operations
- [ ] Verify JOIN queries work across schemas

### Breaking Changes

1. **Model Import Changed:**
   ```javascript
   // Old
   const Document = require('./models/Document');

   // New
   const getDocumentModel = require('./models/DocumentSequelize');
   const Document = getDocumentModel();
   ```

2. **Query Syntax Changed:**
   ```javascript
   // Old (Mongoose)
   await Document.findOne({ documentId: 'DOC-123' });

   // New (Sequelize)
   await Document.findOne({ where: { documentId: 'DOC-123' } });
   ```

3. **Field Names Changed (snake_case):**
   - `documentId` → `document_id` (in DB, but model maps it)
   - `uploadedAt` → `uploaded_at`
   - `ocrData` → `ocr_data`

## OCR Development Branches Merge Plan

### Current OCR Branches:
- `OCR-dev-1` - Task 1: Upload & Storage
- `OCR-dev-2` - Task 2: AI Processing (Current)
- `OCR-dev-3` - Task 3: Verification Engine
- `OCR-dev-4` - Task 4: Integration Testing

### Merge Strategy:

```bash
# 1. Merge all OCR work to main
git checkout main
git merge OCR-dev-1
git merge OCR-dev-2
git merge OCR-dev-3
git merge OCR-dev-4

# 2. Apply PostgreSQL changes to main
cp ocr-backend/config/database.js main/
cp ocr-backend/models/DocumentSequelize.js main/
cp ocr-backend/.env.postgres main/.env

# 3. Push to origin
git push origin main
```

## Testing

### Test Database Connection

```bash
node -e "
const { connectDatabase } = require('./config/database');
connectDatabase().then(() => {
  console.log('✅ PostgreSQL connected!');
  process.exit(0);
}).catch(err => {
  console.error('❌ Connection failed:', err);
  process.exit(1);
});
"
```

### Test Model Operations

```bash
node -e "
const getDocumentModel = require('./models/DocumentSequelize');
const Document = getDocumentModel();

Document.create({
  documentId: 'TEST-' + Date.now(),
  filename: 'test.pdf',
  originalName: 'test.pdf',
  filePath: '/tmp/test.pdf',
  fileSize: 1024,
  mimeType: 'application/pdf',
  fileHash: 'abc123'
}).then(doc => {
  console.log('✅ Document created:', doc.documentId);
  process.exit(0);
});
"
```

## Troubleshooting

### Connection Refused

```bash
# Check PostgreSQL status
sudo systemctl status postgresql

# Start PostgreSQL
sudo systemctl start postgresql
```

### Database Does Not Exist

```bash
# Recreate database
./scripts/setup-postgres.sh
```

### Permission Denied

```bash
# Grant privileges
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE zra_taxguard TO postgres;"
```

### Schema Not Found

```bash
# Reinitialize schemas
node config/init-database.js
```

## Performance Optimization

### Recommended Indexes

```sql
-- OCR module
CREATE INDEX idx_documents_hash ON ocr.documents(file_hash);
CREATE INDEX idx_documents_blockchain ON ocr.documents(blockchain_tx_id) WHERE blockchain_tx_id IS NOT NULL;

-- GhostBuster module (future)
CREATE INDEX idx_employees_tpin ON ghostbuster.employees(tpin);
CREATE INDEX idx_anomalies_severity ON ghostbuster.anomalies(severity, detected_at DESC);

-- Risk module (future)
CREATE INDEX idx_risk_scores_company ON risk.scores(company_id, calculated_at DESC);
```

### Connection Pooling

Already configured in `config/database.js`:
```javascript
pool: {
  max: 10,     // Maximum connections
  min: 2,      // Minimum connections
  acquire: 30000,
  idle: 10000
}
```

## Next Steps

1. ✅ PostgreSQL database configured
2. ✅ OCR schema and models migrated
3. ⏳ Merge OCR-dev branches to main
4. ⏳ Update Kaps, Kelvin, Emmanuel branches
5. ⏳ Add GhostBuster schema and models
6. ⏳ Add Risk scoring schema
7. ⏳ Implement cross-schema JOINs

## Support

For issues:
1. Check logs: `tail -f logs/combined.log`
2. Verify PostgreSQL: `pg_isready && psql -l`
3. Test connection: `node config/init-database.js`

---

**Generated:** October 6, 2025
**Author:** Dev 2 - Backend Team
**ZRA TaxGuard AI - PostgreSQL Migration**
