# ZRA TaxGuard - API Testing Documentation

## 📚 Available Documentation Files

### 1. **COMPLETE_API_GUIDE.html** (33 KB) - ⭐ RECOMMENDED
**Location:** `/home/kaps100/ZRA-Hackathon-TaxGuard-AI-GhostBuster/COMPLETE_API_GUIDE.html`

**Features:**
- Interactive tabbed interface
- All 4 services documented
- 40+ API endpoints with examples
- Service status dashboard
- Copy-paste ready cURL commands
- Professional design

**Services Covered:**
- ✅ OCR AI Service (Port 5000)
- ✅ Blockchain API (Port 3001)
- ✅ OCR Backend (Port 4000)
- ✅ Service Status Overview

**Open in browser:**
```bash
xdg-open /home/kaps100/ZRA-Hackathon-TaxGuard-AI-GhostBuster/COMPLETE_API_GUIDE.html
```

---

### 2. **COMPLETE_API_COLLECTION.postman_collection.json** (9.4 KB)
**Location:** `/home/kaps100/ZRA-Hackathon-TaxGuard-AI-GhostBuster/COMPLETE_API_COLLECTION.postman_collection.json`

**Import into Postman:**
1. Open Postman
2. Click **Import**
3. Select this file
4. All endpoints ready to test!

**Includes:**
- OCR AI Service: 6 endpoints
- Blockchain API: 20+ endpoints
- Pre-configured request bodies
- Form-data file upload examples

---

### 3. **API_TESTING_GUIDE.html** (24 KB) - OCR AI Only
**Location:** `/home/kaps100/ZRA-Hackathon-TaxGuard-AI-GhostBuster/API_TESTING_GUIDE.html`

Focused guide for OCR AI Service only.

---

### 4. **ZRA_TaxGuard_API_Collection.postman_collection.json** (12 KB) - OCR AI Only
**Location:** `/home/kaps100/ZRA-Hackathon-TaxGuard-AI-GhostBuster/ZRA_TaxGuard_API_Collection.postman_collection.json`

Postman collection for OCR AI Service only.

---

### 5. **MOCK_DATA_GENERATION_GUIDE.md** - ⭐ NEW
**Location:** `/home/kaps100/ZRA-Hackathon-TaxGuard-AI-GhostBuster/ocr-backend/OCR_MockData/MOCK_DATA_GENERATION_GUIDE.md`

**Complete guide for generating valid mock data:**
- All validation rules explained
- Risk scoring thresholds (0-100)
- Field requirements (Invoice numbers, HS codes, TPINs, dates, amounts)
- Document type specifications
- Anomaly detection rules
- Mock data strategies (perfect, good, flagged, rejected)
- JSON templates and examples

**Quick generate mock data:**
```bash
cd ocr-backend/OCR_MockData

# Generate perfect invoice
python3 generate_mock_data.py --type invoice --quality perfect --pretty

# Generate customs declaration
python3 generate_mock_data.py --type customs --quality perfect --output test.json

# Generate multiple documents
python3 generate_mock_data.py --type invoice --quality good --count 5 --output batch.json
```

**Key Validation Rules:**
- **Invoice Number:** 5+ chars, alphanumeric + `-` `/`
- **HS Code:** 6-10 digits, numeric only
- **Date:** Not future, not >5 years old
- **Amount:** Positive, <10M, valid currency (ZMW/USD/EUR/GBP)
- **TPIN:** Exactly 10 digits, numeric, not repeated

**Target Risk Score:** 70+ for automatic verification ✅

---

## 🖥️ Current Service Status

