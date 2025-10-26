# TaxGuard AI - Developer Quick Start Guide

## 🚀 Get Up and Running in 10 Minutes

This guide will get your TaxGuard AI development environment up and running as quickly as possible.

## Prerequisites Check

Before starting, verify you have these installed:

```bash
# Check Docker
docker --version
# ✓ Need: Docker 20.10+

# Check Node.js
node --version
# ✓ Need: Node.js 14.0+

# Check Python
python3 --version
# ✓ Need: Python 3.8+

# Check Git
git --version
# ✓ Need: Git 2.0+
```

**❌ Missing something?** See [COMPLETE_SYSTEM_SETUP.md](./COMPLETE_SYSTEM_SETUP.md) for installation instructions.

## Quick Setup (3 Steps)

### Step 1: Clone & Navigate (30 seconds)

```bash
# Clone the repo
git clone https://github.com/yourusername/ZRA-Hackathon-TaxGuard-AI-GhostBuster.git
cd ZRA-Hackathon-TaxGuard-AI-GhostBuster
```

### Step 2: Setup Database (2 minutes)

```bash
# Run automated database setup
chmod +x setup-postgres-docker.sh
./setup-postgres-docker.sh
```

Wait for the success message:
```
✓ PostgreSQL is running on localhost:5432
✓ Database 'zra_taxguard' created with schemas
✓ Database 'whistlepro' created with tables
```

### Step 3: Install Dependencies (3-5 minutes)

```bash
# Install all service dependencies
chmod +x install-dependencies.sh
./install-dependencies.sh

# Install root dependencies for testing
npm install pg
```

## Start the System (2 minutes)

### Option A: Automated Start (Recommended)

```bash
# Start everything at once
chmod +x start-all-linux.sh
./start-all-linux.sh
```

### Option B: Manual Start (for debugging)

```bash
# Start services one by one in separate terminals

# Terminal 1: Blockchain
cd blockchain && npm start

# Terminal 2: AI Service
cd ai-service && npm start

# Terminal 3: OCR Backend
cd ocr-backend && npm start

# Terminal 4: Whistlepro
cd whistlepro_backend && npm start

# Terminal 5: GhostBuster
cd GhostBuster/backend && python3 app.py

# Terminal 6: Predictive Analytics
cd predictive_analytics && python3 app.py

# Terminal 7: VRT Guard
cd vrt_guard && python3 app.py

# Terminal 8: API Gateway
cd api-gateway && npm start
```

## Verify Everything Works (1 minute)

```bash
# Run integration tests
node final-integration-test.js
```

**Expected Result:**
```
✓ Connected to zra_taxguard database
✓ Blockchain is healthy
✓ All services responding

Pass Rate: 85%+
🎉 All Systems Operational!
```

## Quick Service Check

```bash
# Check all services are running
curl http://localhost:4001/health    # API Gateway
curl http://localhost:3001/health    # Blockchain
curl http://localhost:5001/health    # GhostBuster
curl http://localhost:5002/health    # Predictive Analytics
curl http://localhost:5003/health    # VRT Guard
```

## Access the System

Open in your browser:

- **API Gateway**: http://localhost:4001
- **Blockchain Explorer**: http://localhost:3001/explorer
- **System Status**: http://localhost:4001/health

## Common Development Tasks

### View Logs

```bash
# API Gateway logs
tail -f api-gateway/logs/combined.log

# Blockchain logs
tail -f blockchain/logs/*.log

# All logs
tail -f */logs/*.log
```

### Restart a Service

```bash
# Example: Restart blockchain service
pkill -f "node.*blockchain"
cd blockchain && npm start &
```

### Check Database

```bash
# View zra_taxguard tables
PGPASSWORD=postgres psql -h localhost -U postgres -d zra_taxguard -c "\dt ocr.*"

# View blockchain transactions
PGPASSWORD=postgres psql -h localhost -U postgres -d zra_taxguard \
  -c "SELECT COUNT(*) FROM blockchain.transactions;"
```

### Reset Database

```bash
# Stop and remove PostgreSQL container
docker stop taxguard-postgres
docker rm taxguard-postgres

# Remove volume (deletes all data)
docker volume rm taxguard-postgres-data

# Recreate
./setup-postgres-docker.sh
```

### Add Test Data

