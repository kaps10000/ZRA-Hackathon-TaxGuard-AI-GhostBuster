# 🔐 Security Tables Database Migration

This directory contains database migration scripts for the ZRA TaxGuard OCR security features.

## 📋 Overview

**Migration**: `001_create_security_tables.sql`
**Database**: `zra_taxguard`
**Schema**: `ocr`
**Tables Created**: 3

### Tables

1. **`ocr.document_security`** - Comprehensive security scan results
   - 50+ columns covering all security features
   - Stores hashes, physical features, digital features, metadata, scores
   - Links to `ocr.documents` via `document_id` foreign key

2. **`ocr.security_audit_log`** - Complete audit trail
   - Tracks all security events (scans, verifications, flags)
   - Records officer actions with IP and timestamp
   - Supports compliance and forensic analysis

3. **`ocr.anomaly_detection`** - Detected anomalies and suspicious patterns
   - Stores AI and rule-based anomaly detections
   - Allows officers to resolve or mark as false positive
   - Tracks severity and resolution status

## 🚀 Quick Start

### Option 1: Docker Compose (Recommended)

If using Docker Compose setup:

```bash
cd /home/kaps100/ZRA-Hackathon-TaxGuard-AI-GhostBuster/ocr-backend/database

# Ensure PostgreSQL container is running
docker-compose up -d postgres

# Run migration
./migrate-docker.sh
```

### Option 2: Direct PostgreSQL Connection

If connecting directly to PostgreSQL:

```bash
cd /home/kaps100/ZRA-Hackathon-TaxGuard-AI-GhostBuster/ocr-backend/database

# Run migration script
./run-migrations.sh

# Or manually with psql
psql -h localhost -p 5432 -U postgres -d zra_taxguard -f migrations/001_create_security_tables.sql
```

### Option 3: Manual SQL Execution

```bash
# Copy SQL and execute in your PostgreSQL client
cat migrations/001_create_security_tables.sql
```

## 🔧 Configuration

The `run-migrations.sh` script uses these environment variables (with defaults):

```bash
DB_HOST=localhost
DB_PORT=5432
DB_NAME=zra_taxguard
DB_USER=postgres
DB_PASSWORD=zrapass
```

Override as needed:

```bash
DB_HOST=192.168.1.100 DB_PASSWORD=mypass ./run-migrations.sh
```

## ✅ Verification

After running the migration, verify tables were created:

```sql
-- Check tables exist
SELECT table_name, table_schema
FROM information_schema.tables
WHERE table_schema = 'ocr'
AND table_name IN ('document_security', 'security_audit_log', 'anomaly_detection');

-- Check row counts (should be 0 initially)
SELECT 'document_security' as table, COUNT(*) FROM ocr.document_security
UNION ALL
SELECT 'security_audit_log', COUNT(*) FROM ocr.security_audit_log
UNION ALL
SELECT 'anomaly_detection', COUNT(*) FROM ocr.anomaly_detection;

-- Check indexes
SELECT tablename, indexname
FROM pg_indexes
WHERE schemaname = 'ocr'
AND tablename IN ('document_security', 'security_audit_log', 'anomaly_detection')
ORDER BY tablename, indexname;
```

## 📊 Schema Details

### ocr.document_security

**Primary Key**: `id` (SERIAL)
**Foreign Key**: `document_id` → `ocr.documents(document_id)`
**Columns**: 56 columns
**Indexes**: 7 indexes

**Column Categories**:
- File Integrity (5 cols): SHA-256, SHA-512, verification status
- Physical Features (15 cols): Watermark, hologram, microprinting, thread, UV
- Digital Features (12 cols): QR code, barcode, signature, serial number
- Metadata Security (6 cols): EXIF data, anomalies, tampering flags
- Security Assessment (4 cols): Score, status, flags, breakdown
- Blockchain (3 cols): TX ID, timestamp, proof
- Officer Verification (3 cols): Verified by, timestamp, notes
- Audit (2 cols): created_at, updated_at

### ocr.security_audit_log

**Primary Key**: `id` (SERIAL)
**Columns**: 11 columns
**Indexes**: 5 indexes

