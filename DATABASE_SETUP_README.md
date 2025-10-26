# TaxGuard AI - Database Setup Guide

## Overview

This guide will help you set up the PostgreSQL database infrastructure for the TaxGuard AI system. The system uses two PostgreSQL databases with multiple schemas to organize different modules.

## Database Architecture

### Databases

1. **zra_taxguard** - Main application database
   - **ocr schema**: Document processing and verification
   - **ghostbuster schema**: Ghost employee detection
   - **blockchain schema**: Blockchain transaction records
   - **audit schema**: System audit logs

2. **whistlepro** - Whistleblower reporting system
   - **reports**: Whistleblower reports
   - **investigators**: Investigator accounts

## Prerequisites

### Required Software

1. **Docker** (Recommended)
   ```bash
   # Check if Docker is installed
   docker --version

   # If not installed, install Docker:
   # Ubuntu/Debian
   sudo apt-get update
   sudo apt-get install docker.io docker-compose

   # Enable and start Docker
   sudo systemctl enable docker
   sudo systemctl start docker

   # Add your user to docker group (optional, to run without sudo)
   sudo usermod -aG docker $USER
   # Log out and back in for this to take effect
   ```

2. **Node.js & npm** (for testing)
   ```bash
   # Check versions
   node --version  # Should be v14+
   npm --version

   # Install if needed
   curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
   sudo apt-get install -y nodejs
   ```

3. **PostgreSQL Client Tools** (optional, for manual testing)
   ```bash
   sudo apt-get install postgresql-client
   ```

## Quick Setup (Recommended)

### Option 1: Automated Setup with Docker

We provide an automated script that sets up everything:

```bash
# Navigate to project directory
cd ZRA-Hackathon-TaxGuard-AI-GhostBuster

# Run the setup script
chmod +x setup-postgres-docker.sh
./setup-postgres-docker.sh
```

This script will:
- ✅ Pull PostgreSQL 17 Alpine image from Docker
- ✅ Create and start a PostgreSQL container named `taxguard-postgres`
- ✅ Create both databases (`zra_taxguard`, `whistlepro`)
- ✅ Set up all schemas and tables
- ✅ Configure proper permissions
- ✅ Expose PostgreSQL on `localhost:5432`

**Expected Output:**
```
==========================================
PostgreSQL Setup Complete!
==========================================
✓ PostgreSQL is running on localhost:5432
✓ Database 'zra_taxguard' created with schemas: ocr, ghostbuster, blockchain, audit
✓ Database 'whistlepro' created with tables

Connection Details:
  Host: localhost
  Port: 5432
  User: postgres
  Password: postgres
  Databases: zra_taxguard, whistlepro
```

### Option 2: Manual Docker Setup

If you prefer to set up manually:

```bash
# 1. Start PostgreSQL container
docker run -d \
    --name taxguard-postgres \
    -e POSTGRES_PASSWORD=postgres \
    -e POSTGRES_USER=postgres \
    -p 5432:5432 \
    -v taxguard-postgres-data:/var/lib/postgresql/data \
    postgres:17-alpine

# 2. Wait for PostgreSQL to be ready
sleep 10

# 3. Create databases
docker exec -i taxguard-postgres psql -U postgres << EOF
CREATE DATABASE zra_taxguard;
CREATE DATABASE whistlepro;
\l
EOF

# 4. Run schema setup scripts (see Manual Schema Setup section)
```

## Database Schema Details

### zra_taxguard Database

#### OCR Schema Tables

**documents**
```sql
CREATE TABLE ocr.documents (
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
```