```bash
# Add a blockchain event
curl -X POST http://localhost:3001/api/events \
  -H "Content-Type: application/json" \
  -d '{
    "eventType": "test",
    "anonymizedUserId": "dev-user-123",
    "hashOfPayload": "test-hash-456",
    "notes": "Test event from developer"
  }'

# Verify it was added
curl http://localhost:3001/api/events | jq
```

## Development Workflow

### 1. Make Code Changes

Edit files in your favorite editor:
```bash
# Example: Edit blockchain service
code blockchain/server.js
```

### 2. Restart the Service

```bash
# Kill the service
pkill -f "node.*blockchain"

# Start it again
cd blockchain && npm start &
```

### 3. Test Your Changes

```bash
# Test specific endpoint
curl http://localhost:3001/your-new-endpoint

# Run integration tests
node final-integration-test.js
```

### 4. Check Logs for Errors

```bash
# Real-time log monitoring
tail -f blockchain/logs/*.log
```

## Debugging Tips

### Service Won't Start

```bash
# Check if port is already in use
netstat -tuln | grep <PORT_NUMBER>

# Kill process using the port
sudo lsof -i :<PORT_NUMBER>
kill -9 <PID>
```

### Database Connection Errors

```bash
# Test database connection
PGPASSWORD=postgres psql -h localhost -U postgres -c "SELECT 1"

# Check if PostgreSQL container is running
docker ps | grep postgres

# Restart PostgreSQL
docker restart taxguard-postgres
```

### Service Crashes

```bash
# Check the logs
tail -50 <service>/logs/*.log

# Check for missing dependencies
cd <service> && npm install  # for Node.js
pip3 install -r requirements.txt  # for Python
```

## Quick Reference

### Service Ports

| Service | Port | Type | Health Check |
|---------|------|------|--------------|
| PostgreSQL | 5432 | Database | `docker exec taxguard-postgres pg_isready` |
| OCR Backend | 3000 | Node.js | `curl http://localhost:3000/health` |
| Blockchain Service | 3001 | Node.js | `curl http://localhost:3001/health` |
| Whistlepro Backend | 3005 | Node.js | `curl http://localhost:3005/` |
| API Gateway | 4001 | Node.js | `curl http://localhost:4001/health` |
| OCR AI Service | 5000 | Node.js | `curl http://localhost:5000/` |
| GhostBuster Backend | 5001 | Python | `curl http://localhost:5001/health` |
| Anomaly Tracker (AI Risk Score) | 5002 | Python | `curl http://localhost:5002/health` |
| VRT Guard | 5003 | Python | `curl http://localhost:5003/health` |
| GhostBuster Module | 5004 | Python | `curl http://localhost:5004/health` |
| Dashboard Frontend | 5173 | React/Vite | `curl http://localhost:5173/` |

### Database Credentials

```
Host: localhost
Port: 5432
User: postgres
Password: postgres
Databases: zra_taxguard, whistlepro
```

### Useful Commands

```bash
# Stop all services
pkill -f "node"; pkill -f "python3.*app.py"

# Stop PostgreSQL
docker stop taxguard-postgres

# Start PostgreSQL
docker start taxguard-postgres

# View all running services
ps aux | grep -E "node|python3"

# Check all ports in use
netstat -tuln | grep LISTEN

# Full system restart
./stop-all-services.sh && sleep 5 && ./start-all-linux.sh
```

## Testing Your Changes

### Unit Tests

```bash
# Run service-specific tests
cd <service-directory>
npm test  # for Node.js services
pytest    # for Python services
```

### Integration Tests

```bash
# Run full integration test suite
node final-integration-test.js

# Run database-only tests
node test-database-blockchain-integration.js
```

### Manual API Testing

```bash
# Test OCR upload
curl -X POST http://localhost:3000/api/upload \
  -F "file=@test-document.pdf"

# Test GhostBuster analysis
curl -X POST http://localhost:5001/api/analyze \
  -H "Content-Type: application/json" \
  -d '{"employee_data": {...}}'

# Test blockchain verification
curl -X POST http://localhost:3001/api/events \
  -H "Content-Type: application/json" \
  -d '{"eventType": "test", ...}'
```

## Environment Variables

### Quick Override

```bash
# Temporarily change port
PORT=3002 npm start

# Use different database
DB_NAME=test_database npm start

# Enable debug mode
DEBUG=* npm start
```

### Permanent Changes

Edit the `.env` file in each service directory:

```bash
# Example: blockchain/.env
nano blockchain/.env

# Change values
PORT=3001
DB_HOST=localhost
LOG_LEVEL=debug
```

