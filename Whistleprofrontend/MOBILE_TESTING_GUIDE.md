# Mobile App Testing Guide

## Quick Setup for Mobile Testing

### Step 1: Find Your Computer's IP Address

**Windows:**
```bash
ipconfig
```
Look for "IPv4 Address" under your active network adapter (e.g., `192.168.1.100`)

**Mac/Linux:**
```bash
ifconfig
# or
hostname -I
```

### Step 2: Make Sure Backend is Running

```bash
cd whistlepro_backend
npm run dev
```

Server should start on port 4000.

### Step 3: Update Mobile App API URL

**❌ Don't use:**
```
http://localhost:4000
```

**✅ Use your computer's IP:**
```
http://192.168.1.100:4000
```
(Replace with YOUR actual IP address)

### Step 4: Ensure Same Network

Both your computer and mobile device must be on the **same Wi-Fi network**.

---

## API Endpoints for Mobile App

### Base URL
```
http://YOUR_COMPUTER_IP:4000
```

### File Upload Endpoint
```
POST http://192.168.1.100:4000/api/documents/upload
Content-Type: multipart/form-data
```

---

## Mobile App Implementation Examples

### React Native Example

```javascript
import React, { useState } from 'react';
import { View, Button, Text } from 'react-native';
import DocumentPicker from 'react-native-document-picker';

// Replace with YOUR computer's IP address
const API_BASE_URL = 'http://192.168.1.100:4000';

function FileUpload() {
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState(null);

  const pickAndUploadFiles = async () => {
    try {
      // Pick files
      const results = await DocumentPicker.pick({
        type: [
          DocumentPicker.types.pdf,
          DocumentPicker.types.images,
          DocumentPicker.types.doc,
          DocumentPicker.types.xls,
        ],
        allowMultiSelection: true,
        copyTo: 'cachesDirectory',
      });

      setUploading(true);

      // Create FormData
      const formData = new FormData();

      results.forEach((file) => {
        formData.append('files', {
          uri: file.fileCopyUri || file.uri,
          type: file.type,
          name: file.name,
        });
      });

      // Upload to backend
      const response = await fetch(`${API_BASE_URL}/api/documents/upload`, {
        method: 'POST',
        body: formData,
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      const data = await response.json();

      if (data.success) {
        setResult(`✅ Uploaded ${data.data.total} files`);
        console.log('Document IDs:', data.data.documents);
      } else {
        setResult(`❌ Error: ${data.error.message}`);
      }

    } catch (err) {
      if (DocumentPicker.isCancel(err)) {
        console.log('User cancelled');
      } else {
        setResult(`❌ Upload failed: ${err.message}`);
      }
    } finally {
      setUploading(false);
    }
  };

  return (
    <View>
      <Button
        title={uploading ? 'Uploading...' : 'Pick & Upload Files'}
        onPress={pickAndUploadFiles}
        disabled={uploading}
      />
      {result && <Text>{result}</Text>}
    </View>
  );
}

export default FileUpload;
```

### Using `react-native-image-picker` for Photos

```javascript
import { launchImageLibrary } from 'react-native-image-picker';

const API_BASE_URL = 'http://192.168.1.100:4000';

const uploadPhoto = async () => {
  const result = await launchImageLibrary({
    mediaType: 'photo',
    selectionLimit: 5, // Allow multiple photos
    quality: 0.8,
  });

  if (result.didCancel) return;

  const formData = new FormData();

  result.assets.forEach((asset) => {
    formData.append('files', {
      uri: asset.uri,
      type: asset.type,
      name: asset.fileName,
    });
  });

  try {
    const response = await fetch(`${API_BASE_URL}/api/documents/upload`, {
      method: 'POST',
      body: formData,
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    const data = await response.json();
    console.log('Upload result:', data);
    return data;

  } catch (error) {
    console.error('Upload failed:', error);
    throw error;
  }
};
```

### Complete Report Submission with Files

