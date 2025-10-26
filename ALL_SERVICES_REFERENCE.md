# TaxGuard AI - All Services Reference (Actual Running Configuration)

## Complete List of 12 Services (As Currently Running)

This document provides a comprehensive reference for all 12 services currently running in the TaxGuard AI system.

---

## Service Overview (Actual Ports)

| # | Service Name | Port | Type | Status Endpoint | Description |
|---|-------------|------|------|-----------------|-------------|
| 1 | PostgreSQL | 5432 | Database | `docker exec taxguard-postgres pg_isready` | PostgreSQL database with 2 databases (zra_taxguard, whistlepro) |
| 2 | Dashboard Frontend | **3000** | React/Vite | http://localhost:3000/ | Main TaxGuard Dashboard user interface |
| 3 | Blockchain Service | 3001 | Node.js | http://localhost:3001/health | Immutable audit trail and verification service |
| 4 | GhostBuster Frontend | 3004 | React | http://localhost:3004/ | Ghost employee detection UI |
| 5 | Whistlepro Backend | 3005 | Node.js | http://localhost:3005/ | Whistleblower reporting system backend |
| 6 | Whistlepro/VRT Module | 3006 | Python/Flask | http://localhost:3006/health | Whistlepro/VRT additional module |
| 7 | OCR Backend | **4000** | Node.js | http://localhost:4000/health | Document processing and extraction backend |
| 8 | API Gateway | 4001 | Node.js | http://localhost:4001/health | Central routing and request management |
| 9 | OCR AI Service | 5000 | Node.js | http://localhost:5000/ | Machine learning and OCR processing service |
| 10 | GhostBuster Backend | 5001 | Python/Flask | http://localhost:5001/health | Ghost employee detection backend service |
| 11 | Anomaly Tracker | 5002 | Python/Flask | http://localhost:5002/health | AI Risk Scoring and Predictive Analytics |
| 12 | VRT Guard | 5003 | Python/Flask | http://localhost:5003/health | VAT Return Tracking system |

---

## Port Summary (Actual Configuration)

```
3000 - Dashboard Frontend (React/Vite)
3001 - Blockchain Service
3004 - GhostBuster Frontend
3005 - Whistlepro Backend
3006 - Whistlepro/VRT Module
4000 - OCR Backend
4001 - API Gateway
5000 - OCR AI Service
5001 - GhostBuster Backend
5002 - Anomaly Tracker (AI Risk Score / Predictive Analytics)
5003 - VRT Guard
5432 - PostgreSQL Database
```

**Total Services: 12**
**Total Ports: 12**

---

## Detailed Service Information

### 1. PostgreSQL (Port 5432)

**Type**: Database (PostgreSQL 17 Alpine in Docker)

**Purpose**: Central database for all services

**Databases**:
- `zra_taxguard` - Main application database
  - Schema: `ocr` (2 tables)
  - Schema: `ghostbuster` (2 tables)
  - Schema: `blockchain` (1 table)
  - Schema: `audit` (1 table)
- `whistlepro` - Whistleblower system database
  - Table: `reports`
  - Table: `investigators`

**Health Check**:
```bash
docker exec taxguard-postgres pg_isready -U postgres
```

**Connection**:
```bash
PGPASSWORD=postgres psql -h localhost -U postgres -d zra_taxguard
```

**Credentials**:
- Host: localhost
- Port: 5432
- User: postgres
- Password: postgres

---

### 2. Dashboard Frontend (Port 3000) ⭐

**Type**: React with Vite

**Purpose**: Main user interface for the TaxGuard AI system

**Key Features**:
- Tax compliance dashboard
- Document upload interface
- GhostBuster analysis integration
- Blockchain verification view
- Real-time statistics
- VRT Guard integration
- Anomaly detection visualization

**Access**: http://localhost:3000

**Directory**: `dashboard_integration/frontend/`

**Start Command**:
```bash
cd dashboard_integration/frontend && npm run dev
```

**Health Check**:
```bash
curl http://localhost:3000/
```

---

### 3. Blockchain Service (Port 3001)

**Type**: Node.js/Express

**Purpose**: Immutable audit trail and document verification

**Key Features**:
- In-memory blockchain
- Event recording
- Transaction verification
- Block explorer interface
- WebSocket support
- PostgreSQL integration

**Health Check**:
```bash
curl http://localhost:3001/health
```

**Configuration**: `blockchain/.env`

**API Endpoints**:
- GET `/health` - Health check
- GET `/api/events` - Retrieve events
- POST `/api/events` - Create event
- GET `/api/blockchain` - Get full chain
- GET `/explorer` - Web explorer
- GET `/api-docs` - API documentation

**Web Interfaces**:
- Explorer: http://localhost:3001/explorer
- API Docs: http://localhost:3001/api-docs

---

### 4. GhostBuster Frontend (Port 3004)

**Type**: React

**Purpose**: User interface for ghost employee detection

**Key Features**:
- Individual employee analysis UI
- Batch analysis interface
- Results visualization
- Statistics dashboard

