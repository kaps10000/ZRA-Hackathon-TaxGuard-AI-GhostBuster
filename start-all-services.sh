#!/bin/bash

# ZRA TaxGuard AI - Service Startup Script
# This script starts all services without Docker

echo "╔═══════════════════════════════════════════════════════════╗"
echo "║     🚀 ZRA TAXGUARD AI - STARTING ALL SERVICES 🚀       ║"
echo "╚═══════════════════════════════════════════════════════════╝"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Get the directory where the script is located
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$SCRIPT_DIR"

# Create logs directory
mkdir -p /tmp/taxguard-logs

echo "📋 Checking prerequisites..."
echo ""

# Check Node.js
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js not found. Please install Node.js v18+${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Node.js $(node --version)${NC}"

# Check Python
if ! command -v python3 &> /dev/null; then
    echo -e "${RED}❌ Python3 not found. Please install Python 3.10+${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Python $(python3 --version)${NC}"

# Check PostgreSQL
if ! pg_isready &> /dev/null; then
    echo -e "${YELLOW}⚠️  PostgreSQL not responding. Attempting to start...${NC}"
    sudo service postgresql start
    sleep 2
    if ! pg_isready &> /dev/null; then
        echo -e "${RED}❌ PostgreSQL failed to start${NC}"
        exit 1
    fi
fi
echo -e "${GREEN}✅ PostgreSQL running${NC}"

echo ""
echo "🚀 Starting services..."
echo ""

# 1. API Gateway
echo "Starting API Gateway (Port 4001)..."
cd "$SCRIPT_DIR/api-gateway"
npm install --silent > /dev/null 2>&1
PORT=4001 node server.js > /tmp/taxguard-logs/api-gateway.log 2>&1 &
echo -e "${GREEN}✅ API Gateway started (PID: $!)${NC}"

# 2. Dashboard Frontend
echo "Starting Dashboard Frontend (Port 3000)..."
cd "$SCRIPT_DIR/dashboard_integration/frontend"
npm install --silent > /dev/null 2>&1
npm run dev > /tmp/taxguard-logs/frontend.log 2>&1 &
echo -e "${GREEN}✅ Dashboard Frontend started (PID: $!)${NC}"

# 3. VRT Guard
echo "Starting VRT Guard (Port 5002)..."
cd "$SCRIPT_DIR/vrt_guard"
if [ ! -d "venv" ]; then
    python3 -m venv venv
    source venv/bin/activate
    pip install -r requirements.txt --quiet > /dev/null 2>&1
else
    source venv/bin/activate
fi
python app.py > /tmp/taxguard-logs/vrt-guard.log 2>&1 &
echo -e "${GREEN}✅ VRT Guard started (PID: $!)${NC}"

# 4. Anomaly Tracker
echo "Starting Anomaly Tracker (Port 5001)..."
cd "$SCRIPT_DIR/ai_risk_scoring"
if [ ! -d "venv" ]; then
    python3 -m venv venv
    source venv/bin/activate
    pip install -r requirements.txt --quiet > /dev/null 2>&1
else
    source venv/bin/activate
fi
PYTHONPATH=$SCRIPT_DIR/ai_risk_scoring python api/scoring_api.py > /tmp/taxguard-logs/anomaly-tracker.log 2>&1 &
echo -e "${GREEN}✅ Anomaly Tracker started (PID: $!)${NC}"

# 5. Predictive Analytics
echo "Starting Predictive Analytics (Port 3004)..."
cd "$SCRIPT_DIR/predictive_analytics"
if [ ! -d "venv" ]; then
    python3 -m venv venv
    source venv/bin/activate
    pip install -r requirements.txt --quiet > /dev/null 2>&1
else
    source venv/bin/activate
fi
python api.py > /tmp/taxguard-logs/predictive-analytics.log 2>&1 &
echo -e "${GREEN}✅ Predictive Analytics started (PID: $!)${NC}"

# 6. GhostBuster Backend
echo "Starting GhostBuster Backend (Port 3005)..."
cd "$SCRIPT_DIR/ghostbuster/backend"
npm install --silent > /dev/null 2>&1
npm start > /tmp/taxguard-logs/ghostbuster-backend.log 2>&1 &
echo -e "${GREEN}✅ GhostBuster Backend started (PID: $!)${NC}"

# 7. OCR AI Service
echo "Starting OCR AI Service (Port 8000)..."
cd "$SCRIPT_DIR/ocr-ai-service"
if [ ! -d "venv" ]; then
    python3 -m venv venv
    source venv/bin/activate
    pip install -r requirements.txt --quiet > /dev/null 2>&1
else
    source venv/bin/activate
fi
uvicorn main:app --host 0.0.0.0 --port 8000 > /tmp/taxguard-logs/ocr-ai-service.log 2>&1 &
echo -e "${GREEN}✅ OCR AI Service started (PID: $!)${NC}"

# 8. OCR Backend
echo "Starting OCR Backend (Port 5000)..."
cd "$SCRIPT_DIR/ocr-backend"
npm install --silent > /dev/null 2>&1
node server.js > /tmp/taxguard-logs/ocr-backend.log 2>&1 &
echo -e "${GREEN}✅ OCR Backend started (PID: $!)${NC}"

# 9. Blockchain Service
echo "Starting Blockchain Service (Port 3001)..."
cd "$SCRIPT_DIR/blockchain"
npm install --silent > /dev/null 2>&1
npm start > /tmp/taxguard-logs/blockchain.log 2>&1 &
echo -e "${GREEN}✅ Blockchain Service started (PID: $!)${NC}"

# 10. WhistlePro Backend
echo "Starting WhistlePro Backend (Port 3005)..."
cd "$SCRIPT_DIR/whistlepro_backend"
npm install --silent > /dev/null 2>&1
npm start > /tmp/taxguard-logs/whistlepro.log 2>&1 &
echo -e "${GREEN}✅ WhistlePro Backend started (PID: $!)${NC}"

echo ""
echo "⏳ Waiting for services to initialize (10 seconds)..."
sleep 10

echo ""
echo "╔═══════════════════════════════════════════════════════════╗"
echo "║              ✅ ALL SERVICES STARTED!  ✅                ║"
echo "╚═══════════════════════════════════════════════════════════╝"
echo ""
echo "🌐 Access your dashboard at: http://localhost:3000"
echo ""
echo "📊 Service Status:"
echo "  • API Gateway:           http://localhost:4001"
echo "  • Dashboard Frontend:    http://localhost:3000"
echo "  • VRT Guard:             http://localhost:5002"
echo "  • Anomaly Tracker:       http://localhost:5001"
echo "  • Predictive Analytics:  http://localhost:3004"
echo "  • GhostBuster Backend:   http://localhost:3005"
echo "  • OCR AI Service:        http://localhost:8000"
echo "  • OCR Backend:           http://localhost:5000"
echo "  • Blockchain Service:    http://localhost:3001"
echo "  • WhistlePro Backend:    http://localhost:3005"
echo ""
echo "📝 Logs are available in: /tmp/taxguard-logs/"
echo ""
echo "🛑 To stop all services, run: ./stop-all-services.sh"
echo ""
