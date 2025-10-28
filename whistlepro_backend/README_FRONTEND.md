# WhistlePro Backend - Frontend Developer Guide

## Quick Start

**Backend URL:** `http://172.16.200.136:3005`

**Status:** ✅ Running with Socket.io & File Upload Support

---

## Table of Contents

1. [Connection Setup](#connection-setup)
2. [REST API Endpoints](#rest-api-endpoints)
3. [Real-Time Events (Socket.io)](#real-time-events-socketio)
4. [File Upload](#file-upload)
5. [Code Examples](#code-examples)
6. [Error Handling](#error-handling)

---

## Connection Setup

### Base URL

```javascript
const API_BASE_URL = "http://172.16.200.136:3005";
```

**Important:**
- Use `172.16.200.136:3005` when testing on **mobile devices**
- Use `localhost:3005` when testing on **same computer** (web browser)

### CORS

CORS is already configured. Your frontend can make requests from:
- `http://localhost:3000` (Dashboard)
- `http://localhost:4001` (API Gateway)

---

## REST API Endpoints

### 1. Health Check

Check if backend is running.

```javascript
GET /health
```

**Response:**
```json
{
  "status": "healthy"
}
```

**Example:**
```javascript
const response = await fetch('http://172.16.200.136:3005/health');
const data = await response.json();
console.log(data.status); // "healthy"
```

---

### 2. Get All Reports

Retrieve all submitted reports.

```javascript
GET /api/reports
```

**Response:**
```json
{
  "total": 3,
  "reports": [
    {
      "id": 3,
      "caseId": "WP-003",
      "title": "Tax Evasion Report",
      "company": "ABC Ltd",
      "category": "Tax Evasion",
      "priority": "High",
      "status": "Open",
      "reportedDate": "2025-10-26",
      "reporter": "Anonymous",
      "description": "Details about the fraud",
      "evidenceFiles": [...]  // If files were uploaded
    },
    ...
  ]
}
```

**Example:**
```javascript
const response = await fetch('http://172.16.200.136:3005/api/reports');
const data = await response.json();
console.log(`Total reports: ${data.total}`);
data.reports.forEach(report => {
  console.log(`${report.caseId}: ${report.title}`);
});
```

---

### 3. Get Single Report

Retrieve a specific report by case ID.

```javascript
GET /api/reports/:caseId
```

**Example:**
```javascript
const caseId = 'WP-001';
const response = await fetch(`http://172.16.200.136:3005/api/reports/${caseId}`);
const report = await response.json();
console.log(report.title);
```

**Error (404):**
```json
{
  "error": "Not found"
}
```

---

### 4. Submit New Report (Without Files)

Submit a report with JSON data only.

```javascript
POST /api/reports
Content-Type: application/json
```

**Request Body:**
```json
{
  "title": "Tax Evasion at XYZ Company",
  "company": "XYZ Corp",
  "category": "Tax Evasion",
  "priority": "High",
  "description": "Detailed description of the fraud",
  "reporter": "Anonymous"
}
```

**Response:**
```json
{
  "success": true,
  "caseId": "WP-004",
  "message": "Report submitted successfully",
  "evidenceCount": 0
}
```

**Example:**
```javascript
const reportData = {
  title: "Tax Evasion Report",
  company: "ABC Ltd",
  category: "Tax Evasion",
  priority: "High",
  description: "Company underreporting revenue",
  reporter: "Anonymous"
};

const response = await fetch('http://172.16.200.136:3005/api/reports', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify(reportData),
});

const result = await response.json();
console.log(`Report submitted: ${result.caseId}`);
```

---

### 5. Submit Report WITH Files

Submit a report with attached evidence files.

```javascript
POST /api/reports
Content-Type: multipart/form-data
```

**Request:**
- Field `data`: JSON string with report details
- Field `evidence`: File(s) to upload (max 10 files, 10MB each)

**Example (React Native):**
```javascript
const formData = new FormData();

// Add report data
formData.append('data', JSON.stringify({
  title: "Tax Evasion Report",
  company: "ABC Ltd",
  category: "Tax Evasion",
  description: "Evidence attached",
  reporter: "Anonymous"
}));

// Add files (from DocumentPicker or ImagePicker)
files.forEach(file => {
  formData.append('evidence', {
    uri: file.uri,
    type: file.type,
    name: file.name,
  });
});

const response = await fetch('http://172.16.200.136:3005/api/reports', {
  method: 'POST',
  body: formData,
});

const result = await response.json();
console.log(`Case ID: ${result.caseId}`);
console.log(`Files uploaded: ${result.evidenceCount}`);
```

**Example (Web/React):**
```javascript
const formData = new FormData();

formData.append('data', JSON.stringify({
  title: "Tax Evasion Report",
  company: "ABC Ltd",
  category: "Tax Evasion",
  description: "Evidence attached"
}));

// Add files from <input type="file">
const fileInput = document.getElementById('fileInput');
Array.from(fileInput.files).forEach(file => {
  formData.append('evidence', file);
});

const response = await fetch('http://172.16.200.136:3005/api/reports', {
  method: 'POST',
  body: formData,
});
```

---

### 6. Update Report Status

Change the status of a report.

```javascript
PATCH /api/reports/:caseId/status
```

**Request Body:**
```json
{
  "status": "Under Investigation"
}
```

**Valid Statuses:**
- "Open"
- "Under Investigation"
- "Resolved"
- "Closed"
- "Rejected"

**Response:**
```json
{
  "success": true,
  "caseId": "WP-001",
  "oldStatus": "Open",
  "newStatus": "Under Investigation",
  "message": "Status updated successfully"
}
```

**Note:** This triggers a real-time `statusChanged` event to all connected clients.

---

### 7. Upload Files Only

Upload evidence files without submitting a report.

```javascript
POST /api/upload
Content-Type: multipart/form-data
```

**Request:**
- Field `files`: File(s) to upload (max 10 files, 10MB each)

**Response:**
```json
{
  "success": true,
  "message": "2 file(s) uploaded successfully",
  "files": [
    {
      "filename": "document-1730000000000-123456789.pdf",
      "originalName": "document.pdf",
      "mimetype": "application/pdf",
      "size": 245678,
      "url": "/uploads/document-1730000000000-123456789.pdf",
      "uploadedAt": "2025-10-26T20:00:00.000Z"
    }
  ]
}
```

**Supported File Types:**
- Images: JPEG, PNG, GIF
- Documents: PDF, DOC, DOCX, XLS, XLSX, TXT
- Max size: 10MB per file

---

### 8. View/Download File

Direct URL to view or download uploaded files.

```javascript
GET /uploads/:filename
```

**Example:**
```javascript
// From upload response, use the filename
const fileUrl = `http://172.16.200.136:3005/uploads/document-1730000000000-123456789.pdf`;

// Open in browser or download
window.open(fileUrl);
```

---

### 9. Real-Time Status

Get Socket.io server statistics.

```javascript
GET /api/realtime/status
```

**Response:**
```json
{
  "active": true,
  "connectedClients": 5,
  "currentConnections": {
    "total": 5,
    "authenticated": 2,
    "anonymous": 3
  },
  "statistics": {
    "totalConnectionsSinceStart": 42,
    "peakConnections": 12,
    "uptimeSeconds": 3600,
    "uptimeFormatted": "1h 0m 0s"
  },
  "availableEvents": {
    "NEW_REPORT": "newReport",
    "REPORT_UPDATED": "reportUpdated",
    "STATUS_CHANGED": "statusChanged",
    ...
  }
}
```

---

## Real-Time Events (Socket.io)

### Setup

**Install Socket.io Client:**
```bash
npm install socket.io-client
```

**Connect:**
```javascript
import io from 'socket.io-client';

const socket = io('http://172.16.200.136:3005', {
  transports: ['websocket', 'polling']
});

socket.on('connect', () => {
  console.log('Connected to real-time server:', socket.id);
});
```

---

### Available Events

#### 1. `connected` - Connection Acknowledgment

Received immediately after connecting.

```javascript
socket.on('connected', (data) => {
  console.log('Welcome message:', data.message);
  console.log('Your role:', data.user.role); // "anonymous" or "investigator"
  console.log('Available events:', data.availableEvents);
});
```

---

#### 2. `newReport` - New Report Submitted

**🔒 Investigators Only** - Not sent to anonymous users.

```javascript
socket.on('newReport', (data) => {
  console.log('New report submitted!');
  console.log('Case ID:', data.report.caseId);
  console.log('Title:', data.report.title);
  console.log('Category:', data.report.category);

  // Update UI - show notification, refresh list, etc.
  showNotification(`New report: ${data.report.caseId}`);
  refreshReportsList();
});
```

---

#### 3. `statusChanged` - Report Status Updated

**📢 Broadcast to ALL users** (investigators and anonymous).

```javascript
socket.on('statusChanged', (data) => {
  console.log('Status changed!');
  console.log('Case ID:', data.caseId);
  console.log('Old Status:', data.oldStatus);
  console.log('New Status:', data.newStatus);

  // Update UI
  updateReportStatus(data.caseId, data.newStatus);
});
```

---

#### 4. `reportUpdated` - Report Details Changed

```javascript
socket.on('reportUpdated', (data) => {
  console.log('Report updated:', data.caseId);
  console.log('Updated by:', data.updatedBy);

  // Refresh the report details
  refreshReport(data.caseId);
});
```

---

#### 5. `systemAlert` - System-Wide Alerts

```javascript
socket.on('systemAlert', (data) => {
  console.log('System alert:', data.message);
  console.log('Level:', data.level); // "info", "warning", "error", "critical"

  // Show alert to user
  showAlert(data.message, data.level);
});
```

---

#### 6. `serverShutdown` - Server Shutting Down

```javascript
socket.on('serverShutdown', (data) => {
  console.log('Server shutting down:', data.message);

  // Show message to user
  alert('Server is restarting. Please wait...');
});
```

---

#### 7. `error` - Socket Error

```javascript
socket.on('error', (error) => {
  console.error('Socket error:', error.message);
  console.error('Error code:', error.code);
});
```

---

### Connection Management

```javascript
// Connection error
socket.on('connect_error', (error) => {
  console.error('Failed to connect:', error.message);
  // Show offline message
});

// Disconnected
socket.on('disconnect', (reason) => {
  console.log('Disconnected:', reason);
  // Show "Connecting..." message
});

// Reconnecting
socket.io.on('reconnect_attempt', () => {
  console.log('Attempting to reconnect...');
});

// Reconnected
socket.io.on('reconnect', (attemptNumber) => {
  console.log('Reconnected after', attemptNumber, 'attempts');
  // Hide "Connecting..." message
});
```

---

### Heartbeat/Ping

Keep connection alive with periodic pings.

```javascript
setInterval(() => {
  socket.emit('ping', (response) => {
    console.log('Pong received:', response.serverTime);
  });
}, 30000); // Every 30 seconds
```

---

### Cleanup

Always disconnect when component unmounts.

```javascript
// React
useEffect(() => {
  const socket = io('http://172.16.200.136:3005');

  socket.on('newReport', handleNewReport);

  return () => {
    socket.disconnect();
  };
}, []);

// React Native
componentWillUnmount() {
  socket.disconnect();
}
```

---

## File Upload

### React Native Example (Complete)

```javascript
import React, { useState } from 'react';
import { View, Button, Text, Alert } from 'react-native';
import DocumentPicker from 'react-native-document-picker';

const API_BASE_URL = 'http://172.16.200.136:3005';

const ReportSubmission = () => {
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);

  // Pick files
  const pickFiles = async () => {
    try {
      const results = await DocumentPicker.pick({
        type: [
          DocumentPicker.types.images,
          DocumentPicker.types.pdf,
        ],
        allowMultiSelection: true,
      });
      setFiles(results);
      Alert.alert('Success', `${results.length} file(s) selected`);
    } catch (err) {
      if (!DocumentPicker.isCancel(err)) {
        Alert.alert('Error', 'Failed to pick files');
      }
    }
  };

  // Submit report with files
  const submitReport = async () => {
    setUploading(true);

    const formData = new FormData();

    // Add report data
    formData.append('data', JSON.stringify({
      title: 'Tax Evasion Report',
      company: 'ABC Ltd',
      category: 'Tax Evasion',
      priority: 'High',
      description: 'Evidence of tax fraud',
      reporter: 'Anonymous'
    }));

    // Add files
    files.forEach((file) => {
      formData.append('evidence', {
        uri: file.uri,
        type: file.type,
        name: file.name,
      });
    });

    try {
      const response = await fetch(`${API_BASE_URL}/api/reports`, {
        method: 'POST',
        body: formData,
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      const result = await response.json();

      if (result.success) {
        Alert.alert(
          'Success',
          `Report submitted!\nCase ID: ${result.caseId}\nFiles: ${result.evidenceCount}`
        );
        setFiles([]);
      } else {
        Alert.alert('Error', 'Failed to submit report');
      }
    } catch (error) {
      Alert.alert('Error', error.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <View style={{ padding: 20 }}>
      <Text>{files.length} file(s) selected</Text>
      <Button title="Pick Files" onPress={pickFiles} />
      <Button
        title={uploading ? "Submitting..." : "Submit Report"}
        onPress={submitReport}
        disabled={uploading}
      />
    </View>
  );
};

export default ReportSubmission;
```

---

## Code Examples

### Complete React Component

```javascript
import React, { useState, useEffect } from 'react';
import io from 'socket.io-client';

const API_BASE_URL = 'http://172.16.200.136:3005';

function Dashboard() {
  const [reports, setReports] = useState([]);
  const [socket, setSocket] = useState(null);

  // Fetch reports on mount
  useEffect(() => {
    fetchReports();
  }, []);

  // Setup Socket.io on mount
  useEffect(() => {
    const newSocket = io(API_BASE_URL);

    newSocket.on('connect', () => {
      console.log('Connected to real-time server');
    });

    newSocket.on('newReport', (data) => {
      console.log('New report:', data.report.caseId);
      // Refresh reports list
      fetchReports();
    });

    newSocket.on('statusChanged', (data) => {
      console.log('Status changed:', data.caseId);
      // Update specific report
      setReports(prev =>
        prev.map(r =>
          r.caseId === data.caseId
            ? { ...r, status: data.newStatus }
            : r
        )
      );
    });

    setSocket(newSocket);

    // Cleanup on unmount
    return () => {
      newSocket.disconnect();
    };
  }, []);

  const fetchReports = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/reports`);
      const data = await response.json();
      setReports(data.reports);
    } catch (error) {
      console.error('Failed to fetch reports:', error);
    }
  };

  const updateStatus = async (caseId, newStatus) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/reports/${caseId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });

      const result = await response.json();
      console.log('Status updated:', result);
      // Real-time event will update UI automatically
    } catch (error) {
      console.error('Failed to update status:', error);
    }
  };

  return (
    <div>
      <h1>Reports Dashboard</h1>
      <p>Total Reports: {reports.length}</p>

      {reports.map(report => (
        <div key={report.caseId} style={{ border: '1px solid #ccc', margin: '10px', padding: '10px' }}>
          <h3>{report.caseId}: {report.title}</h3>
          <p><strong>Company:</strong> {report.company}</p>
          <p><strong>Status:</strong> {report.status}</p>
          <p><strong>Category:</strong> {report.category}</p>
          <p>{report.description}</p>

          {report.evidenceFiles && report.evidenceFiles.length > 0 && (
            <div>
              <strong>Evidence Files:</strong>
              <ul>
                {report.evidenceFiles.map((file, idx) => (
                  <li key={idx}>
                    <a href={`${API_BASE_URL}${file.url}`} target="_blank" rel="noreferrer">
                      {file.originalName}
                    </a> ({(file.size / 1024).toFixed(2)} KB)
                  </li>
                ))}
              </ul>
            </div>
          )}

          <button onClick={() => updateStatus(report.caseId, 'Under Investigation')}>
            Mark as Under Investigation
          </button>
        </div>
      ))}
    </div>
  );
}

export default Dashboard;
```

---

## Error Handling

### HTTP Status Codes

- **200** - Success
- **201** - Created (report submitted)
- **400** - Bad Request (missing data, invalid file type)
- **404** - Not Found (report doesn't exist)
- **500** - Server Error

### Common Errors

**1. Network Error**
```javascript
try {
  const response = await fetch(url);
} catch (error) {
  if (error.message === 'Network request failed') {
    alert('Cannot connect to server. Check your internet connection.');
  }
}
```

**2. File Too Large**
```json
{
  "error": "File upload failed",
  "message": "File size exceeds 10MB limit"
}
```

**3. Invalid File Type**
```json
{
  "error": "File upload failed",
  "message": "File type not allowed: application/x-msdownload"
}
```

**4. Report Not Found**
```json
{
  "error": "Not found"
}
```

---

## Testing Checklist

- [ ] Can fetch all reports (`GET /api/reports`)
- [ ] Can submit report without files (`POST /api/reports` with JSON)
- [ ] Can submit report with files (`POST /api/reports` with FormData)
- [ ] Can view uploaded files in browser
- [ ] Socket.io connects successfully
- [ ] Receives `newReport` event when report is submitted
- [ ] Receives `statusChanged` event when status is updated
- [ ] Can update report status (`PATCH /api/reports/:caseId/status`)
- [ ] Error handling works for network failures
- [ ] File size/type validation works

---

## Quick Reference

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/health` | GET | Check server status |
| `/api/reports` | GET | Get all reports |
| `/api/reports/:caseId` | GET | Get single report |
| `/api/reports` | POST | Submit new report |
| `/api/reports/:caseId/status` | PATCH | Update status |
| `/api/upload` | POST | Upload files only |
| `/uploads/:filename` | GET | View/download file |
| `/api/realtime/status` | GET | Socket.io stats |

---

## Support

**Server IP:** `172.16.200.136:3005`

**Real-Time Events:** 7 types (newReport, statusChanged, etc.)

**File Upload:** Max 10MB, 10 files per request

**For help:** Check backend console logs for detailed error messages

---

**Last Updated:** 2025-10-26
**Backend Version:** 1.0.0 with Socket.io & File Upload
