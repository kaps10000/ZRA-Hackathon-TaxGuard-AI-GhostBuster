# 🚀 ZRA TaxGuard OCR APIs Documentation

**Complete API Reference for ZRA Tax Compliance AI System**

---

## 📋 Overview

The ZRA TaxGuard OCR API system provides comprehensive document processing, verification, and blockchain integration for tax compliance monitoring. This system enables automated document analysis, risk assessment, and tamper-proof record keeping.

### **🏗️ System Architecture:**
```
Frontend → OCR Backend (Port 3000) → Blockchain API (Port 3001)
    ↓              ↓                      ↓
  Upload     Document Processing    Immutable Storage
```

### **🔧 Technology Stack:**
- **Backend:** Node.js + Express.js
- **Database:** PostgreSQL with schema-based modules
- **Authentication:** JWT Bearer Tokens
- **Blockchain:** Hyperledger Fabric
- **Security:** CORS, Rate Limiting, Input Validation

---

## 🌐 Base Configuration

### **API Base URLs:**
- **OCR Backend:** `http://localhost:3000`
- **Blockchain API:** `http://localhost:3001`

### **Authentication:**
All protected endpoints require JWT Bearer token:
```
Authorization: Bearer <your-jwt-token>
```

### **Rate Limits:**
- **General API:** 100 requests per 15 minutes
- **Upload Endpoint:** 10 requests per 15 minutes

---

## 🔐 Authentication APIs

### **Login**
```http
POST /api/auth/login
Content-Type: application/json

{
  "username": "zra_admin",
  "password": "password"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIs...",
    "user": {
      "id": 1,
      "username": "zra_admin",
      "email": "admin@zra.gov.zm",
      "role": "admin"
    }
  }
}
```

### **Verify Token**
```http
POST /api/auth/verify
Content-Type: application/json

{
  "token": "eyJhbGciOiJIUzI1NiIs..."
}
```

---

## 📄 Document Management APIs

### **Upload Document**
```http
POST /api/upload
Authorization: Bearer <token>
Content-Type: multipart/form-data

file: <document-file>
metadata: {"importerName": "ABC Corp", "importerTpin": "1234567890"}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "documentId": "DOC-20251007-001",
    "filename": "invoice.pdf",
    "status": "PENDING",
    "uploadedAt": "2025-10-07T01:00:00Z"
  }
}
```

### **Get All Results**
```http
GET /api/results
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "documents": [
      {
        "documentId": "DOC-20251007-001",
        "filename": "invoice.pdf",
        "status": "VERIFIED",
        "riskScore": 25.5,
        "verificationStatus": "VALID",
        "blockchainTxId": "tx-abc123",
        "createdAt": "2025-10-07T01:00:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 1
    }
  }
}
```

### **Get Specific Document**
```http
GET /api/results/{documentId}
Authorization: Bearer <token>
```

---

## ✅ Verification APIs

### **Verify Document**
```http
POST /api/verify/document
Authorization: Bearer <token>
Content-Type: application/json

{
  "documentId": "DOC-20251007-001",
  "extractedData": {
    "importerName": "ABC Corporation",
    "importerTpin": "1234567890",
    "invoiceAmount": 50000,
    "hsCode": "8471.30.00"
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "verificationResult": {
      "companyVerification": {
        "tpinValid": true,
        "companyExists": true,
        "status": "ACTIVE"
      },
      "documentVerification": {
        "formatValid": true,
        "amountValid": true
      }
    },
    "riskScore": 25.5,
    "riskFlags": [],
    "verificationStatus": "VALID",
    "document": {
      "documentId": "DOC-20251007-001",
      "status": "VERIFIED",
      "blockchainTxId": "tx-abc123"
    }
  }
}
```

### **Verify Company**
```http
POST /api/verify/company
Authorization: Bearer <token>
Content-Type: application/json

{
  "tpin": "1234567890",
  "companyName": "ABC Corporation"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "company": {
      "tpin": "1234567890",
      "name": "ABC Corporation",
      "status": "ACTIVE",
      "registrationDate": "2020-01-15"
    },
    "verification": {
      "tpinValid": true,
      "nameMatch": true,
      "statusActive": true
    },
    "riskScore": 15.0
  }
}
```

