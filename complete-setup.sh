#!/bin/bash

# ZRA TaxGuard AI - Complete Setup Script
# This script installs all dependencies and starts all services

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Get script directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$SCRIPT_DIR"

echo -e "${BLUE}╔═══════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║     🚀 ZRA TAXGUARD AI - COMPLETE SETUP SCRIPT 🚀       ║${NC}"
echo -e "${BLUE}╚═══════════════════════════════════════════════════════════╝${NC}"
echo ""

# Create logs directory
mkdir -p /tmp/taxguard-logs

echo -e "${YELLOW}📋 Step 1: Checking Prerequisites...${NC}"
echo ""

# Check Node.js
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js not found. Installing...${NC}"
    curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
    sudo apt-get install -y nodejs
fi
echo -e "${GREEN}✅ Node.js $(node --version)${NC}"

# Check Python
if ! command -v python3 &> /dev/null; then
    echo -e "${RED}❌ Python3 not found. Installing...${NC}"
    sudo apt-get update
    sudo apt-get install -y python3 python3-pip python3-venv
fi
echo -e "${GREEN}✅ Python $(python3 --version)${NC}"

# Check PostgreSQL
if ! command -v pg_isready &> /dev/null; then
    echo -e "${RED}❌ PostgreSQL not found. Installing...${NC}"
    sudo apt-get install -y postgresql postgresql-contrib
    sudo service postgresql start
fi

if ! pg_isready &> /dev/null; then
    echo -e "${YELLOW}⚠️  Starting PostgreSQL...${NC}"
    sudo service postgresql start
    sleep 2
fi
echo -e "${GREEN}✅ PostgreSQL running${NC}"

echo ""
echo -e "${YELLOW}📦 Step 2: Installing Dependencies...${NC}"
echo ""

# Install API Gateway dependencies
echo -e "${BLUE}Installing API Gateway dependencies...${NC}"
cd "$SCRIPT_DIR/api-gateway"
npm install --silent > /dev/null 2>&1
echo -e "${GREEN}✅ API Gateway dependencies installed${NC}"

# Install Dashboard Frontend dependencies
echo -e "${BLUE}Installing Dashboard Frontend dependencies...${NC}"
cd "$SCRIPT_DIR/dashboard_integration/frontend"
npm install --silent > /dev/null 2>&1
echo -e "${GREEN}✅ Dashboard Frontend dependencies installed${NC}"

# Install GhostBuster Frontend dependencies
echo -e "${BLUE}Installing GhostBuster Frontend dependencies...${NC}"
cd "$SCRIPT_DIR/GhostBuster/frontend"
npm install --silent > /dev/null 2>&1
echo -e "${GREEN}✅ GhostBuster Frontend dependencies installed${NC}"

# Install WhistlePro Backend dependencies
echo -e "${BLUE}Installing WhistlePro Backend dependencies...${NC}"
cd "$SCRIPT_DIR/whistlepro_backend"
npm install --silent > /dev/null 2>&1
echo -e "${GREEN}✅ WhistlePro Backend dependencies installed${NC}"

# Install OCR Backend dependencies
echo -e "${BLUE}Installing OCR Backend dependencies...${NC}"
cd "$SCRIPT_DIR/ocr-backend"
npm install --silent > /dev/null 2>&1
echo -e "${GREEN}✅ OCR Backend dependencies installed${NC}"

# Install Blockchain dependencies
echo -e "${BLUE}Installing Blockchain dependencies...${NC}"
cd "$SCRIPT_DIR/blockchain"
npm install --silent > /dev/null 2>&1
echo -e "${GREEN}✅ Blockchain dependencies installed${NC}"

# Setup Python services with virtual environments
echo -e "${BLUE}Setting up Python services...${NC}"

# GhostBuster Backend
cd "$SCRIPT_DIR/GhostBuster/backend"
if [ ! -d "venv" ]; then
    python3 -m venv venv
    source venv/bin/activate
    pip install flask flask-cors pandas numpy --quiet > /dev/null 2>&1
fi
echo -e "${GREEN}✅ GhostBuster Backend environment ready${NC}"

# VRT Guard
cd "$SCRIPT_DIR/vrt_guard"
if [ ! -d "venv" ]; then
    python3 -m venv venv
    source venv/bin/activate
    pip install -r requirements.txt --quiet > /dev/null 2>&1
fi
echo -e "${GREEN}✅ VRT Guard environment ready${NC}"

# Anomaly Tracker
cd "$SCRIPT_DIR/ai_risk_scoring"
if [ ! -d "venv" ]; then
    python3 -m venv venv
    source venv/bin/activate
    pip install -r requirements.txt --quiet > /dev/null 2>&1
