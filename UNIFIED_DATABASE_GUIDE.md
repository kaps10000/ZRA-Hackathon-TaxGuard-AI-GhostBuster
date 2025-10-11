# 🗄️ Unified Database Integration Guide

## 🎯 ONE Database for the ENTIRE Team!

### **Database Name**: `zra_taxguard`
### **Host**: `localhost` (or `postgres` in Docker)
### **Port**: `5432`
### **User**: `postgres`
### **Password**: `postgres`

---

## ❌ PROBLEM: Duplicate Databases

**Before** (WRONG):
```
❌ whistlepro database (Kelvin's separate DB)
❌ zra_taxguard database (Blockchain DB)
❌ Other team members creating their own DBs
```

**After** (CORRECT):
```
✅ ONE zra_taxguard database
   ├── whistlepro schema (Kelvin's tables)
   ├── blockchain tables (Kaps' tables)
   ├── ocr schema (OCR processing)
   ├── ghostbuster schema (Ghost detection)
   ├── risk schema (AI risk scoring)
   └── compliance schema (Compliance checks)
```

---

## 🏗️ Database Architecture

### **Single PostgreSQL Database with Schema-Based Separation**

```sql
zra_taxguard
│
├── whistlepro (schema)
│   ├── reports
│   ├── investigators
│   └── audit_logs
│
├── blockchain (tables in public schema)
│   ├── blocks
│   ├── events
│   ├── whistlepro_reports (blockchain copy)
│   ├── case_updates
│   ├── ghostbuster_detections
│   ├── ai_risk_assessments
│   └── predictive_forecasts
│
├── ocr (schema)
│   └── documents
│
├── ghostbuster (schema)
│   ├── employees
│   └── anomalies
│
├── risk (schema)
│   ├── scores
│   └── factors
│
├── compliance (schema)
│   ├── violations
│   └── rules
│
└── audit (schema)
    ├── system_logs
    └── data_changes
```

---

## 📋 Connection Configuration for Each Service

### **1. WhistlePro Backend (Kelvin) - Port 3000**

**File**: `whistlepro_backend/.env`
```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=zra_taxguard          # ← UNIFIED DATABASE
DB_USER=postgres
DB_PASSWORD=postgres

# Schema to use (optional)
DB_SCHEMA=whistlepro
```

**Knex Configuration**: `whistlepro_backend/knexfile.js`
```javascript
module.exports = {
  development: {
    client: 'postgresql',
    connection: {
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 5432,
      database: 'zra_taxguard',  // ← UNIFIED DATABASE
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || 'postgres'
    },
    searchPath: ['whistlepro', 'public'],  // ← Use whistlepro schema
    migrations: {
      directory: './database/migrations',
      schemaName: 'whistlepro'  // ← Migrate to whistlepro schema
    }
  }
};
```

---

### **2. Blockchain API (Kaps) - Port 3001**

**File**: `blockchain/.env`
```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=zra_taxguard          # ← UNIFIED DATABASE
DB_USER=postgres
DB_PASSWORD=postgres
```

**Database Config**: `blockchain/database/config.js`
```javascript
const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: 'zra_taxguard',  // ← UNIFIED DATABASE
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres'
});
```

---

### **3. OCR Backend (Main) - Port 5000**

**File**: `ocr-backend/.env`
```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=zra_taxguard          # ← UNIFIED DATABASE
DB_USER=postgres
DB_PASSWORD=postgres
DB_SCHEMA=ocr                 # ← Use ocr schema
```

**Sequelize Config** (if using Sequelize):
```javascript
module.exports = {
  development: {
    username: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    database: 'zra_taxguard',  // ← UNIFIED DATABASE
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    dialect: 'postgres',
    schema: 'ocr'  // ← Use ocr schema
  }
};
```

---

### **4. GhostBuster Service (Ezra) - Port ?**

**File**: `ghostbuster/.env` (or equivalent)
```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=zra_taxguard          # ← UNIFIED DATABASE
DB_USER=postgres
DB_PASSWORD=postgres
DB_SCHEMA=ghostbuster         # ← Use ghostbuster schema
BLOCKCHAIN_API_URL=http://localhost:3001
```

**Integration Pattern**:
```python
# Python example (if using SQLAlchemy)
from sqlalchemy import create_engine

DATABASE_URL = f"postgresql://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}"
engine = create_engine(
    DATABASE_URL,
    connect_args={"options": "-csearch_path=ghostbuster,public"}
)

# Submit detection to blockchain
import requests
response = requests.post(
    "http://localhost:3001/api/ghostbuster/detection",
    json={
        "detectionType": "ghost_employee",
        "entityId": "TPIN12345",
        "confidenceScore": 92.5,
        "indicators": ["no_fingerprint", "duplicate_bank_account"],
        "severity": "HIGH"
    }
)
```

