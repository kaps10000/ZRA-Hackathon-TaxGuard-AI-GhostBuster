# 🛡️ ZRA TaxGuard AI - GhostBuster Platform

**Zambia Revenue Authority Hackathon Project**

A comprehensive AI-powered platform for detecting tax evasion, ghost employees, fraudulent documents, and enabling anonymous whistleblower reporting with blockchain verification.

---

## 🎯 Project Overview

ZRA TaxGuard AI is a unified system that combines:
- 🔗 **Blockchain Verification** (Kaps) - Immutable audit trail
- 🚨 **WhistlePro** (Kelvin & Ephraim) - Anonymous whistleblower reporting
- 📄 **OCR Document Verification** (Main Team) - Automated document processing
- 👻 **GhostBuster** (Ezra) - Phantom employee & company detection
- 🤖 **AI Risk Scoring** (Shuan) - ML-based risk assessment
- 📊 **Predictive Analytics** (Emmanuel) - Fraud forecasting
- 🖥️ **Central Dashboard** (Thomas) - Real-time monitoring

---

## 🗄️ **ONE Unified Database for Everyone**

### **Important: All teams use the SAME database!**

**Database Name**: `zra_taxguard`
**Host**: `localhost` (or `postgres` in Docker)
**Port**: `5432`
**User**: `postgres`
**Password**: `postgres`

```
zra_taxguard (Single PostgreSQL Database)
├── whistlepro schema     (Kelvin's whistleblower tables)
├── blockchain tables     (Kaps' blockchain tables)
├── ocr schema           (OCR processing tables)
├── ghostbuster schema   (Ezra's detection tables)
├── risk schema          (Shuan's AI risk tables)
├── compliance schema    (Compliance checks)
└── audit schema         (System-wide auditing)
```

**📖 Read the full guide**: [`UNIFIED_DATABASE_GUIDE.md`](./UNIFIED_DATABASE_GUIDE.md)

---

## 🚀 Quick Start

### **Option 1: Docker (Recommended)**

Start everything with one command:

```bash
# Clone the repository
git clone https://github.com/kaps10000/ZRA-Hackathon-TaxGuard-AI-GhostBuster.git
cd ZRA-Hackathon-TaxGuard-AI-GhostBuster

# Start core services (Database + Blockchain + WhistlePro)
docker-compose up -d postgres blockchain whistlepro

# Check logs
docker-compose logs -f

# Access services:
# - Database: localhost:5432
# - Blockchain API: http://localhost:3001
# - WhistlePro API: http://localhost:3000
```

**Start all services** (including OCR, AI, Gateway):
```bash
docker-compose --profile full up -d
```

**With database management tools** (PgAdmin):
```bash
docker-compose --profile tools up -d
# Access PgAdmin: http://localhost:5050
# Email: admin@zra.com | Password: admin
```

---

### **Option 2: Manual Setup**

#### **1. Start PostgreSQL**
```bash
# Create the unified database
psql -U postgres -c "CREATE DATABASE zra_taxguard;"

# Create schemas
psql -U postgres -d zra_taxguard < database/init/01-create-schemas.sql
```

#### **2. Start Blockchain API** (Terminal 1)
```bash
cd blockchain
npm install
npm run db:migrate
npm start
# Running on http://localhost:3001
```

#### **3. Start WhistlePro Backend** (Terminal 2)
```bash
cd whistlepro_backend
npm install
npm run migrate
npm run dev
# Running on http://localhost:3000
```

#### **4. Start OCR Backend** (Terminal 3 - Optional)
```bash
cd ocr-backend
npm install
npm run migrate
npm start
# Running on http://localhost:5000
```

---

## 📋 Services & Ports

| Service | Port | Description | Status |
|---------|------|-------------|--------|
| **PostgreSQL** | 5432 | Unified database | ✅ Running |
| **Blockchain API** | 3001 | Kaps' blockchain service | ✅ Integrated |
| **WhistlePro Backend** | 3000 | Kelvin's reporting API | ✅ Integrated |
| **OCR Backend** | 5000 | Document processing | 🔄 Ready |
| **AI Service** | 8000 | ML risk scoring | 🔄 Ready |
| **API Gateway** | 8080 | Central entry point | 🔄 Ready |
| **PgAdmin** | 5050 | Database management | 🛠️ Optional |

---

## 🔗 Integration Status

