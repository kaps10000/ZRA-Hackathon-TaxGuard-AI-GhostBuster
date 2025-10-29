# WhistlePro File Upload API Documentation

## Overview

The WhistlePro Upload API allows users to securely upload evidence files (documents, images, videos) that can be attached to whistleblower reports. Files are stored securely on the server and metadata is saved in the database.

## Base URL

```
http://localhost:4000/api/upload
```

---

## Upload Endpoint

### Upload Files

**Endpoint:** `POST /api/upload`

**Description:** Upload one or multiple files to the server. Files are validated, stored securely, and metadata is saved in the database.

**Content-Type:** `multipart/form-data`

**Rate Limit:** 20 requests per 15 minutes per IP

**Request Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `files` | File[] | Yes | One or more files (max 10 files) |

**File Restrictions:**
- **Max file size:** 10MB per file
- **Max files per request:** 10
- **Allowed file types:**
  - Documents: PDF, DOC, DOCX
  - Images: JPG, JPEG, PNG
  - Videos: MP4, MOV

**Example Request (JavaScript):**

```javascript
const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');

const formData = new FormData();

// Single file
formData.append('files', fs.createReadStream('/path/to/document.pdf'));

// Multiple files
formData.append('files', fs.createReadStream('/path/to/photo1.jpg'));
formData.append('files', fs.createReadStream('/path/to/photo2.jpg'));

const response = await axios.post('http://localhost:4000/api/upload', formData, {
  headers: formData.getHeaders()
});
```

**Example Request (cURL):**

```bash
curl -X POST http://localhost:4000/api/upload \
  -F "files=@/path/to/document.pdf" \
  -F "files=@/path/to/photo.jpg"
```

**Example Request (HTML Form):**

```html
<form action="http://localhost:4000/api/upload" method="POST" enctype="multipart/form-data">
  <input type="file" name="files" multiple accept=".pdf,.jpg,.jpeg,.png,.doc,.docx,.mp4,.mov">
  <button type="submit">Upload</button>
</form>
```

**Success Response (201 Created):**

```json
{
  "success": true,
  "message": "2 file(s) uploaded successfully",
  "data": {
    "files": [
      {
        "file_id": "FILE-1730211234567-A1B2C3D4",
        "original_name": "invoice_2024.pdf",
        "file_type": "document",
        "file_size": 2458963,
        "mime_type": "application/pdf",
        "uploaded_at": "2025-10-29T14:35:45.678Z",
        "metadata": null
      },
      {
        "file_id": "FILE-1730211234789-E5F6G7H8",
        "original_name": "evidence_photo.jpg",
        "file_type": "image",
        "file_size": 1234567,
        "mime_type": "image/jpeg",
        "uploaded_at": "2025-10-29T14:35:45.890Z",
        "metadata": {
          "width": 1920,
          "height": 1080,
          "format": "jpeg"
        }
      }
    ],
    "total": 2
  }
}
```

**Error Responses:**

**400 - No Files Uploaded**
```json
{
  "success": false,
  "error": {
    "message": "No files uploaded",
    "code": "NO_FILES"
  }
}
```

**400 - Invalid File Type**
```json
{
  "success": false,
  "error": {
    "message": "File type text/plain is not allowed. Allowed types: PDF, JPG, PNG, DOC, DOCX, MP4, MOV",
    "code": "UPLOAD_ERROR"
  }
}
```

**400 - File Too Large**
```json
{
  "success": false,
  "error": {
    "message": "File too large. Maximum size is 10MB",
    "code": "FILE_TOO_LARGE"
  }
}
```

**400 - Too Many Files**
```json
{
  "success": false,
  "error": {
    "message": "Too many files. Maximum is 10 files per upload",
    "code": "TOO_MANY_FILES"
  }
}
```

**429 - Rate Limit Exceeded**
```json
{
  "success": false,
  "error": "Too many upload requests from this IP, please try again later.",
  "retryAfter": 900
}
```

---

## Get File Metadata

### Get File by ID

**Endpoint:** `GET /api/upload/:fileId`

