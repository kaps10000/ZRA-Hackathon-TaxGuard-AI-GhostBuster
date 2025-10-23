#!/bin/bash

# ZRA TaxGuard AI - Stop All Services Script

echo "╔═══════════════════════════════════════════════════════════╗"
echo "║      🛑 ZRA TAXGUARD AI - STOPPING ALL SERVICES 🛑      ║"
echo "╚═══════════════════════════════════════════════════════════╝"
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
NC='\033[0m'

echo "Stopping all TaxGuard AI services..."
echo ""

# Stop Node.js services
echo "Stopping Node.js services..."
pkill -f "node server.js" 2>/dev/null
pkill -f "npm run dev" 2>/dev/null
pkill -f "npm start" 2>/dev/null
echo -e "${GREEN}✅ Node.js services stopped${NC}"

# Stop Python services
echo "Stopping Python services..."
pkill -f "python app.py" 2>/dev/null
pkill -f "python api.py" 2>/dev/null
pkill -f "python api/scoring_api.py" 2>/dev/null
pkill -f "uvicorn main" 2>/dev/null
echo -e "${GREEN}✅ Python services stopped${NC}"

# Stop Vite dev server
echo "Stopping Vite dev server..."
pkill -f "vite" 2>/dev/null
echo -e "${GREEN}✅ Vite dev server stopped${NC}"

echo ""
echo "╔═══════════════════════════════════════════════════════════╗"
echo "║           ✅ ALL SERVICES STOPPED SUCCESSFULLY!  ✅      ║"
echo "╚═══════════════════════════════════════════════════════════╝"
echo ""
echo "💡 To start services again, run: ./start-all-services.sh"
echo ""
