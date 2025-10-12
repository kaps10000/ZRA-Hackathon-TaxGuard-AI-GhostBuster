# 🚀 ZRA TaxGuard - Complete Frontend API Reference

**All APIs for Frontend Integration - One Stop Reference**

---

## 📋 Overview

This document contains **ALL APIs** needed for frontend development across the entire ZRA TaxGuard system. Use this as your single source of truth for API integration.

### **🌐 System Architecture:**
```
Frontend → OCR Backend (3000) → AI Service (8000) → Blockchain (3001)
```

### **🔧 Base URLs:**
- **OCR Backend:** `http://localhost:3000`
- **AI Service:** `http://localhost:8000` 
- **Blockchain:** `http://localhost:3001`

---

## 🔐 Authentication (OCR Backend)

### **Login**
```javascript
POST http://localhost:3000/api/auth/login
Content-Type: application/json

{
  "username": "zra_admin",
  "password": "password"
}

// Response
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIs...",
    "user": {
      "username": "zra_admin",
      "role": "admin"
    }
  }
}
```

### **Use Token in Headers:**
```javascript
headers: {
  'Authorization': 'Bearer ' + token,
  'Content-Type': 'application/json'
}
```

---

## 📄 Document Management (OCR Backend)

### **Upload Document**
```javascript
POST http://localhost:3000/api/upload
Authorization: Bearer <token>
Content-Type: multipart/form-data

// FormData
const formData = new FormData();
formData.append('file', fileInput.files[0]);
formData.append('metadata', JSON.stringify({
  "importerName": "ABC Corp",
  "importerTpin": "1234567890"
}));

// Response
{
  "success": true,
  "data": {
    "documentId": "DOC-20251007-001",
    "filename": "invoice.pdf",
    "status": "PENDING"
  }
}
```

### **Get All Documents**
```javascript
GET http://localhost:3000/api/results
Authorization: Bearer <token>

// Response
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
        "blockchainTxId": "tx-abc123"
      }
    ]
  }
}
```

### **Get Specific Document**
```javascript
GET http://localhost:3000/api/results/{documentId}
Authorization: Bearer <token>

// Response
{
  "success": true,
  "data": {
    "document": {
      "documentId": "DOC-20251007-001",
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
      "blockchainTxId": "tx-abc123"
    }
  }
}
```

---

## ✅ Verification (OCR Backend)

### **Verify Document**
```javascript
POST http://localhost:3000/api/verify/document
Authorization: Bearer <token>
Content-Type: application/json

{
  "documentId": "DOC-20251007-001",
  "extractedData": {
    "importerName": "ABC Corporation",
    "importerTpin": "1234567890",
    "invoiceAmount": 50000
  }
}

// Response
{
  "success": true,
  "data": {
    "verificationResult": {
      "companyVerification": {
        "tpinValid": true,
        "companyExists": true,
        "status": "ACTIVE"
      }
    },
    "riskScore": 25.5,
    "verificationStatus": "VALID"
  }
}
```

### **Verify Company**
```javascript
POST http://localhost:3000/api/verify/company
Authorization: Bearer <token>
Content-Type: application/json

{
  "tpin": "1234567890",
  "companyName": "ABC Corporation"
}

// Response
{
  "success": true,
  "data": {
    "company": {
      "tpin": "1234567890",
      "name": "ABC Corporation",
      "status": "ACTIVE"
    },
    "verification": {
      "tpinValid": true,
      "nameMatch": true
    },
    "riskScore": 15.0
  }
}
```

---

## 🤖 AI Processing (AI Service)

### **OCR Text Extraction**
```javascript
POST http://localhost:8000/api/ocr/extract
Content-Type: multipart/form-data

// FormData
const formData = new FormData();
formData.append('image', fileInput.files[0]);

// Response
{
  "success": true,
  "data": {
    "extractedText": "INVOICE\nCompany: ABC Corp\nAmount: $50,000",
    "confidence": 0.95,
    "processingTime": 1200
  }
}
```

### **AI Field Extraction**
```javascript
POST http://localhost:8000/api/ai/extract-fields
Content-Type: application/json

{
  "text": "INVOICE\nCompany: ABC Corp\nTPIN: 1234567890\nAmount: $50,000"
}

// Response
{
  "success": true,
  "data": {
    "extractedFields": {
      "importerName": "ABC Corp",
      "importerTpin": "1234567890",
      "invoiceAmount": 50000,
      "currency": "USD"
    },
    "confidence": 0.92
  }
}
```

### **Risk Assessment**
```javascript
POST http://localhost:8000/api/ai/assess-risk
Content-Type: application/json

{
  "documentData": {
    "importerName": "ABC Corp",
    "importerTpin": "1234567890",
    "invoiceAmount": 50000
  }
}

// Response
{
  "success": true,
  "data": {
    "riskScore": 25.5,
    "riskLevel": "LOW",
    "riskFactors": [
      "Company verified",
      "Amount within normal range"
    ],
    "recommendations": ["Approve for processing"]
  }
}
```

---

## 🔗 Blockchain Integration (Blockchain API)

