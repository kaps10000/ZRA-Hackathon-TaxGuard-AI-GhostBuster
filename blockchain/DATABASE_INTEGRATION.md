# 🗄️ TaxGuard Blockchain - PostgreSQL Database Integration

## Overview

The TaxGuard blockchain has been integrated with **PostgreSQL** for persistent, production-ready storage. All blockchain data, events, and module-specific records are now stored in a relational database for scalability, reliability, and advanced querying capabilities.

---

## 🏗️ Architecture

### Previous Implementation (In-Memory)
- ❌ Data lost on server restart
- ❌ Limited to single-node deployment
- ❌ No persistent audit trails
- ❌ Manual data synchronization

### New Implementation (PostgreSQL)
- ✅ **Persistent storage** - Data survives restarts
- ✅ **ACID compliance** - Guaranteed data integrity
- ✅ **Scalable** - Supports large datasets
- ✅ **Relational queries** - Advanced analytics
- ✅ **Backup & recovery** - Production-ready
- ✅ **Multi-module support** - Integrated with all team modules

---

## 📊 Database Schema

### Core Tables

#### 1. **blocks**
Stores blockchain blocks with hash chain integrity
```sql
- id (Primary Key)
- block_index (Unique)
- timestamp
- previous_hash
- hash (Unique)
- data (JSONB)
```

#### 2. **events**
Stores all blockchain events from all modules
```sql
- id (Primary Key)
- event_id (Unique)
- event_type (filing, payment, auditFlag, compliance, etc.)
- timestamp
- anonymized_user_id
- hash_of_payload
- notes
- block_index (Foreign Key -> blocks)
- metadata (JSONB)
```

### Module-Specific Tables

#### 3. **ghostbuster_detections**
GhostBuster phantom employee/company detections
```sql
- detection_id (Unique)
- event_id (Foreign Key -> events)
- detection_type (phantom_employee, ghost_company)
- entity_id
- confidence_score (0-100)
- severity (LOW, MEDIUM, HIGH, CRITICAL)
- indicators (JSONB array)
- evidence_hash
- review_status
```

#### 4. **whistlepro_reports**
WhistlePro anonymous whistleblower reports
```sql
- report_id (Unique)
- case_code (Unique, for anonymous tracking)
- event_id (Foreign Key -> events)
- report_type (tax_evasion, fraud, corruption, etc.)
- severity
- description_encrypted
- evidence_hash
- review_status, priority
```

#### 5. **ai_risk_assessments**
AI-generated risk assessments
```sql
- assessment_id (Unique)
- event_id (Foreign Key -> events)
- taxpayer_id
- risk_score (0-100)
- risk_level (LOW, MEDIUM, HIGH, CRITICAL)
- model_version
- features, predictions (JSONB)
- data_hash
```

#### 6. **predictive_forecasts**
Predictive analytics forecasts
```sql
- forecast_id (Unique)
- event_id (Foreign Key -> events)
- forecast_type (revenue, compliance, etc.)
- prediction (JSONB)
- confidence (0-100)
- actual_outcome (JSONB, for verification)
- accuracy (calculated after verification)
```

#### 7. **case_updates**
Tracks updates to whistleblower cases
```sql
- report_id (Foreign Key -> whistlepro_reports)
- update_type
- public_update (visible to whistleblower)
- internal_notes (auditor only)
```

### Views for Analytics

- **blockchain_stats** - Overall blockchain statistics
- **event_type_stats** - Events grouped by type
- **module_activity** - Activity per module (24h, total)

---

## 🚀 Getting Started

### Prerequisites
1. **PostgreSQL 12+** installed and running
2. **Node.js 16+**
3. Database credentials configured

### 1. Install Dependencies
```bash
cd blockchain
npm install
```

This will install:
- `pg` - PostgreSQL client
- `dotenv` - Environment variables
- Other blockchain dependencies

### 2. Configure Database
Edit `blockchain/.env`:
```env
# PostgreSQL Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=zra_taxguard
DB_USER=postgres
DB_PASSWORD=postgres
```

### 3. Create Database
```bash
# Connect to PostgreSQL
psql -U postgres

# Create database
CREATE DATABASE zra_taxguard;

# Exit
\q
```

### 4. Run Migration
```bash
npm run db:migrate
```

This will:
- Create all tables (blocks, events, module tables)
- Create indexes for performance
- Create views for analytics
- Initialize genesis block

