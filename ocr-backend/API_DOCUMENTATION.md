# 🚀 ZRA OCR Backend API Documentation

**Version:** 1.0.0  
**Base URL:** `http://localhost:3000`  
**Authentication:** JWT Bearer Token

---

## 🔐 Authentication

### **POST /api/auth/login**
Authenticate user and receive JWT token.

**Request:**
```json
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
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": 1,
      "username": "zra_admin",
      "email": "admin@zra.gov.zm",
      "role": "admin"
    }
  }
}
```

### **POST /api/auth/verify**
Verify JWT token validity.

**Request:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

---

## 📄 Document Management

### **POST /api/upload** 🔒
Upload document for OCR processing.

**Headers:**
```
Authorization: Bearer <token>
Content-Type: multipart/form-data
```

**Request:**
```
file: <document file>
metadata: {"importerName": "ABC Corp", "importerTpin": "1234567890"}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "documentId": "DOC-20251006-001",
    "filename": "invoice.pdf",
    "status": "PENDING",
    "uploadedAt": "2025-10-06T18:30:00Z"
  }
}
```

### **GET /api/results** 🔒
Get all document processing results.

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "documents": [
      {
        "documentId": "DOC-20251006-001",
        "filename": "invoice.pdf",
        "status": "VERIFIED",
        "riskScore": 25.5,
        "verificationStatus": "VALID",
        "createdAt": "2025-10-06T18:30:00Z"
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

### **GET /api/results/:id** 🔒
Get specific document result.

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "document": {
      "documentId": "DOC-20251006-001",
      "filename": "invoice.pdf",
      "status": "VERIFIED",
      "ocrData": {
        "extractedText": "INVOICE...",
        "confidence": 0.95
      },
      "verificationResult": {
        "companyVerification": {
          "tpinValid": true,
          "companyExists": true
        }
      },
      "riskScore": 25.5,
      "blockchainTxId": "0xabc123..."
    }
  }
}
```

---

## ✅ Verification

### **POST /api/verify/document** 🔒
Verify document data against ZRA systems.

**Headers:**
```
Authorization: Bearer <token>
```

**Request:**
```json
{
  "documentId": "DOC-20251006-001",
  "extractedData": {
    "importerName": "ABC Corporation",
    "importerTpin": "1234567890",
    "invoiceAmount": 50000
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
    "verificationStatus": "VALID"
  }
}
```

### **POST /api/verify/company** 🔒
Verify company information.

**Headers:**
```
Authorization: Bearer <token>
```

**Request:**
```json
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

---

## 🔗 Blockchain Integration

### **POST /api/blockchain/store** 🔒
Store document hash on blockchain.

**Headers:**
```
Authorization: Bearer <token>
```

**Request:**
```json
{
  "documentId": "DOC-20251006-001",
  "fileHash": "sha256:abc123...",
  "metadata": {
    "verificationStatus": "VALID",
    "riskScore": 25.5
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "transactionId": "0xabc123...",
    "blockNumber": 12345,
    "gasUsed": 21000,
    "timestamp": "2025-10-06T18:45:00Z"
  }
}
```

### **GET /api/blockchain/verify/:txId**
Verify blockchain transaction.

**Response:**
```json
{
  "success": true,
  "data": {
    "transaction": {
      "txId": "0xabc123...",
      "blockNumber": 12345,
      "confirmed": true
    },
    "document": {
      "documentId": "DOC-20251006-001",
      "fileHash": "sha256:abc123...",
      "verificationStatus": "VALID"
    }
  }
}
```

---

## 🛡️ Proof & Verification

### **GET /api/proof/:id**
Get blockchain proof for document (public endpoint).

**Response:**
```json
{
  "success": true,
  "data": {
    "proof": {
      "documentId": "DOC-20251006-001",
      "filename": "invoice.pdf",
      "fileHash": "sha256:abc123...",
      "blockchainTxId": "0xabc123...",
      "verificationStatus": "VALID",
      "verifiedAt": "2025-10-06T18:45:00Z"
    },
    "verification": {
      "isValid": true,
      "timestamp": "2025-10-06T18:45:00Z",
      "confidence": 74.5
    }
  }
}
```

### **POST /api/proof/verify**
Verify blockchain proof data.

**Request:**
```json
{
  "txId": "0xabc123...",
  "fileHash": "sha256:abc123...",
  "documentId": "DOC-20251006-001"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "valid": true,
    "document": {
      "documentId": "DOC-20251006-001",
      "verificationStatus": "VALID",
      "riskScore": 25.5
    },
    "blockchain": {
      "txId": "0xabc123...",
      "blockNumber": 12345,
      "proof": {...}
    }
  }
}
```

---

## 📊 System Endpoints

### **GET /healthcheck**
System health check (public).

**Response:**
```json
{
  "success": true,
  "message": "ZRA OCR Backend is running",
  "timestamp": "2025-10-06T18:30:00Z",
  "version": "1.0.0"
}
```

### **GET /api**
API documentation (public).

**Response:**
```json
{
  "success": true,
  "message": "ZRA OCR Verification API",
  "version": "1.0.0",
  "endpoints": {
    "auth": {...},
    "documents": {...},
    "blockchain": {...}
  }
}
```

---

## 🔒 Security Features

### **Rate Limiting:**
- **General API:** 100 requests per 15 minutes per IP
- **Upload endpoint:** 10 requests per 15 minutes per IP

### **Authentication:**
- **JWT tokens** with 24-hour expiration
- **Bearer token** format: `Authorization: Bearer <token>`
- **Protected routes** require valid JWT

### **CORS:**
- **Configurable origins** via `CORS_ORIGIN` environment variable
- **Credentials support** enabled
- **Standard headers** allowed

---

## 🚨 Error Responses

### **Authentication Errors:**
```json
{
  "success": false,
  "error": "Access token required"
}
```

### **Validation Errors:**
```json
{
  "success": false,
  "error": "Invalid request data",
  "details": {
    "field": "tpin",
    "message": "TPIN is required"
  }
}
```

### **Rate Limit Errors:**
```json
{
  "success": false,
  "error": "Too many requests from this IP, please try again later."
}
```

### **Server Errors:**
```json
{
  "success": false,
  "error": "Internal server error",
  "requestId": "req-123456"
}
```

---

## 🧪 Testing

### **Demo Credentials:**
- **Username:** `zra_admin` / **Password:** `password`
- **Username:** `zra_officer` / **Password:** `password`

### **Postman Collection:**
Import `ZRA_Verification_Engine.postman_collection.json` for complete API testing.

### **cURL Examples:**

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

## 🐳 Docker Deployment

### **Build & Run:**
```bash
# Build image
docker build -t zra-ocr-backend .

# Run with docker-compose
docker-compose up -d

# Check logs
docker-compose logs -f ocr-backend
```

### **Environment Variables:**
```env
NODE_ENV=production
PORT=3000
DB_HOST=postgres
DB_NAME=zra_taxguard
DB_USER=postgres
DB_PASSWORD=postgres
JWT_SECRET=your-secret-key
CORS_ORIGIN=*
```

---

**API Status: Production Ready** ✅  
**Security: JWT + Rate Limiting** 🔒  
**Documentation: Complete** 📚
