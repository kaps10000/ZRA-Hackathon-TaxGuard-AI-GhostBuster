# WhistlePro API Documentation

## Overview

The WhistlePro API provides endpoints for anonymous whistleblower reporting and case management. This document covers frontend integration for consuming report data in real-time.

## Base Configuration

### API Base URL
```javascript
const WHISTLEPRO_API = 'http://localhost:4000/api';
```

### CORS Configuration
The API supports CORS for the following origins:
- `http://localhost:3000` (Dashboard Frontend)
- `http://localhost:3001` (Blockchain Service)
- `http://localhost:4001` (API Gateway)

---

## Reports Endpoints

### 1. Get All Reports

Retrieve a paginated list of all whistleblower reports.

**Endpoint:** `GET /api/reports`

**Query Parameters:**
| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `page` | integer | No | 1 | Page number for pagination |
| `limit` | integer | No | 20 | Number of results per page (max 100) |
| `status` | string | No | - | Filter by status: `pending`, `under_review`, `investigating`, `closed` |
| `category` | string | No | - | Filter by category (see categories below) |
| `priority` | string | No | - | Filter by priority: `low`, `medium`, `high`, `critical` |

**Example Request:**
```javascript
import axios from 'axios';

// Basic request
const response = await axios.get('http://localhost:4000/api/reports');

// With filters
const response = await axios.get('http://localhost:4000/api/reports', {
  params: {
    page: 1,
    limit: 20,
    status: 'pending',
    category: 'tax_evasion',
    priority: 'high'
  }
});
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "case_id": "ZRA-2025-22653C",
      "category": "tax_evasion",
      "status": "pending",
      "priority": "high",
      "created_at": "2025-10-29T14:08:47.930Z",
      "updated_at": "2025-10-29T14:08:47.930Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 5,
    "pages": 1
  },
  "filters": {
    "status": "pending",
    "category": "tax_evasion",
    "priority": "high"
  }
}
```

---

### 2. Get Report by Case ID

Retrieve detailed information about a specific report using its case ID.

**Endpoint:** `GET /api/reports/:caseId`

**URL Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `caseId` | string | Yes | Unique case ID (format: `ZRA-YYYY-XXXXXX`) |

**Example Request:**
```javascript
const caseId = 'ZRA-2025-22653C';
const response = await axios.get(`http://localhost:4000/api/reports/${caseId}`);
```

**Response (without investigator authentication):**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "case_id": "ZRA-2025-22653C",
    "category": "tax_evasion",
    "status": "pending",
    "priority": "high",
    "created_at": "2025-10-29T14:08:47.930Z",
    "updated_at": "2025-10-29T14:08:47.930Z",
    "metadata_hash": "93c35ba5bc53d071766b2b599e1a3e54815ccf70e9fe8c03e29ff72d1b1a923f",
    "payload": null
  }
}
```

**Note:** The `payload` field contains encrypted report details and is only decrypted for authenticated investigators.

---

### 3. Create New Report

Submit a new anonymous whistleblower report.

**Endpoint:** `POST /api/reports`

**Request Headers:**
```
Content-Type: application/json
```

**Request Body:**
```json
{
  "category": "tax_evasion",
  "title": "Construction Company Underreporting Revenue",
  "description": "Detailed description of the incident (minimum 50 characters)",
  "priority": "high",
  "evidence": {
    "financial_details": {
      "estimated_amount": 2500000,
      "currency": "ZMW",
      "frequency": "yearly"
    },
    "documents": ["file1.pdf", "file2.pdf"],
    "photos": ["photo1.jpg"],
    "witnesses": [
      {
        "name": "Optional witness name",
        "contact": "Optional contact info",
        "description": "Witness statement"
      }
    ]
  },
  "subjects": {
    "individuals": [
      {
        "name": "Person Name",
        "position": "Position",
        "organization": "Organization",
        "tpin": "1234567890",
        "nrc": "123456/78/9"
      }
    ],
    "organizations": [
      {
        "name": "Company Name",
        "tpin": "1002345678",
        "pacra_number": "CR-2018-12345",
        "address": "Company address"
      }
    ]
  },
  "location": {
    "province": "Lusaka",
    "district": "Lusaka",
    "area": "Industrial Area",
    "specific_address": "Plot 123",
    "coordinates": {
      "latitude": -15.4167,
      "longitude": 28.2833
    }
  },
  "timeline": {
    "incident_date": "2024-08-15",
    "discovery_date": "2024-10-01",
    "ongoing": true
  },
  "reporter_info": {
    "anonymous": true,
    "contact_preference": "none",
    "contact_details": ""
  }
}
```