Expected output:
```
🚀 Starting database migration...
📄 Reading schema from: database/schema.sql
📊 Executing SQL migrations...
✅ Database migration completed successfully!
📦 Genesis block created. Total blocks: 1
🎉 Migration complete! Database is ready for use.
```

### 5. Test Integration
```bash
npm run db:test
```

This will run comprehensive tests:
- ✅ Blockchain initialization
- ✅ Event creation and retrieval
- ✅ GhostBuster detection storage
- ✅ WhistlePro report storage
- ✅ AI Risk assessment storage
- ✅ Predictive forecast storage
- ✅ Statistics and analytics
- ✅ Chain validation

### 6. Start Blockchain API
```bash
npm start
# or for development
npm run dev
```

---

## 🔧 Usage Examples

### Blockchain Operations

#### Create Event (with database persistence)
```javascript
const { blockchainDB } = require('./database/blockchain-db');

// Initialize
await blockchainDB.initialize();

// Create event
const event = await blockchainDB.createEvent(
    'evt-001',
    'filing',
    new Date().toISOString(),
    'taxpayer-123',
    'hash_abc123',
    'VAT return filed',
    { metadata: 'optional' }
);
```

#### Query Events
```javascript
// Get all events
const allEvents = await blockchainDB.queryAllEvents();

// Get specific event
const event = await blockchainDB.readEvent('evt-001');

// Get blockchain info
const info = await blockchainDB.getChainInfo();
console.log(`Total blocks: ${info.length}`);
console.log(`Total events: ${info.totalEvents}`);
console.log(`Chain valid: ${info.valid}`);
```

### GhostBuster Integration

```javascript
const { GhostBusterDB } = require('./database/models');

// Create detection
const detection = await GhostBusterDB.createDetection({
    detectionId: 'det-123',
    eventId: 'evt-001',
    detectionType: 'phantom_employee',
    entityId: 'TPN-12345',
    confidenceScore: 95,
    severity: 'HIGH',
    indicators: ['No biometric', 'Duplicate address'],
    evidenceHash: 'hash_xyz'
});

// Query detections
const highSeverity = await GhostBusterDB.getDetections({
    severity: 'HIGH',
    limit: 10
});
```

### WhistlePro Integration

```javascript
const { WhistleProDB } = require('./database/models');

// Create report
const report = await WhistleProDB.createReport({
    reportId: 'rep-123',
    caseCode: 'WP-2025-A3F7E9',
    eventId: 'evt-002',
    reportType: 'tax_evasion',
    severity: 'HIGH',
    evidenceHash: 'hash_abc',
    // ... other fields
});

// Track by case code (anonymous)
const status = await WhistleProDB.getReportByCaseCode('WP-2025-A3F7E9');

// Add update
await WhistleProDB.addCaseUpdate('rep-123', {
    updateType: 'progress',
    publicUpdate: 'Investigation opened',
    internalNotes: 'Cross-checking with GhostBuster',
    updatedBy: 'investigator-456'
});
```

### AI Risk Integration

```javascript
const { AIRiskDB } = require('./database/models');

// Create assessment
const assessment = await AIRiskDB.createAssessment({
    assessmentId: 'assess-123',
    eventId: 'evt-003',
    taxpayerId: 'TPN-67890',
    riskScore: 87,
    riskLevel: 'HIGH',
    modelVersion: 'v2.5.1',
    features: { filing_consistency: 0.45 },
    predictions: { evasion_probability: 0.87 },
    confidence: 92,
    dataHash: 'hash_def'
});

// Get taxpayer history
const history = await AIRiskDB.getTaxpayerRiskHistory('TPN-67890');
```

### Predictive Analytics Integration

```javascript
const { PredictiveDB } = require('./database/models');

// Create forecast
const forecast = await PredictiveDB.createForecast({
    forecastId: 'for-123',
    eventId: 'evt-004',
    forecastType: 'revenue',
    prediction: { value: 45000000, unit: 'ZMW' },
    confidence: 85,
    // ... other fields
});

// Verify with actual outcome
await PredictiveDB.verifyForecast('for-123', {
    value: 46500000,
    unit: 'ZMW'
}, 'finance-dept');
// Automatically calculates accuracy
```

### Statistics & Analytics

```javascript
const { StatsDB } = require('./database/models');

// Get blockchain stats
const stats = await StatsDB.getBlockchainStats();
console.log(`Total events: ${stats.total_events}`);
console.log(`Events (24h): ${stats.events_last_24h}`);
console.log(`Detections: ${stats.total_detections}`);

// Get module activity
const activity = await StatsDB.getModuleActivity();
activity.forEach(mod => {
    console.log(`${mod.module}: ${mod.total} total, ${mod.last_24h} in 24h`);
});
```

