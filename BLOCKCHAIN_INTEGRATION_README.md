# TaxGuard AI - Blockchain Integration Guide

## Overview

The TaxGuard AI system uses blockchain technology to ensure data integrity, immutability, and transparency for tax-related transactions and document verification. This guide covers the blockchain service setup, integration with the database, and usage.

## Blockchain Architecture

### Components

1. **Blockchain Service** (Port 3001)
   - In-memory blockchain implementation
   - RESTful API for blockchain operations
   - WebSocket support for real-time updates
   - PostgreSQL integration for persistent storage
   - Block explorer interface

2. **Database Integration**
   - Schema: `blockchain` in `zra_taxguard` database
   - Table: `transactions` for blockchain transaction records
   - Automatic synchronization between blockchain and database

3. **Integration Points**
   - OCR verification records
   - Document authenticity validation
   - Audit trail logging
   - Event tracking

## Prerequisites

### System Requirements

1. **Node.js** (v14 or higher)
   ```bash
   node --version  # Should be v14+
   npm --version
   ```

2. **PostgreSQL Database** (configured and running)
   - See `DATABASE_SETUP_README.md` for setup
   - Database: `zra_taxguard`
   - Schema: `blockchain`

3. **Required Dependencies**
   ```bash
   # Navigate to blockchain directory
   cd blockchain

   # Install dependencies
   npm install
   ```

### Dependencies List

The blockchain service requires the following npm packages:

```json
{
  "dependencies": {
    "express": "^4.18.2",
    "cors": "^2.8.5",
    "dotenv": "^16.0.3",
    "pg": "^8.11.0",
    "crypto": "^1.0.1",
    "ws": "^8.13.0",
    "helmet": "^7.0.0",
    "express-rate-limit": "^6.8.0"
  }
}
```

## Installation & Setup

### Step 1: Environment Configuration

Create or verify the `.env` file in the `blockchain/` directory:

```bash
# Navigate to blockchain directory
cd blockchain

# Copy example .env if it doesn't exist
cp .env.example .env

# Edit the .env file
nano .env
```

**Required .env Configuration:**
```bash
# Blockchain API Configuration
NODE_ENV=development
PORT=3001

# PostgreSQL Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=zra_taxguard
DB_USER=postgres
DB_PASSWORD=postgres

# API Configuration
API_KEY=taxguard_blockchain_api_key_2025

# WebSocket Configuration
WEBSOCKET_ENABLED=true

# Security
ENCRYPTION_KEY=taxguard_encryption_key_2025_very_secret
JWT_SECRET=taxguard_jwt_secret_2025

# External Service URLs
API_GATEWAY_URL=http://localhost:4001
FRONTEND_URL=http://localhost:5173

# CORS Origins
CORS_ORIGINS=http://localhost:5173,http://localhost:3000,http://127.0.0.1:44371

# Logging
LOG_LEVEL=info
```

### Step 2: Database Setup

The blockchain schema should already be created if you followed `DATABASE_SETUP_README.md`. Verify:

```bash
PGPASSWORD=postgres psql -h localhost -U postgres -d zra_taxguard -c "\dt blockchain.*"
```

Expected output:
```
                List of relations
  Schema    |     Name     | Type  |  Owner
------------+--------------+-------+----------
 blockchain | transactions | table | postgres
```

### Step 3: Install Dependencies

```bash
# From the blockchain directory
npm install
```

### Step 4: Start the Blockchain Service

```bash
# Development mode
npm start

# Or with nodemon for auto-reload
npm run dev

# Or in background
nohup npm start > logs/blockchain.log 2>&1 &
```

**Expected Output:**
```
🔗 TaxGuard Blockchain API starting...
✅ Connected to PostgreSQL database
✅ Blockchain initialized with genesis block
🚀 Blockchain API running on port 3001
📊 Explorer available at: http://localhost:3001/explorer
📚 API Documentation: http://localhost:3001/api-docs
```

### Step 5: Verify Installation

