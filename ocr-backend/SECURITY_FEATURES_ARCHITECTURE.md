# 🛡️ Document Security Features Architecture

## Overview

Comprehensive security system for ZRA document verification that ensures document integrity, authenticity, and tamper-proof verification.

---

## 🎯 Security Objectives

1. **Document Integrity** - Detect any tampering or modification
2. **Authenticity Verification** - Confirm document source and legitimacy
3. **Tamper-Proof Records** - Immutable blockchain audit trail
4. **Security Feature Detection** - Validate presence of security elements
5. **Anomaly Detection** - Identify suspicious patterns and behaviors
6. **Access Control** - Role-based permissions for ZRA officers

---

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────────────────┐
│              ZRA Officer Scanner                     │
│          (Document Upload Interface)                 │
└────────────────────┬────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────┐
│         Security Validation Layer                    │
│  ┌──────────────────────────────────────────────┐  │
│  │ 1. File Validation (format, size, type)     │  │
│  │ 2. Hash Generation (SHA-256/SHA-512)        │  │
│  │ 3. Digital Signature Check (PKI)            │  │
│  │ 4. Security Features Scan                   │  │
│  │ 5. Metadata Extraction & Validation         │  │
│  └──────────────────────────────────────────────┘  │
└────────────────────┬────────────────────────────────┘
                     │
          ┌──────────┴──────────┐
          ▼                     ▼
┌─────────────────────┐  ┌─────────────────────┐
│  AI Security Check  │  │  OCR Processing     │
│  - Watermark detect │  │  - Text extraction  │
│  - QR/Barcode scan  │  │  - Field validation │
│  - Image forensics  │  │  - Risk scoring     │
│  - Anomaly detection│  │  - Data verification│
└──────────┬──────────┘  └──────────┬──────────┘
           │                        │
           └────────────┬───────────┘
                        ▼
