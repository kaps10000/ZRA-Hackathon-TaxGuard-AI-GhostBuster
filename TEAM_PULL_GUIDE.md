# Team Pull Guide - Pre-Pull Checklist

## ⚠️ IMPORTANT: Do This BEFORE Pulling Latest Code

### Option 1: Fresh Start (Recommended for Clean Setup)

If you have an existing clone of the repo, the safest approach is to start fresh:

```bash
# 1. Navigate to parent directory (NOT inside the repo)
cd ~/Projects  # or wherever your repos are

# 2. Backup your old repo (if you have uncommitted work)
mv ZRA-Hackathon-TaxGuard-AI-GhostBuster ZRA-Hackathon-TaxGuard-AI-GhostBuster-OLD

# 3. Fresh clone
git clone https://github.com/kaps10000/ZRA-Hackathon-TaxGuard-AI-GhostBuster.git
cd ZRA-Hackathon-TaxGuard-AI-GhostBuster
```

### Option 2: Update Existing Repo (If you need to preserve work)

If you have existing work you need to keep:

#### Step 1: Stop ALL Running Services

```bash
# Kill all running processes on project ports
lsof -ti:3000 | xargs -r kill -9 2>/dev/null  # Dashboard
lsof -ti:4001 | xargs -r kill -9 2>/dev/null  # API Gateway
lsof -ti:5000 | xargs -r kill -9 2>/dev/null  # Anomaly Tracker
lsof -ti:5002 | xargs -r kill -9 2>/dev/null  # VRT Guard
lsof -ti:3004 | xargs -r kill -9 2>/dev/null  # GhostBuster Module
lsof -ti:3005 | xargs -r kill -9 2>/dev/null  # GhostBuster Backend
lsof -ti:8000 | xargs -r kill -9 2>/dev/null  # OCR AI
lsof -ti:3001 | xargs -r kill -9 2>/dev/null  # Blockchain
lsof -ti:4000 | xargs -r kill -9 2>/dev/null  # WhistlePro

# Stop Docker containers
docker-compose down
docker-compose -f docker-compose-full.yml down 2>/dev/null
```

#### Step 2: Backup Your Work

```bash
# Commit your local changes (if any)
git status
git add .
git commit -m "Backup: My local work before pulling latest"

# OR stash if you don't want to commit
git stash push -m "My local work - $(date)"
```

#### Step 3: Clean Build Artifacts

```bash
# Remove Python cache files
find . -type d -name "__pycache__" -exec rm -rf {} + 2>/dev/null
find . -type f -name "*.pyc" -delete 2>/dev/null
find . -type f -name "*.pyo" -delete 2>/dev/null

# Remove node_modules (will reinstall)
find . -type d -name "node_modules" -exec rm -rf {} + 2>/dev/null

# Remove virtual environments (will recreate)
find . -type d -name "venv" -maxdepth 2 -exec rm -rf {} + 2>/dev/null

# Remove log files
find . -type f -name "*.log" -delete 2>/dev/null
rm -rf api-gateway/logs/* 2>/dev/null
```

#### Step 4: Pull Latest Code

```bash
# Fetch latest changes
git fetch origin

# Switch to main branch and pull
git checkout main
git pull origin main

# If you get errors about local changes, force clean:
git reset --hard origin/main
git clean -fd
```

### Option 3: Docker-Only Approach (Simplest)

If you just want to run the system without development:

```bash
# 1. Fresh clone
git clone https://github.com/kaps10000/ZRA-Hackathon-TaxGuard-AI-GhostBuster.git
cd ZRA-Hackathon-TaxGuard-AI-GhostBuster

# 2. Run with Docker (no need to install dependencies)
docker-compose -f docker-compose-full.yml up -d

# 3. Access dashboard
# http://localhost:3000
```

---

## Common Issues & Solutions

### Issue 1: "Port already in use" errors

