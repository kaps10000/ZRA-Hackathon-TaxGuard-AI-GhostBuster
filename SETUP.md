# ZRA TaxGuard AI - Complete Setup Guide

## 🚀 Quick Start (No Docker Required!)

This guide will help you set up the entire ZRA TaxGuard AI system without Docker. All services run natively on your machine.

---

## 📋 Prerequisites

### System Requirements
- **OS**: Linux (Ubuntu/Debian recommended) or macOS
- **RAM**: Minimum 8GB (16GB recommended)
- **Storage**: 10GB free space

### Required Software

1. **Node.js & npm** (v18 or higher)
   ```bash
   # Check if installed
   node --version
   npm --version

   # Install if needed (Ubuntu/Debian)
   curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
   sudo apt-get install -y nodejs
   ```

2. **Python 3** (v3.10 or higher)
   ```bash
   # Check if installed
   python3 --version

   # Install if needed (Ubuntu/Debian)
   sudo apt-get update
   sudo apt-get install python3 python3-pip python3-venv
   ```

3. **PostgreSQL** (v15 or higher)
   ```bash
   # Install PostgreSQL
   sudo apt-get install postgresql postgresql-contrib

   # Start PostgreSQL
   sudo service postgresql start
   ```

---

## 🎯 Complete Installation Steps

### Step 1: Clone and Navigate
```bash
cd /home/$USER/ZRA-Hackathon-TaxGuard-AI-GhostBuster
```

### Step 2: Setup PostgreSQL Database
```bash
# Create database
sudo -u postgres psql -c "CREATE DATABASE zra_taxguard;"

# Set password
sudo -u postgres psql -c "ALTER USER postgres WITH PASSWORD 'zrapassword';"
```

### Step 3: Start All Services

We've created a simple startup script. Run this:

```bash
# Make the script executable
chmod +x start-all-services.sh

# Start all services
./start-all-services.sh
```

**OR** Start services manually (see below)

---

## 🔧 Manual Service Startup

### 1. API Gateway (Port 4001)
```bash
cd api-gateway
npm install
PORT=4001 node server.js &
```

### 2. Dashboard Frontend (Port 3000)
```bash
cd dashboard_integration/frontend
npm install
npm run dev &
```

### 3. VRT Guard - VAT Fraud Detection (Port 5002)
```bash
cd vrt_guard
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python app.py &
```

### 4. Anomaly Tracker - AI Risk Scoring (Port 5001)
```bash
cd ai_risk_scoring
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
PYTHONPATH=$(pwd) python api/scoring_api.py &
```

### 5. Predictive Analytics (Port 3004)
```bash
cd predictive_analytics
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python api.py &
```

### 6. GhostBuster Backend (Port 3005)
```bash
cd ghostbuster/backend
npm install
npm start &
```

### 7. OCR AI Service (Port 8000)
```bash
cd ocr-ai-service
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --host 0.0.0.0 --port 8000 &
```

### 8. OCR Backend (Port 5000)
```bash
cd ocr-backend
npm install
node server.js &
```

### 9. Blockchain Service (Port 3001)
```bash
cd blockchain
npm install
npm start &
```

### 10. WhistlePro Backend (Port 3005)
```bash
cd whistlepro_backend
npm install
npm start &
```

---

## ✅ Verify All Services

After starting all services, check they're running:

```bash
# Check services
curl http://localhost:4001/health  # API Gateway
curl http://localhost:3000         # Dashboard
curl http://localhost:5002/health  # VRT Guard
curl http://localhost:5001/health  # Anomaly Tracker
curl http://localhost:3004/health  # Predictive Analytics
curl http://localhost:3005/health  # GhostBuster Backend
curl http://localhost:8000/docs    # OCR AI Service
curl http://localhost:5000/health  # OCR Backend
curl http://localhost:3001/health  # Blockchain Service
```

---

## 🌐 Access the Dashboard

Once all services are running, open your browser:

**👉 http://localhost:3000**

You should see the TaxGuard AI Dashboard with:
- OCR Scanner (with batch upload)
- GhostBuster Detection
- Predictive Analytics
- VRT Guard
- Blockchain Ledger
- WhistlePro

---

## 🎨 Features Available

### 1. OCR Scanner
- Single document upload
- **Batch upload** (multiple documents at once)
- Real-time text extraction
- Data validation

### 2. Predictive Analytics
- Revenue forecasting
- Copper price impact analysis with:
  - Severity indicators (CRITICAL/HIGH/MEDIUM/LOW)
  - Mitigation strategies
  - Direct/Indirect impact breakdown
  - Affected sectors display
- Compliance impact analysis with:
  - Investment ROI analysis
  - Recommended actions
  - Payback period calculations

### 3. Blockchain Ledger
- View all verified transactions
- Real-time updates every 10 seconds
- Transaction details and hashes
- Immutable audit trail

### 4. GhostBuster Detection
- Ghost company detection
- Pattern analysis
- Risk scoring

### 5. VRT Guard
- VAT fraud detection
- Anomaly detection
- Compliance monitoring

---

## 🛠️ Troubleshooting

### Services Not Starting?

**Check logs:**
```bash
# All logs are in /tmp/
tail -f /tmp/api-gateway.log
tail -f /tmp/vrt-guard.log
tail -f /tmp/anomaly-tracker.log
# etc.
```

### Port Already in Use?

```bash
# Find process using port (e.g., 3000)
lsof -i :3000

# Kill process
kill -9 <PID>
```

### Database Connection Issues?

```bash
# Restart PostgreSQL
sudo service postgresql restart

# Check if running
pg_isready
```

### Python Dependencies Issues?

```bash
# Always use virtual environment
python3 -m venv venv
source venv/bin/activate
pip install --upgrade pip
pip install -r requirements.txt
```

---

## 📚 Individual Service Documentation

Each service has its own README with detailed information:

- [API Gateway](./api-gateway/README.md)
- [Dashboard Frontend](./dashboard_integration/frontend/README.md)
- [VRT Guard](./vrt_guard/README.md)
- [Anomaly Tracker](./ai_risk_scoring/README.md)
- [Predictive Analytics](./predictive_analytics/README.md)
- [GhostBuster](./ghostbuster/README.md)
- [OCR Services](./ocr-backend/README.md)
- [Blockchain](./blockchain/README.md)
- [WhistlePro](./whistlepro_backend/README.md)

---

## 🚫 Stopping All Services

```bash
# Kill all services
pkill -f "node server.js"
pkill -f "npm run dev"
pkill -f "python app.py"
pkill -f "uvicorn main"
```

---

## 💾 Environment Variables

Each service uses `.env` files. Default configurations are provided. You can customize them if needed.

**Important**: Database credentials are:
- Database: `zra_taxguard`
- User: `postgres`
- Password: `zrapassword`

---

## 🎯 Production Deployment

For production deployment, consider:
1. Using process managers (PM2 for Node.js, systemd for Python)
2. Setting up nginx as a reverse proxy
3. Enabling HTTPS/SSL certificates
4. Using production-grade database configurations
5. Implementing proper logging and monitoring

---

## 📞 Support

For issues or questions:
1. Check individual service READMEs
2. Review logs in `/tmp/`
3. Ensure all prerequisites are installed
4. Verify PostgreSQL is running

---

## 🎉 You're All Set!

Your TaxGuard AI system should now be fully operational. Open **http://localhost:3000** and explore all the features!
