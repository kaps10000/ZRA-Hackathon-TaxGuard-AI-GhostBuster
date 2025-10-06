# 🚀 OCR Verification - Blockchain Integration Deployment Guide

## 📋 Overview

This guide shows how to integrate the OCR Verification system with the **existing TaxGuard blockchain** (Kaps branch).

## 🎯 Integration Approach

We're **extending the existing Hyperledger Fabric blockchain** rather than creating a separate one. This provides:
- ✅ Unified blockchain infrastructure
- ✅ Shared authentication & authorization
- ✅ Consistent audit trail
- ✅ No duplicate infrastructure

---

## 📦 Step 1: Copy Contract to Existing Blockchain

### Copy OCR Contract
```bash
# From OCR-dev-3 branch
cp ocr-verification-blockchain/OCRVerificationContract.js blockchain/contracts/
```

### Verify Contract Location
```bash
ls -la blockchain/contracts/
# Should see:
# - TaxGuardContract.js          (existing)
# - AdvancedTaxGuardContract.js  (existing)
# - OCRVerificationContract.js   (NEW)
```

---

## 📡 Step 2: Add API Endpoint

### Copy API Module
```bash
# Copy the API integration
cp ocr-verification-blockchain/ocr-verification-api.js blockchain/api/ocr-verification.js
```

### Update blockchain/api/index.js

Add these lines after the existing route imports (around line 50):

```javascript
// ADD THIS:
const ocrVerification = require('./ocr-verification');

// ... existing code ...

// ADD THIS (after existing routes):
app.use('/api/ocr-verification', ocrVerification);
```

**Complete example:**
```javascript
// blockchain/api/index.js

// ... existing imports ...
const statistics = require('./statistics');
const siemExport = require('./siem-export');
const verification = require('./verification');
const templates = require('./templates');
const analyticsEngine = require('./analytics-engine');
const complianceTriggers = require('./compliance-triggers');
const multisig = require('./multisig');
const realtimeDashboard = require('./realtime-dashboard');

// ADD NEW IMPORT:
const ocrVerification = require('./ocr-verification');

// ... existing middleware ...

// Existing routes
app.use('/api/statistics', statistics);
app.use('/api/siem', siemExport);
app.use('/api/verification', verification);
app.use('/api/templates', templates);
app.use('/api/analytics', analyticsEngine);
app.use('/api/compliance', complianceTriggers);
app.use('/api/multisig', multisig);
app.use('/api/dashboard', realtimeDashboard);

// ADD NEW ROUTE:
app.use('/api/ocr-verification', ocrVerification);
```

---

## 🔧 Step 3: Update Contract Integration

### Update blockchain/api/contract-integration.js

If the file uses contract mapping, add OCR contract:

```javascript
// blockchain/api/contract-integration.js

const contracts = {
    'TaxGuardContract': require('../contracts/TaxGuardContract'),
    'AdvancedTaxGuardContract': require('../contracts/AdvancedTaxGuardContract'),
    'RiskAnalyticsEngine': require('../contracts/RiskAnalyticsEngine'),
    // ADD THIS:
    'OCRVerificationContract': require('../contracts/OCRVerificationContract')
};
```

---

## 🔗 Step 4: Deploy Contract to Fabric Network

### Option A: Using Existing Deployment Script

If there's a deployment script in `blockchain/scripts/`:

```bash
cd blockchain

# Deploy OCR contract
node scripts/deploy-contract.js OCRVerificationContract

# Or if using npm scripts:
npm run deploy:ocr
```

### Option B: Manual Deployment

```bash
cd blockchain

# Install contract on peer
peer lifecycle chaincode install ocr-verification.tar.gz

# Approve for organization
peer lifecycle chaincode approveformyorg \
  --channelID mychannel \
  --name OCRVerificationContract \
  --version 1.0

# Commit chaincode definition
peer lifecycle chaincode commit \
  --channelID mychannel \
  --name OCRVerificationContract \
  --version 1.0
```

### Option C: Using Fabric Test Network

```bash
cd blockchain/fabric-samples/test-network

# Package chaincode
./network.sh deployCC \
  -ccn OCRVerificationContract \
  -ccp ../../contracts/OCRVerificationContract.js \
  -ccl javascript
```