### **Verify HS Code**
```http
POST /api/verify/hscode
Authorization: Bearer <token>
Content-Type: application/json

{
  "hsCode": "8471.30.00",
  "description": "Portable automatic data processing machines"
}
```

---

## 🔗 Blockchain Integration APIs

### **Store Proof on Blockchain**
```http
POST /api/blockchain/store-proof
Authorization: Bearer <token>
Content-Type: application/json

{
  "documentId": "DOC-20251007-001",
  "fileHash": "sha256:abc123...",
  "verificationResult": {
    "overallStatus": "VALID",
    "riskScore": 25.5
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "documentId": "DOC-20251007-001",
    "transactionId": "tx-abc123def456",
    "blockNumber": 12345,
    "verificationHash": "sha256:abc123...",
    "timestamp": "2025-10-07T01:00:00Z",
    "blockchainUrl": "http://localhost:3001/explorer"
  }
}
```

### **Get Blockchain Proof**
```http
GET /api/blockchain/get-proof/{hash}
```

**Supports multiple hash types:**
- Document ID: `DOC-20251007-001`
- File Hash: `sha256:abc123...`
- Transaction ID: `tx-abc123def456`

**Response:**
```json
{
  "success": true,
  "data": {
    "document": {
      "documentId": "DOC-20251007-001",
      "filename": "invoice.pdf",
      "fileHash": "sha256:abc123...",
      "verificationStatus": "VALID",
      "riskScore": 25.5,
      "verifiedAt": "2025-10-07T01:00:00Z"
    },
    "blockchain": {
      "transactionId": "tx-abc123def456",
      "blockNumber": 12345,
      "proof": {
        "hash": "sha256:abc123...",
        "timestamp": "2025-10-07T01:00:00Z"
      }
    },
    "verification": {
      "isValid": true,
      "onChain": true,
      "confidence": 74.5
    }
  }
}
```

### **Verify Hash Cross-System**
```http
POST /api/blockchain/verify-hash
Content-Type: application/json

{
  "hash": "DOC-20251007-001",
  "hashType": "documentId"
}
```

### **Flag Suspicious Document**
```http
POST /api/blockchain/flag-document
Authorization: Bearer <token>
Content-Type: application/json

{
  "documentId": "DOC-20251007-001",
  "reason": "High risk score detected"
}
```

### **Get Flagged Documents**
```http
GET /api/blockchain/flagged-documents
Authorization: Bearer <token>
```

### **Blockchain Health Check**
```http
GET /api/blockchain/health
```

---

## 🛡️ Proof & Public APIs

### **Get Public Proof**
```http
GET /api/proof/{id}
```

**Public endpoint - no authentication required**

### **Verify Proof Data**
```http
POST /api/proof/verify
Content-Type: application/json

{
  "txId": "tx-abc123def456",
  "fileHash": "sha256:abc123...",
  "documentId": "DOC-20251007-001"
}
```

---

## 📊 System APIs

### **Health Check**
```http
GET /healthcheck
```

**Response:**
```json
{
  "success": true,
  "message": "ZRA OCR Backend is running",
  "timestamp": "2025-10-07T01:00:00Z",
  "version": "1.0.0"
}
```

### **API Information**
```http
GET /api
```

**Response:**
```json
{
  "success": true,
  "message": "ZRA OCR Verification API",
  "version": "1.0.0",
  "endpoints": {
    "auth": {
      "login": "POST /api/auth/login",
      "verify": "POST /api/auth/verify"
    },
    "documents": {
      "upload": "POST /api/upload",
      "results": "GET /api/results"
    },
    "verification": {
      "document": "POST /api/verify/document",
      "company": "POST /api/verify/company"
    },
    "blockchain": {
      "store": "POST /api/blockchain/store-proof",
      "get": "GET /api/blockchain/get-proof/:hash"
    }
  }
}
```

---

## 🚨 Error Handling