### ✅ **Completed Integrations**

#### **WhistlePro ↔️ Blockchain** (Kelvin + Kaps)
- ✅ All whistleblower reports automatically submitted to blockchain
- ✅ Tamper-proof immutable storage
- ✅ Complete anonymity protection
- ✅ Blockchain verification endpoints

**Documentation**: [`WHISTLEPRO_BLOCKCHAIN_INTEGRATION.md`](./WHISTLEPRO_BLOCKCHAIN_INTEGRATION.md)

#### **Database Unification** (All Teams)
- ✅ Single PostgreSQL database for all modules
- ✅ Schema-based separation (no conflicts)
- ✅ Cross-module queries enabled
- ✅ Docker-compose setup

**Documentation**: [`UNIFIED_DATABASE_GUIDE.md`](./UNIFIED_DATABASE_GUIDE.md)

---

### 🔄 **Ready for Integration**

The following modules have blockchain endpoints ready and are waiting for team implementation:

#### **GhostBuster** (Ezra)
**Blockchain Endpoint**: `POST http://localhost:3001/api/ghostbuster/detection`

```javascript
// Example integration
const response = await axios.post(
    'http://localhost:3001/api/ghostbuster/detection',
    {
        detectionType: 'ghost_employee',
        entityId: 'TPIN12345',
        confidenceScore: 92.5,
        detectionMethod: 'fingerprint_analysis',
        indicators: ['no_fingerprint', 'duplicate_bank_account'],
        severity: 'HIGH',
        evidenceHash: 'sha256_hash_of_evidence'
    }
);
```

**Your Schema**: `ghostbuster`
**Database**: `zra_taxguard`

---

#### **AI Risk Scoring** (Shuan)
**Blockchain Endpoint**: `POST http://localhost:3001/api/ai-risk/assessment`

```python
# Example integration (Python)
import requests

response = requests.post(
    'http://localhost:3001/api/ai-risk/assessment',
    json={
        'taxpayerId': 'TPIN67890',
        'riskScore': 87.3,
        'riskLevel': 'HIGH',
        'modelVersion': 'v2.1.0',
        'features': {'transaction_count': 150, 'avg_amount': 50000},
        'predictions': {'evasion_probability': 0.87},
        'confidence': 0.92,
        'riskFactors': ['inconsistent_reporting', 'high_cash_transactions'],
        'dataHash': 'sha256_hash_of_training_data'
    }
)
```

**Your Schema**: `risk`
**Database**: `zra_taxguard`

---

#### **Predictive Analytics** (Emmanuel)
**Blockchain Endpoint**: `POST http://localhost:3001/api/predictive/forecast`

```javascript
// Example integration
const response = await axios.post(
    'http://localhost:3001/api/predictive/forecast',
    {
        forecastType: 'tax_evasion',
        targetEntity: 'SECTOR_MANUFACTURING',
        timeframe: 'Q4_2025',
        prediction: {
            value: 15000000,
            unit: 'ZMW',
            confidence: 0.85
        },
        methodology: 'ARIMA_ML_HYBRID',
        factors: ['seasonal_trends', 'economic_indicators'],
        historicalDataHash: 'sha256_hash_of_historical_data'
    }
);
```

**Your Schema**: `predictive`
**Database**: `zra_taxguard`

---

## 🛠️ For New Team Members: How to Integrate

### **Step 1: Connect to the Unified Database**

Add to your `.env` file:
```env
DB_HOST=localhost          # or 'postgres' in Docker
DB_PORT=5432
DB_NAME=zra_taxguard      # ← Everyone uses THIS database
DB_USER=postgres
DB_PASSWORD=postgres
DB_SCHEMA=your_module     # ← Your namespace (e.g., 'ghostbuster', 'risk')
```

### **Step 2: Create Your Tables in Your Schema**

```sql
-- Connect to the unified database
psql -h localhost -U postgres -d zra_taxguard

-- Set your search path
SET search_path TO your_schema, public;

-- Create your tables
CREATE TABLE your_table (
    id SERIAL PRIMARY KEY,
    ...
);
```

### **Step 3: Submit Events to Blockchain**

```javascript
// Node.js example
const axios = require('axios');

async function submitToBlockchain(data) {
    try {
        const response = await axios.post(
            'http://localhost:3001/api/your-module/endpoint',
            data
        );
        console.log('Submitted to blockchain:', response.data);
    } catch (error) {
        console.error('Blockchain error:', error.message);
        // Don't fail - continue with local storage
    }
}
```

