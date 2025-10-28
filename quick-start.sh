#!/bin/bash

# ZRA TaxGuard AI - Quick Start Script
# Use this script to start all services after initial setup

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Get script directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$SCRIPT_DIR"

echo -e "${BLUE}╔═══════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║     🚀 ZRA TAXGUARD AI - QUICK START 🚀                 ║${NC}"
echo -e "${BLUE}╚═══════════════════════════════════════════════════════════╝${NC}"
echo ""

# Create logs directory
mkdir -p /tmp/taxguard-logs

echo -e "${YELLOW}📋 Checking Prerequisites...${NC}"

# Quick checks
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js not found. Run ./complete-setup.sh first${NC}"
    exit 1
fi

if ! command -v python3 &> /dev/null; then
    echo -e "${RED}❌ Python3 not found. Run ./complete-setup.sh first${NC}"
    exit 1
fi

if ! pg_isready &> /dev/null; then
    echo -e "${YELLOW}⚠️  Starting PostgreSQL...${NC}"
    sudo service postgresql start
    sleep 2
fi

echo -e "${GREEN}✅ Prerequisites OK${NC}"
echo ""

echo -e "${YELLOW}🛑 Stopping any existing services...${NC}"
pkill -f "node server.js" 2>/dev/null || true
pkill -f "npm start" 2>/dev/null || true
pkill -f "npm run dev" 2>/dev/null || true
pkill -f "python.*app.py" 2>/dev/null || true
pkill -f "uvicorn" 2>/dev/null || true
sleep 2
echo -e "${GREEN}✅ Cleanup complete${NC}"
echo ""

echo -e "${YELLOW}🚀 Starting All Services...${NC}"
echo ""

# Start API Gateway
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
echo -e "${YELLOW}⏳ Waiting for services to initialize (10 seconds)...${NC}"
sleep 10

echo ""
echo -e "${BLUE}╔═══════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║              ✅ ALL SERVICES STARTED!  ✅                ║${NC}"
echo -e "${BLUE}╚═══════════════════════════════════════════════════════════╝${NC}"
echo ""

echo -e "${GREEN}🌐 Access Points:${NC}"
echo -e "  • Main Dashboard:      ${BLUE}http://localhost:3000${NC}"
echo -e "  • GhostBuster UI:      ${BLUE}http://localhost:3004${NC}"
echo -e "  • API Gateway:         ${BLUE}http://localhost:4001${NC}"
echo ""

echo -e "${YELLOW}📝 Logs: /tmp/taxguard-logs/ | Stop: ./stop-all-services.sh${NC}"
echo ""
