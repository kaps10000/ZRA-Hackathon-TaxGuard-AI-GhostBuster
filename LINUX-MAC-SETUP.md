# ZRA TaxGuard AI - Linux/Mac Setup Guide

**For Linux and Mac users who cloned from GitHub**

## ⚠️ ESLint Permission Error Fix

If you get this error when running the dashboard:
```
EACCES: permission denied open .../node_modules/.cache/.eslintcache
```

### Quick Fix Options:

**Option 1: Delete node_modules and reinstall (Recommended)**
```bash
cd GhostBuster/frontend
rm -rf node_modules .cache
npm install
npm run start:unix
```

**Option 2: Fix permissions**
```bash
cd GhostBuster/frontend
sudo chown -R $USER:$USER node_modules
npm start
```

**Option 3: Disable ESLint completely**
```bash
cd GhostBuster/frontend
echo "DISABLE_ESLINT_PLUGIN=true" >> .env
npm start
```

---

## 🚀 Starting All Services on Linux/Mac

### Prerequisites:
- Node.js v16+ installed
- Python 3.9+ installed
- Git installed

### Step 1: Install Dependencies

**Install Node.js packages:**
```bash
cd ~/ZRA-Hackathon-TaxGuard-AI-GhostBuster

# Dashboard
cd dashboard_integration/frontend
npm install

# GhostBuster Frontend
cd ../../GhostBuster/frontend
npm install

# API Gateway
cd ../../api-gateway
npm install

# WhistlePro Backend
cd ../whistlepro_backend
npm install

# Blockchain
cd ../blockchain
npm install
```

**Install Python packages:**
```bash
cd ~/ZRA-Hackathon-TaxGuard-AI-GhostBuster

# GhostBuster Backend
cd GhostBuster/backend
pip install -r requirements.txt

# VRT Guard
cd ../../"ZRA Tax Refund NEW"
pip install -r requirements.txt

# AI Risk Scoring
cd ../ai_risk_scoring
pip install -r requirements.txt

# Predictive Analytics
cd ../predictive_analytics
pip install -r requirements.txt

# OCR AI Service
cd ../ocr-ai-service
pip install -r requirements.txt
```

### Step 2: Generate Datasets

**IMPORTANT: Generate the datasets before starting services**
```bash
cd ~/ZRA-Hackathon-TaxGuard-AI-GhostBuster/GhostBuster/backend
python generate_datasets.py
```

This creates:
- 607,019 NAPSA records
- 3,695,750 bank transactions
- 10,000 employee records
- Death registry data

### Step 3: Start Services

**Open multiple terminal tabs/windows and run:**

**Terminal 1 - Dashboard (Port 3000):**
```bash
cd ~/ZRA-Hackathon-TaxGuard-AI-GhostBuster/dashboard_integration/frontend
npm run dev
```

**Terminal 2 - API Gateway (Port 4001):**
```bash
cd ~/ZRA-Hackathon-TaxGuard-AI-GhostBuster/api-gateway
PORT=4001 node server.js
```

**Terminal 3 - VRT Guard (Port 5002):**
```bash
cd ~/ZRA-Hackathon-TaxGuard-AI-GhostBuster/"ZRA Tax Refund NEW"
PORT=5002 python app.py
```

**Terminal 4 - Anomaly Tracker (Port 5001):**
```bash
cd ~/ZRA-Hackathon-TaxGuard-AI-GhostBuster/ai_risk_scoring
PORT=5001 python -m api.scoring_api
```

**Terminal 5 - GhostBuster Frontend (Port 3004):**
```bash
cd ~/ZRA-Hackathon-TaxGuard-AI-GhostBuster/GhostBuster/frontend
PORT=3004 npm start
# OR if ESLint errors:
PORT=3004 DISABLE_ESLINT_PLUGIN=true npm start
```

**Terminal 6 - GhostBuster Backend (Port 3006):**
```bash
cd ~/ZRA-Hackathon-TaxGuard-AI-GhostBuster/GhostBuster/backend
GHOSTBUSTER_PORT=3006 python app.py
```

**Terminal 7 - Predictive Analytics (Port 5003):**
```bash
cd ~/ZRA-Hackathon-TaxGuard-AI-GhostBuster/predictive_analytics
python api.py
```