### **Step 4: Test Your Integration**

```bash
# Test database connection
psql -h localhost -U postgres -d zra_taxguard -c "\dt your_schema.*"

# Test blockchain connection
curl http://localhost:3001/health

# Submit test data
curl -X POST http://localhost:3001/api/your-module/endpoint \
  -H "Content-Type: application/json" \
  -d '{"test": "data"}'
```

**📖 Complete guide**: [`UNIFIED_DATABASE_GUIDE.md`](./UNIFIED_DATABASE_GUIDE.md)

---

## 📚 Documentation

| Document | Description |
|----------|-------------|
| [`UNIFIED_DATABASE_GUIDE.md`](./UNIFIED_DATABASE_GUIDE.md) | **START HERE** - Complete database integration guide |
| [`DATABASE_SOLUTION.md`](./DATABASE_SOLUTION.md) | Quick visual summary of unified database |
| [`WHISTLEPRO_BLOCKCHAIN_INTEGRATION.md`](./WHISTLEPRO_BLOCKCHAIN_INTEGRATION.md) | WhistlePro + Blockchain integration details |
| [`INTEGRATION_SUMMARY.md`](./INTEGRATION_SUMMARY.md) | Quick reference for integration |
| [`MERGED_DATABASE_STRUCTURE.md`](./MERGED_DATABASE_STRUCTURE.md) | Complete schema documentation |
| [`blockchain/DATABASE_INTEGRATION.md`](./blockchain/DATABASE_INTEGRATION.md) | Blockchain database technical docs |
| [`blockchain/INTEGRATION_ARCHITECTURE.md`](./blockchain/INTEGRATION_ARCHITECTURE.md) | System architecture diagrams |

---

## 🧪 Testing

### **Test Database Connection**
```bash
psql -h localhost -U postgres -d zra_taxguard \
  -c "SELECT schema_name FROM information_schema.schemata WHERE schema_name NOT IN ('pg_catalog', 'information_schema');"
```

Expected output:
```
     schema_name
---------------------
 whistlepro
 blockchain
 ocr
 ghostbuster
 risk
 compliance
 audit
```

### **Test Blockchain API**
```bash
# Health check
curl http://localhost:3001/health

# Get all blockchain events
curl http://localhost:3001/api/events

# Get blockchain stats
curl http://localhost:3001/api/stats
```

### **Test WhistlePro Backend**
```bash
# Health check
curl http://localhost:3000/health

# Submit test report
curl -X POST http://localhost:3000/api/reports \
  -H "Content-Type: application/json" \
  -d '{
    "category": "tax_evasion",
    "title": "Test Report",
    "description": "This is a test whistleblower report to verify blockchain integration",
    "priority": "medium"
  }'
```

### **Verify Blockchain Integration**
```bash
# Check blockchain received the report
curl http://localhost:3001/api/whistlepro/reports

# Get statistics
curl http://localhost:3001/api/whistlepro/stats
```

---

## 🏗️ Architecture

### **System Overview**
```
┌─────────────┐
│   Frontend  │ (Ephraim's Whistleblower Portal)
└──────┬──────┘
       │
       ▼
┌─────────────────────────────────────────────────┐
│            API Gateway (Port 8080)              │
│          Central Entry Point (Optional)         │
└────────┬────────────────────────────────────────┘
         │
    ┌────┴────┬──────────┬──────────┬───────────┐
    ▼         ▼          ▼          ▼           ▼
┌──────┐ ┌─────────┐ ┌────────┐ ┌────────┐ ┌────────┐
│Whistle│ │Blockchain│ │  OCR   │ │  AI    │ │Ghost-  │
│ Pro  │ │   API   │ │Backend │ │Service │ │Buster  │
│:3000 │ │  :3001  │ │ :5000  │ │ :8000  │ │  :?    │
└──┬───┘ └────┬────┘ └───┬────┘ └───┬────┘ └───┬────┘
   │          │          │          │          │
   └──────────┴──────────┴──────────┴──────────┘
                         │
                         ▼
              ┌─────────────────────┐
              │   PostgreSQL DB     │
              │   zra_taxguard      │
              │   (Port 5432)       │
              └─────────────────────┘
```

