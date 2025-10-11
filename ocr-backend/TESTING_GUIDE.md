# 🧪 Testing Guide - Security Features

## 📋 Overview

Complete guide for testing the ZRA TaxGuard OCR security features with mock data.

**Test Data**: 10 mock documents with varying security levels
**Anomalies**: 9 test anomalies (7 unresolved, 2 resolved)
**Audit Entries**: 14 security events logged
**Test Scripts**: 3 automated test scripts

---

## 🚀 Quick Start

### Step 1: Setup Database

```bash
cd /home/kaps100/ZRA-Hackathon-TaxGuard-AI-GhostBuster

# Ensure PostgreSQL is running
docker-compose up -d postgres

# Wait for it to initialize
sleep 5
```

### Step 2: Run Migrations

```bash
cd ocr-backend/database

# Create security tables
./migrate-docker.sh
```

Expected output:
```
✅ Migration completed!
Verifying tables...
 anomaly_detection  | 13
 document_security  | 56
 security_audit_log | 11
```

### Step 3: Seed Mock Data

```bash
# Insert test data
./seed-data.sh
```

Expected output:
```
✅ Mock data seeded successfully!

📊 Test Data Summary:
   - 10 test documents (TEST-DOC-001 to TEST-DOC-010)
   - Security status distribution: SECURE, ACCEPTABLE, SUSPICIOUS, COMPROMISED
   - 9 anomalies (7 unresolved, 2 resolved)
   - 14 audit log entries
```

### Step 4: Test Database Connection

```bash
cd /home/kaps100/ZRA-Hackathon-TaxGuard-AI-GhostBuster/ocr-backend

# Install dependencies if not already done
npm install

# Test database queries
node test-database.js
```

Expected output:
```
🔬 ZRA TaxGuard OCR - Database Testing

1️⃣  Connecting to database...
   ✅ Database connected

2️⃣  Initializing models...
   ✅ Models initialized

3️⃣  Testing basic queries...
   ✅ Total security records: 10

4️⃣  Security Status Distribution:
   - SECURE: 2
   - ACCEPTABLE: 5
   - SUSPICIOUS: 1
   - COMPROMISED: 1
   - NULL: 1

[... more test output ...]

✅ Database Testing Complete!
```

### Step 5: Test API Endpoints

```bash
# Start the OCR backend server (in another terminal)
cd ocr-backend
npm start

# In the original terminal, run API tests
./test-api.sh
```

---

## 📊 Mock Data Details

### Test Documents

| Document ID | Security Score | Status | Key Features |
|------------|----------------|--------|--------------|
| TEST-DOC-001 | 98.5 | SECURE | All security features present, verified |
| TEST-DOC-002 | 78.0 | ACCEPTABLE | Missing hologram, but verified |
| TEST-DOC-003 | N/A | N/A | Pending scan |
| TEST-DOC-004 | N/A | N/A | Pending scan |
| TEST-DOC-005 | 55.0 | SUSPICIOUS | Future EXIF date, flagged |
| TEST-DOC-006 | 95.0 | SECURE | High security, QR verified |
| TEST-DOC-007 | 25.0 | COMPROMISED | Hash failed, rejected |
| TEST-DOC-008 | 72.0 | ACCEPTABLE | Barcode only |
| TEST-DOC-009 | 76.0 | ACCEPTABLE | QR code only |
| TEST-DOC-010 | 74.0 | ACCEPTABLE | Watermark only |

### Anomalies

**Unresolved (7):**
1. TEST-DOC-005: EXIF future date (HIGH)
2. TEST-DOC-005: GIMP detected (MEDIUM)
3. TEST-DOC-005: Low watermark confidence (MEDIUM)
4. TEST-DOC-007: Suspicious PDF structure (CRITICAL)
5. TEST-DOC-007: Hash verification failed (CRITICAL)
6. TEST-DOC-007: Recent modification (HIGH)
7. TEST-DOC-007: No security features (CRITICAL)

**Resolved (2):**
1. TEST-DOC-002: Hologram not detected (FALSE_POSITIVE)
2. TEST-DOC-002: Mobile device capture (FALSE_POSITIVE)