**Example Request:**
```javascript
const reportData = {
  category: 'tax_evasion',
  title: 'Construction Company Underreporting Revenue',
  description: 'ABC Construction Ltd has been operating for 5 years but consistently reports minimal profits despite handling multiple government contracts worth millions.',
  priority: 'high',
  evidence: {
    financial_details: {
      estimated_amount: 2500000,
      currency: 'ZMW',
      frequency: 'yearly'
    }
  },
  subjects: {
    organizations: [{
      name: 'ABC Construction Ltd',
      tpin: '1002345678'
    }]
  },
  location: {
    province: 'Lusaka',
    district: 'Lusaka'
  },
  timeline: {
    ongoing: true
  }
};

const response = await axios.post('http://localhost:4000/api/reports', reportData);
```

**Response:**
```json
{
  "success": true,
  "message": "Report submitted successfully. Please save your case ID for future reference.",
  "data": {
    "case_id": "ZRA-2025-22653C",
    "category": "tax_evasion",
    "status": "pending",
    "priority": "high",
    "created_at": "2025-10-29T14:08:47.930Z",
    "blockchain_hash": "93c35ba5bc53d071766b2b599e1a3e54815ccf70e9fe8c03e29ff72d1b1a923f"
  }
}
```

---

### 4. Update Report Status

Update the status of a report (intended for investigators).

**Endpoint:** `PATCH /api/reports/:caseId/status`

**Request Body:**
```json
{
  "status": "under_review",
  "notes": "Investigation started"
}
```

**Example Request:**
```javascript
const caseId = 'ZRA-2025-22653C';
const response = await axios.patch(
  `http://localhost:4000/api/reports/${caseId}/status`,
  {
    status: 'under_review',
    notes: 'Investigation team assigned'
  }
);
```

**Response:**
```json
{
  "success": true,
  "message": "Report status updated successfully",
  "data": {
    "id": 1,
    "case_id": "ZRA-2025-22653C",
    "status": "under_review",
    "updated_at": "2025-10-29T15:30:00.000Z"
  }
}
```

---

### 5. Get Report Statistics

Retrieve statistical overview of reports (for dashboard visualizations).

**Endpoint:** `GET /api/reports/stats`

**Query Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `startDate` | string | No | Start date for filtering (ISO 8601) |
| `endDate` | string | No | End date for filtering (ISO 8601) |
| `category` | string | No | Filter by category |
| `status` | string | No | Filter by status |

**Example Request:**
```javascript
const response = await axios.get('http://localhost:4000/api/reports/stats', {
  params: {
    startDate: '2025-01-01',
    endDate: '2025-12-31'
  }
});
```

**Response:**
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
      { "month": "Feb", "reports": 18 }
    ]
  }
}
```

---

## Data Types and Enums

### Report Categories
```javascript
const CATEGORIES = [
  'tax_evasion',
  'fraud',
  'corruption',
  'phantom_employees',
  'ghost_companies',
  'money_laundering',
  'bribery',
  'other'
];
```

### Report Status
```javascript
const STATUS = [
  'pending',       // Initial state
  'under_review',  // Being reviewed
  'investigating', // Active investigation
  'closed'         // Case closed
];
```

### Priority Levels
```javascript
const PRIORITY = [
  'low',
  'medium',
  'high',
  'critical'
];
```

### Frequency Options
```javascript
const FREQUENCY = [
  'one-time',
  'weekly',
  'monthly',
  'yearly',
  'ongoing'
];
```

---

## Error Handling

### Error Response Format
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

### Common Error Codes

| Status Code | Error Code | Description |
|-------------|------------|-------------|
| 400 | `INVALID_CASE_ID` | Case ID format is invalid |
| 400 | `SECURITY_VIOLATION` | Request contains potentially harmful content |
| 404 | `REPORT_NOT_FOUND` | Report with specified case ID doesn't exist |
| 429 | `RATE_LIMIT_EXCEEDED` | Too many requests from same IP |
| 500 | `SERVER_ERROR` | Internal server error |

### Error Handling Example
```javascript
try {
  const response = await axios.get('http://localhost:4000/api/reports');
  console.log(response.data);
} catch (error) {
  if (error.response) {
    // Server responded with error
    console.error('Error:', error.response.data.error.message);
    console.error('Code:', error.response.data.error.code);
  } else if (error.request) {
    // No response received
    console.error('No response from server');
  } else {
    // Request setup error
    console.error('Error:', error.message);
  }
}
```

---

## React Integration Example

### Setup API Service

Create `src/services/whistleProService.js`:

