# ZRA TaxGuard AI - Quick Start Guide for Team Members

## 🚀 Getting Started (After Pulling from Main Branch)

### Step 1: Clone or Pull the Repository

```bash
# If you don't have the repo yet
git clone https://github.com/kaps10000/ZRA-Hackathon-TaxGuard-AI-GhostBuster.git
cd ZRA-Hackathon-TaxGuard-AI-GhostBuster

# If you already have it, just pull the latest
git checkout main
git pull origin main
```

---

## ✅ Prerequisites Check

Before starting, make sure you have these installed:

### 1. Node.js (v18+)
```bash
node --version
# Should show v18.x.x or higher

# If not installed (Ubuntu/Debian):
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs
```

### 2. Python 3 (v3.10+)
```bash
python3 --version
# Should show Python 3.10.x or higher

# If not installed (Ubuntu/Debian):
sudo apt-get update
sudo apt-get install python3 python3-pip python3-venv
```

### 3. PostgreSQL (v15+)
```bash
pg_isready
# Should show "accepting connections"

# If not installed (Ubuntu/Debian):
sudo apt-get install postgresql postgresql-contrib
sudo service postgresql start
```

---

## 🎯 One-Command Setup (Recommended)

### Option A: Use the Automated Script

```bash
# Make script executable
chmod +x start-all-services.sh

# Run it!
./start-all-services.sh
```

**That's it!** The script will:
- ✅ Check all prerequisites
- ✅ Install all dependencies automatically
- ✅ Start all 10 services
- ✅ Set up PostgreSQL if needed

**Wait 10 seconds**, then open your browser to:
**👉 http://localhost:3000**

---

## 🛠️ Manual Setup (If Script Fails)

### Step 1: Setup PostgreSQL Database

```bash
# Start PostgreSQL
sudo service postgresql start

# Create database
sudo -u postgres psql -c "CREATE DATABASE zra_taxguard;"

# Set password
sudo -u postgres psql -c "ALTER USER postgres WITH PASSWORD 'zrapassword';"
```

### Step 2: Install Dependencies for Each Service

```bash
# 1. API Gateway
cd api-gateway
npm install
cd ..

# 2. Frontend Dashboard
cd dashboard_integration/frontend
npm install
cd ../..

# 3. VRT Guard
cd vrt_guard
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
deactivate
cd ..

# 4. Anomaly Tracker (AI Risk Scoring)
cd ai_risk_scoring
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
deactivate
cd ..

# 5. Predictive Analytics
cd predictive_analytics
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
deactivate
cd ..

# 6. GhostBuster Backend
cd ghostbuster/backend
npm install
cd ../..

# 7. OCR AI Service
cd ocr-ai-service
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
deactivate
cd ..

# 8. OCR Backend
cd ocr-backend
npm install
cd ..

# 9. Blockchain Service
cd blockchain
npm install
cd ..

# 10. WhistlePro Backend
cd whistlepro_backend
npm install
cd ..
```

### Step 3: Start All Services Manually

Open **10 separate terminal windows** and run these commands:

**Terminal 1 - API Gateway (Port 4001)**
```bash
cd api-gateway
PORT=4001 node server.js
```

**Terminal 2 - Frontend Dashboard (Port 3000)**
```bash
cd dashboard_integration/frontend
npm run dev
```

**Terminal 3 - VRT Guard (Port 5002)**
```bash
cd vrt_guard
source venv/bin/activate
python app.py
```

**Terminal 4 - Anomaly Tracker (Port 5001)**
```bash
cd ai_risk_scoring
source venv/bin/activate
PYTHONPATH=$(pwd) python api/scoring_api.py
```

**Terminal 5 - Predictive Analytics (Port 3004)**
```bash
cd predictive_analytics
source venv/bin/activate
python api.py
```

**Terminal 6 - GhostBuster Backend (Port 3005)**
```bash
cd ghostbuster/backend
npm start
```

**Terminal 7 - OCR AI Service (Port 8000)**
```bash
cd ocr-ai-service
source venv/bin/activate
uvicorn main:app --host 0.0.0.0 --port 8000
```

**Terminal 8 - OCR Backend (Port 5000)**
```bash
cd ocr-backend
PORT=5000 node server.js
```

**Terminal 9 - Blockchain Service (Port 3001)**
```bash
cd blockchain
npm start
```

**Terminal 10 - WhistlePro Backend (Port 3005)**
```bash
cd whistlepro_backend
npm start
```

---

## 🌐 Accessing the Dashboard

Once all services are running, open your browser and go to:

**👉 http://localhost:3000**

You should see the **TaxGuard AI Dashboard** with:
- Blue sidebar with navigation
- All 10 modules accessible:
  - Dashboard Overview
  - Database Viewer
  - OCR Document Scanner (with batch upload!)
  - WhistlePro Cases
  - GhostBuster Detection
  - Anomaly Tracker
  - Predictive Analytics (enhanced with severity indicators)
  - VRT Guard
  - Blockchain Ledger
  - Past Cases

---

## 🔍 Verify All Services Are Running

