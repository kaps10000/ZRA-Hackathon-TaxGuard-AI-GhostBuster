const { query, getClient } = require('./config');

/**
 * Database Models for TaxGuard Blockchain
 * PostgreSQL-based persistent storage
 */

class BlockchainDB {
    /**
     * Create a new block in the database
     */
    static async createBlock(blockIndex, timestamp, previousHash, hash, data) {
        const sql = `
            INSERT INTO blocks (block_index, timestamp, previous_hash, hash, data)
            VALUES ($1, $2, $3, $4, $5)
            RETURNING *
        `;
        const result = await query(sql, [blockIndex, timestamp, previousHash, hash, JSON.stringify(data)]);
        return result.rows[0];
    }

    /**
     * Get a block by index
     */
    static async getBlockByIndex(blockIndex) {
        const sql = 'SELECT * FROM blocks WHERE block_index = $1';
        const result = await query(sql, [blockIndex]);
        return result.rows[0];
    }

    /**
     * Get latest block
     */
    static async getLatestBlock() {
        const sql = 'SELECT * FROM blocks ORDER BY block_index DESC LIMIT 1';
        const result = await query(sql);
        return result.rows[0];
    }

    /**
     * Get all blocks (for chain reconstruction)
     */
    static async getAllBlocks() {
        const sql = 'SELECT * FROM blocks ORDER BY block_index ASC';
        const result = await query(sql);
        return result.rows;
    }

    /**
     * Get block count
     */
    static async getBlockCount() {
        const sql = 'SELECT COUNT(*) as count FROM blocks';
        const result = await query(sql);
        return parseInt(result.rows[0].count);
    }
}

class EventDB {
    /**
     * Create a new event
     */
    static async createEvent(eventId, eventType, timestamp, anonymizedUserId, hashOfPayload, notes, blockIndex, metadata = null) {
        const sql = `
            INSERT INTO events (event_id, event_type, timestamp, anonymized_user_id, hash_of_payload, notes, block_index, metadata)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            RETURNING *
        `;
        const result = await query(sql, [
            eventId, eventType, timestamp, anonymizedUserId, hashOfPayload, notes, blockIndex, metadata ? JSON.stringify(metadata) : null
        ]);
        return result.rows[0];
    }

    /**
     * Get event by ID
     */
    static async getEventById(eventId) {
        const sql = 'SELECT * FROM events WHERE event_id = $1';
        const result = await query(sql, [eventId]);
        return result.rows[0];
    }

    /**
     * Get all events
     */
    static async getAllEvents() {
        const sql = 'SELECT * FROM events ORDER BY timestamp DESC';
        const result = await query(sql);
        return result.rows;
    }

    /**
     * Get events by type
     */
    static async getEventsByType(eventType) {
        const sql = 'SELECT * FROM events WHERE event_type = $1 ORDER BY timestamp DESC';
        const result = await query(sql, [eventType]);
        return result.rows;
    }

    /**
     * Get events by user
     */
    static async getEventsByUser(anonymizedUserId) {
        const sql = 'SELECT * FROM events WHERE anonymized_user_id = $1 ORDER BY timestamp DESC';
        const result = await query(sql, [anonymizedUserId]);
        return result.rows;
    }

    /**
     * Get event count
     */
    static async getEventCount() {
        const sql = 'SELECT COUNT(*) as count FROM events';
        const result = await query(sql);
        return parseInt(result.rows[0].count);
    }
}

class GhostBusterDB {
    /**
     * Create a new detection
     */
    static async createDetection(detectionData) {
        const sql = `
            INSERT INTO ghostbuster_detections
            (detection_id, event_id, detection_type, entity_id, confidence_score, detection_method,
             indicators, severity, investigator_id, evidence_hash, review_status, metadata)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
            RETURNING *
        `;
        const result = await query(sql, [
            detectionData.detectionId,
            detectionData.eventId,
            detectionData.detectionType,
            detectionData.entityId,
            detectionData.confidenceScore,
            detectionData.detectionMethod,
            JSON.stringify(detectionData.indicators || []),
            detectionData.severity,
            detectionData.investigatorId,
            detectionData.evidenceHash,
            detectionData.reviewStatus || 'pending',
            JSON.stringify(detectionData.metadata || {})
        ]);
        return result.rows[0];
    }