┌─────────────────────────────────────────────────────┐
│           Blockchain Timestamping                    │
│  - Document hash + timestamp                         │
│  - Security validation results                       │
│  - Immutable verification proof                      │
│  - Officer signature                                 │
└────────────────────┬────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────┐
│       PostgreSQL Database (zra_taxguard.ocr)        │
│  - Document records                                  │
│  - Security audit logs                               │
│  - Verification history                              │
│  - Officer actions                                   │
└─────────────────────────────────────────────────────┘
```

---

## 🔒 Security Features to Detect

### 1. **Document Physical Security Features**

#### Watermarks
- **Detection Method**: Image analysis, frequency domain analysis
- **Validation**: Compare against known watermark patterns
- **Storage**: Binary flag + confidence score

#### Holograms
- **Detection Method**: Reflective surface detection, color shifting
- **Validation**: Pattern matching with reference database
- **Storage**: Type, location, authenticity score

#### Microprinting
- **Detection Method**: High-resolution OCR, character size analysis
- **Validation**: Text legibility at magnification
- **Storage**: Detected text, location, quality score

#### Security Thread
- **Detection Method**: Edge detection, material composition
- **Validation**: Thread continuity, position verification
- **Storage**: Presence flag, integrity score

#### UV Features
- **Detection Method**: UV light simulation (if scanned with UV)
- **Validation**: Compare UV-visible elements
- **Storage**: UV elements detected, authenticity

### 2. **Digital Security Features**

#### QR Codes / Barcodes
- **Detection Method**: Pattern recognition, decode content
- **Validation**: Verify against ZRA database
- **Storage**: Decoded data, validation status

#### Digital Signatures
- **Detection Method**: PKI verification, certificate chain
- **Validation**: Public key cryptography verification
- **Storage**: Signer identity, validity period, revocation status

#### Serial Numbers
- **Detection Method**: OCR + format validation
- **Validation**: Check uniqueness in database
- **Storage**: Number, issuance date, verification status

#### Document ID / Reference Numbers
- **Detection Method**: OCR + pattern matching
- **Validation**: Format compliance, database lookup
- **Storage**: ID, issuing authority, validation result

### 3. **Metadata Security**

#### EXIF Data Analysis
- **Check For**:
  - Creation date/time
  - Modification history
  - Device information
  - GPS coordinates (if applicable)
  - Software used
- **Validation**: Consistency checks, tampering detection
- **Storage**: Full metadata JSON, anomaly flags

#### File Format Integrity
- **Check For**:
  - Valid PDF/image structure
  - No embedded malware
  - Correct file signatures
  - Compression artifacts
- **Validation**: Format specification compliance
- **Storage**: Format details, integrity status

---

## 📊 Database Schema Extensions

### New Table: `ocr.document_security`

```sql
CREATE TABLE IF NOT EXISTS ocr.document_security (
    id SERIAL PRIMARY KEY,
    document_id VARCHAR(100) NOT NULL REFERENCES ocr.documents(document_id) ON DELETE CASCADE,

    -- File Integrity
    file_hash_sha256 VARCHAR(64) NOT NULL,
    file_hash_sha512 VARCHAR(128) NOT NULL,
    original_hash VARCHAR(128) NOT NULL,
    hash_verified BOOLEAN DEFAULT FALSE,
    hash_verification_time TIMESTAMP,

    -- Physical Security Features
    watermark_detected BOOLEAN DEFAULT FALSE,
    watermark_confidence DECIMAL(5,2),
    watermark_details JSONB DEFAULT '{}',

    hologram_detected BOOLEAN DEFAULT FALSE,
    hologram_confidence DECIMAL(5,2),
    hologram_details JSONB DEFAULT '{}',

    microprinting_detected BOOLEAN DEFAULT FALSE,
    microprinting_confidence DECIMAL(5,2),
    microprinting_details JSONB DEFAULT '{}',

    security_thread_detected BOOLEAN DEFAULT FALSE,
    security_thread_confidence DECIMAL(5,2),
    security_thread_details JSONB DEFAULT '{}',

    uv_features_detected BOOLEAN DEFAULT FALSE,
    uv_features_confidence DECIMAL(5,2),
    uv_features_details JSONB DEFAULT '{}',

    -- Digital Security Features
    qr_code_detected BOOLEAN DEFAULT FALSE,
    qr_code_content TEXT,
    qr_code_verified BOOLEAN DEFAULT FALSE,
    qr_code_details JSONB DEFAULT '{}',

    barcode_detected BOOLEAN DEFAULT FALSE,
    barcode_content TEXT,
    barcode_verified BOOLEAN DEFAULT FALSE,
    barcode_details JSONB DEFAULT '{}',

    digital_signature_present BOOLEAN DEFAULT FALSE,
    digital_signature_valid BOOLEAN DEFAULT FALSE,
    digital_signature_details JSONB DEFAULT '{}',

    serial_number VARCHAR(255),
    serial_number_verified BOOLEAN DEFAULT FALSE,
    serial_number_details JSONB DEFAULT '{}',

    -- Metadata Security
    exif_data JSONB DEFAULT '{}',
    exif_anomalies JSONB DEFAULT '[]',
    exif_tampering_detected BOOLEAN DEFAULT FALSE,

    file_format_valid BOOLEAN DEFAULT TRUE,
    file_format_details JSONB DEFAULT '{}',

    -- Overall Security Assessment
    security_score DECIMAL(5,2) DEFAULT 0,
    security_status VARCHAR(50), -- SECURE, SUSPICIOUS, COMPROMISED, UNKNOWN
    security_flags JSONB DEFAULT '[]',

    -- Blockchain Proof
    blockchain_timestamp VARCHAR(100),
    blockchain_tx_id VARCHAR(100),
    blockchain_proof JSONB DEFAULT '{}',

    -- Officer Verification
    verified_by VARCHAR(100),
    verification_timestamp TIMESTAMP,
    officer_notes TEXT,

    -- Audit
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_document_security_doc_id ON ocr.document_security(document_id);
CREATE INDEX idx_document_security_status ON ocr.document_security(security_status);
CREATE INDEX idx_document_security_score ON ocr.document_security(security_score);
CREATE INDEX idx_document_security_blockchain ON ocr.document_security(blockchain_tx_id);
```

### New Table: `ocr.security_audit_log`

```sql
CREATE TABLE IF NOT EXISTS ocr.security_audit_log (
    id SERIAL PRIMARY KEY,
    document_id VARCHAR(100) NOT NULL,
    event_type VARCHAR(100) NOT NULL, -- SCAN, VERIFY, FLAG, APPROVE, REJECT
    event_category VARCHAR(50), -- UPLOAD, SECURITY_CHECK, BLOCKCHAIN, OFFICER_ACTION
    event_details JSONB DEFAULT '{}',
    severity VARCHAR(20), -- INFO, WARNING, CRITICAL
    officer_id VARCHAR(100),
    officer_name VARCHAR(255),
    ip_address VARCHAR(45),
    user_agent TEXT,
    timestamp TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_security_audit_doc_id ON ocr.security_audit_log(document_id);
CREATE INDEX idx_security_audit_timestamp ON ocr.security_audit_log(timestamp);
CREATE INDEX idx_security_audit_officer ON ocr.security_audit_log(officer_id);
CREATE INDEX idx_security_audit_severity ON ocr.security_audit_log(severity);
```

### New Table: `ocr.anomaly_detection`

```sql
CREATE TABLE IF NOT EXISTS ocr.anomaly_detection (
    id SERIAL PRIMARY KEY,
    document_id VARCHAR(100) NOT NULL,
    anomaly_type VARCHAR(100) NOT NULL, -- METADATA, FORMAT, CONTENT, BEHAVIOR
    anomaly_description TEXT NOT NULL,
    confidence_score DECIMAL(5,2),
    severity VARCHAR(20), -- LOW, MEDIUM, HIGH, CRITICAL
    detection_method VARCHAR(100), -- AI, RULE_BASED, STATISTICAL
    detection_details JSONB DEFAULT '{}',
    false_positive BOOLEAN DEFAULT FALSE,
    resolved BOOLEAN DEFAULT FALSE,
    resolved_by VARCHAR(100),
    resolved_at TIMESTAMP,
    resolution_notes TEXT,
    detected_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_anomaly_doc_id ON ocr.anomaly_detection(document_id);
CREATE INDEX idx_anomaly_type ON ocr.anomaly_detection(anomaly_type);
CREATE INDEX idx_anomaly_severity ON ocr.anomaly_detection(severity);
CREATE INDEX idx_anomaly_resolved ON ocr.anomaly_detection(resolved);
```

---

## 🔐 Security Validation Workflow

### Phase 1: Upload & Initial Validation (< 1 second)

```
1. File Upload
   ├─> Validate file type (PDF, JPG, PNG)
   ├─> Check file size limits
   ├─> Virus/malware scan (optional)
   └─> Generate unique document ID

2. Hash Generation
   ├─> Calculate SHA-256 hash
   ├─> Calculate SHA-512 hash
   ├─> Store original hashes
   └─> Create blockchain fingerprint

3. Metadata Extraction
   ├─> Extract EXIF data
   ├─> Extract file properties
   ├─> Check modification history
   └─> Flag anomalies
```

### Phase 2: Security Feature Detection (2-5 seconds)

```
1. Physical Security Scan
   ├─> Watermark detection (AI model)
   ├─> Hologram detection (pattern matching)
   ├─> Microprinting analysis (OCR + magnification)
   ├─> Security thread detection (edge detection)
   └─> UV feature check (if available)

2. Digital Security Scan
   ├─> QR code detection & decode
   ├─> Barcode detection & decode
   ├─> Serial number extraction
   ├─> Digital signature verification
   └─> Document ID validation

3. Anomaly Detection
   ├─> Check for image manipulation
   ├─> Detect copy-paste artifacts
   ├─> Analyze pixel patterns
   ├─> Compare with known fraud patterns
   └─> Statistical outlier detection
```

### Phase 3: Blockchain Timestamping (< 1 second)

```
1. Prepare Blockchain Payload
   ├─> Document hash (SHA-256)
   ├─> Security validation results
   ├─> Timestamp (ISO 8601)
   ├─> Officer ID (if applicable)
   └─> Security score

2. Submit to Blockchain
   ├─> POST to blockchain API (port 3001)
   ├─> Receive transaction ID
   ├─> Store blockchain proof
   └─> Update database

3. Generate Verification Certificate
   ├─> Create tamper-proof certificate
   ├─> Include blockchain TX ID
   ├─> Officer signature
   └─> QR code for verification
```

### Phase 4: Officer Review (Manual)

```
1. Security Dashboard
   ├─> Display all security features
   ├─> Show confidence scores
   ├─> Highlight anomalies
   └─> Provide recommendations

2. Officer Actions
   ├─> Approve document
   ├─> Flag for review
   ├─> Reject document
   ├─> Request additional verification
   └─> Add notes/comments

3. Final Blockchain Entry
   ├─> Record officer decision
   ├─> Timestamp action
   ├─> Store immutably
   └─> Generate final report
```

---

## 🔬 AI-Based Security Checks

### 1. Image Forensics

```python
# Detect image manipulation
- ELA (Error Level Analysis)
- JPEG compression artifacts
- Clone detection
- Splicing detection
- Copy-move forgery
```

### 2. Watermark Detection

```python
# AI model for watermark recognition
- Frequency domain analysis (FFT)
- Deep learning classifier
- Pattern matching
- Confidence scoring
```

### 3. Anomaly Detection

```python
# Statistical and ML-based anomaly detection
- Isolation Forest
- One-Class SVM
- Autoencoder-based detection
- Behavioral analysis
```

---

## 📡 API Endpoints for Security Features

### For ZRA Officers

```
POST   /api/security/scan/:documentId
       - Trigger comprehensive security scan
       - Response: Security report + recommendations

GET    /api/security/report/:documentId
       - Get detailed security report
       - Response: All security features + blockchain proof

POST   /api/security/verify/:documentId
       - Officer verification action
       - Body: { action, notes, officerId }

GET    /api/security/dashboard
       - Security overview dashboard
       - Response: Statistics, pending reviews, alerts

GET    /api/security/anomalies
       - List detected anomalies
       - Query params: severity, status, dateRange

POST   /api/security/resolve-anomaly/:anomalyId
       - Mark anomaly as resolved or false positive
       - Body: { resolution, notes }

GET    /api/security/audit-log/:documentId
       - Complete audit trail for document
       - Response: All security events chronologically
```

---

## 🔐 Digital Signature Verification (PKI)

### ZRA Certificate Authority Setup

```javascript
// Generate ZRA key pair (one-time setup)
const zraPrivateKey = generatePrivateKey();
const zraPublicKey = generatePublicKey(zraPrivateKey);
const zraCertificate = createCertificate(zraPublicKey, zraPrivateKey);

// Store in secure key management system
storeSecurely(zraPrivateKey); // HSM or secure vault
publishPublicly(zraPublicKey); // Public registry
```

### Document Signing Process

```javascript
// Sign document hash
const documentHash = sha256(documentContent);
const signature = sign(documentHash, zraPrivateKey);

// Attach to document metadata
const signedDocument = {
    document: documentContent,
    signature: signature,
    certificate: zraCertificate,
    timestamp: new Date().toISOString()
};
```

### Signature Verification

```javascript
// Verify document signature
const isValid = verify(
    documentHash,
    signature,
    zraPublicKey
);

// Check certificate validity
const isCertValid = verifyCertificate(
    zraCertificate,
    trustedCAList
);

// Final validation
const isAuthentic = isValid && isCertValid && !isRevoked;
```

---

## 📊 Security Scoring Algorithm

```javascript
function calculateSecurityScore(document) {
    let score = 0;
    const weights = {
        hashIntegrity: 20,
        physicalFeatures: 30,
        digitalFeatures: 25,
        metadataSecurity: 15,
        blockchainProof: 10
    };

    // Hash integrity (20 points)
    if (document.hashVerified) score += weights.hashIntegrity;

    // Physical features (30 points)
    if (document.watermarkDetected) score += 8;
    if (document.hologramDetected) score += 8;
    if (document.microprintingDetected) score += 7;
    if (document.securityThreadDetected) score += 7;

    // Digital features (25 points)
    if (document.qrCodeVerified) score += 8;
    if (document.digitalSignatureValid) score += 10;
    if (document.serialNumberVerified) score += 7;

    // Metadata security (15 points)
    if (!document.exifTamperingDetected) score += 8;
    if (document.fileFormatValid) score += 7;

    // Blockchain proof (10 points)
    if (document.blockchainTxId) score += 10;

    return score;
}

function getSecurityStatus(score) {
    if (score >= 90) return 'SECURE';
    if (score >= 70) return 'ACCEPTABLE';
    if (score >= 50) return 'SUSPICIOUS';
    return 'COMPROMISED';
}
```

---

## 🚨 Anomaly Detection Rules

### Automatic Flags

```javascript
const anomalyRules = {
    // Metadata anomalies
    futureCreationDate: {
        check: (date) => new Date(date) > new Date(),
        severity: 'HIGH',
        message: 'Document creation date is in the future'
    },

    // File format anomalies
    mismatchedExtension: {
        check: (filename, mimeType) => !matchesMimeType(filename, mimeType),
        severity: 'MEDIUM',
        message: 'File extension does not match content type'
    },

    // Security feature anomalies
    missingWatermark: {
        check: (doc) => doc.documentType === 'OFFICIAL' && !doc.watermarkDetected,
        severity: 'HIGH',
        message: 'Official document missing watermark'
    },

    // Behavioral anomalies
    rapidSubmissions: {
        check: (userId, timeWindow) => getSubmissionCount(userId, timeWindow) > threshold,
        severity: 'MEDIUM',
        message: 'Unusual number of submissions in short time'
    },

    // Content anomalies
    duplicateSerialNumber: {
        check: (serialNumber) => isDuplicateInDatabase(serialNumber),
        severity: 'CRITICAL',
        message: 'Serial number already exists in database'
    }
};
```

---

## 📈 Implementation Priority

### Phase 1: Core Security (Week 1)
- ✅ File hash generation and storage
- ✅ Basic metadata extraction
- ✅ Blockchain timestamping
- ✅ Security audit logging

### Phase 2: Feature Detection (Week 2)
- QR code / barcode detection and decoding
- Serial number extraction and validation
- Digital signature verification (PKI)
- Basic anomaly detection rules

### Phase 3: Advanced AI (Week 3)
- Watermark detection (AI model)
- Image forensics analysis
- Statistical anomaly detection
- Behavioral pattern analysis

### Phase 4: Officer Dashboard (Week 4)
- Security dashboard UI
- Real-time alerts
- Verification workflow
- Comprehensive reporting

---

## 🧪 Testing Strategy

### Unit Tests
- Hash generation accuracy
- Signature verification logic
- Anomaly detection rules
- Scoring algorithm

### Integration Tests
- Database operations
- Blockchain integration
- API endpoint functionality
- End-to-end workflows

### Security Tests
- Penetration testing
- Vulnerability scanning
- Load testing
- Stress testing

### User Acceptance Tests
- Officer workflow validation
- Dashboard usability
- Performance benchmarks
- Real document samples

---

## 📚 Documentation

- [Security API Reference](./SECURITY_API_DOCUMENTATION.md)
- [Officer User Guide](./OFFICER_GUIDE.md)
- [Integration Guide](./SECURITY_INTEGRATION_GUIDE.md)
- [Troubleshooting](./SECURITY_TROUBLESHOOTING.md)

---

**Built for ZRA Hackathon 2025 - Document Security & Integrity**
