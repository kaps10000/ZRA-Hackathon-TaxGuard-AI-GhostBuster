# Document & Photo Upload Implementation

## Summary

Complete file upload functionality has been added to the WhistlePro backend, allowing users to upload documents and photos as evidence for whistleblower reports.

---

## What's Been Implemented

### 1. File Upload Middleware (`src/middleware/upload.js`)
- Multer configuration for handling multipart/form-data
- File type validation (PDF, Word, Excel, CSV, Images)
- File size limits (10 MB for documents, 5 MB for images)
- Automatic file storage with unique filenames
- Error handling for upload failures

### 2. Document Controller (`src/controllers/documentController.js`)
- **Upload files**: Process and store uploaded files in database
- **Get document metadata**: Retrieve document information by ID
- **Download/view files**: Stream files to clients
- **List documents**: Paginated listing with filters
- **Delete documents**: Remove files from storage and database
- **Get statistics**: Document storage and status stats
- **Duplicate detection**: SHA-256 hash-based duplicate prevention
- **Image optimization**: Automatic resize for large images

### 3. Document Routes (`src/routes/documentRoutes.js`)
- `POST /api/documents/upload` - Upload files
- `GET /api/documents` - List documents
- `GET /api/documents/:documentId` - Get document metadata
- `GET /api/documents/:documentId/file` - Download/view file
- `DELETE /api/documents/:documentId` - Delete document
- `GET /api/documents/stats` - Get upload statistics

### 4. Server Integration (`src/server.js`)
- Updated to use proper database-backed routes
- Integrated document routes
- Proper error handling and middleware configuration

### 5. Directory Structure
```
whistlepro_backend/
├── uploads/
│   ├── documents/    # Stores uploaded documents
│   ├── photos/       # Stores uploaded photos
│   └── temp/         # Temporary storage
├── src/
│   ├── middleware/
│   │   └── upload.js           # File upload middleware
│   ├── controllers/
│   │   └── documentController.js  # Document operations
│   └── routes/
│       └── documentRoutes.js      # Document API routes
```

### 6. Documentation
- **DOCUMENT_UPLOAD_API.md**: Complete API documentation with examples
- **test-upload.html**: Interactive HTML test page for uploads
- **.gitignore**: Configured to exclude uploaded files from git

---

## Database Integration

Files are stored in the `ocr.documents` table with the following information:
- Document ID (unique identifier)
- File metadata (name, size, type, hash)
- Upload information (timestamp, uploader)
- Processing status
- OCR data (ready for future integration)
- Risk scoring fields
- Blockchain integration fields

---

## Features

### ✅ Security
- File type validation
- File size limits
- Rate limiting (10 uploads per 15 minutes)
- Duplicate detection via SHA-256 hashing
- Secure filename generation
- IP address hashing for privacy

### ✅ Performance
- Automatic image optimization
- Streaming file downloads
- Duplicate file prevention
- Indexed database queries

### ✅ User Experience
- Support for multiple file uploads (up to 10 at once)
- Progress tracking support
- Clear error messages
- Duplicate file notifications

---

## Quick Start

### 1. Test the Upload API

Open `test-upload.html` in your browser:
```bash
# Open in default browser (Windows)
start test-upload.html

# Or manually open: http://localhost:4000/test-upload.html
# Note: You need to serve this file or use file:// protocol
```

### 2. Upload Files via API

**Using cURL:**
```bash
curl -X POST http://localhost:4000/api/documents/upload \
  -F "files=@/path/to/document.pdf" \
  -F "files=@/path/to/photo.jpg"
```

**Using JavaScript:**
```javascript
const formData = new FormData();
formData.append('files', fileInput.files[0]);

const response = await fetch('http://localhost:4000/api/documents/upload', {
  method: 'POST',
  body: formData
});

const result = await response.json();
console.log(result.data.documents); // Array of uploaded document IDs
```

### 3. Integrate with Reports

```javascript
// Step 1: Upload evidence files
const uploadResponse = await fetch('http://localhost:4000/api/documents/upload', {
  method: 'POST',
  body: formData
});
const uploadData = await uploadResponse.json();
const documentIds = uploadData.data.documents.map(d => d.document_id);

// Step 2: Submit report with document IDs
const reportData = {
  category: 'tax_evasion',
  title: 'Report with evidence',
  description: 'Detailed description...',
  evidence: {
    documents: documentIds  // Link uploaded documents to report
  }
};

await fetch('http://localhost:4000/api/reports', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(reportData)
});
```

---

## API Endpoints

### Upload Files
```http
POST /api/documents/upload
Content-Type: multipart/form-data

files: [File, File, ...]
```

**Response:**
```json
{
  "success": true,
  "message": "Successfully uploaded 2 file(s)",
  "data": {
    "documents": [
      {
        "document_id": "DOC-1728567890123-A1B2C3D4",
        "filename": "1728567890123-abc123def456.pdf",
        "original_name": "invoice.pdf",
        "file_size": 245632,
        "mime_type": "application/pdf",
        "uploaded_at": "2025-10-28T10:30:00.000Z",
        "status": "PENDING",
        "duplicate": false
      }
    ],
    "total": 2
  }
}
```

### Get Document
```http
GET /api/documents/:documentId
```

### View/Download File
```http
GET /api/documents/:documentId/file
```

### List Documents
```http
GET /api/documents?page=1&limit=20&status=VERIFIED
```

### Delete Document
```http
DELETE /api/documents/:documentId
```

### Get Statistics
```http
GET /api/documents/stats
```

---