---

### **5. AI Risk Service (Shuan) - Port 8000**

**File**: `ai-service/.env`
```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=zra_taxguard          # ← UNIFIED DATABASE
DB_USER=postgres
DB_PASSWORD=postgres
DB_SCHEMA=risk                # ← Use risk schema
BLOCKCHAIN_API_URL=http://localhost:3001
```

**Integration Pattern**:
```python
# Submit risk assessment to blockchain
response = requests.post(
    "http://localhost:3001/api/ai-risk/assessment",
    json={
        "taxpayerId": "TPIN67890",
        "riskScore": 87.3,
        "riskLevel": "HIGH",
        "modelVersion": "v2.1.0",
        "riskFactors": ["inconsistent_reporting", "high_cash_transactions"],
        "predictions": {"evasion_probability": 0.87}
    }
)
```

---

## 🚀 Quick Start with Docker Compose

### **Option 1: Core Services Only (Recommended for Testing)**
```bash
# Start just the essential services
docker-compose up -d postgres blockchain whistlepro

# Check logs
docker-compose logs -f

# Access services:
# - Database: localhost:5432
# - Blockchain API: http://localhost:3001
# - WhistlePro API: http://localhost:3000
```

### **Option 2: All Services**
```bash
# Start everything
docker-compose --profile full up -d

# Access services:
# - Database: localhost:5432
# - Blockchain API: http://localhost:3001
# - WhistlePro API: http://localhost:3000
# - OCR Backend: http://localhost:5000
# - AI Service: http://localhost:8000
# - API Gateway: http://localhost:8080
```

### **Option 3: With Database Management Tools**
```bash
# Start with PgAdmin
docker-compose --profile tools up -d

# Access PgAdmin: http://localhost:5050
# Email: admin@zra.com
# Password: admin
```

---

## 🔧 Manual Setup (Without Docker)

### **1. Start PostgreSQL**
```bash
# On Ubuntu/Debian
sudo systemctl start postgresql

# On macOS (Homebrew)
brew services start postgresql@15
```

### **2. Create Unified Database**
```bash
# Connect to PostgreSQL
psql -U postgres

# Create database
CREATE DATABASE zra_taxguard;

# Connect to it
\c zra_taxguard

# Create schemas
CREATE SCHEMA IF NOT EXISTS ocr;
CREATE SCHEMA IF NOT EXISTS whistlepro;
CREATE SCHEMA IF NOT EXISTS ghostbuster;
CREATE SCHEMA IF NOT EXISTS risk;
CREATE SCHEMA IF NOT EXISTS compliance;
CREATE SCHEMA IF NOT EXISTS audit;
CREATE SCHEMA IF NOT EXISTS blockchain;

# Exit
\q
```

### **3. Run Migrations**

**Blockchain Tables**:
```bash
cd blockchain
npm install
npm run db:migrate
```

**WhistlePro Tables**:
```bash
cd whistlepro_backend
npm install
npm run migrate
```

**OCR Tables** (if applicable):
```bash
cd ocr-backend
npm install
npm run migrate
```

### **4. Start Services**

**Terminal 1 - Blockchain**:
```bash
cd blockchain
npm start  # Port 3001
```

**Terminal 2 - WhistlePro**:
```bash
cd whistlepro_backend
npm run dev  # Port 3000
```

**Terminal 3 - OCR** (optional):
```bash
cd ocr-backend
npm start  # Port 5000
```

---

## 📊 How to Integrate Your Module

### **Step-by-Step Integration for New Team Members**

#### **Step 1: Connect to the Unified Database**

Use these credentials:
```
Host: localhost
Port: 5432
Database: zra_taxguard
User: postgres
Password: postgres
Schema: <your_module_name>
```

#### **Step 2: Create Your Tables in Your Schema**

Example for GhostBuster module:
```sql
-- Set search path
SET search_path TO ghostbuster, public;

-- Create your tables
CREATE TABLE IF NOT EXISTS employees (
    id SERIAL PRIMARY KEY,
    employee_id VARCHAR(50) UNIQUE NOT NULL,
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

CREATE TABLE IF NOT EXISTS anomalies (
    id SERIAL PRIMARY KEY,
    employee_id VARCHAR(50),
    anomaly_type VARCHAR(100),
    severity VARCHAR(20),
    description TEXT,
    detected_at TIMESTAMP DEFAULT NOW(),
    resolved_at TIMESTAMP,
    FOREIGN KEY (employee_id) REFERENCES employees(employee_id)
);
```

