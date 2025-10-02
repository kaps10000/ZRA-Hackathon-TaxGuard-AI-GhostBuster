#!/usr/bin/env node

/**
 * Simple TaxGuard Smart Contract Demo
 * Shows the contract logic without Fabric dependencies
 */

console.log('🧪 TaxGuard Smart Contract Demo\n');

// Simplified Smart Contract Logic
class TaxGuardContract {
    constructor() {
        this.roles = {
            PRODUCER: 'producer',
            AUDITOR: 'auditor', 
            ADMIN: 'admin'
        };
        this.events = new Map();
        this.config = null;
    }

    // Initialize ledger
    initLedger() {
        console.log('🚀 Initializing TaxGuard Ledger...');
        this.config = {
            contractVersion: '1.0.0',
            initialized: new Date().toISOString(),
            totalEvents: 0,
            supportedEventTypes: ['filing', 'payment', 'auditFlag', 'adminChange', 'compliance', 'whistleblower']
        };
        console.log('✅ Ledger initialized:', this.config);
        return this.config;
    }

    // Create event with role validation
    createEvent(userRole, eventId, eventType, anonymizedUserId, hashOfPayload, notes = '') {
        // Role-based access control
        if (userRole !== this.roles.PRODUCER && userRole !== this.roles.ADMIN) {
            throw new Error(`Access denied. Required role: ${this.roles.PRODUCER} or ${this.roles.ADMIN}`);
        }

        // Validate event type
        if (!this.config.supportedEventTypes.includes(eventType)) {
            throw new Error(`Invalid event type: ${eventType}`);
        }

        // Check for duplicate
        if (this.events.has(eventId)) {
            throw new Error(`Event ${eventId} already exists`);
        }

        // Create event
        const event = {
            eventId,
            eventType,
            timestamp: new Date().toISOString(),
            anonymizedUserId,
            hashOfPayload,
            notes,
            createdBy: userRole,
            integrity: this._calculateIntegrity(eventId, eventType, anonymizedUserId, hashOfPayload)
        };

        this.events.set(eventId, event);
        this.config.totalEvents++;
        
        console.log(`✅ Event ${eventId} created successfully`);
        return event;
    }

    // Read event with role validation
    readEvent(userRole, eventId) {
        if (userRole !== this.roles.PRODUCER && userRole !== this.roles.AUDITOR && userRole !== this.roles.ADMIN) {
            throw new Error('Access denied. Insufficient permissions');
        }

        const event = this.events.get(eventId);
        if (!event) {
            throw new Error(`Event ${eventId} not found`);
        }

        console.log(`📋 Event ${eventId} retrieved successfully`);
        return event;
    }

    // Query all events (auditor/admin only)
    queryAllEvents(userRole) {
        if (userRole !== this.roles.AUDITOR && userRole !== this.roles.ADMIN) {
            throw new Error('Access denied. Required role: auditor or admin');
        }

        const allEvents = Array.from(this.events.values());
        console.log(`📊 Retrieved ${allEvents.length} events`);
        return allEvents;
    }

    // Query events by type
    queryEventsByType(userRole, eventType) {
        if (userRole !== this.roles.AUDITOR && userRole !== this.roles.ADMIN) {
            throw new Error('Access denied. Required role: auditor or admin');
        }

        const filteredEvents = Array.from(this.events.values())
            .filter(event => event.eventType === eventType);
        
        console.log(`🔍 Found ${filteredEvents.length} events of type: ${eventType}`);
        return filteredEvents;
    }

    // Calculate integrity hash
    _calculateIntegrity(eventId, eventType, userId, payloadHash) {
        const crypto = require('crypto');
        const data = `${eventId}${eventType}${userId}${payloadHash}`;
        return crypto.createHash('sha256').update(data).digest('hex');
    }
}

// Demo execution
async function runDemo() {
    const contract = new TaxGuardContract();
    
    console.log('1️⃣ Initialize Ledger');
    contract.initLedger();
    
    console.log('\n2️⃣ Create Events (Producer Role)');
    try {
        contract.createEvent('producer', 'filing-001', 'filing', 'user-abc123', 
            'a1b2c3d4e5f6789012345678901234567890abcdef1234567890abcdef123456', 
            'VAT Return Q3 2025');
        
        contract.createEvent('producer', 'payment-002', 'payment', 'user-def456',
            'b2c3d4e5f6789012345678901234567890abcdef1234567890abcdef123456',
            'Income Tax Payment - K25,000');
            
        contract.createEvent('admin', 'audit-003', 'auditFlag', 'user-ghi789',
            'c3d4e5f6789012345678901234567890abcdef1234567890abcdef123456',
            'Risk Alert - Revenue Mismatch Detected');
    } catch (error) {
        console.log('❌ Error:', error.message);
    }
    
    console.log('\n3️⃣ Read Event (Auditor Role)');
    try {
        const event = contract.readEvent('auditor', 'filing-001');
        console.log('Event details:', event);
    } catch (error) {
        console.log('❌ Error:', error.message);
    }
    
    console.log('\n4️⃣ Query All Events (Auditor Role)');
    try {
        const allEvents = contract.queryAllEvents('auditor');
        console.log(`Total events: ${allEvents.length}`);
        allEvents.forEach(event => {
            console.log(`- ${event.eventId}: ${event.eventType} (${event.notes.substring(0, 30)}...)`);
        });
    } catch (error) {
        console.log('❌ Error:', error.message);
    }
    
    console.log('\n5️⃣ Test Access Control (Unauthorized User)');
    try {
        contract.createEvent('unauthorized', 'hack-001', 'filing', 'hacker', 'fakehash', 'Malicious attempt');
    } catch (error) {
        console.log('✅ Access properly denied:', error.message);
    }
    
    console.log('\n6️⃣ Query Events by Type');
    try {
        const filingEvents = contract.queryEventsByType('auditor', 'filing');
        console.log('Filing events:', filingEvents.map(e => e.eventId));
    } catch (error) {
        console.log('❌ Error:', error.message);
    }
    
    console.log('\n🎉 Smart Contract Demo Complete!');
    console.log('\n📊 Final Statistics:');
    console.log(`- Total Events: ${contract.config.totalEvents}`);
    console.log(`- Event Types: ${Array.from(new Set(Array.from(contract.events.values()).map(e => e.eventType))).join(', ')}`);
    console.log(`- Contract Version: ${contract.config.contractVersion}`);
}

runDemo().catch(console.error);