    /**
     * Get detection by ID
     */
    static async getDetectionById(detectionId) {
        const sql = 'SELECT * FROM ghostbuster_detections WHERE detection_id = $1';
        const result = await query(sql, [detectionId]);
        return result.rows[0];
    }

    /**
     * Get all detections with filters
     */
    static async getDetections(filters = {}) {
        let sql = 'SELECT * FROM ghostbuster_detections WHERE 1=1';
        const params = [];

        if (filters.detectionType) {
            params.push(filters.detectionType);
            sql += ` AND detection_type = $${params.length}`;
        }

        if (filters.severity) {
            params.push(filters.severity);
            sql += ` AND severity = $${params.length}`;
        }

        if (filters.reviewStatus) {
            params.push(filters.reviewStatus);
            sql += ` AND review_status = $${params.length}`;
        }

        sql += ' ORDER BY created_at DESC';

        if (filters.limit) {
            params.push(filters.limit);
            sql += ` LIMIT $${params.length}`;
        }

        const result = await query(sql, params);
        return result.rows;
    }

    /**
     * Update detection review status
     */
    static async updateDetectionReview(detectionId, reviewData) {
        const sql = `
            UPDATE ghostbuster_detections
            SET review_status = $1, metadata = jsonb_set(metadata, '{reviewNotes}', $2::jsonb)
            WHERE detection_id = $3
            RETURNING *
        `;
        const result = await query(sql, [
            reviewData.reviewStatus,
            JSON.stringify(reviewData.reviewNotes || ''),
            detectionId
        ]);
        return result.rows[0];
    }
}

class WhistleProDB {
    /**
     * Create a new report
     */
    static async createReport(reportData) {
        const sql = `
            INSERT INTO whistlepro_reports
            (report_id, case_code, event_id, report_type, target_entity, severity, description_encrypted,
             evidence_hash, estimated_amount, location, whistleblower_key, review_status, priority, metadata)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
            RETURNING *
        `;
        const result = await query(sql, [
            reportData.reportId,
            reportData.caseCode,
            reportData.eventId,
            reportData.reportType,
            reportData.targetEntity,
            reportData.severity,
            reportData.descriptionEncrypted,
            reportData.evidenceHash,
            reportData.estimatedAmount,
            reportData.location,
            reportData.whistleblowerKey,
            reportData.reviewStatus || 'submitted',
            reportData.priority || 'MEDIUM',
            JSON.stringify(reportData.metadata || {})
        ]);
        return result.rows[0];
    }

    /**
     * Get report by case code (public tracking)
     */
    static async getReportByCaseCode(caseCode) {
        const sql = 'SELECT * FROM whistlepro_reports WHERE case_code = $1';
        const result = await query(sql, [caseCode]);
        return result.rows[0];
    }

    /**
     * Get report by ID
     */
    static async getReportById(reportId) {
        const sql = 'SELECT * FROM whistlepro_reports WHERE report_id = $1';
        const result = await query(sql, [reportId]);
        return result.rows[0];
    }

    /**
     * Get all reports with filters
     */
    static async getReports(filters = {}) {
        let sql = 'SELECT * FROM whistlepro_reports WHERE 1=1';
        const params = [];

        if (filters.reportType) {
            params.push(filters.reportType);
            sql += ` AND report_type = $${params.length}`;
        }

        if (filters.severity) {
            params.push(filters.severity);
            sql += ` AND severity = $${params.length}`;
        }

        if (filters.reviewStatus) {
            params.push(filters.reviewStatus);
            sql += ` AND review_status = $${params.length}`;
        }

        if (filters.priority) {
            params.push(filters.priority);
            sql += ` AND priority = $${params.length}`;
        }

        sql += ' ORDER BY created_at DESC';

        if (filters.limit) {
            params.push(filters.limit);
            sql += ` LIMIT $${params.length}`;
        }

        const result = await query(sql, params);
        return result.rows;
    }

