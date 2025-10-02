# TaxGuard Smart Contract Usage Guide

## Overview
The TaxGuard Smart Contract provides immutable tax event recording with role-based access control for the Zambian Revenue Authority (ZRA) blockchain system.

## Contract Functions

### 1. initLedger()
**Purpose:** Initialize the blockchain ledger with default configuration  
**Access:** Admin only  
**Parameters:** None

**Example Usage:**
```javascript
// Invoke via Fabric SDK
await contract.submitTransaction('initLedger');
```

**Response:**
```json
{
  "contractVersion": "1.0.0",
  "initialized": "2025-10-02T08:00:00.000Z",
  "totalEvents": 0,
  "supportedEventTypes": ["filing", "payment", "auditFlag", "adminChange", "compliance", "whistleblower"]
}
```

---

### 2. createEvent()
**Purpose:** Create a new immutable tax event  
**Access:** Producer, Admin  
**Parameters:** `eventId`, `eventType`, `anonymizedUserId`, `hashOfPayload`, `notes`

**Example Payloads:**

#### Tax Filing Event
```javascript
await contract.submitTransaction(
  'createEvent',
  'evt-filing-001',
  'filing',
  'taxpayer-abc123',
  'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
  'VAT Return Filed - Q3 2025 | Amount: K50,000 | Status: Submitted | Deadline: Met'
);
```

#### Tax Payment Event
```javascript
await contract.submitTransaction(
  'createEvent',
  'evt-payment-002',
  'payment',
  'taxpayer-def456',
  '5d41402abc4b2a76b9719d911017c592',
  'Income Tax Payment - K25,000 | Method: Bank Transfer | Reference: PAY2025001'
);
```

#### Compliance Check Event
```javascript
await contract.submitTransaction(
  'createEvent',
  'evt-compliance-003',
  'compliance',
  'taxpayer-ghi789',
  'comp789hash123456',
  'Compliance Verification - Business License Valid | VAT Registration Active'
);
```

#### Audit Flag Event
```javascript
await contract.submitTransaction(
  'createEvent',
  'evt-audit-004',
  'auditFlag',
  'taxpayer-jkl012',
  'audit456hash789',
  'Risk Alert - Revenue Mismatch | Declared: K100,000 | Expected: K150,000 | Variance: 33%'
);
```

#### WhistleBlower Report
```javascript
await contract.submitTransaction(
  'createEvent',
  'evt-whistle-005',
  'whistleblower',
  'anonymous-report-001',
  'whistle789hash456',
  'Anonymous Report - Tax Evasion Suspected | Company: XYZ Ltd | Case ID: WB2025001'
);
```

#### Administrative Change
```javascript
await contract.submitTransaction(
  'createEvent',
  'evt-admin-006',
  'adminChange',
  'admin-user-001',
  'admin123hash789',
  'System Update - Tax Rate Changed | VAT Rate: 16% → 18% | Effective: 2025-11-01'
);
```

**Response:**
```json
{
  "eventId": "evt-filing-001",
  "eventType": "filing",
  "timestamp": "2025-10-02T08:15:30.000Z",
  "anonymizedUserId": "taxpayer-abc123",
  "hashOfPayload": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
  "notes": "VAT Return Filed - Q3 2025 | Amount: K50,000 | Status: Submitted",
  "createdBy": "x509::/C=US/ST=CA/L=San Francisco/O=org1.example.com/CN=user1",
  "blockNumber": "tx123456789",
  "integrity": "calculated-sha256-hash"
}
```

---

### 3. readEvent()
**Purpose:** Retrieve a specific tax event  
**Access:** Producer, Auditor, Admin  
**Parameters:** `eventId`

**Example Usage:**
```javascript
const result = await contract.evaluateTransaction('readEvent', 'evt-filing-001');
const event = JSON.parse(result);
```

**Response:** Same as createEvent response with integrity verification

---

### 4. queryAllEvents()
**Purpose:** Retrieve all tax events  
**Access:** Auditor, Admin  
**Parameters:** None

**Example Usage:**
```javascript
const result = await contract.evaluateTransaction('queryAllEvents');
const events = JSON.parse(result);
```

**Response:**
```json
[
  {
    "eventId": "evt-filing-001",
    "eventType": "filing",
    "timestamp": "2025-10-02T08:15:30.000Z",
    "anonymizedUserId": "taxpayer-abc123",
    "notes": "VAT Return Filed - Q3 2025"
  },
  {
    "eventId": "evt-payment-002",
    "eventType": "payment",
    "timestamp": "2025-10-02T08:20:15.000Z",
    "anonymizedUserId": "taxpayer-def456",
    "notes": "Income Tax Payment - K25,000"
  }
]
```

