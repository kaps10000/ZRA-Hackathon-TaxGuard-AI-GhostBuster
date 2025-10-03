const db = require('../config/database');

class AuditService {
  /**
   * Log an audit event
   * @param {Object} event - Audit event data
   * @param {number|null} event.actor_id - ID of the actor (null for anonymous)
   * @param {string} event.actor_type - Type of actor (investigator, anonymous, system)
   * @param {string} event.action - Action performed
   * @param {string} event.target_type - Type of target
   * @param {number|null} event.target_id - ID of target
   * @param {string|null} event.ip_hash - Hashed IP address
   * @param {string|null} event.user_agent_hash - Hashed user agent
   * @param {Object|null} event.metadata - Additional metadata
   */
  static async log(event) {
    try {
      const auditRecord = {
        actor_id: event.actor_id || null,
        actor_type: event.actor_type,
        action: event.action,
        target_type: event.target_type,
        target_id: event.target_id || null,
        ip_hash: event.ip_hash || null,
        user_agent_hash: event.user_agent_hash || null,
        metadata: event.metadata ? JSON.stringify(event.metadata) : null,
        created_at: new Date()
      };

      const [record] = await db('audit_logs')
        .insert(auditRecord)
        .returning('*');

      return record;
    } catch (error) {
      // Log audit failures but don't break the main flow
      console.error('Audit logging failed:', error.message);
      return null;
    }
  }

  /**
   * Get audit trail for a specific target
   * @param {string} targetType - Type of target (e.g., 'report')
   * @param {number} targetId - ID of target
   * @param {Object} options - Query options
   */
  static async getAuditTrail(targetType, targetId, options = {}) {
    const { limit = 100, offset = 0, actorId = null } = options;

    try {
      let query = db('audit_logs')
        .select(
          'id',
          'actor_id',
          'actor_type',
          'action',
          'metadata',
          'created_at'
        )
        .where({
          target_type: targetType,
          target_id: targetId
        })
        .orderBy('created_at', 'desc')
        .limit(limit)
        .offset(offset);

      // Add actor information if available
      if (actorId) {
        query = query.leftJoin('investigators', 'audit_logs.actor_id', 'investigators.id')
          .select(
            'audit_logs.id',
            'audit_logs.actor_id',
            'audit_logs.actor_type',
            'audit_logs.action',
            'audit_logs.metadata',
            'audit_logs.created_at',
            'investigators.full_name as actor_name',
            'investigators.badge_number as actor_badge'
          );
      }

      const auditRecords = await query;

      // Parse metadata JSON
      const parsedRecords = auditRecords.map(record => ({
        ...record,
        metadata: record.metadata ? JSON.parse(record.metadata) : null
      }));

      return parsedRecords;
    } catch (error) {
      throw new Error(`Failed to get audit trail: ${error.message}`);
    }
  }

  /**
   * Get system-wide audit statistics
   * @param {Object} filters - Optional filters
   */
  static async getAuditStats(filters = {}) {
    const { startDate, endDate, actorType, action } = filters;

    try {
      let query = db('audit_logs');

      // Apply date filters
      if (startDate) {
        query = query.where('created_at', '>=', startDate);
      }
      if (endDate) {
        query = query.where('created_at', '<=', endDate);
      }
      if (actorType) {
        query = query.where('actor_type', actorType);
      }
      if (action) {
        query = query.where('action', action);
      }

      const stats = await query
        .select(
          db.raw('COUNT(*) as total_events'),
          db.raw('COUNT(DISTINCT actor_id) as unique_actors'),
          db.raw('COUNT(*) FILTER (WHERE actor_type = \'anonymous\') as anonymous_actions'),
          db.raw('COUNT(*) FILTER (WHERE actor_type = \'investigator\') as investigator_actions'),
          db.raw('COUNT(*) FILTER (WHERE action LIKE \'%report%\') as report_related_actions')
        )
        .first();

      // Get action breakdown
      const actionBreakdown = await query.clone()
        .select('action')
        .count('* as count')
        .groupBy('action')
        .orderBy('count', 'desc');

      // Get daily activity (last 30 days)
      const dailyActivity = await db('audit_logs')
        .select(
          db.raw('DATE(created_at) as date'),
          db.raw('COUNT(*) as events')
        )
        .where('created_at', '>=', db.raw('NOW() - INTERVAL \'30 days\''))
        .groupBy(db.raw('DATE(created_at)'))
        .orderBy('date', 'desc');

      return {
        summary: stats,
        actionBreakdown,
        dailyActivity
      };
    } catch (error) {
      throw new Error(`Failed to get audit statistics: ${error.message}`);
    }
  }

  /**
   * Clean old audit logs (for GDPR compliance and storage management)
   * @param {number} daysToKeep - Number of days to keep (default: 2 years)
   */
  static async cleanOldLogs(daysToKeep = 730) {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

      const result = await db('audit_logs')
        .where('created_at', '<', cutoffDate)
        .del();

      console.log(`🧹 Cleaned ${result} old audit log records older than ${daysToKeep} days`);
      
      return result;
    } catch (error) {
      console.error('Failed to clean old audit logs:', error.message);
      throw error;
    }
  }

  /**
   * Log security event (failed logins, suspicious activity, etc.)
   * @param {Object} securityEvent - Security event data
   */
  static async logSecurityEvent(securityEvent) {
    return this.log({
      actor_id: securityEvent.actor_id || null,
      actor_type: securityEvent.actor_type || 'system',
      action: `security_${securityEvent.event_type}`,
      target_type: 'security',
      target_id: null,
      ip_hash: securityEvent.ip_hash,
      user_agent_hash: securityEvent.user_agent_hash,
      metadata: {
        severity: securityEvent.severity || 'medium',
        description: securityEvent.description,
        ...securityEvent.metadata
      }
    });
  }
}

module.exports = AuditService;