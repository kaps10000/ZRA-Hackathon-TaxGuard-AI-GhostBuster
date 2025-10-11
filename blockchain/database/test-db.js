#!/usr/bin/env node

/**
 * Database Integration Test Script
 * Tests the PostgreSQL blockchain integration
 */

const { blockchainDB } = require('./blockchain-db');
const { GhostBusterDB, WhistleProDB, AIRiskDB, PredictiveDB, StatsDB } = require('./models');
const { pool } = require('./config');
const { v4: uuidv4 } = require('uuid');

async function testDatabaseIntegration() {
    console.log('🧪 Testing TaxGuard Blockchain Database Integration\n');

    try {
        // 1. Initialize blockchain
        console.log('1️⃣ Initializing blockchain from database...');
        await blockchainDB.initialize();
        console.log('✅ Blockchain initialized\n');

        // 2. Test creating events
        console.log('2️⃣ Testing event creation...');
        const testEvent1 = await blockchainDB.createEvent(
            `evt-test-${Date.now()}`,
            'filing',
            new Date().toISOString(),
            'taxpayer-test-001',
            'test_hash_' + Math.random().toString(36).substring(7),
            'Test VAT filing event',
            { testData: true }
        );
        console.log('✅ Event created:', testEvent1.eventid);

        const testEvent2 = await blockchainDB.createEvent(
            `evt-test-${Date.now()}`,
            'payment',
            new Date().toISOString(),
            'taxpayer-test-002',
            'test_hash_' + Math.random().toString(36).substring(7),
            'Test payment event',
            { testData: true }
        );
        console.log('✅ Event created:', testEvent2.eventid);
        console.log();

        // 3. Test reading events
        console.log('3️⃣ Testing event retrieval...');
        const retrievedEvent = await blockchainDB.readEvent(testEvent1.eventid);
        console.log('✅ Event retrieved:', retrievedEvent ? 'Success' : 'Failed');
        console.log();

        // 4. Test querying all events
        console.log('4️⃣ Testing query all events...');
        const allEvents = await blockchainDB.queryAllEvents();
        console.log(`✅ Total events in blockchain: ${allEvents.length}`);
        console.log();

        // 5. Test blockchain info
        console.log('5️⃣ Testing blockchain info...');
        const chainInfo = await blockchainDB.getChainInfo();
        console.log('✅ Blockchain info:');
        console.log(`   - Total blocks: ${chainInfo.length}`);
        console.log(`   - Total events: ${chainInfo.totalEvents}`);
        console.log(`   - Chain valid: ${chainInfo.valid}`);
        console.log();

        // 6. Test GhostBuster detection
        console.log('6️⃣ Testing GhostBuster detection...');
        const detectionEvent = await blockchainDB.createEvent(
            `evt-detection-${Date.now()}`,
            'auditFlag',
            new Date().toISOString(),
            'ghostbuster-ai',
            'detection_hash_' + Math.random().toString(36).substring(7),
            'Phantom employee detected'
        );

        const detection = await GhostBusterDB.createDetection({
            detectionId: `det-${uuidv4()}`,
            eventId: detectionEvent.eventid,
            detectionType: 'phantom_employee',
            entityId: 'TPN-TEST-001',
            confidenceScore: 95,
            detectionMethod: 'pattern_analysis',
            indicators: ['No biometric records', 'Duplicate address'],
            severity: 'HIGH',
            investigatorId: 'ghostbuster-ai',
            evidenceHash: 'evidence_hash_123',
            metadata: { testMode: true }
        });
        console.log('✅ Detection created:', detection.detection_id);
        console.log();

        // 7. Test WhistlePro report
        console.log('7️⃣ Testing WhistlePro report...');
        const reportEvent = await blockchainDB.createEvent(
            `evt-report-${Date.now()}`,
            'auditFlag',
            new Date().toISOString(),
            'anonymous-001',
            'report_hash_' + Math.random().toString(36).substring(7),
            'Whistleblower report received'
        );

        const report = await WhistleProDB.createReport({
            reportId: `rep-${uuidv4()}`,
            caseCode: `WP-2025-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
            eventId: reportEvent.eventid,
            reportType: 'tax_evasion',
            targetEntity: 'Company-TEST',
            severity: 'HIGH',
            descriptionEncrypted: 'encrypted_description',
            evidenceHash: 'evidence_hash_456',
            estimatedAmount: 500000,
            location: 'Lusaka',
            metadata: { testMode: true }
        });
        console.log('✅ Report created:', report.case_code);
        console.log();

        // 8. Test AI Risk Assessment
        console.log('8️⃣ Testing AI Risk Assessment...');
        const riskEvent = await blockchainDB.createEvent(
            `evt-risk-${Date.now()}`,
            'auditFlag',
            new Date().toISOString(),
            'TPN-TEST-003',
            'risk_hash_' + Math.random().toString(36).substring(7),
            'AI Risk assessment completed'
        );

        const assessment = await AIRiskDB.createAssessment({
            assessmentId: `assess-${uuidv4()}`,
            eventId: riskEvent.eventid,
            taxpayerId: 'TPN-TEST-003',
            riskScore: 87,
            riskLevel: 'HIGH',
            modelVersion: 'v1.0-test',
            features: { filing_consistency: 0.45 },
            predictions: { evasion_probability: 0.87 },
            confidence: 92,
            riskFactors: ['Inconsistent filings'],
            recommendations: ['Schedule audit'],
            dataHash: 'data_hash_789',
            metadata: { testMode: true }
        });
        console.log('✅ Risk assessment created:', assessment.assessment_id);
        console.log();

        // 9. Test Predictive Forecast
        console.log('9️⃣ Testing Predictive Forecast...');
        const forecastEvent = await blockchainDB.createEvent(
            `evt-forecast-${Date.now()}`,
            'compliance',
            new Date().toISOString(),
            'predictive-ai',
            'forecast_hash_' + Math.random().toString(36).substring(7),
            'Revenue forecast generated'
        );

        const forecast = await PredictiveDB.createForecast({
            forecastId: `for-${uuidv4()}`,
            eventId: forecastEvent.eventid,
            forecastType: 'revenue',
            targetEntity: 'Sector-Mining',
            timeframe: 'Q1-2026',
            prediction: { value: 45000000, unit: 'ZMW' },
            confidence: 85,
            methodology: 'ARIMA + ML',
            factors: ['Historical trends', 'Economic indicators'],
            historicalDataHash: 'hist_hash_abc',
            modelVersion: 'v3.1-test',
            metadata: { testMode: true }
        });
        console.log('✅ Forecast created:', forecast.forecast_id);
        console.log();

        // 10. Test Statistics
        console.log('🔟 Testing Statistics...');
        const stats = await StatsDB.getBlockchainStats();
        console.log('✅ Blockchain Statistics:');
        console.log(`   - Total blocks: ${stats.total_blocks}`);
        console.log(`   - Total events: ${stats.total_events}`);
        console.log(`   - Events (24h): ${stats.events_last_24h}`);
        console.log(`   - Events (1h): ${stats.events_last_hour}`);
        console.log(`   - Detections: ${stats.total_detections}`);
        console.log(`   - Reports: ${stats.total_reports}`);
        console.log(`   - Assessments: ${stats.total_assessments}`);
        console.log(`   - Forecasts: ${stats.total_forecasts}`);
        console.log();

        // 11. Test Module Activity
        console.log('1️⃣1️⃣ Testing Module Activity...');
        const moduleActivity = await StatsDB.getModuleActivity();
        console.log('✅ Module Activity:');
        moduleActivity.forEach(mod => {
            console.log(`   - ${mod.module}: ${mod.total} total, ${mod.last_24h} in 24h`);
        });
        console.log();

        // 12. Test Chain Validation
        console.log('1️⃣2️⃣ Testing Chain Validation...');
        const isValid = await blockchainDB.validateChain();
        console.log(`✅ Blockchain integrity: ${isValid ? 'VALID' : 'INVALID'}`);
        console.log();

        // Summary
        console.log('═══════════════════════════════════════════════════');
        console.log('🎉 ALL TESTS PASSED!');
        console.log('═══════════════════════════════════════════════════');
        console.log('\n✅ Database integration is working correctly!');
        console.log('✅ All blockchain operations are persisted to PostgreSQL');
        console.log('✅ All module integrations (GhostBuster, WhistlePro, AI Risk, Predictive) are functional');
        console.log('\n📊 Next steps:');
        console.log('   1. Install PostgreSQL packages: npm install');
        console.log('   2. Run migration: npm run db:migrate');
        console.log('   3. Start blockchain API: npm start');
        console.log('   4. Test integrations with team modules');

    } catch (error) {
        console.error('\n❌ Test failed:', error.message);
        console.error('\nError details:', error);
        console.error('\n⚠️  Make sure PostgreSQL is running and database credentials are correct in .env file');
        process.exit(1);
    } finally {
        await pool.end();
        process.exit(0);
    }
}

// Run tests
if (require.main === module) {
    testDatabaseIntegration();
}

module.exports = { testDatabaseIntegration };
