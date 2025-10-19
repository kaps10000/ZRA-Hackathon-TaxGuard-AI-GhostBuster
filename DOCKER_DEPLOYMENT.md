# 🐳 ZRA TaxGuard - Docker Deployment Guide

## 📋 Overview

Complete Docker-based deployment for the ZRA TaxGuard OCR verification system.

**Services Included**:
- 🐘 PostgreSQL Database (port 5432)
- 🤖 OCR AI Service - Python/FastAPI (port 8000)
- 🔧 OCR Backend - Node.js (port 5000)
- ⛓️ Blockchain Service (port 3001)
- 🎨 Frontend - React/Vite (port 3000)

---

## 🚀 Quick Start

### Prerequisites

- Docker 20.10+
- Docker Compose 2.0+
- 4GB RAM minimum
- 10GB disk space

### 1. Clone and Navigate

```bash
cd /home/kaps100/ZRA-Hackathon-TaxGuard-AI-GhostBuster
```

### 2. Start All Services

```bash
# Start all services in detached mode
docker-compose up -d

# View logs
docker-compose logs -f
```

### 3. Verify Services

```bash
# Check all services are running
docker-compose ps

# Test each service
curl http://localhost:5432  # PostgreSQL (connection will refuse, that's OK)
curl http://localhost:8000/health  # OCR AI Service
curl http://localhost:5000/health  # OCR Backend
curl http://localhost:3001/health  # Blockchain Service
curl http://localhost:3000  # Frontend
```

---

## 📦 Service Details

### PostgreSQL Database

**Container**: `zra-postgres`
**Port**: 5432
**Image**: `postgres:15-alpine`

**Credentials**:
- Database: `zra_taxguard`
- User: `postgres`
- Password: `zrapassword`

**Volumes**:
- `postgres_data` - Persistent database storage
- `./ocr-backend/database/migrations` - Auto-run migrations on startup

**Health Check**: `pg_isready` every 10s

---

### OCR AI Service (Python/FastAPI)

**Container**: `zra-ocr-ai-service`
**Port**: 8000
**Build**: `./ocr-ai-service`

**Features**:
- Tesseract OCR with OpenCV preprocessing
- NLP-based field extraction (spaCy)
- Risk scoring and anomaly detection
- Multi-format support (PNG, JPG, PDF, TIFF)

**Endpoints**:
- `GET /health` - Health check
- `GET /docs` - Swagger UI
- `POST /api/ocr/process` - OCR processing
- `POST /api/extract` - Data extraction
- `POST /api/verify` - Full verification
- `POST /api/verify/batch` - Batch processing

**Environment**:
```bash
DEBUG=false
DB_HOST=postgres
OCR_AI_SERVICE_URL=http://ocr-ai-service:8000
RISK_LOW_THRESHOLD=70.0
RISK_MEDIUM_THRESHOLD=50.0
RISK_HIGH_THRESHOLD=30.0
```

**Volumes**:
- `./ocr-ai-service/uploads` - Uploaded files
- `./ocr-ai-service/logs` - Application logs

**Health Check**: HTTP GET /health every 30s

---

### OCR Backend (Node.js)

**Container**: `zra-ocr-backend`
**Port**: 5000
**Build**: `./ocr-backend`

**Features**:
- File upload handling
- OCR AI service integration
- Security scanning
- PostgreSQL database operations
- Blockchain integration
- JWT authentication

**Endpoints**:
- `GET /health` - Health check
- `POST /api/upload` - Upload document
- `POST /api/documents/:id/scan` - Scan document
- `GET /api/security/dashboard` - Dashboard stats
- `GET /api/security/report/:id` - Security report
- (+ 10 more security endpoints)

**Environment**:
```bash
NODE_ENV=production
PORT=5000
DB_HOST=postgres
OCR_AI_SERVICE_URL=http://ocr-ai-service:8000
BLOCKCHAIN_SERVICE_URL=http://blockchain-service:3001
JWT_SECRET=zra_jwt_secret_key_change_in_production
```

**Volumes**:
- `./ocr-backend/uploads` - Uploaded files
- `./ocr-backend/logs` - Application logs

**Health Check**: HTTP GET /health every 30s

---

### Blockchain Service

**Container**: `zra-blockchain-service`
**Port**: 3001
**Build**: `./blockchain`

**Features**:
- Document hash storage on blockchain
- Verification proof generation
- Tamper-proof audit trail

