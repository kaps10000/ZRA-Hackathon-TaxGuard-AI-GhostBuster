# WhistlePro Backend API Documentation

**Base URL:** `http://localhost:3000/api`

**Version:** 1.0.0

**Authentication:** ⚠️ Temporarily **DISABLED** for frontend development

---

## Table of Contents
1. [Security Features](#security-features)
2. [Public Endpoints](#public-endpoints)
3. [Report Endpoints](#report-endpoints)
4. [Error Responses](#error-responses)
5. [Sample Requests](#sample-requests)

---

## Security Features

### ✅ Already Implemented

1. **AES-256-GCM Encryption**
   - All report payloads are encrypted before storage
   - Automatic encryption/decryption handled by backend
   - Frontend sends **plain JSON**, backend handles encryption

2. **Metadata Scrubbing**
   - IP addresses are hashed (SHA-256)
   - User agents are hashed
   - Identifying headers removed for anonymous reports
   - Applied automatically via middleware

3. **Input Sanitization**
   - XSS prevention (removes `<script>` tags, `javascript:`, event handlers)
   - SQL injection detection
   - Path traversal protection
   - Applied automatically to all requests

4. **Rate Limiting**
   - **Anonymous Reports**: 5 submissions per IP per 15 minutes
   - **Other Endpoints**: 60 requests per minute
   - Automatic 429 response when limit exceeded

5. **Request Validation**
   - JOI schema validation on report submissions
   - Case ID format validation (ZRA-YYYY-XXXXXX)
   - Status/priority enum validation

---

## Public Endpoints

### Health Check

**Endpoint:** `GET /health`

**Description:** Check if server is running

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2025-10-11T03:00:00.000Z"
}
```

---

## Report Endpoints

### 1. Submit Anonymous Report

**Endpoint:** `POST /api/reports`

**Rate Limit:** 5 requests per IP per 15 minutes

**Request Body:**
```json
{
  "category": "tax_evasion",
  "title": "Suspected tax evasion by XYZ Company",
  "description": "I have evidence that XYZ Company has been underreporting their income for the past 2 years. They claim revenue of 100k ZMW but actual revenue is closer to 1M ZMW based on their customer traffic.",
  "priority": "high",
  "subjects": {
    "organizations": [
      {
        "name": "XYZ Trading Limited",
        "tpin": "1234567890",
        "address": "Plot 123, Independence Avenue, Lusaka"
      }
    ]
  },
  "location": {
    "province": "Lusaka",
    "district": "Lusaka",
    "area": "City Centre"
  },
  "evidence": {
    "financial_details": {
      "estimated_amount": 900000,
      "currency": "ZMW",
      "frequency": "yearly"
    }
  },
  "reporter_info": {
    "anonymous": true,
    "contact_preference": "none"
  }
}
```

**Required Fields:**
- `category` (enum): `tax_evasion`, `fraud`, `corruption`, `phantom_employees`, `ghost_companies`, `money_laundering`, `bribery`, `other`
- `title` (string): 10-200 characters
- `description` (string): 50-5000 characters

**Optional Fields:**
- `priority` (enum): `low`, `medium`, `high`, `critical` (default: `medium`)
- `subjects`, `location`, `evidence`, `reporter_info`

**Success Response (201):**
```json
{
  "success": true,
  "message": "Report submitted successfully. Please save your case ID for future reference.",
  "data": {
    "case_id": "ZRA-2025-A1B2C3",
    "category": "tax_evasion",
    "status": "pending",
    "priority": "high",
    "created_at": "2025-10-11T03:00:00.000Z",
    "blockchain_hash": "sha256_hash_here"
  }
}
```

**Error Response (400):**
```json
{
  "success": false,
  "error": {
    "message": "Invalid report data",
    "details": [
      {
        "field": "title",
        "message": "\"title\" length must be at least 10 characters long"
      }
    ]
  }
}
```

**Rate Limit Response (429):**
```json
{
  "error": "Too many reports submitted from this IP, please try again later.",
  "retryAfter": 900
}
```

---

### 2. Get Report by Case ID

**Endpoint:** `GET /api/reports/:caseId`

**Authentication:** ⚠️ **Disabled** for frontend dev (will be required in production)

**Example:** `GET /api/reports/ZRA-2025-A1B2C3`

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "case_id": "ZRA-2025-A1B2C3",
    "category": "tax_evasion",
    "status": "pending",
    "priority": "high",
    "created_at": "2025-10-11T03:00:00.000Z",
    "updated_at": "2025-10-11T03:00:00.000Z",
    "metadata_hash": "sha256_hash",
    "payload": {
      "title": "Suspected tax evasion by XYZ Company",
      "description": "Full description here...",
      "subjects": { ... },
      "location": { ... },
      "evidence": { ... }
    }
  }
}
```

**Error Response (404):**
```json
{
  "success": false,
  "error": {
    "message": "Report not found",
    "code": "REPORT_NOT_FOUND"
  }
}
```

**Error Response (400):**
```json
{
  "success": false,
  "error": {
    "message": "Invalid case ID format. Expected format: ZRA-YYYY-XXXXXX",
    "code": "INVALID_CASE_ID"
  }
}
```

---

### 3. List Reports (with Pagination & Filtering)

**Endpoint:** `GET /api/reports`

**Authentication:** ⚠️ **Disabled** for frontend dev

**Query Parameters:**
- `page` (number): Page number (default: 1)
- `limit` (number): Items per page (default: 20, max: 100)
- `status` (enum): `pending`, `under_review`, `investigating`, `closed`
- `category` (enum): `tax_evasion`, `fraud`, `corruption`, etc.
- `priority` (enum): `low`, `medium`, `high`, `critical`

**Example:** `GET /api/reports?page=1&limit=10&status=pending&category=tax_evasion`

**Success Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "case_id": "ZRA-2025-A1B2C3",
      "category": "tax_evasion",
      "status": "pending",
      "priority": "high",
      "created_at": "2025-10-11T03:00:00.000Z",
      "updated_at": "2025-10-11T03:00:00.000Z"
    },
    {
      "id": 2,
      "case_id": "ZRA-2025-D4E5F6",
      "category": "fraud",
      "status": "under_review",
      "priority": "medium",
      "created_at": "2025-10-10T15:30:00.000Z",
      "updated_at": "2025-10-11T02:00:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 25,
    "pages": 3
  },
  "filters": {
    "status": "pending",
    "category": "tax_evasion",
    "priority": "all"
  }
}
```

---

### 4. Update Report Status

**Endpoint:** `PATCH /api/reports/:caseId/status`

**Authentication:** ⚠️ **Disabled** for frontend dev

**Example:** `PATCH /api/reports/ZRA-2025-A1B2C3/status`

**Request Body:**
```json
{
  "status": "under_review",
  "notes": "Case assigned to Investigator John Mwamba. Initial review in progress."
}
```

**Valid Statuses:**
- `pending`
- `under_review`
- `investigating`
- `closed`

**Success Response (200):**
```json
{
  "success": true,
  "message": "Report status updated successfully",
  "data": {
    "id": 1,
    "case_id": "ZRA-2025-A1B2C3",
    "status": "under_review",
    "updated_at": "2025-10-11T03:05:00.000Z"
  }
}
```

**Error Response (400):**
```json
{
  "success": false,
  "error": {
    "message": "Invalid status. Must be one of: pending, under_review, investigating, closed",
    "code": "INVALID_STATUS"
  }
}
```

---

### 5. Get Report Statistics

**Endpoint:** `GET /api/reports/stats`

**Authentication:** ⚠️ **Disabled** for frontend dev

**Query Parameters (optional):**
- `startDate` (ISO date)
- `endDate` (ISO date)
- `category` (string)
- `status` (string)

**Example:** `GET /api/reports/stats?startDate=2025-01-01&endDate=2025-10-11`

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "total_reports": 156,
    "pending_reports": 23,
    "under_review": 45,
    "investigating": 67,
    "closed": 21,
    "by_category": {
      "tax_evasion": 45,
      "fraud": 34,
      "corruption": 28,
      "phantom_employees": 23,
      "ghost_companies": 12,
      "other": 14
    },
    "by_priority": {
      "low": 34,
      "medium": 89,
      "high": 28,
      "critical": 5
    },
    "monthly_trend": [
      { "month": "Jan", "reports": 12 },
      { "month": "Feb", "reports": 18 },
      { "month": "Mar", "reports": 23 }
    ]
  },
  "filters": {
    "start_date": "2025-01-01",
    "end_date": "2025-10-11",
    "category": null,
    "status": null
  }
}
```

---

## Error Responses

### Common Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `INVALID_CASE_ID` | 400 | Case ID format is invalid |
| `INVALID_STATUS` | 400 | Status value not in allowed list |
| `REPORT_NOT_FOUND` | 404 | Report with given case ID doesn't exist |
| `SECURITY_VIOLATION` | 400 | Suspicious input detected |
| `RATE_LIMIT_EXCEEDED` | 429 | Too many requests |

### Standard Error Format

```json
{
  "success": false,
  "error": {
    "message": "Error description",
    "code": "ERROR_CODE",
    "details": []
  }
}
```

---

## Sample Requests

### Using cURL

#### Submit Report
```bash
curl -X POST http://localhost:3000/api/reports \
  -H "Content-Type: application/json" \
  -d '{
    "category": "tax_evasion",
    "title": "Test Report - Tax Evasion",
    "description": "This is a test report describing suspected tax evasion activities. The company has been operating without proper tax compliance for over 2 years.",
    "priority": "medium",
    "subjects": {
      "organizations": [{
        "name": "Test Company Ltd",
        "tpin": "1234567890"
      }]
    }
  }'
```

#### Get Report by Case ID
```bash
curl -X GET http://localhost:3000/api/reports/ZRA-2025-A1B2C3
```

#### List Reports
```bash
curl -X GET "http://localhost:3000/api/reports?page=1&limit=10&status=pending"
```

#### Update Report Status
```bash
curl -X PATCH http://localhost:3000/api/reports/ZRA-2025-A1B2C3/status \
  -H "Content-Type: application/json" \
  -d '{
    "status": "under_review",
    "notes": "Starting investigation"
  }'
```

---

### Using Fetch (JavaScript)

#### Submit Report
```javascript
const response = await fetch('http://localhost:3000/api/reports', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    category: 'tax_evasion',
    title: 'Test Report - Tax Evasion',
    description: 'This is a test report describing suspected tax evasion activities. The company has been operating without proper tax compliance for over 2 years.',
    priority: 'medium',
    subjects: {
      organizations: [{
        name: 'Test Company Ltd',
        tpin: '1234567890'
      }]
    }
  })
});

const data = await response.json();
console.log('Report submitted:', data.data.case_id);
```

#### Get Report
```javascript
const caseId = 'ZRA-2025-A1B2C3';
const response = await fetch(`http://localhost:3000/api/reports/${caseId}`);
const data = await response.json();

if (data.success) {
  console.log('Report:', data.data);
} else {
  console.error('Error:', data.error.message);
}
```

#### List Reports with Filters
```javascript
const params = new URLSearchParams({
  page: 1,
  limit: 10,
  status: 'pending',
  category: 'tax_evasion'
});

const response = await fetch(`http://localhost:3000/api/reports?${params}`);
const data = await response.json();

console.log(`Found ${data.pagination.total} reports`);
console.log('Reports:', data.data);
```

---

### Using Axios (JavaScript)

```javascript
import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:3000/api'
});

