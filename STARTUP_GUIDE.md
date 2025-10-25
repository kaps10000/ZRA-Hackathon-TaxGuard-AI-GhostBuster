# ZRA TaxGuard AI - Complete Startup Guide

**Last Updated:** October 25, 2025 @ 5:35 AM

---

## 🚀 Quick Start

### Start All Core Services
```powershell
.\Start-Core-Services.ps1
```

### Stop All Services
```powershell
.\Stop-All-Services.ps1
```

---

## 📋 What Gets Started

The `Start-Core-Services.ps1` script starts **6 essential services** in the correct order:

| # | Service | Port | Purpose | Directory |
|---|---------|------|---------|-----------|
| 1 | **Dashboard Frontend** | 3000 | Main UI | `dashboard_integration\frontend` |
| 2 | **VRT Guard (NEW)** | 5000 | VAT Fraud Detection | `ZRA Tax Refund NEW` |
| 3 | **GhostBuster Backend** | 3005 | Ghost Detection API | `GhostBuster\backend` |
| 4 | **GhostBuster Frontend** | 3004 | Ghost Detection UI | `GhostBuster\frontend` |
| 5 | **API Gateway** | 4001 | Dashboard Data Aggregation | `api-gateway` |
| 6 | **Predictive Analytics** | 5003 | Revenue Forecasting | `predictive_analytics` |

---

## ✅ What's Fixed

### 1. **Correct VRT Guard Version**
- ✅ Now starts the NEW VRT Guard from `E:\ZRA PROJECT\ZRA Tax Refund NEW`
- ✅ Runs on port 5000
- ✅ Has all the latest features and datasets

### 2. **GhostBuster Datasets Loading**
- ✅ Backend loads datasets successfully on startup
- ✅ Fixed Unicode encoding issues
- ✅ Statistics display works correctly
- ✅ Shows 607K NAPSA records, 10K employees, 3.6M bank transactions

### 3. **Predictive Analytics Working**
- ✅ Runs on port 5003 (no more port conflicts)
- ✅ Copper Price Impact working
- ✅ Compliance Impact working
- ✅ Revenue forecasting working

### 4. **Dashboard Overview Fixed**
- ✅ API Gateway running on port 4001
- ✅ Dashboard loads all metrics correctly

### 5. **No More Errors**
- ✅ Uses `powershell` instead of `pwsh` (PowerShell Core)
- ✅ Proper UTF-8 encoding for Python services
- ✅ Each service runs in its own labeled window
- ✅ Correct startup delays between services

---

## 🎯 Access URLs

Once all services are running, access them here:

### Main Dashboard
**http://localhost:3000**

From the dashboard, you can navigate to:
- **Overview** - System-wide metrics and alerts
- **VRT Guard** - VAT fraud detection (embeds port 5000)
- **GhostBuster Detection** - Ghost employee detection (embeds port 3004)
- **Predictive Analytics** - Revenue forecasts and scenarios

### Direct Access (Alternative)
- **VRT Guard:** http://localhost:5000
- **GhostBuster:** http://localhost:3004
- **API Gateway Health:** http://localhost:4001/health
- **Predictive Analytics Health:** http://localhost:5003/health

---

## 🛠️ Service Details

### 1. Dashboard Frontend (Port 3000)
**Technology:** React + Vite  
**Purpose:** Main user interface that embeds other services  
**Features:**
- System overview with metrics
- Integration of VRT Guard and GhostBuster
- Navigation to all modules

**Startup Command:**
```bash
cd dashboard_integration/frontend
npm run dev
```

---

### 2. VRT Guard - NEW (Port 5000)
**Technology:** Python Flask + ML Model  
**Purpose:** VAT refund fraud detection  
**Location:** `E:\ZRA PROJECT\ZRA Tax Refund NEW`

**Features:**
- Upload VAT return CSV/JSON
- AI-powered fraud probability scoring
- Risk level classification (HIGH/MEDIUM/LOW)
- Detailed risk factor analysis
- Auditor recommendations

**Datasets:**
- ZRA taxpayer master
- VAT claims
- Purchase/sales transactions
- Customs data
- Compliance history
- PACRA data