**Endpoints**:
- `GET /health` - Health check
- `POST /api/ocr-verification/store` - Store verification
- `GET /api/ocr-verification/:id` - Get verification

**Environment**:
```bash
NODE_ENV=production
PORT=3001
DB_HOST=postgres
BLOCKCHAIN_NETWORK=sepolia
```

**Health Check**: HTTP GET /health every 30s

---

### Frontend (React/Vite)

**Container**: `zra-frontend`
**Port**: 3000
**Build**: `./frontend`

**Features**:
- React + TypeScript
- Vite build system
- Nginx web server
- API proxy configuration

**Environment**:
```bash
NODE_ENV=production
REACT_APP_API_URL=http://localhost:5000
REACT_APP_BLOCKCHAIN_URL=http://localhost:3001
```

**Production**: Built with nginx for optimized serving

---

## 🔧 Common Operations

### Start Services

```bash
# Start all services
docker-compose up -d

# Start specific service
docker-compose up -d ocr-ai-service

# Start with rebuild
docker-compose up -d --build
```

### Stop Services

```bash
# Stop all services
docker-compose down

# Stop and remove volumes (⚠️ deletes database!)
docker-compose down -v

# Stop specific service
docker-compose stop ocr-backend
```

### View Logs

```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f ocr-ai-service

# Last 100 lines
docker-compose logs --tail=100 ocr-backend
```

### Restart Services

```bash
# Restart all
docker-compose restart

# Restart specific service
docker-compose restart ocr-ai-service
```

### Execute Commands

```bash
# Enter container shell
docker-compose exec ocr-ai-service sh
docker-compose exec ocr-backend sh
docker-compose exec postgres psql -U postgres -d zra_taxguard

# Run migrations
docker-compose exec ocr-backend npm run db:init

# Seed mock data
docker-compose exec postgres psql -U postgres -d zra_taxguard < /docker-entrypoint-initdb.d/seed-mock-data.sql
```

---

## 🧪 Testing the Stack

### 1. Test Database Connection

```bash
docker-compose exec postgres psql -U postgres -d zra_taxguard -c "SELECT version();"
```

### 2. Test OCR AI Service

```bash
# Health check
curl http://localhost:8000/health

# Upload and verify a document
curl -X POST http://localhost:8000/api/verify \
  -F "file=@./test-document.pdf"
```

### 3. Test OCR Backend

```bash
# Health check
curl http://localhost:5000/health

# Get dashboard
curl http://localhost:5000/api/security/dashboard
```

### 4. Test Blockchain Service

```bash
# Health check
curl http://localhost:3001/health
```

### 5. Test Frontend

```bash
# Open in browser
open http://localhost:3000

# Or curl
curl http://localhost:3000
```

### 6. Full Integration Test

```bash
# Create a test script
cat > test-integration.sh << 'EOF'
#!/bin/bash

echo "🧪 Testing ZRA TaxGuard Integration"

# 1. Upload document to backend
echo "📤 Uploading document..."
UPLOAD_RESPONSE=$(curl -s -X POST http://localhost:5000/api/upload \
  -F "file=@test-invoice.pdf" \
  -F "documentType=invoice")

DOC_ID=$(echo $UPLOAD_RESPONSE | jq -r '.documentId')
echo "✅ Document uploaded: $DOC_ID"

# 2. Trigger security scan
echo "🔍 Running security scan..."
SCAN_RESPONSE=$(curl -s -X POST http://localhost:5000/api/documents/$DOC_ID/scan)
echo "✅ Scan completed"

# 3. Get security report
echo "📊 Fetching security report..."
REPORT=$(curl -s http://localhost:5000/api/security/report/$DOC_ID)
echo $REPORT | jq '.'

echo "🎉 Integration test complete!"
EOF

chmod +x test-integration.sh
./test-integration.sh
```

---

## 🐛 Troubleshooting

### Service Won't Start

```bash
# Check logs
docker-compose logs service-name

# Check if port is already in use
lsof -i :5000  # Or whichever port

# Rebuild from scratch
docker-compose down -v
docker-compose build --no-cache
docker-compose up -d
```

### Database Connection Issues

```bash
# Check PostgreSQL is ready
docker-compose exec postgres pg_isready

# View database logs
docker-compose logs postgres

# Manually connect
docker-compose exec postgres psql -U postgres -d zra_taxguard
```

### OCR AI Service Issues

```bash
# Check if Tesseract is installed
docker-compose exec ocr-ai-service tesseract --version

# Check spaCy model
docker-compose exec ocr-ai-service python -c "import spacy; nlp = spacy.load('en_core_web_sm'); print('OK')"

# View detailed logs
docker-compose logs -f ocr-ai-service
```