---

## 🧪 Step 5: Test Integration

### 5.1 Start Blockchain API

```bash
cd blockchain
npm install  # if needed
node api/index.js
```

Expected output:
```
🚀 Starting TaxGuard Blockchain API...
✅ Connected to Hyperledger Fabric
🌐 Server running on http://localhost:3001
📡 WebSocket server initialized
```

### 5.2 Test API Endpoints

#### Health Check
```bash
curl http://localhost:3001/api/ocr-verification/health
```

Expected response:
```json
{
  "success": true,
  "service": "OCR Verification API",
  "status": "healthy",
  "timestamp": "2025-10-05T20:00:00.000Z"
}
```

#### Store Verification
```bash
curl -X POST http://localhost:3001/api/ocr-verification/store \
  -H "Content-Type: application/json" \
  -d '{
    "docId": "INV-2025-001",
    "docHash": "abc123...",
    "extractedData": {
      "invoiceNumber": "INV-2025-001",
      "importerName": "ABC Corp",
      "hsCode": "8471.30",
      "value": 50000
    },
    "riskScore": 15,
    "aiMetadata": {
      "ocrConfidence": 0.95,
      "aiModel": "tesseract-v5"
    }
  }'
```

#### Get Verification
```bash
curl http://localhost:3001/api/ocr-verification/INV-2025-001
```

#### Query by Status
```bash
curl http://localhost:3001/api/ocr-verification/query/status/VALID
```

#### Get Statistics
```bash
curl http://localhost:3001/api/ocr-verification/statistics
```

---

## 🔄 Step 6: Backend Integration (Dev 2)

### Example: Node.js/Express Backend

```javascript
// backend/services/blockchain.js

const axios = require('axios');
const crypto = require('crypto');

const BLOCKCHAIN_API = 'http://localhost:3001';

/**
 * Store OCR verification on blockchain
 */
async function storeOCRVerification(documentData) {
    // Hash the document content
    const docHash = crypto
        .createHash('sha256')
        .update(JSON.stringify(documentData.content))
        .digest('hex');

    const payload = {
        docId: documentData.id,
        docHash: docHash,
        extractedData: {
            invoiceNumber: documentData.invoiceNumber,
            importerName: documentData.importerName,
            hsCode: documentData.hsCode,
            value: documentData.value,
            currency: documentData.currency
        },
        riskScore: documentData.aiRiskScore,
        aiMetadata: {
            ocrConfidence: documentData.ocrConfidence,
            aiModel: documentData.aiModel,
            processingTime: documentData.processingTime,
            documentType: documentData.documentType
        }
    };

    try {
        const response = await axios.post(
            `${BLOCKCHAIN_API}/api/ocr-verification/store`,
            payload
        );

        return {
            success: true,
            transactionId: response.data.data.transactionId,
            blockNumber: response.data.data.blockNumber,
            verificationStatus: response.data.data.verificationStatus
        };
    } catch (error) {
        console.error('Blockchain error:', error.message);
        throw new Error('Failed to store verification on blockchain');
    }
}

/**
 * Retrieve verification from blockchain
 */
async function getVerification(docId) {
    try {
        const response = await axios.get(
            `${BLOCKCHAIN_API}/api/ocr-verification/${docId}`
        );

        return response.data.data;
    } catch (error) {
        console.error('Blockchain error:', error.message);
        throw new Error('Verification not found on blockchain');
    }
}

/**
 * Flag suspicious document
 */
async function flagDocument(docId, reason, officerName) {
    try {
        const response = await axios.post(
            `${BLOCKCHAIN_API}/api/ocr-verification/flag`,
            {
                docId,
                reason,
                flaggedBy: officerName
            }
        );

        return response.data;
    } catch (error) {
        console.error('Blockchain error:', error.message);
        throw new Error('Failed to flag document');
    }
}

module.exports = {
    storeOCRVerification,
    getVerification,
    flagDocument
};
```

### Using in Backend Route

