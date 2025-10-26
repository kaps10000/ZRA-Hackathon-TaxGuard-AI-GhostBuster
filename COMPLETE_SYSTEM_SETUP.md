# TaxGuard AI - Complete System Setup Guide

## Table of Contents
1. [Overview](#overview)
2. [System Architecture](#system-architecture)
3. [Prerequisites](#prerequisites)
4. [Installation Steps](#installation-steps)
5. [Service Configuration](#service-configuration)
6. [Starting the System](#starting-the-system)
7. [Verification & Testing](#verification--testing)
8. [Troubleshooting](#troubleshooting)

## Overview

TaxGuard AI is a comprehensive tax fraud detection and compliance system with the following components:

- **PostgreSQL Database** - Data persistence (2 databases, multiple schemas)
- **API Gateway** - Central routing and request management
- **Dashboard Frontend** - React/Vite user interface
- **VRT Guard** - VAT return tracking
- **Anomaly Tracker** - AI risk scoring and predictive analytics
- **GhostBuster Module** - Ghost employee detection module
- **GhostBuster Backend** - Ghost employee detection backend
- **OCR AI Service** - Machine learning and OCR processing
- **OCR Backend** - Document processing and extraction
- **Blockchain Service** - Immutable audit trail and verification
- **Whistlepro Backend** - Whistleblower reporting system

## System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     API Gateway (4001)                       │
│              Central routing & request handling              │
└────────┬────────────────────────────────────────────────────┘
         │
    ┌────┴──────────────────────────────────────────┐
    │                                                │
┌───▼────────┐  ┌──────────┐  ┌─────────────┐  ┌───▼──────────┐
│  OCR       │  │ AI       │  │ GhostBuster │  │ Predictive   │
│  Backend   │  │ Service  │  │  (5001)     │  │ Analytics    │
│  (3000)    │  │ (5000)   │  │             │  │  (5002)      │
└─────┬──────┘  └────┬─────┘  └──────┬──────┘  └───────┬──────┘
      │              │               │                  │
┌─────▼──────┐  ┌───▼────────┐  ┌───▼──────────┐  ┌───▼─────────┐
│ VRT Guard  │  │ Whistlepro │  │  Blockchain  │  │ PostgreSQL  │
│  (5003)    │  │  (3005)    │  │   (3001)     │  │  (5432)     │
└────────────┘  └────────────┘  └──────┬───────┘  └──────┬──────┘
                                       │                  │
                              ┌────────▼──────────────────▼─────┐
                              │    PostgreSQL Databases         │
                              │  • zra_taxguard (4 schemas)     │
                              │  • whistlepro (2 tables)        │
                              └─────────────────────────────────┘
```

## Prerequisites

### 1. System Requirements

**Minimum:**
- OS: Linux (Ubuntu 20.04+), macOS, or Windows with WSL2
- RAM: 8 GB
- Disk: 20 GB free space
- CPU: 4 cores

**Recommended:**
- RAM: 16 GB
- Disk: 50 GB SSD
- CPU: 8 cores

### 2. Required Software

#### Docker & Docker Compose
```bash
# Check installation
docker --version          # Should be 20.10+
docker-compose --version  # Should be 1.29+

# Install on Ubuntu/Debian
sudo apt-get update
sudo apt-get install docker.io docker-compose

# Start Docker service
sudo systemctl enable docker
sudo systemctl start docker

# Add user to docker group (optional)
sudo usermod -aG docker $USER
# Log out and back in for this to take effect
```

#### Node.js & npm
```bash
# Check installation
node --version   # Should be v14.0.0 or higher
npm --version    # Should be 6.0.0 or higher

# Install Node.js 18.x (LTS) on Ubuntu/Debian
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Verify installation
node --version
npm --version
```

#### Git
```bash
# Check installation
git --version

# Install on Ubuntu/Debian
sudo apt-get install git
```

#### Python (for some services)
```bash
# Check installation
python3 --version  # Should be 3.8+
pip3 --version

# Install on Ubuntu/Debian
sudo apt-get install python3 python3-pip
```

#### Additional Tools
```bash
# Install curl, wget, and other utilities
sudo apt-get install curl wget net-tools jq

# PostgreSQL client tools (optional, for manual testing)
sudo apt-get install postgresql-client
```

## Installation Steps

### Step 1: Clone the Repository

```bash
# Clone the repository
git clone https://github.com/yourusername/ZRA-Hackathon-TaxGuard-AI-GhostBuster.git

# Navigate to project directory
cd ZRA-Hackathon-TaxGuard-AI-GhostBuster

# Verify you're in the right directory
ls -la
```

### Step 2: Set Up PostgreSQL Database

```bash
# Run the automated database setup script
chmod +x setup-postgres-docker.sh
./setup-postgres-docker.sh

# Wait for completion (about 1-2 minutes)
# You should see:
# ✓ PostgreSQL is running on localhost:5432
# ✓ Database 'zra_taxguard' created with schemas
# ✓ Database 'whistlepro' created with tables
```

**Verify database setup:**
```bash
# Test connection to zra_taxguard
PGPASSWORD=postgres psql -h localhost -U postgres -d zra_taxguard -c "\dt ocr.*"

# Test connection to whistlepro
PGPASSWORD=postgres psql -h localhost -U postgres -d whistlepro -c "\dt"
```

📖 **Detailed Guide:** See `DATABASE_SETUP_README.md`

### Step 3: Install Service Dependencies

Install dependencies for all services:

```bash
# Install all dependencies at once
chmod +x install-dependencies.sh
./install-dependencies.sh

# Or install manually for each service:

# API Gateway
cd api-gateway && npm install && cd ..

# Blockchain Service
cd blockchain && npm install && cd ..

# OCR Backend
cd ocr-backend && npm install && cd ..

# AI Service
cd ai-service && npm install && cd ..

# GhostBuster
cd GhostBuster/backend && pip3 install -r requirements.txt && cd ../..
cd GhostBuster/frontend && npm install && cd ../..

# Predictive Analytics
cd predictive_analytics && pip3 install -r requirements.txt && cd ..

# VRT Guard
cd vrt_guard && pip3 install -r requirements.txt && cd ..

# Whistlepro Backend
cd whistlepro_backend && npm install && cd ..

# Project root dependencies (for testing)
npm install pg
```

### Step 4: Configure Environment Variables

Each service needs its `.env` file configured. Most services already have `.env` files, but verify they have the correct database settings:

#### Update Database Connections

Run this command to ensure all services point to localhost:

```bash
# Update all .env files to use localhost for database
sed -i 's/DB_HOST=postgres/DB_HOST=localhost/g' */**.env
sed -i 's/DB_HOST=postgres/DB_HOST=localhost/g' */*/.env
```

#### Verify Key Configuration Files

**Blockchain Service** (`blockchain/.env`):
```bash
DB_HOST=localhost
DB_PORT=5432
DB_NAME=zra_taxguard
DB_USER=postgres
DB_PASSWORD=postgres
PORT=3001
```

**OCR Backend** (`ocr-backend/.env`):
```bash
DB_HOST=localhost
DB_PORT=5432
DB_NAME=zra_taxguard
DB_USER=postgres
DB_PASSWORD=postgres
PORT=3000
BLOCKCHAIN_API_URL=http://localhost:3001/api/ocr-verification
```

**Whistlepro Backend** (`whistlepro_backend/.env`):
```bash
DB_HOST=localhost
DB_PORT=5432
DB_NAME=whistlepro
DB_USER=postgres
DB_PASSWORD=postgres
PORT=3005
```

**AI Service** (`ai-service/.env`):
```bash
PORT=5000
MONGODB_URI=mongodb://localhost:27017/ai_ocr_service
BACKEND_URL=http://localhost:3000
```

### Step 5: Configure Service Ports

Verify no port conflicts exist:

```bash
# Check which ports are in use
netstat -tuln | grep -E "3000|3001|3005|4001|5000|5001|5002|5003|5432"

# If any required ports are in use, either:
# 1. Stop the conflicting service
# 2. Change the port in the service's .env file
```

**Port Allocation:**
- 5432: PostgreSQL
- 3000: OCR Backend
- 3001: Blockchain Service
- 3005: Whistlepro Backend
- 4001: API Gateway
- 5000: OCR AI Service
- 5001: GhostBuster Backend
- 5002: Anomaly Tracker (AI Risk Score / Predictive Analytics)
- 5003: VRT Guard
- 5004: GhostBuster Module
- 5173: Dashboard Frontend

## Service Configuration

### Individual Service Startup Order

The recommended startup order for dependencies:

1. **PostgreSQL** (via Docker) ✅ Already running
2. **Blockchain Service** (Port 3001)
3. **OCR AI Service** (Port 5000)
4. **OCR Backend** (Port 3000)
5. **Whistlepro Backend** (Port 3005)
6. **GhostBuster Backend** (Port 5001)
7. **GhostBuster Module** (Port 5004)
8. **Anomaly Tracker / AI Risk Score** (Port 5002)
9. **VRT Guard** (Port 5003)
10. **Dashboard Frontend** (Port 5173)
11. **API Gateway** (Port 4001) (last, as it connects to all services)

### Manual Service Startup

#### 1. Blockchain Service (Port 3001)
```bash
cd blockchain
npm start &
# Wait 5 seconds
curl http://localhost:3001/health
cd ..
```

#### 2. AI Service (Port 5000)
```bash
cd ai-service
npm start &
# Wait 5 seconds
curl http://localhost:5000/
cd ..
```

#### 3. OCR Backend (Port 3000)
```bash
cd ocr-backend
npm start &
# Wait 5 seconds
cd ..
```

#### 4. Whistlepro Backend (Port 3005)
```bash
cd whistlepro_backend
npm start &
# Wait 5 seconds
cd ..
```

#### 5. GhostBuster (Port 5001)
```bash
cd GhostBuster/backend
python3 app.py &
# Wait 5 seconds
curl http://localhost:5001/health
cd ../..
```

#### 6. Predictive Analytics (Port 5002)
```bash
cd predictive_analytics
python3 app.py &
# Wait 5 seconds
curl http://localhost:5002/health
cd ..
```

#### 7. VRT Guard (Port 5003)
```bash
cd vrt_guard
python3 app.py &
# Wait 5 seconds
curl http://localhost:5003/health
cd ..
```

#### 8. API Gateway (Port 4001)
```bash
cd api-gateway
npm start &
# Wait 5 seconds
curl http://localhost:4001/health
cd ..
```

## Starting the System

### Quick Start (All Services)

Use the automated startup script:

```bash
# Make startup script executable
chmod +x start-all-linux.sh

# Start all services
./start-all-linux.sh

# The script will:
# - Check if PostgreSQL is running
# - Start all Node.js services
# - Start all Python services
# - Wait for each service to be ready
# - Display status of all services
```

**Expected Output:**
```
========================================
Starting TaxGuard AI Services
========================================

✓ PostgreSQL is running on port 5432
✓ Starting Blockchain Service (3001)...
✓ Starting AI Service (5000)...
✓ Starting OCR Backend (3000)...
✓ Starting Whistlepro Backend (3005)...
✓ Starting GhostBuster (5001)...
✓ Starting Predictive Analytics (5002)...
✓ Starting VRT Guard (5003)...
✓ Starting API Gateway (4001)...

========================================
All services started successfully!
========================================

Service Status:
  • PostgreSQL: ✓ Running on port 5432
  • Blockchain: ✓ Running on port 3001
  • API Gateway: ✓ Running on port 4001
  • OCR Backend: ✓ Running on port 3000
  • AI Service: ✓ Running on port 5000
  • Whistlepro: ✓ Running on port 3005
  • GhostBuster: ✓ Running on port 5001
  • Predictive Analytics: ✓ Running on port 5002
  • VRT Guard: ✓ Running on port 5003

Access Points:
  • API Gateway: http://localhost:4001
  • Blockchain Explorer: http://localhost:3001/explorer
  • System Dashboard: http://localhost:4001/dashboard
```

### Stopping All Services

```bash
# Stop all services
chmod +x stop-all-services.sh
./stop-all-services.sh

# Or manually:
pkill -f "node"
pkill -f "python3.*app.py"

# Stop PostgreSQL Docker container
docker stop taxguard-postgres
```

## Verification & Testing

### Step 1: Check All Services are Running

```bash
# Check all ports
netstat -tuln | grep -E "3000|3001|3005|4001|5000|5001|5002|5003|5432"

# Expected to see all 9 ports in LISTEN state
```

### Step 2: Run Integration Tests

```bash
# Run comprehensive integration test
node final-integration-test.js
```

**Expected Results:**
```
✓ Connected to zra_taxguard database
  ✓ Found 4 schemas: blockchain, audit, ghostbuster, ocr
  ✓ Found 6 tables across all schemas

✓ Connected to whistlepro database
  ✓ Found 2 tables: reports, investigators

✓ Blockchain is healthy
  Blockchain length: X

✓ Blockchain can access database
  Transactions in database: X

✓ API Gateway is responding
✓ OCR Backend is responding
✓ AI Service is responding
✓ Whistlepro Backend is responding
✓ GhostBuster is responding
✓ Predictive Analytics is responding
✓ VRT Guard is responding

Pass Rate: 85%+ (13/15 tests passed)

🎉 All Systems Operational!
```

### Step 3: Test Individual Services

#### Test API Gateway
```bash
curl http://localhost:4001/health | jq
```

#### Test Blockchain
```bash
curl http://localhost:3001/health | jq
```

#### Test OCR Backend
```bash
curl http://localhost:3000/health | jq
```

#### Test Database Connection
```bash
PGPASSWORD=postgres psql -h localhost -U postgres -d zra_taxguard \
  -c "SELECT schemaname, tablename FROM pg_tables WHERE schemaname IN ('ocr', 'blockchain', 'ghostbuster', 'audit');"
```

### Step 4: Access Web Interfaces

Open in your browser:

- **API Gateway Dashboard**: http://localhost:4001/
- **Blockchain Explorer**: http://localhost:3001/explorer
- **API Documentation**: http://localhost:3001/api-docs

## Service Dependencies

### Node.js Services

All Node.js services require these common dependencies:

```json
{
  "express": "^4.18.0",
  "cors": "^2.8.5",
  "dotenv": "^16.0.3",
  "helmet": "^7.0.0"
}
```

Service-specific dependencies are in each service's `package.json`.

### Python Services

Common Python dependencies:

```txt
flask>=2.3.0
flask-cors>=4.0.0
python-dotenv>=1.0.0
pandas>=2.0.0
numpy>=1.24.0
scikit-learn>=1.3.0
```

Service-specific dependencies are in each service's `requirements.txt`.

## Environment Variables Reference

### Database Connection (All Services)
```bash
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=postgres
```

### Service-Specific Databases
- **zra_taxguard**: Used by blockchain, ocr-backend, ghostbuster
- **whistlepro**: Used by whistlepro_backend

### API Endpoints
```bash
API_GATEWAY_URL=http://localhost:4001
BLOCKCHAIN_API_URL=http://localhost:3001
AI_SERVICE_URL=http://localhost:5000
OCR_BACKEND_URL=http://localhost:3000
```

## Troubleshooting

### PostgreSQL Not Running

```bash
# Check if container exists
docker ps -a | grep taxguard-postgres

# Start if stopped
docker start taxguard-postgres

# Recreate if needed
./setup-postgres-docker.sh
```

### Service Won't Start - Port Already in Use

```bash
# Find process using the port (e.g., 3001)
sudo lsof -i :3001

# Kill the process
kill -9 <PID>

# Or find and kill all node processes
pkill -f node
```

### Database Connection Errors

```bash
# Test PostgreSQL connection
PGPASSWORD=postgres psql -h localhost -U postgres -c "SELECT version();"

# Check if PostgreSQL is accepting connections
docker exec taxguard-postgres pg_isready -U postgres

# View PostgreSQL logs
docker logs taxguard-postgres | tail -50
```

### Service Dependencies Missing

```bash
# Reinstall all dependencies
./install-dependencies.sh

# Or for specific service:
cd <service-directory>
npm install  # For Node.js
pip3 install -r requirements.txt  # For Python
```

### Integration Test Failures

```bash
# Run test with verbose output
node final-integration-test.js 2>&1 | tee test-output.log

# Check individual service logs
tail -f api-gateway/logs/*.log
tail -f blockchain/logs/*.log
tail -f GhostBuster/backend/logs/*.log
```

### High Memory Usage

```bash
# Check memory usage by service
ps aux --sort=-%mem | head -20

# Restart services to free memory
./stop-all-services.sh
./start-all-linux.sh
```

## System Maintenance

### Database Backups

```bash
# Backup all databases
docker exec taxguard-postgres pg_dumpall -U postgres > full_backup_$(date +%Y%m%d).sql

# Backup specific database
docker exec taxguard-postgres pg_dump -U postgres zra_taxguard > zra_taxguard_backup_$(date +%Y%m%d).sql
```

### Log Rotation

```bash
# Create log rotation script
cat > rotate-logs.sh << 'EOF'
#!/bin/bash
find . -name "*.log" -size +100M -exec mv {} {}.old \;
find . -name "*.log.old" -mtime +30 -delete
EOF

chmod +x rotate-logs.sh

# Add to crontab (run daily at 2am)
crontab -e
# Add: 0 2 * * * /path/to/ZRA-Hackathon-TaxGuard-AI-GhostBuster/rotate-logs.sh
```

### System Updates

```bash
# Update all service dependencies
cd api-gateway && npm update && cd ..
cd blockchain && npm update && cd ..
cd ocr-backend && npm update && cd ..
# ... repeat for other services

# Update Python packages
pip3 install --upgrade -r requirements.txt
```

## Performance Tuning

### PostgreSQL Optimization

```sql
-- Connect to PostgreSQL
docker exec -it taxguard-postgres psql -U postgres

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_ocr_documents_hash ON ocr.documents(document_hash);
CREATE INDEX IF NOT EXISTS idx_blockchain_tx_hash ON blockchain.transactions(tx_hash);
CREATE INDEX IF NOT EXISTS idx_blockchain_created ON blockchain.transactions(created_at);
```

### Node.js Services

Set appropriate NODE_ENV:
```bash
export NODE_ENV=production
```

### Resource Limits

For production, configure in `docker-compose.yml`:
```yaml
services:
  postgres:
    deploy:
      resources:
        limits:
          cpus: '2'
          memory: 4G
```

## Security Checklist

- [ ] Change default PostgreSQL password
- [ ] Configure firewall rules
- [ ] Enable HTTPS/SSL
- [ ] Set up API authentication
- [ ] Implement rate limiting
- [ ] Regular security updates
- [ ] Configure CORS properly
- [ ] Use environment-specific configs
- [ ] Enable audit logging
- [ ] Regular backups

## Next Steps

1. **Configure Production Settings**: Update .env files for production
2. **Set Up Monitoring**: Implement monitoring with Prometheus/Grafana
3. **Configure SSL/TLS**: Set up HTTPS with Let's Encrypt
4. **Set Up CI/CD**: Implement automated deployment
5. **Performance Testing**: Load test the system
6. **Documentation**: Update API documentation
7. **Security Audit**: Conduct security review

## Additional Resources

- **Database Setup**: `DATABASE_SETUP_README.md`
- **Blockchain Integration**: `BLOCKCHAIN_INTEGRATION_README.md`
- **Quick Start Guide**: `QUICKSTART.md`
- **API Documentation**: http://localhost:3001/api-docs
- **Integration Tests**: `final-integration-test.js`

## Support

For issues or questions:
1. Check logs: `tail -f */logs/*.log`
2. Run integration tests: `node final-integration-test.js`
3. Review troubleshooting section above
4. Check individual service READMEs
5. Review GitHub issues

---

**System Version**: 1.0.0
**Last Updated**: 2025-10-26
**Maintained By**: TaxGuard AI Team
