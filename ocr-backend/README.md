# 🔧 OCR Backend - Dev 2 (Backend & Integration Lead)

## 📋 Overview

Backend service for the ZRA AI-Powered "Proof of Import/Export" Verification System.

**Developer**: Dev 2 (Backend & Integration Lead)
**Branch**: OCR-dev-2
**Tech Stack**: Node.js + Express + MongoDB + Multer

## 🎯 Responsibilities

### Core Tasks:
1. **Backend Setup** - Express server with routes
2. **Database Integration** - MongoDB for document storage
3. **File Upload** - Handle PDF/image uploads
4. **AI Integration** - Connect to Dev 1's OCR service
5. **Blockchain Integration** - Connect to Dev 3's blockchain API

## 🏗️ Architecture

```
┌─────────────┐      ┌──────────────┐      ┌────────────────┐
│  Frontend   │─────▶│   Backend    │─────▶│   Blockchain   │
│  (Dev 4)    │      │   (Dev 2)    │      │   (Dev 3)      │
└─────────────┘      └──────┬───────┘      └────────────────┘
                            │
                            ▼
                     ┌──────────────┐
                     │   AI/OCR     │
                     │   (Dev 1)    │
                     └──────────────┘
                            │
                            ▼
                     ┌──────────────┐
                     │   MongoDB    │
                     │   Database   │
                     └──────────────┘
```

## 📦 Project Structure

```
ocr-backend/
├── config/
│   ├── database.js          # MongoDB connection
│   ├── blockchain.js        # Blockchain API config
│   └── ai-service.js        # AI/OCR service config
│
├── models/
│   └── Document.js          # MongoDB schema for documents
│
├── routes/
│   ├── upload.js            # POST /upload
│   ├── verify.js            # POST /verify
│   └── results.js           # GET /results/:id
│
├── services/
│   ├── ocr-service.js       # Integration with Dev 1 (AI/OCR)
│   ├── blockchain-service.js # Integration with Dev 3 (Blockchain)
│   └── storage-service.js   # File storage management
│
├── middleware/
│   ├── upload.js            # Multer file upload
│   ├── validation.js        # Request validation
│   └── error-handler.js     # Error handling
│
├── utils/
│   ├── hash.js              # SHA-256 hashing
│   └── logger.js            # Logging utility
│
├── server.js                # Main Express server
├── package.json             # Dependencies
└── .env.example             # Environment variables template
```

## 🚀 Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment
```bash
cp .env.example .env
# Edit .env with your configuration
```

### 3. Start MongoDB
```bash
# Ensure MongoDB is running
mongod --dbpath /path/to/data
```

### 4. Start Server
```bash
npm start
# or for development:
npm run dev
```

## 📡 API Endpoints

### 1. Upload Document
```http
POST /api/upload
Content-Type: multipart/form-data

Request:
- file: PDF or image file
- metadata: { importerName, declarationId, etc. }

Response:
{
  "success": true,
  "documentId": "DOC-2025-001",
  "message": "Document uploaded successfully"
}
```

### 2. Verify Document
```http
POST /api/verify/:documentId

Response:
{
  "success": true,
  "documentId": "DOC-2025-001",
  "ocrData": {
    "invoiceNumber": "INV-001",
    "importerName": "ABC Corp",
    "hsCode": "8471.30",
    "value": 50000
  },
  "riskScore": 15,
  "verificationStatus": "VALID",
  "blockchainTxId": "0xabc123..."
}
```

### 3. Get Results
```http
GET /api/results/:documentId

Response:
{
  "success": true,
  "document": {
    "documentId": "DOC-2025-001",
    "uploadedAt": "2025-10-05T20:00:00Z",
    "status": "VERIFIED",
    "ocrData": {...},
    "riskScore": 15,
    "blockchainProof": {...}
  }
}
```

## 🔗 Integration Points

### Dev 1 (AI/OCR Service)
```javascript
// Call AI service for OCR extraction
const ocrResult = await ocrService.processDocument(filePath);
```

### Dev 3 (Blockchain Service)
```javascript
// Store verification on blockchain
const txId = await blockchainService.storeVerification({
  docId: documentId,
  ocrData,
  riskScore
});
```

## 🗄️ Database Schema

### Document Collection
```javascript
{
  documentId: "DOC-2025-001",
  filename: "invoice_001.pdf",
  filePath: "/uploads/abc123.pdf",
  fileHash: "sha256hash...",
  uploadedAt: ISODate("2025-10-05T20:00:00Z"),
  metadata: {
    importerName: "ABC Corp",
    declarationId: "DECL-001"
  },
  status: "PENDING" | "PROCESSING" | "VERIFIED" | "FLAGGED",
  ocrData: {
    invoiceNumber: "INV-001",
    hsCode: "8471.30",
    value: 50000
  },
  riskScore: 15,
  verificationStatus: "VALID" | "SUSPICIOUS" | "FRAUDULENT",
  blockchainTxId: "0xabc123...",
  blockNumber: 12345,
  flagged: false,
  flagReason: null
}
```

## 🔐 Security

- File upload validation (size, type)
- Request validation middleware
- Error handling
- Environment variables for secrets
- SHA-256 hashing for file integrity

## 🧪 Testing

```bash
# Run tests
npm test

# Test file upload
curl -F "file=@sample.pdf" http://localhost:3000/api/upload

# Test verification
curl http://localhost:3000/api/verify/DOC-2025-001
```

## 📚 Dependencies

```json
{
  "express": "^4.18.2",
  "mongoose": "^8.0.0",
  "multer": "^1.4.5-lts.1",
  "axios": "^1.6.0",
  "dotenv": "^16.3.1",
  "cors": "^2.8.5",
  "helmet": "^7.1.0",
  "morgan": "^1.10.0"
}
```

## 🎯 Next Steps for Dev 2

1. ✅ Review this README
2. ⏳ Install dependencies (`npm install`)
3. ⏳ Configure MongoDB connection
4. ⏳ Implement file upload endpoint
5. ⏳ Integrate with Dev 1's AI/OCR service
6. ⏳ Integrate with Dev 3's blockchain API
7. ⏳ Test end-to-end flow
8. ⏳ Connect with Dev 4's frontend

## 📞 Coordination

- **Dev 1 (AI/OCR)**: Provides extracted data + risk score
- **Dev 3 (Blockchain)**: Stores verification proof
- **Dev 4 (Frontend)**: Consumes API endpoints

## 🚦 Status

**Current**: ✅ Backend structure created
**Next**: Implement API endpoints

---

**Developer**: Dev 2 (Backend & Integration Lead)
**Branch**: OCR-dev-2
**Status**: In Progress
