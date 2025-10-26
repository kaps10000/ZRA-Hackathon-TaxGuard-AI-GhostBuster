#!/bin/bash

# TaxGuard AI - PostgreSQL Docker Setup Script
# This script sets up PostgreSQL in Docker with the required databases

echo "=========================================="
echo "TaxGuard AI - PostgreSQL Setup"
echo "=========================================="

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Stop and remove existing PostgreSQL container if it exists
echo -e "\n${YELLOW}Checking for existing PostgreSQL container...${NC}"
if docker ps -a | grep -q taxguard-postgres; then
    echo -e "${YELLOW}Stopping and removing existing container...${NC}"
    docker stop taxguard-postgres 2>/dev/null
    docker rm taxguard-postgres 2>/dev/null
fi

# Start PostgreSQL container
echo -e "\n${GREEN}Starting PostgreSQL container...${NC}"
docker run -d \
    --name taxguard-postgres \
    -e POSTGRES_PASSWORD=postgres \
    -e POSTGRES_USER=postgres \
    -p 5432:5432 \
    -v taxguard-postgres-data:/var/lib/postgresql/data \
    postgres:17-alpine

# Wait for PostgreSQL to be ready
echo -e "\n${YELLOW}Waiting for PostgreSQL to be ready...${NC}"
sleep 5

MAX_RETRIES=30
RETRY_COUNT=0
until docker exec taxguard-postgres pg_isready -U postgres > /dev/null 2>&1 || [ $RETRY_COUNT -eq $MAX_RETRIES ]; do
    echo -e "${YELLOW}Waiting for PostgreSQL... ($((RETRY_COUNT + 1))/$MAX_RETRIES)${NC}"
    sleep 1
    RETRY_COUNT=$((RETRY_COUNT + 1))
done

if [ $RETRY_COUNT -eq $MAX_RETRIES ]; then
    echo -e "${RED}Failed to connect to PostgreSQL after $MAX_RETRIES attempts${NC}"
    exit 1
fi

echo -e "${GREEN}✓ PostgreSQL is ready!${NC}"

# Create databases
echo -e "\n${GREEN}Creating databases...${NC}"

docker exec -i taxguard-postgres psql -U postgres << EOF
-- Create zra_taxguard database
SELECT 'CREATE DATABASE zra_taxguard'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'zra_taxguard')\gexec

-- Create whistlepro database
SELECT 'CREATE DATABASE whistlepro'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'whistlepro')\gexec

-- List databases
\l
EOF

# Create schemas and tables for zra_taxguard
echo -e "\n${GREEN}Setting up zra_taxguard database schema...${NC}"

docker exec -i taxguard-postgres psql -U postgres -d zra_taxguard << EOF
-- Create schemas for different modules
CREATE SCHEMA IF NOT EXISTS ocr;
CREATE SCHEMA IF NOT EXISTS ghostbuster;
CREATE SCHEMA IF NOT EXISTS risk;
CREATE SCHEMA IF NOT EXISTS compliance;
CREATE SCHEMA IF NOT EXISTS audit;
CREATE SCHEMA IF NOT EXISTS blockchain;