```javascript
const API_BASE_URL = 'http://192.168.1.100:4000';

async function submitReportWithEvidence(reportData, files) {
  try {
    // Step 1: Upload files
    const formData = new FormData();
    files.forEach((file) => {
      formData.append('files', {
        uri: file.uri,
        type: file.type,
        name: file.name,
      });
    });

    const uploadResponse = await fetch(`${API_BASE_URL}/api/documents/upload`, {
      method: 'POST',
      body: formData,
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    const uploadData = await uploadResponse.json();

    if (!uploadData.success) {
      throw new Error(uploadData.error.message);
    }

    // Extract document IDs
    const documentIds = uploadData.data.documents.map(doc => doc.document_id);

    // Step 2: Submit report with document IDs
    const report = {
      ...reportData,
      evidence: {
        ...reportData.evidence,
        documents: documentIds,
      },
    };

    const reportResponse = await fetch(`${API_BASE_URL}/api/reports`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(report),
    });

    const reportResult = await reportResponse.json();

    if (reportResult.success) {
      return {
        success: true,
        caseId: reportResult.data.case_id,
        uploadedFiles: uploadData.data.documents,
      };
    } else {
      throw new Error(reportResult.error.message);
    }

  } catch (error) {
    console.error('Submission failed:', error);
    throw error;
  }
}

// Usage
const result = await submitReportWithEvidence(
  {
    category: 'tax_evasion',
    title: 'Tax Evasion Report',
    description: 'Detailed description...',
    priority: 'high',
  },
  selectedFiles
);

console.log('Case ID:', result.caseId);
```

---

## Flutter Example

```dart
import 'package:http/http.dart' as http;
import 'package:file_picker/file_picker.dart';
import 'dart:io';

const String apiBaseUrl = 'http://192.168.1.100:4000';

Future<Map<String, dynamic>> uploadFiles(List<File> files) async {
  var request = http.MultipartRequest(
    'POST',
    Uri.parse('$apiBaseUrl/api/documents/upload'),
  );

  // Add files to request
  for (var file in files) {
    request.files.add(
      await http.MultipartFile.fromPath(
        'files',
        file.path,
      ),
    );
  }

  // Send request
  var streamedResponse = await request.send();
  var response = await http.Response.fromStream(streamedResponse);

  if (response.statusCode == 201) {
    return jsonDecode(response.body);
  } else {
    throw Exception('Upload failed: ${response.body}');
  }
}

// Usage
Future<void> pickAndUpload() async {
  FilePickerResult? result = await FilePicker.platform.pickFiles(
    allowMultiple: true,
    type: FileType.custom,
    allowedExtensions: ['pdf', 'doc', 'docx', 'jpg', 'png'],
  );

  if (result != null) {
    List<File> files = result.paths.map((path) => File(path!)).toList();

    try {
      var uploadResult = await uploadFiles(files);
      print('Uploaded: ${uploadResult['data']['total']} files');
      print('Document IDs: ${uploadResult['data']['documents']}');
    } catch (e) {
      print('Upload error: $e');
    }
  }
}
```

---

## Expo (React Native) Example

```javascript
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';

const API_BASE_URL = 'http://192.168.1.100:4000';

async function uploadFilesExpo() {
  try {
    // Pick files
    const result = await DocumentPicker.getDocumentAsync({
      type: [
        'application/pdf',
        'image/*',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      ],
      multiple: true,
    });

    if (result.type === 'cancel') return;

    // Upload using fetch
    const formData = new FormData();

    if (result.type === 'success') {
      formData.append('files', {
        uri: result.uri,
        type: result.mimeType || 'application/octet-stream',
        name: result.name,
      });
    }

    const response = await fetch(`${API_BASE_URL}/api/documents/upload`, {
      method: 'POST',
      body: formData,
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    const data = await response.json();
    console.log('Upload result:', data);
    return data;

  } catch (error) {
    console.error('Upload error:', error);
    throw error;
  }
}
```

