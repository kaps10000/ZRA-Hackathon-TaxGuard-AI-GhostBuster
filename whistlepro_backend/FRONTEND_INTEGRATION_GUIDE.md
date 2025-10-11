# Frontend Integration Guide - WhistlePro Backend

**🎯 Quick Start for Frontend Developers**

## ✅ What's Already Done For You

### 1. **Authentication is DISABLED**
- No need to handle JWT tokens
- No need to implement login flows
- All endpoints work immediately without auth headers
- ⚠️ This is temporary for development only

### 2. **Security is AUTOMATIC**
- ✅ **Encryption**: Send plain JSON → Backend encrypts automatically
- ✅ **Metadata Scrubbing**: IP/User-Agent hashed automatically
- ✅ **Input Sanitization**: XSS/SQL injection prevented automatically
- ✅ **Rate Limiting**: 5 reports per IP per 15 min (automatic 429 response)

### 3. **Validation is BUILT-IN**
- JOI schema validation on all inputs
- Clear error messages with field-level details
- Consistent error response format

---

## 🚀 Getting Started

### Step 1: Start the Backend

```bash
cd whistlepro_backend
npm install
npm run dev
```

Server runs on: `http://localhost:3000`

### Step 2: Test Health Endpoint

```javascript
fetch('http://localhost:3000/health')
  .then(res => res.json())
  .then(data => console.log('Server is up:', data))
```

---

## 📡 API Endpoints You Need

### 1. Submit Anonymous Report

**Endpoint:** `POST /api/reports`

**Minimal Example:**
```javascript
const response = await fetch('http://localhost:3000/api/reports', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    category: 'tax_evasion',
    title: 'Company ABC is evading taxes',
    description: 'Detailed description of the tax evasion (minimum 50 characters required for validation).'
  })
});

const result = await response.json();

if (result.success) {
  alert(`Report submitted! Case ID: ${result.data.case_id}`);
  // Save case_id for user to track their report
} else {
  console.error('Error:', result.error.message);
}
```

**Full Example with All Fields:**
```javascript
const submitReport = async (formData) => {
  try {
    const response = await fetch('http://localhost:3000/api/reports', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        category: formData.category, // REQUIRED: tax_evasion|fraud|corruption|etc
        title: formData.title,        // REQUIRED: 10-200 chars
        description: formData.description, // REQUIRED: 50-5000 chars
        priority: formData.priority || 'medium', // OPTIONAL: low|medium|high|critical

        // OPTIONAL: Subject details
        subjects: {
          organizations: [{
            name: formData.companyName,
            tpin: formData.tpin,
            address: formData.address
          }],
          individuals: [{
            name: formData.personName,
            position: formData.position
          }]
        },

        // OPTIONAL: Location
        location: {
          province: formData.province,
          district: formData.district,
          area: formData.area
        },

        // OPTIONAL: Evidence
        evidence: {
          financial_details: {
            estimated_amount: formData.amount,
            currency: 'ZMW',
            frequency: 'yearly'
          }
        },

        // OPTIONAL: Reporter preferences
        reporter_info: {
          anonymous: true, // Always true for public reports
          contact_preference: 'none' // none|secure_message|phone|email
        }
      })
    });

    const data = await response.json();

    if (!response.ok) {
      // Handle validation errors
      if (data.error.details) {
        data.error.details.forEach(err => {
          console.error(`Field '${err.field}': ${err.message}`);
        });
      }
      throw new Error(data.error.message);
    }

    return data.data; // Returns { case_id, status, priority, created_at, blockchain_hash }

  } catch (error) {
    console.error('Submission failed:', error.message);
    throw error;
  }
};
```

### 2. View Report by Case ID

**Endpoint:** `GET /api/reports/:caseId`

```javascript
const getReport = async (caseId) => {
  try {
    const response = await fetch(`http://localhost:3000/api/reports/${caseId}`);
    const data = await response.json();

    if (data.success) {
      return data.data; // Full report with decrypted payload
    } else {
      throw new Error(data.error.message);
    }
  } catch (error) {
    console.error('Failed to fetch report:', error);
    throw error;
  }
};