**Description:** Retrieve metadata for a specific file using its file ID.

**URL Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `fileId` | string | Yes | Unique file ID (format: FILE-TIMESTAMP-HASH) |

**Example Request:**

```javascript
const fileId = 'FILE-1730211234567-A1B2C3D4';
const response = await axios.get(`http://localhost:4000/api/upload/${fileId}`);
```

**Success Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "file_id": "FILE-1730211234567-A1B2C3D4",
    "original_name": "invoice_2024.pdf",
    "file_type": "document",
    "file_size": 2458963,
    "mime_type": "application/pdf",
    "file_path": "/path/to/uploads/1730211234567_a1b2c3d4.pdf",
    "uploaded_at": "2025-10-29T14:35:45.678Z",
    "metadata": null
  }
}
```

**Error Response (404 Not Found):**

```json
{
  "success": false,
  "error": {
    "message": "File not found",
    "code": "FILE_NOT_FOUND"
  }
}
```

---

## Download File

### Download File by ID

**Endpoint:** `GET /api/upload/:fileId/download`

**Description:** Download the actual file content using its file ID.

**URL Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `fileId` | string | Yes | Unique file ID |

**Example Request:**

```javascript
// Download using axios
const fileId = 'FILE-1730211234567-A1B2C3D4';
const response = await axios.get(
  `http://localhost:4000/api/upload/${fileId}/download`,
  { responseType: 'blob' }
);

// Save file
const blob = new Blob([response.data]);
const link = document.createElement('a');
link.href = window.URL.createObjectURL(blob);
link.download = 'downloaded-file.pdf';
link.click();
```

**Example Request (cURL):**

```bash
curl -O -J http://localhost:4000/api/upload/FILE-1730211234567-A1B2C3D4/download
```

**Success Response:**

- **Status:** 200 OK
- **Headers:**
  - `Content-Type`: Original file MIME type (e.g., `application/pdf`)
  - `Content-Disposition`: `attachment; filename="invoice_2024.pdf"`
  - `Content-Length`: File size in bytes
- **Body:** Binary file data

**Error Response (404 Not Found):**

```json
{
  "success": false,
  "error": {
    "message": "File not found on server",
    "code": "FILE_MISSING"
  }
}
```

---

## Delete File

### Delete File by ID

**Endpoint:** `DELETE /api/upload/:fileId`

**Description:** Delete a file from both the database and server storage.

**URL Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `fileId` | string | Yes | Unique file ID |

**Example Request:**

```javascript
const fileId = 'FILE-1730211234567-A1B2C3D4';
const response = await axios.delete(`http://localhost:4000/api/upload/${fileId}`);
```

**Success Response (200 OK):**

```json
{
  "success": true,
  "message": "File deleted successfully",
  "data": {
    "file_id": "FILE-1730211234567-A1B2C3D4"
  }
}
```

**Error Response (404 Not Found):**

```json
{
  "success": false,
  "error": {
    "message": "File not found",
    "code": "FILE_NOT_FOUND"
  }
}
```

---

## Integration with Reports

### Using Uploaded Files in Reports

After uploading files, you can reference them in your report submission using the returned `file_id` values:

**Step 1: Upload Files**

```javascript
// Upload evidence files
const formData = new FormData();
formData.append('files', document1);
formData.append('files', photo1);
formData.append('files', photo2);

const uploadResponse = await axios.post('http://localhost:4000/api/upload', formData, {
  headers: formData.getHeaders()
});

// Extract file IDs
const fileIds = uploadResponse.data.data.files.map(f => f.file_id);
// Result: ['FILE-xxx-A1B2', 'FILE-xxx-C3D4', 'FILE-xxx-E5F6']
```

**Step 2: Submit Report with File References**

```javascript
const reportData = {
  category: 'tax_evasion',
  title: 'Company Underreporting Revenue',
  description: 'Detailed description...',
  priority: 'high',
  evidence: {
    documents: [fileIds[0]], // Reference uploaded document
    photos: [fileIds[1], fileIds[2]], // Reference uploaded photos
    financial_details: {
      estimated_amount: 2500000,
      currency: 'ZMW',
      frequency: 'yearly'
    }
  },
  subjects: {
    organizations: [{
      name: 'ABC Company Ltd',
      tpin: '1002345678'
    }]
  }
};

