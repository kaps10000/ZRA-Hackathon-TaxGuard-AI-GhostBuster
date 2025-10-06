# 🚀 Dev 2 - Quick Start Guide

**Welcome Dev 2!** Everything is set up for you to start immediately.

## ✅ What's Already Done for You

1. ✅ Project structure created
2. ✅ package.json configured with all dependencies
3. ✅ Environment template (.env.example)
4. ✅ Directory structure (config, models, routes, services)
5. ✅ Integration points defined for Dev 1 & Dev 3

## 📦 Project Structure Created

```
ocr-backend/
├── config/          # Database & service configs (TO DO)
├── models/          # MongoDB schemas (TO DO)
├── routes/          # API endpoints (TO DO)
├── services/        # Integration services (TO DO)
├── middleware/      # Middleware functions (TO DO)
├── utils/           # Utility functions (TO DO)
├── uploads/         # File upload directory
├── package.json     # ✅ DONE
├── .env.example     # ✅ DONE
└── README.md        # ✅ DONE
```

## 🎯 Your Tasks (Backend & Integration Lead)

### Priority 1: Backend Setup (30 min)
```bash
# 1. Install dependencies
cd ocr-backend
npm install

# 2. Set up environment
cp .env.example .env
# Edit .env with actual values

# 3. Install MongoDB (if not installed)
# For Ubuntu/Debian:
sudo apt-get install mongodb
mongod --dbpath /path/to/data

# Or use MongoDB Atlas (cloud)
```

### Priority 2: Create Main Server (15 min)
Create `server.js` with Express setup:
- ✅ Template provided in README.md
- Load environment variables
- Connect to MongoDB
- Set up middleware (CORS, Helmet, Morgan)
- Define routes

### Priority 3: File Upload Endpoint (20 min)
Create `routes/upload.js`:
```javascript
POST /api/upload
- Accept PDF/image files
- Validate file type & size
- Save to uploads/
- Generate documentId
- Store metadata in MongoDB
- Return documentId
```

### Priority 4: Integration with Dev 1 (AI/OCR) (30 min)
Create `services/ocr-service.js`:
```javascript
async function processDocument(filePath) {
  // Call Dev 1's AI service
  const response = await axios.post(AI_SERVICE_URL + '/process', {
    file: filePath
  });

  return {
    extractedData: response.data.extracted,
    riskScore: response.data.riskScore,
    confidence: response.data.confidence
  };
}
```

### Priority 5: Integration with Dev 3 (Blockchain) (20 min)
Create `services/blockchain-service.js`:
```javascript
async function storeVerification(documentData) {
  const response = await axios.post(
    BLOCKCHAIN_API_URL + '/store',
    {
      docId: documentData.id,
      docHash: sha256(documentData.content),
      extractedData: documentData.ocrData,
      riskScore: documentData.riskScore,
      aiMetadata: documentData.aiMetadata
    }
  );

  return response.data;
}
```

## 🔗 Integration Flow

```
1. Frontend uploads document
   ↓
2. Backend receives file (POST /upload)
   ↓
3. Save file & create DB record
   ↓
4. Call Dev 1 AI service (OCR extraction)
   ↓
5. Get OCR data + risk score
   ↓
6. Call Dev 3 blockchain (store proof)
   ↓
7. Get blockchain TX ID
   ↓
8. Update DB with results
   ↓
9. Return response to frontend
```

## 📡 API Endpoints to Create

### 1. POST /api/upload
```json
Request (multipart/form-data):
{
  "file": <PDF or image>,
  "metadata": {
    "importerName": "ABC Corp",
    "declarationId": "DECL-001"
  }
}

Response:
{
  "success": true,
  "documentId": "DOC-2025-001",
  "message": "Document uploaded, processing..."
}
```

### 2. POST /api/verify/:documentId
```json
Response:
{
  "success": true,
  "documentId": "DOC-2025-001",
  "ocrData": {
    "invoiceNumber": "INV-001",
    "hsCode": "8471.30",
    "value": 50000
  },
  "riskScore": 15,
  "verificationStatus": "VALID",
  "blockchainTxId": "0xabc123..."
}
```

