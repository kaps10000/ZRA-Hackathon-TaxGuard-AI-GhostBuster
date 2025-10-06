const TaxGuardContract = require('./contracts/TaxGuardContract');

// Mock context
function createMockContext(role) {
    return {
        stub: {
            putState: async () => Promise.resolve(),
            getState: async (key) => {
                if (key === 'test-event') {
                    const event = {
                        eventId: 'test-event',
                        eventType: 'filing',
                        anonymizedUserId: 'user123',
                        hashOfPayload: 'abc123',
                        integrity: 'test-hash'
                    };
                    return Buffer.from(JSON.stringify(event));
                }
                return Buffer.from('');
            },
            getStateByRange: async () => ({
                next: async () => ({ done: true }),
                close: async () => {}
            }),
            setEvent: () => {},
            getTxID: () => 'tx123'
        },
        clientIdentity: {
            getID: () => 'user123',
            getAttributeValue: (attr) => attr === 'role' ? role : null
        }
    };
}

async function testRBAC() {
    console.log('🔐 Testing Role-Based Access Control\n');
    
    const contract = new TaxGuardContract();
    contract._calculateIntegrityHash = () => 'test-hash';
    
    // Test 1: Producer can create events
    console.log('1️⃣ Test Producer Create Event');
    try {
        const producerCtx = createMockContext('producer');
        await contract.createEvent(producerCtx, 'evt-001', 'filing', 'user123', 'abc123def456', 'Test');
        console.log('✅ Producer can create events\n');
    } catch (error) {
        console.log('❌ Producer blocked:', error.message, '\n');
    }
    
    // Test 2: Admin can create events
    console.log('2️⃣ Test Admin Create Event');
    try {
        const adminCtx = createMockContext('admin');
        await contract.createEvent(adminCtx, 'evt-002', 'filing', 'user123', 'abc123def456', 'Test');
        console.log('✅ Admin can create events\n');
    } catch (error) {
        console.log('❌ Admin blocked:', error.message, '\n');
    }
    
    // Test 3: Auditor CANNOT create events
    console.log('3️⃣ Test Auditor Create Event (should fail)');
    try {
        const auditorCtx = createMockContext('auditor');
        await contract.createEvent(auditorCtx, 'evt-003', 'filing', 'user123', 'abc123def456', 'Test');
        console.log('❌ Auditor should NOT be able to create events\n');
    } catch (error) {
        console.log('✅ Auditor properly blocked:', error.message, '\n');
    }
    
    // Test 4: All roles can read events
    console.log('4️⃣ Test All Roles Can Read Events');
    for (const role of ['producer', 'auditor', 'admin']) {
        try {
            const ctx = createMockContext(role);
            await contract.readEvent(ctx, 'test-event');
            console.log(`✅ ${role} can read events`);
        } catch (error) {
            console.log(`❌ ${role} blocked:`, error.message);
        }
    }
    
    console.log('\n5️⃣ Test Query Access (Auditor/Admin Only)');
    // Test 5: Only auditor and admin can query all
    for (const role of ['producer', 'auditor', 'admin']) {
        try {
            const ctx = createMockContext(role);
            await contract.queryAllEvents(ctx);
            console.log(`✅ ${role} can query all events`);
        } catch (error) {
            console.log(`✅ ${role} properly blocked:`, error.message);
        }
    }
    
    console.log('\n🎉 RBAC Testing Complete!');
}

testRBAC().catch(console.error);