    /**
     * Update report status
     */
    static async updateReport(reportId, updateData) {
        const updates = [];
        const params = [];
        let paramIndex = 1;

        if (updateData.reviewStatus) {
            updates.push(`review_status = $${paramIndex}`);
            params.push(updateData.reviewStatus);
            paramIndex++;
        }

        if (updateData.assignedTo) {
            updates.push(`assigned_to = $${paramIndex}`);
            params.push(updateData.assignedTo);
            paramIndex++;
        }

        if (updateData.priority) {
            updates.push(`priority = $${paramIndex}`);
            params.push(updateData.priority);
            paramIndex++;
        }

        params.push(reportId);
        const sql = `UPDATE whistlepro_reports SET ${updates.join(', ')} WHERE report_id = $${paramIndex} RETURNING *`;
        const result = await query(sql, params);
        return result.rows[0];
    }

    /**
     * Add case update
     */
    static async addCaseUpdate(reportId, updateData) {
        const sql = `
            INSERT INTO case_updates (report_id, update_type, public_update, internal_notes, updated_by)
            VALUES ($1, $2, $3, $4, $5)
            RETURNING *
        `;
        const result = await query(sql, [
            reportId,
            updateData.updateType,
            updateData.publicUpdate,
            updateData.internalNotes,
            updateData.updatedBy
        ]);
        return result.rows[0];
    }

    /**
     * Get case updates
     */
    static async getCaseUpdates(reportId) {
        const sql = 'SELECT * FROM case_updates WHERE report_id = $1 ORDER BY created_at DESC';
        const result = await query(sql, [reportId]);
        return result.rows;
    }
}

class AIRiskDB {
    /**
     * Create a new risk assessment
     */
    static async createAssessment(assessmentData) {
        const sql = `
            INSERT INTO ai_risk_assessments
            (assessment_id, event_id, taxpayer_id, risk_score, risk_level, model_version,
             features, predictions, confidence, risk_factors, recommendations, data_hash, metadata)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
            RETURNING *
        `;
        const result = await query(sql, [
            assessmentData.assessmentId,
            assessmentData.eventId,
            assessmentData.taxpayerId,
            assessmentData.riskScore,
            assessmentData.riskLevel,
            assessmentData.modelVersion,
            JSON.stringify(assessmentData.features || {}),
            JSON.stringify(assessmentData.predictions || {}),
            assessmentData.confidence,
            JSON.stringify(assessmentData.riskFactors || []),
            JSON.stringify(assessmentData.recommendations || []),
            assessmentData.dataHash,
            JSON.stringify(assessmentData.metadata || {})
        ]);
        return result.rows[0];
    }

    /**
     * Get assessment by ID
     */
    static async getAssessmentById(assessmentId) {
        const sql = 'SELECT * FROM ai_risk_assessments WHERE assessment_id = $1';
        const result = await query(sql, [assessmentId]);
        return result.rows[0];
    }

    /**
     * Get taxpayer risk history
     */
    static async getTaxpayerRiskHistory(taxpayerId) {
        const sql = 'SELECT * FROM ai_risk_assessments WHERE taxpayer_id = $1 ORDER BY created_at DESC';
        const result = await query(sql, [taxpayerId]);
        return result.rows;
    }

    /**
     * Get assessments with filters
     */
    static async getAssessments(filters = {}) {
        let sql = 'SELECT * FROM ai_risk_assessments WHERE 1=1';
        const params = [];

        if (filters.riskLevel) {
            params.push(filters.riskLevel);
            sql += ` AND risk_level = $${params.length}`;
        }

        if (filters.minScore !== undefined) {
            params.push(filters.minScore);
            sql += ` AND risk_score >= $${params.length}`;
        }

        if (filters.maxScore !== undefined) {
            params.push(filters.maxScore);
            sql += ` AND risk_score <= $${params.length}`;
        }

        if (filters.modelVersion) {
            params.push(filters.modelVersion);
            sql += ` AND model_version = $${params.length}`;
        }

        sql += ' ORDER BY created_at DESC';

        if (filters.limit) {
            params.push(filters.limit);
            sql += ` LIMIT $${params.length}`;
        }

        const result = await query(sql, params);
        return result.rows;
    }
}

