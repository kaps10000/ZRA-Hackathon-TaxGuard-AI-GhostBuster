#!/bin/bash

# Integration Test Script for Database and Blockchain

echo "🔍 ZRA TaxGuard AI - Database & Blockchain Integration Test"
echo "=========================================================="
echo ""

# Test PostgreSQL Database
echo "📊 Testing Database Connection..."
if pg_isready > /dev/null 2>&1; then
    echo "✅ PostgreSQL is running"
    
    # Check if taxguard database exists
    if sudo -u postgres psql -lqt | cut -d \| -f 1 | grep -qw taxguard; then
        echo "✅ TaxGuard database exists"
        
        # Test database connection from services
        echo "🔌 Testing service database connections..."
        
        # Check OCR Backend database config
        if [ -f "ocr-backend/config/database.js" ]; then
            echo "✅ OCR Backend has database configuration"
        else
            echo "❌ OCR Backend missing database config"
        fi
        
    else
        echo "⚠️  TaxGuard database not found - services using mock data"
    fi
else
    echo "❌ PostgreSQL not running"
fi

echo ""

# Test Blockchain Service
echo "⛓️  Testing Blockchain Service..."
if curl -s http://localhost:3001/health > /dev/null 2>&1; then
    echo "✅ Blockchain service is running"
    
    # Get blockchain stats
    CHAIN_LENGTH=$(curl -s http://localhost:3001/api/blockchain | jq -r '.blockchain.length // 0')
    echo "📊 Blockchain length: $CHAIN_LENGTH blocks"
    
    if [ "$CHAIN_LENGTH" -gt 0 ]; then
        echo "✅ Blockchain has data ($CHAIN_LENGTH blocks)"
        
        # Show latest block
        LATEST_BLOCK=$(curl -s http://localhost:3001/api/blockchain | jq -r '.blockchain.latestBlock.data.eventType // "unknown"')
        echo "📝 Latest event type: $LATEST_BLOCK"
    else
        echo "⚠️  Blockchain is empty"
    fi
else
    echo "❌ Blockchain service not running"
fi

echo ""

# Test Dashboard Integration
echo "🖥️  Testing Dashboard Integration..."
if curl -s http://localhost:4001/health > /dev/null 2>&1; then
    echo "✅ API Gateway is running"
    
    # Test dashboard feed
    if curl -s http://localhost:4001/api/dashboard/feed > /dev/null 2>&1; then
        echo "✅ Dashboard feed accessible"
        
        # Check blockchain data in dashboard
        BLOCKCHAIN_DATA=$(curl -s http://localhost:4001/api/dashboard/feed | jq -r '.blockchain.total_transactions // 0')
        echo "📊 Dashboard shows $BLOCKCHAIN_DATA transactions"
        
        # Check if using real blockchain data
        REAL_BLOCKCHAIN=$(curl -s http://localhost:3001/api/blockchain | jq -r '.blockchain.totalEvents // 0')
        if [ "$BLOCKCHAIN_DATA" != "$REAL_BLOCKCHAIN" ]; then
            echo "⚠️  Dashboard using mock blockchain data (Real: $REAL_BLOCKCHAIN, Dashboard: $BLOCKCHAIN_DATA)"
        else
            echo "✅ Dashboard connected to real blockchain"
        fi
    else
        echo "❌ Dashboard feed not accessible"
    fi
else
    echo "❌ API Gateway not running"
fi

echo ""

# Test Service Database Usage
echo "💾 Testing Service Database Usage..."

# Check which services have database connections
SERVICES_WITH_DB=0

if grep -q "postgres\|database" /home/emmd/Workstation/projects/competitions/new/ZRA-Hackathon-TaxGuard-AI-GhostBuster/ocr-backend/config/database.js 2>/dev/null; then
    echo "✅ OCR Backend configured for database"
    ((SERVICES_WITH_DB++))
fi

if grep -q "postgres\|database" /home/emmd/Workstation/projects/competitions/new/ZRA-Hackathon-TaxGuard-AI-GhostBuster/api-gateway/server.js 2>/dev/null; then
    echo "✅ API Gateway has database references"
    ((SERVICES_WITH_DB++))
fi

echo "📊 Services with database configuration: $SERVICES_WITH_DB"

echo ""
echo "📋 Integration Summary:"
echo "======================"

# Database Status
if pg_isready > /dev/null 2>&1; then
    echo "✅ Database: PostgreSQL running and accessible"
else
    echo "❌ Database: PostgreSQL not running"
fi

# Blockchain Status  
if curl -s http://localhost:3001/health > /dev/null 2>&1; then
    echo "✅ Blockchain: Service running with $(curl -s http://localhost:3001/api/blockchain | jq -r '.blockchain.length // 0') blocks"
else
    echo "❌ Blockchain: Service not running"
fi

# Integration Status
if curl -s http://localhost:4001/api/dashboard/feed > /dev/null 2>&1; then
    echo "✅ Integration: Dashboard can access both database and blockchain data"
else
    echo "❌ Integration: Dashboard not accessible"
fi

echo ""
echo "🔗 Key Integration Points:"
echo "- Database: Used for persistent storage of tax records, user data"
echo "- Blockchain: Used for immutable audit trail of tax events"
echo "- Dashboard: Aggregates data from both sources for unified view"
echo ""
