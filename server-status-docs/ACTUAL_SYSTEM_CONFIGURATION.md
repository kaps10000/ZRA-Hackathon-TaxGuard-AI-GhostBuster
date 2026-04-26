# TaxGuard AI - Actual System Configuration

## ✅ Verified Running Configuration

This document reflects the **actual running state** of your TaxGuard AI system as verified on 2025-10-26.

---

## 📊 All 12 Services Running

| # | Service | Port | Status | Type | Health Check |
|---|---------|------|--------|------|--------------|
| 1 | PostgreSQL | 5432 | ✓ RUNNING | Database | `docker exec taxguard-postgres pg_isready` |
| 2 | Dashboard Frontend | **3000** | ✓ RUNNING | React/Vite | http://localhost:3000/ |
| 3 | Blockchain Service | 3001 | ✓ RUNNING | Node.js | http://localhost:3001/health |
| 4 | GhostBuster Frontend | 3004 | ✓ RUNNING | React | http://localhost:3004/ |
| 5 | Whistlepro Backend | 3005 | ✓ RUNNING | Node.js | http://localhost:3005/ |
| 6 | Whistlepro/VRT Module | 3006 | ✓ RUNNING | Python | http://localhost:3006/health |
| 7 | OCR Backend | **4000** | ✓ RUNNING | Node.js | http://localhost:4000/health |
| 8 | API Gateway | 4001 | ✓ RUNNING | Node.js | http://localhost:4001/health |
| 9 | OCR AI Service | 5000 | ✓ RUNNING | Node.js | http://localhost:5000/ |
| 10 | GhostBuster Backend | 5001 | ✓ RUNNING | Python | http://localhost:5001/health |
| 11 | Anomaly Tracker | 5002 | ✓ RUNNING | Python | http://localhost:5002/health |
| 12 | VRT Guard | 5003 | ✓ RUNNING | Python | http://localhost:5003/health |

---

## 🔑 Key Configuration Details

### Port Assignments (ACTUAL)

```
3000 - Dashboard Frontend (React/Vite) - Main UI
3001 - Blockchain Service (Node.js) - Audit trail
3004 - GhostBuster Frontend (React) - Ghost employee UI
3005 - Whistlepro Backend (Node.js) - Whistleblower system
3006 - Whistlepro/VRT Module (Python) - Additional module
4000 - OCR Backend (Node.js) - Document processing
4001 - API Gateway (Node.js) - Central routing
5000 - OCR AI Service (Node.js) - ML/OCR processing
5001 - GhostBuster Backend (Python) - Ghost detection backend
5002 - Anomaly Tracker (Python) - AI risk scoring
5003 - VRT Guard (Python) - VAT tracking
5432 - PostgreSQL (Database) - Data storage
```

### ⚠️ Important Notes

**Dashboard is on port 3000 (NOT 5173)** ⭐
- Running Vite dev server
- Directory: `dashboard_integration/frontend/`
- Access: http://localhost:3000

**OCR Backend is on port 4000 (NOT 3000)** ⭐
- Document processing service
- Directory: `ocr-backend/`
- Access: http://localhost:4000/health

---

## 🗂️ Service Breakdown

### Frontend Services (2)
1. **Dashboard Frontend** (3000) - Main TaxGuard UI
2. **GhostBuster Frontend** (3004) - Ghost employee detection UI

### Backend Services (9)
**Node.js Services (5)**:
1. Blockchain Service (3001)
2. Whistlepro Backend (3005)
3. OCR Backend (4000)
4. API Gateway (4001)
5. OCR AI Service (5000)

**Python Services (4)**:
1. GhostBuster Backend (5001)
2. Anomaly Tracker (5002)
3. VRT Guard (5003)
4. Whistlepro/VRT Module (3006)

### Database (1)
1. **PostgreSQL** (5432) - Docker container `taxguard-postgres`

---

## 🔗 Service Connections

```
User/Browser
    ↓
Dashboard (3000) ←→ API Gateway (4001)
    ↓                      ↓
    ├─> Blockchain (3001) ←┤
    ├─> OCR Backend (4000) ←┤
    │       └─> OCR AI (5000)
    ├─> GhostBuster Backend (5001)
    ├─> Anomaly Tracker (5002)
    ├─> VRT Guard (5003)
    └─> Whistlepro (3005)
            └─> Whistlepro/VRT Module (3006)

All backend services ──> PostgreSQL (5432)
```

---

## 💾 Database Configuration

### PostgreSQL Details
- **Container**: taxguard-postgres
- **Port**: 5432
- **User**: postgres
- **Password**: postgres

### Databases
1. **zra_taxguard** - Main application database
   - Schema: `ocr` - Document processing
   - Schema: `ghostbuster` - Ghost employee detection
   - Schema: `blockchain` - Blockchain records
   - Schema: `audit` - System audit logs

2. **whistlepro** - Whistleblower system
   - Table: `reports`
   - Table: `investigators`

---

## ✅ Quick Verification

### Check All Services
```bash
./check-all-services.sh
```

### Check Specific Service
```bash
# Dashboard
curl http://localhost:3000/

# API Gateway
curl http://localhost:4001/health

# Blockchain
curl http://localhost:3001/health

# OCR Backend
curl http://localhost:4000/health

# GhostBuster Backend
curl http://localhost:5001/health

# PostgreSQL
docker exec taxguard-postgres pg_isready -U postgres
```