| Service | Port | Status | Health | URL |
|---------|------|--------|--------|-----|
| **Dashboard Frontend** | 3000 | ✅ Running | Healthy | http://localhost:3000 |
| **Blockchain API** | 3001 | ✅ Running | Healthy | http://localhost:3001 |
| **GhostBuster Frontend** | 3004 | ✅ Running | Healthy | http://localhost:3004 |
| **Whistlepro Backend** | 3005 | ✅ Running | Healthy | http://localhost:3005 |
| **Whistlepro/VRT Module** | 3006 | ✅ Running | Healthy | http://localhost:3006 |
| **OCR Backend** | 4000 | ✅ Running | Healthy | http://localhost:4000 |
| **API Gateway** | 4001 | ✅ Running | Healthy | http://localhost:4001 |
| **OCR AI Service** | 5000 | ✅ Running | Healthy | http://localhost:5000 |
| **GhostBuster Backend** | 5001 | ✅ Running | Healthy | http://localhost:5001 |
| **Anomaly Tracker** | 5002 | ✅ Running | Healthy | http://localhost:5002 |
| **VRT Guard** | 5003 | ✅ Running | Healthy | http://localhost:5003 |
| **PostgreSQL** | 5432 | ✅ Running | Healthy | localhost:5432 |

---

## 🚀 Quick Start Testing

### **Test OCR AI Service:**
```bash
# Health check
curl http://localhost:5000/health

# Verify document (requires file upload)
curl -X POST http://localhost:5000/api/verify \
  -F "file=@/home/kaps100/ZRA-Hackathon-TaxGuard-AI-GhostBuster/ocr-backend/test-invoice.png"
```

### **Test Blockchain API:**
```bash
# Get API info
curl http://localhost:3001/

# Get health status
curl http://localhost:3001/health

# Get all events
curl http://localhost:3001/api/events

# Get statistics
curl http://localhost:3001/api/stats

# View blockchain explorer
xdg-open http://localhost:3001/explorer
```

---

## 📁 Test Files Location

| File | Path | Type |
|------|------|------|
| test-invoice.png | `/home/kaps100/ZRA-Hackathon-TaxGuard-AI-GhostBuster/ocr-backend/test-invoice.png` | PNG Image |
| test-invoice.jpg | `/home/kaps100/ZRA-Hackathon-TaxGuard-AI-GhostBuster/ocr-backend/test-invoice.jpg` | JPG Image |
| Mock Data Generator | `/home/kaps100/ZRA-Hackathon-TaxGuard-AI-GhostBuster/ocr-backend/OCR_MockData/` | Directory |
| Sample Perfect Invoice | `/home/kaps100/ZRA-Hackathon-TaxGuard-AI-GhostBuster/ocr-backend/OCR_MockData/sample_perfect_invoice.json` | JSON |
| Sample Perfect Customs | `/home/kaps100/ZRA-Hackathon-TaxGuard-AI-GhostBuster/ocr-backend/OCR_MockData/sample_perfect_customs.json` | JSON |

---

## 🔗 Quick Access Links

- **Dashboard Frontend:** http://localhost:3000
- **GhostBuster Frontend:** http://localhost:3004
- **Blockchain Explorer:** http://localhost:3001/explorer
- **Blockchain API Docs:** http://localhost:3001/api-docs
- **OCR AI Service:** http://localhost:5000
- **API Gateway:** http://localhost:4001

---

## 📋 All API Endpoints Summary

### **OCR AI Service (Port 5000)**
1. `GET /health` - Health check
2. `GET /` - API information
3. `POST /api/ocr/process` - OCR processing
4. `POST /api/extract` - Data extraction
5. `POST /api/verify` - Document verification
6. `POST /api/verify/batch` - Batch processing