### 3. GET /api/results/:documentId
```json
Response:
{
  "success": true,
  "document": {
    "documentId": "DOC-2025-001",
    "status": "VERIFIED",
    "ocrData": {...},
    "blockchainProof": {
      "txId": "0xabc123...",
      "blockNumber": 12345
    }
  }
}
```

## 🔄 Working with Other Devs

### Dev 1 (AI/OCR) Integration
**What you need from them:**
- API endpoint URL (e.g., http://localhost:5000/process)
- Request format (how to send file)
- Response format (extracted data + risk score)

**Example call:**
```javascript
const ocrResult = await axios.post('http://localhost:5000/process', {
  filePath: '/uploads/doc123.pdf'
});

// Expected response:
{
  "extractedData": {
    "invoiceNumber": "INV-001",
    "hsCode": "8471.30",
    "value": 50000
  },
  "riskScore": 15,
  "confidence": 0.95
}
```

### Dev 3 (Blockchain) Integration
**What you have:**
- ✅ Blockchain API URL: http://localhost:3001/api/ocr-verification
- ✅ Postman collection with all endpoints
- ✅ Full documentation

**Example call:**
```javascript
const blockchainResult = await axios.post(
  'http://localhost:3001/api/ocr-verification/store',
  {
    docId: 'DOC-2025-001',
    docHash: sha256Hash,
    extractedData: ocrResult.extractedData,
    riskScore: ocrResult.riskScore,
    aiMetadata: {
      confidence: ocrResult.confidence,
      model: 'tesseract-v5'
    }
  }
);

// Response includes blockchain TX ID
```

## 🗄️ MongoDB Schema (Quick Start)

Create `models/Document.js`:
```javascript
const mongoose = require('mongoose');

const documentSchema = new mongoose.Schema({
  documentId: { type: String, required: true, unique: true },
  filename: String,
  filePath: String,
  fileHash: String,
  uploadedAt: { type: Date, default: Date.now },
  status: {
    type: String,
    enum: ['PENDING', 'PROCESSING', 'VERIFIED', 'FLAGGED'],
    default: 'PENDING'
  },
  metadata: {
    importerName: String,
    declarationId: String
  },
  ocrData: Object,
  riskScore: Number,
  verificationStatus: String,
  blockchainTxId: String,
  blockNumber: Number
});

module.exports = mongoose.model('Document', documentSchema);
```

## ⏱️ Estimated Timeline

| Task | Time | Status |
|------|------|--------|
| Install & setup | 30 min | ⏳ TODO |
| Create server.js | 15 min | ⏳ TODO |
| Upload endpoint | 20 min | ⏳ TODO |
| Dev 1 integration | 30 min | ⏳ TODO |
| Dev 3 integration | 20 min | ⏳ TODO |
| Testing | 30 min | ⏳ TODO |
| **Total** | **~2.5 hours** | |

## 🧪 Testing Your Backend

```bash
# 1. Test server is running
curl http://localhost:3000/api/health

# 2. Test file upload
curl -F "file=@sample.pdf" \
     -F "metadata={\"importerName\":\"ABC Corp\"}" \
     http://localhost:3000/api/upload

# 3. Test verification
curl http://localhost:3000/api/verify/DOC-2025-001

# 4. Test results
curl http://localhost:3000/api/results/DOC-2025-001
```

## 📞 Need Help?

**Blockchain Integration (Dev 3)**:
- Check: `../ocr-verification-blockchain/DEPLOYMENT_GUIDE.md`
- Postman collection: `OCR_Verification_API.postman_collection.json`
- All endpoints tested and working!

**AI Integration (Dev 1)**:
- Coordinate with Dev 1 for their API endpoint
- They provide: OCR extraction + risk score

## 🎯 Success Criteria

✅ Backend server running on port 3000
✅ File upload working (PDF/images)
✅ MongoDB storing document metadata
✅ Integration with Dev 1 AI service
✅ Integration with Dev 3 blockchain
✅ All 3 endpoints working (/upload, /verify, /results)

## 🚀 Let's Go!

Start with:
```bash
cd ocr-backend
npm install
cp .env.example .env
# Edit .env
npm run dev
```

Good luck Dev 2! The blockchain integration (Dev 3) is ready and waiting for you! 🎉