### Officers

- **OFFICER-001** (John Mwansa) - Verified TEST-DOC-001, flagged TEST-DOC-005
- **OFFICER-002** (Mary Banda) - Verified TEST-DOC-002
- **OFFICER-003** (Peter Phiri) - Rejected TEST-DOC-007

---

## 🧪 API Test Scenarios

### Scenario 1: View Dashboard

**Endpoint**: `GET /api/security/dashboard`
**Purpose**: See overall security statistics
**Expected**: Overview of all documents, scores, anomalies

```bash
curl http://localhost:5000/api/security/dashboard \
  -H "Authorization: Bearer test_token_12345" \
  -H "x-officer-id: OFFICER-001"
```

**Expected Response**:
```json
{
  "success": true,
  "data": {
    "overview": {
      "totalDocuments": 10,
      "pendingReview": 3,
      "flaggedDocuments": 2,
      "verifiedToday": 0
    },
    "securityScores": {
      "averageScore": 70.85,
      "secureCount": 2,
      "acceptableCount": 5,
      "suspiciousCount": 1,
      "compromisedCount": 1
    },
    "anomalies": {
      "total": 9,
      "unresolvedHigh": 2,
      "unresolvedMedium": 2,
      "unresolvedLow": 0,
      "resolvedToday": 0
    }
  }
}
```

---

### Scenario 2: Get Security Report (SECURE)

**Endpoint**: `GET /api/security/report/TEST-DOC-001`
**Purpose**: View detailed security features of a secure document
**Expected**: 98.5 score, all features detected

```bash
curl http://localhost:5000/api/security/report/TEST-DOC-001 \
  -H "Authorization: Bearer test_token_12345" \
  -H "x-officer-id: OFFICER-001"
```

**Key Response Fields**:
- `fileIntegrity.verified`: true
- `physicalFeatures.watermark.detected`: true (95.5% confidence)
- `physicalFeatures.hologram.detected`: true (92.0% confidence)
- `digitalFeatures.qrCode.verified`: true
- `digitalFeatures.barcode.verified`: true
- `securityAssessment.score`: 98.5
- `securityAssessment.status`: "SECURE"

---

### Scenario 3: Get Security Report (COMPROMISED)

**Endpoint**: `GET /api/security/report/TEST-DOC-007`
**Purpose**: View a compromised document
**Expected**: 25 score, rejected, multiple anomalies

```bash
curl http://localhost:5000/api/security/report/TEST-DOC-007 \
  -H "Authorization: Bearer test_token_12345" \
  -H "x-officer-id: OFFICER-001"
```

**Key Response Fields**:
- `fileIntegrity.verified`: false
- `physicalFeatures.watermark.detected`: false
- `securityAssessment.score`: 25.0
- `securityAssessment.status`: "COMPROMISED"
- `verification.verified`: true (rejected by OFFICER-003)
- `flagged`: true
- `anomalies`: Array of 4 critical issues

---

### Scenario 4: List Anomalies

**Endpoint**: `GET /api/security/anomalies`
**Purpose**: View all detected anomalies
**Filters**: `?severity=HIGH&status=unresolved`

```bash
# All anomalies
curl http://localhost:5000/api/security/anomalies \
  -H "Authorization: Bearer test_token_12345" \
  -H "x-officer-id: OFFICER-001"

# Only high severity, unresolved
curl "http://localhost:5000/api/security/anomalies?severity=HIGH&status=unresolved" \
  -H "Authorization: Bearer test_token_12345" \
  -H "x-officer-id: OFFICER-001"
```

**Expected**: 9 total anomalies, 2 HIGH unresolved

---

### Scenario 5: Officer Verification (APPROVE)

**Endpoint**: `POST /api/security/verify/:documentId`
**Purpose**: Officer manually approves a document
**Actions**: APPROVE, REJECT, FLAG, REQUEST_REVIEW

```bash
curl -X POST http://localhost:5000/api/security/verify/TEST-DOC-006 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer test_token_12345" \
  -H "x-officer-id: OFFICER-001" \
  -d '{
    "action": "APPROVE",
    "notes": "Manual verification completed. Document is authentic."
  }'
```