### **Blockchain API (Port 3001)**
1. `GET /health` - Health check
2. `GET /` - API information
3. `GET /api/events` - Get all events
4. `POST /api/events` - Create event
5. `GET /api/blockchain` - Get blockchain
6. `GET /api/stats` - Statistics
7. `GET /api/verify/:eventId` - Verify event
8. `GET /api/siem/export/splunk` - Export to Splunk
9. `GET /api/siem/export/elk` - Export to ELK
10. `GET /api/siem/export/csv` - Export to CSV
11. `GET /api/templates` - Event templates
12. `POST /api/analytics/risk-score` - Risk scoring
13. `POST /api/analytics/pattern-detection` - Pattern detection
14. `POST /api/triggers/evaluate` - Compliance triggers
15. `POST /api/multisig/create` - Multi-signature
16. `GET /api/dashboard/overview` - Dashboard
17. `POST /api/ghostbuster/detection` - GhostBuster
18. `POST /api/whistlepro/report` - WhistlePro
19. `POST /api/ai-risk/assessment` - AI Risk
20. `POST /api/predictive/forecast` - Predictive
21. `GET /api/dashboard-feed/live` - Live feed
22. `GET /explorer` - Blockchain explorer
23. `GET /api-docs` - API documentation

### **OCR Backend (Port 4000)** - ✅ Running
Status: Operational

---

## ⚠️ Common Issues & Solutions

### Issue: "Method Not Allowed" Error
**Cause:** Using GET instead of POST
**Solution:** OCR endpoints require POST method with `multipart/form-data`

### Issue: "Field required" Error
**Cause:** Missing file in request
**Solution:** Make sure to upload file in form-data body

### Issue: Connection Refused
**Cause:** Service not running
**Solution:** Check `docker-compose ps` and restart if needed

### Issue: Service Not Responding
**Cause:** Service may not be running
**Solution:** Check service status with health endpoints or use ./check-all-services.sh

---

## 🎯 Recommended Testing Workflow

1. **Start with Health Checks:**
   ```bash
   curl http://localhost:4001/health  # API Gateway
   curl http://localhost:5000/health  # OCR AI Service
   curl http://localhost:3001/health  # Blockchain
   ```

2. **Test OCR AI Service:**
   - Visit: http://localhost:5000
   - Try "Verify Document" endpoint
   - Upload test-invoice.png

3. **Test Blockchain API:**
   - Open API Docs: http://localhost:3001/api-docs
   - View Explorer: http://localhost:3001/explorer
   - Check statistics: `curl http://localhost:3001/api/stats`

4. **Use Postman for Complex Tests:**
   - Import COMPLETE_API_COLLECTION.postman_collection.json
   - Modify request bodies as needed
   - Save successful requests

---

## 📊 Statistics

- **Total Services:** 12 (including database)
- **Total Endpoints:** 50+
- **Operational Services:** 12/12 (100%)
- **Documentation Files:** 10+
- **Test Files:** 2+
- **Supported File Types:** PNG, JPG, JPEG, PDF, TIFF

---

## 🛠️ Technical Stack

| Component | Technology |
|-----------|-----------|
| OCR AI Service | Python 3.11 + FastAPI + Tesseract |
| Blockchain API | Node.js + Express.js |
| OCR Backend | Node.js + Express.js + Sequelize |
| Frontend | React + Vite + TypeScript |
| Database | PostgreSQL 15 |

---

## 📝 Notes

- All services are containerized with Docker
- CORS is enabled for all services
- OCR AI Service is the primary OCR endpoint (most stable)
- Blockchain API includes WebSocket support
- Test files are included in the ocr-backend directory

---

## 🎉 What's Working

✅ Dashboard Frontend (3000) - Main web interface
✅ Blockchain API (3001) - Event management & analytics
✅ GhostBuster Frontend (3004) - Ghost detection UI
✅ Whistlepro Backend (3005) - Whistleblower system
✅ Whistlepro/VRT Module (3006) - Additional module
✅ OCR Backend (4000) - Document processing backend
✅ API Gateway (4001) - Central routing
✅ OCR AI Service (5000) - Full verification workflow
✅ GhostBuster Backend (5001) - Ghost detection engine
✅ Anomaly Tracker (5002) - AI risk scoring
✅ VRT Guard (5003) - VAT tracking
✅ PostgreSQL (5432) - Database
✅ API Documentation - Complete guides
✅ Postman Collections - Ready to import

---

**Last Updated:** 2025-10-26
**Version:** 2.0.0
**Status:** Production Ready - All 12 Services Operational
