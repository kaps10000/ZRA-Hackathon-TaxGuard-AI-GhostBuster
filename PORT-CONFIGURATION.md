# ZRA TaxGuard AI - Port Configuration Guide

**Last Updated:** October 26, 2025
**Status:** ✅ ALL PORT CONFLICTS RESOLVED

---

## 🎯 Complete Port Assignment (NO CONFLICTS)

All services have been configured with unique, non-conflicting ports:

| Port | Service | Description | Status |
|------|---------|-------------|--------|
| **3000** | Dashboard Frontend | Main web interface (React + Vite) | ✅ FIXED |
| **3001** | Blockchain Service | Blockchain integration & audit trail | ✅ FIXED |
| **3004** | GhostBuster Frontend | Ghost employee detection UI | ✅ FIXED |
| **3005** | GhostBuster Backend | Ghost employee detection API | ✅ FIXED |
| **4000** | WhistlePro Backend | Anonymous whistleblower reporting | ✅ FIXED |
| **4001** | API Gateway | Central API aggregation | ✅ FIXED |
| **5000** | OCR Backend | OCR document processing backend | ✅ FIXED |
| **5001** | Anomaly Tracker | AI Risk Scoring service | ✅ FIXED |
| **5002** | VRT Guard (NEW) | VAT Refund Tax fraud detection | ✅ FIXED |
| **5003** | Predictive Analytics | Revenue forecasting | ✅ FIXED |
| **8000** | OCR AI Service | FastAPI OCR AI service | ✅ FIXED |
| **5432** | PostgreSQL | Database (not started by scripts) | ℹ️ Manual |

---

## 🔧 What Was Fixed

### Previous Port Conflicts:

1. **Port 5000 Conflict (RESOLVED)**
   - **Before:**
     - ZRA Tax Refund NEW (default)
     - ai_risk_scoring/api/scoring_api_improved.py (hardcoded)
     - OCR Backend
   - **After:**
     - OCR Backend → Port 5000 ✅
     - VRT Guard NEW → Port 5002 ✅
     - AI Risk Scoring moved to Port 5001 ✅

2. **Port 3005 (GhostBuster Backend)**
   - **Status:** Already correctly configured ✅
   - No conflicts detected

3. **Port Configuration Flexibility**
   - All Python services now support `PORT` environment variable
   - Easy to reconfigure without editing code

---

## 📝 Configuration Files Modified

### 1. ai_risk_scoring/api/scoring_api.py
```python
# Added PORT environment variable support
port = int(os.environ.get('PORT', 5001))
app.run(host='0.0.0.0', port=port, debug=False)
```

### 2. Start-ALL-Services.ps1
- Updated VRT Guard port: 5000 → 5002
- Updated Anomaly Tracker: correctly pointing to ai_risk_scoring
- Added OCR AI Service on port 8000
- Updated port conflict checker

### 3. Start-Core-Services.ps1
- Updated VRT Guard port: 5000 → 5002
- Updated port conflict checker
- Updated access URLs

---

## 🚀 How to Start All Services

### Option 1: All Services (Recommended)
```powershell
.\START-ALL-SERVICES-FIXED.ps1
```
**Starts:** All 11 services with proper port configuration

### Option 2: Core Services Only
```powershell
.\Start-Core-Services.ps1
```
**Starts:** 6 essential services

### Option 3: Using Original Script (Now Fixed)
```powershell
.\Start-ALL-Services.ps1
```
**Starts:** 10 services (updated with correct ports)

---

## 🌐 Service Access Points

### Main Dashboard
**URL:** http://localhost:3000
**Description:** Central hub for all services

### Core Services

| Service | URL | Health Check |
|---------|-----|--------------|
| API Gateway | http://localhost:4001 | http://localhost:4001/health |
| VRT Guard (NEW) | http://localhost:5002 | http://localhost:5002/health |
| Anomaly Tracker | http://localhost:5001 | http://localhost:5001/health |
| GhostBuster UI | http://localhost:3004 | - |
| GhostBuster API | http://localhost:3005 | http://localhost:3005/api/health |
| Predictive Analytics | http://localhost:5003 | http://localhost:5003/health |

### Additional Services

| Service | URL | Documentation |
|---------|-----|---------------|
| Blockchain | http://localhost:3001 | - |
| WhistlePro | http://localhost:4000 | http://localhost:4000/api |
| OCR Backend | http://localhost:5000 | - |
| OCR AI Service | http://localhost:8000 | http://localhost:8000/docs |