// Usage
const report = await getReport('ZRA-2025-A1B2C3');
console.log('Title:', report.payload.title);
console.log('Status:', report.status);
```

### 3. List All Reports (for Dashboard)

**Endpoint:** `GET /api/reports?page=1&limit=20&status=pending`

```javascript
const listReports = async (filters = {}) => {
  const params = new URLSearchParams({
    page: filters.page || 1,
    limit: filters.limit || 20,
    ...(filters.status && { status: filters.status }),
    ...(filters.category && { category: filters.category }),
    ...(filters.priority && { priority: filters.priority })
  });

  const response = await fetch(`http://localhost:3000/api/reports?${params}`);
  const data = await response.json();

  if (data.success) {
    return {
      reports: data.data,
      pagination: data.pagination // { page, limit, total, pages }
    };
  } else {
    throw new Error(data.error.message);
  }
};

// Usage - Get pending reports
const { reports, pagination } = await listReports({
  status: 'pending',
  page: 1
});

console.log(`Showing ${reports.length} of ${pagination.total} reports`);
```

### 4. Update Report Status (for Investigators Dashboard)

**Endpoint:** `PATCH /api/reports/:caseId/status`

```javascript
const updateStatus = async (caseId, newStatus, notes) => {
  const response = await fetch(
    `http://localhost:3000/api/reports/${caseId}/status`,
    {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus, notes })
    }
  );

  const data = await response.json();

  if (data.success) {
    return data.data; // Updated report
  } else {
    throw new Error(data.error.message);
  }
};

// Usage
await updateStatus('ZRA-2025-A1B2C3', 'under_review', 'Assigned to investigator');
```

---

## 🎨 Form Validation (Client-Side)

**Match backend validation for better UX:**

```javascript
const validateReport = (formData) => {
  const errors = [];

  // Title validation
  if (!formData.title || formData.title.length < 10) {
    errors.push({ field: 'title', message: 'Title must be at least 10 characters' });
  }
  if (formData.title && formData.title.length > 200) {
    errors.push({ field: 'title', message: 'Title must not exceed 200 characters' });
  }

  // Description validation
  if (!formData.description || formData.description.length < 50) {
    errors.push({ field: 'description', message: 'Description must be at least 50 characters' });
  }
  if (formData.description && formData.description.length > 5000) {
    errors.push({ field: 'description', message: 'Description must not exceed 5000 characters' });
  }

  // Category validation
  const validCategories = [
    'tax_evasion', 'fraud', 'corruption', 'phantom_employees',
    'ghost_companies', 'money_laundering', 'bribery', 'other'
  ];
  if (!formData.category || !validCategories.includes(formData.category)) {
    errors.push({ field: 'category', message: 'Invalid category selected' });
  }

  return errors;
};
```

---

## 🚨 Error Handling

**All errors follow this format:**

```javascript
{
  "success": false,
  "error": {
    "message": "Error description",
    "code": "ERROR_CODE",
    "details": [ /* array of field errors */ ]
  }
}
```

**Recommended error handling:**

```javascript
const handleApiError = (error, response) => {
  // Rate limiting
  if (response?.status === 429) {
    const retryAfter = Math.ceil(error.retryAfter / 60);
    return `Too many submissions. Please wait ${retryAfter} minutes and try again.`;
  }

  // Validation errors
  if (error.details && error.details.length > 0) {
    return error.details.map(d => `${d.field}: ${d.message}`).join('\n');
  }

  // Generic error
  return error.message || 'An unexpected error occurred';
};

// Usage
try {
  await submitReport(formData);
} catch (err) {
  const errorMessage = handleApiError(err.response?.data?.error, err.response);
  alert(errorMessage);
}
```

---

## 📊 Display Case ID

**After successful submission:**

```jsx
// React example
function ReportSuccess({ caseId }) {
  return (
    <div className="success-message">
      <h2>✅ Report Submitted Successfully!</h2>
      <p>Your case ID is:</p>
      <div className="case-id">
        <code>{caseId}</code>
        <button onClick={() => navigator.clipboard.writeText(caseId)}>
          Copy
        </button>
      </div>
      <p className="warning">
        ⚠️ Save this case ID! You'll need it to track your report status.
      </p>
    </div>
  );
}
```

---

## 🎯 Category & Priority Options

**For dropdown menus:**

```javascript
const CATEGORIES = [
  { value: 'tax_evasion', label: 'Tax Evasion' },
  { value: 'fraud', label: 'Fraud' },
  { value: 'corruption', label: 'Corruption' },
  { value: 'phantom_employees', label: 'Phantom Employees' },
  { value: 'ghost_companies', label: 'Ghost Companies' },
  { value: 'money_laundering', label: 'Money Laundering' },
  { value: 'bribery', label: 'Bribery' },
  { value: 'other', label: 'Other' }
];