### **Data Flow: Whistleblower Report**
```
1. User submits report → WhistlePro Frontend
2. Frontend → WhistlePro Backend (POST /api/reports)
3. WhistlePro Backend:
   - Encrypts data (AES-256-GCM)
   - Saves to zra_taxguard.whistlepro.reports
   - Creates audit log
   - ✨ Submits to Blockchain API ✨
4. Blockchain API:
   - Creates blockchain event
   - Generates hash chain
   - Saves to zra_taxguard.blocks & events
   - Returns blockchain event ID
5. Response → User with case ID & blockchain verification
```

---

## 🔒 Security Features

- ✅ **End-to-End Encryption**: AES-256-GCM for sensitive data
- ✅ **Blockchain Verification**: SHA-256 hash chain for immutability
- ✅ **Complete Anonymity**: IP hashing, metadata scrubbing
- ✅ **Audit Trail**: All actions logged immutably
- ✅ **Rate Limiting**: Prevents spam and abuse
- ✅ **JWT Authentication**: Secure investigator access
- ✅ **Role-Based Access**: Different permission levels
- ✅ **Data Integrity**: Foreign keys, referential integrity

---

## 🤝 Team Members

| Name | Role | Module | Status |
|------|------|--------|--------|
| **Kaps** | Blockchain Lead | Blockchain API | ✅ Complete |
| **Kelvin** | Backend Lead | WhistlePro Backend | ✅ Complete |
| **Ephraim** | Frontend Lead | WhistlePro Frontend | 🔄 In Progress |
| **Ezra** | ML Engineer | GhostBuster Detection | 🔄 Ready to Integrate |
| **Shuan** | Data Scientist | AI Risk Scoring | 🔄 Ready to Integrate |
| **Emmanuel** | Analytics | Predictive Forecasting | 🔄 Ready to Integrate |
| **Thomas** | DevOps | Central Dashboard | 🔄 Ready to Integrate |

---

## 📞 Support

### **Need Help?**

1. **Database Questions**: Read [`UNIFIED_DATABASE_GUIDE.md`](./UNIFIED_DATABASE_GUIDE.md)
2. **Blockchain Integration**: Read [`WHISTLEPRO_BLOCKCHAIN_INTEGRATION.md`](./WHISTLEPRO_BLOCKCHAIN_INTEGRATION.md)
3. **Quick Reference**: Read [`DATABASE_SOLUTION.md`](./DATABASE_SOLUTION.md)

### **Common Issues**

**Database connection fails**:
```bash
# Check if PostgreSQL is running
docker-compose ps postgres

# Or manually
sudo systemctl status postgresql  # Linux
brew services list  # macOS
```

**Blockchain API not responding**:
```bash
# Check logs
docker-compose logs blockchain

# Restart service
docker-compose restart blockchain
```

**Port already in use**:
```bash
# Check what's using the port
sudo lsof -i :3001  # Replace with your port

# Change port in docker-compose.yml or .env
```

---

## 🚀 Deployment

### **Production Checklist**

- [ ] Change all default passwords
- [ ] Update JWT secrets
- [ ] Update encryption keys
- [ ] Enable HTTPS/TLS
- [ ] Configure firewall rules
- [ ] Set up database backups
- [ ] Configure monitoring/logging
- [ ] Review security settings
- [ ] Load test the system
- [ ] Document API endpoints

### **Environment Variables (Production)**

Create `.env.production` files for each service with secure values:

```env
NODE_ENV=production
DB_PASSWORD=<secure-random-password>
JWT_SECRET=<secure-random-secret-min-64-chars>
ENCRYPTION_KEY=<secure-random-key-32-bytes>
```

---

## 📄 License

MIT License - ZRA Hackathon 2025

---

## 🎉 Quick Commands Reference

```bash
# Start everything
docker-compose up -d

# Start just core services
docker-compose up -d postgres blockchain whistlepro

# View logs
docker-compose logs -f

# Stop everything
docker-compose down

# Rebuild and restart
docker-compose up -d --build

# Database shell
docker-compose exec postgres psql -U postgres -d zra_taxguard

# Blockchain API health check
curl http://localhost:3001/health

# WhistlePro health check
curl http://localhost:3000/health
```

---

**🛡️ Built for ZRA Hackathon 2025 - Securing Zambia's Tax Revenue**

**🔗 ONE Database, ONE Blockchain, ONE Team!**