```bash
# Check health endpoint
curl http://localhost:3001/health

# Expected response:
{
  "status": "healthy",
  "service": "TaxGuard Blockchain API",
  "version": "1.0.0",
  "blockchain": {
    "length": 1,
    "latestBlock": { ... }
  }
}
```

## Blockchain Service Architecture

### Block Structure

Each block contains:
```javascript
{
  index: Number,          // Block number in chain
  timestamp: String,      // ISO timestamp
  data: Object,          // Transaction data
  previousHash: String,  // Hash of previous block
  hash: String          // SHA-256 hash of this block
}
```

### Transaction Data Format

```javascript
{
  eventId: String,           // Unique event identifier
  eventType: String,         // Type: 'ocrVerification', 'documentUpload', etc.
  timestamp: String,         // ISO timestamp
  anonymizedUserId: String,  // Anonymized user ID
  hashOfPayload: String,     // Hash of the actual data
  notes: String             // Additional information
}
```

## API Endpoints

### 1. Health Check
```bash
GET /health
```
Returns blockchain health status and statistics.

**Example:**
```bash
curl http://localhost:3001/health | jq
```

### 2. Get Blockchain
```bash
GET /api/blockchain
```
Returns the complete blockchain.

**Example:**
```bash
curl http://localhost:3001/api/blockchain | jq
```

### 3. Get All Events
```bash
GET /api/events
```
Returns all blockchain events.

**Example:**
```bash
curl http://localhost:3001/api/events | jq
```

### 4. Add Event to Blockchain
```bash
POST /api/events
Content-Type: application/json

{
  "eventType": "ocrVerification",
  "anonymizedUserId": "user-123",
  "hashOfPayload": "sha256-hash-here",
  "notes": "Document verified successfully"
}
```

**Example:**
```bash
curl -X POST http://localhost:3001/api/events \
  -H "Content-Type: application/json" \
  -d '{
    "eventType": "ocrVerification",
    "anonymizedUserId": "user-123",
    "hashOfPayload": "abc123def456",
    "notes": "Invoice verification"
  }'
```

**Response:**
```json
{
  "success": true,
  "event": {
    "eventId": "evt-...",
    "blockIndex": 2,
    "timestamp": "2025-10-26T..."
  }
}
```

### 5. Blockchain Explorer
```bash
GET /explorer
```
Web interface to view and explore the blockchain.

**Access:** http://localhost:3001/explorer

### 6. Monitoring Stats
```bash
GET /api/monitoring/stats
```
Get blockchain statistics and metrics.

## Integration with Services

### OCR Backend Integration

The OCR backend uses blockchain to verify document authenticity:

**Example Code:**
```javascript
const axios = require('axios');

async function verifyDocument(documentHash, metadata) {
  try {
    const response = await axios.post(
      'http://localhost:3001/api/events',
      {
        eventType: 'ocrVerification',
        anonymizedUserId: metadata.userId,
        hashOfPayload: documentHash,
        notes: `Document type: ${metadata.type}`
      }
    );

    return {
      verified: true,
      blockIndex: response.data.event.blockIndex,
      txHash: response.data.event.eventId
    };
  } catch (error) {
    console.error('Blockchain verification failed:', error);
    return { verified: false, error: error.message };
  }
}
```

### GhostBuster Integration

Track ghost employee detection events:

```javascript
async function recordGhostDetection(employeeId, riskScore) {
  await axios.post('http://localhost:3001/api/events', {
    eventType: 'ghostEmployeeDetection',
    anonymizedUserId: hashEmployeeId(employeeId),
    hashOfPayload: calculateHash({ employeeId, riskScore }),
    notes: `Risk score: ${riskScore}, Status: Flagged`
  });
}
```

### Audit Trail Integration

Log system events to blockchain:

```javascript
async function logAuditEvent(action, userId, details) {
  await axios.post('http://localhost:3001/api/events', {
    eventType: 'auditLog',
    anonymizedUserId: anonymizeUserId(userId),
    hashOfPayload: calculateHash(details),
    notes: `Action: ${action}`
  });
}
```