const reportResponse = await axios.post('http://localhost:4000/api/reports', reportData);
```

**Complete Example:**

```javascript
async function submitReportWithFiles() {
  try {
    // 1. Upload files first
    const formData = new FormData();
    formData.append('files', fs.createReadStream('./evidence.pdf'));
    formData.append('files', fs.createReadStream('./photo.jpg'));

    const uploadRes = await axios.post('http://localhost:4000/api/upload', formData, {
      headers: formData.getHeaders()
    });

    const fileIds = uploadRes.data.data.files.map(f => f.file_id);

    // 2. Submit report with file IDs
    const reportData = {
      category: 'fraud',
      title: 'VAT Fraud Scheme',
      description: 'Evidence of fraudulent VAT refund claims...',
      priority: 'high',
      evidence: {
        documents: [fileIds[0]],
        photos: [fileIds[1]]
      }
    };

    const reportRes = await axios.post('http://localhost:4000/api/reports', reportData);

    console.log('Report submitted:', reportRes.data.data.case_id);
    console.log('With attachments:', fileIds);
  } catch (error) {
    console.error('Error:', error.response?.data || error.message);
  }
}
```

---

## Database Schema

### Attachments Table

The `attachments` table stores file metadata:

| Column | Type | Description |
|--------|------|-------------|
| `id` | INTEGER | Primary key |
| `file_id` | VARCHAR(50) | Unique file identifier (FILE-TIMESTAMP-HASH) |
| `report_id` | INTEGER | Foreign key to reports table (nullable) |
| `original_name` | VARCHAR(255) | Original filename |
| `stored_name` | VARCHAR(255) | Generated filename on server |
| `mime_type` | VARCHAR(100) | File MIME type |
| `file_size` | INTEGER | File size in bytes |
| `file_path` | VARCHAR(500) | Full path to file on server |
| `file_type` | ENUM | Category: 'document', 'image', 'video', 'other' |
| `file_hash` | VARCHAR(64) | SHA-256 hash for integrity |
| `is_encrypted` | BOOLEAN | Whether file is encrypted |
| `metadata` | TEXT | JSON metadata (dimensions for images, etc.) |
| `uploaded_at` | TIMESTAMP | Upload timestamp |
| `created_at` | TIMESTAMP | Record creation timestamp |

---

## File Processing Features

### Image Optimization

Images larger than 1920px width are automatically optimized:
- Resized to max 1920px width (maintains aspect ratio)
- Compressed with 85% JPEG quality
- Original file is replaced with optimized version
- Metadata includes image dimensions

### File Integrity

- **SHA-256 Hash:** Every file has a unique hash for integrity verification
- **Unique IDs:** Each file gets a unique ID (FILE-TIMESTAMP-HASH)
- **Duplicate Detection:** Can compare hashes to detect duplicate uploads

### Security Features

1. **File Type Validation:** Only allowed MIME types are accepted
2. **Size Limits:** Maximum 10MB per file
3. **Filename Sanitization:** Files stored with generated names to prevent attacks
4. **Upload Rate Limiting:** 20 requests per 15 minutes per IP
5. **Isolated Storage:** Files stored outside web root directory

---

## Testing

### Test Upload Endpoint

```bash
# Create a test PDF (using echo to create a simple file)
echo "Test document content" > test.txt

# Try uploading (should fail - text not allowed)
curl -X POST http://localhost:4000/api/upload \
  -F "files=@test.txt"

# Upload a valid PDF
curl -X POST http://localhost:4000/api/upload \
  -F "files=@/path/to/document.pdf"
```

### Test with Postman

1. **POST** to `http://localhost:4000/api/upload`
2. Select **Body** → **form-data**
3. Add key `files` with type **File**
4. Select one or more files
5. Send request
6. Note the `file_id` values in response
7. Test download: **GET** to `http://localhost:4000/api/upload/{file_id}/download`