**Solution:**
```bash
# Kill processes on specific port (example: 3000)
lsof -ti:3000 | xargs -r kill -9

# Or kill all project ports at once (see Step 1 above)
```

### Issue 2: "Module not found" errors

**Cause:** Old dependencies or missing virtual environment

**Solution:**
```bash
# For Python services
cd <service-directory>
rm -rf venv
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# For Node services
cd <service-directory>
rm -rf node_modules package-lock.json
npm install
```

### Issue 3: Git pull conflicts

**Cause:** Local changes conflict with remote changes

**Solution:**
```bash
# See what files are conflicting
git status

# Option A: Keep remote version (discard local)
git reset --hard origin/main
git clean -fd

# Option B: Keep local changes
git stash
git pull origin main
git stash pop  # Manually resolve conflicts
```

### Issue 4: "Permission denied" on Linux/Mac

**Cause:** File permissions issues

**Solution:**
```bash
# Fix execute permissions for scripts
chmod +x scripts/*.sh 2>/dev/null

# If running Docker, add user to docker group
sudo usermod -aG docker $USER
# Log out and back in for this to take effect
```

### Issue 5: Old Docker images causing issues

**Solution:**
```bash
# Stop and remove all containers
docker-compose -f docker-compose-full.yml down

# Remove old images
docker-compose -f docker-compose-full.yml down --rmi all

# Rebuild from scratch
docker-compose -f docker-compose-full.yml build --no-cache
docker-compose -f docker-compose-full.yml up -d
```

---

## After Pulling: Setup Steps

### For Docker Setup (Recommended)

```bash
# 1. Start all services
docker-compose -f docker-compose-full.yml up -d

# 2. Check services are running
docker-compose -f docker-compose-full.yml ps

# 3. View logs if any service fails
docker-compose -f docker-compose-full.yml logs <service-name>

# 4. Access the dashboard
# Open http://localhost:3000
```

### For Development Setup (Manual)

See `INTEGRATION_SETUP.md` for detailed instructions.

Quick version:
```bash
# 1. Install API Gateway
cd api-gateway
npm install
PORT=4001 node server.js &

# 2. Install Dashboard
cd ../Dashboard
npm install
npm run dev &

# 3. Install VRT Guard
cd ../vrt_guard
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
PORT=5002 python app.py &

# 4. Install Anomaly Tracker
cd ../ai_risk_scoring
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
PORT=5000 PYTHONPATH=/absolute/path/to/ai_risk_scoring python api/scoring_api_improved.py &
```

---

## Verification Steps

After setup, verify everything works:

```bash
# Check all services are responding
curl http://localhost:3000  # Dashboard
curl http://localhost:4001/health  # API Gateway
curl http://localhost:5002/health  # VRT Guard
curl http://localhost:5000/health  # Anomaly Tracker
curl http://localhost:3004/health  # GhostBuster Module
curl http://localhost:3005/health  # GhostBuster Backend
```

---

## Quick Reference Commands

### Starting Services (Docker)
```bash
docker-compose -f docker-compose-full.yml up -d
```

### Stopping Services (Docker)
```bash
docker-compose -f docker-compose-full.yml down
```

### Viewing Logs (Docker)
```bash
docker-compose -f docker-compose-full.yml logs -f <service-name>
```

### Rebuilding After Code Changes (Docker)
```bash
docker-compose -f docker-compose-full.yml down
docker-compose -f docker-compose-full.yml build
docker-compose -f docker-compose-full.yml up -d
```

---

## Need Help?

1. Check `INTEGRATION_SETUP.md` for detailed setup instructions
2. Check `DOCKER_COMPLETE_SETUP.md` for Docker-specific help
3. Contact the team lead if issues persist

## System Requirements

- **Node.js**: v18 or higher
- **Python**: 3.8 or higher
- **Docker**: Latest version (if using Docker setup)
- **Git**: Latest version
- **RAM**: At least 8GB recommended
- **Disk Space**: At least 10GB free
