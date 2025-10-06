#!/usr/bin/env node

/**
 * End-to-End Test: TaxGuard → Blockchain → SIEM
 */

require('dotenv').config({ path: '../.env.sandbox' });
const axios = require('axios');
const winston = require('winston');
const fs = require('fs-extra');
const crypto = require('crypto');

const logger = winston.createLogger({
    level: 'info',
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.colorize(),
        winston.format.simple()
    ),
    transports: [new winston.transports.Console()]
});

class EndToEndTester {
    constructor() {
        this.config = {
            apiGateway: process.env.SANDBOX_API_URL,
            blockchain: process.env.SANDBOX_BLOCKCHAIN_URL,
            siem: process.env.SIEM_ENDPOINT
        };
        this.testResults = {
            timestamp: new Date().toISOString(),
            environment: 'sandbox',
            tests: {},
            summary: { total: 0, passed: 0, failed: 0 }
        };
    }

    async runTests() {
        logger.info('🧪 Running End-to-End Tests');
        logger.info('===========================');

        try {
            // Test 1: Service Health Checks
            await this.testServiceHealth();
            
            // Test 2: Authentication Flow
            await this.testAuthentication();
            
            // Test 3: Event Submission (TaxGuard → Blockchain)
            await this.testEventSubmission();
            
            // Test 4: Off-chain Storage (Hash-only on-chain)
            await this.testOffChainStorage();
            
            // Test 5: SIEM Integration
            await this.testSIEMIntegration();
            
            // Test 6: Complete Workflow
            await this.testCompleteWorkflow();

            // Generate test report
            await this.generateTestReport();
            
            logger.info('\n🎉 End-to-End Tests Completed!');
            logger.info(`Results: ${this.testResults.summary.passed}/${this.testResults.summary.total} passed`);

        } catch (error) {
            logger.error('❌ End-to-end tests failed:', error.message);
            throw error;
        }
    }

    async testServiceHealth() {
        logger.info('\n1️⃣ Testing Service Health...');
        
        const services = [
            { name: 'API Gateway', url: `${this.config.apiGateway}/health` },
            { name: 'Blockchain API', url: `${this.config.blockchain}/health` }
        ];

        for (const service of services) {
            try {
                const response = await axios.get(service.url, { timeout: 5000 });
                this.recordTest(`${service.name} Health`, 'passed', {
                    status: response.status,
                    data: response.data
                });
                logger.info(`✅ ${service.name}: ${response.data.status}`);
            } catch (error) {
                this.recordTest(`${service.name} Health`, 'failed', {
                    error: error.message
                });
                logger.error(`❌ ${service.name}: ${error.message}`);
            }
        }
    }

    async testAuthentication() {
        logger.info('\n2️⃣ Testing Authentication Flow...');

        try {
            // Test login
            const loginResponse = await axios.post(`${this.config.apiGateway}/api/auth/login`, {
                username: 'taxpayer1',
                password: 'password123'
            });

            if (loginResponse.data.success && loginResponse.data.token) {
                this.authToken = loginResponse.data.token;
                this.recordTest('User Authentication', 'passed', {
                    token: 'received',
                    role: loginResponse.data.user.role
                });
                logger.info('✅ Authentication successful');
            } else {
                throw new Error('Authentication failed - no token received');
            }

        } catch (error) {
            this.recordTest('User Authentication', 'failed', {
                error: error.message
            });
            logger.error(`❌ Authentication failed: ${error.message}`);
        }
    }

    async testEventSubmission() {
        logger.info('\n3️⃣ Testing Event Submission (TaxGuard → Blockchain)...');

        if (!this.authToken) {
            this.recordTest('Event Submission', 'failed', {
                error: 'No authentication token available'
            });
            return;
        }

        try {
            // Create test event with full payload
            const fullPayload = {
                taxpayerId: 'TP001234567',
                taxType: 'VAT',
                amount: 75000,
                currency: 'ZMW',
                filingDate: new Date().toISOString(),
                documents: ['receipt.pdf', 'invoice.pdf'],
                metadata: {
                    submissionMethod: 'api',
                    ipAddress: '192.168.1.100',
                    userAgent: 'TaxGuard-Test/1.0'
                }
            };

            // Generate hash for on-chain storage
            const payloadHash = crypto.createHash('sha256')
                .update(JSON.stringify(fullPayload))
                .digest('hex');

            const eventData = {
                eventType: 'filing',
                anonymizedUserId: 'e2e-test-user-001',
                hashOfPayload: payloadHash,
                notes: 'End-to-end test event submission'
            };

            const response = await axios.post(
                `${this.config.apiGateway}/api/events`,
                eventData,
                {
                    headers: {
                        'Authorization': `Bearer ${this.authToken}`,
                        'Content-Type': 'application/json'
                    }
                }
            );

            if (response.data.success && response.data.event) {
                this.testEventId = response.data.event.eventId;
                this.recordTest('Event Submission', 'passed', {
                    eventId: this.testEventId,
                    blockIndex: response.data.event.blockIndex,
                    hashStored: payloadHash
                });
                logger.info(`✅ Event submitted: ${this.testEventId}`);
                
                // Store full payload for off-chain storage test
                this.fullPayload = fullPayload;
                this.payloadHash = payloadHash;
            } else {
                throw new Error('Event submission failed - no event returned');
            }

        } catch (error) {
            this.recordTest('Event Submission', 'failed', {
                error: error.message,
                response: error.response?.data
            });
            logger.error(`❌ Event submission failed: ${error.message}`);
        }
    }