**Startup Command:**
```bash
cd "ZRA Tax Refund NEW"
python app.py
```

---

### 3. GhostBuster Backend (Port 3005)
**Technology:** Python Flask  
**Purpose:** Ghost employee detection API  

**Features:**
- Individual employee analysis
- Batch CSV upload
- Statistics dashboard
- Export results to CSV/JSON

**Datasets Loaded:**
- 607,019 NAPSA contribution records
- 10,000 Home Affairs death registry records
- 3,695,750 bank transaction records
- 10,000 master employee records

**Ghost Detection:**
- DECEASED: 1,000 employees
- DUPLICATE: 800 employees
- PHANTOM: 700 employees
- OVER_AGE: 500 employees
- LEGITIMATE: 7,000 employees

**Startup Command:**
```bash
cd GhostBuster/backend
python app.py
```

---

### 4. GhostBuster Frontend (Port 3004)
**Technology:** React + Material-UI  
**Purpose:** Ghost employee detection UI  

**Features:**
- Search by NRC
- Batch upload CSV
- Beautiful statistics dashboard
- Risk level visualization
- Export functionality

**Connects to:** GhostBuster Backend (port 3005)

**Startup Command:**
```bash
cd GhostBuster/frontend
npm start
```

---

### 5. API Gateway (Port 4001)
**Technology:** Node.js Express  
**Purpose:** Aggregates data from all backend services for the dashboard  

**Provides:**
- `/api/dashboard/feed` - Dashboard overview data
- `/api/dashboard/stats` - System statistics
- WebSocket support for real-time updates

**Startup Command:**
```bash
cd api-gateway
node server.js
```

---

### 6. Predictive Analytics (Port 5003)
**Technology:** Python Flask  
**Purpose:** Revenue forecasting and scenario analysis  

**Features:**
- Revenue forecast (1-24 months)
- Copper price impact analysis
- Tax compliance improvement scenarios
- Economic trend analysis

**Datasets:**
- 34 months of Zambian economic data
- Historical copper prices
- Bank of Zambia bond data
- Economic indicators

**Startup Command:**
```bash
cd predictive_analytics
.\venv\Scripts\python.exe api.py
```

---

## 🔍 Verification Steps

### After Starting Services

**1. Wait 30-60 seconds** for all services to initialize

**2. Check all ports are listening:**
```powershell
netstat -ano | findstr ":3000 :3004 :3005 :4001 :5000 :5003" | findstr "LISTENING"
```

Expected output:
```
  TCP    0.0.0.0:3000    ...    LISTENING
  TCP    0.0.0.0:3004    ...    LISTENING
  TCP    0.0.0.0:3005    ...    LISTENING
  TCP    0.0.0.0:4001    ...    LISTENING
  TCP    0.0.0.0:5000    ...    LISTENING
  TCP    0.0.0.0:5003    ...    LISTENING
```

**3. Test API endpoints:**
```powershell
# GhostBuster Backend
Invoke-RestMethod http://localhost:3005/api/stats

# API Gateway
Invoke-RestMethod http://localhost:4001/health

# Predictive Analytics
Invoke-RestMethod http://localhost:5003/health
```

**4. Open Dashboard:**
```
http://localhost:3000
```

---

## 🐛 Troubleshooting

### Service Won't Start - Port Already in Use

**Problem:** Error message about port already in use

**Solution:**
```powershell
# Stop all services first
.\Stop-All-Services.ps1

# Wait 5 seconds
Start-Sleep -Seconds 5

# Start again
.\Start-Core-Services.ps1
```

---

### GhostBuster Statistics Not Loading

**Problem:** Statistics page shows "Loading..." or error

**Solution:**
1. Verify backend is running:
   ```powershell
   Invoke-RestMethod http://localhost:3005/api/stats
   ```
2. Check backend window for dataset loading messages
3. Should see: `[OK] Loaded X records` for each dataset

---

### VRT Guard Showing Old Version

**Problem:** VRT Guard looks different than expected

**Solution:**
1. Check which port is being used in the dashboard
2. Should be port 5000 (NEW version)
3. Old version was on port 5002
4. Restart services with `Start-Core-Services.ps1`

