# 🧩 Task 1: Backend Environment Setup - Dev 2

**Developer**: Dev 2 (Backend & AI Integration Engineer)
**Objective**: Establish robust, secure backend environment for AI verification services

---

## ✅ Task 1 Checklist

### Sub-Task 1: Set up Backend Project ✅
**Status**: COMPLETE
- [x] Node.js Express project initialized
- [x] Modular architecture created (config, models, routes, services)
- [x] Package.json with all dependencies
- [x] Directory structure ready

**Files Created**:
- `package.json` - All dependencies configured
- Project structure: config/, models/, routes/, services/, middleware/, utils/

---

### Sub-Task 2: Configure PostgreSQL Database ⏳
**Status**: READY TO IMPLEMENT
**Action Required**: Choose database option below

#### Option A: PostgreSQL (Recommended for Production)
```bash
# Install PostgreSQL
sudo apt-get install postgresql postgresql-contrib

# Create database
sudo -u postgres psql
CREATE DATABASE ocr_verification;
CREATE USER ocr_user WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE ocr_verification TO ocr_user;
```

**ORM Setup**:
```javascript
// Using Sequelize (PostgreSQL ORM)
npm install sequelize pg pg-hstore

// config/database.js
const { Sequelize } = require('sequelize');

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    dialect: 'postgres',
    logging: false
  }
);

module.exports = sequelize;
```

#### Option B: MongoDB (Currently in package.json)
```bash
# Already configured in package.json
# Just start MongoDB
mongod --dbpath /path/to/data
```

**Recommendation**: Use **PostgreSQL** for production (better for structured data) or keep **MongoDB** for faster development.

---

### Sub-Task 3: Environment Variables ✅
**Status**: COMPLETE

**File**: `.env.example` created with:
```env
# Server
PORT=3000
NODE_ENV=development

# Database (PostgreSQL)
DB_HOST=localhost
DB_PORT=5432
DB_NAME=ocr_verification
DB_USER=ocr_user
DB_PASSWORD=your_password

# Or MongoDB
MONGODB_URI=mongodb://localhost:27017/ocr_verification

# AI Service (Dev 1)
AI_SERVICE_URL=http://localhost:5000
AI_SERVICE_API_KEY=your_api_key

# Blockchain (Dev 3)
BLOCKCHAIN_API_URL=http://localhost:3001/api/ocr-verification

# Security
JWT_SECRET=your_jwt_secret
API_KEY=your_api_key
```

**Action Required**:
```bash
cp .env.example .env
# Edit .env with actual values
```

---

### Sub-Task 4: Logging + Error Handling ⏳
**Status**: READY TO IMPLEMENT

**Create**: `middleware/error-handler.js`
```javascript
const logger = require('../utils/logger');

function errorHandler(err, req, res, next) {
  logger.error(`Error: ${err.message}`, {
    stack: err.stack,
    url: req.url,
    method: req.method
  });

  res.status(err.statusCode || 500).json({
    success: false,
    error: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
}

module.exports = errorHandler;
```

**Create**: `utils/logger.js`
```javascript
const winston = require('winston');

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' }),
    new winston.transports.Console({
      format: winston.format.simple()
    })
  ]
});

module.exports = logger;
```

**Install**:
```bash
npm install winston
```

---

### Sub-Task 5: Health Check Route ✅
**Status**: READY TO IMPLEMENT

**Create**: `server.js`
```javascript
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const errorHandler = require('./middleware/error-handler');
const logger = require('./utils/logger');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(morgan('combined'));

// Health check route
app.get('/healthcheck', async (req, res) => {
  try {
    // Test DB connection
    const dbStatus = await testDatabaseConnection();

    res.json({
      success: true,
      status: 'healthy',
      timestamp: new Date().toISOString(),
      service: 'OCR Verification Backend',
      database: dbStatus ? 'connected' : 'disconnected',
      environment: process.env.NODE_ENV
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      status: 'unhealthy',
      error: error.message
    });
  }
});

// Routes
app.use('/api/upload', require('./routes/upload'));
app.use('/api/verify', require('./routes/verify'));
app.use('/api/results', require('./routes/results'));

// Error handler (must be last)
app.use(errorHandler);

// Start server
app.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`);
  logger.info(`Environment: ${process.env.NODE_ENV}`);
  console.log(`✅ Server: http://localhost:${PORT}`);
  console.log(`🏥 Health: http://localhost:${PORT}/healthcheck`);
});

async function testDatabaseConnection() {
  // PostgreSQL test
  if (process.env.DB_HOST) {
    const sequelize = require('./config/database');
    await sequelize.authenticate();
    return true;
  }

  // MongoDB test
  if (process.env.MONGODB_URI) {
    const mongoose = require('mongoose');
    await mongoose.connect(process.env.MONGODB_URI);
    return true;
  }

  return false;
}

module.exports = app;
```

---

## 📋 Task 1 Summary

| Sub-Task | Status | Action Required |
|----------|--------|-----------------|
| 1. Backend Project Setup | ✅ Complete | None - Already done |
| 2. Database Configuration | ⏳ Pending | Choose PostgreSQL or MongoDB |
| 3. Environment Variables | ✅ Complete | Copy .env.example to .env |
| 4. Logging + Error Handling | ⏳ Pending | Create middleware files |
| 5. Health Check Route | ⏳ Pending | Create server.js |

---

## 🚀 Quick Implementation (30 minutes)

### Step 1: Install Dependencies (5 min)
```bash
cd ocr-backend
npm install
npm install sequelize pg pg-hstore winston  # For PostgreSQL + logging
# OR
npm install mongoose winston  # For MongoDB + logging
```

### Step 2: Set Environment (2 min)
```bash
cp .env.example .env
# Edit .env with your configuration
```

### Step 3: Choose Database (10 min)

**Option A: PostgreSQL**
```bash
# Install and create database
sudo apt-get install postgresql
sudo -u postgres createdb ocr_verification
```

**Option B: MongoDB**
```bash
# Install and start
sudo apt-get install mongodb
mongod --dbpath /data/db
```

### Step 4: Create Files (10 min)

1. **Create** `utils/logger.js` (see code above)
2. **Create** `middleware/error-handler.js` (see code above)
3. **Create** `config/database.js` (PostgreSQL or MongoDB)
4. **Create** `server.js` (see code above)

### Step 5: Test (3 min)
```bash
npm start

# Test health check
curl http://localhost:3000/healthcheck
```

**Expected Response**:
```json
{
  "success": true,
  "status": "healthy",
  "timestamp": "2025-10-05T23:00:00.000Z",
  "service": "OCR Verification Backend",
  "database": "connected",
  "environment": "development"
}
```

---

## ✅ Deliverable Checklist

**Task 1 Complete When**:
- [x] Backend project initialized
- [ ] Database connected (PostgreSQL or MongoDB)
- [x] Environment variables configured
- [ ] Logging middleware implemented
- [ ] Error handling middleware implemented
- [ ] Health check route working
- [ ] Backend + DB connectivity confirmed

---

## 📚 Files to Create

1. `server.js` - Main Express server
2. `config/database.js` - Database connection
3. `utils/logger.js` - Winston logging
4. `middleware/error-handler.js` - Error handling
5. `.env` - Environment variables (copy from .env.example)

---

## 🎯 Success Criteria

✅ Backend running on http://localhost:3000
✅ Database connection established
✅ `/healthcheck` endpoint responding
✅ Logs being written to files
✅ Error handling working

---

**Next**: Task 2 - AI Integration & Document Processing

**Estimated Time**: 30-45 minutes
**Current Status**: 60% Complete (structure ready, implementation needed)
