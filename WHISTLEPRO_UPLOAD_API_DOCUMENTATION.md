# WhistlePro File Upload API Documentation

## Overview

The WhistlePro upload API allows anonymous whistleblowers to securely upload evidence files (photos, documents, videos) before submitting their reports. This is a separate endpoint that handles multipart/form-data file uploads.

## Base URL

```
http://localhost:3001/api/uploads
```

## Endpoints

### 1. Upload Multiple Files

**Endpoint:** `POST /api/uploads`

**Content-Type:** `multipart/form-data`

**Request Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `files` | File[] | Yes | Array of files to upload (max 10 files) |
| `type` | String | Yes | File type category: `"photo"` \| `"document"` \| `"video"` |

**File Type Requirements:**

#### Photos (`type: "photo"`)
- **Allowed Extensions:** `.jpg`, `.jpeg`, `.png`
- **Max Size:** 5MB per file
- **MIME Types:** `image/jpeg`, `image/png`
- **Features:** Automatic compression and optimization using Sharp

#### Documents (`type: "document"`)
- **Allowed Extensions:** `.pdf`, `.doc`, `.docx`
- **Max Size:** 10MB per file
- **MIME Types:** `application/pdf`, `application/msword`, `application/vnd.openxmlformats-officedocument.wordprocessingml.document`

#### Videos (`type: "video"`)
- **Allowed Extensions:** `.mp4`, `.mov`
- **Max Size:** 50MB per file
- **MIME Types:** `video/mp4`, `video/quicktime`

**Response (Success - 200 OK):**

```json
{
  "success": true,
  "message": "Successfully uploaded 2 file(s)",
  "files": [
    {
      "filename": "photo_1697123456789_a3f7e92b1c4d8e6f.jpg",
      "originalName": "evidence.jpg",
      "url": "/uploads/photo_1697123456789_a3f7e92b1c4d8e6f.jpg",
      "size": 245678,
      "mimeType": "image/jpeg",
      "type": "photo"
    },
    {
      "filename": "photo_1697123456790_b4e8f03c2d5e9a7g.jpg",
      "originalName": "evidence2.jpg",
      "url": "/uploads/photo_1697123456790_b4e8f03c2d5e9a7g.jpg",
      "size": 198432,
      "mimeType": "image/jpeg",
      "type": "photo"
    }
  ]
}
```

**Response (Partial Success):**

```json
{
  "success": true,
  "message": "Successfully uploaded 1 file(s)",
  "files": [
    {
      "filename": "document_1697123456789_a3f7e92b1c4d8e6f.pdf",
      "originalName": "report.pdf",
      "url": "/uploads/document_1697123456789_a3f7e92b1c4d8e6f.pdf",
      "size": 1024000,
      "mimeType": "application/pdf",
      "type": "document"
    }
  ],
  "errors": [
    {
      "filename": "large_file.pdf",
      "error": "File too large. Maximum size: 10MB"
    }
  ]
}
```

**Response (Error - 400 Bad Request):**

```json
{
  "success": false,
  "error": "Invalid or missing type parameter",
  "allowedTypes": ["photo", "document", "video"]
}
```

### 2. Retrieve Uploaded File

**Endpoint:** `GET /api/uploads/:filename`

**Description:** Retrieve a previously uploaded file by its filename.

**Example:**
```
GET http://localhost:3001/api/uploads/photo_1697123456789_a3f7e92b1c4d8e6f.jpg
```

**Response:** Returns the file with appropriate content-type headers.

### 3. List All Uploaded Files (Admin)

**Endpoint:** `GET /api/uploads`

**Description:** List all uploaded files (useful for debugging/admin purposes).

**Response:**

```json
{
  "success": true,
  "count": 3,
  "files": [
    {
      "filename": "photo_1697123456789_a3f7e92b1c4d8e6f.jpg",
      "url": "/uploads/photo_1697123456789_a3f7e92b1c4d8e6f.jpg",
      "size": 245678,
      "created": "2025-10-12T10:30:45.123Z",
      "modified": "2025-10-12T10:30:45.123Z"
    }
  ]
}
```

### 4. Delete Uploaded File

**Endpoint:** `DELETE /api/uploads/:filename`

**Description:** Delete a previously uploaded file.

**Example:**
```
DELETE http://localhost:3001/api/uploads/photo_1697123456789_a3f7e92b1c4d8e6f.jpg
```

**Response:**

```json
{
  "success": true,
  "message": "File deleted successfully"
}
```

## Usage Flow from Flutter App

### Step 1: Upload Files

```dart
// Flutter example
Future<List<String>> uploadFiles(List<File> files, String type) async {
  var request = http.MultipartRequest(
    'POST',
    Uri.parse('http://localhost:3001/api/uploads'),
  );

  // Add type field
  request.fields['type'] = type; // 'photo', 'document', or 'video'

  // Add files
  for (var file in files) {
    request.files.add(
      await http.MultipartFile.fromPath('files', file.path)
    );
  }

  var response = await request.send();
  var responseBody = await response.stream.bytesToString();
  var json = jsonDecode(responseBody);

  if (json['success']) {
    // Extract URLs from response
    List<String> urls = [];
    for (var file in json['files']) {
      urls.add(file['url']);
    }
    return urls;
  } else {
    throw Exception('Upload failed: ${json['error']}');
  }
}
```

### Step 2: Submit Report with File URLs