---

## Testing Steps

### 1. Test Backend Connectivity

Before uploading files, test if your mobile app can reach the backend:

```javascript
const API_BASE_URL = 'http://192.168.1.100:4000';

async function testConnection() {
  try {
    const response = await fetch(`${API_BASE_URL}/health`);
    const data = await response.json();
    console.log('✅ Backend connected:', data);
    return true;
  } catch (error) {
    console.error('❌ Cannot reach backend:', error.message);
    return false;
  }
}
```

### 2. Test File Upload

Try uploading a small file first:

```javascript
async function testUpload() {
  const formData = new FormData();
  formData.append('files', {
    uri: 'file:///path/to/test.jpg',
    type: 'image/jpeg',
    name: 'test.jpg',
  });

  const response = await fetch(`${API_BASE_URL}/api/documents/upload`, {
    method: 'POST',
    body: formData,
  });

  const result = await response.json();
  console.log('Upload result:', result);
}
```

### 3. Check Uploaded Files

```javascript
async function getUploadedFiles() {
  const response = await fetch(`${API_BASE_URL}/api/documents`);
  const data = await response.json();
  console.log('Uploaded files:', data.data);
}
```

---

## Troubleshooting

### Issue: "Network request failed" or "Cannot connect"

**Solutions:**
1. Make sure both devices are on the **same Wi-Fi network**
2. Check if backend is running: `npm run dev`
3. Verify IP address is correct (run `ipconfig` again)
4. Try accessing `http://YOUR_IP:4000/health` in mobile browser
5. Check firewall isn't blocking port 4000

### Issue: "CORS error"

**Solution:** The backend is now configured to allow all origins in development mode (already fixed above).

### Issue: "File too large"

**Limits:**
- Documents: 10 MB max
- Photos: 5 MB max
- Reduce image quality before upload if needed

### Issue: "Invalid file type"

**Supported types:**
- Documents: PDF, Word, Excel, CSV, Text
- Photos: JPG, PNG, WebP, HEIC

### Issue: Rate limit exceeded

**Solution:** You can only upload 10 times per 15 minutes. Wait or adjust rate limit in `documentRoutes.js`.

---

## Firewall Configuration (Windows)

If mobile device can't connect, you may need to allow port 4000:

1. Open **Windows Defender Firewall**
2. Click **Advanced settings**
3. Click **Inbound Rules** → **New Rule**
4. Select **Port** → Click **Next**
5. Select **TCP** → Enter **4000** → Click **Next**
6. Select **Allow the connection** → Click **Next**
7. Check all profiles → Click **Next**
8. Name it "WhistlePro Backend" → Click **Finish**

---

## Test Checklist

- [ ] Find computer's IP address
- [ ] Backend running on port 4000
- [ ] Mobile device on same Wi-Fi
- [ ] Test `/health` endpoint in mobile browser
- [ ] Test file upload with DocumentPicker
- [ ] Verify uploaded files via `/api/documents`
- [ ] Submit complete report with files
- [ ] Check report has document IDs

---

## API Response Examples

### Successful Upload

```json
{
  "success": true,
  "message": "Successfully uploaded 2 file(s)",
  "data": {
    "documents": [
      {
        "document_id": "DOC-1728567890123-A1B2C3D4",
        "filename": "1728567890123-abc123.pdf",
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

### Failed Upload

```json
{
  "success": false,
  "error": {
    "message": "File too large. Maximum size is 10 MB.",
    "code": "FILE_TOO_LARGE"
  }
}
```

---

## Required Mobile Packages

### React Native
```bash
npm install react-native-document-picker
# or
npm install react-native-image-picker
```

### Expo
```bash
expo install expo-document-picker
expo install expo-file-system
```

### Flutter
```yaml
dependencies:
  file_picker: ^5.0.0
  http: ^1.0.0
```

---

**Ready to test!** Make sure backend is running and use your computer's IP address instead of localhost. 🚀