### **Get Blockchain Health**
```javascript
GET http://localhost:3001/health

// Response
{
  "status": "healthy",
  "blockchain": {
    "network": "operational",
    "peers": 3,
    "consensus": "active"
  }
}
```

### **Get All Events**
```javascript
GET http://localhost:3001/api/events

// Response
{
  "success": true,
  "events": [
    {
      "eventId": "evt-filing-001",
      "eventType": "filing",
      "timestamp": "2025-10-07T02:00:00Z",
      "transactionHash": "tx-abc123",
      "notes": "VAT filing for Q3 2025"
    }
  ]
}
```

### **Create Tax Event**
```javascript
POST http://localhost:3001/api/events
Content-Type: application/json

{
  "eventType": "filing",
  "anonymizedUserId": "user-123",
  "hashOfPayload": "abc123def456",
  "notes": "Document verification completed"
}

// Response
{
  "success": true,
  "eventId": "evt-filing-002",
  "transactionHash": "tx-def456",
  "blockIndex": 7
}
```

### **Submit Phantom Detection**
```javascript
POST http://localhost:3001/api/ghostbuster/detection
Content-Type: application/json

{
  "detectionType": "phantom_employee",
  "entityId": "EMP-12345",
  "confidenceScore": 92,
  "severity": "CRITICAL",
  "indicators": ["No payroll records", "Ghost bank account"]
}

// Response
{
  "success": true,
  "detectionId": "det-phantom-001",
  "transactionHash": "tx-ghi789",
  "status": "recorded"
}
```

---

## 📊 System Health Checks

### **OCR Backend Health**
```javascript
GET http://localhost:3000/healthcheck

// Response
{
  "success": true,
  "message": "ZRA OCR Backend is running",
  "timestamp": "2025-10-07T02:00:00Z",
  "version": "1.0.0"
}
```

### **AI Service Health**
```javascript
GET http://localhost:8000/health

// Response
{
  "status": "healthy",
  "services": {
    "ocr": "ready",
    "ai": "ready",
    "risk_assessment": "ready"
  }
}
```

### **Blockchain Health**
```javascript
GET http://localhost:3001/health

// Response
{
  "status": "healthy",
  "blockchain": {
    "network": "operational",
    "consensus": "active"
  }
}
```

---

## 🎯 Frontend Integration Examples

### **Complete Document Processing Flow**
```javascript
// 1. Login
const loginResponse = await fetch('http://localhost:3000/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    username: 'zra_admin',
    password: 'password'
  })
});
const { data: { token } } = await loginResponse.json();

// 2. Upload Document
const formData = new FormData();
formData.append('file', fileInput.files[0]);
formData.append('metadata', JSON.stringify({
  importerName: 'ABC Corp',
  importerTpin: '1234567890'
}));

const uploadResponse = await fetch('http://localhost:3000/api/upload', {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${token}` },
  body: formData
});
const { data: { documentId } } = await uploadResponse.json();

// 3. Get Processing Results
const resultResponse = await fetch(`http://localhost:3000/api/results/${documentId}`, {
  headers: { 'Authorization': `Bearer ${token}` }
});
const { data: { document } } = await resultResponse.json();