**Terminal 8 - Blockchain (Port 3001):**
```bash
cd ~/ZRA-Hackathon-TaxGuard-AI-GhostBuster/blockchain
PORT=3001 node api/index.js
```

**Terminal 9 - WhistlePro (Port 4000):**
```bash
cd ~/ZRA-Hackathon-TaxGuard-AI-GhostBuster/whistlepro_backend
PORT=4000 node src/server.js
```

**Terminal 10 - OCR AI Service (Port 8000):**
```bash
cd ~/ZRA-Hackathon-TaxGuard-AI-GhostBuster/ocr-ai-service
python main.py
```

---

## 🌐 Access the System

**Main Dashboard:**
```
http://localhost:3000
```

**Direct Service URLs:**
- GhostBuster: http://localhost:3004
- GhostBuster API: http://localhost:3006/api/stats
- VRT Guard: http://localhost:5002
- API Gateway: http://localhost:4001
- WhistlePro: http://localhost:4000
- Blockchain: http://localhost:3001
- OCR AI: http://localhost:8000/docs

---

## ✅ Verify All Services Running

```bash
# Check all ports are listening
netstat -tuln | grep "LISTEN" | grep -E ":(3000|3001|3004|3006|4000|4001|5001|5002|5003|8000)"
```

You should see 10 services running.

---

## 🔧 Troubleshooting

### Port Already in Use
```bash
# Find process using port (e.g., 3006)
lsof -i :3006

# Kill the process
kill -9 <PID>
```

### Permission Denied Errors
```bash
# Fix ownership of project
sudo chown -R $USER:$USER ~/ZRA-Hackathon-TaxGuard-AI-GhostBuster

# Or run with elevated permissions
sudo <command>
```

### Python Module Not Found
```bash
# Create virtual environment
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

### Node Modules Issues
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm cache clean --force
npm install
```

---

## 📋 Port Assignment Summary

| Port | Service | Type |
|------|---------|------|
| 3000 | Dashboard Frontend | React (Vite) |
| 3001 | Blockchain Service | Node.js |
| 3004 | GhostBuster Frontend | React |
| 3006 | GhostBuster Backend | Flask |
| 4000 | WhistlePro Backend | Node.js |
| 4001 | API Gateway | Node.js |
| 5001 | Anomaly Tracker | Flask |
| 5002 | VRT Guard | Flask |
| 5003 | Predictive Analytics | Flask |
| 8000 | OCR AI Service | FastAPI |

---

## 📝 Environment Variables

Create `.env` files where needed:

**GhostBuster Frontend (.env):**
```
PORT=3004
DISABLE_ESLINT_PLUGIN=true
ESLINT_NO_DEV_ERRORS=true
```

**GhostBuster Backend (.env):**
```
GHOSTBUSTER_PORT=3006
FLASK_ENV=development
```

---

## 🎯 Common Issues

**Issue: "Module not found" in Python**
- Solution: Install dependencies with `pip install -r requirements.txt`

**Issue: "Cannot find module" in Node**
- Solution: Run `npm install` in the service directory

**Issue: "Port already in use"**
- Solution: Kill the process or use a different port

**Issue: "Permission denied" on cache files**
- Solution: Set `DISABLE_ESLINT_PLUGIN=true` in `.env`

---

## 💡 Pro Tips

1. **Use tmux or screen** to manage multiple terminal sessions
2. **Create a startup script** for your environment (see below)
3. **Check logs** if a service fails to start

### Example Startup Script (start-all.sh):
```bash
#!/bin/bash

# Start all services in background with logging
cd ~/ZRA-Hackathon-TaxGuard-AI-GhostBuster

# Dashboard
cd dashboard_integration/frontend && npm run dev > /tmp/dashboard.log 2>&1 &

# GhostBuster Backend
cd ../../GhostBuster/backend && GHOSTBUSTER_PORT=3006 python app.py > /tmp/ghostbuster-backend.log 2>&1 &

# ... add other services ...

echo "All services started! Check logs in /tmp/"
```

---

**Need Help?** Open an issue on GitHub: https://github.com/kaps10000/ZRA-Hackathon-TaxGuard-AI-GhostBuster/issues

**Last Updated:** October 26, 2025
