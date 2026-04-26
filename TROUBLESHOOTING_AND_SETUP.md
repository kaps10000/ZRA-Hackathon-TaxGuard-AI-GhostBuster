# ZRA TaxGuard AI - Troubleshooting & Complete Setup Guide

## 🚨 Common Issues & Solutions

### Issue 1: WebSocket Connection Failed
**Error**: `WebSocket connection to 'ws://localhost:4001/socket.io/' failed`

**Root Cause**: API Gateway was running without WebSocket support

**Solution Applied**:
- Modified `api-gateway/server.js` to include Socket.IO WebSocket support
- Added WebSocket initialization using existing `websocket.js` module
- Restarted API Gateway with WebSocket enabled

### Issue 2: WhistlePro "Failed to fetch reports" Error
**Error**: `Failed to fetch reports: AxiosError` - Connection refused to port 4000

**Root Cause**: 
- Frontend was trying to connect to `http://localhost:4000/api/reports`
- No WhistlePro route configured in API Gateway

**Solution Applied**:
- Created `api-gateway/routes/whistlepro.js` to proxy requests to WhistlePro backend
- Added route import and usage in `api-gateway/server.js`
- Updated frontend to use correct endpoint: `http://localhost:4001/api/whistlepro/reports`
- Restarted frontend to clear cache

### Issue 3: GhostBuster Empty Page (Sad Face Icon)
**Error**: GhostBuster frontend showing empty page with frown face icon

**Root Cause**: 
- GhostBuster frontend service wasn't running on port 3004
- Missing node_modules dependencies
- GhostBuster backend datasets not generated

**Solution Applied**:
- Generated datasets using `python3 generate_datasets.py` in GhostBuster/backend
- Installed frontend dependencies: `npm install` in GhostBuster/frontend
- Started GhostBuster backend on port 3006 with datasets loaded
- Started GhostBuster frontend on port 3004
- Disabled debug mode to prevent auto-reloading issues

### Issue 4: Predictive Analytics Service Not Starting
**Error**: `ModuleNotFoundError: No module named 'dateutil'`

**Root Cause**: Missing Python dependencies in externally-managed environment

**Solution Applied**:
- Created virtual environment for predictive analytics service
- Installed required dependencies: `python-dateutil`, `flask`, `pandas`, etc.
- Started service with virtual environment activated

---

## 🔧 Complete Setup Instructions

### Prerequisites
- Node.js v18+
- Python 3.10+
- PostgreSQL 15+

### Quick Setup (Recommended)
```bash
# Clone the repository
git clone <repository-url>
cd ZRA-Hackathon-TaxGuard-AI-GhostBuster

# Run the complete setup script
chmod +x complete-setup.sh
./complete-setup.sh
```

### Manual Setup (If Quick Setup Fails)

#### 1. Install System Dependencies
```bash
# Install Node.js, Python, PostgreSQL if not already installed
sudo apt update
sudo apt install nodejs npm python3 python3-pip python3-venv postgresql postgresql-contrib
```

#### 2. Setup PostgreSQL
```bash
sudo service postgresql start
sudo -u postgres createdb taxguard_db
```

#### 3. Setup Each Service

**API Gateway (Port 4001)**
```bash
cd api-gateway
npm install
PORT=4001 node server.js &
```

**Dashboard Frontend (Port 3000)**
```bash
cd dashboard_integration/frontend
npm install
npm run dev &
```

**GhostBuster Backend (Port 3006)**
```bash
cd GhostBuster/backend
python3 generate_datasets.py
GHOSTBUSTER_PORT=3006 python3 app.py &
```

**GhostBuster Frontend (Port 3004)**
```bash
cd GhostBuster/frontend
npm install
PORT=3004 DISABLE_ESLINT_PLUGIN=true npm start &
```

**WhistlePro Backend (Port 3005)**
```bash
cd whistlepro_backend
npm install
npm start &
```