## File Types & Limits

### Supported File Types

**Documents:**
- PDF (`.pdf`)
- Microsoft Word (`.doc`, `.docx`)
- Microsoft Excel (`.xls`, `.xlsx`)
- Text (`.txt`)
- CSV (`.csv`)

**Images:**
- JPEG (`.jpg`, `.jpeg`)
- PNG (`.png`)
- WebP (`.webp`)
- HEIC/HEIF (`.heic`, `.heif`)

### Size Limits
- **Documents:** 10 MB per file
- **Images:** 5 MB per file
- **Maximum files per request:** 10 files

---

## Testing

### Test with HTML Page
1. Open `test-upload.html` in a browser
2. Select files (PDF, images, etc.)
3. Click "Upload Files"
4. View results with document IDs

### Test with cURL
```bash
# Single file
curl -X POST http://localhost:4000/api/documents/upload \
  -F "files=@test.pdf"

# Multiple files
curl -X POST http://localhost:4000/api/documents/upload \
  -F "files=@invoice.pdf" \
  -F "files=@receipt.jpg" \
  -F "files=@evidence.png"

# Get document metadata
curl http://localhost:4000/api/documents/DOC-1728567890123-A1B2C3D4

# Download file
curl http://localhost:4000/api/documents/DOC-1728567890123-A1B2C3D4/file -o downloaded_file.pdf

# List all documents
curl http://localhost:4000/api/documents

# Get statistics
curl http://localhost:4000/api/documents/stats
```

---

## Error Handling

### Common Errors

**400 - No Files Uploaded**
```json
{
  "success": false,
  "error": {
    "message": "No files uploaded.",
    "code": "NO_FILES"
  }
}
```

**400 - Invalid File Type**
```json
{
  "success": false,
  "error": {
    "message": "Invalid file type: application/zip. Allowed types: PDF, Word, Excel, Text, CSV, and common image formats.",
    "code": "UPLOAD_ERROR"
  }
}
```

**400 - File Too Large**
```json
{
  "success": false,
  "error": {
    "message": "File too large. Maximum size is 10 MB.",
    "code": "FILE_TOO_LARGE"
  }
}
```

**429 - Rate Limit Exceeded**
```json
{
  "error": "Too many upload requests, please try again later.",
  "retryAfter": 900
}
```

---

## Database Schema

Files are stored in the `ocr.documents` table:

| Field | Type | Description |
|-------|------|-------------|
| document_id | varchar(100) | Unique document identifier |
| filename | varchar(255) | Stored filename |
| original_name | varchar(255) | Original upload filename |
| file_path | varchar(500) | Path to stored file |
| file_size | bigint | File size in bytes |
| mime_type | varchar(100) | File MIME type |
| file_hash | varchar(64) | SHA-256 hash for duplicates |
| uploaded_at | timestamp | Upload timestamp |
| uploaded_by | varchar(100) | Uploader identifier |
| status | enum | Processing status |
| metadata | jsonb | Additional metadata |
| ocr_data | jsonb | OCR extraction results |
| risk_score | decimal | Risk assessment score |
| verification_status | enum | Verification status |

---

## Next Steps

### Recommended Enhancements

1. **OCR Integration**
   - Extract text from uploaded documents
   - Store OCR data in `ocr_data` field
   - Enable text search across documents

2. **Virus Scanning**
   - Integrate ClamAV or similar
   - Scan files before storage
   - Quarantine suspicious files

3. **Cloud Storage**
   - Integrate AWS S3 or similar
   - Store files in cloud instead of local disk
   - Better scalability and backup

4. **Thumbnails**
   - Generate thumbnails for images
   - PDF preview images
   - Faster preview loading

5. **Access Control**
   - Implement document permissions
   - Investigator-only access
   - Audit trail for file access

6. **Encryption**
   - Encrypt files at rest
   - End-to-end encryption option
   - Enhanced security for sensitive documents

---

## Troubleshooting

### Issue: Files not uploading
- Check that server is running on port 4000
- Verify file types are supported
- Check file size limits
- Ensure `uploads/` directory exists

### Issue: "Cannot POST /api/documents/upload"
- Server not running or wrong port
- Check CORS configuration
- Verify route is registered in server.js

### Issue: Rate limit exceeded
- Wait 15 minutes between upload batches
- Or adjust rate limit in `documentRoutes.js`

### Issue: Duplicate files always detected
- This is a feature, not a bug
- Prevents storage waste
- Returns existing document ID

---

## Dependencies

Required packages (already in package.json):
- `multer` - File upload handling
- `sharp` - Image processing
- `knex` & `pg` - Database operations
- `express` - Web framework

---

## Security Considerations

1. **File Validation**: Only allowed file types can be uploaded
2. **Size Limits**: Prevents storage abuse and DoS attacks
3. **Rate Limiting**: 10 uploads per 15 minutes per IP
4. **Filename Security**: Random generated names prevent path traversal
5. **Duplicate Prevention**: SHA-256 hashing prevents redundant storage
6. **IP Hashing**: Privacy protection for anonymous uploads
7. **CORS**: Configured origins prevent unauthorized access

---

## Documentation Files

- **DOCUMENT_UPLOAD_API.md**: Complete API reference with examples
- **DOCUMENT_UPLOAD_README.md**: This file - implementation overview
- **API_DOCUMENTATION.md**: Main API documentation (reports)
- **test-upload.html**: Interactive test page

---

**Implementation Date:** October 28, 2025
**Implemented by:** Claude Code
**Status:** ✅ Ready for Production (after testing)