```javascript
// backend/routes/documents.js

const express = require('express');
const router = express.Router();
const { storeOCRVerification, getVerification } = require('../services/blockchain');

/**
 * POST /api/documents/verify
 * Process and verify document
 */
router.post('/verify', async (req, res) => {
    try {
        // 1. Upload document
        const document = req.file;

        // 2. OCR Processing (AI Service - Dev 1)
        const ocrResult = await ocrService.processDocument(document);

        // 3. Store on blockchain
        const blockchainResult = await storeOCRVerification({
            id: ocrResult.documentId,
            content: ocrResult.rawText,
            invoiceNumber: ocrResult.invoiceNumber,
            importerName: ocrResult.importerName,
            hsCode: ocrResult.hsCode,
            value: ocrResult.value,
            currency: ocrResult.currency,
            aiRiskScore: ocrResult.riskScore,
            ocrConfidence: ocrResult.confidence,
            aiModel: ocrResult.model,
            processingTime: ocrResult.processingTime,
            documentType: ocrResult.documentType
        });

        // 4. Return response
        res.json({
            success: true,
            document: {
                id: ocrResult.documentId,
                extractedData: ocrResult,
                blockchain: {
                    transactionId: blockchainResult.transactionId,
                    blockNumber: blockchainResult.blockNumber,
                    verificationStatus: blockchainResult.verificationStatus
                }
            }
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * GET /api/documents/:docId/verification
 * Get blockchain verification proof
 */
router.get('/:docId/verification', async (req, res) => {
    try {
        const proof = await getVerification(req.params.docId);

        res.json({
            success: true,
            proof
        });

    } catch (error) {
        res.status(404).json({
            success: false,
            error: error.message
        });
    }
});

module.exports = router;
```

---

## 📊 Step 7: Frontend Integration (Dev 4)

### Example: React Component

```javascript
// frontend/src/services/blockchain.js

import axios from 'axios';

const API_BASE = 'http://localhost:3001/api/ocr-verification';

export const blockchainService = {
    async getVerification(docId) {
        const response = await axios.get(`${API_BASE}/${docId}`);
        return response.data.data;
    },

    async getStatistics() {
        const response = await axios.get(`${API_BASE}/statistics`);
        return response.data.data;
    },

    async queryByStatus(status) {
        const response = await axios.get(`${API_BASE}/query/status/${status}`);
        return response.data.data;
    },

    async getFlaggedDocuments() {
        const response = await axios.get(`${API_BASE}/flagged`);
        return response.data.data;
    }
};
```

---

## ✅ Verification Checklist

- [ ] OCRVerificationContract.js copied to blockchain/contracts/
- [ ] ocr-verification.js copied to blockchain/api/
- [ ] blockchain/api/index.js updated with new route
- [ ] Contract deployed to Fabric network
- [ ] Blockchain API server running on port 3001
- [ ] Health check endpoint responding
- [ ] Test verification stored successfully
- [ ] Backend integration complete
- [ ] Frontend can query blockchain data

---

## 🔍 Troubleshooting

### Issue: Contract not found
**Solution**: Ensure contract is properly deployed to Fabric network
```bash
peer lifecycle chaincode queryinstalled
```

### Issue: API endpoint 404
**Solution**: Verify route added to blockchain/api/index.js
```bash
curl http://localhost:3001/api/ocr-verification/health
```

### Issue: Connection refused
**Solution**: Check if blockchain API is running
```bash
cd blockchain
node api/index.js
```

---

## 📚 API Documentation

Once deployed, full API documentation available at:
- Swagger UI: http://localhost:3001/api-docs
- OCR Endpoints: http://localhost:3001/api-docs#/OCR%20Verification

---

## 🎉 Success!

Your OCR verification system is now integrated with the existing TaxGuard blockchain!

**What you have:**
- ✅ Unified blockchain infrastructure
- ✅ OCR verification contract deployed
- ✅ REST API endpoints active
- ✅ Backend integration ready
- ✅ Frontend can access blockchain data

**Next Steps:**
- Test with real documents (Dev 1 + Dev 2)
- Build frontend dashboard (Dev 4)
- Run end-to-end verification flow
- Monitor blockchain transactions
