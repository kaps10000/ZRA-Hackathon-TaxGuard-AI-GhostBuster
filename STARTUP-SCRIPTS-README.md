# ZRA TaxGuard AI - Startup Scripts Guide

## 🚀 Quick Start Options

### **Option 1: System Manager (Recommended)**
**File:** `SYSTEM-MANAGER.bat`
- **Best for:** Full control with menu options
- **Features:** Start, stop, status check, open dashboard
- **Usage:** Double-click and choose from menu

### **Option 2: One-Click Start**
**File:** `START-SYSTEM.bat`
- **Best for:** Quick startup without menus
- **Features:** Starts all core services automatically
- **Usage:** Double-click to start everything

### **Option 3: PowerShell Scripts**
**Files:** `Start-Core-Services.ps1`
- **Best for:** Advanced users who prefer PowerShell
- **Features:** Detailed output and error handling
- **Usage:** Right-click → "Run with PowerShell"

## 📋 Available Scripts

| Script | Purpose | When to Use |
|--------|---------|-------------|
| `SYSTEM-MANAGER.bat` | Full system management menu | Daily operations |
| `START-SYSTEM.bat` | One-click startup | Quick start |
| `CHECK-STATUS.bat` | View running services | Troubleshooting |
| `STOP-SYSTEM.bat` | Stop all services | Clean shutdown |
| `Start-Core-Services.ps1` | PowerShell core startup | Advanced users |
| `Start-ALL-Services.ps1` | PowerShell all services | Full system |
| `Quick-Status.ps1` | PowerShell status check | Quick verification |

## 🖥️ Desktop Shortcuts

Run `Create-Desktop-Shortcuts.ps1` to create convenient desktop shortcuts:
- **ZRA TaxGuard - System Manager** (Full control)
- **ZRA TaxGuard - Quick Start** (One-click startup)
- **ZRA TaxGuard - Status Check** (View status)
- **ZRA TaxGuard - Dashboard** (Open web interface)

## 🎯 Core Services Started

When you run the startup scripts, these services will start:

1. **Dashboard Frontend** (Port 3000) - Main web interface
2. **VRT Guard (NEW)** (Port 5000) - VAT fraud detection
3. **GhostBuster Backend** (Port 3005) - Ghost employee detection API
4. **GhostBuster Frontend** (Port 3004) - Ghost employee detection UI
5. **API Gateway** (Port 4001) - Dashboard data aggregation
6. **Predictive Analytics** (Port 5003) - Revenue forecasting

## 🌐 Access Points

Once services are running:
- **Main Dashboard:** http://localhost:3000
- **GhostBuster:** http://localhost:3004
- **VRT Guard:** http://localhost:5000
- **API Gateway:** http://localhost:4001/health
- **Predictive Analytics:** http://localhost:5003/health

## ⚡ Quick Commands

```batch
# Start everything (recommended)
SYSTEM-MANAGER.bat

# Quick start
START-SYSTEM.bat

# Check what's running
CHECK-STATUS.bat

# Stop everything
STOP-SYSTEM.bat
```

## 🔧 Troubleshooting

### Services Won't Start
1. Run `CHECK-STATUS.bat` to see what's running
2. Run `STOP-SYSTEM.bat` to clean shutdown
3. Wait 5 seconds, then run `START-SYSTEM.bat`

### Port Conflicts
- The scripts automatically detect and resolve port conflicts
- If issues persist, restart your computer

### Dashboard Not Loading
1. Check if services are running with `CHECK-STATUS.bat`
2. Ensure all 6 core services show as "OK"
3. Try accessing http://localhost:3000 directly

## 📝 Notes

- **First Time:** Use `SYSTEM-MANAGER.bat` to familiarize yourself
- **Daily Use:** Use `START-SYSTEM.bat` for quick startup
- **Monitoring:** Use `CHECK-STATUS.bat` to verify everything is running
- **Shutdown:** Always use `STOP-SYSTEM.bat` for clean shutdown

## 🎉 Success Indicators

You'll know the system is ready when:
- ✅ All 6 services show "OK" in status check
- ✅ Dashboard loads at http://localhost:3000
- ✅ No error messages in startup windows
- ✅ GhostBuster statistics display properly

---

**Happy analyzing! 🚀**