---

## ✅ Verification Commands

### Check All Ports Are Listening
```powershell
netstat -ano | findstr "3000 3001 3004 3005 4000 4001 5000 5001 5002 5003 8000"
```

Expected output should show `LISTENING` for all ports.

### Check Specific Service
```powershell
# GhostBuster Backend (Port 3005)
Invoke-RestMethod http://localhost:3005/api/health

# VRT Guard NEW (Port 5002)
Invoke-RestMethod http://localhost:5002/health

# Anomaly Tracker (Port 5001)
Invoke-RestMethod http://localhost:5001/health
```

---

## 🛑 Stop All Services

```powershell
.\Stop-All-Services.ps1
```

Or manually close each PowerShell window.

---

## 🔄 Service Startup Order

Services start in this optimized order to minimize dependencies:

1. **Dashboard Frontend** (3000) - 3s delay
2. **API Gateway** (4001) - 2s delay
3. **VRT Guard NEW** (5002) - 3s delay
4. **Anomaly Tracker** (5001) - 3s delay
5. **GhostBuster Frontend** (3004) - 3s delay
6. **GhostBuster Backend** (3005) - 4s delay (loads datasets)
7. **OCR AI Service** (8000) - 2s delay
8. **OCR Backend** (5000) - 2s delay
9. **Blockchain Service** (3001) - 2s delay
10. **WhistlePro Backend** (4000) - 2s delay
11. **Predictive Analytics** (5003) - 2s delay

**Total startup time:** ~60-90 seconds for full initialization

---

## 💡 Troubleshooting

### Port Already in Use
**Problem:** Service fails to start with "port already in use" error

**Solution:**
```powershell
# Kill process on specific port (e.g., 3005)
$processId = (Get-NetTCPConnection -LocalPort 3005).OwningProcess
Stop-Process -Id $processId -Force
```

### Service Not Responding
**Problem:** Service window opened but not responding

**Solution:**
1. Check the PowerShell window for error messages
2. Verify required dependencies are installed:
   ```powershell
   # For Python services
   cd "E:\ZRA PROJECT\[service-folder]"
   .\venv\Scripts\python.exe -m pip list

   # For Node services
   cd "E:\ZRA PROJECT\[service-folder]"
   npm list
   ```

### GhostBuster Backend Datasets Not Loading
**Problem:** Statistics show zero records

**Solution:**
```powershell
cd "E:\ZRA PROJECT\GhostBuster\backend"
python generate_datasets.py
```

### Wrong VRT Guard Version
**Problem:** VRT Guard showing old interface

**Solution:**
- Ensure using `ZRA Tax Refund NEW` folder (port 5002)
- Old version is in `vrt_guard` folder (not used)

---

## 📊 Service Dependencies

### Required Software
- **Node.js** 14+ (for frontend services)
- **Python** 3.8+ (for backend services)
- **PostgreSQL** 12+ (for database, optional)
- **npm** (for JavaScript packages)

### Virtual Environments
Python services use virtual environments:
- `ai_risk_scoring\venv`
- `predictive_analytics\venv`
- `ocr-ai-service\venv`
- `vrt_guard\venv` (old, not used)

---

## 📝 Environment Variables

Services support these environment variables:

```powershell
# Python services
$env:PYTHONIOENCODING = 'utf-8'  # UTF-8 encoding
$env:PORT = '5001'               # Custom port

# Node services
$env:PORT = '3000'               # Custom port
$env:NODE_ENV = 'development'    # Environment mode
```

---

## 🎯 Quick Reference

### Service Status Check
```powershell
# Quick status script
.\check-all-services.ps1
```

### Restart Single Service
```powershell
# Stop the service (close its window or kill process)
# Then start individually:
cd "E:\ZRA PROJECT\GhostBuster\backend"
python app.py
```

### Change Port for a Service
```powershell
# Set PORT environment variable before starting:
$env:PORT = '5005'
cd "E:\ZRA PROJECT\[service-folder]"
python app.py  # or node server.js
```

---

## 📞 Support

If you encounter issues:

1. Check this document for common solutions
2. Review the service's PowerShell window for errors
3. Check logs in the service directory
4. Verify all dependencies are installed
5. Ensure no firewall is blocking ports

---

**All port conflicts have been resolved. All services can now run simultaneously without issues! 🎉**