```javascript
import axios from 'axios';

const API_BASE_URL = 'http://localhost:4000/api';

const whistleProService = {
  // Get all reports
  getAllReports: async (filters = {}) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/reports`, {
        params: filters
      });
      return response.data;
    } catch (error) {
      console.error('Failed to fetch reports:', error);
      throw error;
    }
  },

  // Get single report
  getReport: async (caseId) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/reports/${caseId}`);
      return response.data;
    } catch (error) {
      console.error(`Failed to fetch report ${caseId}:`, error);
      throw error;
    }
  },

  // Submit new report
  submitReport: async (reportData) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/reports`, reportData);
      return response.data;
    } catch (error) {
      console.error('Failed to submit report:', error);
      throw error;
    }
  },

  // Update report status
  updateStatus: async (caseId, status, notes) => {
    try {
      const response = await axios.patch(
        `${API_BASE_URL}/reports/${caseId}/status`,
        { status, notes }
      );
      return response.data;
    } catch (error) {
      console.error(`Failed to update report ${caseId}:`, error);
      throw error;
    }
  },

  // Get statistics
  getStatistics: async (filters = {}) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/reports/stats`, {
        params: filters
      });
      return response.data;
    } catch (error) {
      console.error('Failed to fetch statistics:', error);
      throw error;
    }
  }
};

export default whistleProService;
```

### Use in React Component

```javascript
import React, { useState, useEffect } from 'react';
import whistleProService from '../services/whistleProService';

const ReportsPage = () => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch reports on mount
  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      setLoading(true);
      const data = await whistleProService.getAllReports({
        status: 'pending',
        limit: 20
      });
      setReports(data.data);
      setError(null);
    } catch (err) {
      setError('Failed to load reports');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Auto-refresh every 10 seconds
  useEffect(() => {
    const interval = setInterval(fetchReports, 10000);
    return () => clearInterval(interval);
  }, []);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div>
      <h1>Whistleblower Reports</h1>
      <ul>
        {reports.map(report => (
          <li key={report.case_id}>
            {report.case_id} - {report.category} ({report.priority})
          </li>
        ))}
      </ul>
    </div>
  );
};

export default ReportsPage;
```

---

## Real-Time Updates

### Polling Strategy (Current)

The dashboard currently uses polling with a 10-second interval:

```javascript
useEffect(() => {
  const fetchCases = async () => {
    const response = await axios.get('http://localhost:4000/api/reports');
    setCases(response.data.data);
  };

  fetchCases();
  const interval = setInterval(fetchCases, 10000); // Poll every 10 seconds
  return () => clearInterval(interval);
}, []);
```

### Performance Tips

1. **Debounce Filter Changes**: Avoid making API calls on every keystroke
2. **Cache Results**: Store recent results to reduce API calls
3. **Optimize Polling**: Adjust interval based on user activity
4. **Handle Errors Gracefully**: Implement retry logic with exponential backoff

---

## Security Features

### 1. Encryption
- All report payloads are encrypted using AES-256-GCM
- Decryption only available to authenticated investigators

### 2. Anonymity Protection
- IP addresses and user agents are hashed (not stored in plain text)
- No personally identifiable information required

### 3. Rate Limiting
- Maximum 5 report submissions per IP per 15 minutes
- Prevents spam and abuse

### 4. Content Validation
- Input sanitization to prevent XSS attacks
- SQL injection protection through parameterized queries
- Content filtering for malicious patterns

---

## Health Check

### Check API Status

**Endpoint:** `GET /health`

**Example:**
```javascript
const response = await axios.get('http://localhost:4000/health');
console.log(response.data);
```

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2025-10-29T14:05:19.662Z",
  "uptime": 1199.7536344,
  "environment": "development",
  "version": "1.0.0",
  "services": {
    "database": "connected",
    "encryption": "active",
    "audit_logging": "active"
  }
}
```

---

## Testing

### Test with cURL

```bash
# Get all reports
curl http://localhost:4000/api/reports

# Get specific report
curl http://localhost:4000/api/reports/ZRA-2025-22653C

# Submit new report
curl -X POST http://localhost:4000/api/reports \
  -H "Content-Type: application/json" \
  -d '{
    "category": "tax_evasion",
    "title": "Test Report",
    "description": "This is a test report with at least 50 characters in the description.",
    "priority": "medium"
  }'
```

### Test with Postman

1. Import base URL: `http://localhost:4000`
2. Create collection with endpoints listed above
3. Test each endpoint with sample data
4. Verify response formats and status codes

---

## Support and Troubleshooting

### Common Issues

**Issue: CORS Error**
- **Solution**: Ensure your frontend is running on `http://localhost:3000`

**Issue: 404 Not Found**
- **Solution**: Verify WhistlePro backend is running on port 4000

**Issue: Empty Response**
- **Solution**: Check database connection in backend logs

**Issue: Rate Limit Exceeded**
- **Solution**: Wait 15 minutes or reduce request frequency

### Backend Logs

Check WhistlePro backend console for detailed logs:
```
✅ Database connection established successfully
📄 New anonymous report created: ZRA-2025-XXXXXX
🔗 Report linked to blockchain
```

---

## Additional Resources

- **Backend Source**: `whistlepro_backend/src/`
- **Database Schema**: `whistlepro_backend/database/migrations/`
- **Environment Config**: `whistlepro_backend/.env`

---

## Version History

**v1.0.0** (Current)
- Initial API release
- Basic CRUD operations for reports
- Anonymous submission support
- Real-time dashboard integration
- Blockchain integration for immutable audit trail