// Submit report
async function submitReport() {
  try {
    const { data } = await api.post('/reports', {
      category: 'fraud',
      title: 'Fraudulent Invoice Detected',
      description: 'Company submitted fake invoices to claim false VAT refunds. Estimated fraud amount is 500,000 ZMW.',
      priority: 'high',
      evidence: {
        financial_details: {
          estimated_amount: 500000,
          currency: 'ZMW'
        }
      }
    });

    console.log('Case ID:', data.data.case_id);
    return data.data.case_id;
  } catch (error) {
    if (error.response?.status === 429) {
      console.error('Rate limit exceeded. Try again later.');
    } else {
      console.error('Error:', error.response?.data?.error?.message);
    }
  }
}

// Get report details
async function getReport(caseId) {
  try {
    const { data } = await api.get(`/reports/${caseId}`);
    return data.data;
  } catch (error) {
    console.error('Error fetching report:', error.response?.data?.error);
  }
}

// Update status
async function updateStatus(caseId, status, notes) {
  try {
    const { data } = await api.patch(`/reports/${caseId}/status`, {
      status,
      notes
    });
    console.log('Status updated:', data.data);
  } catch (error) {
    console.error('Error:', error.response?.data?.error);
  }
}
```

---

## Frontend Integration Tips

### 1. **CORS is Already Configured**
- Default allowed origin: `http://localhost:3001`
- If your frontend runs on a different port, update `.env`:
  ```
  CORS_ORIGIN=http://localhost:YOUR_PORT
  ```