## Database Integration

### Automatic Transaction Recording

The blockchain service automatically records all blocks to the database:

**Table: blockchain.transactions**
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

### Querying Blockchain Data from Database

```sql
-- Get all OCR verification transactions
SELECT * FROM blockchain.transactions
WHERE transaction_type = 'ocrVerification'
ORDER BY created_at DESC;

-- Count transactions by type
SELECT transaction_type, COUNT(*) as count
FROM blockchain.transactions
GROUP BY transaction_type;

-- Get recent transactions (last 24 hours)
SELECT * FROM blockchain.transactions
WHERE created_at > NOW() - INTERVAL '24 hours'
ORDER BY created_at DESC;
```

### Node.js Query Example

```javascript
const { Pool } = require('pg');

const pool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'zra_taxguard',
  user: 'postgres',
  password: 'postgres'
});

// Get blockchain transactions
async function getBlockchainTransactions(limit = 10) {
  const result = await pool.query(
    'SELECT * FROM blockchain.transactions ORDER BY created_at DESC LIMIT $1',
    [limit]
  );
  return result.rows;
}
```

## WebSocket Support

The blockchain service supports WebSocket connections for real-time updates.

### Connecting to WebSocket

```javascript
const ws = new WebSocket('ws://localhost:3001');

ws.on('open', () => {
  console.log('Connected to blockchain WebSocket');
});

ws.on('message', (data) => {
  const event = JSON.parse(data);
  console.log('New blockchain event:', event);
});

ws.on('error', (error) => {
  console.error('WebSocket error:', error);
});
```

### WebSocket Events

- **blockAdded**: Emitted when a new block is added
- **chainUpdated**: Emitted when the chain is updated
- **invalidBlock**: Emitted if an invalid block is detected

## Testing the Blockchain

### 1. Basic Health Check

```bash
curl http://localhost:3001/health
```

### 2. Add Test Event

```bash
curl -X POST http://localhost:3001/api/events \
  -H "Content-Type: application/json" \
  -d '{
    "eventType": "test",
    "anonymizedUserId": "test-user",
    "hashOfPayload": "test-hash-123",
    "notes": "Test transaction"
  }' | jq
```

### 3. View Blockchain

```bash
curl http://localhost:3001/api/blockchain | jq
```

### 4. Check Database Integration

```bash
PGPASSWORD=postgres psql -h localhost -U postgres -d zra_taxguard \
  -c "SELECT COUNT(*) FROM blockchain.transactions;"
```

### 5. Run Integration Test

```bash
# From project root
node final-integration-test.js
```

Expected to see:
```
✓ Blockchain is healthy
  Service: TaxGuard Blockchain API
  Status: healthy
  Blockchain length: X

✓ Blockchain can access database
  Transactions in database: X
```

## Monitoring & Logging

### View Logs

```bash
# If running in background
tail -f blockchain/logs/blockchain.log

# Docker logs (if using Docker)
docker logs -f taxguard-blockchain
```

### Monitoring Endpoints

```bash
# Get blockchain statistics
curl http://localhost:3001/api/monitoring/stats | jq

# Response includes:
# - Total blocks
# - Total events
# - Events by type
# - Recent activity
# - Chain validation status
```

## Security Best Practices

### 1. API Key Authentication

Configure API key in `.env`:
```bash
API_KEY=your_secure_api_key_here
```

Use in requests:
```bash
curl -H "X-API-Key: your_secure_api_key_here" \
  http://localhost:3001/api/events
```

### 2. CORS Configuration

Update allowed origins in `.env`:
```bash
CORS_ORIGINS=https://yourdomain.com,https://app.yourdomain.com
```

### 3. HTTPS in Production

