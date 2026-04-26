#!/bin/bash

# ZRA TaxGuard AI - Database Initialization Script
# This script initializes PostgreSQL databases for all services

echo "🔧 Initializing TaxGuard AI Databases..."
echo ""

# Check if PostgreSQL is running on port 5433
if ! pg_isready -p 5433 &> /dev/null; then
    echo "❌ PostgreSQL is not running on port 5433"
    echo "Starting PostgreSQL..."
    sudo pg_ctlcluster 17 main start
    sleep 2

    if ! pg_isready -p 5433 &> /dev/null; then
        echo "❌ PostgreSQL failed to start"
        exit 1
    fi
fi

echo "✅ PostgreSQL is running on port 5433"
echo ""

# Initialize blockchain database
echo "📊 Initializing Blockchain database..."
cd blockchain/database
if [ -f "migrate.js" ]; then
    node migrate.js
    echo "✅ Blockchain database initialized"
else
    echo "⚠️  Blockchain migration script not found, skipping..."
fi
cd ../..

echo ""
echo "✅ Database initialization complete!"
echo ""
