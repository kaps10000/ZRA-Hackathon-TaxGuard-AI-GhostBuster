# 🗄️ Database Migration Guide - Security Tables

## 📋 Quick Start

### Step 1: Ensure Database is Running

```bash
# If using Docker Compose
cd /home/kaps100/ZRA-Hackathon-TaxGuard-AI-GhostBuster
docker-compose up -d postgres

# Wait a few seconds for PostgreSQL to initialize
sleep 5

# Verify it's running
docker ps | grep postgres
```

### Step 2: Run the Migration

**Option A: Docker (Recommended)**
```bash
cd ocr-backend/database
./migrate-docker.sh
```

**Option B: Direct PostgreSQL**
```bash
cd ocr-backend/database
./run-migrations.sh
```

**Option C: Manual SQL**
```bash
cd ocr-backend/database
psql -h localhost -p 5432 -U postgres -d zra_taxguard -f migrations/001_create_security_tables.sql
```

### Step 3: Verify Tables Created

```bash
# Using Docker
docker exec zra-postgres psql -U postgres -d zra_taxguard -c "
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'ocr' AND table_name IN
('document_security', 'security_audit_log', 'anomaly_detection');"

# Or using psql directly
psql -h localhost -U postgres -d zra_taxguard -c "
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'ocr' AND table_name IN
('document_security', 'security_audit_log', 'anomaly_detection');"
```

Expected output:
```
     table_name
---------------------
 anomaly_detection
 document_security
 security_audit_log
(3 rows)
```

## ✅ What Gets Created

### 3 New Tables

1. **`ocr.document_security`** (56 columns)
   - Primary security scan results table
   - Stores hashes, security features, scores, blockchain proof
   - Links to `ocr.documents(document_id)`

2. **`ocr.security_audit_log`** (11 columns)
   - Complete audit trail for all security events
   - Tracks officer actions, IP addresses, timestamps

3. **`ocr.anomaly_detection`** (13 columns)
   - Stores detected anomalies
   - Allows officer resolution and false positive marking

### 18 Indexes Created

- 7 indexes on `document_security`
- 5 indexes on `security_audit_log`
- 6 indexes on `anomaly_detection`

### 1 Trigger Function

- `update_updated_at_column()` - Auto-updates `updated_at` timestamp

## 🔍 Verification Queries

After migration, run these to verify everything is set up correctly:

```sql
-- 1. Check all tables exist
SELECT table_name,
       (SELECT COUNT(*) FROM information_schema.columns
        WHERE table_schema = 'ocr' AND table_name = t.table_name) as column_count
FROM information_schema.tables t
WHERE table_schema = 'ocr'
AND table_name IN ('document_security', 'security_audit_log', 'anomaly_detection')
ORDER BY table_name;

-- 2. Check indexes
SELECT tablename, COUNT(*) as index_count
FROM pg_indexes
WHERE schemaname = 'ocr'
AND tablename IN ('document_security', 'security_audit_log', 'anomaly_detection')
GROUP BY tablename
ORDER BY tablename;

-- 3. Check foreign keys
SELECT
    tc.constraint_name,
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_schema = 'ocr'
  AND tc.table_name = 'document_security';

-- 4. Test insert (will fail if tables not ready)
-- INSERT INTO ocr.document_security (document_id, file_hash_sha256, file_hash_sha512, original_hash)
-- VALUES ('TEST-001', 'abc123...', 'def456...', 'ghi789...');
-- (Don't run unless you have a valid document_id in ocr.documents)
```

## 🐛 Common Issues

### Issue 1: "relation ocr.documents does not exist"

**Cause**: The `ocr.documents` table hasn't been created yet.

**Solution**: Create the parent table first or remove the foreign key constraint temporarily:

```sql
-- Option A: Create ocr.documents table first
CREATE TABLE IF NOT EXISTS ocr.documents (
    document_id VARCHAR(100) PRIMARY KEY,
    filename VARCHAR(255),
    uploaded_at TIMESTAMP DEFAULT NOW()
);

-- Option B: Modify migration to make FK nullable
-- Edit migrations/001_create_security_tables.sql
-- Change line: document_id VARCHAR(100) NOT NULL REFERENCES ocr.documents(document_id)
-- To: document_id VARCHAR(100) NOT NULL
```

### Issue 2: "permission denied for schema ocr"

