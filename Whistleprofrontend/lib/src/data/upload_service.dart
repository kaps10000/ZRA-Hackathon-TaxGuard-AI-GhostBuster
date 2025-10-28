import 'dart:io';
import 'package:http/http.dart' as http;
import 'package:http_parser/http_parser.dart';
import 'dart:convert';

/// Upload Service for Port 3001 (Blockchain Backend)
/// Handles file uploads (photos, documents, videos)
class UploadService {
  static final UploadService _instance = UploadService._internal();
  factory UploadService() => _instance;
  UploadService._internal();

  // Port 3001 for file uploads
  static const String uploadBaseUrl = 'http://172.16.200.136:3005';
  static const String uploadEndpoint = '/api/uploads';

  // File size limits (in bytes)
  static const int maxPhotoSize = 5 * 1024 * 1024; // 5MB
  static const int maxDocumentSize = 10 * 1024 * 1024; // 10MB
  static const int maxVideoSize = 50 * 1024 * 1024; // 50MB

  // Supported file types
  static const List<String> photoExtensions = ['.jpg', '.jpeg', '.png'];
  static const List<String> documentExtensions = ['.pdf', '.doc', '.docx'];
  static const List<String> videoExtensions = ['.mp4', '.mov'];

  /// Validate file size based on type
  bool validateFileSize(File file, String type) {
    final size = file.lengthSync();
    switch (type.toLowerCase()) {
      case 'photo':
        return size <= maxPhotoSize;
      case 'document':
        return size <= maxDocumentSize;
      case 'video':
        return size <= maxVideoSize;
      default:
        return false;
    }
  }

  /// Validate file extension
  bool validateFileExtension(String filePath, String type) {
    final extension = filePath.toLowerCase().substring(filePath.lastIndexOf('.'));
    switch (type.toLowerCase()) {
      case 'photo':
        return photoExtensions.contains(extension);
      case 'document':
        return documentExtensions.contains(extension);
      case 'video':
        return videoExtensions.contains(extension);
      default:
        return false;
    }
  }

  /// Get human-readable file size
  String getFileSize(int bytes) {
    if (bytes < 1024) return '$bytes B';
    if (bytes < 1024 * 1024) return '${(bytes / 1024).toStringAsFixed(1)} KB';
    return '${(bytes / (1024 * 1024)).toStringAsFixed(1)} MB';
  }

  /// Get max size for file type
  int getMaxSize(String type) {
    switch (type.toLowerCase()) {
      case 'photo':
        return maxPhotoSize;
      case 'document':
        return maxDocumentSize;
      case 'video':
        return maxVideoSize;
      default:
        return maxPhotoSize;
    }
  }

  /// Upload files to Port 3001
  /// Returns: Map with 'success', 'urls', 'message'
  Future<Map<String, dynamic>> uploadFiles(
    List<File> files,
    String type, {
    Function(double)? onProgress,
  }) async {
    print('🔵 [UPLOAD] Starting upload for ${files.length} files of type: $type');

    try {
      if (files.isEmpty) {
        print('🔴 [UPLOAD] ERROR: No files selected');
        return {
          'success': false,
          'message': 'No files selected',
        };
      }

      // Validate all files before upload
      for (var file in files) {
        print('🔵 [UPLOAD] Validating file: ${file.path}');

        if (!file.existsSync()) {
          print('🔴 [UPLOAD] ERROR: File does not exist: ${file.path}');
          return {
            'success': false,
            'message': 'File does not exist: ${file.path}',
          };
        }

        if (!validateFileSize(file, type)) {
          final maxSize = getFileSize(getMaxSize(type));
          final actualSize = getFileSize(file.lengthSync());
          print('🔴 [UPLOAD] ERROR: File too large: $actualSize (max: $maxSize)');
          return {
            'success': false,
            'message': 'File too large: $actualSize (max: $maxSize)',
          };
        }

        if (!validateFileExtension(file.path, type)) {
          print('🔴 [UPLOAD] ERROR: Invalid file type for ${file.path.split('/').last}');
          return {
            'success': false,
            'message': 'Invalid file type for ${file.path.split('/').last}',
          };
        }

        print('✅ [UPLOAD] File validated successfully: ${file.path}');
      }

      // Create multipart request
      final uri = Uri.parse('$uploadBaseUrl$uploadEndpoint');
      print('🔵 [UPLOAD] Creating multipart request to: $uri');
      final request = http.MultipartRequest('POST', uri);

      // Add file type
      request.fields['type'] = type;
      print('🔵 [UPLOAD] Request field - type: $type');

      // Add files
      for (var file in files) {
        print('🔵 [UPLOAD] Adding file to request: ${file.path}');

        // Determine MIME type based on file type
        String contentType;
        switch (type.toLowerCase()) {
          case 'photo':
            contentType = 'image/jpeg'; // Our compressed images are always JPEG
            break;
          case 'document':
            contentType = 'application/pdf'; // Assuming PDF for now
            break;
          case 'video':
            contentType = 'video/mp4';
            break;
          default:
            contentType = 'application/octet-stream';
        }

        print('🔵 [UPLOAD] Setting content type: $contentType');

        final multipartFile = await http.MultipartFile.fromPath(
          'files',
          file.path,
          contentType: MediaType.parse(contentType),
        );
        request.files.add(multipartFile);
        print('✅ [UPLOAD] File added: ${multipartFile.filename}, size: ${multipartFile.length} bytes, contentType: ${multipartFile.contentType}');
      }

      // Send request
      print('🔵 [UPLOAD] Sending HTTP request to Port 3001...');
      final streamedResponse = await request.send();
      print('✅ [UPLOAD] Received response with status: ${streamedResponse.statusCode}');

      final response = await http.Response.fromStream(streamedResponse);
      print('🔵 [UPLOAD] Response body: ${response.body}');

      if (response.statusCode == 200 || response.statusCode == 201) {
        final jsonResponse = jsonDecode(response.body);
        print('🔵 [UPLOAD] Parsed JSON response: $jsonResponse');

        if (jsonResponse['success'] == true) {
          // Extract file URLs
          final filesList = jsonResponse['files'] as List;
          final urls = filesList.map((f) => f['url'] as String).toList();

          print('✅ [UPLOAD] Upload successful! URLs: $urls');

          return {
            'success': true,
            'urls': urls,
            'message': jsonResponse['message'] ?? 'Upload successful',
            'files': filesList,
          };
        } else {
          print('🔴 [UPLOAD] Server returned success=false: ${jsonResponse['error']}');
          return {
            'success': false,
            'message': jsonResponse['error'] ?? 'Upload failed',
          };
        }
      } else {
        print('🔴 [UPLOAD] HTTP error status: ${response.statusCode}');
        final jsonResponse = jsonDecode(response.body);
        print('🔴 [UPLOAD] Error response body: $jsonResponse');
        return {
          'success': false,
          'message': jsonResponse['error'] ?? 'Upload failed: ${response.statusCode}',
        };
      }
    } on SocketException catch (e) {
      print('🔴 [UPLOAD] SocketException: $e');
      print('🔴 [UPLOAD] Cannot connect to $uploadBaseUrl$uploadEndpoint');
      return {
        'success': false,
        'message': 'No internet connection. Please check your network.',
      };
    } on http.ClientException catch (e) {
      print('🔴 [UPLOAD] ClientException: $e');
      return {
        'success': false,
        'message': 'Connection error: $e',
      };
    } on FormatException catch (e) {
      print('🔴 [UPLOAD] FormatException (JSON parsing error): $e');
      return {
        'success': false,
        'message': 'Invalid server response format',
      };
    } catch (e, stackTrace) {
      print('🔴 [UPLOAD] Unexpected error: $e');
      print('🔴 [UPLOAD] Stack trace: $stackTrace');
      return {
        'success': false,
        'message': 'Upload error: $e',
      };
    }
  }