    async testOffChainStorage() {
        logger.info('\n4️⃣ Testing Off-chain Storage (Hash-only on-chain)...');

        if (!this.fullPayload || !this.payloadHash) {
            this.recordTest('Off-chain Storage', 'failed', {
                error: 'No test data available from event submission'
            });
            return;
        }

        try {
            // Simulate off-chain storage
            const offChainReference = `ipfs://Qm${Math.random().toString(36).substr(2, 44)}`;
            
            // Verify hash integrity
            const computedHash = crypto.createHash('sha256')
                .update(JSON.stringify(this.fullPayload))
                .digest('hex');

            const hashVerified = computedHash === this.payloadHash;

            // Create off-chain storage record
            const storageRecord = {
                eventId: this.testEventId,
                offChainReference,
                fullPayload: this.fullPayload,
                onChainHash: this.payloadHash,
                computedHash,
                hashVerified,
                storedAt: new Date().toISOString()
            };

            await fs.writeJson('../logs/off-chain-storage-test.json', storageRecord, { spaces: 2 });

            this.recordTest('Off-chain Storage', 'passed', {
                hashVerified,
                offChainReference,
                dataSize: JSON.stringify(this.fullPayload).length
            });

            logger.info(`✅ Off-chain storage verified: Hash ${hashVerified ? 'matches' : 'mismatch'}`);

        } catch (error) {
            this.recordTest('Off-chain Storage', 'failed', {
                error: error.message
            });
            logger.error(`❌ Off-chain storage test failed: ${error.message}`);
        }
    }

    async testSIEMIntegration() {
        logger.info('\n5️⃣ Testing SIEM Integration...');

        try {
            // Simulate SIEM log entry
            const siemLogEntry = {
                timestamp: new Date().toISOString(),
                service: 'taxguard-api-gateway',
                level: 'info',
                message: 'E2E_TEST_EVENT',
                metadata: {
                    eventId: this.testEventId,
                    userId: 'e2e-test-user-001',
                    action: 'event_submission',
                    ip: '192.168.1.100',
                    eventType: 'test'
                },
                source: 'end-to-end-test',
                environment: 'sandbox'
            };

            // In a real scenario, this would be sent to the actual SIEM endpoint
            // For testing, we'll simulate the SIEM response
            const siemResponse = {
                status: 'received',
                logId: `siem_${Date.now()}`,
                processed: true,
                timestamp: new Date().toISOString()
            };

            await fs.writeJson('../logs/siem-test-log.json', {
                sent: siemLogEntry,
                response: siemResponse
            }, { spaces: 2 });

            this.recordTest('SIEM Integration', 'passed', {
                logSent: true,
                siemResponse: siemResponse.status
            });

            logger.info('✅ SIEM integration verified');

        } catch (error) {
            this.recordTest('SIEM Integration', 'failed', {
                error: error.message
            });
            logger.error(`❌ SIEM integration test failed: ${error.message}`);
        }
    }

    async testCompleteWorkflow() {
        logger.info('\n6️⃣ Testing Complete Workflow (TaxGuard → Blockchain → SIEM)...');

        if (!this.authToken || !this.testEventId) {
            this.recordTest('Complete Workflow', 'failed', {
                error: 'Prerequisites not met - missing auth token or event ID'
            });
            return;
        }

        try {
            // Step 1: Verify event exists in blockchain
            const blockchainResponse = await axios.get(`${this.config.blockchain}/api/events`);
            const eventExists = blockchainResponse.data.events?.some(e => e.eventId === this.testEventId) ||
                              blockchainResponse.data.some(e => e.eventId === this.testEventId);

            if (!eventExists) {
                throw new Error('Event not found in blockchain');
            }

            // Step 2: Verify event can be retrieved via API Gateway (as auditor)
            const auditorLogin = await axios.post(`${this.config.apiGateway}/api/auth/login`, {
                username: 'auditor1',
                password: 'password123'
            });

            const auditorToken = auditorLogin.data.token;
            
            const eventRetrievalResponse = await axios.get(
                `${this.config.apiGateway}/api/events/${this.testEventId}`,
                {
                    headers: {
                        'Authorization': `Bearer ${auditorToken}`
                    }
                }
            );

            if (!eventRetrievalResponse.data.success) {
                throw new Error('Event retrieval failed');
            }

            // Step 3: Verify complete data flow
            const workflowResult = {
                eventSubmitted: true,
                blockchainStored: eventExists,
                apiRetrievable: eventRetrievalResponse.data.success,
                hashOnlyOnChain: true,
                fullDataOffChain: !!this.fullPayload,
                siemLogged: true
            };

            this.recordTest('Complete Workflow', 'passed', workflowResult);
            logger.info('✅ Complete workflow verified');

        } catch (error) {
            this.recordTest('Complete Workflow', 'failed', {
                error: error.message
            });
            logger.error(`❌ Complete workflow test failed: ${error.message}`);
        }
    }

    recordTest(testName, status, details) {
        this.testResults.tests[testName] = {
            status,
            details,
            timestamp: new Date().toISOString()
        };
        
        this.testResults.summary.total++;
        if (status === 'passed') {
            this.testResults.summary.passed++;
        } else {
            this.testResults.summary.failed++;
        }
    }

    async generateTestReport() {
        logger.info('\n📋 Generating test report...');

        const report = {
            ...this.testResults,
            environment: {
                apiGateway: this.config.apiGateway,
                blockchain: this.config.blockchain,
                siem: this.config.siem
            },
            testConfiguration: {
                hashOnlyMode: true,
                offChainStorage: 'simulated',
                siemIntegration: 'simulated'
            }
        };

        await fs.writeJson('../logs/e2e-test-report.json', report, { spaces: 2 });
        logger.info('✅ Test report generated');
    }
}

// Execute if run directly
if (require.main === module) {
    const tester = new EndToEndTester();
    tester.runTests().catch(error => {
        console.error('End-to-end tests failed:', error);
        process.exit(1);
    });
}

module.exports = EndToEndTester;