Use a reverse proxy (nginx) with SSL:
```nginx
server {
    listen 443 ssl;
    server_name blockchain.yourdomain.com;

    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;

    location / {
        proxy_pass http://localhost:3001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

### 4. Rate Limiting

The service includes built-in rate limiting. Configure in code:
```javascript
// Adjust in server.js
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
```

## Troubleshooting

### Issue: Service won't start

**Check:**
```bash
# 1. Port availability
netstat -tuln | grep 3001

# 2. Database connection
PGPASSWORD=postgres psql -h localhost -U postgres -d zra_taxguard -c "SELECT 1"

# 3. Dependencies
cd blockchain && npm install

# 4. Environment variables
cat .env
```

### Issue: Database connection error

**Solution:**
```bash
# Verify PostgreSQL is running
docker ps | grep postgres

# Test connection
PGPASSWORD=postgres psql -h localhost -U postgres -d zra_taxguard -c "\dt blockchain.*"

# Check .env configuration
cat blockchain/.env | grep DB_
```

### Issue: Blockchain validation fails

**Solution:**
```bash
# Check blockchain integrity endpoint
curl http://localhost:3001/api/blockchain/validate

# View logs
tail -50 blockchain/logs/blockchain.log

# Restart service
pkill -f "node.*blockchain"
cd blockchain && npm start
```

## Advanced Features

### Custom Event Types

You can define custom event types for your use cases:

```javascript
const customEventTypes = [
  'ocrVerification',
  'documentUpload',
  'ghostEmployeeDetection',
  'taxSubmission',
  'auditLog',
  'complianceCheck',
  'whistleblowerReport'
];
```

### Chain Validation

Verify blockchain integrity:
```bash
curl http://localhost:3001/api/blockchain/validate
```

### Export Blockchain

```bash
curl http://localhost:3001/api/blockchain/export > blockchain-export.json
```

## Performance Optimization

### Database Indexing

```sql
-- Add indexes for faster queries
CREATE INDEX idx_transactions_type ON blockchain.transactions(transaction_type);
CREATE INDEX idx_transactions_created ON blockchain.transactions(created_at);
CREATE INDEX idx_transactions_block ON blockchain.transactions(block_number);
```

### Connection Pooling

Configure in `blockchain/database/config.js`:
```javascript
const pool = new Pool({
  max: 20,                    // Maximum connections
  idleTimeoutMillis: 30000,   // Close idle connections
  connectionTimeoutMillis: 2000
});
```

## Backup & Recovery

### Backup Blockchain Data

```bash
# Database backup
docker exec taxguard-postgres pg_dump -U postgres -d zra_taxguard \
  --schema=blockchain > blockchain_backup.sql

# Export blockchain JSON
curl http://localhost:3001/api/blockchain > blockchain_data.json
```

### Restore Blockchain Data

```bash
# Restore database
cat blockchain_backup.sql | docker exec -i taxguard-postgres \
  psql -U postgres -d zra_taxguard
```

## Integration Checklist

- [ ] PostgreSQL database running on localhost:5432
- [ ] `zra_taxguard` database created
- [ ] `blockchain` schema and tables exist
- [ ] `.env` file configured in blockchain directory
- [ ] Dependencies installed (`npm install`)
- [ ] Blockchain service running on port 3001
- [ ] Health endpoint responding: `curl http://localhost:3001/health`
- [ ] Database integration working (check with test script)
- [ ] Other services can communicate with blockchain API

## Next Steps

1. Integrate blockchain verification in your application logic
2. Set up automated backups
3. Configure monitoring and alerting
4. Implement API authentication for production
5. Set up HTTPS with reverse proxy
6. Configure log rotation
7. Set up performance monitoring

## Resources

- Blockchain Explorer: http://localhost:3001/explorer
- API Health: http://localhost:3001/health
- API Documentation: http://localhost:3001/api-docs
- Integration Test: `node final-integration-test.js`

## Support

For issues or questions:
1. Check service logs: `tail -f blockchain/logs/*.log`
2. Verify database connection: See DATABASE_SETUP_README.md
3. Run integration tests: `node final-integration-test.js`
4. Check health endpoint: `curl http://localhost:3001/health`