---

### Dashboard Overview Not Loading

**Problem:** Dashboard shows loading spinner indefinitely

**Solution:**
1. Verify API Gateway is running:
   ```powershell
   Invoke-RestMethod http://localhost:4001/health
   ```
2. Check API Gateway window for errors
3. Restart if needed

---

### Predictive Analytics Not Working

**Problem:** Copper/Compliance impact shows connection error

**Solution:**
1. Verify service is on port 5003:
   ```powershell
   netstat -ano | findstr ":5003"
   ```
2. Test endpoint:
   ```powershell
   Invoke-RestMethod http://localhost:5003/health
   ```

---

## 📦 Additional Services (Not Started by Default)

These services are available but not started by the core script:

| Service | Port | Start Command |
|---------|------|---------------|
| **Blockchain Service** | 3001 | `cd blockchain; npm start` |
| **WhistlePro Backend** | 4000 | `cd whistlepro_backend; node src/server.js` |
| **Anomaly Tracker** | 5001 | `cd ai_risk_scoring; .\venv\Scripts\python.exe -m api.scoring_api` |
| **VRT Guard (Old)** | 5002 | `cd vrt_guard; .\venv\Scripts\python.exe app.py` |
| **Main Flask Backend** | 5000* | `python app.py` |

*Note: Port 5000 conflict with NEW VRT Guard

---

## 💾 Backup Startup Methods

### Option 1: Manual Startup (Individual Services)

If you prefer to start services individually:

```powershell
# Terminal 1: Dashboard
cd "E:\ZRA PROJECT\dashboard_integration\frontend"
npm run dev

# Terminal 2: VRT Guard NEW
cd "E:\ZRA PROJECT\ZRA Tax Refund NEW"
python app.py

# Terminal 3: GhostBuster Backend
cd "E:\ZRA PROJECT\GhostBuster\backend"
python app.py

# Terminal 4: GhostBuster Frontend
cd "E:\ZRA PROJECT\GhostBuster\frontend"
npm start

# Terminal 5: API Gateway
cd "E:\ZRA PROJECT\api-gateway"
node server.js

# Terminal 6: Predictive Analytics
cd "E:\ZRA PROJECT\predictive_analytics"
.\venv\Scripts\python.exe api.py
```

---

### Option 2: Using Batch Files (GhostBuster Only)

```batch
cd "E:\ZRA PROJECT\GhostBuster"
start_backend.bat    # Starts backend on 3005
start_frontend.bat   # Starts frontend on 3004
```

---

## 📊 System Requirements

- **Node.js:** Version 14+ (for frontend services)
- **Python:** Version 3.8+ (for backend services)
- **npm:** For JavaScript package management
- **PowerShell:** Windows PowerShell 5.1+ or PowerShell Core 7+

---

## 🎯 What to Do After Startup

1. **Open Dashboard:** http://localhost:3000
2. **Test VRT Guard:**
   - Click "VRT Guard" in navigation
   - Upload a VAT return CSV
   - Review fraud analysis results
3. **Test GhostBuster:**
   - Click "GhostBuster Detection"
   - Go to "Statistics" tab
   - Verify datasets loaded
   - Try analyzing an employee by NRC
4. **Test Predictive Analytics:**
   - Click "Predictive Analytics"
   - View revenue forecast
   - Try copper price scenario
   - Try compliance impact scenario

---

## ✅ Success Indicators

You'll know everything is working when:

- ✅ 6 PowerShell windows are open (one per service)
- ✅ Dashboard loads at http://localhost:3000
- ✅ GhostBuster statistics show dataset counts
- ✅ VRT Guard accepts file uploads
- ✅ Predictive Analytics shows forecasts
- ✅ No error messages in service windows
- ✅ All metrics display on dashboard overview

---

**For questions or issues, refer to:**
- `COMPLETE_FIX_SUMMARY.md` - All fixes applied
- `DASHBOARD_INTEGRATION_COMPLETE.md` - Integration details
- `DASHBOARD_FIXES_COMPLETE.md` - Dashboard and predictive analytics fixes

**Happy analyzing! 🎉**