  /// Upload single file (convenience method)
  Future<Map<String, dynamic>> uploadFile(File file, String type) async {
    return uploadFiles([file], type);
  }

  /// Batch upload multiple file types
  Future<Map<String, dynamic>> uploadEvidence({
    List<File>? photos,
    List<File>? documents,
    List<File>? videos,
  }) async {
    print('🔵 [BATCH UPLOAD] Starting batch upload...');
    print('🔵 [BATCH UPLOAD] Photos: ${photos?.length ?? 0}, Documents: ${documents?.length ?? 0}, Videos: ${videos?.length ?? 0}');

    final Map<String, List<String>> evidence = {
      'photos': [],
      'documents': [],
      'videos': [],
    };

    try {
      // Upload photos
      if (photos != null && photos.isNotEmpty) {
        print('🔵 [BATCH UPLOAD] Uploading ${photos.length} photos...');
        final result = await uploadFiles(photos, 'photo');
        if (!result['success']) {
          print('🔴 [BATCH UPLOAD] Photo upload failed: ${result['message']}');
          return {
            'success': false,
            'message': 'Photo upload failed: ${result['message']}',
          };
        }
        evidence['photos'] = List<String>.from(result['urls']);
        print('✅ [BATCH UPLOAD] Photos uploaded successfully: ${evidence['photos']}');
      }

      // Upload documents
      if (documents != null && documents.isNotEmpty) {
        print('🔵 [BATCH UPLOAD] Uploading ${documents.length} documents...');
        final result = await uploadFiles(documents, 'document');
        if (!result['success']) {
          print('🔴 [BATCH UPLOAD] Document upload failed: ${result['message']}');
          return {
            'success': false,
            'message': 'Document upload failed: ${result['message']}',
          };
        }
        evidence['documents'] = List<String>.from(result['urls']);
        print('✅ [BATCH UPLOAD] Documents uploaded successfully: ${evidence['documents']}');
      }

      // Upload videos
      if (videos != null && videos.isNotEmpty) {
        print('🔵 [BATCH UPLOAD] Uploading ${videos.length} videos...');
        final result = await uploadFiles(videos, 'video');
        if (!result['success']) {
          print('🔴 [BATCH UPLOAD] Video upload failed: ${result['message']}');
          return {
            'success': false,
            'message': 'Video upload failed: ${result['message']}',
          };
        }
        evidence['videos'] = List<String>.from(result['urls']);
        print('✅ [BATCH UPLOAD] Videos uploaded successfully: ${evidence['videos']}');
      }

      print('✅ [BATCH UPLOAD] All uploads completed successfully!');
      return {
        'success': true,
        'evidence': evidence,
        'message': 'All files uploaded successfully',
      };
    } catch (e, stackTrace) {
      print('🔴 [BATCH UPLOAD] Unexpected error: $e');
      print('🔴 [BATCH UPLOAD] Stack trace: $stackTrace');
      return {
        'success': false,
        'message': 'Batch upload error: $e',
      };
    }
  }
}