// 4. Display Results
console.log('Risk Score:', document.riskScore);
console.log('Status:', document.verificationStatus);
console.log('Blockchain TX:', document.blockchainTxId);
```

### **Real-time Document Status**
```javascript
// Poll for document status updates
const checkDocumentStatus = async (documentId, token) => {
  const response = await fetch(`http://localhost:3000/api/results/${documentId}`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const { data: { document } } = await response.json();
  
  return {
    status: document.status,
    riskScore: document.riskScore,
    verificationStatus: document.verificationStatus,
    blockchainTxId: document.blockchainTxId
  };
};

// Use with polling
setInterval(async () => {
  const status = await checkDocumentStatus(documentId, token);
  updateUI(status);
}, 2000);
```

### **Error Handling**
```javascript
const apiCall = async (url, options) => {
  try {
    const response = await fetch(url, options);
    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.error || 'API call failed');
    }
    
    return data;
  } catch (error) {
    console.error('API Error:', error.message);
    // Show user-friendly error message
    showErrorMessage('Something went wrong. Please try again.');
    throw error;
  }
};
```

---

## 🎨 UI Component Examples

### **Document Upload Component**
```javascript
const DocumentUpload = () => {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState(null);

  const handleUpload = async () => {
    setUploading(true);
    
    const formData = new FormData();
    formData.append('file', file);
    formData.append('metadata', JSON.stringify({
      importerName: 'ABC Corp',
      importerTpin: '1234567890'
    }));

    try {
      const response = await fetch('http://localhost:3000/api/upload', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });
      
      const data = await response.json();
      setResult(data.data);
    } catch (error) {
      console.error('Upload failed:', error);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div>
      <input type="file" onChange={(e) => setFile(e.target.files[0])} />
      <button onClick={handleUpload} disabled={!file || uploading}>
        {uploading ? 'Uploading...' : 'Upload Document'}
      </button>
      {result && (
        <div>
          <p>Document ID: {result.documentId}</p>
          <p>Status: {result.status}</p>
        </div>
      )}
    </div>
  );
};
```

### **Document Status Dashboard**
```javascript
const DocumentDashboard = () => {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDocuments = async () => {
      try {
        const response = await fetch('http://localhost:3000/api/results', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();
        setDocuments(data.data.documents);
      } catch (error) {
        console.error('Failed to fetch documents:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDocuments();
  }, []);

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      <h2>Document Dashboard</h2>
      {documents.map(doc => (
        <div key={doc.documentId} className="document-card">
          <h3>{doc.filename}</h3>
          <p>Status: <span className={`status-${doc.status.toLowerCase()}`}>
            {doc.status}
          </span></p>
          <p>Risk Score: {doc.riskScore}</p>
          <p>Verification: {doc.verificationStatus}</p>
          {doc.blockchainTxId && (
            <p>Blockchain: {doc.blockchainTxId}</p>
          )}
        </div>
      ))}
    </div>
  );
};
```

---

## 🚨 Error Codes & Handling

### **Common HTTP Status Codes:**
- **200** - Success
- **201** - Created
- **400** - Bad Request (validation error)
- **401** - Unauthorized (invalid/missing token)
- **403** - Forbidden (insufficient permissions)
- **404** - Not Found
- **429** - Too Many Requests (rate limited)
- **500** - Internal Server Error

### **Error Response Format:**
```javascript
{
  "success": false,
  "error": "Error message description",
  "details": {
    "field": "fieldName",
    "message": "Specific validation error"
  }
}
```

### **Frontend Error Handling:**
```javascript
const handleApiError = (error, response) => {
  switch (response.status) {
    case 401:
      // Redirect to login
      window.location.href = '/login';
      break;
    case 429:
      showMessage('Too many requests. Please wait and try again.');
      break;
    case 500:
      showMessage('Server error. Please try again later.');
      break;
    default:
      showMessage(error.message || 'Something went wrong.');
  }
};
```

---

## 📱 Mobile-Friendly Considerations

### **File Upload for Mobile:**
```javascript
// Accept multiple file types
<input 
  type="file" 
  accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
  capture="environment" // Use camera on mobile
  onChange={handleFileSelect}
/>
```

### **Responsive API Calls:**
```javascript
// Add timeout for mobile networks
const fetchWithTimeout = (url, options, timeout = 10000) => {
  return Promise.race([
    fetch(url, options),
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Request timeout')), timeout)
    )
  ]);
};
```

---

## 🔧 Development Tips

### **Environment Configuration:**
```javascript
const API_CONFIG = {
  OCR_BACKEND: process.env.REACT_APP_OCR_API || 'http://localhost:3000',
  AI_SERVICE: process.env.REACT_APP_AI_API || 'http://localhost:8000',
  BLOCKCHAIN: process.env.REACT_APP_BLOCKCHAIN_API || 'http://localhost:3001'
};
```

### **Token Management:**
```javascript
// Store token securely
const TokenManager = {
  set: (token) => localStorage.setItem('zra_token', token),
  get: () => localStorage.getItem('zra_token'),
  clear: () => localStorage.removeItem('zra_token'),
  isValid: (token) => {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.exp > Date.now() / 1000;
    } catch {
      return false;
    }
  }
};
```

### **API Client Setup:**
```javascript
class ZRAApiClient {
  constructor(baseURL, token) {
    this.baseURL = baseURL;
    this.token = token;
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const config = {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(this.token && { 'Authorization': `Bearer ${this.token}` }),
        ...options.headers
      }
    };

    const response = await fetch(url, config);
    const data = await response.json();

    if (!data.success) {
      throw new Error(data.error);
    }

    return data;
  }

  // Convenience methods
  get(endpoint) { return this.request(endpoint); }
  post(endpoint, body) { return this.request(endpoint, { method: 'POST', body: JSON.stringify(body) }); }
  put(endpoint, body) { return this.request(endpoint, { method: 'PUT', body: JSON.stringify(body) }); }
  delete(endpoint) { return this.request(endpoint, { method: 'DELETE' }); }
}

// Usage
const ocrApi = new ZRAApiClient('http://localhost:3000', token);
const documents = await ocrApi.get('/api/results');
```

---

## 🎯 Quick Reference

### **Essential Endpoints for Frontend:**
1. **Login:** `POST /api/auth/login`
2. **Upload:** `POST /api/upload`
3. **Get Documents:** `GET /api/results`
4. **Document Details:** `GET /api/results/{id}`
5. **Verify Document:** `POST /api/verify/document`
6. **Health Checks:** `GET /healthcheck`

### **Data Flow:**
```
User Upload → OCR Processing → AI Analysis → Verification → Blockchain Storage → Results Display
```

### **Status Values:**
- **PENDING** - Processing in progress
- **PROCESSED** - OCR completed
- **VERIFIED** - Verification completed
- **FLAGGED** - Requires attention
- **COMPLETED** - Fully processed

**This is your complete API reference for frontend development. All endpoints, examples, and integration patterns are included!** 🚀