---

### 5. queryEventsByType()
**Purpose:** Query events by specific type  
**Access:** Auditor, Admin  
**Parameters:** `eventType`

**Example Usage:**
```javascript
// Get all filing events
const result = await contract.evaluateTransaction('queryEventsByType', 'filing');
const filingEvents = JSON.parse(result);

// Get all audit flags
const auditResult = await contract.evaluateTransaction('queryEventsByType', 'auditFlag');
const auditEvents = JSON.parse(auditResult);
```

---

### 6. getEventHistory()
**Purpose:** Get complete history of an event  
**Access:** Admin only  
**Parameters:** `eventId`

**Example Usage:**
```javascript
const result = await contract.evaluateTransaction('getEventHistory', 'evt-filing-001');
const history = JSON.parse(result);
```

**Response:**
```json
[
  {
    "txId": "tx123456789",
    "timestamp": "2025-10-02T08:15:30.000Z",
    "isDelete": false,
    "value": {
      "eventId": "evt-filing-001",
      "eventType": "filing",
      "notes": "VAT Return Filed - Q3 2025"
    }
  }
]
```

---

## Role-Based Access Control

### Producer Role
- **Who:** TaxGuard AI, WhistlePro systems
- **Permissions:** Create events, Read own events
- **Use Cases:** Submit tax filings, payments, compliance checks

### Auditor Role  
- **Who:** ZRA Officials, Tax Inspectors
- **Permissions:** Read all events, Query events by type
- **Use Cases:** Audit investigations, compliance monitoring

### Admin Role
- **Who:** System Administrators, Senior ZRA Officials
- **Permissions:** All operations including event history
- **Use Cases:** System management, forensic analysis

---

## Event Types & Use Cases

| Event Type | Description | Typical Users |
|------------|-------------|---------------|
| `filing` | Tax return submissions | TaxGuard AI |
| `payment` | Tax payment records | Payment systems |
| `compliance` | Compliance verification | Compliance systems |
| `auditFlag` | Risk alerts and flags | AI Risk Engine |
| `whistleblower` | Anonymous reports | WhistlePro |
| `adminChange` | System configuration changes | Administrators |

---

## Integration Examples

### TaxGuard AI Integration
```javascript
// When AI processes a tax filing
const filingEvent = {
  eventId: `filing-${Date.now()}`,
  eventType: 'filing',
  anonymizedUserId: hashUserId(taxpayerId),
  hashOfPayload: sha256(filingData),
  notes: `AI Processed Filing | Risk Score: ${riskScore} | Status: ${status}`
};

await contract.submitTransaction('createEvent', ...Object.values(filingEvent));
```

### WhistlePro Integration
```javascript
// When anonymous report is submitted
const reportEvent = {
  eventId: `whistle-${reportId}`,
  eventType: 'whistleblower',
  anonymizedUserId: `anonymous-${reportId}`,
  hashOfPayload: sha256(reportData),
  notes: `Anonymous Report | Category: ${category} | Priority: ${priority}`
};

await contract.submitTransaction('createEvent', ...Object.values(reportEvent));
```

### Audit Dashboard Integration
```javascript
// Query recent audit flags for dashboard
const auditFlags = await contract.evaluateTransaction('queryEventsByType', 'auditFlag');
const recentFlags = JSON.parse(auditFlags)
  .filter(event => isRecent(event.timestamp))
  .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
```

---

## Error Handling

### Common Errors
- `Access denied` - Insufficient role permissions
- `Event already exists` - Duplicate event ID
- `Invalid event type` - Unsupported event type
- `Integrity check failed` - Event data corruption
- `Event not found` - Non-existent event ID

### Error Response Format
```json
{
  "error": "Access denied. Required role: producer or admin",
  "code": "INSUFFICIENT_PERMISSIONS",
  "timestamp": "2025-10-02T08:30:00.000Z"
}
```

---

## Security Features

1. **Immutability:** Events cannot be modified once created
2. **Integrity Verification:** SHA256 hashes ensure data integrity
3. **Role-Based Access:** Granular permissions by user role
4. **Audit Trail:** Complete transaction history
5. **Anonymization:** User IDs are anonymized for privacy
6. **Event Emission:** Real-time notifications for monitoring

---

## Testing

Run the comprehensive test suite:
```bash
npm test -- TaxGuardContract.test.js
```

Test coverage includes:
- ✅ Event creation and validation
- ✅ Role-based access control
- ✅ Data integrity verification
- ✅ Query operations
- ✅ Error handling
- ✅ Edge cases and security