```dart
// After uploading files, submit report with URLs
Future<void> submitReport(Map<String, dynamic> reportData, List<String> photoUrls) async {
  var response = await http.post(
    Uri.parse('http://localhost:3001/api/whistlepro/report'),
    headers: {'Content-Type': 'application/json'},
    body: jsonEncode({
      'reportType': 'tax_evasion',
      'targetEntity': 'Company XYZ (anonymized)',
      'severity': 'HIGH',
      'description': 'Evidence of tax evasion...',
      'evidenceHash': 'a3f7e92b1c4d8e6f5a9b2c1d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f',
      'evidence': {
        'photos': photoUrls,
        'documents': [],
        'videos': []
      },
      ...reportData
    }),
  );

  var json = jsonDecode(response.body);
  if (json['success']) {
    print('Report submitted: ${json['report']['caseCode']}');
  }
}
```

### Complete Example

```dart
// Complete flow
final photos = [photo1, photo2];
final documents = [document1];

// Step 1: Upload photos
final photoUrls = await uploadFiles(photos, 'photo');

// Step 2: Upload documents
final documentUrls = await uploadFiles(documents, 'document');

// Step 3: Submit report with all URLs
await submitReport({
  'reportType': 'tax_evasion',
  'targetEntity': 'Company ABC',
  'severity': 'HIGH',
  'description': 'Tax evasion evidence',
  'evidenceHash': generateHash(photos + documents),
  'evidence': {
    'photos': photoUrls,
    'documents': documentUrls,
    'videos': []
  }
});
```

## Security Features

### 1. File Validation
- Strict file type checking (extension + MIME type)
- Size limits per file type
- Prevents executable file uploads
- Maximum 10 files per request

### 2. Filename Security
- Automatic filename sanitization
- Prevents path traversal attacks
- Unique timestamp-based filenames
- Random hash to prevent conflicts

### 3. Image Optimization
- Automatic compression for photos
- Resizing to max 2048x2048px
- JPEG quality optimization (85%)
- Progressive JPEG encoding

### 4. Anonymous Uploads
- No authentication required
- No IP logging for anonymity
- Files stored securely in `/uploads` directory

### 5. Rate Limiting
- Rate limiting is already configured in the main API (500 requests per 15 minutes)
- Applies to all endpoints including uploads

## Testing with cURL

### Upload a single photo

```bash
curl -X POST http://localhost:3001/api/uploads \
  -F "files=@/path/to/photo.jpg" \
  -F "type=photo"
```

### Upload multiple files

```bash
curl -X POST http://localhost:3001/api/uploads \
  -F "files=@/path/to/photo1.jpg" \
  -F "files=@/path/to/photo2.jpg" \
  -F "files=@/path/to/document.pdf" \
  -F "type=photo"
```

### Retrieve uploaded file

```bash
curl http://localhost:3001/api/uploads/photo_1697123456789_a3f7e92b1c4d8e6f.jpg \
  --output downloaded_photo.jpg
```

### Submit report with uploaded files

```bash
curl -X POST http://localhost:3001/api/whistlepro/report \
  -H "Content-Type: application/json" \
  -d '{
    "reportType": "tax_evasion",
    "targetEntity": "Company XYZ",
    "severity": "HIGH",
    "description": "Evidence of systematic tax evasion",
    "evidenceHash": "a3f7e92b1c4d8e6f5a9b2c1d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f",
    "evidence": {
      "photos": [
        "/uploads/photo_1697123456789_a3f7e92b1c4d8e6f.jpg",
        "/uploads/photo_1697123456790_b4e8f03c2d5e9a7g.jpg"
      ],
      "documents": [
        "/uploads/document_1697123456791_c5f9g14d3e6f0b8h.pdf"
      ],
      "videos": []
    },
    "estimatedAmount": "500000",
    "location": "Lusaka"
  }'
```

## Error Handling

### Common Errors

| Status Code | Error | Cause |
|-------------|-------|-------|
| 400 | Invalid or missing type parameter | Type field missing or not one of: photo, document, video |
| 400 | No files uploaded | No files in the request |
| 400 | Invalid file extension | File type not allowed for the specified category |
| 400 | File too large | File exceeds maximum size limit |
| 400 | Executable files are not allowed | Attempted to upload .exe, .bat, .sh, etc. |
| 404 | File not found | Requested file doesn't exist |
| 500 | Internal server error | Server-side processing error |

## Server Configuration

### Starting the Server

The upload API is part of the blockchain API server:

```bash
cd blockchain
npm install
npm start
```

Server runs on: `http://localhost:3001`

### Environment Variables

No additional environment variables needed. The API uses existing Express configuration.

### Storage Location

Uploaded files are stored in: `blockchain/uploads/`

This directory is git-ignored to prevent committing sensitive evidence files.

## Production Recommendations

### 1. Authentication
Consider adding API key authentication for production:
```javascript
router.post('/', authenticateApiKey, upload.array('files', 10), ...)
```

### 2. Cloud Storage
For production, consider using cloud storage (AWS S3, Azure Blob, etc.) instead of local filesystem:
```javascript
const storage = multer.memoryStorage();
// Then upload to S3 after processing
```

### 3. Encryption
Encrypt files at rest:
```javascript
const cipher = crypto.createCipher('aes-256-cbc', encryptionKey);
```

### 4. Database Integration
Store file metadata in a database instead of returning URLs directly:
```javascript
await db.files.insert({
  reportId,
  filename,
  url,
  uploadedAt: new Date()
});
```

### 5. Rate Limiting
Add stricter rate limiting for uploads:
```javascript
const uploadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10 // Only 10 uploads per 15 minutes
});
router.post('/', uploadLimiter, ...);
```

### 6. Virus Scanning
Integrate virus scanning for uploaded files:
```javascript
const clamav = require('clamav.js');
await clamav.scanFile(filePath);
```

### 7. CDN Integration
Serve uploaded files through a CDN for better performance and security.

## Support

For issues or questions, contact the development team or create an issue in the repository.

## API Version

Version: 1.0.0
Last Updated: 2025-10-12
