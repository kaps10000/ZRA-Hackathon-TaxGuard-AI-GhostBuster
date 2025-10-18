#!/usr/bin/env node

/**
 * Interactive Smart Contract Test Interface
 * Test TaxGuard Smart Contract functionality
 */

const TaxGuardContract = require('./contracts/TaxGuardContract');

// Mock Fabric Context
class MockContext {
    constructor(userRole = 'producer') {
        this.stub = new MockStub();
        this.clientIdentity = new MockClientIdentity(userRole);
    }
}

class MockStub {
    constructor() {
        this.state = new Map();
    }

    async getState(key) {
        const value = this.state.get(key);
        return value ? Buffer.from(value) : Buffer.alloc(0);
    }

    async putState(key, value) {
        this.state.set(key, value.toString());
    }

    async getStateByRange(startKey, endKey) {
        const results = [];
        for (const [key, value] of this.state.entries()) {
            if (key >= startKey && key <= endKey) {
                results.push({ key, value: Buffer.from(value) });
            }
        }
        return { iterator: results };
    }

    async getHistoryForKey(key) {
        const value = this.state.get(key);
        return {
            iterator: value ? [{ value: Buffer.from(value), timestamp: { seconds: Date.now() / 1000 } }] : []
        };
    }
}

class MockClientIdentity {
    constructor(role) {
        this.role = role;
    }

    getMSPID() {
        return 'TaxGuardMSP';
    }

    getAttributeValue(attr) {
        if (attr === 'role') return this.role;
        return null;
    }
}

// Test Functions
async function testSmartContract() {
    console.log('🧪 TaxGuard Smart Contract Interactive Test\n');
    
    const contract = new TaxGuardContract();
    
    // Test 1: Initialize Ledger
    console.log('1️⃣ Testing Ledger Initialization...');
    const adminCtx = new MockContext('admin');
    try {
        const result = await contract.initLedger(adminCtx);
        console.log('✅ Ledger initialized:', JSON.parse(result));
    } catch (error) {
        console.log('❌ Error:', error.message);
    }
    
    // Test 2: Create Event as Producer
    console.log('\n2️⃣ Testing Event Creation (Producer Role)...');
    const producerCtx = new MockContext('producer');
    try {
        await contract.createEvent(
            producerCtx,
            'test-filing-001',
            'filing',
            'user-abc123',
            'a1b2c3d4e5f6789012345678901234567890abcdef1234567890abcdef123456',
            'VAT Return Q3 2025'
        );
        console.log('✅ Event created successfully');
    } catch (error) {
        console.log('❌ Error:', error.message);
    }
    
    // Test 3: Read Event as Auditor
    console.log('\n3️⃣ Testing Event Reading (Auditor Role)...');
    const auditorCtx = new MockContext('auditor');
    try {
        const event = await contract.readEvent(auditorCtx, 'test-filing-001');
        console.log('✅ Event retrieved:', JSON.parse(event));
    } catch (error) {
        console.log('❌ Error:', error.message);
    }
    
    // Test 4: Query All Events
    console.log('\n4️⃣ Testing Query All Events (Auditor Role)...');
    try {
        const events = await contract.queryAllEvents(auditorCtx);
        console.log('✅ All events:', JSON.parse(events));
    } catch (error) {
        console.log('❌ Error:', error.message);
    }
    
    // Test 5: Access Control Test
    console.log('\n5️⃣ Testing Access Control (Unauthorized Role)...');
    const unauthorizedCtx = new MockContext('unauthorized');
    try {
        await contract.createEvent(
            unauthorizedCtx,
            'test-unauthorized-001',
            'filing',
            'user-xyz789',
            'b2c3d4e5f6789012345678901234567890abcdef1234567890abcdef123456',
            'Unauthorized attempt'
        );
        console.log('❌ Should have been denied!');
    } catch (error) {
        console.log('✅ Access properly denied:', error.message);
    }
    
    // Test 6: Create Different Event Types
    console.log('\n6️⃣ Testing Different Event Types...');
    const eventTypes = [
        { type: 'payment', notes: 'Income Tax Payment - K25,000' },
        { type: 'auditFlag', notes: 'Risk Alert - Revenue Mismatch' },
        { type: 'compliance', notes: 'Business License Verification' }
    ];
    
    for (let i = 0; i < eventTypes.length; i++) {
        try {
            await contract.createEvent(
                producerCtx,
                `test-${eventTypes[i].type}-00${i + 1}`,
                eventTypes[i].type,
                `user-${i + 1}`,
                `hash${i}${'0'.repeat(60)}`,
                eventTypes[i].notes
            );
            console.log(`✅ ${eventTypes[i].type} event created`);
        } catch (error) {
            console.log(`❌ ${eventTypes[i].type} error:`, error.message);
        }
    }
    
    // Test 7: Query Events by Type
    console.log('\n7️⃣ Testing Query by Event Type...');
    try {
        const filingEvents = await contract.queryEventsByType(auditorCtx, 'filing');
        console.log('✅ Filing events:', JSON.parse(filingEvents));
    } catch (error) {
        console.log('❌ Error:', error.message);
    }
    
    console.log('\n🎉 Smart Contract Testing Complete!');
}

// Run tests
if (require.main === module) {
    testSmartContract().catch(console.error);
}

module.exports = { testSmartContract };
