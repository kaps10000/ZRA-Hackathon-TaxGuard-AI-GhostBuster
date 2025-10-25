# 🎯 ZRA TaxGuard AI - Final Setup Instructions

**Last Updated:** October 25, 2025 at 2:10 AM

---

## ⚠️ Important: Service Management

The services were running but stopped because background PowerShell processes terminated when the session ended. To properly run the system, services must be started in **persistent windows**.

---

## 🚀 **RECOMMENDED: Start All Services with One Command**

### **Option 1: Use the Automated Startup Script** (EASIEST)

```batch
cd "E:\ZRA PROJECT"
START_ALL_SERVICES.bat
```

This will:
- ✅ Start all 9 services in separate windows
- ✅ Each service runs independently
- ✅ Services persist until you close their windows
- ✅ Easy to see which services are running
- ✅ Easy to stop individual services

**Wait 60 seconds** after running for all services to initialize.

---

## 🔍 **Check Service Status**

```powershell
cd "E:\ZRA PROJECT"
powershell -ExecutionPolicy Bypass -File check-all-services.ps1
```

This shows:
- Which services are running
- Which ports they're on
- Process IDs
- Overall system health percentage

---

## 📝 **Manual Service Startup** (Alternative)

If you prefer to start services individually:

### **Core Services:**

```batch
# 1. Main Dashboard (Port 3000)
cd "E:\ZRA PROJECT\dashboard_integration\frontend"
npm run dev

# 2. Main Flask Backend (Port 5000)
cd "E:\ZRA PROJECT"
python app.py

# 3. VRT Guard - UPDATED (Port 5002)
cd "E:\ZRA PROJECT\vrt_guard"
.\venv\Scripts\python.exe app.py

# 4. GhostBuster Backend - UPDATED (Port 3005)
cd "E:\ZRA PROJECT\GhostBuster"
start_backend.bat

# 5. GhostBuster Frontend - UPDATED (Port 3002)
cd "E:\ZRA PROJECT\GhostBuster"
start_frontend.bat
```

### **Additional Services:**

```batch
# 6. Anomaly Tracker (Port 5001)
cd "E:\ZRA PROJECT\ai_risk_scoring"
.\venv\Scripts\python.exe -m api.scoring_api

# 7. Predictive Analytics (Port 3004)
cd "E:\ZRA PROJECT\predictive_analytics"
.\venv\Scripts\python.exe api.py

# 8. WhistlePro Backend (Port 3006)
cd "E:\ZRA PROJECT\whistlepro_backend"
start_whistlepro.bat

# 9. Blockchain Service (Port 3001)
cd "E:\ZRA PROJECT\blockchain"
npm start
```

---

## ✅ **All Fixed Issues Summary**

### **Port Conflicts - RESOLVED:**
- ✅ GhostBuster Backend: 5000 → **3005**
- ✅ GhostBuster Frontend: 3000 → **3002**
- ✅ VRT Guard: Default → **5002**
- ✅ WhistlePro: 3005 → **3006**

### **Code Updates Applied:**
1. **GhostBuster Backend** - `app.py` updated to port 3005
2. **GhostBuster Frontend** - All 4 components updated to API port 3005
3. **VRT Guard** - Error handling added, port set to 5002
4. **WhistlePro** - server.js updated to port 3006
5. **Batch Scripts** - All startup scripts updated

### **Dependencies Fixed:**
- ✅ VRT Guard: flask-cors, xgboost, lightgbm, catboost, shap, plotly
- ✅ Predictive Analytics: python-dateutil
- ✅ All other services verified

---

## 🌐 **Access URLs After Startup**

| Service | URL | Description |
|---------|-----|-------------|
| **Main Dashboard** | http://localhost:3000 | Central dashboard |
| **GhostBuster UI** | http://localhost:3002 | Ghost employee detection interface |
| **GhostBuster API** | http://localhost:3005 | Backend API |
| **VRT Guard API** | http://localhost:5002 | VAT fraud detection API |
| **WhistlePro API** | http://localhost:3006 | Whistleblower system API |
| **Anomaly Tracker** | http://localhost:5001 | Risk scoring API |
| **Predictive Analytics** | http://localhost:3004 | Revenue forecasting API |
| **Main Backend** | http://localhost:5000 | Main ML backend |
| **Blockchain** | http://localhost:3001 | Blockchain service |

---

## 📊 **Expected System Status**

After starting all services, you should see:

