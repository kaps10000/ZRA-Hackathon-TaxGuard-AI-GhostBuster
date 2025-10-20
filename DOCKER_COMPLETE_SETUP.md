# TaxGuard AI - Complete Docker Setup Guide

## Overview

This guide provides complete Docker containerization for the entire TaxGuard AI system with ALL services, databases, and mock data.

## Architecture

The complete system includes 11 containerized services:

1. **postgres** - PostgreSQL database with all ZRA mock data
2. **api-gateway** - Central API Gateway (Node.js) - Port 4001
3. **dashboard-frontend** - Integrated React/Vite Dashboard - Port 3000
4. **vrt-guard** - VAT Fraud Detection Service (Python/Flask) - Port 5002
5. **anomaly-tracker** - AI Risk Scoring Service (Python/Flask) - Port 5001
6. **ghostbuster-module** - Ghost Company Detection (Python/Flask) - Port 3004
7. **ghostbuster-backend** - GhostBuster Backend (Python/Flask) - Port 3005
8. **ocr-ai-service** - OCR AI Service (Python/FastAPI) - Port 8000
9. **ocr-backend** - OCR Backend (Node.js) - Port 5000
10. **blockchain-service** - Blockchain Ledger (Node.js) - Port 3001
11. **whistlepro-backend** - WhistlePro Cases (Node.js) - Port 4000

## Quick Start

### Prerequisites
- Docker 20.10+
- Docker Compose 2.0+
- 8GB RAM minimum
- 20GB free disk space

### One-Command Startup

```bash
# Start entire system
docker-compose -f docker-compose-full.yml up -d

# Check all services are running
docker-compose -f docker-compose-full.yml ps

# View logs
docker-compose -f docker-compose-full.yml logs -f
```

### Access Points

Once all services are running:

- **Dashboard**: http://localhost:3000
- **API Gateway**: http://localhost:4001
- **VRT Guard**: http://localhost:5002
- **Anomaly Tracker**: http://localhost:5001
- **GhostBuster Module**: http://localhost:3004
- **GhostBuster Backend**: http://localhost:3005
- **OCR AI Service**: http://localhost:8000
- **OCR Backend**: http://localhost:5000
- **Blockchain Service**: http://localhost:3001
- **WhistlePro**: http://localhost:4000
- **PostgreSQL**: localhost:5432

### Database Access

```bash
# Connect to PostgreSQL
docker exec -it zra-postgres psql -U postgres -d zra_taxguard

# View loaded mock data
SELECT * FROM taxpayers LIMIT 10;
SELECT * FROM vat_returns LIMIT 10;
SELECT * FROM transactions LIMIT 10;
```

## Mock Data

The PostgreSQL database is automatically populated with:

- **ZRA_DATASETS/zra_taxpayerMaster.csv** - 1000+ taxpayer records
- **ZRA_DATASETS/zra_salesTransactions.csv** - 14,000+ sales transactions
- **ZRA_DATASETS/zra_purchaseTransactions.csv** - 10,000+ purchase transactions
- **ZRA_DATASETS/zra_vatClaims.csv** - 2000+ VAT claim records
- **ZRA_DATASETS/zra_complianceHistory.csv** - Compliance history
- **ZRA_DATASETS/zra_thirdPartyVerification.csv** - Third-party data
- All other CSV files in ZRA_DATASETS/

## Service Dependencies

```
postgres (healthy)
  ├── api-gateway
  ├── vrt-guard
  ├── anomaly-tracker
  ├── ghostbuster-module
  ├── ghostbuster-backend
  ├── ocr-ai-service
  │   └── ocr-backend
  ├── blockchain-service
  └── whistlepro-backend

api-gateway
  └── dashboard-frontend
```

## Individual Service Management

### Start specific services

```bash
# Start only database and API Gateway
docker-compose -f docker-compose-full.yml up -d postgres api-gateway

# Start VRT Guard and its dependencies
docker-compose -f docker-compose-full.yml up -d postgres vrt-guard

# Start Anomaly Tracker
docker-compose -f docker-compose-full.yml up -d postgres anomaly-tracker
```

### Stop services

```bash
# Stop all services
docker-compose -f docker-compose-full.yml down

# Stop and remove volumes (CAUTION: deletes data)
docker-compose -f docker-compose-full.yml down -v
```

### Restart a service

