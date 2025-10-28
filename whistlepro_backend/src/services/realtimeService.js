/**
 * Real-Time Service for WhistlePro
 * Handles Socket.io event broadcasting for real-time updates
 */

class RealtimeService {
  constructor() {
    this.io = null;
    this.events = {
      NEW_REPORT: 'newReport',
      REPORT_UPDATED: 'reportUpdated',
      REPORT_ASSIGNED: 'reportAssigned',
      STATUS_CHANGED: 'statusChanged',
      NEW_COMMENT: 'newComment',
      REPORT_DELETED: 'reportDeleted',
      SYSTEM_ALERT: 'systemAlert'
    };
  }

  /**
   * Initialize the service with Socket.io instance
   * @param {Object} io - Socket.io server instance
   */
  initialize(io) {
    this.io = io;
    console.log('✓ Real-time service initialized');
  }

  /**
   * Emit event to all connected clients
   * @param {string} event - Event name
   * @param {Object} data - Event data
   */
  broadcast(event, data) {
    if (!this.io) {
      console.warn('⚠️ Socket.io not initialized, cannot broadcast');
      return;
    }

    const payload = {
      ...data,
      timestamp: new Date().toISOString(),
      eventType: event
    };

    this.io.emit(event, payload);
    console.log(`📡 Broadcast: ${event} to all clients`);
  }

  /**
   * Emit event to specific room/namespace
   * @param {string} room - Room name
   * @param {string} event - Event name
   * @param {Object} data - Event data
   */
  broadcastToRoom(room, event, data) {
    if (!this.io) {
      console.warn('⚠️ Socket.io not initialized, cannot broadcast to room');
      return;
    }

    const payload = {
      ...data,
      timestamp: new Date().toISOString(),
      eventType: event
    };

    this.io.to(room).emit(event, payload);
    console.log(`📡 Broadcast: ${event} to room "${room}"`);
  }

  /**
   * Emit new report submitted event
   * Only send to authenticated investigators, not public
   * @param {Object} report - Report details
   */
  emitNewReport(report) {
    // Send only to authenticated users (investigators)
    this.broadcastToRoom('authenticated', this.events.NEW_REPORT, {
      message: 'New anonymous report submitted',
      report: {
        caseId: report.caseId,
        title: report.title,
        category: report.category,
        priority: report.priority,
        status: report.status,
        reportedDate: report.reportedDate
      }
    });
  }

  /**
   * Emit report updated event
   * @param {Object} report - Updated report details
   * @param {string} updatedBy - User who updated
   */
  emitReportUpdated(report, updatedBy = 'System') {
    this.broadcast(this.events.REPORT_UPDATED, {
      message: `Report ${report.caseId} updated`,
      caseId: report.caseId,
      status: report.status,
      updatedBy,
      changes: report.changes || {}
    });
  }

  /**
   * Emit report assigned event
   * @param {string} caseId - Case ID
   * @param {string} investigator - Assigned investigator
   */
  emitReportAssigned(caseId, investigator) {
    this.broadcast(this.events.REPORT_ASSIGNED, {
      message: `Report ${caseId} assigned to ${investigator}`,
      caseId,
      assignedTo: investigator
    });
  }

  /**
   * Emit status changed event
   * @param {string} caseId - Case ID
   * @param {string} oldStatus - Previous status
   * @param {string} newStatus - New status
   */
  emitStatusChanged(caseId, oldStatus, newStatus) {
    this.broadcast(this.events.STATUS_CHANGED, {
      message: `Report ${caseId} status changed`,
      caseId,
      oldStatus,
      newStatus
    });
  }

  /**
   * Emit new comment event
   * @param {string} caseId - Case ID
   * @param {Object} comment - Comment details
   */
  emitNewComment(caseId, comment) {
    this.broadcast(this.events.NEW_COMMENT, {
      message: `New comment on report ${caseId}`,
      caseId,
      comment: {
        author: comment.author,
        text: comment.text,
        timestamp: comment.timestamp
      }
    });
  }

  /**
   * Emit report deleted event
   * @param {string} caseId - Case ID
   */
  emitReportDeleted(caseId) {
    this.broadcast(this.events.REPORT_DELETED, {
      message: `Report ${caseId} has been deleted`,
      caseId
    });
  }

  /**
   * Emit system alert
   * @param {string} message - Alert message
   * @param {string} level - Alert level (info, warning, error, critical)
   */
  emitSystemAlert(message, level = 'info') {
    this.broadcast(this.events.SYSTEM_ALERT, {
      message,
      level,
      alert: true
    });
  }

  /**
   * Get list of all available events
   * @returns {Object} Event names
   */
  getEvents() {
    return this.events;
  }

  /**
   * Check if real-time service is active
   * @returns {boolean}
   */
  isActive() {
    return this.io !== null;
  }

  /**
   * Get count of connected clients
   * @returns {number}
   */
  getConnectedCount() {
    if (!this.io) return 0;
    return this.io.sockets.sockets.size;
  }
}

// Export singleton instance
module.exports = new RealtimeService();
