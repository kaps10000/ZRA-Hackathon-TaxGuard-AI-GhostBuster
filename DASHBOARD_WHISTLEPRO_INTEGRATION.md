# Dashboard ↔ WhistlePro Integration - Quick Fix

## Summary

Updated the dashboard to connect **directly** to WhistlePro backend on port 3005, bypassing the API Gateway.

---

## Changes Made

### File: `dashboard_integration/frontend/src/services/api.js`

**1. Added WhistlePro-specific configuration:**
```javascript
const WHISTLEPRO_BASE_URL = 'http://localhost:3005';
const WHISTLEPRO_WS_URL = 'http://localhost:3005';
```

**2. Created dedicated axios instance for WhistlePro:**
```javascript
const whistleproApi = axios.create({
  baseURL: WHISTLEPRO_BASE_URL,
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' }
});
```

**3. Updated WhistlePro API methods:**
```javascript
export const whistleproAPI = {
  // Changed from: api.post('/api/whistlepro/submit')
  // To: whistleproApi.post('/api/reports')
  submit: (report) => whistleproApi.post('/api/reports', report),

  // Changed from: api.get('/api/whistlepro/cases')
  // To: whistleproApi.get('/api/reports')
  getCases: (params) => whistleproApi.get('/api/reports', { params }),

  // New methods:
  getCase: (caseId) => whistleproApi.get(`/api/reports/${caseId}`),
  updateStatus: (caseId, status) => whistleproApi.patch(`/api/reports/${caseId}/status`, { status }),
  getStats: () => whistleproApi.get('/api/realtime/status'),
  uploadFiles: (formData) => whistleproApi.post('/api/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  })
};
```

**4. Added WhistlePro Socket.io connection:**
```javascript
export const connectWhistleProWebSocket = () => {
  // Connects to http://localhost:3005
  // Listens for: newReport, statusChanged, connected events
};
```

---

## Connection Flow

### Before (Not Working):
```
Dashboard → http://localhost:4001/api/whistlepro/cases
                ↓
            API Gateway → ❌ Not configured for WhistlePro
```

### After (Working):
```
Dashboard → http://localhost:3005/api/reports
                ↓
            WhistlePro Backend ✅
```

---

## Available API Methods

Dashboard can now use:

### REST API:
```javascript
import { whistleproAPI } from '@/services/api';

// Get all reports
const { data } = await whistleproAPI.getCases();
// Response: { total: 3, reports: [...] }

// Get single report
const report = await whistleproAPI.getCase('WP-001');

// Submit new report
await whistleproAPI.submit({
  title: 'Tax Evasion Report',
  company: 'ABC Ltd',
  category: 'Tax Evasion',
  description: '...'
});

// Update status
await whistleproAPI.updateStatus('WP-001', 'Under Investigation');

// Get stats
const stats = await whistleproAPI.getStats();
```

### Real-Time Events:
```javascript
import { connectWhistleProWebSocket, getWhistleProSocket } from '@/services/api';

// Connect
const socket = connectWhistleProWebSocket();

// Listen for new reports
socket.on('newReport', (data) => {
  console.log('New report:', data.report.caseId);
  // Refresh dashboard
});

// Listen for status changes
socket.on('statusChanged', (data) => {
  console.log(`${data.caseId}: ${data.oldStatus} → ${data.newStatus}`);
  // Update UI
});
```

---

## Testing

### 1. Check Connection
Open browser console on dashboard (http://localhost:3000):
```javascript
import { whistleproAPI } from './src/services/api';

// Should return reports
const response = await whistleproAPI.getCases();
console.log(response.data);
```

### 2. Test Real-Time
```javascript
import { connectWhistleProWebSocket } from './src/services/api';

const socket = connectWhistleProWebSocket();

socket.on('connected', (data) => {
  console.log('Connected to WhistlePro real-time:', data);
});
```

### 3. Submit from Mobile → See on Dashboard
1. Submit report from mobile app
2. Dashboard should receive `newReport` event
3. Refresh reports list to see new report

---

## Next Steps

The dashboard WhistlePro page needs to be updated to:

1. **Call `connectWhistleProWebSocket()` on component mount**
2. **Use `whistleproAPI.getCases()` to fetch reports**
3. **Listen to real-time events for auto-refresh**
4. **Update UI when events are received**

Example React component:
```javascript
import React, { useEffect, useState } from 'react';
import { whistleproAPI, connectWhistleProWebSocket, getWhistleProSocket } from '@/services/api';

function WhistleProPage() {
  const [reports, setReports] = useState([]);

  useEffect(() => {
    // Fetch reports
    fetchReports();

    // Connect to real-time
    const socket = connectWhistleProWebSocket();

    socket.on('newReport', () => {
      fetchReports(); // Refresh when new report comes in
    });

    socket.on('statusChanged', (data) => {
      // Update specific report in state
      setReports(prev =>
        prev.map(r =>
          r.caseId === data.caseId
            ? { ...r, status: data.newStatus }
            : r
        )
      );
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const fetchReports = async () => {
    const { data } = await whistleproAPI.getCases();
    setReports(data.reports);
  };

  return (
    <div>
      <h1>WhistlePro Reports</h1>
      <p>Total: {reports.length}</p>
      {reports.map(report => (
        <div key={report.caseId}>
          <h3>{report.caseId}: {report.title}</h3>
          <p>Status: {report.status}</p>
          {report.evidenceFiles && (
            <p>Evidence Files: {report.evidenceFiles.length}</p>
          )}
        </div>
      ))}
    </div>
  );
}
```

---

## Important Notes

- ✅ Dashboard now connects directly to WhistlePro (port 3005)
- ✅ Real-time events supported
- ✅ File upload support included
- ⚠️ Requires dashboard restart for changes to take effect
- ⚠️ WhistlePro service must be running on port 3005

---

**Status:** ✅ Configuration Complete
**Next:** Restart dashboard to apply changes