**verification_records**
```sql
CREATE TABLE ocr.verification_records (
    id SERIAL PRIMARY KEY,
    document_id INTEGER REFERENCES ocr.documents(id),
    verification_type VARCHAR(50),
    verification_result JSONB,
    blockchain_tx_hash VARCHAR(66),
    verified_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### GhostBuster Schema Tables

**employees**
```sql
CREATE TABLE ghostbuster.employees (
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
```

**analysis_results**
```sql
CREATE TABLE ghostbuster.analysis_results (
    id SERIAL PRIMARY KEY,
    employee_id VARCHAR(50),
    analysis_type VARCHAR(50),
    risk_factors JSONB,
    anomalies JSONB,
    confidence_score DECIMAL(5, 2),
    analyzed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### Blockchain Schema Tables

**transactions**
```sql
CREATE TABLE blockchain.transactions (
    id SERIAL PRIMARY KEY,
    tx_hash VARCHAR(66) UNIQUE NOT NULL,
    block_number INTEGER,
    transaction_type VARCHAR(50),
    data JSONB,
    status VARCHAR(20),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### Audit Schema Tables

**logs**
```sql
CREATE TABLE audit.logs (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(50),
    action VARCHAR(100),
    entity_type VARCHAR(50),
    entity_id VARCHAR(100),
    changes JSONB,
    ip_address VARCHAR(45),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### whistlepro Database

**reports**
```sql
CREATE TABLE reports (
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
```

**investigators**
```sql
CREATE TABLE investigators (
    id SERIAL PRIMARY KEY,
    username VARCHAR(100) UNIQUE NOT NULL,
    email VARCHAR(255),
    role VARCHAR(50) DEFAULT 'investigator',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## Connection Configuration

### Environment Variables

Each service needs to be configured with the correct database connection settings:

#### Blockchain Service (.env)
```bash
DB_HOST=localhost
DB_PORT=5432
DB_NAME=zra_taxguard
DB_USER=postgres
DB_PASSWORD=postgres
```

#### OCR Backend (.env)
```bash
DB_HOST=localhost
DB_PORT=5432
DB_NAME=zra_taxguard
DB_USER=postgres
DB_PASSWORD=postgres
```

#### Whistlepro Backend (.env)
```bash
DB_HOST=localhost
DB_PORT=5432
DB_NAME=whistlepro
DB_USER=postgres
DB_PASSWORD=postgres
```

## Testing the Database Connection

### 1. Run the Integration Test Script

```bash
# Install dependencies if needed
npm install pg

# Run the comprehensive test
node final-integration-test.js
```

**Expected Output:**
```
✓ Connected to zra_taxguard database
  Database: zra_taxguard
  ✓ Found 4 schemas: blockchain, audit, ghostbuster, ocr
  ✓ Found 6 tables across all schemas

✓ Connected to whistlepro database
  Database: whistlepro
  ✓ Found 2 tables: reports, investigators
```

### 2. Manual Testing with psql

```bash
# Test zra_taxguard database
PGPASSWORD=postgres psql -h localhost -U postgres -d zra_taxguard -c "\dt ocr.*"

# Test whistlepro database
PGPASSWORD=postgres psql -h localhost -U postgres -d whistlepro -c "\dt"

# Check schemas in zra_taxguard
PGPASSWORD=postgres psql -h localhost -U postgres -d zra_taxguard -c "\dn"
```

### 3. Test from Node.js Application

```javascript
const { Pool } = require('pg');

const pool = new Pool({
    host: 'localhost',
    port: 5432,
    database: 'zra_taxguard',
    user: 'postgres',
    password: 'postgres'
});

pool.query('SELECT current_database(), version()', (err, result) => {
    if (err) {
        console.error('Connection error:', err);
    } else {
        console.log('Connected to:', result.rows[0]);
    }
    pool.end();
});
```

## Managing the Database

### Starting/Stopping PostgreSQL

```bash
# Start the container
docker start taxguard-postgres

# Stop the container
docker stop taxguard-postgres

# Restart the container
docker restart taxguard-postgres

# Check container status
docker ps -a | grep taxguard-postgres

# View PostgreSQL logs
docker logs taxguard-postgres

# Follow logs in real-time
docker logs -f taxguard-postgres
```

### Backing Up the Database

```bash
# Backup zra_taxguard database
docker exec taxguard-postgres pg_dump -U postgres zra_taxguard > zra_taxguard_backup.sql

# Backup whistlepro database
docker exec taxguard-postgres pg_dump -U postgres whistlepro > whistlepro_backup.sql

# Backup all databases
docker exec taxguard-postgres pg_dumpall -U postgres > full_backup.sql
```

### Restoring from Backup

```bash
# Restore zra_taxguard database
cat zra_taxguard_backup.sql | docker exec -i taxguard-postgres psql -U postgres -d zra_taxguard

# Restore whistlepro database
cat whistlepro_backup.sql | docker exec -i taxguard-postgres psql -U postgres -d whistlepro
```

### Accessing PostgreSQL Shell

```bash
# Connect to PostgreSQL inside the container
docker exec -it taxguard-postgres psql -U postgres

# Once inside, you can:
\l                          # List databases
\c zra_taxguard            # Connect to database
\dn                        # List schemas
\dt ocr.*                  # List tables in ocr schema
\d ocr.documents           # Describe table structure
SELECT COUNT(*) FROM ocr.documents;  # Run queries
\q                         # Quit
```

## Troubleshooting

### Issue: Port 5432 already in use

**Solution:**
```bash
# Check what's using port 5432
sudo netstat -tuln | grep 5432
# or
sudo lsof -i :5432

# Stop the conflicting process or use a different port
# To use a different port (e.g., 5433):
docker run -d \
    --name taxguard-postgres \
    -e POSTGRES_PASSWORD=postgres \
    -p 5433:5432 \
    postgres:17-alpine

# Update .env files to use DB_PORT=5433
```

### Issue: Container won't start

**Solution:**
```bash
# Check Docker daemon status
sudo systemctl status docker

# Check container logs
docker logs taxguard-postgres

# Remove and recreate container
docker stop taxguard-postgres
docker rm taxguard-postgres
./setup-postgres-docker.sh
```

### Issue: Connection refused

**Solution:**
```bash
# Check if PostgreSQL is ready
docker exec taxguard-postgres pg_isready -U postgres

# Check if container is running
docker ps | grep taxguard-postgres

# Check PostgreSQL logs for errors
docker logs taxguard-postgres | tail -50
```

### Issue: Authentication failed

**Solution:**
```bash
# Verify password in .env files matches 'postgres'
# Check connection string format:
# postgresql://postgres:postgres@localhost:5432/zra_taxguard
```

## Security Considerations

### Production Deployment

⚠️ **IMPORTANT**: The current setup uses default credentials for development. For production:

1. **Change default password:**
```bash
docker exec -it taxguard-postgres psql -U postgres -c "ALTER USER postgres WITH PASSWORD 'your_strong_password';"
```

2. **Update .env files** with the new password

3. **Restrict network access:**
```bash
# Only expose on localhost (default)
-p 127.0.0.1:5432:5432
```

4. **Enable SSL/TLS** for database connections

5. **Use environment-specific credentials** (dev, staging, prod)

6. **Implement database user roles** with minimal privileges

7. **Regular backups** (automated)

## Additional Resources

- PostgreSQL Official Documentation: https://www.postgresql.org/docs/
- Docker PostgreSQL: https://hub.docker.com/_/postgres
- Node.js pg driver: https://node-postgres.com/

## Support

For issues or questions:
1. Check the troubleshooting section above
2. Review PostgreSQL logs: `docker logs taxguard-postgres`
3. Run the integration test: `node final-integration-test.js`
4. Check service-specific logs in each service's `logs/` directory
