# 🔗 OCR Verification Integration with Existing Blockchain

## 💡 Strategy: Extend Existing TaxGuard Blockchain

Instead of creating a separate blockchain, we'll **extend the existing Hyperledger Fabric blockchain** from the Kaps branch to support OCR document verification.

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│            Existing TaxGuard Blockchain (Kaps Branch)            │
│                  Hyperledger Fabric Network                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  📄 Existing Contracts:                                          │
│  ├── TaxGuardContract.js       (Tax events)                     │
│  ├── AdvancedTaxGuardContract.js                                │
│  ├── RiskAnalyticsEngine.js                                     │
│  └── CrossChainBridge.js                                        │
│                                                                  │
│  🆕 NEW: OCR Verification Contract:                             │
│  └── OCRVerificationContract.js  (Document verification)        │
│                                                                  │
│  📡 Existing API (Port 3001):                                   │
│  ├── /api/events                                                │
│  ├── /api/monitoring                                            │
│  ├── /api/verification       ← Extend this                      │
│  └── /api/ocr-verification   ← NEW endpoint                     │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

## 🎯 Integration Strategy

### Option 1: Extend TaxGuardContract (Recommended)
Add OCR verification methods to the existing contract:

```javascript
// Add to blockchain/contracts/TaxGuardContract.js

async createOCRVerification(ctx, docId, docHash, verificationResult, riskScore, metadata) {
    // Role check: only PRODUCER or ADMIN
    const userRole = await this._getUserRole(ctx);

    const verification = {
        docId,
        docHash,
        verificationResult,  // VALID, SUSPICIOUS, FRAUDULENT
        riskScore,           // 0-100
        metadata: JSON.parse(metadata),
        timestamp: new Date().toISOString(),
        verifiedBy: ctx.clientIdentity.getID(),
        txId: ctx.stub.getTxID(),
        type: 'OCR_VERIFICATION'
    };

    await ctx.stub.putState(`OCR_${docId}`, Buffer.from(JSON.stringify(verification)));

    // Create corresponding tax event
    await this.createEvent(ctx, `OCR_EVENT_${docId}`, 'ocrVerification',
                          verification.metadata.importerHash, docHash,
                          JSON.stringify(verification));

    return JSON.stringify(verification);
}

async getOCRVerification(ctx, docId) {
    const verificationBytes = await ctx.stub.getState(`OCR_${docId}`);
    if (!verificationBytes || verificationBytes.length === 0) {
        throw new Error(`Verification ${docId} not found`);
    }
    return verificationBytes.toString();
}

async queryOCRVerificationsByStatus(ctx, status) {
    // Query all OCR verifications by status (VALID/SUSPICIOUS/FRAUDULENT)
    const query = {
        selector: {
            type: 'OCR_VERIFICATION',
            verificationResult: status
        }
    };

    return await this._queryWithPagination(ctx, JSON.stringify(query));
}
```

### Option 2: Separate OCRVerificationContract (Modular)
Create new contract that works alongside TaxGuard:

```javascript
// blockchain/contracts/OCRVerificationContract.js

const { Contract } = require('fabric-contract-api');
const crypto = require('crypto');

class OCRVerificationContract extends Contract {

    constructor() {
        super('OCRVerificationContract');
    }

    async initLedger(ctx) {
        const config = {
            contractVersion: '1.0.0',
            initialized: new Date().toISOString(),
            totalVerifications: 0,
            supportedDocTypes: ['invoice', 'billOfLading', 'customsForm', 'manifest']
        };

        await ctx.stub.putState('OCR_CONFIG', Buffer.from(JSON.stringify(config)));
        return JSON.stringify(config);
    }

    async storeDocumentProof(ctx, docId, docHash, extractedData, riskScore, aiMetadata) {
        // Store verification proof
        const proof = {
            docId,
            docHash: this._sha256(docHash),
            extractedData: JSON.parse(extractedData),
            riskScore: parseInt(riskScore),
            aiMetadata: JSON.parse(aiMetadata),
            timestamp: new Date().toISOString(),
            verifier: ctx.clientIdentity.getID(),
            blockNumber: ctx.stub.getTxID()
        };

        await ctx.stub.putState(`DOC_${docId}`, Buffer.from(JSON.stringify(proof)));
        return JSON.stringify(proof);
    }

    async getDocumentProof(ctx, docId) {
        const proofBytes = await ctx.stub.getState(`DOC_${docId}`);
        if (!proofBytes || proofBytes.length === 0) {
            throw new Error(`Document ${docId} not found`);
        }
        return proofBytes.toString();
    }

    async flagDocument(ctx, docId, reason, flaggedBy) {
        const proofBytes = await ctx.stub.getState(`DOC_${docId}`);
        if (!proofBytes || proofBytes.length === 0) {
            throw new Error(`Document ${docId} not found`);
        }

        const proof = JSON.parse(proofBytes.toString());
        proof.flagged = true;
        proof.flagReason = reason;
        proof.flaggedBy = flaggedBy;
        proof.flaggedAt = new Date().toISOString();

        await ctx.stub.putState(`DOC_${docId}`, Buffer.from(JSON.stringify(proof)));
        return JSON.stringify(proof);
    }

    _sha256(data) {
        return crypto.createHash('sha256').update(data).digest('hex');
    }
}

module.exports = OCRVerificationContract;
```

## 📡 API Integration

### Extend existing blockchain API (blockchain/api/index.js)

```javascript
// Add OCR verification routes
const ocrVerification = require('./ocr-verification');
app.use('/api/ocr-verification', ocrVerification);

// Or extend existing verification module
// blockchain/api/verification.js already exists - extend it!
```