### Network Issues

```bash
# Check network
docker network ls | grep zra

# Inspect network
docker network inspect zra-taxguard-network

# Recreate network
docker-compose down
docker network prune
docker-compose up -d
```

### Disk Space Issues

```bash
# Check Docker disk usage
docker system df

# Clean up
docker system prune -a
docker volume prune
```

---

## 🔒 Production Deployment

### Security Checklist

- [ ] Change default passwords in `docker-compose.yml`
- [ ] Set strong `JWT_SECRET` in ocr-backend
- [ ] Configure `PRIVATE_KEY` for blockchain
- [ ] Enable HTTPS with reverse proxy (nginx/traefik)
- [ ] Set up firewall rules
- [ ] Configure backup for PostgreSQL volume
- [ ] Enable Docker logging driver
- [ ] Set resource limits (memory, CPU)
- [ ] Use Docker secrets for sensitive data
- [ ] Enable Docker security scanning

### Environment Configuration

Create `.env` file:

```bash
# Database
DB_PASSWORD=strong_random_password_here

# Backend
JWT_SECRET=super_secret_jwt_key_here
ALLOWED_ORIGINS=https://yourdomain.com

# Blockchain
PRIVATE_KEY=your_blockchain_private_key_here
CONTRACT_ADDRESS=your_deployed_contract_address
```

Update `docker-compose.yml` to use `.env`:

```yaml
environment:
  - DB_PASSWORD=${DB_PASSWORD}
  - JWT_SECRET=${JWT_SECRET}
```

### Resource Limits

Add to `docker-compose.yml`:

```yaml
services:
  ocr-ai-service:
    # ... other config ...
    deploy:
      resources:
        limits:
          cpus: '2.0'
          memory: 4G
        reservations:
          cpus: '1.0'
          memory: 2G
```

### Backup Strategy

```bash
# Backup database
docker-compose exec postgres pg_dump -U postgres zra_taxguard > backup_$(date +%Y%m%d).sql

# Restore database
cat backup_20251011.sql | docker-compose exec -T postgres psql -U postgres -d zra_taxguard

# Backup uploads
tar -czf uploads_backup.tar.gz ocr-backend/uploads/ ocr-ai-service/uploads/
```

---

## 📊 Monitoring

### View Resource Usage

```bash
# Real-time stats
docker stats

# Specific service
docker stats zra-ocr-ai-service
```

### Health Check Status

```bash
# Check all health statuses
docker-compose ps

# Watch health checks
watch -n 5 'docker-compose ps'
```

### Log Aggregation

```bash
# Export logs
docker-compose logs --no-color > full_logs.txt

# Tail all logs with timestamps
docker-compose logs -f -t
```

---

## 🚀 Performance Optimization

### Build Optimization

```bash
# Use BuildKit
export DOCKER_BUILDKIT=1
docker-compose build

# Parallel builds
docker-compose build --parallel
```

### Runtime Optimization

1. **OCR AI Service**: Already configured with 4 uvicorn workers
2. **OCR Backend**: Add `--max-old-space-size=4096` to Node.js
3. **PostgreSQL**: Tune `shared_buffers` and `work_mem`
4. **Frontend**: Already using nginx with gzip

### Scaling

```bash
# Scale OCR AI service to 3 instances
docker-compose up -d --scale ocr-ai-service=3

# Note: Need to configure load balancer (nginx) for this
```

---

## 📚 Additional Resources

- **OCR AI Service Docs**: `ocr-ai-service/README.md`
- **Dev 1 Roadmap**: `ocr-ai-service/DEV1_ROADMAP_COMPLETE.md`
- **Backend Testing**: `ocr-backend/TESTING_GUIDE.md`
- **Database Setup**: `ocr-backend/MIGRATION_GUIDE.md`

---

## 🎉 Summary

✅ **5 Docker services** configured
✅ **Multi-stage builds** for optimization
✅ **Health checks** for all services
✅ **Volume mounts** for persistence
✅ **Network isolation** with bridge network
✅ **Production-ready** configurations
✅ **Complete documentation**

**Start the entire stack with one command**:
```bash
docker-compose up -d
```

**Access the application**:
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000
- OCR AI API: http://localhost:8000
- Blockchain: http://localhost:3001

---

**Built for ZRA Hackathon 2025 - Complete Docker Deployment Ready**