**Other Services**
```bash
# VRT Guard (Port 5002)
cd vrt_guard
python3 -m venv venv && source venv/bin/activate
pip install -r requirements.txt
python app.py &

# Anomaly Tracker (Port 5001)
cd ai_risk_scoring
python3 -m venv venv && source venv/bin/activate
pip install -r requirements.txt
python api/scoring_api.py &

# Predictive Analytics (Port 3004)
cd predictive_analytics
python3 -m venv venv && source venv/bin/activate
pip install python-dateutil flask flask-cors pandas numpy scikit-learn
python api.py &

# OCR AI Service (Port 8000)
cd ocr-ai-service
python3 -m venv venv && source venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --host 0.0.0.0 --port 8000 &

# OCR Backend (Port 5000)
cd ocr-backend
npm install
node server.js &

# Blockchain Service (Port 3001)
cd blockchain
npm install
npm start &
```

---

## 🌐 Service Endpoints

| Service | Port | URL | Status Check |
|---------|------|-----|--------------|
| Dashboard Frontend | 3000 | http://localhost:3000 | Main UI |
| Blockchain Service | 3001 | http://localhost:3001 | http://localhost:3001/health |
| Predictive Analytics | 3004 | http://localhost:3004 | http://localhost:3004/health |
| GhostBuster Frontend | 3004 | http://localhost:3004 | UI |
| WhistlePro Backend | 3005 | http://localhost:3005 | http://localhost:3005/health |
| GhostBuster Backend | 3006 | http://localhost:3006 | http://localhost:3006/api/health |
| API Gateway | 4001 | http://localhost:4001 | http://localhost:4001/health |
| OCR Backend | 5000 | http://localhost:5000 | http://localhost:5000/health |
| Anomaly Tracker | 5001 | http://localhost:5001 | http://localhost:5001/health |
| VRT Guard | 5002 | http://localhost:5002 | http://localhost:5002/health |
| OCR AI Service | 8000 | http://localhost:8000 | http://localhost:8000/health |

---

## 🔍 Verification Commands

```bash
# Check all services are running
for port in 3000 3001 3004 3005 3006 4001 5000 5001 5002 8000; do
  echo -n "Port $port: "
  curl -s --max-time 2 http://localhost:$port/health > /dev/null && echo "✅ Running" || echo "❌ Not responding"
done

# Test API Gateway routes
curl -s http://localhost:4001/api/dashboard/feed | jq .
curl -s http://localhost:4001/api/whistlepro/reports | jq .
curl -s http://localhost:4001/api/ghostbuster/stats | jq .

# Test WebSocket connection (should show connection logs)
curl -s http://localhost:4001/health
```

---

## 📝 Logs Location
All service logs are stored in: `/tmp/taxguard-logs/`

```bash
# View logs
tail -f /tmp/taxguard-logs/api-gateway.log
tail -f /tmp/taxguard-logs/ghostbuster-backend-3006.log
tail -f /tmp/taxguard-logs/frontend.log
```

---

## 🛑 Stopping Services

```bash
# Stop all services
./stop-all-services.sh

# Or manually
pkill -f "node server.js"
pkill -f "npm start"
pkill -f "python.*app.py"
pkill -f "uvicorn"
```

---

## 🎯 Key Configuration Files Modified

1. **api-gateway/server.js** - Added WebSocket support
2. **api-gateway/routes/whistlepro.js** - Created WhistlePro proxy route
3. **dashboard_integration/frontend/src/pages/WhistlePro.jsx** - Fixed API endpoint
4. **GhostBuster/backend/app.py** - Disabled debug mode for stability

---

## 💡 Tips for Developers

1. **Always use the API Gateway** (port 4001) for frontend API calls
2. **Clear browser cache** when frontend changes don't appear
3. **Check logs** in `/tmp/taxguard-logs/` for debugging
4. **Use virtual environments** for Python services to avoid dependency conflicts
5. **Generate datasets** before starting GhostBuster backend
6. **Restart services** after configuration changes

---

## 🚀 Success Indicators

When everything is working correctly, you should see:
- ✅ Dashboard loads at http://localhost:3000
- ✅ WebSocket connected messages in browser console
- ✅ WhistlePro cases load without errors
- ✅ GhostBuster shows statistics and detection interface
- ✅ All 10+ services responding to health checks
- ✅ No connection refused errors in browser console

---

**Last Updated**: October 28, 2025
**Tested Environment**: Linux (Kali/Ubuntu)
