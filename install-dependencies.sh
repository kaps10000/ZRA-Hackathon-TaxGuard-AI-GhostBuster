#!/bin/bash

# ZRA TaxGuard AI - Dependency Installation Script (Linux/macOS)
# This script installs all dependencies for all services

echo "╔═══════════════════════════════════════════════════════════╗"
echo "║  🔧 ZRA TAXGUARD AI - INSTALLING DEPENDENCIES 🔧        ║"
echo "╚═══════════════════════════════════════════════════════════╝"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Get the directory where the script is located
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$SCRIPT_DIR"

# Error counter
ERRORS=0

echo "📋 Checking prerequisites..."
echo ""

# Check Node.js
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js not found. Please install Node.js v18+${NC}"
    echo "   Download from: https://nodejs.org/"
    ERRORS=$((ERRORS + 1))
else
    echo -e "${GREEN}✅ Node.js $(node --version)${NC}"
fi

# Check npm
if ! command -v npm &> /dev/null; then
    echo -e "${RED}❌ npm not found${NC}"
    ERRORS=$((ERRORS + 1))
else
    echo -e "${GREEN}✅ npm $(npm --version)${NC}"
fi

# Check Python
if ! command -v python3 &> /dev/null; then
    echo -e "${RED}❌ Python3 not found. Please install Python 3.10+${NC}"
    echo "   Download from: https://www.python.org/"
    ERRORS=$((ERRORS + 1))
else
    echo -e "${GREEN}✅ Python $(python3 --version)${NC}"
fi

# Check pip
if ! command -v pip3 &> /dev/null && ! python3 -m pip --version &> /dev/null; then
    echo -e "${RED}❌ pip not found${NC}"
    ERRORS=$((ERRORS + 1))
else
    echo -e "${GREEN}✅ pip $(python3 -m pip --version | awk '{print $2}')${NC}"
fi

if [ $ERRORS -gt 0 ]; then
    echo ""
    echo -e "${RED}❌ Please install missing prerequisites before continuing${NC}"
    exit 1
fi

echo ""
echo "🚀 Starting dependency installation..."
echo ""

# Function to install Node.js dependencies
install_node_deps() {
    local dir=$1
    local name=$2

    echo -e "${BLUE}📦 Installing dependencies for: $name${NC}"
    cd "$SCRIPT_DIR/$dir"

    if [ -f "package.json" ]; then
        npm install --silent > /dev/null 2>&1
        if [ $? -eq 0 ]; then
            echo -e "${GREEN}   ✅ $name dependencies installed${NC}"
        else
            echo -e "${RED}   ❌ Failed to install $name dependencies${NC}"
            ERRORS=$((ERRORS + 1))
        fi
    else
        echo -e "${YELLOW}   ⚠️  No package.json found in $dir${NC}"
    fi

    cd "$SCRIPT_DIR"
}

# Function to install Python dependencies
install_python_deps() {
    local dir=$1
    local name=$2

    echo -e "${BLUE}📦 Installing dependencies for: $name${NC}"
    cd "$SCRIPT_DIR/$dir"

    if [ -f "requirements.txt" ]; then
        # Create virtual environment if it doesn't exist
        if [ ! -d "venv" ]; then
            echo "   Creating virtual environment..."
            python3 -m venv venv
        fi

        # Activate virtual environment
        source venv/bin/activate

        # Upgrade pip
        pip install --upgrade pip --quiet > /dev/null 2>&1

        # Install dependencies
        pip install -r requirements.txt --quiet > /dev/null 2>&1
        if [ $? -eq 0 ]; then
            echo -e "${GREEN}   ✅ $name dependencies installed${NC}"
        else
            echo -e "${RED}   ❌ Failed to install $name dependencies${NC}"
            ERRORS=$((ERRORS + 1))
        fi

        # Deactivate virtual environment
        deactivate
    else
        echo -e "${YELLOW}   ⚠️  No requirements.txt found in $dir${NC}"
    fi

    cd "$SCRIPT_DIR"
}

# Install Node.js services
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Installing Node.js Services"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

install_node_deps "api-gateway" "API Gateway"
install_node_deps "dashboard_integration/frontend" "Frontend Dashboard"
install_node_deps "ghostbuster/backend" "GhostBuster Backend"
install_node_deps "ocr-backend" "OCR Backend"
install_node_deps "blockchain" "Blockchain Service"
install_node_deps "whistlepro_backend" "WhistlePro Backend"

# Install Python services
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Installing Python Services"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

install_python_deps "vrt_guard" "VRT Guard"
install_python_deps "ai_risk_scoring" "Anomaly Tracker"
install_python_deps "predictive_analytics" "Predictive Analytics"
install_python_deps "ocr-ai-service" "OCR AI Service"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if [ $ERRORS -eq 0 ]; then
    echo ""
    echo "╔═══════════════════════════════════════════════════════════╗"
    echo "║        ✅ ALL DEPENDENCIES INSTALLED SUCCESSFULLY! ✅    ║"
    echo "╚═══════════════════════════════════════════════════════════╝"
    echo ""
    echo "🎉 You're ready to start the services!"
    echo ""
    echo "Next steps:"
    echo "  1. Setup PostgreSQL database (if not done):"
    echo "     sudo service postgresql start"
    echo "     sudo -u postgres psql -c \"CREATE DATABASE zra_taxguard;\""
    echo ""
    echo "  2. Start all services:"
    echo "     ./start-all-services.sh"
    echo ""
    echo "  3. Access the dashboard:"
    echo "     http://localhost:3000"
    echo ""
else
    echo ""
    echo "╔═══════════════════════════════════════════════════════════╗"
    echo "║     ⚠️  INSTALLATION COMPLETED WITH $ERRORS ERROR(S)  ⚠️      ║"
    echo "╚═══════════════════════════════════════════════════════════╝"
    echo ""
    echo "Please check the errors above and try again."
    echo ""
    exit 1
fi