-- Create basic tables for OCR module
CREATE TABLE IF NOT EXISTS ocr.documents (
    id SERIAL PRIMARY KEY,
    document_hash VARCHAR(64) UNIQUE NOT NULL,
    document_type VARCHAR(50),
    taxpayer_id VARCHAR(50),
    upload_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(20) DEFAULT 'pending',
    ocr_data JSONB,
    blockchain_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS ocr.verification_records (
    id SERIAL PRIMARY KEY,
    document_id INTEGER REFERENCES ocr.documents(id),
    verification_type VARCHAR(50),
    verification_result JSONB,
    blockchain_tx_hash VARCHAR(66),
    verified_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create tables for GhostBuster module
CREATE TABLE IF NOT EXISTS ghostbuster.employees (
    id SERIAL PRIMARY KEY,
    employee_id VARCHAR(50) UNIQUE NOT NULL,
    taxpayer_id VARCHAR(50),
    name VARCHAR(255),
    national_id VARCHAR(50),
    department VARCHAR(100),
    salary DECIMAL(12, 2),
    hire_date DATE,
    status VARCHAR(20) DEFAULT 'active',
    risk_score DECIMAL(5, 2),
    is_ghost BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS ghostbuster.analysis_results (
    id SERIAL PRIMARY KEY,
    employee_id VARCHAR(50),
    analysis_type VARCHAR(50),
    risk_factors JSONB,
    anomalies JSONB,
    confidence_score DECIMAL(5, 2),
    analyzed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create tables for Blockchain module
CREATE TABLE IF NOT EXISTS blockchain.transactions (
    id SERIAL PRIMARY KEY,
    tx_hash VARCHAR(66) UNIQUE NOT NULL,
    block_number INTEGER,
    transaction_type VARCHAR(50),
    data JSONB,
    status VARCHAR(20),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create audit log table
CREATE TABLE IF NOT EXISTS audit.logs (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(50),
    action VARCHAR(100),
    entity_type VARCHAR(50),
    entity_id VARCHAR(100),
    changes JSONB,
    ip_address VARCHAR(45),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Grant permissions
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA ocr TO postgres;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA ghostbuster TO postgres;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA blockchain TO postgres;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA audit TO postgres;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA ocr TO postgres;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA ghostbuster TO postgres;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA blockchain TO postgres;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA audit TO postgres;

-- Display created tables
SELECT schemaname, tablename
FROM pg_tables
WHERE schemaname IN ('ocr', 'ghostbuster', 'blockchain', 'audit')
ORDER BY schemaname, tablename;
EOF

# Setup whistlepro database
echo -e "\n${GREEN}Setting up whistlepro database schema...${NC}"

docker exec -i taxguard-postgres psql -U postgres -d whistlepro << EOF
-- Create reports table
CREATE TABLE IF NOT EXISTS reports (
    id SERIAL PRIMARY KEY,
    report_hash VARCHAR(64) UNIQUE NOT NULL,
    category VARCHAR(50),
    description TEXT,
    evidence_files JSONB,
    status VARCHAR(20) DEFAULT 'pending',
    priority VARCHAR(20),
    submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create investigators table
CREATE TABLE IF NOT EXISTS investigators (
    id SERIAL PRIMARY KEY,
    username VARCHAR(100) UNIQUE NOT NULL,
    email VARCHAR(255),
    role VARCHAR(50) DEFAULT 'investigator',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Display created tables
\dt
EOF

# Test connections
echo -e "\n${GREEN}Testing database connections...${NC}"

echo -e "\n${YELLOW}Testing zra_taxguard connection:${NC}"
docker exec taxguard-postgres psql -U postgres -d zra_taxguard -c "SELECT current_database(), current_user, version();"

echo -e "\n${YELLOW}Testing whistlepro connection:${NC}"
docker exec taxguard-postgres psql -U postgres -d whistlepro -c "SELECT current_database(), current_user, version();"

# Display summary
echo -e "\n${GREEN}=========================================="
echo -e "PostgreSQL Setup Complete!"
echo -e "==========================================${NC}"
echo -e "${GREEN}✓ PostgreSQL is running on localhost:5432${NC}"
echo -e "${GREEN}✓ Database 'zra_taxguard' created with schemas: ocr, ghostbuster, blockchain, audit${NC}"
echo -e "${GREEN}✓ Database 'whistlepro' created with tables${NC}"
echo -e "${YELLOW}"
echo -e "Connection Details:"
echo -e "  Host: localhost"
echo -e "  Port: 5432"
echo -e "  User: postgres"
echo -e "  Password: postgres"
echo -e "  Databases: zra_taxguard, whistlepro"
echo -e "${NC}"
echo -e "${YELLOW}To stop PostgreSQL: docker stop taxguard-postgres${NC}"
echo -e "${YELLOW}To start PostgreSQL: docker start taxguard-postgres${NC}"
echo -e "${YELLOW}To view logs: docker logs taxguard-postgres${NC}"
