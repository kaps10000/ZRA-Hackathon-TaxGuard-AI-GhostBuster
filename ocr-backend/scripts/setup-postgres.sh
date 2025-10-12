#!/bin/bash

# PostgreSQL Database Setup Script for ZRA TaxGuard
# This script creates the database and initializes schemas

set -e

echo "=================================================="
echo "🐘 PostgreSQL Database Setup for ZRA TaxGuard"
echo "=================================================="

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Database configuration
DB_NAME="zra_taxguard"
DB_USER="postgres"

# Check if PostgreSQL is running
if ! pg_isready -q; then
    echo -e "${RED}❌ PostgreSQL is not running!${NC}"
    echo "Please start PostgreSQL with: sudo systemctl start postgresql"
    exit 1
fi

echo -e "${BLUE}📊 Creating database: $DB_NAME${NC}"

# Create database (will prompt for postgres password)
sudo -u postgres psql <<EOF
-- Drop database if exists (development only!)
DROP DATABASE IF EXISTS $DB_NAME;

-- Create fresh database
CREATE DATABASE $DB_NAME;

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE $DB_NAME TO $DB_USER;

\c $DB_NAME

-- Create schemas
CREATE SCHEMA IF NOT EXISTS ocr;
CREATE SCHEMA IF NOT EXISTS ghostbuster;
CREATE SCHEMA IF NOT EXISTS risk;
CREATE SCHEMA IF NOT EXISTS compliance;
CREATE SCHEMA IF NOT EXISTS audit;
CREATE SCHEMA IF NOT EXISTS whistlepro;
CREATE SCHEMA IF NOT EXISTS blockchain;

-- Grant schema privileges
GRANT ALL ON SCHEMA ocr TO $DB_USER;
GRANT ALL ON SCHEMA ghostbuster TO $DB_USER;
GRANT ALL ON SCHEMA risk TO $DB_USER;
GRANT ALL ON SCHEMA compliance TO $DB_USER;
GRANT ALL ON SCHEMA audit TO $DB_USER;
GRANT ALL ON SCHEMA whistlepro TO $DB_USER;
GRANT ALL ON SCHEMA blockchain TO $DB_USER;

-- Show created schemas
\dn
EOF

echo -e "${GREEN}✅ Database created successfully!${NC}"
echo ""
echo -e "${BLUE}📝 Running Sequelize migrations...${NC}"

# Run Node.js initialization script
cd "$(dirname "$0")/.."
node config/init-database.js

echo ""
echo -e "${GREEN}🎉 PostgreSQL setup completed!${NC}"
echo ""
echo "Database Information:"
echo "  - Name: $DB_NAME"
echo "  - Host: localhost"
echo "  - Port: 5432"
echo "  - Schemas: ocr, ghostbuster, risk, compliance, audit, whistlepro, blockchain"
echo ""
echo "Next steps:"
echo "  1. Update .env file with your database credentials"
echo "  2. Run: npm start"
echo ""