```
Running Services: 9/12 (75%)
System Operational: 75%
```

**Not Running (by design):**
- OCR AI Service (Port 8000) - Needs disk space
- API Gateway Primary (Port 4001) - Using alternative on 4000
- API Gateway Alt (Port 4000) - May or may not be running

---

## 🧪 **Testing the Integration**

### **Test VRT Guard (Updated Module):**
```powershell
# Health check
Invoke-WebRequest http://localhost:5002/health

# Test endpoint
Invoke-RestMethod -Uri "http://localhost:5002/api/health" -Method Get
```

### **Test GhostBuster (Updated Module):**
```powershell
# Backend health
Invoke-WebRequest http://localhost:3005/api/health

# Frontend UI
Start-Process "http://localhost:3002"
```

### **Test Dashboard:**
```powershell
Start-Process "http://localhost:3000"
```

---

## 🐛 **Troubleshooting**

### **Service Won't Start - Port Already in Use:**
```powershell
# Find what's using the port
Get-NetTCPConnection -LocalPort <PORT> -State Listen

# Kill the process
Stop-Process -Id <PID> -Force
```

### **Python Service Errors:**
```batch
# Make sure you're using the virtual environment
cd "E:\ZRA PROJECT\<service_folder>"
.\venv\Scripts\python.exe <script>.py
```

### **Node Service Errors:**
```batch
# Make sure node_modules are installed
cd "E:\ZRA PROJECT\<service_folder>"
npm install
npm start
```

### **All Services Stopped:**
This happens when:
- PowerShell session ends
- Background processes are killed
- System restart

**Solution:** Re-run `START_ALL_SERVICES.bat`

---

## 📁 **Important Files Created**

1. **`START_ALL_SERVICES.bat`** - One-click startup for all services
2. **`check-all-services.ps1`** - Comprehensive service status checker
3. **`start_whistlepro.bat`** - WhistlePro startup script (in whistlepro_backend folder)
4. **`SYSTEM_INTEGRATION_COMPLETE.md`** - Full integration documentation
5. **`SERVICE_STATUS_REPORT.md`** - Detailed service analysis

---

## 🎯 **What's Working**

When all services are running:

✅ **VAT Fraud Detection** (VRT Guard - Updated)  
✅ **Ghost Employee Detection** (GhostBuster - Updated)  
✅ **Risk Scoring & Anomaly Detection**  
✅ **Revenue Forecasting**  
✅ **Blockchain Audit Trail**  
✅ **Whistleblower System**  
✅ **Batch Processing**  
✅ **Real-time Analysis**  
✅ **Multiple Dashboards**

---

## 🚨 **Known Limitations**

1. **OCR AI Service** - Not running (disk space issue)
2. **Model Version Warnings** - Services work but show scikit-learn version warnings
3. **No PostgreSQL** - Database-dependent features limited
4. **Services in Separate Windows** - Required for persistence

---

## 💡 **Best Practices**

1. **Always use `START_ALL_SERVICES.bat`** for complete system startup
2. **Check status** with `check-all-services.ps1` after starting
3. **Wait 60 seconds** for all services to initialize
4. **Keep service windows open** - closing them stops the service
5. **Use browser preview** in VS Code or direct browser access

---

## 📈 **Performance Notes**

- All services run in debug mode for development
- First startup may take 1-2 minutes
- Subsequent starts are faster (cached)
- Each service uses ~100-300MB RAM
- Total system footprint: ~2-3GB RAM

---

## 🎉 **Success Criteria**

You know the system is working when:
- ✅ 9+ services show as running in status check
- ✅ Dashboard loads at http://localhost:3000
- ✅ GhostBuster UI loads at http://localhost:3002
- ✅ VRT Guard responds at http://localhost:5002/health
- ✅ No port conflict errors
- ✅ All windows show "Running on..." messages

---

## 📞 **Support Commands**

```powershell
# Full status check
powershell -ExecutionPolicy Bypass -File check-all-services.ps1

# Start all services
START_ALL_SERVICES.bat

# Check specific port
Get-NetTCPConnection -LocalPort <PORT> -State Listen

# Kill specific process
Stop-Process -Id <PID> -Force

# View all Node processes
Get-Process node

# View all Python processes
Get-Process python
```

---

**System is ready to run!** Execute `START_ALL_SERVICES.bat` to begin. 🚀

All updated VRT Guard and GhostBuster modules are integrated and configured properly.