## Git Workflow

### Before Committing

```bash
# Check what changed
git status

# View changes
git diff

# Add files
git add .

# Commit with descriptive message
git commit -m "Add: New blockchain verification endpoint"
```

### Working with Branches

```bash
# Create feature branch
git checkout -b feature/new-feature

# Make changes and commit
git add .
git commit -m "Implement new feature"

# Push to remote
git push origin feature/new-feature

# Merge to main (after review)
git checkout main
git merge feature/new-feature
```

## Performance Monitoring

### Check Service Health

```bash
# CPU and memory usage
top
# Press 'M' to sort by memory

# Specific service
ps aux | grep node

# Docker stats
docker stats taxguard-postgres
```

### Database Performance

```bash
# Connect to database
PGPASSWORD=postgres psql -h localhost -U postgres -d zra_taxguard

# Check active queries
SELECT * FROM pg_stat_activity;

# Check database size
SELECT pg_size_pretty(pg_database_size('zra_taxguard'));

# Check table sizes
SELECT schemaname, tablename, pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename))
FROM pg_tables
WHERE schemaname IN ('ocr', 'blockchain')
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

## Common Issues & Quick Fixes

### Port Already in Use

```bash
# Find and kill the process
sudo lsof -i :<PORT>
kill -9 <PID>
```

### Out of Memory

```bash
# Restart services
./stop-all-services.sh
sleep 5
./start-all-linux.sh

# Or restart PostgreSQL
docker restart taxguard-postgres
```

### Module Not Found

```bash
# Reinstall dependencies
cd <service>
rm -rf node_modules
npm install
```

### Database Connection Refused

```bash
# Check PostgreSQL is running
docker ps | grep postgres

# Restart if needed
docker restart taxguard-postgres

# Wait for it to be ready
sleep 5
docker exec taxguard-postgres pg_isready -U postgres
```

## Getting Help

### Documentation

- **Full Setup**: [COMPLETE_SYSTEM_SETUP.md](./COMPLETE_SYSTEM_SETUP.md)
- **Database**: [DATABASE_SETUP_README.md](./DATABASE_SETUP_README.md)
- **Blockchain**: [BLOCKCHAIN_INTEGRATION_README.md](./BLOCKCHAIN_INTEGRATION_README.md)

### Logs

```bash
# Check all logs for errors
grep -r "ERROR" */logs/*.log
grep -r "FATAL" */logs/*.log

# View last 50 lines of all logs
tail -50 */logs/*.log
```

### Health Checks

```bash
# Run comprehensive health check
node final-integration-test.js

# Quick health check (all services)
for port in 3000 3001 3005 4001 5000 5001 5002 5003; do
  echo "Port $port: $(curl -s http://localhost:$port/health | grep -o 'healthy\|ok' || echo 'NOT OK')"
done
```

## Next Steps

Now that you're up and running:

1. **Explore the APIs**: http://localhost:3001/api-docs
2. **View the Blockchain**: http://localhost:3001/explorer
3. **Read the Architecture**: [COMPLETE_SYSTEM_SETUP.md](./COMPLETE_SYSTEM_SETUP.md)
4. **Start Development**: Pick a service and start coding!
5. **Run Tests**: `npm test` or `pytest` in service directories

## Pro Tips

💡 **Use tmux/screen** for managing multiple terminal sessions
```bash
# Install tmux
sudo apt-get install tmux

# Start tmux session
tmux new -s taxguard

# Split windows: Ctrl+B then %
# Switch windows: Ctrl+B then arrow keys
```

💡 **Set up auto-restart with nodemon**
```bash
npm install -g nodemon
# Use: nodemon server.js instead of node server.js
```

💡 **Create shell aliases**
```bash
# Add to ~/.bashrc or ~/.zshrc
alias taxguard-start='cd ~/ZRA-Hackathon-TaxGuard-AI-GhostBuster && ./start-all-linux.sh'
alias taxguard-stop='cd ~/ZRA-Hackathon-TaxGuard-AI-GhostBuster && ./stop-all-services.sh'
alias taxguard-test='cd ~/ZRA-Hackathon-TaxGuard-AI-GhostBuster && node final-integration-test.js'
```

💡 **Use jq for JSON formatting**
```bash
# Install jq
sudo apt-get install jq

# Use with curl
curl http://localhost:3001/health | jq
```

---

**Happy Coding! 🚀**

Questions? Check the docs or run `node final-integration-test.js` to verify your setup.