fi
echo -e "${GREEN}✅ Anomaly Tracker environment ready${NC}"

# Predictive Analytics
cd "$SCRIPT_DIR/predictive_analytics"
if [ ! -d "venv" ]; then
    python3 -m venv venv
    source venv/bin/activate
    pip install python-dateutil flask flask-cors pandas numpy scikit-learn --quiet > /dev/null 2>&1
fi
echo -e "${GREEN}✅ Predictive Analytics environment ready${NC}"

# OCR AI Service
cd "$SCRIPT_DIR/ocr-ai-service"
if [ ! -d "venv" ]; then
    python3 -m venv venv
    source venv/bin/activate
    pip install -r requirements.txt --quiet > /dev/null 2>&1
fi
echo -e "${GREEN}✅ OCR AI Service environment ready${NC}"

# Generate GhostBuster datasets
echo -e "${BLUE}Setting up GhostBuster datasets...${NC}"
cd "$SCRIPT_DIR/GhostBuster/backend"

# Check if generate_datasets.py exists, if not create a basic version
if [ ! -f "generate_datasets.py" ]; then
    echo -e "${YELLOW}⚠️  generate_datasets.py missing, creating it...${NC}"
    cat > generate_datasets.py << 'EOF'
import pandas as pd
import numpy as np
from datetime import datetime, timedelta
import os

# Create data directory
os.makedirs('data', exist_ok=True)

print("=" * 60)
print("GhostBuster Dataset Generator")
print("=" * 60)

# Generate master employee records
print("Generating master employee records...")
np.random.seed(42)
employees = []
ghost_types = ['LEGITIMATE'] * 7000 + ['DECEASED'] * 1000 + ['DUPLICATE'] * 800 + ['PHANTOM'] * 700 + ['OVER_AGE'] * 500

for i in range(10000):
    employees.append({
        'employee_id': f'EMP{i+1:05d}',
        'nrc': f'{np.random.randint(100000, 999999)}/{np.random.randint(10, 99)}/{np.random.randint(1, 2)}',
        'name': f'Employee {i+1}',
        'date_of_birth': (datetime.now() - timedelta(days=np.random.randint(20*365, 65*365))).strftime('%Y-%m-%d'),
        'employment_start_date': (datetime.now() - timedelta(days=np.random.randint(30, 3650))).strftime('%Y-%m-%d'),
        'salary': np.random.randint(3000, 50000),
        'department': np.random.choice(['Finance', 'HR', 'IT', 'Operations', 'Sales']),
        'ghost_type': ghost_types[i],
        'death_date': (datetime.now() - timedelta(days=np.random.randint(1, 365))).strftime('%Y-%m-%d') if ghost_types[i] == 'DECEASED' else None
    })

df_employees = pd.DataFrame(employees)
df_employees.to_csv('data/master_records.csv', index=False)
print("✓ Generated 10000 master records")

# Generate NAPSA contributions
print("Generating NAPSA contribution records...")
napsa_records = []
for emp in employees[:8000]:  # Only legitimate + some ghosts have NAPSA records
    for month in range(1, 13):
        napsa_records.append({
            'nrc': emp['nrc'],
            'employee_id': emp['employee_id'],
            'contribution_date': f'2024-{month:02d}-01',
            'employee_contribution': emp['salary'] * 0.05,
            'employer_contribution': emp['salary'] * 0.05,
            'total_contribution': emp['salary'] * 0.10
        })

df_napsa = pd.DataFrame(napsa_records)
df_napsa.to_csv('data/napsa_contributions.csv', index=False)
print(f"✓ Generated {len(napsa_records)} NAPSA contribution records")

# Generate Home Affairs registry
print("Generating Home Affairs NRC registry...")
home_affairs = []
for emp in employees:
    home_affairs.append({
        'nrc': emp['nrc'],
        'full_name': emp['name'],
        'date_of_birth': emp['date_of_birth'],
        'death_date': emp['death_date'],
        'status': 'DECEASED' if emp['death_date'] else 'ALIVE'
    })

df_home_affairs = pd.DataFrame(home_affairs)
df_home_affairs.to_csv('data/home_affairs_registry.csv', index=False)
print("✓ Generated 10000 Home Affairs registry records")

# Generate bank transactions
print("Generating bank transaction records...")
bank_transactions = []
for emp in employees:
    if emp['ghost_type'] in ['LEGITIMATE', 'DECEASED']:  # Only some employees have bank records
        for month in range(1, 13):
            for week in range(1, 5):
                bank_transactions.append({
                    'nrc': emp['nrc'],
                    'employee_id': emp['employee_id'],
                    'transaction_date': f'2024-{month:02d}-{week*7:02d}',
                    'transaction_type': 'SALARY_DEPOSIT',
                    'amount': emp['salary'],
                    'bank_account': f'ACC{np.random.randint(100000, 999999)}'
                })

