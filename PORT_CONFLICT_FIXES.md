# ZRA TaxGuard AI - Port Conflict Fixes

**Issue Resolved:** GhostBuster backend stops working when using `Start-ALL-Services.ps1` instead of `Start-Core-Services.ps1`

## 🔍 Root Cause Analysis

The port conflicts were caused by multiple issues:

### 1. **Duplicate GhostBuster Directories**
- `E:\ZRA PROJECT\GhostBuster\` (uppercase G) - **CORRECT VERSION**
- `E:\ZRA PROJECT\ghostbuster\` (lowercase g) - **DUPLICATE/OLD VERSION**

Both contain identical `app.py` files that try to use port 3005.

### 2. **Flask App Port Conflicts**
Multiple Flask applications were competing for default ports:
- **VRT Guard NEW** (`ZRA Tax Refund NEW\app.py`) - Default port 5000
- **Main Flask Backend** (`app.py`) - Default port 5000
- **Anomaly Tracker** - Default port 5000

### 3. **Missing Environment Variables**
The startup scripts weren't setting explicit `PORT` environment variables, causing services to fall back to default ports and conflict with each other.

## ✅ Fixes Applied

### 1. **Updated Start-ALL-Services.ps1**

**Added Port Conflict Detection:**
```powershell
# Check for port conflicts and kill any existing services
$ports = @(3000, 3001, 3004, 3005, 4000, 4001, 5000, 5001, 5002, 5003)
foreach ($port in $ports) {
    $process = Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue
    if ($process) {
        # Kill existing process on that port
        Stop-Process -Id $processId -Force
    }
}
```

**Fixed Environment Variables:**
- **VRT Guard NEW:** `$env:PORT='5000'`
- **Main Flask Backend:** `$env:PORT='5001'` 
- **Anomaly Tracker:** `$env:PORT='5002'`

**Added Directory Clarification:**
- Explicitly uses `E:\ZRA PROJECT\GhostBuster\backend` (uppercase G)
- Added visual indicator in PowerShell window title

### 2. **Updated Start-Core-Services.ps1**

**Added Same Port Conflict Detection:**
- Checks ports: 3000, 3004, 3005, 4001, 5000, 5003
- Kills conflicting processes before starting services

**Added Explicit PORT Variables:**
- **VRT Guard NEW:** `$env:PORT='5000'`

### 3. **Created Verification Script**

**New File:** `Verify-All-Services.ps1`
- Checks if all 10 services are running on correct ports
- Tests HTTP endpoints for additional verification
- Provides troubleshooting guidance
- Shows quick access URLs

## 📋 Port Allocation (Final)

| Service | Port | Directory | Status |
|---------|------|-----------|--------|
| **Dashboard Frontend** | 3000 | `dashboard_integration\frontend` | ✅ Core |
| **Blockchain Service** | 3001 | `blockchain` | ⚡ Additional |
| **GhostBuster Frontend** | 3004 | `GhostBuster\frontend` | ✅ Core |
| **GhostBuster Backend** | 3005 | `GhostBuster\backend` | ✅ Core |
| **WhistlePro Backend** | 4000 | `whistlepro_backend` | ⚡ Additional |
| **API Gateway** | 4001 | `api-gateway` | ✅ Core |
| **VRT Guard (NEW)** | 5000 | `ZRA Tax Refund NEW` | ✅ Core |
| **Main Flask Backend** | 5001 | Root directory | ⚡ Additional |
| **Anomaly Tracker** | 5002 | `ai_risk_scoring` | ⚡ Additional |
| **Predictive Analytics** | 5003 | `predictive_analytics` | ✅ Core |

## 🚀 Usage Instructions

### Option 1: Core Services Only (Recommended)
```powershell
.\Start-Core-Services.ps1
```
**Starts:** 6 essential services including GhostBuster on port 3005

### Option 2: All Services
```powershell
.\Start-ALL-Services.ps1
```
**Starts:** All 10 services with proper port allocation

### Verification
```powershell
.\Verify-All-Services.ps1
```
**Checks:** All services are running on correct ports

### Stop All Services
```powershell
.\Stop-All-Services.ps1
```

## 🔧 Technical Details

### GhostBuster Backend Specifics
- **Correct Path:** `E:\ZRA PROJECT\GhostBuster\backend\app.py`
- **Port:** 3005 (hardcoded in app.py)
- **Window Title:** "GhostBuster Backend - Port 3005 (UPPERCASE G)"
- **API Endpoints:** `/api/health`, `/api/stats`, `/api/analyze/*`

### Flask App Port Resolution
All Flask apps now use this pattern:
```python
if __name__ == '__main__':
    app.run(host='0.0.0.0', port=int(os.environ.get('PORT', 5000)), debug=True)
```

The startup scripts set `$env:PORT='XXXX'` to override the default port 5000.

## 🐛 Troubleshooting

### If GhostBuster Still Doesn't Work:

1. **Check PowerShell Windows:**
   - Look for "GhostBuster Backend - Port 3005 (UPPERCASE G)"
   - Check for error messages in that window

2. **Verify Port Usage:**
   ```powershell
   netstat -ano | findstr ":3005"
   ```

3. **Test API Directly:**
   ```powershell
   Invoke-RestMethod http://localhost:3005/api/health
   ```

4. **Manual Restart:**
   ```powershell
   .\Stop-All-Services.ps1
   Start-Sleep -Seconds 5
   .\Start-Core-Services.ps1
   ```

### If Port Conflicts Persist:

1. **Kill All Node/Python Processes:**
   ```powershell
   Get-Process node,python | Stop-Process -Force
   ```

2. **Check for Hidden Services:**
   ```powershell
   Get-NetTCPConnection -State Listen | Where-Object {$_.LocalPort -in @(3000,3004,3005,4001,5000,5003)}
   ```

## ✅ Success Indicators

You'll know everything is working when:

- ✅ 6 PowerShell windows open (Core) or 10 windows (All)
- ✅ GhostBuster window shows "Port 3005 (UPPERCASE G)"
- ✅ Dashboard loads at http://localhost:3000
- ✅ GhostBuster Detection works in dashboard navigation
- ✅ `Verify-All-Services.ps1` shows all services running
- ✅ No "port already in use" errors in any window

## 📝 Files Modified

1. **Start-ALL-Services.ps1** - Added port conflict detection and explicit PORT variables
2. **Start-Core-Services.ps1** - Added port conflict detection and explicit PORT variables  
3. **Verify-All-Services.ps1** - New verification script (created)
4. **PORT_CONFLICT_FIXES.md** - This documentation (created)

---

**The GhostBuster backend should now work consistently whether you use `Start-Core-Services.ps1` or `Start-ALL-Services.ps1`!** 🎉