---

## Error Handling Best Practices

```javascript
async function uploadWithErrorHandling(files) {
  try {
    const formData = new FormData();
    files.forEach(file => formData.append('files', file));

    const response = await axios.post('http://localhost:4000/api/upload', formData, {
      headers: formData.getHeaders(),
      maxContentLength: Infinity,
      maxBodyLength: Infinity
    });

    return response.data.data.files;

  } catch (error) {
    if (error.response) {
      switch (error.response.status) {
        case 400:
          if (error.response.data.error.code === 'FILE_TOO_LARGE') {
            throw new Error('File is too large. Maximum size is 10MB');
          }
          if (error.response.data.error.code === 'TOO_MANY_FILES') {
            throw new Error('Too many files. Maximum is 10 files per upload');
          }
          throw new Error(error.response.data.error.message);

        case 429:
          throw new Error('Upload limit reached. Please try again in 15 minutes');

        case 500:
          throw new Error('Server error. Please try again later');

        default:
          throw new Error('Upload failed: ' + error.response.data.error.message);
      }
    } else if (error.request) {
      throw new Error('No response from server. Check your connection');
    } else {
      throw new Error('Upload error: ' + error.message);
    }
  }
}
```

---

## React Integration Example

```jsx
import React, { useState } from 'react';
import axios from 'axios';

const FileUploader = () => {
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [error, setError] = useState(null);

  const handleFileChange = (e) => {
    setFiles(Array.from(e.target.files));
  };

  const handleUpload = async () => {
    if (files.length === 0) {
      setError('Please select files to upload');
      return;
    }

    setUploading(true);
    setError(null);

    const formData = new FormData();
    files.forEach(file => formData.append('files', file));

    try {
      const response = await axios.post(
        'http://localhost:4000/api/upload',
        formData,
        {
          headers: { 'Content-Type': 'multipart/form-data' },
          onUploadProgress: (progressEvent) => {
            const percentCompleted = Math.round(
              (progressEvent.loaded * 100) / progressEvent.total
            );
            console.log(`Upload progress: ${percentCompleted}%`);
          }
        }
      );

      setUploadedFiles(response.data.data.files);
      setFiles([]);
      alert('Files uploaded successfully!');

    } catch (err) {
      setError(err.response?.data?.error?.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div>
      <h2>Upload Evidence Files</h2>

      <input
        type="file"
        multiple
        accept=".pdf,.jpg,.jpeg,.png,.doc,.docx,.mp4,.mov"
        onChange={handleFileChange}
        disabled={uploading}
      />

      <button onClick={handleUpload} disabled={uploading || files.length === 0}>
        {uploading ? 'Uploading...' : 'Upload Files'}
      </button>

      {error && <div style={{color: 'red'}}>{error}</div>}

      {uploadedFiles.length > 0 && (
        <div>
          <h3>Uploaded Files:</h3>
          <ul>
            {uploadedFiles.map(file => (
              <li key={file.file_id}>
                {file.original_name} ({(file.file_size / 1024).toFixed(2)} KB)
                <br />
                File ID: {file.file_id}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default FileUploader;
```

---

## Summary

✅ **Implemented Features:**
- File upload endpoint with multiple file support
- File type validation (PDF, JPG, PNG, DOC, DOCX, MP4, MOV)
- File size limits (10MB per file)
- Automatic image optimization
- File metadata storage in database
- File download endpoint
- File deletion endpoint
- SHA-256 hash for integrity
- Rate limiting (20 uploads per 15 min)
- Secure file storage

🔐 **Security:**
- Only allowed file types accepted
- Files stored with generated names
- Rate limiting prevents abuse
- File size limits prevent DoS
- Files stored outside web root

📊 **Database:**
- All file metadata saved to `attachments` table
- Files can be linked to reports via `report_id`
- SHA-256 hash for duplicate detection
- Full audit trail with timestamps

---

For questions or issues, check the WhistlePro backend logs or contact the development team.
