#!/bin/bash

# TaxGuard Blockchain Database Setup Script

echo "🚀 TaxGuard Blockchain - PostgreSQL Database Setup"
echo "=================================================="
echo ""

# Check if PostgreSQL is installed
if ! command -v psql &> /dev/null; then
    echo "❌ PostgreSQL is not installed"
    echo "Please install PostgreSQL first:"
    echo "  Ubuntu/Debian: sudo apt-get install postgresql postgresql-contrib"
    echo "  MacOS: brew install postgresql"
    exit 1
fi

echo "✅ PostgreSQL found"
echo ""

# Check if PostgreSQL is running
if ! pg_isready -q; then
    echo "❌ PostgreSQL is not running"
    echo "Starting PostgreSQL..."
    sudo service postgresql start || echo "Please start PostgreSQL manually"
    exit 1
fi

echo "✅ PostgreSQL is running"
echo ""

# Create database if it doesn't exist
echo "📊 Creating database 'zra_taxguard'..."
psql -U postgres -tc "SELECT 1 FROM pg_database WHERE datname = 'zra_taxguard'" | grep -q 1 || \
    psql -U postgres -c "CREATE DATABASE zra_taxguard;"

echo "✅ Database created/verified"
echo ""

# Install npm dependencies
echo "📦 Installing npm dependencies..."
cd ..
npm install

echo "✅ Dependencies installed"
echo ""

# Run database migration
echo "🔄 Running database migration..."
npm run db:migrate

echo ""
echo "=================================================="
echo "✅ Setup Complete!"
echo "=================================================="
echo ""
echo "📋 Next Steps:"
echo "  1. Test the integration:  npm run db:test"
echo "  2. Start the blockchain:  npm start"
echo "  3. View API docs:         http://localhost:3001/api-docs"
echo ""
echo "🔗 Database Connection:"
echo "  Host:     localhost"
echo "  Port:     5432"
echo "  Database: zra_taxguard"
echo "  User:     postgres"
echo ""
echo "📚 Documentation: blockchain/DATABASE_INTEGRATION.md"
echo ""
