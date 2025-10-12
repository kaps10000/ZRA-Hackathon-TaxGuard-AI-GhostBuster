const express = require('express');
const router = express.Router();
const multer = require('multer');
const sharp = require('sharp');
const crypto = require('crypto');
const path = require('path');
const fs = require('fs').promises;

/**
 * File Upload API for WhistlePro
 * Handles multipart/form-data file uploads before submitting reports
 *
 * Features:
 * - Multiple file uploads
 * - File type validation
 * - Size limits
 * - Image compression
 * - Secure filename generation
 * - Anonymous uploads (no auth required)
 */

// File type configurations
const FILE_CONFIGS = {
    photo: {
        extensions: ['.jpg', '.jpeg', '.png'],
        maxSize: 5 * 1024 * 1024, // 5MB
        mimeTypes: ['image/jpeg', 'image/png']
    },
    document: {
        extensions: ['.pdf', '.doc', '.docx'],
        maxSize: 10 * 1024 * 1024, // 10MB
        mimeTypes: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
    },
    video: {
        extensions: ['.mp4', '.mov'],
        maxSize: 50 * 1024 * 1024, // 50MB
        mimeTypes: ['video/mp4', 'video/quicktime']
    }
};

// Sanitize filename to prevent path traversal and other security issues
function sanitizeFilename(filename) {
    // Remove any path components
    const basename = path.basename(filename);
    // Remove any non-alphanumeric characters except dots, dashes, and underscores
    const sanitized = basename.replace(/[^a-zA-Z0-9.-]/g, '_');
    // Prevent double extensions and hidden files
    return sanitized.replace(/^\.+/, '').replace(/\.{2,}/g, '.');
}

// Generate unique filename
function generateUniqueFilename(originalName, type) {
    const timestamp = Date.now();
    const randomHash = crypto.randomBytes(8).toString('hex');
    const ext = path.extname(originalName).toLowerCase();
    const sanitizedExt = sanitizeFilename(ext);
    return `${type}_${timestamp}_${randomHash}${sanitizedExt}`;
}

// Validate file type
function validateFileType(file, type) {
    const config = FILE_CONFIGS[type];
    if (!config) {
        return { valid: false, error: 'Invalid file type category' };
    }

    const ext = path.extname(file.originalname).toLowerCase();
    if (!config.extensions.includes(ext)) {
        return {
            valid: false,
            error: `Invalid file extension. Allowed: ${config.extensions.join(', ')}`
        };
    }

    if (!config.mimeTypes.includes(file.mimetype)) {
        return {
            valid: false,
            error: `Invalid MIME type. Allowed: ${config.mimeTypes.join(', ')}`
        };
    }

    if (file.size > config.maxSize) {
        return {
            valid: false,
            error: `File too large. Maximum size: ${config.maxSize / (1024 * 1024)}MB`
        };
    }

    return { valid: true };
}

// Configure multer storage
const storage = multer.memoryStorage(); // Store in memory for processing

const upload = multer({
    storage: storage,
    limits: {
        fileSize: 50 * 1024 * 1024, // 50MB max (global limit)
        files: 10 // Maximum 10 files per request
    },
    fileFilter: (req, file, cb) => {
        // Basic security check - prevent executable files
        const dangerousExtensions = ['.exe', '.bat', '.sh', '.cmd', '.com', '.scr', '.js', '.jar'];
        const ext = path.extname(file.originalname).toLowerCase();

        if (dangerousExtensions.includes(ext)) {
            return cb(new Error('Executable files are not allowed'), false);
        }

        cb(null, true);
    }
});

// Compress image if it's a photo
async function compressImage(buffer, filename) {
    try {
        const image = sharp(buffer);
        const metadata = await image.metadata();

        // Compression settings
        const compressed = await image
            .resize(2048, 2048, {
                fit: 'inside',
                withoutEnlargement: true
            })
            .jpeg({
                quality: 85,
                progressive: true
            })
            .toBuffer();

        return compressed;
    } catch (error) {
        console.error('Image compression error:', error);
        // Return original buffer if compression fails
        return buffer;
    }
}