### Create new OCR API module

```javascript
// blockchain/api/ocr-verification.js

const express = require('express');
const router = express.Router();
const { invokeContract, queryContract } = require('./contract-integration');

/**
 * POST /api/ocr-verification/store
 * Store OCR verification proof on blockchain
 */
router.post('/store', async (req, res) => {
    try {
        const { docId, docHash, extractedData, riskScore, aiMetadata } = req.body;

        const result = await invokeContract(
            'OCRVerificationContract',
            'storeDocumentProof',
            [docId, docHash, JSON.stringify(extractedData), riskScore.toString(), JSON.stringify(aiMetadata)]
        );

        res.json({
            success: true,
            docId,
            transactionId: result.txId,
            blockNumber: result.blockNumber,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * GET /api/ocr-verification/:docId
 * Retrieve verification proof from blockchain
 */
router.get('/:docId', async (req, res) => {
    try {
        const { docId } = req.params;

        const result = await queryContract(
            'OCRVerificationContract',
            'getDocumentProof',
            [docId]
        );

        res.json({
            success: true,
            proof: JSON.parse(result)
        });
    } catch (error) {
        res.status(404).json({ success: false, error: error.message });
    }
});

/**
 * POST /api/ocr-verification/flag
 * Flag suspicious document
 */
router.post('/flag', async (req, res) => {
    try {
        const { docId, reason, flaggedBy } = req.body;

        const result = await invokeContract(
            'OCRVerificationContract',
            'flagDocument',
            [docId, reason, flaggedBy]
        );

        res.json({
            success: true,
            message: 'Document flagged successfully',
            result: JSON.parse(result)
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

module.exports = router;
```

## 🔄 Integration Flow

```
1. Document Upload (Frontend)
         │
         ▼
2. OCR Processing (AI Service - Dev 1)
         │
         ▼
3. Backend receives extracted data (Dev 2)
         │
         ▼
4. Backend calls existing blockchain API
   POST /api/ocr-verification/store
         │
         ▼
5. Blockchain stores on Hyperledger Fabric
   OCRVerificationContract.storeDocumentProof()
         │
         ▼
6. Transaction ID returned to backend
         │
         ▼
7. Frontend displays verification + blockchain proof
```

## 🗂️ File Structure

```
blockchain/
├── contracts/
│   ├── TaxGuardContract.js           (Existing)
│   ├── AdvancedTaxGuardContract.js   (Existing)
│   └── OCRVerificationContract.js    (NEW - Option 2)
│
├── api/
│   ├── index.js                      (Extend - add OCR routes)
│   ├── verification.js               (Existing - extend)
│   └── ocr-verification.js           (NEW - Option 2)
│
└── scripts/
    └── deploy-ocr-contract.js        (NEW - deploy script)
```

## ⚙️ Implementation Steps

### Phase 1: Extend Existing Contract (Quick)
1. Add OCR methods to `TaxGuardContract.js`
2. Extend `blockchain/api/verification.js` with OCR endpoints
3. Update API documentation
4. Test integration

### Phase 2: Separate Contract (Modular)
1. Create `OCRVerificationContract.js`
2. Deploy contract to existing Fabric network
3. Create `ocr-verification.js` API module
4. Update `blockchain/api/index.js`
5. Test end-to-end flow

## 🔗 Backend Integration (Dev 2)

```javascript
// Example: Store OCR verification from backend

const axios = require('axios');

async function storeOCRVerification(documentData) {
    const payload = {
        docId: documentData.id,
        docHash: sha256(documentData.content),
        extractedData: {
            invoiceNumber: documentData.invoiceNumber,
            importerName: documentData.importerName,
            hsCode: documentData.hsCode,
            value: documentData.value
        },
        riskScore: documentData.aiRiskScore,
        aiMetadata: {
            ocrConfidence: documentData.ocrConfidence,
            aiModel: 'tesseract-v5',
            processingTime: documentData.processingTime
        }
    };

    const response = await axios.post(
        'http://localhost:3001/api/ocr-verification/store',
        payload
    );

    return response.data;
}
```

## 📊 Advantages of This Approach

✅ **Reuse Existing Infrastructure**
- No need for separate Hardhat/Ganache setup
- Leverage existing Hyperledger Fabric network
- Use established role-based access control

✅ **Unified Blockchain**
- All tax-related data in one place
- OCR verifications can reference tax events
- Consistent audit trail

✅ **Minimal Changes**
- Extend existing contracts/APIs
- No separate network to maintain
- Easier deployment

✅ **Better Integration**
- Direct connection to existing backend
- Same authentication/authorization
- Shared monitoring and logging

## 🎯 Recommended Approach: **Option 1** (Extend TaxGuardContract)

**Why?**
- Faster implementation (add methods to existing contract)
- No new contract deployment needed
- Leverages existing RBAC and validation
- OCR events automatically linked to tax events

**Implementation:**
1. Add 3-4 OCR methods to `TaxGuardContract.js`
2. Extend `/api/verification` endpoint
3. Update frontend to call existing API
4. Done! ✅

## 📝 Next Steps

1. **Review with team** - Confirm this approach works for all devs
2. **Update TaxGuardContract** - Add OCR verification methods
3. **Extend API** - Add OCR endpoints to existing verification module
4. **Test integration** - Verify end-to-end flow
5. **Update documentation** - Document new OCR capabilities

---

**This approach eliminates the need for separate blockchain infrastructure while providing all the verification capabilities needed for the OCR system!** 🚀