```bash
# Restart VRT Guard
docker-compose -f docker-compose-full.yml restart vrt-guard

# Rebuild and restart
docker-compose -f docker-compose-full.yml up -d --build vrt-guard
```

## Troubleshooting

### Check service health

```bash
# View all service statuses
docker-compose -f docker-compose-full.yml ps

# Check specific service logs
docker-compose -f docker-compose-full.yml logs vrt-guard
docker-compose -f docker-compose-full.yml logs anomaly-tracker
docker-compose -f docker-compose-full.yml logs api-gateway
```

### Common Issues

#### Port already in use

```bash
# Check what's using port 4001
lsof -ti:4001

# Kill the process
lsof -ti:4001 | xargs kill -9

# Or change ports in docker-compose-full.yml
```

#### Service not healthy

```bash
# Check service logs
docker-compose -f docker-compose-full.yml logs <service-name>

# Restart the service
docker-compose -f docker-compose-full.yml restart <service-name>

# Rebuild if code changed
docker-compose -f docker-compose-full.yml up -d --build <service-name>
```

#### Database connection issues

```bash
# Ensure postgres is healthy
docker-compose -f docker-compose-full.yml ps postgres

# Check postgres logs
docker-compose -f docker-compose-full.yml logs postgres

# Restart postgres
docker-compose -f docker-compose-full.yml restart postgres
```

## Development Mode

For development with hot-reload:

```bash
# Use local setup (see INTEGRATION_SETUP.md)
cd vrt_guard
source venv/bin/activate
python app.py

# Docker is better for:
# - Testing full integration
# - Demos
# - Production deployment
```

## Production Deployment

### Environment Variables

Create `.env` file:

```env
# Database
POSTGRES_PASSWORD=your_secure_password_here

# API Gateway
JWT_SECRET=your_jwt_secret_here

# Blockchain
PRIVATE_KEY=your_blockchain_private_key
BLOCKCHAIN_NETWORK=mainnet
CONTRACT_ADDRESS=your_contract_address
```

### Security Considerations

1. Change default passwords in docker-compose-full.yml
2. Use secrets management (Docker Secrets or env files)
3. Enable SSL/TLS for production
4. Configure firewall rules
5. Use reverse proxy (nginx) for frontend

### Scaling

```bash
# Scale API Gateway to 3 instances
docker-compose -f docker-compose-full.yml up -d --scale api-gateway=3

# Scale VRT Guard to 2 instances
docker-compose -f docker-compose-full.yml up -d --scale vrt-guard=2
```

## Monitoring

### Resource Usage

```bash
# View resource usage
docker stats

# Specific service
docker stats zra-api-gateway zra-vrt-guard
```

### Health Checks

All services have health checks configured:

```bash
# View health status
docker inspect zra-vrt-guard | grep -A 10 Health

# Test health endpoint
curl http://localhost:5002/health
curl http://localhost:5001/health
curl http://localhost:4001/health
```

## Backup and Restore

### Backup Database

```bash
# Backup PostgreSQL data
docker exec zra-postgres pg_dump -U postgres zra_taxguard > backup.sql

# Backup with compression
docker exec zra-postgres pg_dump -U postgres zra_taxguard | gzip > backup.sql.gz
```

### Restore Database

```bash
# Restore from backup
docker exec -i zra-postgres psql -U postgres zra_taxguard < backup.sql
```

## Team Collaboration

### Sharing Configuration

Team members only need:

1. Clone repository
2. Run: `docker-compose -f docker-compose-full.yml up -d`
3. Access: http://localhost:3000

No manual setup required!

### CI/CD Integration

```yaml
# Example GitHub Actions
- name: Build and Test
  run: |
    docker-compose -f docker-compose-full.yml up -d
    docker-compose -f docker-compose-full.yml run tests
    docker-compose -f docker-compose-full.yml down
```

## Support

For issues:
1. Check logs: `docker-compose -f docker-compose-full.yml logs`
2. Verify health: `docker-compose -f docker-compose-full.yml ps`
3. Restart services: `docker-compose -f docker-compose-full.yml restart`
4. Rebuild if needed: `docker-compose -f docker-compose-full.yml up -d --build`

## Next Steps

1. Review INTEGRATION_SETUP.md for local development
2. Check individual service documentation
3. Run tests: `docker-compose -f docker-compose-full.yml run tests`
4. Deploy to staging/production

---

**Last Updated**: 2025-10-20
**Version**: 1.0.0
**Author**: TaxGuard AI Team
