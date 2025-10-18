const { Contract } = require('fabric-contract-api');
const crypto = require('crypto');

/**
 * TaxGuard Smart Contract for Immutable Tax Event Recording
 * Implements role-based access control and secure event management
 */
class TaxGuardContract extends Contract {

    constructor() {
        super('TaxGuardContract');
        this.roles = {
            PRODUCER: 'producer',    // TaxGuard AI, WhistlePro
            AUDITOR: 'auditor',      // ZRA Officials
            ADMIN: 'admin'           // System Administrators
        };
    }

    /**
     * Initialize the ledger with default configuration
     */
    async initLedger(ctx) {
        console.log('🚀 Initializing TaxGuard Ledger...');
        
        const config = {
            contractVersion: '1.0.0',
            initialized: new Date().toISOString(),
            totalEvents: 0,
            supportedEventTypes: ['filing', 'payment', 'auditFlag', 'adminChange', 'compliance', 'whistleblower']
        };

        await ctx.stub.putState('CONFIG', Buffer.from(JSON.stringify(config)));
        console.log('✅ TaxGuard Ledger initialized successfully');
        return JSON.stringify(config);
    }

    /**
     * Create a new tax event with role-based access control
     * @param {Context} ctx - Transaction context
     * @param {string} eventId - Unique event identifier
     * @param {string} eventType - Type of tax event
     * @param {string} anonymizedUserId - Anonymized user ID
     * @param {string} hashOfPayload - SHA256 hash of event payload
     * @param {string} notes - Additional event details
     */
    async createEvent(ctx, eventId, eventType, anonymizedUserId, hashOfPayload, notes = '') {
        // Role-based access control
        const userRole = await this._getUserRole(ctx);
        if (userRole !== this.roles.PRODUCER && userRole !== this.roles.ADMIN) {
            throw new Error(`Access denied. Required role: ${this.roles.PRODUCER} or ${this.roles.ADMIN}`);
        }

        // Validate inputs
        this._validateEventInputs(eventId, eventType, anonymizedUserId, hashOfPayload);

        // Check if event already exists
        const existingEvent = await ctx.stub.getState(eventId);
        if (existingEvent && existingEvent.length > 0) {
            throw new Error(`Event ${eventId} already exists`);
        }

        // Create event object
        const event = {
            eventId,
            eventType,
            timestamp: new Date().toISOString(),
            anonymizedUserId,
            hashOfPayload,
            notes,
            createdBy: ctx.clientIdentity.getID(),
            blockNumber: ctx.stub.getTxID(),
            integrity: this._calculateIntegrityHash(eventId, eventType, anonymizedUserId, hashOfPayload)
        };

        // Store event on ledger
        await ctx.stub.putState(eventId, Buffer.from(JSON.stringify(event)));

        // Update total events counter
        await this._incrementEventCounter(ctx);

        // Emit event for real-time notifications
        ctx.stub.setEvent('EventCreated', Buffer.from(JSON.stringify({
            eventId,
            eventType,
            timestamp: event.timestamp,
            createdBy: event.createdBy
        })));

        console.log(`✅ Event ${eventId} created successfully`);
        return JSON.stringify(event);
    }

    /**
     * Read a specific tax event
     * @param {Context} ctx - Transaction context
     * @param {string} eventId - Event identifier to retrieve
     */
    async readEvent(ctx, eventId) {
        // Role-based access control
        const userRole = await this._getUserRole(ctx);
        if (!userRole || !Object.values(this.roles).includes(userRole)) {
            throw new Error('Access denied. Valid role required.');
        }

        const eventBytes = await ctx.stub.getState(eventId);
        if (!eventBytes || eventBytes.length === 0) {
            throw new Error(`Event ${eventId} not found`);
        }

        const event = JSON.parse(eventBytes.toString());
        
        // Verify integrity
        const expectedHash = this._calculateIntegrityHash(
            event.eventId, 
            event.eventType, 
            event.anonymizedUserId, 
            event.hashOfPayload
        );
        
        if (event.integrity !== expectedHash) {
            throw new Error(`Integrity check failed for event ${eventId}`);
        }

        console.log(`📋 Event ${eventId} retrieved successfully`);
        return eventBytes.toString();
    }