### Check All Ports
```bash
netstat -tuln | grep -E "3000|3001|3004|3005|3006|4000|4001|5000|5001|5002|5003|5432"
```

Should show 12 lines with LISTEN status.

---

## 📁 Service Directories

```
ZRA-Hackathon-TaxGuard-AI-GhostBuster/
├── dashboard_integration/frontend/     # Port 3000 - Dashboard
├── blockchain/                         # Port 3001 - Blockchain
├── GhostBuster/frontend/               # Port 3004 - GhostBuster UI
├── whistlepro_backend/                 # Port 3005 - Whistlepro
├── ocr-backend/                        # Port 4000 - OCR Backend
├── api-gateway/                        # Port 4001 - API Gateway
├── ai-service/                         # Port 5000 - OCR AI
├── GhostBuster/backend/                # Port 5001 - GhostBuster
├── predictive_analytics/               # Port 5002 - Anomaly Tracker
└── vrt_guard/                          # Port 5003 - VRT Guard
```

---

## 🌐 Access URLs

### User Interfaces
- **Main Dashboard**: http://localhost:3000
- **GhostBuster UI**: http://localhost:3004
- **Blockchain Explorer**: http://localhost:3001/explorer

### API Endpoints
- **API Gateway**: http://localhost:4001
- **Blockchain API**: http://localhost:3001
- **OCR Backend**: http://localhost:4000
- **GhostBuster API**: http://localhost:5001
- **Anomaly Tracker**: http://localhost:5002
- **VRT Guard**: http://localhost:5003

### Health Checks
All services have health endpoints that return status information.

---

## 🔧 Environment Files

Each service has its own `.env` configuration:

```
blockchain/.env                  # Port 3001
dashboard_integration/frontend/.env  # Port 3000
GhostBuster/frontend/.env       # Port 3004
whistlepro_backend/.env         # Port 3005
ocr-backend/.env                # Port 4000
api-gateway/.env                # Port 4001
ai-service/.env                 # Port 5000
GhostBuster/backend/.env        # Port 5001
```

---

## 📊 System Statistics

**Total Services**: 12
**Running Services**: 12 (100%)
**Total Ports**: 12
**Databases**: 2 (zra_taxguard, whistlepro)
**Schemas**: 4+ (ocr, ghostbuster, blockchain, audit)
**Tables**: 8+

**Service Types**:
- Frontend: 2
- Backend (Node.js): 5
- Backend (Python): 4
- Database: 1

---

## 🛠️ Maintenance Commands

### Start All Services
```bash
./start-all-linux.sh
```

### Stop All Services
```bash
./stop-all-services.sh
# or
pkill -f "node"; pkill -f "python3.*app.py"
```

### Restart Single Service

**Frontend (React/Vite)**:
```bash
# Kill and restart Dashboard
pkill -f "vite"
cd dashboard_integration/frontend && npm run dev &
```

**Backend (Node.js)**:
```bash
# Example: Restart Blockchain
pkill -f "node.*blockchain"
cd blockchain && npm start &
```

**Backend (Python)**:
```bash
# Example: Restart GhostBuster
pkill -f "python3.*GhostBuster"
cd GhostBuster/backend && python3 app.py &
```

**Database**:
```bash
docker restart taxguard-postgres
```

---

## 🧪 Testing

### Integration Test
```bash
node final-integration-test.js
```

### Health Check Script
```bash
./check-all-services.sh
```

Expected output: All 12 services ✓ RUNNING

---

## 📝 Documentation Files

- **ALL_SERVICES_REFERENCE.md** - Complete service reference with actual ports
- **SETUP_AND_INTEGRATION_GUIDE.md** - Master setup guide
- **DATABASE_SETUP_README.md** - Database configuration
- **BLOCKCHAIN_INTEGRATION_README.md** - Blockchain integration
- **DEVELOPER_QUICKSTART.md** - Quick start guide
- **check-all-services.sh** - Health check script

---

## ✅ Verification Checklist

- [x] PostgreSQL running on port 5432
- [x] Dashboard frontend running on port 3000
- [x] Blockchain service running on port 3001
- [x] GhostBuster frontend running on port 3004
- [x] Whistlepro backend running on port 3005
- [x] Whistlepro/VRT module running on port 3006
- [x] OCR backend running on port 4000
- [x] API Gateway running on port 4001
- [x] OCR AI service running on port 5000
- [x] GhostBuster backend running on port 5001
- [x] Anomaly Tracker running on port 5002
- [x] VRT Guard running on port 5003
- [x] All services healthy and responding
- [x] Database accessible
- [x] Integration tests passing

---

## 🎉 System Status

```
✅ All 12 Services Running
✅ Database Operational
✅ Blockchain Integrated
✅ All Health Checks Passing
✅ System Ready for Use
```

---

**Last Verified**: 2025-10-26
**Configuration**: Production-Ready
**Status**: ✅ All Systems Operational

For detailed setup instructions, see [SETUP_AND_INTEGRATION_GUIDE.md](./SETUP_AND_INTEGRATION_GUIDE.md)