### 2. **Error Handling**
All endpoints return consistent error format:
```javascript
if (!response.data.success) {
  const error = response.data.error;
  console.error(`Error [${error.code}]: ${error.message}`);

  // Show validation errors
  if (error.details) {
    error.details.forEach(detail => {
      console.error(`Field "${detail.field}": ${detail.message}`);
    });
  }
}
```

### 3. **Rate Limiting**
Handle 429 responses gracefully:
```javascript
if (error.response?.status === 429) {
  const retryAfter = error.response.data.retryAfter || 900; // seconds
  alert(`Too many requests. Please wait ${Math.ceil(retryAfter / 60)} minutes.`);
}
```

### 4. **Encryption is Automatic**
- ✅ Send **plain JSON** in your requests
- ✅ Receive **plain JSON** in responses
- ✅ Backend handles all encryption/decryption
- ✅ No frontend crypto libraries needed!

### 5. **Case ID Format**
Always validate case IDs client-side before making requests:
```javascript
const isValidCaseId = (caseId) => {
  return /^ZRA-\d{4}-[A-F0-9]{6}$/.test(caseId);
};
```

---

## Testing Checklist

- [ ] Submit report with valid data
- [ ] Submit report with invalid data (test validation)
- [ ] Submit 6 reports rapidly (test rate limiting)
- [ ] Retrieve report by case ID
- [ ] List reports with pagination
- [ ] Filter reports by status
- [ ] Filter reports by category
- [ ] Update report status
- [ ] Get statistics
- [ ] Test error responses

---

## Production Deployment Notes

⚠️ **Before deploying to production:**

1. **Re-enable authentication** in `src/routes/reportRoutes.js`:
   - Uncomment all `authenticate` middleware calls
   - Uncomment `authorize` calls for admin endpoints

2. **Update CORS origin** in `.env`:
   - Change from `http://localhost:3001` to production frontend URL

3. **Update environment variables**:
   - Generate strong `JWT_SECRET` (32+ characters)
   - Generate strong `ENCRYPTION_KEY` (32 characters)
   - Update database credentials
   - Set `NODE_ENV=production`

4. **Enable HTTPS**:
   - All endpoints should use HTTPS in production
   - Update `API_BASE_URL` in `.env`

---

**Documentation Version:** 1.0.0
**Last Updated:** October 11, 2025
**Maintained by:** Kelvin - WhistlePro Backend Team