#### **Step 3: Integrate with Blockchain**

Every important event should be submitted to the blockchain:

```javascript
// Node.js example
const axios = require('axios');

async function submitToBlockchain(detectionData) {
    try {
        const response = await axios.post(
            'http://localhost:3001/api/ghostbuster/detection',
            {
                detectionType: detectionData.type,
                entityId: detectionData.entityId,
                confidenceScore: detectionData.confidence,
                detectionMethod: detectionData.method,
                indicators: detectionData.indicators,
                severity: detectionData.severity,
                evidenceHash: detectionData.evidenceHash
            }
        );

        console.log('Submitted to blockchain:', response.data);
        return response.data;
    } catch (error) {
        console.error('Blockchain submission failed:', error.message);
        // Continue anyway - don't fail the entire operation
    }
}
```

#### **Step 4: Test Your Integration**

```bash
# Test database connection
psql -h localhost -U postgres -d zra_taxguard -c "SELECT schema_name FROM information_schema.schemata;"

# Test blockchain connection
curl http://localhost:3001/health

# Submit test data
curl -X POST http://localhost:3001/api/<your-module>/endpoint \
  -H "Content-Type: application/json" \
  -d '{"test": "data"}'
```

---

## 🔗 Cross-Module Queries

Since everyone uses the SAME database, you can query across modules:

```sql
-- Example: Link whistleblower reports to OCR documents
SELECT
    wr.case_id,
    wr.category,
    wr.priority,
    od.document_id,
    od.verification_status,
    od.risk_score
FROM whistlepro.reports wr
JOIN ocr.documents od
    ON od.metadata->>'relatedCaseId' = wr.case_id
WHERE wr.status = 'investigating'
  AND od.risk_score > 75;

-- Example: Find high-risk entities across all modules
SELECT
    'whistlepro' as source,
    case_id as entity_id,
    category as risk_type,
    priority as risk_level,
    created_at
FROM whistlepro.reports
WHERE priority IN ('high', 'critical')

UNION ALL

SELECT
    'ocr' as source,
    document_id as entity_id,
    'document_fraud' as risk_type,
    verification_status as risk_level,
    uploaded_at as created_at
FROM ocr.documents
WHERE risk_score > 80

UNION ALL

SELECT
    'ghostbuster' as source,
    employee_id as entity_id,
    'ghost_employee' as risk_type,
    verification_status as risk_level,
    created_at
FROM ghostbuster.employees
WHERE risk_score > 85

ORDER BY created_at DESC;
```

---

## ✅ Benefits of Unified Database

### **For Developers**:
- ✅ **Single connection** - No juggling multiple databases
- ✅ **Cross-module queries** - Join tables across all services
- ✅ **Shared blockchain** - All events in one place
- ✅ **Easy setup** - One `docker-compose up` command

### **For Operations**:
- ✅ **Single backup** - One database to backup
- ✅ **Simplified monitoring** - One database to watch
- ✅ **Better performance** - No network overhead between DBs
- ✅ **ACID compliance** - Transactions across modules

### **For Data Integrity**:
- ✅ **Foreign keys** - Link related data across modules
- ✅ **Referential integrity** - No orphaned records
- ✅ **Consistent transactions** - All-or-nothing operations
- ✅ **Unified audit trail** - Complete system history

---

## 🎯 Summary

### **What You Need to Know**:

1. **ONE Database**: `zra_taxguard` on `localhost:5432`
2. **Your Schema**: Use `<your_module_name>` schema for your tables
3. **Blockchain Integration**: POST to `http://localhost:3001/api/<your-module>/<endpoint>`
4. **Docker**: `docker-compose up -d` starts everything

### **Connection String**:
```
postgresql://postgres:postgres@localhost:5432/zra_taxguard?schema=<your_module>
```

### **Blockchain API Base URL**:
```
http://localhost:3001
```

---

## 📞 Need Help?

**Check these files**:
- `docker-compose.yml` - Service configuration
- `MERGED_DATABASE_STRUCTURE.md` - Complete schema documentation
- `WHISTLEPRO_BLOCKCHAIN_INTEGRATION.md` - Integration example
- `blockchain/DATABASE_INTEGRATION.md` - Blockchain API docs

**Test your connection**:
```bash
# Database
psql -h localhost -U postgres -d zra_taxguard

# Blockchain API
curl http://localhost:3001/health

# Your service
curl http://localhost:<your-port>/health
```

---

**🎉 ONE Database, ONE Blockchain, ONE Team!**