// POST /api/uploads - Upload multiple files
router.post('/', upload.array('files', 10), async (req, res) => {
    try {
        const { type } = req.body;

        // Validate type parameter
        if (!type || !FILE_CONFIGS[type]) {
            return res.status(400).json({
                success: false,
                error: 'Invalid or missing type parameter',
                allowedTypes: Object.keys(FILE_CONFIGS)
            });
        }

        // Check if files were uploaded
        if (!req.files || req.files.length === 0) {
            return res.status(400).json({
                success: false,
                error: 'No files uploaded'
            });
        }

        const uploadResults = [];
        const errors = [];

        // Process each file
        for (const file of req.files) {
            try {
                // Validate file type
                const validation = validateFileType(file, type);
                if (!validation.valid) {
                    errors.push({
                        filename: file.originalname,
                        error: validation.error
                    });
                    continue;
                }

                // Generate unique filename
                const uniqueFilename = generateUniqueFilename(file.originalname, type);
                const uploadsDir = path.join(__dirname, '../../uploads');
                const filePath = path.join(uploadsDir, uniqueFilename);

                // Ensure uploads directory exists
                await fs.mkdir(uploadsDir, { recursive: true });

                let fileBuffer = file.buffer;

                // Compress images
                if (type === 'photo') {
                    fileBuffer = await compressImage(file.buffer, uniqueFilename);
                }

                // Save file to disk
                await fs.writeFile(filePath, fileBuffer);

                // Generate file URL
                const fileUrl = `/uploads/${uniqueFilename}`;

                uploadResults.push({
                    filename: uniqueFilename,
                    originalName: file.originalname,
                    url: fileUrl,
                    size: fileBuffer.length,
                    mimeType: file.mimetype,
                    type: type
                });

            } catch (error) {
                console.error('File processing error:', error);
                errors.push({
                    filename: file.originalname,
                    error: error.message
                });
            }
        }

        // Return response
        if (uploadResults.length === 0 && errors.length > 0) {
            return res.status(400).json({
                success: false,
                error: 'All file uploads failed',
                errors: errors
            });
        }

        res.status(200).json({
            success: true,
            message: `Successfully uploaded ${uploadResults.length} file(s)`,
            files: uploadResults,
            errors: errors.length > 0 ? errors : undefined
        });

    } catch (error) {
        console.error('Upload error:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'File upload failed'
        });
    }
});

// GET /api/uploads/:filename - Serve uploaded file
router.get('/:filename', async (req, res) => {
    try {
        const { filename } = req.params;

        // Sanitize filename to prevent path traversal
        const sanitized = sanitizeFilename(filename);
        const filePath = path.join(__dirname, '../../uploads', sanitized);

        // Check if file exists
        try {
            await fs.access(filePath);
        } catch {
            return res.status(404).json({
                success: false,
                error: 'File not found'
            });
        }

        // Serve the file
        res.sendFile(filePath);

    } catch (error) {
        console.error('File retrieval error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// DELETE /api/uploads/:filename - Delete uploaded file (optional, for cleanup)
router.delete('/:filename', async (req, res) => {
    try {
        const { filename } = req.params;

        // Sanitize filename
        const sanitized = sanitizeFilename(filename);
        const filePath = path.join(__dirname, '../../uploads', sanitized);

        // Delete file
        await fs.unlink(filePath);

        res.json({
            success: true,
            message: 'File deleted successfully'
        });

    } catch (error) {
        if (error.code === 'ENOENT') {
            return res.status(404).json({
                success: false,
                error: 'File not found'
            });
        }

        console.error('File deletion error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// GET /api/uploads - List all uploaded files (admin only - add auth if needed)
router.get('/', async (req, res) => {
    try {
        const uploadsDir = path.join(__dirname, '../../uploads');

        // Read directory
        const files = await fs.readdir(uploadsDir);

        const fileList = await Promise.all(
            files.map(async (filename) => {
                const filePath = path.join(uploadsDir, filename);
                const stats = await fs.stat(filePath);

                return {
                    filename,
                    url: `/uploads/${filename}`,
                    size: stats.size,
                    created: stats.birthtime,
                    modified: stats.mtime
                };
            })
        );

        res.json({
            success: true,
            count: fileList.length,
            files: fileList
        });

    } catch (error) {
        console.error('File listing error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

module.exports = router;