**Access**: http://localhost:3004

**Directory**: `GhostBuster/frontend/`

**Start Command**:
```bash
cd GhostBuster/frontend && npm start
```

---

### 5. Whistlepro Backend (Port 3005)

**Type**: Node.js/Express

**Purpose**: Whistleblower reporting system backend

**Key Features**:
- Anonymous report submission
- Evidence file handling
- Report encryption
- Investigator portal
- Case management

**Health Check**:
```bash
curl http://localhost:3005/
```

**Configuration**: `whistlepro_backend/.env`

**Database**: Uses `whistlepro` database

**API Endpoints**:
- `/api/reports` - Submit/retrieve reports
- `/api/investigators` - Investigator management

---

### 6. Whistlepro/VRT Module (Port 3006)

**Type**: Python/Flask

**Purpose**: Additional module for Whistlepro/VRT functionality

**Health Check**:
```bash
curl http://localhost:3006/health
```

---

### 7. OCR Backend (Port 4000) ⭐

**Type**: Node.js/Express

**Purpose**: Document processing and extraction backend

**Key Features**:
- Document upload handling
- OCR service integration
- Document verification
- Blockchain integration
- Database storage

**Health Check**:
```bash
curl http://localhost:4000/health
```

**Configuration**: `ocr-backend/.env`

**Database**: Uses `zra_taxguard` database (ocr schema)

**API Endpoints**:
- `/api/upload` - Upload document
- `/api/verify` - Verify document
- `/api/documents` - List documents
- `/health` - Health check

---

### 8. API Gateway (Port 4001)

**Type**: Node.js/Express

**Purpose**: Central routing and request management

**Key Features**:
- CORS handling
- Rate limiting
- Request logging
- Health monitoring
- Routes to all backend services

**Health Check**:
```bash
curl http://localhost:4001/health
```

**Configuration**: `api-gateway/.env`

**Routes**:
- `/api/auth` - Authentication
- `/api/dashboard` - Dashboard data
- `/api/ocr` - OCR services
- `/api/ghostbuster` - GhostBuster services
- `/api/vrtguard` - VRT Guard services
- `/api/anomaly-tracker` - Anomaly detection

---

### 9. OCR AI Service (Port 5000)

**Type**: Node.js/Express

**Purpose**: Machine learning and OCR processing

**Key Features**:
- Tesseract OCR integration
- Document text extraction
- AI-powered data extraction
- Image preprocessing
- Multi-format support (PDF, JPG, PNG)

**Health Check**:
```bash
curl http://localhost:5000/
```

**Configuration**: `ai-service/.env`

**API Endpoints**:
- `/process` - Process document with OCR
- `/ai/extract` - AI-powered extraction
- `/stats` - Service statistics

---

### 10. GhostBuster Backend (Port 5001)

**Type**: Python/Flask

**Purpose**: Main ghost employee detection backend

**Key Features**:
- Employee verification
- Payroll anomaly detection
- Batch employee analysis
- Individual employee analysis
- Machine learning models

**Health Check**:
```bash
curl http://localhost:5001/health
```

**Configuration**: `GhostBuster/backend/.env`

**Database**: Uses `zra_taxguard` database (ghostbuster schema)

**API Endpoints**:
- `/api/analyze/individual` - Individual analysis
- `/api/analyze/batch` - Batch analysis
- `/api/statistics` - Statistics
- `/health` - Health check

---

### 11. Anomaly Tracker (Port 5002)

**Type**: Python/Flask

**Purpose**: AI-powered risk scoring and predictive analytics

**Key Features**:
- AI/ML-based anomaly detection
- Risk score calculation
- Predictive analytics
- Fraud pattern identification
- Real-time risk assessment

**Health Check**:
```bash
curl http://localhost:5002/health
```

**Directory**: `predictive_analytics/` or `ai_risk_scoring/`

**Database**: Uses `zra_taxguard` database

---

### 12. VRT Guard (Port 5003)

**Type**: Python/Flask

**Purpose**: VAT Return Tracking and verification

**Key Features**:
- VAT return processing
- Compliance tracking
- Return validation
- Historical data analysis

**Health Check**:
```bash
curl http://localhost:5003/health
```

**Directory**: `vrt_guard/`

**Database**: Uses `zra_taxguard` database

---

## Service Dependencies

### Database Dependencies

**Services using `zra_taxguard` database**:
1. OCR Backend (4000)
2. OCR AI Service (5000)
3. GhostBuster Backend (5001)
4. Anomaly Tracker (5002)
5. VRT Guard (5003)
6. Blockchain Service (3001)

**Services using `whistlepro` database**:
1. Whistlepro Backend (3005)

### Service-to-Service Dependencies

```
API Gateway (4001)
    ├─> Dashboard Frontend (3000)
    ├─> GhostBuster Frontend (3004)
    ├─> OCR Backend (4000)
    │       └─> OCR AI Service (5000)
    │       └─> Blockchain Service (3001)
    ├─> GhostBuster Backend (5001)
    ├─> Anomaly Tracker (5002)
    ├─> VRT Guard (5003)
    ├─> Whistlepro Backend (3005)
    │       └─> Whistlepro/VRT Module (3006)
    └─> Blockchain Service (3001)

All backend services connect to PostgreSQL (5432)
```