Tracks events like:
- `SCAN` - Security scan performed
- `VERIFY` - Officer verification
- `FLAG` - Document flagged as suspicious
- `APPROVE` - Document approved
- `REJECT` - Document rejected
- `RESOLVE_ANOMALY` - Anomaly resolved

### ocr.anomaly_detection

**Primary Key**: `id` (SERIAL)
**Columns**: 13 columns
**Indexes**: 6 indexes

Anomaly types:
- `METADATA` - EXIF or metadata anomalies
- `FORMAT` - File format issues
- `CONTENT` - Document content suspicious
- `BEHAVIOR` - Behavioral anomalies (rapid submissions, etc.)
- `EXIF` - EXIF-specific anomalies (future dates, editing software)

Severity levels:
- `LOW` - Minor issues
- `MEDIUM` - Moderate concern
- `HIGH` - Significant concern
- `CRITICAL` - Severe security issue

## 🔄 Rollback

To rollback the migration (remove tables):

```sql
-- WARNING: This will delete all security data!
DROP TABLE IF EXISTS ocr.anomaly_detection CASCADE;
DROP TABLE IF EXISTS ocr.security_audit_log CASCADE;
DROP TABLE IF EXISTS ocr.document_security CASCADE;

-- Drop the trigger function
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;
```

## 📝 Migration Log

| Version | Date | Description | Status |
|---------|------|-------------|--------|
| 001 | 2025-10-11 | Create security tables | ✅ Ready |

## 🔗 Related Files

- **Migration SQL**: `migrations/001_create_security_tables.sql`
- **Sequelize Model**: `../models/DocumentSecurity.js`
- **Security Scanner**: `../services/securityScanner.js`
- **API Routes**: `../routes/security.js`
- **Architecture Doc**: `../SECURITY_FEATURES_ARCHITECTURE.md`

## 🐛 Troubleshooting

### Error: "relation ocr.documents does not exist"

The migration requires the `ocr.documents` table to exist first. Create it before running this migration:

```sql
CREATE SCHEMA IF NOT EXISTS ocr;
CREATE TABLE IF NOT EXISTS ocr.documents (
    document_id VARCHAR(100) PRIMARY KEY,
    -- other columns...
);
```

### Error: "role does not exist"

Make sure the PostgreSQL user exists:

```sql
CREATE USER ocr_backend_user WITH PASSWORD 'yourpass';
GRANT ALL PRIVILEGES ON SCHEMA ocr TO ocr_backend_user;
```

### Error: "permission denied for schema ocr"

Grant schema permissions:

```sql
GRANT USAGE, CREATE ON SCHEMA ocr TO postgres;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA ocr TO postgres;
```

### Docker Container Not Found

If `migrate-docker.sh` fails with "container not found":

```bash
# Check container name
docker ps | grep postgres

# If different name, update the script or use:
docker exec -i <container_name> psql -U postgres -d zra_taxguard < migrations/001_create_security_tables.sql
```

## 📚 Next Steps

After running the migration:

1. **Test Database Connection**:
   ```bash
   cd /home/kaps100/ZRA-Hackathon-TaxGuard-AI-GhostBuster/ocr-backend
   node -e "require('./models/DocumentSecurity.js')"
   ```

2. **Update Routes with Database Queries**:
   - Edit `routes/security.js`
   - Replace `TODO` comments with actual database operations
   - Use `DocumentSecurity` model for CRUD operations

3. **Test Security Scanner**:
   ```bash
   # Upload a test document and trigger security scan
   curl -X POST http://localhost:5000/api/security/scan/DOC-123-ABC456 \
     -H "Authorization: Bearer test_token" \
     -H "x-officer-id: OFF-001"
   ```

4. **Verify Blockchain Integration**:
   - Check blockchain API is running on port 3001
   - Test end-to-end flow: upload → scan → blockchain → retrieve

## 📞 Support

For issues or questions:
- Check `../SECURITY_IMPLEMENTATION_COMPLETE.md`
- Review `../SECURITY_FEATURES_ARCHITECTURE.md`
- Examine Docker Compose configuration in `../../docker-compose.yml`

---

**Built for ZRA Hackathon 2025 - Securing Document Verification**
