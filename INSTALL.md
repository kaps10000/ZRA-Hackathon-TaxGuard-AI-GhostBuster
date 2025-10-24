# ZRA TaxGuard AI - Installation Guide

## 🚀 Quick Install (All Dependencies)

We've created installation scripts that automatically install **ALL dependencies** for all 10 services with a single command!

---

## 📦 Installation Scripts

### For Linux / macOS:

```bash
# Make script executable
chmod +x install-dependencies.sh

# Run it!
./install-dependencies.sh
```

### For Windows:

```cmd
# Just double-click the file in Windows Explorer
install-dependencies.bat

# Or run from Command Prompt
install-dependencies.bat
```

---

## ✅ What the Script Does

The installation script will:

1. **Check Prerequisites**
   - ✅ Verify Node.js is installed (v18+)
   - ✅ Verify Python is installed (v3.10+)
   - ✅ Verify npm and pip are available

2. **Install Node.js Services** (6 services)
   - API Gateway
   - Frontend Dashboard
   - GhostBuster Backend
   - OCR Backend
   - Blockchain Service
   - WhistlePro Backend

3. **Install Python Services** (4 services)
   - VRT Guard
   - Anomaly Tracker (AI Risk Scoring)
   - Predictive Analytics
   - OCR AI Service

4. **Setup Virtual Environments**
   - Creates `venv` for each Python service
   - Installs all Python dependencies in isolated environments

---

## 📋 Prerequisites

Before running the installation script, make sure you have:

### Required Software:

1. **Node.js v18+**
   - **Linux/macOS:**
     ```bash
     curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
     sudo apt-get install -y nodejs
     ```
   - **Windows:**
     - Download from: https://nodejs.org/
     - Run installer and follow instructions

2. **Python 3.10+**
   - **Linux/macOS:**
     ```bash
     sudo apt-get update
     sudo apt-get install python3 python3-pip python3-venv
     ```
   - **Windows:**
     - Download from: https://www.python.org/
     - **Important:** Check "Add Python to PATH" during installation

3. **PostgreSQL 15+** (optional for now, needed to run services)
   - **Linux/macOS:**
     ```bash
     sudo apt-get install postgresql postgresql-contrib
     sudo service postgresql start
     ```
   - **Windows:**
     - Download from: https://www.postgresql.org/download/windows/
     - Run installer and follow instructions

---

## 🎯 After Installation

Once the script finishes successfully:

### 1. Setup PostgreSQL Database (if not done already)

**Linux/macOS:**
```bash
sudo service postgresql start
sudo -u postgres psql -c "CREATE DATABASE zra_taxguard;"
sudo -u postgres psql -c "ALTER USER postgres WITH PASSWORD 'zrapassword';"
```

**Windows:**
```sql
-- Open pgAdmin or psql and run:
CREATE DATABASE zra_taxguard;
ALTER USER postgres WITH PASSWORD 'zrapassword';
```

### 2. Start All Services

**Linux/macOS:**
```bash
./start-all-services.sh
```

**Windows:**
You'll need to start services manually (or create a Windows version of start script):
- See [QUICKSTART.md](./QUICKSTART.md) for manual startup instructions

### 3. Access the Dashboard

Open your browser and go to:
**👉 http://localhost:3000**

---

## 🔍 What Gets Installed

### Node.js Services:

| Service | Location | Dependencies |
|---------|----------|--------------|
| API Gateway | `api-gateway/` | express, cors, pg, etc. |
| Frontend | `dashboard_integration/frontend/` | react, vite, tailwindcss, etc. |
| GhostBuster | `ghostbuster/backend/` | express, axios, etc. |
| OCR Backend | `ocr-backend/` | express, multer, tesseract, etc. |
| Blockchain | `blockchain/` | express, crypto, etc. |
| WhistlePro | `whistlepro_backend/` | express, knex, etc. |

### Python Services:

| Service | Location | Dependencies |
|---------|----------|--------------|
| VRT Guard | `vrt_guard/` | flask, pandas, sklearn, etc. |
| Anomaly Tracker | `ai_risk_scoring/` | flask, xgboost, pandas, etc. |
| Predictive Analytics | `predictive_analytics/` | flask, pandas, numpy, etc. |
| OCR AI Service | `ocr-ai-service/` | fastapi, opencv, pdf2image, etc. |

---

## 🐛 Troubleshooting

### Issue 1: "Node.js not found"