**Expected Result**:
- Database updated with verification
- Audit log entry created
- Blockchain submission (if available)

---

### Scenario 6: Flag Document

**Endpoint**: `POST /api/security/flag/:documentId`
**Purpose**: Flag a document as suspicious
**Validation**: Reason must be ≥ 10 characters

```bash
curl -X POST http://localhost:5000/api/security/flag/TEST-DOC-008 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer test_token_12345" \
  -H "x-officer-id: OFFICER-001" \
  -d '{
    "reason": "Missing watermark feature requires further investigation.",
    "severity": "MEDIUM"
  }'
```

**Expected Result**:
- Document flagged in database
- Flag reason stored
- Audit log entry created
- Blockchain flag submission

---

### Scenario 7: Resolve Anomaly

**Endpoint**: `POST /api/security/resolve-anomaly/:anomalyId`
**Purpose**: Mark an anomaly as resolved or false positive
**Resolutions**: RESOLVED, FALSE_POSITIVE, ESCALATED

```bash
curl -X POST http://localhost:5000/api/security/resolve-anomaly/1 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer test_token_12345" \
  -H "x-officer-id: OFFICER-001" \
  -d '{
    "resolution": "FALSE_POSITIVE",
    "notes": "Verified with document issuer. Future date is valid for certificate expiry."
  }'
```

**Expected Result**:
- Anomaly marked as resolved
- False positive flag set
- Resolution notes saved
- Audit log entry

---

### Scenario 8: Get Audit Log

**Endpoint**: `GET /api/security/audit-log/:documentId`
**Purpose**: View complete audit trail for a document
**Includes**: Scans, verifications, flags, blockchain events

```bash
curl http://localhost:5000/api/security/audit-log/TEST-DOC-001 \
  -H "Authorization: Bearer test_token_12345" \
  -H "x-officer-id: OFFICER-001"
```

**Expected Events**:
1. SCAN event (security check)
2. APPROVE event (officer verification)
3. Blockchain history

---

### Scenario 9: Get Flagged Documents

**Endpoint**: `GET /api/security/flagged`
**Purpose**: List all flagged documents
**Pagination**: `?limit=50&offset=0`

```bash
curl "http://localhost:5000/api/security/flagged?limit=10" \
  -H "Authorization: Bearer test_token_12345" \
  -H "x-officer-id: OFFICER-001"
```

**Expected**: 2 flagged documents (TEST-DOC-005, TEST-DOC-007)

---

### Scenario 10: Get Statistics

**Endpoint**: `GET /api/security/statistics`
**Purpose**: Comprehensive security statistics
**Includes**: DB stats, blockchain stats, feature detection

```bash
curl http://localhost:5000/api/security/statistics \
  -H "Authorization: Bearer test_token_12345" \
  -H "x-officer-id: OFFICER-001"
```

**Expected Data**:
- Total documents, flagged count, average score
- Security status distribution
- Feature detection counts (QR, barcode, watermark, etc.)
- Blockchain statistics

---

## 🔧 Automated Testing

### Option 1: Node.js Database Test

```bash
cd ocr-backend
node test-database.js
```

**Tests**:
- Database connection
- Model initialization
- Basic queries
- Aggregations
- Feature counts
- Audit log retrieval

**Duration**: ~5 seconds

---

### Option 2: Bash API Test Suite

```bash
cd ocr-backend
./test-api.sh
```

**Tests**: 20 API endpoint tests covering:
- Health check
- Dashboard
- Security reports (3 documents)
- Anomaly management
- Officer verifications
- Flagging
- Audit logs
- Statistics
- Error handling

**Duration**: ~30 seconds

**Requirements**:
- OCR backend server running on port 5000
- Python 3 installed (for JSON formatting)
- curl installed

---

### Option 3: Manual Testing with Postman

**Import Collection**:
1. Create new Postman collection
2. Add environment variables:
   - `API_URL`: http://localhost:5000
   - `OFFICER_ID`: OFFICER-001
   - `AUTH_TOKEN`: test_token_12345