    /**
     * Query all events (auditor and admin only)
     * @param {Context} ctx - Transaction context
     */
    async queryAllEvents(ctx) {
        const userRole = await this._getUserRole(ctx);
        if (userRole !== this.roles.AUDITOR && userRole !== this.roles.ADMIN) {
            throw new Error(`Access denied. Required role: ${this.roles.AUDITOR} or ${this.roles.ADMIN}`);
        }

        const iterator = await ctx.stub.getStateByRange('', '');
        const events = [];

        while (true) {
            const result = await iterator.next();
            if (result.value && result.value.value.toString()) {
                try {
                    const event = JSON.parse(result.value.value.toString());
                    if (event.eventId) { // Filter out non-event records
                        events.push(event);
                    }
                } catch (err) {
                    // Skip invalid JSON records
                }
            }
            if (result.done) {
                await iterator.close();
                break;
            }
        }

        console.log(`📊 Retrieved ${events.length} events`);
        return JSON.stringify(events);
    }

    /**
     * Query events by type (auditor and admin only)
     * @param {Context} ctx - Transaction context
     * @param {string} eventType - Type of events to query
     */
    async queryEventsByType(ctx, eventType) {
        const userRole = await this._getUserRole(ctx);
        if (userRole !== this.roles.AUDITOR && userRole !== this.roles.ADMIN) {
            throw new Error(`Access denied. Required role: ${this.roles.AUDITOR} or ${this.roles.ADMIN}`);
        }

        const queryString = {
            selector: {
                eventType: eventType
            }
        };

        const iterator = await ctx.stub.getQueryResult(JSON.stringify(queryString));
        const events = [];

        while (true) {
            const result = await iterator.next();
            if (result.value && result.value.value.toString()) {
                events.push(JSON.parse(result.value.value.toString()));
            }
            if (result.done) {
                await iterator.close();
                break;
            }
        }

        return JSON.stringify(events);
    }

    /**
     * Get event history (admin only)
     * @param {Context} ctx - Transaction context
     * @param {string} eventId - Event ID to get history for
     */
    async getEventHistory(ctx, eventId) {
        const userRole = await this._getUserRole(ctx);
        if (userRole !== this.roles.ADMIN) {
            throw new Error(`Access denied. Required role: ${this.roles.ADMIN}`);
        }

        const iterator = await ctx.stub.getHistoryForKey(eventId);
        const history = [];

        while (true) {
            const result = await iterator.next();
            if (result.value && result.value.value.toString()) {
                history.push({
                    txId: result.value.tx_id,
                    timestamp: result.value.timestamp,
                    isDelete: result.value.is_delete,
                    value: JSON.parse(result.value.value.toString())
                });
            }
            if (result.done) {
                await iterator.close();
                break;
            }
        }

        return JSON.stringify(history);
    }

    // Private helper methods

    /**
     * Get user role from client identity
     */
    async _getUserRole(ctx) {
        // In production, this would check client certificates and attributes
        // For demo purposes, we'll use a simple attribute check
        try {
            const role = ctx.clientIdentity.getAttributeValue('role');
            return role || this.roles.PRODUCER; // Default to producer for demo
        } catch (error) {
            return this.roles.PRODUCER; // Default role
        }
    }

    /**
     * Validate event inputs
     */
    _validateEventInputs(eventId, eventType, anonymizedUserId, hashOfPayload) {
        if (!eventId || eventId.trim().length === 0) {
            throw new Error('Event ID is required');
        }
        
        const validTypes = ['filing', 'payment', 'auditFlag', 'adminChange', 'compliance', 'whistleblower'];
        if (!validTypes.includes(eventType)) {
            throw new Error(`Invalid event type. Must be one of: ${validTypes.join(', ')}`);
        }

        if (!anonymizedUserId || anonymizedUserId.trim().length === 0) {
            throw new Error('Anonymized User ID is required');
        }

        if (!hashOfPayload || !/^[a-fA-F0-9]+$/.test(hashOfPayload)) {
            throw new Error('Hash of payload must be a valid hexadecimal string');
        }
    }

    /**
     * Calculate integrity hash for event verification
     */
    _calculateIntegrityHash(eventId, eventType, anonymizedUserId, hashOfPayload) {
        const data = `${eventId}${eventType}${anonymizedUserId}${hashOfPayload}`;
        return crypto.createHash('sha256').update(data).digest('hex');
    }

    /**
     * Increment the total events counter
     */
    async _incrementEventCounter(ctx) {
        const configBytes = await ctx.stub.getState('CONFIG');
        if (configBytes && configBytes.length > 0) {
            const config = JSON.parse(configBytes.toString());
            config.totalEvents = (config.totalEvents || 0) + 1;
            config.lastUpdated = new Date().toISOString();
            await ctx.stub.putState('CONFIG', Buffer.from(JSON.stringify(config)));
        }
    }
}

module.exports = TaxGuardContract;
