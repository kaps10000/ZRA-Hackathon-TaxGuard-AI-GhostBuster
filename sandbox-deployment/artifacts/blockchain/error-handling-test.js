#!/usr/bin/env node

/**
 * Comprehensive Error Handling Test Suite
 */

const http = require('http');

console.log('🛡️ COMPREHENSIVE ERROR HANDLING TESTS');
console.log('=====================================\n');

async function makeRequest(method, path, data = null) {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'localhost',
            port: 3001,
            path,
            method,
            headers: {
                'Content-Type': 'application/json'
            }
        };

        const req = http.request(options, (res) => {
            let body = '';
            res.on('data', (chunk) => body += chunk);
            res.on('end', () => {
                try {
                    resolve({
                        status: res.statusCode,
                        data: JSON.parse(body)
                    });
                } catch (e) {
                    resolve({
                        status: res.statusCode,
                        data: body
                    });
                }
            });
        });

        req.on('error', reject);
        
        if (data) {
            req.write(JSON.stringify(data));
        }
        
        req.end();
    });
}

async function runErrorTests() {
    const tests = [
        {
            name: 'Invalid endpoint',
            method: 'GET',
            path: '/invalid-endpoint',
            expectedStatus: 404
        },
        {
            name: 'Missing required fields',
            method: 'POST',
            path: '/api/events',
            data: { eventId: 'test' },
            expectedStatus: 400
        },
        {
            name: 'Invalid hash format',
            method: 'POST',
            path: '/api/events',
            data: {
                eventId: 'test-invalid-hash',
                eventType: 'filing',
                anonymizedUserId: 'user-test',
                hashOfPayload: 'invalid-hash',
                notes: 'test'
            },
            expectedStatus: 400
        },
        {
            name: 'Invalid event type',
            method: 'POST',
            path: '/api/events',
            data: {
                eventId: 'test-invalid-type',
                eventType: 'invalid-type',
                anonymizedUserId: 'user-test',
                hashOfPayload: 'a1b2c3d4e5f6789012345678901234567890abcdef1234567890abcdef123456',
                notes: 'test'
            },
            expectedStatus: 400
        },
        {
            name: 'Empty request body',
            method: 'POST',
            path: '/api/events',
            data: {},
            expectedStatus: 400
        },
        {
            name: 'Malformed JSON',
            method: 'POST',
            path: '/api/events',
            data: null,
            expectedStatus: 400
        }
    ];

    let passed = 0;
    let failed = 0;

    for (const test of tests) {
        try {
            console.log(`Testing: ${test.name}`);
            const result = await makeRequest(test.method, test.path, test.data);
            
            if (result.status === test.expectedStatus) {
                console.log(`✅ PASS - Status: ${result.status}`);
                if (result.data.error) {
                    console.log(`   Error: ${result.data.error}`);
                }
                passed++;
            } else {
                console.log(`❌ FAIL - Expected: ${test.expectedStatus}, Got: ${result.status}`);
                failed++;
            }
        } catch (error) {
            console.log(`❌ FAIL - Network error: ${error.message}`);
            failed++;
        }
        console.log('');
    }

    console.log('📊 ERROR HANDLING TEST RESULTS:');
    console.log(`✅ Passed: ${passed}`);
    console.log(`❌ Failed: ${failed}`);
    console.log(`📈 Success Rate: ${((passed / (passed + failed)) * 100).toFixed(1)}%`);
    
    return { passed, failed };
}

// Run tests
runErrorTests().catch(console.error);