**Create Requests**:
See "API Test Scenarios" section above for endpoints

---

## ✅ Verification Checklist

After running tests, verify:

### Database Verification

```sql
-- Check documents inserted
SELECT COUNT(*) FROM ocr.documents WHERE document_id LIKE 'TEST-%';
-- Expected: 10

-- Check security scans
SELECT security_status, COUNT(*)
FROM ocr.document_security
WHERE document_id LIKE 'TEST-%'
GROUP BY security_status;
-- Expected: SECURE (2), ACCEPTABLE (5), SUSPICIOUS (1), COMPROMISED (1), NULL (1)

-- Check anomalies
SELECT severity, resolved, COUNT(*)
FROM ocr.anomaly_detection
WHERE document_id LIKE 'TEST-%'
GROUP BY severity, resolved;
-- Expected: 9 total (7 unresolved, 2 resolved)

-- Check audit log
SELECT event_type, COUNT(*)
FROM ocr.security_audit_log
WHERE document_id LIKE 'TEST-%' OR document_id = ''
GROUP BY event_type;
-- Expected: SCAN, APPROVE, REJECT, FLAG, RESOLVE_ANOMALY, VIEW_DASHBOARD
```

### API Verification

- [ ] Health endpoint returns 200 OK
- [ ] Dashboard shows correct statistics
- [ ] Security reports return detailed data
- [ ] Anomalies can be filtered
- [ ] Officer verification updates database
- [ ] Flag operation creates audit entry
- [ ] Audit log shows all events
- [ ] Statistics endpoint aggregates correctly
- [ ] Error handling returns proper 404/400 codes
- [ ] Pagination works on anomalies/flagged endpoints

---

## 🐛 Troubleshooting

### Database Connection Fails

**Error**: `ECONNREFUSED localhost:5432`

**Solution**:
```bash
# Check if PostgreSQL is running
docker ps | grep postgres

# If not running
docker-compose up -d postgres

# Check logs
docker logs zra-postgres
```

---

### Models Not Initialized

**Error**: `Models not initialized. Call initializeModels() first.`

**Solution**: Ensure server.js includes:
```javascript
const { connectDatabase } = require('./config/database');
const { initializeModels } = require('./models');

// In server startup
const sequelize = await connectDatabase();
initializeModels(sequelize);
```

---

### No Test Data Found

**Error**: `Document not found (run seed-data.sh first)`

**Solution**:
```bash
cd ocr-backend/database
./seed-data.sh
```

---

### API Tests Fail (Connection Refused)

**Error**: `curl: (7) Failed to connect to localhost port 5000`

**Solution**:
```bash
# Start the OCR backend
cd ocr-backend
npm start

# In another terminal, run tests
./test-api.sh
```

---

## 📈 Performance Testing

### Expected Query Performance

| Query Type | Expected Time | Notes |
|------------|---------------|-------|
| Single document lookup | <10ms | Indexed on document_id |
| Dashboard aggregations | <50ms | Uses PostgreSQL FILTER |
| Anomaly listing | <20ms | Indexed on severity, resolved |
| Audit log retrieval | <15ms | Indexed on timestamp |
| Statistics | <100ms | Multiple aggregations |

### Load Testing

```bash
# Use Apache Bench for load testing
ab -n 1000 -c 10 \
  -H "Authorization: Bearer test_token_12345" \
  -H "x-officer-id: OFFICER-001" \
  http://localhost:5000/api/security/dashboard
```

---

## 📝 Next Steps

After testing with mock data:

1. **Test with Real Documents**:
   - Upload actual PDF/image files
   - Trigger security scans
   - Verify QR/barcode detection works
   - Test EXIF extraction

2. **Integrate with Frontend**:
   - Connect React/Vue dashboard
   - Display security reports
   - Implement officer verification UI

3. **Production Deployment**:
   - Set up production database
   - Configure environment variables
   - Enable HTTPS
   - Set up monitoring

---

**Built for ZRA Hackathon 2025 - Comprehensive Security Testing**