**Solution:**
- Install Node.js from https://nodejs.org/
- Make sure it's added to your PATH
- Restart terminal/command prompt after installation
- Verify: `node --version`

### Issue 2: "Python not found"

**Windows Solution:**
- Reinstall Python from https://www.python.org/
- **Important:** Check "Add Python to PATH" during installation
- Or use `py` command instead of `python`

**Linux Solution:**
```bash
sudo apt-get install python3 python3-pip python3-venv
```

### Issue 3: "npm install failed"

**Solution:**
```bash
# Clear npm cache
npm cache clean --force

# Try again
npm install
```

### Issue 4: "pip install failed"

**Solution:**
```bash
# Upgrade pip
python3 -m pip install --upgrade pip

# Try again
pip install -r requirements.txt
```

### Issue 5: Script shows errors but some services installed

**Solution:**
- Check which services failed
- Navigate to that service directory
- Install manually:
  ```bash
  # For Node.js service
  npm install

  # For Python service
  python3 -m venv venv
  source venv/bin/activate  # Linux/Mac
  venv\Scripts\activate.bat  # Windows
  pip install -r requirements.txt
  ```

### Issue 6: Permission denied (Linux/macOS)

**Solution:**
```bash
chmod +x install-dependencies.sh
```

### Issue 7: Virtual environment creation fails

**Solution:**
```bash
# Install python3-venv package
sudo apt-get install python3-venv

# Or use virtualenv instead
pip3 install virtualenv
virtualenv venv
```

---

## 📊 Installation Progress

The script provides real-time feedback:

```
📋 Checking prerequisites...
✅ Node.js v18.19.0
✅ npm 10.2.3
✅ Python 3.10.12
✅ pip 24.0

🚀 Starting dependency installation...

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Installing Node.js Services
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📦 Installing dependencies for: API Gateway
   ✅ API Gateway dependencies installed
📦 Installing dependencies for: Frontend Dashboard
   ✅ Frontend Dashboard dependencies installed
...

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Installing Python Services
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📦 Installing dependencies for: VRT Guard
   Creating virtual environment...
   ✅ VRT Guard dependencies installed
...

╔═══════════════════════════════════════════════════════════╗
║        ✅ ALL DEPENDENCIES INSTALLED SUCCESSFULLY! ✅    ║
╚═══════════════════════════════════════════════════════════╝
```

---

## ⏱️ Installation Time

Expected installation time (varies by internet speed):

- **Fast Connection:** 3-5 minutes
- **Medium Connection:** 5-10 minutes
- **Slow Connection:** 10-20 minutes

---

## 💾 Disk Space Required

- **Node.js Dependencies:** ~1-2 GB
- **Python Dependencies:** ~500 MB - 1 GB
- **Total:** ~2-3 GB for all dependencies

---

## 🔄 Reinstalling Dependencies

If you need to reinstall everything:

**Linux/macOS:**
```bash
# Remove all dependencies
find . -name "node_modules" -type d -prune -exec rm -rf '{}' +
find . -name "venv" -type d -prune -exec rm -rf '{}' +

# Run install script again
./install-dependencies.sh
```

**Windows:**
```cmd
# Manually delete:
# - All node_modules folders
# - All venv folders

# Run install script again
install-dependencies.bat
```

---

## 🚀 Alternative: Manual Installation

If you prefer to install dependencies manually, see [QUICKSTART.md](./QUICKSTART.md) for step-by-step instructions.

---

## 📚 Additional Resources

- **Quick Start Guide:** [QUICKSTART.md](./QUICKSTART.md)
- **Complete Setup Guide:** [SETUP.md](./SETUP.md)
- **Feature Overview:** [README.md](./README.md)

---

## 💡 Tips

1. **Run script from project root:** Make sure you're in the main project directory when running the script

2. **Internet connection required:** The script downloads packages from npm and PyPI

3. **Antivirus software:** Some antivirus software may slow down installation (especially on Windows)

4. **Close other applications:** Free up system resources for faster installation

5. **Use administrator/sudo:** Some operations may require elevated privileges

---

## ✅ Success Checklist

After running the installation script, verify:

- [ ] All Node.js services have `node_modules` folders
- [ ] All Python services have `venv` folders
- [ ] No errors displayed in the output
- [ ] Script shows "ALL DEPENDENCIES INSTALLED SUCCESSFULLY!"

---

## 🎉 You're Ready!

Once installation is complete, you can start all services and begin using ZRA TaxGuard AI!

**Next:** Run `./start-all-services.sh` (Linux/macOS) to start all services.