Run this command to check all services:

```bash
# Check API Gateway
curl http://localhost:4001/health

# Check Frontend
curl http://localhost:3000

# Check VRT Guard
curl http://localhost:5002/health

# Check Anomaly Tracker
curl http://localhost:5001/health

# Check Predictive Analytics
curl http://localhost:3004/health

# Check OCR AI Service
curl http://localhost:8000/docs

# Check OCR Backend
curl http://localhost:5000

# Check Blockchain
curl http://localhost:3001/health

# Check GhostBuster/WhistlePro
curl http://localhost:3005/health
```

If all return responses, you're good to go! ✅

---

## 🛑 Stopping All Services

To stop everything:

```bash
./stop-all-services.sh
```

Or manually:

```bash
pkill -f "node server.js"
pkill -f "npm run dev"
pkill -f "npm start"
pkill -f "python app.py"
pkill -f "python api.py"
pkill -f "python.*scoring_api"
pkill -f "uvicorn main"
```

---

## 🐛 Common Issues & Solutions

### Issue 1: Port Already in Use

**Error:** `EADDRINUSE: address already in use :::3000`

**Solution:**
```bash
# Find what's using the port
lsof -i :3000

# Kill the process
kill -9 <PID>
```

### Issue 2: PostgreSQL Not Running

**Error:** `FATAL: role "postgres" does not exist`

**Solution:**
```bash
# Start PostgreSQL
sudo service postgresql start

# Check status
pg_isready
```

### Issue 3: Python Module Not Found

**Error:** `ModuleNotFoundError: No module named 'flask'`

**Solution:**
```bash
# Make sure virtual environment is activated
source venv/bin/activate

# Reinstall dependencies
pip install -r requirements.txt
```

### Issue 4: Frontend Shows Plain HTML (No Styling)

**Error:** Frontend displays without colors/styling

**Solution:**
```bash
# Stop frontend
pkill -f vite

# Clear cache and restart
cd dashboard_integration/frontend
rm -rf node_modules/.vite
npm run dev
```

### Issue 5: Permission Denied on Scripts

**Error:** `Permission denied: ./start-all-services.sh`

**Solution:**
```bash
chmod +x start-all-services.sh
chmod +x stop-all-services.sh
```

---

## 📊 Service Ports Reference

| Service | Port | URL |
|---------|------|-----|
| Frontend Dashboard | 3000 | http://localhost:3000 |
| API Gateway | 4001 | http://localhost:4001 |
| Blockchain Service | 3001 | http://localhost:3001 |
| Predictive Analytics | 3004 | http://localhost:3004 |
| GhostBuster/WhistlePro | 3005 | http://localhost:3005 |
| OCR Backend | 5000 | http://localhost:5000 |
| Anomaly Tracker | 5001 | http://localhost:5001 |
| VRT Guard | 5002 | http://localhost:5002 |
| OCR AI Service | 8000 | http://localhost:8000 |

---

## 📝 Logs Location

All service logs are stored in:
```
/tmp/taxguard-logs/
```

View logs:
```bash
# API Gateway
tail -f /tmp/taxguard-logs/api-gateway.log

# Frontend
tail -f /tmp/taxguard-logs/frontend.log

# VRT Guard
tail -f /tmp/taxguard-logs/vrt-guard.log

# Anomaly Tracker
tail -f /tmp/taxguard-logs/anomaly-tracker.log

# And so on...
```

---

## 💡 Development Tips

### Running Only Specific Services

You can start individual services instead of all 10:

```bash
# Example: Only frontend + API gateway
cd api-gateway && PORT=4001 node server.js &
cd dashboard_integration/frontend && npm run dev &
```

### Hot Reload

- **Frontend (React/Vite):** Auto-reloads on file changes ✅
- **Backend (Node.js):** Restart service after changes
- **Python Services:** Restart service after changes

### Environment Variables

Each service can be configured via `.env` files in their respective directories. Default values are set for local development.

---

## 📚 Additional Documentation

- **Complete Setup Guide:** See [SETUP.md](./SETUP.md)
- **Feature Overview:** See [README.md](./README.md)
- **Flash Drive Setup:** See [FLASH_DRIVE_SETUP.md](./FLASH_DRIVE_SETUP.md)

---

## 🤝 Need Help?

If you encounter issues:
1. Check the logs in `/tmp/taxguard-logs/`
2. Verify all prerequisites are installed
3. Make sure PostgreSQL is running
4. Ensure no port conflicts
5. Review the Common Issues section above

---

## ✅ Quick Checklist

Before starting work, make sure:
- [ ] Pulled latest code from main branch
- [ ] Node.js v18+ installed
- [ ] Python 3.10+ installed
- [ ] PostgreSQL running
- [ ] No port conflicts (check with `lsof -i :3000`)
- [ ] All services started (use `./start-all-services.sh`)
- [ ] Frontend accessible at http://localhost:3000

---

## 🎉 You're All Set!

Once everything is running, you'll have access to the full ZRA TaxGuard AI system with all features operational. Happy coding! 🚀
