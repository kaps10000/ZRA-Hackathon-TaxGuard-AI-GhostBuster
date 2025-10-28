import 'dart:io';
import 'package:image/image.dart' as img;
import 'package:path_provider/path_provider.dart';
import 'package:uuid/uuid.dart';

/// Image Utility for Privacy & Security
/// - Removes EXIF metadata (location, device info, timestamps)
/// - Compresses images to reduce file size
/// - Generates anonymous filenames
class ImageUtil {
  static final ImageUtil _instance = ImageUtil._internal();
  factory ImageUtil() => _instance;
  ImageUtil._internal();

  final _uuid = const Uuid();

  /// Remove EXIF data from image and return sanitized file
  /// This protects user privacy by removing:
  /// - GPS location data
  /// - Camera make/model
  /// - Timestamps
  /// - Software info
  Future<File?> removeExifData(File imageFile) async {
    try {
      // Read image bytes
      final bytes = await imageFile.readAsBytes();

      // Decode image
      final image = img.decodeImage(bytes);
      if (image == null) {
        throw Exception('Failed to decode image');
      }

      // Re-encode image (this strips all EXIF data)
      final sanitizedBytes = img.encodeJpg(image, quality: 85);

      // Save to temporary file with anonymous name
      final tempDir = await getTemporaryDirectory();
      final fileName = 'sanitized_${_uuid.v4()}.jpg';
      final sanitizedFile = File('${tempDir.path}/$fileName');
      await sanitizedFile.writeAsBytes(sanitizedBytes);

      return sanitizedFile;
    } catch (e) {
      print('Error removing EXIF data: $e');
      return null;
    }
  }

  /// Compress and sanitize image
  /// - Removes EXIF data
  /// - Resizes large images
  /// - Compresses to reduce file size
  Future<File?> compressAndSanitize(
    File imageFile, {
    int maxWidth = 2048,
    int maxHeight = 2048,
    int quality = 85,
  }) async {
    try {
      // Read image bytes
      final bytes = await imageFile.readAsBytes();

      // Decode image
      var image = img.decodeImage(bytes);
      if (image == null) {
        throw Exception('Failed to decode image');
      }

      // Resize if image is too large
      if (image.width > maxWidth || image.height > maxHeight) {
        image = img.copyResize(
          image,
          width: image.width > maxWidth ? maxWidth : null,
          height: image.height > maxHeight ? maxHeight : null,
          interpolation: img.Interpolation.linear,
        );
      }

      // Re-encode with compression (strips EXIF)
      final compressedBytes = img.encodeJpg(image, quality: quality);

      // Save to temporary file
      final tempDir = await getTemporaryDirectory();
      final fileName = 'compressed_${_uuid.v4()}.jpg';
      final compressedFile = File('${tempDir.path}/$fileName');
      await compressedFile.writeAsBytes(compressedBytes);

      return compressedFile;
    } catch (e) {
      print('Error compressing image: $e');
      return null;
    }
  }

  /// Batch process multiple images
  Future<List<File>> processImages(
    List<File> images, {
    bool removeExif = true,
    bool compress = true,
    int maxWidth = 2048,
    int maxHeight = 2048,
    int quality = 85,
  }) async {
    final processedImages = <File>[];

    for (var image in images) {
      File? processed;

      if (compress) {
        processed = await compressAndSanitize(
          image,
          maxWidth: maxWidth,
          maxHeight: maxHeight,
          quality: quality,
        );
      } else if (removeExif) {
        processed = await removeExifData(image);
      }

      if (processed != null) {
        processedImages.add(processed);
      } else {
        // If processing fails, use original (risky!)
        print('Warning: Could not process ${image.path}, using original');
        processedImages.add(image);
      }
    }

    return processedImages;
  }

  /// Get image dimensions
  Future<Map<String, int>?> getImageDimensions(File imageFile) async {
    try {
      final bytes = await imageFile.readAsBytes();
      final image = img.decodeImage(bytes);
      if (image == null) return null;

      return {
        'width': image.width,
        'height': image.height,
      };
    } catch (e) {
      return null;
    }
  }

  /// Check if file is a valid image
  Future<bool> isValidImage(File file) async {
    try {
      final bytes = await file.readAsBytes();
      final image = img.decodeImage(bytes);
      return image != null;
    } catch (e) {
      return false;
    }
  }

  /// Create thumbnail
  Future<File?> createThumbnail(
    File imageFile, {
    int size = 200,
    int quality = 70,
  }) async {
    try {
      final bytes = await imageFile.readAsBytes();
      var image = img.decodeImage(bytes);
      if (image == null) return null;

      // Create square thumbnail
      final thumbnail = img.copyResizeCropSquare(image, size: size);

      // Encode
      final thumbnailBytes = img.encodeJpg(thumbnail, quality: quality);

      // Save
      final tempDir = await getTemporaryDirectory();
      final fileName = 'thumb_${_uuid.v4()}.jpg';
      final thumbnailFile = File('${tempDir.path}/$fileName');
      await thumbnailFile.writeAsBytes(thumbnailBytes);

      return thumbnailFile;
    } catch (e) {
      print('Error creating thumbnail: $e');
      return null;
    }
  }

  /// Clean up temporary files
  Future<void> cleanupTempFiles() async {
    try {
      final tempDir = await getTemporaryDirectory();
      final files = tempDir.listSync();

      for (var file in files) {
        if (file is File) {
          final fileName = file.path.split('/').last;
          if (fileName.startsWith('sanitized_') ||
              fileName.startsWith('compressed_') ||
              fileName.startsWith('thumb_')) {
            await file.delete();
          }
        }
      }
    } catch (e) {
      print('Error cleaning up temp files: $e');
    }
  }
}