df_bank = pd.DataFrame(bank_transactions)
df_bank.to_csv('data/bank_transactions.csv', index=False)
print(f"✓ Generated {len(bank_transactions)} bank transaction records")

print("\n" + "=" * 60)
print("Dataset Generation Complete!")
print("=" * 60)
print(f"\nDatasets created in ./data/ directory:")
print(f"  - master_records.csv ({len(employees)} records)")
print(f"  - napsa_contributions.csv ({len(napsa_records)} records)")
print(f"  - home_affairs_registry.csv ({len(home_affairs)} records)")
print(f"  - bank_transactions.csv ({len(bank_transactions)} records)")

print(f"\nGhost Employee Distribution:")
print(df_employees['ghost_type'].value_counts())
print(f"\n✓ Ready to run GhostBuster detection engine!")
EOF
fi

# Fix app.py import if needed
if grep -q "from flask-cors import CORS" app.py 2>/dev/null; then
    sed -i 's/from flask-cors import CORS/from flask_cors import CORS/' app.py
fi

python3 generate_datasets.py > /dev/null 2>&1
echo -e "${GREEN}✅ GhostBuster datasets generated${NC}"

echo ""
echo -e "${YELLOW}🚀 Step 3: Starting All Services...${NC}"
echo ""

# Kill any existing services
pkill -f "node server.js" 2>/dev/null || true
pkill -f "npm start" 2>/dev/null || true
pkill -f "npm run dev" 2>/dev/null || true
pkill -f "python.*app.py" 2>/dev/null || true
pkill -f "uvicorn" 2>/dev/null || true
sleep 2

# Start API Gateway with WebSocket support
echo -e "${BLUE}Starting API Gateway (Port 4001)...${NC}"
cd "$SCRIPT_DIR/api-gateway"
PORT=4001 node server.js > /tmp/taxguard-logs/api-gateway.log 2>&1 &
echo -e "${GREEN}✅ API Gateway started (PID: $!)${NC}"

# Start Dashboard Frontend
echo -e "${BLUE}Starting Dashboard Frontend (Port 3000)...${NC}"
cd "$SCRIPT_DIR/dashboard_integration/frontend"
npm run dev > /tmp/taxguard-logs/frontend.log 2>&1 &
echo -e "${GREEN}✅ Dashboard Frontend started (PID: $!)${NC}"

# Start GhostBuster Backend
echo -e "${BLUE}Starting GhostBuster Backend (Port 3006)...${NC}"
cd "$SCRIPT_DIR/GhostBuster/backend"
source venv/bin/activate
GHOSTBUSTER_PORT=3006 python3 app.py > /tmp/taxguard-logs/ghostbuster-backend.log 2>&1 &
echo -e "${GREEN}✅ GhostBuster Backend started (PID: $!)${NC}"

# Start GhostBuster Frontend
echo -e "${BLUE}Starting GhostBuster Frontend (Port 3004)...${NC}"
cd "$SCRIPT_DIR/GhostBuster/frontend"
PORT=3004 DISABLE_ESLINT_PLUGIN=true npm start > /tmp/taxguard-logs/ghostbuster-frontend.log 2>&1 &
echo -e "${GREEN}✅ GhostBuster Frontend started (PID: $!)${NC}"

# Start WhistlePro Backend
echo -e "${BLUE}Starting WhistlePro Backend (Port 3005)...${NC}"
cd "$SCRIPT_DIR/whistlepro_backend"
npm start > /tmp/taxguard-logs/whistlepro.log 2>&1 &
echo -e "${GREEN}✅ WhistlePro Backend started (PID: $!)${NC}"

# Start VRT Guard
echo -e "${BLUE}Starting VRT Guard (Port 5002)...${NC}"
cd "$SCRIPT_DIR/vrt_guard"
source venv/bin/activate
python app.py > /tmp/taxguard-logs/vrt-guard.log 2>&1 &
echo -e "${GREEN}✅ VRT Guard started (PID: $!)${NC}"

# Start Anomaly Tracker
echo -e "${BLUE}Starting Anomaly Tracker (Port 5001)...${NC}"
cd "$SCRIPT_DIR/ai_risk_scoring"
source venv/bin/activate
PYTHONPATH=$SCRIPT_DIR python api/scoring_api.py > /tmp/taxguard-logs/anomaly-tracker.log 2>&1 &
echo -e "${GREEN}✅ Anomaly Tracker started (PID: $!)${NC}"