const PRIORITIES = [
  { value: 'low', label: 'Low', color: '#6c757d' },
  { value: 'medium', label: 'Medium', color: '#ffc107' },
  { value: 'high', label: 'High', color: '#fd7e14' },
  { value: 'critical', label: 'Critical', color: '#dc3545' }
];

const STATUSES = [
  { value: 'pending', label: 'Pending Investigation', color: '#6c757d' },
  { value: 'under_review', label: 'Under Review', color: '#17a2b8' },
  { value: 'investigating', label: 'Investigating', color: '#ffc107' },
  { value: 'closed', label: 'Closed', color: '#28a745' }
];
```

---

## 🔧 CORS Configuration

**If your frontend runs on a different port:**

Update `whistlepro_backend/.env`:
```env
CORS_ORIGIN=http://localhost:YOUR_FRONTEND_PORT
```

Default is: `http://localhost:3001`

---

## 📖 Full API Documentation

See `API_DOCUMENTATION.md` for:
- Complete endpoint reference
- All request/response examples
- Error codes reference
- cURL examples
- Fetch/Axios examples

---

## ⚠️ Important Notes

1. **No Authentication Required** (for now)
   - All endpoints work without tokens
   - Will be re-enabled before production

2. **Rate Limiting is Active**
   - 5 submissions per IP per 15 minutes
   - Handle 429 responses gracefully

3. **Encryption is Automatic**
   - Send plain JSON
   - Backend encrypts before storage
   - Backend decrypts when retrieving

4. **Case ID Format**
   - Format: `ZRA-YYYY-XXXXXX`
   - Example: `ZRA-2025-A1B2C3`
   - Always validate before using

---

## 🎨 Sample React Component

```jsx
import { useState } from 'react';

function ReportForm() {
  const [formData, setFormData] = useState({
    category: '',
    title: '',
    description: '',
    priority: 'medium'
  });
  const [caseId, setCaseId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('http://localhost:3000/api/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (data.success) {
        setCaseId(data.data.case_id);
      } else {
        setError(data.error.message);
      }
    } catch (err) {
      setError('Failed to submit report. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (caseId) {
    return (
      <div>
        <h2>✅ Report Submitted!</h2>
        <p>Case ID: <strong>{caseId}</strong></p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit}>
      <select
        value={formData.category}
        onChange={e => setFormData({...formData, category: e.target.value})}
        required
      >
        <option value="">Select Category</option>
        <option value="tax_evasion">Tax Evasion</option>
        <option value="fraud">Fraud</option>
        <option value="corruption">Corruption</option>
      </select>

      <input
        type="text"
        placeholder="Report Title (min 10 characters)"
        value={formData.title}
        onChange={e => setFormData({...formData, title: e.target.value})}
        minLength={10}
        maxLength={200}
        required
      />

      <textarea
        placeholder="Detailed Description (min 50 characters)"
        value={formData.description}
        onChange={e => setFormData({...formData, description: e.target.value})}
        minLength={50}
        maxLength={5000}
        required
      />

      {error && <div className="error">{error}</div>}

      <button type="submit" disabled={loading}>
        {loading ? 'Submitting...' : 'Submit Anonymous Report'}
      </button>
    </form>
  );
}
```

---

**Need Help?**
- Full API docs: `API_DOCUMENTATION.md`
- Database schema: `DATABASE_SCHEMA.md`
- Test examples: `test-api.js`

**Backend Developer:** Kelvin
**Project:** ZRA Hackathon 2025 - TaxGuard AI