### **Standard Error Response:**
```json
{
  "success": false,
  "error": "Error message description",
  "details": {
    "field": "fieldName",
    "message": "Specific validation error"
  }
}
```

### **Common HTTP Status Codes:**
- **200** - Success
- **201** - Created
- **400** - Bad Request (validation error)
- **401** - Unauthorized (missing/invalid token)
- **403** - Forbidden (insufficient permissions)
- **404** - Not Found
- **429** - Too Many Requests (rate limited)
- **500** - Internal Server Error

### **Authentication Errors:**
```json
{
  "success": false,
  "error": "Access token required"
}
```

### **Rate Limit Errors:**
```json
{
  "success": false,
  "error": "Too many requests from this IP, please try again later."
}
```

---

## 🧪 Testing

### **Demo Credentials:**
- **Admin:** `zra_admin` / `password`
- **Officer:** `zra_officer` / `password`

### **Test Environment:**
- **API Tester:** `http://localhost:8080/api-tester.html`
- **Postman Collection:** Available in repository
- **Health Check:** `http://localhost:3000/healthcheck`

### **Sample cURL Commands:**

**Login:**
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"zra_admin","password":"password"}'
```

**Upload Document:**
```bash
curl -X POST http://localhost:3000/api/upload \
  -H "Authorization: Bearer <token>" \
  -F "file=@invoice.pdf" \
  -F 'metadata={"importerName":"ABC Corp"}'
```

**Get Results:**
```bash
curl -X GET http://localhost:3000/api/results \
  -H "Authorization: Bearer <token>"
```

---

## 🔄 Integration Workflow

### **Complete Document Processing Flow:**
```
1. Upload Document → POST /api/upload
2. OCR Processing → Automatic (background)
3. Verification → POST /api/verify/document
4. Blockchain Storage → Automatic (after verification)
5. Retrieve Results → GET /api/results/{id}
6. Get Blockchain Proof → GET /api/blockchain/get-proof/{hash}
```

### **Automatic Blockchain Integration:**
- **Successful verification** automatically triggers blockchain storage
- **Transaction hash** stored in document record
- **Proof retrieval** available immediately after storage
- **Cross-verification** between database and blockchain

---

## 🐳 Deployment

### **Docker Deployment:**
```bash
# Build and run
docker-compose up -d

# Check logs
docker-compose logs -f ocr-backend

# Stop services
docker-compose down
```

### **Environment Variables:**
```env
NODE_ENV=production
PORT=3000
DB_HOST=localhost
DB_NAME=zra_taxguard
JWT_SECRET=your-secret-key
BLOCKCHAIN_API_URL=http://localhost:3001
CORS_ORIGIN=*
```

---

## 📚 Additional Resources

### **Documentation:**
- **Complete API Docs:** `/ocr-backend/API_DOCUMENTATION.md`
- **Database Schema:** `/migrations/README.md`
- **Blockchain Integration:** `/blockchain/README.md`

### **Testing Tools:**
- **Interactive API Tester:** `http://localhost:8080/api-tester.html`
- **Postman Collection:** `ZRA_Verification_Engine.postman_collection.json`
- **Test Suite:** `npm test` in ocr-backend directory

### **Monitoring:**
- **Health Endpoints:** `/healthcheck`, `/api/blockchain/health`
- **Logs:** Available in Docker containers
- **Metrics:** Built-in performance monitoring

---

## 🎯 Production Checklist

### **Before Deployment:**
- ✅ Update JWT secret keys
- ✅ Configure production database
- ✅ Set up SSL certificates
- ✅ Configure CORS origins
- ✅ Set up monitoring and logging
- ✅ Test all API endpoints
- ✅ Verify blockchain integration
- ✅ Run security audit

### **Security Considerations:**
- **JWT tokens** expire in 24 hours
- **Rate limiting** prevents abuse
- **Input validation** on all endpoints
- **CORS protection** configured
- **Audit trails** for all operations
- **Blockchain immutability** for proof storage

---

**🚀 The ZRA TaxGuard OCR API system is production-ready with comprehensive document processing, verification, and blockchain integration capabilities!**

**For support or questions, refer to the documentation in each module directory.**
