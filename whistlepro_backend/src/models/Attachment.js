const db = require('../config/database');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

class Attachment {
  static tableName = 'attachments';

  /**
   * Generate unique file ID
   */
  static generateFileId() {
    return `FILE-${Date.now()}-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
  }

  /**
   * Calculate file hash
   */
  static calculateFileHash(filePath) {
    return new Promise((resolve, reject) => {
      const hash = crypto.createHash('sha256');
      const stream = fs.createReadStream(filePath);

      stream.on('data', (chunk) => hash.update(chunk));
      stream.on('end', () => resolve(hash.digest('hex')));
      stream.on('error', reject);
    });
  }

  /**
   * Optimize image if it's an image file
   */
  static async optimizeImage(filePath, mimetype) {
    if (!mimetype.startsWith('image/')) {
      return null;
    }

    try {
      const image = sharp(filePath);
      const metadata = await image.metadata();

      // Only optimize if image is larger than 1920px width
      if (metadata.width > 1920) {
        await image
          .resize(1920, null, {
            withoutEnlargement: true,
            fit: 'inside'
          })
          .jpeg({ quality: 85 })
          .toFile(filePath + '.optimized');

        // Replace original with optimized
        fs.unlinkSync(filePath);
        fs.renameSync(filePath + '.optimized', filePath);
      }

      return {
        width: metadata.width,
        height: metadata.height,
        format: metadata.format
      };
    } catch (error) {
      console.error('Image optimization failed:', error.message);
      return null;
    }
  }

  /**
   * Create attachment record in database
   */
  static async create(fileData) {
    const fileId = this.generateFileId();
    const fileHash = await this.calculateFileHash(fileData.path);

    // Determine file type category
    const fileType = fileData.mimetype.startsWith('image/') ? 'image' :
                     fileData.mimetype.startsWith('video/') ? 'video' :
                     'document';

    // Optimize image if applicable
    let metadata = null;
    if (fileType === 'image') {
      metadata = await this.optimizeImage(fileData.path, fileData.mimetype);
    }

    const attachment = {
      file_id: fileId,
      report_id: null, // Will be linked when report is submitted
      original_name: fileData.originalname,
      stored_name: fileData.filename,
      mime_type: fileData.mimetype,
      file_size: fileData.size,
      file_path: fileData.path,
      file_type: fileType,
      file_hash: fileHash,
      is_encrypted: false,
      metadata: metadata ? JSON.stringify(metadata) : null,
      uploaded_at: new Date(),
      created_at: new Date()
    };

    try {
      const [newAttachment] = await db(this.tableName)
        .insert(attachment)
        .returning('*');

      return {
        file_id: newAttachment.file_id,
        original_name: newAttachment.original_name,
        file_type: newAttachment.file_type,
        file_size: newAttachment.file_size,
        mime_type: newAttachment.mime_type,
        uploaded_at: newAttachment.uploaded_at,
        metadata: newAttachment.metadata ? JSON.parse(newAttachment.metadata) : null
      };
    } catch (error) {
      // Clean up file if database insert fails
      if (fs.existsSync(fileData.path)) {
        fs.unlinkSync(fileData.path);
      }
      throw new Error(`Failed to save attachment: ${error.message}`);
    }
  }

  /**
   * Link attachment to report
   */
  static async linkToReport(fileId, reportId) {
    try {
      await db(this.tableName)
        .where('file_id', fileId)
        .update({ report_id: reportId });
      return true;
    } catch (error) {
      console.error(`Failed to link file ${fileId} to report ${reportId}:`, error);
      return false;
    }
  }

  /**
   * Get attachment by file ID
   */
  static async findByFileId(fileId) {
    try {
      const attachment = await db(this.tableName)
        .where('file_id', fileId)
        .first();

      if (!attachment) {
        return null;
      }

      return {
        file_id: attachment.file_id,
        original_name: attachment.original_name,
        file_type: attachment.file_type,
        file_size: attachment.file_size,
        mime_type: attachment.mime_type,
        file_path: attachment.file_path,
        uploaded_at: attachment.uploaded_at,
        metadata: attachment.metadata ? JSON.parse(attachment.metadata) : null
      };
    } catch (error) {
      throw new Error(`Failed to find attachment: ${error.message}`);
    }
  }

  /**
   * Get all attachments for a report
   */
  static async findByReportId(reportId) {
    try {
      const attachments = await db(this.tableName)
        .where('report_id', reportId)
        .orderBy('uploaded_at', 'desc');

      return attachments.map(att => ({
        file_id: att.file_id,
        original_name: att.original_name,
        file_type: att.file_type,
        file_size: att.file_size,
        mime_type: att.mime_type,
        uploaded_at: att.uploaded_at,
        metadata: att.metadata ? JSON.parse(att.metadata) : null
      }));
    } catch (error) {
      throw new Error(`Failed to find attachments: ${error.message}`);
    }
  }

  /**
   * Delete attachment
   */
  static async delete(fileId) {
    try {
      const attachment = await db(this.tableName)
        .where('file_id', fileId)
        .first();

      if (!attachment) {
        return false;
      }

      // Delete file from disk
      if (fs.existsSync(attachment.file_path)) {
        fs.unlinkSync(attachment.file_path);
      }

      // Delete from database
      await db(this.tableName)
        .where('file_id', fileId)
        .delete();

      return true;
    } catch (error) {
      console.error(`Failed to delete attachment ${fileId}:`, error);
      return false;
    }
  }
}

module.exports = Attachment;