# Start Predictive Analytics
echo -e "${BLUE}Starting Predictive Analytics (Port 3004)...${NC}"
cd "$SCRIPT_DIR/predictive_analytics"
source venv/bin/activate
python api.py > /tmp/taxguard-logs/predictive-analytics.log 2>&1 &
echo -e "${GREEN}✅ Predictive Analytics started (PID: $!)${NC}"

# Start OCR AI Service
echo -e "${BLUE}Starting OCR AI Service (Port 8000)...${NC}"
cd "$SCRIPT_DIR/ocr-ai-service"
source venv/bin/activate
uvicorn main:app --host 0.0.0.0 --port 8000 > /tmp/taxguard-logs/ocr-ai-service.log 2>&1 &
echo -e "${GREEN}✅ OCR AI Service started (PID: $!)${NC}"

# Start OCR Backend
echo -e "${BLUE}Starting OCR Backend (Port 5000)...${NC}"
cd "$SCRIPT_DIR/ocr-backend"
node server.js > /tmp/taxguard-logs/ocr-backend.log 2>&1 &
echo -e "${GREEN}✅ OCR Backend started (PID: $!)${NC}"

# Start Blockchain Service
echo -e "${BLUE}Starting Blockchain Service (Port 3001)...${NC}"
cd "$SCRIPT_DIR/blockchain"
npm start > /tmp/taxguard-logs/blockchain.log 2>&1 &
echo -e "${GREEN}✅ Blockchain Service started (PID: $!)${NC}"

echo ""
echo -e "${YELLOW}⏳ Waiting for services to initialize (15 seconds)...${NC}"
sleep 15

echo ""
echo -e "${BLUE}╔═══════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║              ✅ SETUP COMPLETE!  ✅                       ║${NC}"
echo -e "${BLUE}╚═══════════════════════════════════════════════════════════╝${NC}"
echo ""

echo -e "${GREEN}🌐 Access Points:${NC}"
echo -e "  • Main Dashboard:      ${BLUE}http://localhost:3000${NC}"
echo -e "  • GhostBuster UI:      ${BLUE}http://localhost:3004${NC}"
echo -e "  • API Gateway:         ${BLUE}http://localhost:4001${NC}"
echo ""

echo -e "${YELLOW}🔍 Verifying Services...${NC}"
echo ""

# Service verification
SERVICES=(
    "3000:Dashboard Frontend"
    "3001:Blockchain Service"
    "3004:GhostBuster Frontend"
    "3005:WhistlePro Backend"
    "3006:GhostBuster Backend"
    "4001:API Gateway"
    "5000:OCR Backend"
    "5001:Anomaly Tracker"
    "5002:VRT Guard"
    "8000:OCR AI Service"
)

RUNNING=0
TOTAL=${#SERVICES[@]}

for service in "${SERVICES[@]}"; do
    IFS=':' read -r port name <<< "$service"
    if timeout 3 curl -s http://localhost:$port/health > /dev/null 2>&1; then
        echo -e "  ${GREEN}✅ $name (Port $port)${NC}"
        ((RUNNING++))
    else
        echo -e "  ${RED}❌ $name (Port $port)${NC}"
    fi
done

echo ""
echo -e "${BLUE}Services Running: $RUNNING/$TOTAL${NC}"

if [ $RUNNING -eq $TOTAL ]; then
    echo -e "${GREEN}🎉 All services are running successfully!${NC}"
else
    echo -e "${YELLOW}⚠️  Some services may need more time to start. Check logs in /tmp/taxguard-logs/${NC}"
fi

echo ""
echo -e "${YELLOW}📝 Logs Location: /tmp/taxguard-logs/${NC}"
echo -e "${YELLOW}🛑 To stop all services: ./stop-all-services.sh${NC}"
echo ""

# Test key endpoints
echo -e "${YELLOW}🧪 Testing Key Endpoints...${NC}"
echo ""

# Test WebSocket
if curl -s http://localhost:4001/health | grep -q "healthy"; then
    echo -e "${GREEN}✅ API Gateway with WebSocket support${NC}"
else
    echo -e "${RED}❌ API Gateway not responding${NC}"
fi

# Test WhistlePro
if curl -s http://localhost:4001/api/whistlepro/reports | grep -q "reports"; then
    echo -e "${GREEN}✅ WhistlePro API working${NC}"
else
    echo -e "${RED}❌ WhistlePro API not working${NC}"
fi

# Test GhostBuster
if curl -s http://localhost:3006/api/stats | grep -q "total_employees"; then
    echo -e "${GREEN}✅ GhostBuster Backend with datasets${NC}"
else
    echo -e "${RED}❌ GhostBuster Backend not working${NC}"
fi

echo ""
echo -e "${GREEN}🚀 Setup Complete! Open your browser to http://localhost:3000${NC}"
echo ""