**Cause**: PostgreSQL user lacks permissions.

**Solution**:
```sql
GRANT ALL PRIVILEGES ON SCHEMA ocr TO postgres;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA ocr TO postgres;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA ocr TO postgres;
```

### Issue 3: Docker container not running

**Cause**: PostgreSQL container isn't started.

**Solution**:
```bash
cd /home/kaps100/ZRA-Hackathon-TaxGuard-AI-GhostBuster
docker-compose up -d postgres

# Wait for initialization
sleep 10

# Check logs
docker logs zra-postgres
```

### Issue 4: "relation already exists"

**Cause**: Tables were already created in a previous run.

**Solution**: Migration is idempotent (safe to re-run). The `IF NOT EXISTS` clause prevents errors. If you want to start fresh:

```sql
-- WARNING: Destroys all security data!
DROP TABLE IF EXISTS ocr.anomaly_detection CASCADE;
DROP TABLE IF EXISTS ocr.security_audit_log CASCADE;
DROP TABLE IF EXISTS ocr.document_security CASCADE;
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;
```

## 📊 Migration File Details

**Location**: `ocr-backend/database/migrations/001_create_security_tables.sql`
**Size**: ~9.3 KB
**Lines**: ~270 lines of SQL

**Sections**:
1. Schema creation
2. Table: document_security (with 7 indexes)
3. Table: security_audit_log (with 5 indexes)
4. Table: anomaly_detection (with 6 indexes)
5. Table comments (documentation)
6. Trigger function for auto-updating timestamps
7. Optional permission grants (commented out)

## 🔄 Next Steps After Migration

1. **Update Application Configuration**

```javascript
// In ocr-backend/server.js or app.js
const { sequelize } = require('./models/DocumentSecurity');

// Test database connection
sequelize.authenticate()
  .then(() => console.log('✅ Security tables connected'))
  .catch(err => console.error('❌ Database error:', err));
```

2. **Replace TODO Comments in Routes**

Edit `ocr-backend/routes/security.js` and replace all `// TODO: Fetch from database` comments with actual Sequelize queries:

```javascript
// Before:
// TODO: Fetch document from database
const mockFilePath = `/uploads/${documentId}.pdf`;

// After:
const DocumentSecurity = require('../models/DocumentSecurity');
const document = await DocumentSecurity.findOne({ where: { documentId } });
const filePath = document.filePath;
```

3. **Test Security Scanner**

```bash
cd ocr-backend
node -e "
const SecurityScanner = require('./services/securityScanner');
const scanner = new SecurityScanner();
scanner.performComprehensiveScan('/path/to/test.pdf', { documentId: 'TEST-001' })
  .then(result => console.log('Security Score:', result.securityScore))
  .catch(err => console.error(err));
"
```

4. **Test API Endpoints**

```bash
# Start the OCR backend
cd ocr-backend
npm start

# In another terminal, test the health endpoint
curl http://localhost:5000/api/security/health

# Test security scan (requires authentication)
curl -X POST http://localhost:5000/api/security/scan/DOC-123-ABC456 \
  -H "Authorization: Bearer test_token" \
  -H "x-officer-id: OFF-001"
```

## 📚 Related Documentation

- **Security Architecture**: `ocr-backend/SECURITY_FEATURES_ARCHITECTURE.md`
- **Implementation Summary**: `SECURITY_IMPLEMENTATION_SUMMARY.md`
- **Database README**: `ocr-backend/database/README.md`
- **Docker Compose**: `docker-compose.yml`

## 🔒 Security Notes

- **Passwords**: Never commit database passwords to Git
- **Environment Variables**: Use `.env` file for sensitive configuration
- **Backups**: Always backup before running migrations in production
- **Testing**: Test migrations on development environment first

## 📞 Support

If migration fails or you encounter issues:

1. Check PostgreSQL logs: `docker logs zra-postgres`
2. Verify database exists: `docker exec zra-postgres psql -U postgres -l`
3. Check network connectivity: `docker network inspect zra_network`
4. Review migration script: `cat database/migrations/001_create_security_tables.sql`

---

**Migration Status**: ✅ Ready to Run
**Database**: zra_taxguard
**Schema**: ocr
**Tables**: 3 (document_security, security_audit_log, anomaly_detection)
**Indexes**: 18
**Estimated Time**: < 5 seconds

**Built for ZRA Hackathon 2025**