class PredictiveDB {
    /**
     * Create a new forecast
     */
    static async createForecast(forecastData) {
        const sql = `
            INSERT INTO predictive_forecasts
            (forecast_id, event_id, forecast_type, target_entity, timeframe, prediction,
             confidence, methodology, factors, historical_data_hash, model_version, metadata)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
            RETURNING *
        `;
        const result = await query(sql, [
            forecastData.forecastId,
            forecastData.eventId,
            forecastData.forecastType,
            forecastData.targetEntity,
            forecastData.timeframe,
            JSON.stringify(forecastData.prediction),
            forecastData.confidence,
            forecastData.methodology,
            JSON.stringify(forecastData.factors || []),
            forecastData.historicalDataHash,
            forecastData.modelVersion,
            JSON.stringify(forecastData.metadata || {})
        ]);
        return result.rows[0];
    }

    /**
     * Verify forecast with actual outcome
     */
    static async verifyForecast(forecastId, actualOutcome, verifiedBy) {
        // Calculate accuracy
        const forecast = await this.getForecastById(forecastId);
        if (!forecast) return null;

        const predicted = parseFloat(forecast.prediction.value);
        const actual = parseFloat(actualOutcome.value);
        const accuracy = 100 - (Math.abs(predicted - actual) / actual * 100);

        const sql = `
            UPDATE predictive_forecasts
            SET actual_outcome = $1, accuracy = $2, verified_at = NOW(),
                metadata = jsonb_set(metadata, '{verifiedBy}', $3::jsonb)
            WHERE forecast_id = $4
            RETURNING *
        `;
        const result = await query(sql, [
            JSON.stringify(actualOutcome),
            accuracy.toFixed(2),
            JSON.stringify(verifiedBy),
            forecastId
        ]);
        return result.rows[0];
    }

    /**
     * Get forecast by ID
     */
    static async getForecastById(forecastId) {
        const sql = 'SELECT * FROM predictive_forecasts WHERE forecast_id = $1';
        const result = await query(sql, [forecastId]);
        if (result.rows[0] && typeof result.rows[0].prediction === 'string') {
            result.rows[0].prediction = JSON.parse(result.rows[0].prediction);
        }
        return result.rows[0];
    }

    /**
     * Get all forecasts with filters
     */
    static async getForecasts(filters = {}) {
        let sql = 'SELECT * FROM predictive_forecasts WHERE 1=1';
        const params = [];

        if (filters.forecastType) {
            params.push(filters.forecastType);
            sql += ` AND forecast_type = $${params.length}`;
        }

        if (filters.targetEntity) {
            params.push(filters.targetEntity);
            sql += ` AND target_entity = $${params.length}`;
        }

        sql += ' ORDER BY created_at DESC';

        if (filters.limit) {
            params.push(filters.limit);
            sql += ` LIMIT $${params.length}`;
        }

        const result = await query(sql, params);
        return result.rows;
    }
}

class StatsDB {
    /**
     * Get blockchain statistics
     */
    static async getBlockchainStats() {
        const sql = 'SELECT * FROM blockchain_stats';
        const result = await query(sql);
        return result.rows[0];
    }

    /**
     * Get event type statistics
     */
    static async getEventTypeStats() {
        const sql = 'SELECT * FROM event_type_stats';
        const result = await query(sql);
        return result.rows;
    }

    /**
     * Get module activity statistics
     */
    static async getModuleActivity() {
        const sql = 'SELECT * FROM module_activity';
        const result = await query(sql);
        return result.rows;
    }
}

module.exports = {
    BlockchainDB,
    EventDB,
    GhostBusterDB,
    WhistleProDB,
    AIRiskDB,
    PredictiveDB,
    StatsDB
};
