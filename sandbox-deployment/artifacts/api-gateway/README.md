# 🚀 TaxGuard API Gateway

Enterprise-grade API Gateway for the TaxGuard Blockchain System with JWT authentication, role-based access control, and comprehensive SIEM logging.

## 🎯 Features

### ✅ Task 3 Requirements Completed
1. **✅ Node.js/Express REST API** - Full Express.js implementation
2. **✅ POST `/events` endpoint** - TaxGuard event submissions with validation
3. **✅ GET `/events/:id` endpoint** - Event retrieval for auditors
4. **✅ JWT Authentication** - Secure token-based authentication
5. **✅ SIEM Logging** - Comprehensive security event logging
6. **✅ Smart Contract Integration** - Direct blockchain API integration

### 🔐 Security Features
- **JWT Authentication** with configurable expiration
- **Role-based Access Control** (taxpayer, auditor, admin)
- **Rate Limiting** to prevent abuse
- **Input Validation** with express-validator
- **Security Headers** with Helmet.js
- **CORS Protection** with configurable origins
- **mTLS Support** for certificate-based authentication

### 📊 Logging & Monitoring
- **Winston Logger** with multiple transports
- **SIEM Integration** with custom transport
- **Security Event Logging** for authentication/authorization
- **API Usage Tracking** with detailed metadata
- **Error Logging** with stack traces
- **Audit Trail** for all data access

## 🚀 Quick Start

### Prerequisites
- Node.js 16+ 
- TaxGuard Blockchain API running on port 3001

### Installation
```bash
cd api-gateway
npm install
```

### Configuration
Create `.env` file:
```env
PORT=4000
JWT_SECRET=your_super_secret_key
JWT_EXPIRES_IN=24h
BLOCKCHAIN_API_URL=http://localhost:3001
SIEM_ENDPOINT=http://localhost:5000/logs
NODE_ENV=development
```

### Start Server
```bash
npm start
# or for development
npm run dev
```

## 📡 API Endpoints

### Authentication
```bash
# Login
POST /api/auth/login
{
  "username": "taxpayer1",
  "password": "password123"
}

# Register (admin only)
POST /api/auth/register
Authorization: Bearer <token>
{
  "username": "newuser",
  "password": "password123",
  "email": "user@example.com",
  "role": "taxpayer"
}

# Get Profile
GET /api/auth/profile
Authorization: Bearer <token>
```

### Events
```bash
# Submit Event (authenticated)
POST /api/events
Authorization: Bearer <token>
{
  "eventType": "filing",
  "anonymizedUserId": "user-001",
  "hashOfPayload": "a1b2c3d4e5f6789012345678901234567890abcdef1234567890abcdef123456",
  "notes": "VAT return submission"
}

# Get Event (auditor+)
GET /api/events/:id
Authorization: Bearer <token>

# List Events (auditor+)
GET /api/events?limit=50&offset=0&eventType=filing
Authorization: Bearer <token>

# Get Statistics (auditor+)
GET /api/events/stats
Authorization: Bearer <token>
```

### System
```bash
# Health Check
GET /health

# API Documentation
GET /api-docs
```

## 👥 User Roles & Permissions

### Default Users
```javascript
// Taxpayer
username: "taxpayer1"
password: "password123"
role: "taxpayer"

// Auditor  
username: "auditor1"
password: "password123"
role: "auditor"

// Admin
username: "admin1"
password: "password123"
role: "admin"
```

### Role Permissions
- **taxpayer**: Can submit events, view own profile
- **auditor**: Can view all events, get statistics, submit events
- **admin**: Full access including user registration

## 🧪 Testing

### Unit Tests
```bash
npm test
```

### Integration Test
```bash
# Start blockchain API first
cd ../blockchain && npm start

# Start API gateway
npm start

# Run integration test
node integration-test.js
```

## 📊 SIEM Integration

The API Gateway sends security events to a SIEM system:

### Event Types
- **AUTH_SUCCESS** - Successful authentication
- **AUTH_FAILURE** - Failed authentication attempts
- **ACCESS_DENIED** - Authorization failures
- **DATA_ACCESS** - Event retrieval operations
- **API_CALL** - Event submission operations
- **SUSPICIOUS_ACTIVITY** - Potential security threats

### SIEM Payload Format
```json
{
  "timestamp": "2025-10-02T09:00:00.000Z",
  "service": "taxguard-api-gateway",
  "level": "info",
  "message": "AUTH_SUCCESS",
  "metadata": {
    "userId": 1,
    "role": "taxpayer",
    "ip": "127.0.0.1",
    "eventType": "authentication"
  },
  "source": "api-gateway",
  "environment": "development"
}
```

## 🔧 Configuration

### Environment Variables
- `PORT` - Server port (default: 4000)
- `JWT_SECRET` - JWT signing secret
- `JWT_EXPIRES_IN` - Token expiration time
- `BLOCKCHAIN_API_URL` - Blockchain API endpoint
- `SIEM_ENDPOINT` - SIEM system endpoint
- `NODE_ENV` - Environment (development/production)
- `LOG_LEVEL` - Logging level (info/debug/error)

### Security Configuration
- Rate limiting: 100 requests per 15 minutes per IP
- JWT expiration: 24 hours (configurable)
- Request timeout: 10 seconds for blockchain calls
- Body size limit: 10MB

## 📁 Project Structure
```
api-gateway/
├── server.js              # Main server file
├── routes/
│   ├── auth.js            # Authentication routes
│   └── events.js          # Event management routes
├── middleware/
│   ├── auth.js            # JWT & role-based auth
│   └── errorHandler.js    # Error handling
├── utils/
│   └── logger.js          # Winston logger with SIEM
├── tests/
│   └── api.test.js        # Unit tests
├── logs/                  # Log files
├── integration-test.js    # Integration testing
└── README.md             # This file
```

## 🚀 Production Deployment

### Security Checklist
- [ ] Change default JWT secret
- [ ] Configure proper CORS origins
- [ ] Set up HTTPS/TLS
- [ ] Configure proper SIEM endpoint
- [ ] Set up log rotation
- [ ] Configure rate limiting for production
- [ ] Set up monitoring and alerting

### Performance Optimization
- Use PM2 for process management
- Configure load balancing
- Set up Redis for session storage
- Implement caching strategies
- Monitor memory usage

## 🎯 Task 3 Completion Status

✅ **All subtasks completed successfully:**

1. ✅ **Node.js/Express REST API** - Full implementation with security middleware
2. ✅ **POST `/events` endpoint** - Event submission with validation and blockchain integration
3. ✅ **GET `/events/:id` endpoint** - Event retrieval with role-based access control
4. ✅ **JWT Authentication** - Complete authentication system with role management
5. ✅ **SIEM Logging** - Comprehensive security event logging with custom transport
6. ✅ **Smart Contract Integration** - Direct integration with blockchain API

**🎉 API Gateway is production-ready and fully integrated with the TaxGuard Blockchain System!**
