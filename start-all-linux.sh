#!/bin/bash
echo "══════════════════════════════════════════════════════════"
echo "  ZRA TAXGUARD AI - Starting ALL 11 Services"
echo "══════════════════════════════════════════════════════════"
echo ""

cd /home/kaps100/ZRA-Hackathon-TaxGuard-AI-GhostBuster

# 0. PostgreSQL Database (5433)
echo "[0/11] Starting PostgreSQL Database (Port 5433)..."
if pg_lsclusters | grep -q "17.*main.*down"; then
    echo "  PostgreSQL is down, starting..."
    sudo pg_ctlcluster 17 main start 2>&1 | grep -v "password"
    if pg_lsclusters | grep -q "17.*main.*online"; then
        echo "  ✓ PostgreSQL 17 started successfully"
    else
        echo "  ⚠ PostgreSQL may require manual start with: sudo pg_ctlcluster 17 main start"
    fi
elif pg_lsclusters | grep -q "17.*main.*online"; then
    echo "  ✓ PostgreSQL 17 already running"
fi
echo ""

# 1. Dashboard Frontend (3000)
echo "[1/11] Starting Dashboard Frontend (Port 3000)..."
cd dashboard_integration/frontend && npm run dev > /tmp/zra-dashboard.log 2>&1 &
echo "  ✓ Started with PID $!"

# 2. API Gateway (4001)
echo "[2/11] Starting API Gateway (Port 4001)..."
cd /home/kaps100/ZRA-Hackathon-TaxGuard-AI-GhostBuster/api-gateway && PORT=4001 node server.js > /tmp/zra-api-gateway.log 2>&1 &
echo "  ✓ Started with PID $!"

# 3. VRT Guard (5002)
echo "[3/11] Starting VRT Guard (Port 5002)..."
cd /home/kaps100/ZRA-Hackathon-TaxGuard-AI-GhostBuster/vrt_guard && PORT=5002 python app.py > /tmp/zra-vrt.log 2>&1 &
echo "  ✓ Started with PID $!"

# 4. Anomaly Tracker (5001)
echo "[4/11] Starting Anomaly Tracker (Port 5001)..."
cd /home/kaps100/ZRA-Hackathon-TaxGuard-AI-GhostBuster/ai_risk_scoring && PORT=5001 python -m api.scoring_api > /tmp/zra-anomaly.log 2>&1 &
echo "  ✓ Started with PID $!"

# 5. GhostBuster Frontend (3004)
echo "[5/11] Starting GhostBuster Frontend (Port 3004)..."
cd /home/kaps100/ZRA-Hackathon-TaxGuard-AI-GhostBuster/GhostBuster/frontend && PORT=3004 DISABLE_ESLINT_PLUGIN=true npm start > /tmp/zra-ghostbuster-ui.log 2>&1 &
echo "  ✓ Started with PID $!"

# 6. GhostBuster Backend (3006 - FIXED!)
echo "[6/11] Starting GhostBuster Backend (Port 3006)..."
cd /home/kaps100/ZRA-Hackathon-TaxGuard-AI-GhostBuster/GhostBuster/backend && GHOSTBUSTER_PORT=3006 python app.py > /tmp/zra-ghostbuster-api.log 2>&1 &
echo "  ✓ Started with PID $!"

# 7. Predictive Analytics (5003)
echo "[7/11] Starting Predictive Analytics (Port 5003)..."
cd /home/kaps100/ZRA-Hackathon-TaxGuard-AI-GhostBuster/predictive_analytics && python api.py > /tmp/zra-predictive.log 2>&1 &
echo "  ✓ Started with PID $!"

# 8. Blockchain (3001)
echo "[8/11] Starting Blockchain Service (Port 3001)..."
cd /home/kaps100/ZRA-Hackathon-TaxGuard-AI-GhostBuster/blockchain && PORT=3001 node api/index.js > /tmp/zra-blockchain.log 2>&1 &
echo "  ✓ Started with PID $!"

# 9. WhistlePro (4000)
echo "[9/11] Starting WhistlePro Backend (Port 4000)..."
cd /home/kaps100/ZRA-Hackathon-TaxGuard-AI-GhostBuster/whistlepro_backend && PORT=4000 node src/server.js > /tmp/zra-whistlepro.log 2>&1 &
echo "  ✓ Started with PID $!"

# 10. OCR AI Service (8000)
echo "[10/11] Starting OCR AI Service (Port 8000)..."
cd /home/kaps100/ZRA-Hackathon-TaxGuard-AI-GhostBuster/ocr-ai-service && python main.py > /tmp/zra-ocr-ai.log 2>&1 &
echo "  ✓ Started with PID $!"

echo ""
echo "All 11 services started! Waiting for initialization..."
sleep 10

echo ""
echo "══════════════════════════════════════════════════════════"
echo "  SERVICE STATUS REPORT"
echo "══════════════════════════════════════════════════════════"
echo ""
echo "DATABASE SERVICE:"
pg_lsclusters | grep "17.*main" | awk '{printf "  [%s] PostgreSQL %s - Port %s\n", ($4=="online"?"✓":"✗"), $1, $3}'

echo ""
echo "APPLICATION SERVICES:"
netstat -tuln | grep "LISTEN" | grep -E ":(3000|3001|3004|3006|4000|4001|5001|5002|5003|8000)" | awk '{print $4}' | awk -F: '{
  port=$NF;
  if (port==3000) service="Dashboard Frontend";
  else if (port==3001) service="Blockchain Service";
  else if (port==3004) service="GhostBuster Frontend";
  else if (port==3006) service="GhostBuster Backend";
  else if (port==4000) service="WhistlePro Backend";
  else if (port==4001) service="API Gateway";
  else if (port==5001) service="Anomaly Tracker";
  else if (port==5002) service="VRT Guard";
  else if (port==5003) service="Predictive Analytics";
  else if (port==8000) service="OCR AI Service";
  printf "  [✓] Port %s - %s\n", port, service;
}' | sort -t' ' -k3 -n

echo ""
APP_COUNT=$(netstat -tuln | grep LISTEN | grep -E ':(3000|3001|3004|3006|4000|4001|5001|5002|5003|8000)' | wc -l)
DB_COUNT=$(pg_lsclusters | grep "17.*main.*online" | wc -l)
TOTAL=$((APP_COUNT + DB_COUNT))
echo "TOTAL SERVICES RUNNING: $TOTAL / 11"
echo "  - Application Services: $APP_COUNT / 10"
echo "  - Database Service: $DB_COUNT / 1"
echo ""
echo "══════════════════════════════════════════════════════════"
echo "Access Points:"
echo "  Main Dashboard:    http://localhost:3000"
echo "  GhostBuster UI:    http://localhost:3004"
echo "  GhostBuster API:   http://localhost:3006/api/stats"
echo "  API Gateway:       http://localhost:4001"
echo "  PostgreSQL:        localhost:5433"
echo "══════════════════════════════════════════════════════════"