---

## Quick Health Check All Services

```bash
#!/bin/bash

echo "Checking all 12 services..."

# PostgreSQL
echo -n "[5432] PostgreSQL: "
docker exec taxguard-postgres pg_isready -U postgres > /dev/null 2>&1 && echo "✓ RUNNING" || echo "✗ DOWN"

# Dashboard Frontend
echo -n "[3000] Dashboard: "
curl -s http://localhost:3000/ > /dev/null 2>&1 && echo "✓ RUNNING" || echo "✗ DOWN"

# Blockchain
echo -n "[3001] Blockchain: "
curl -s http://localhost:3001/health > /dev/null 2>&1 && echo "✓ RUNNING" || echo "✗ DOWN"

# GhostBuster Frontend
echo -n "[3004] GhostBuster UI: "
curl -s http://localhost:3004/ > /dev/null 2>&1 && echo "✓ RUNNING" || echo "✗ DOWN"

# Whistlepro Backend
echo -n "[3005] Whistlepro: "
curl -s http://localhost:3005/ > /dev/null 2>&1 && echo "✓ RUNNING" || echo "✗ DOWN"

# Whistlepro/VRT Module
echo -n "[3006] Whistlepro/VRT Module: "
curl -s http://localhost:3006/health > /dev/null 2>&1 && echo "✓ RUNNING" || echo "✗ DOWN"

# OCR Backend
echo -n "[4000] OCR Backend: "
curl -s http://localhost:4000/health > /dev/null 2>&1 && echo "✓ RUNNING" || echo "✗ DOWN"

# API Gateway
echo -n "[4001] API Gateway: "
curl -s http://localhost:4001/health > /dev/null 2>&1 && echo "✓ RUNNING" || echo "✗ DOWN"

# OCR AI Service
echo -n "[5000] OCR AI: "
curl -s http://localhost:5000/ > /dev/null 2>&1 && echo "✓ RUNNING" || echo "✗ DOWN"

# GhostBuster Backend
echo -n "[5001] GhostBuster Backend: "
curl -s http://localhost:5001/health > /dev/null 2>&1 && echo "✓ RUNNING" || echo "✗ DOWN"

# Anomaly Tracker
echo -n "[5002] Anomaly Tracker: "
curl -s http://localhost:5002/health > /dev/null 2>&1 && echo "✓ RUNNING" || echo "✗ DOWN"

# VRT Guard
echo -n "[5003] VRT Guard: "
curl -s http://localhost:5003/health > /dev/null 2>&1 && echo "✓ RUNNING" || echo "✗ DOWN"
```

Save this as `check-all-services.sh` and run:
```bash
chmod +x check-all-services.sh
./check-all-services.sh
```

---

## Port Verification

Check if all ports are listening:

```bash
netstat -tuln | grep -E "3000|3001|3004|3005|3006|4000|4001|5000|5001|5002|5003|5432" | sort
```

Expected: 12 ports in LISTEN state

---

## Start All Services (Correct Order)

```bash
# 1. PostgreSQL (if not running)
docker start taxguard-postgres

# 2. Blockchain Service
cd blockchain && npm start &

# 3. OCR AI Service
cd ai-service && npm start &

# 4. OCR Backend (port 4000)
cd ocr-backend && npm start &

# 5. Whistlepro Backend
cd whistlepro_backend && npm start &

# 6. GhostBuster Backend
cd GhostBuster/backend && python3 app.py &

# 7. Anomaly Tracker
cd predictive_analytics && python3 app.py &

# 8. VRT Guard
cd vrt_guard && python3 app.py &

# 9. Whistlepro/VRT Module
cd <module_directory> && python3 app.py &

# 10. Dashboard Frontend (port 3000)
cd dashboard_integration/frontend && npm run dev &

# 11. GhostBuster Frontend
cd GhostBuster/frontend && npm start &

# 12. API Gateway (last)
cd api-gateway && npm start &
```

---

## Summary

**Total Services**: 12
- **1 Database** (PostgreSQL - 5432)
- **2 Frontends** (Dashboard - 3000, GhostBuster UI - 3004)
- **5 Node.js Backend** (API Gateway - 4001, OCR Backend - 4000, OCR AI - 5000, Blockchain - 3001, Whistlepro - 3005)
- **4 Python Backend** (GhostBuster - 5001, Anomaly Tracker - 5002, VRT Guard - 5003, Whistlepro/VRT Module - 3006)

**Databases**: 2 (zra_taxguard, whistlepro)
**Schemas**: 4+ (ocr, ghostbuster, blockchain, audit)
**Tables**: 8+ total

---

**For setup instructions, see: [SETUP_AND_INTEGRATION_GUIDE.md](./SETUP_AND_INTEGRATION_GUIDE.md)**
