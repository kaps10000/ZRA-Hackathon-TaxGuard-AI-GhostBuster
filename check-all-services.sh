#!/bin/bash

echo "=========================================="
echo "TaxGuard AI - Service Health Check"
echo "Checking all 12 services..."
echo "=========================================="
echo ""

# PostgreSQL
echo -n "[5432] PostgreSQL: "
docker exec taxguard-postgres pg_isready -U postgres > /dev/null 2>&1 && echo "✓ RUNNING" || echo "✗ DOWN"

# Dashboard Frontend
echo -n "[3000] Dashboard Frontend: "
curl -s http://localhost:3000/ > /dev/null 2>&1 && echo "✓ RUNNING" || echo "✗ DOWN"

# Blockchain
echo -n "[3001] Blockchain Service: "
curl -s http://localhost:3001/health > /dev/null 2>&1 && echo "✓ RUNNING" || echo "✗ DOWN"

# GhostBuster Frontend
echo -n "[3004] GhostBuster Frontend: "
curl -s http://localhost:3004/ > /dev/null 2>&1 && echo "✓ RUNNING" || echo "✗ DOWN"

# Whistlepro Backend
echo -n "[3005] Whistlepro Backend: "
curl -s http://localhost:3005/ > /dev/null 2>&1 && echo "✓ RUNNING" || echo "✗ DOWN"

# Whistlepro/VRT Module
echo -n "[3006] Whistlepro/VRT Module: "
curl -s http://localhost:3006/health > /dev/null 2>&1 && echo "✓ RUNNING" || echo "✗ DOWN"

# OCR Backend
echo -n "[4000] OCR Backend: "
curl -s http://localhost:4000/health > /dev/null 2>&1 && echo "✓ RUNNING" || echo "✗ DOWN"

# API Gateway
echo -n "[4001] API Gateway: "
curl -s http://localhost:4001/health > /dev/null 2>&1 && echo "✓ RUNNING" || echo "✗ DOWN"

# OCR AI Service
echo -n "[5000] OCR AI Service: "
curl -s http://localhost:5000/ > /dev/null 2>&1 && echo "✓ RUNNING" || echo "✗ DOWN"

# GhostBuster Backend
echo -n "[5001] GhostBuster Backend: "
curl -s http://localhost:5001/health > /dev/null 2>&1 && echo "✓ RUNNING" || echo "✗ DOWN"

# Anomaly Tracker
echo -n "[5002] Anomaly Tracker: "
curl -s http://localhost:5002/health > /dev/null 2>&1 && echo "✓ RUNNING" || echo "✗ DOWN"

# VRT Guard
echo -n "[5003] VRT Guard: "
curl -s http://localhost:5003/health > /dev/null 2>&1 && echo "✓ RUNNING" || echo "✗ DOWN"

echo ""
echo "=========================================="
echo "Health check complete!"
echo "=========================================="
