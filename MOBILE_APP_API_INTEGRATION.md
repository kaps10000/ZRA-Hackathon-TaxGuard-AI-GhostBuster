# WhistlePro Mobile App API Integration Guide

## Overview
This document describes how Ephraim's Flutter mobile app integrates with the WhistlePro backend to submit whistleblower reports.

## Backend Server
- **URL**: `http://localhost:3005` (Development)
- **Production**: TBD
- **Status**: Running and accepting connections

## API Endpoints

### 1. Submit New Report (Mobile App → Backend)

**Endpoint**: `POST /api/reports`

**Description**: Submit a new whistleblower report from the mobile app

**Request Headers**:
```
Content-Type: application/json
```

**Request Body**:
```json
{
  "title": "Tax Evasion at XYZ Company",
  "company": "XYZ Mining Ltd",
  "category": "Tax Evasion",
  "description": "Detailed description of the fraud...",
  "evidence": ["Document scans", "Photos", "Witness statements"],
  "reporter": "Anonymous"
}
```

**Response** (201 Created):
```json
{
  "success": true,
  "caseId": "WP-2025-004",
  "message": "Report submitted successfully"
}
```

**Example Mobile App Code (Flutter/Dart)**:
```dart
import 'package:http/http.dart' as http;
import 'dart:convert';

Future<String> submitReport({
  required String title,
  required String company,
  required String category,
  required String description,
  List<String>? evidence,
}) async {
  final url = Uri.parse('http://localhost:3005/api/reports');
  
  final response = await http.post(
    url,
    headers: {'Content-Type': 'application/json'},
    body: jsonEncode({
      'title': title,
      'company': company,
      'category': category,
      'description': description,
      'evidence': evidence ?? [],
      'reporter': 'Anonymous',
    }),
  );

  if (response.statusCode == 201) {
    final data = jsonDecode(response.body);
    return data['caseId'];
  } else {
    throw Exception('Failed to submit report');
  }
}
```

### 2. Get All Reports

**Endpoint**: `GET /api/reports`

**Query Parameters**:
- `status` (optional): Filter by status (Open, Under Investigation, Resolved)
- `priority` (optional): Filter by priority (Low, Medium, High, Critical)
- `limit` (optional): Max number of results (default: 50)

**Response** (200 OK):
```json
{
  "total": 2,
  "reports": [
    {
      "id": 1,
      "caseId": "WP-001",
      "title": "Tax Evasion at ABC Mining",
      "company": "ABC Mining Ltd",
      "category": "Tax Evasion",
      "priority": "High",
      "status": "Under Investigation",
      "reportedDate": "2025-10-15",
      "reporter": "Anonymous",
      "assignedTo": "John Doe",
      "description": "Company suspected of underreporting revenue.",
      "evidence": ["Document scans", "Financial records"]
    }
  ]
}
```

### 3. Get Specific Report

**Endpoint**: `GET /api/reports/:caseId`

**Example**: `GET /api/reports/WP-001`

**Response** (200 OK): Single report object

### 4. Update Report Status

**Endpoint**: `PATCH /api/reports/:caseId/status`

**Request Body**:
```json
{
  "status": "Under Investigation"
}
```

**Response** (200 OK):
```json
{
  "success": true,
  "caseId": "WP-001",
  "status": "Under Investigation"
}
```

## Real-Time Updates

### Dashboard Integration
- The dashboard at `http://localhost:3000` automatically fetches reports from this API
- Auto-refreshes every 10 seconds
- When mobile app submits a report, it appears on the dashboard within 10 seconds

### WebSocket (Future Enhancement)
For instant real-time updates, WebSocket support can be added:
```javascript
// Future implementation
const socket = io('http://localhost:3005');
socket.on('new-report', (report) => {
  console.log('New report received:', report);
});
```

## Testing the Integration

### 1. Using cURL:
```bash
curl -X POST http://localhost:3005/api/reports \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Test Report from Mobile",
    "company": "Test Company Ltd",
    "category": "VAT Fraud",
    "description": "This is a test report from the mobile app",
    "evidence": ["Test evidence 1", "Test evidence 2"],
    "reporter": "Anonymous"
  }'
```

### 2. Using Postman:
1. Method: POST
2. URL: `http://localhost:3005/api/reports`
3. Headers: `Content-Type: application/json`
4. Body: (Raw JSON from example above)

### 3. Verify on Dashboard:
1. Open `http://localhost:3000`
2. Navigate to "WhistlePro Cases" in the sidebar
3. You should see the newly submitted report

## Security Features

- **CORS**: Enabled for mobile app origins
- **Rate Limiting**: 100 requests per 15 minutes per IP
- **Helmet**: Security headers enabled
- **Anonymous Reporting**: No authentication required for submissions
- **Data Encryption**: Sensitive data encrypted (future enhancement)

## Error Handling

**400 Bad Request**:
```json
{
  "error": "Title and description are required"
}
```

**404 Not Found**:
```json
{
  "error": "Report not found"
}
```

**429 Too Many Requests**:
```json
{
  "error": "Too many requests from this IP, please try again later."
}
```

**500 Internal Server Error**:
```json
{
  "error": "Internal server error"
}
```

## Mobile App Checklist

- [ ] Install http package: `flutter pub add http`
- [ ] Add internet permission to AndroidManifest.xml
- [ ] Update API base URL for production deployment
- [ ] Implement error handling for network failures
- [ ] Add loading states during API calls
- [ ] Test with mock data first
- [ ] Implement offline support (local storage + sync)
- [ ] Add retry logic for failed submissions

## Contact

For mobile app integration support:
- **Backend**: Kelvin (WhistlePro Backend)
- **Frontend**: Ephraim (Mobile App)
- **Dashboard**: Thomas & Kaps (Integration)

---

**Status**: ✅ API is live and ready for mobile app integration
**Last Updated**: 2025-10-19