---

## 📈 Performance Optimizations

### Indexes Created
- Block hash, block index
- Event ID, type, user, timestamp
- Detection entity, type, severity
- Report case code, type, severity
- Assessment taxpayer, risk level, score
- Forecast type, entity

### Connection Pooling
- Max 20 connections
- Idle timeout: 30s
- Connection timeout: 2s

### Query Optimization
- JSONB for flexible metadata
- Views for common aggregations
- Prepared statements in models
- Transaction support for atomicity

---

## 🔐 Security Features

1. **Data Integrity**
   - Foreign key constraints
   - Unique constraints on IDs
   - Hash validation on blockchain

2. **Encryption**
   - Sensitive data encrypted before storage
   - Environment variables for credentials
   - SSL support for connections

3. **Audit Trail**
   - All changes timestamped
   - Immutable blockchain records
   - Complete event history

---

## 🛠️ Maintenance

### Backup Database
```bash
pg_dump -U postgres zra_taxguard > backup.sql
```

### Restore Database
```bash
psql -U postgres zra_taxguard < backup.sql
```

### View Database Stats
```sql
-- Connect to database
psql -U postgres -d zra_taxguard

-- Check table sizes
SELECT
    table_name,
    pg_size_pretty(pg_total_relation_size(quote_ident(table_name))) as size
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY pg_total_relation_size(quote_ident(table_name)) DESC;

-- Check blockchain stats
SELECT * FROM blockchain_stats;

-- Check module activity
SELECT * FROM module_activity;
```

---

## 🐛 Troubleshooting

### Connection Errors
```
Error: connect ECONNREFUSED
```
**Solution:** Ensure PostgreSQL is running
```bash
# Start PostgreSQL (Ubuntu/Debian)
sudo service postgresql start

# Check status
sudo service postgresql status
```

### Authentication Failed
```
Error: password authentication failed
```
**Solution:** Update `.env` with correct credentials or reset PostgreSQL password

### Migration Fails
```
Error: relation already exists
```
**Solution:** Database already migrated. To reset:
```bash
# Drop and recreate database
psql -U postgres -c "DROP DATABASE zra_taxguard;"
psql -U postgres -c "CREATE DATABASE zra_taxguard;"

# Run migration again
npm run db:migrate
```

---

## 📚 API Endpoints (Updated)

All existing blockchain API endpoints now use PostgreSQL:

- `POST /api/events` - Create event (persisted to DB)
- `GET /api/events` - Get all events (from DB)
- `GET /api/events/:id` - Get event by ID (from DB)
- `GET /api/blockchain` - Get full chain (from DB)
- `GET /health` - Health check (includes DB status)

Module integration endpoints also use the database:
- GhostBuster: `/api/ghostbuster/*`
- WhistlePro: `/api/whistlepro/*`
- AI Risk: `/api/ai-risk/*`
- Predictive: `/api/predictive/*`
- Dashboard: `/api/dashboard-feed/*`

---

## 🎯 Migration Checklist

- [x] PostgreSQL schema designed
- [x] Database models created
- [x] Connection pooling configured
- [x] Migration script created
- [x] Database-integrated blockchain class
- [x] All module tables created
- [x] Indexes and views created
- [x] Test script created
- [x] Documentation completed

---

## 🚀 Production Deployment

### Before Going Live:
1. ✅ Use strong database passwords
2. ✅ Enable SSL/TLS for PostgreSQL connections
3. ✅ Set up regular backups (daily recommended)
4. ✅ Configure connection pooling for production load
5. ✅ Set up monitoring (Prometheus + Grafana)
6. ✅ Enable query logging for auditing
7. ✅ Use read replicas for analytics queries

### Recommended Production Setup:
```env
# Production .env
NODE_ENV=production
DB_HOST=production-db.example.com
DB_PORT=5432
DB_NAME=zra_taxguard_prod
DB_USER=taxguard_app
DB_PASSWORD=<strong-password>
DB_SSL=true
DB_POOL_MAX=50
```

---

## 📞 Support

For database integration issues, contact:
- **Kaps (Blockchain Lead)** - Database integration specialist
- Check logs: `blockchain/database/logs/`
- Review schema: `blockchain/database/schema.sql`

---

**🎉 Database integration complete! All blockchain operations are now persisted to PostgreSQL.**
