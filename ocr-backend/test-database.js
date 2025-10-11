/**
 * Database Testing Script
 * Tests database connection and queries security data
 */

const { connectDatabase } = require('./config/database');
const { initializeModels, getModels } = require('./models');
const { QueryTypes } = require('sequelize');

async function testDatabase() {
    console.log('🔬 ZRA TaxGuard OCR - Database Testing\n');

    try {
        // 1. Connect to database
        console.log('1️⃣  Connecting to database...');
        const sequelize = await connectDatabase();
        console.log('   ✅ Database connected\n');

        // 2. Initialize models
        console.log('2️⃣  Initializing models...');
        initializeModels(sequelize);
        const { DocumentSecurity } = getModels();
        console.log('   ✅ Models initialized\n');

        // 3. Test basic query
        console.log('3️⃣  Testing basic queries...');
        const count = await DocumentSecurity.count();
        console.log(`   ✅ Total security records: ${count}\n`);

        // 4. Get security status distribution
        console.log('4️⃣  Security Status Distribution:');
        const statusDistribution = await sequelize.query(
            `SELECT security_status, COUNT(*) as count
             FROM ocr.document_security
             GROUP BY security_status
             ORDER BY count DESC`,
            { type: QueryTypes.SELECT }
        );

        statusDistribution.forEach(row => {
            console.log(`   - ${row.security_status || 'NULL'}: ${row.count}`);
        });
        console.log('');

        // 5. Get anomaly statistics
        console.log('5️⃣  Anomaly Statistics:');
        const [anomalyStats] = await sequelize.query(
            `SELECT
                COUNT(*) as total,
                COUNT(*) FILTER (WHERE severity = 'CRITICAL') as critical,
                COUNT(*) FILTER (WHERE severity = 'HIGH') as high,
                COUNT(*) FILTER (WHERE severity = 'MEDIUM') as medium,
                COUNT(*) FILTER (WHERE severity = 'LOW') as low,
                COUNT(*) FILTER (WHERE resolved = true) as resolved,
                COUNT(*) FILTER (WHERE resolved = false) as unresolved
             FROM ocr.anomaly_detection`,
            { type: QueryTypes.SELECT }
        );

        console.log(`   Total: ${anomalyStats.total}`);
        console.log(`   Critical: ${anomalyStats.critical}`);
        console.log(`   High: ${anomalyStats.high}`);
        console.log(`   Medium: ${anomalyStats.medium}`);
        console.log(`   Low: ${anomalyStats.low}`);
        console.log(`   Resolved: ${anomalyStats.resolved}`);
        console.log(`   Unresolved: ${anomalyStats.unresolved}\n`);

        // 6. Get recent audit log entries
        console.log('6️⃣  Recent Audit Log Entries (Last 5):');
        const auditLog = await sequelize.query(
            `SELECT event_type, document_id, officer_id, severity, timestamp
             FROM ocr.security_audit_log
             ORDER BY timestamp DESC
             LIMIT 5`,
            { type: QueryTypes.SELECT }
        );

        auditLog.forEach(entry => {
            console.log(`   [${entry.timestamp}] ${entry.event_type} - ${entry.document_id || 'N/A'} by ${entry.officer_id}`);
        });
        console.log('');

        // 7. Test document lookup
        console.log('7️⃣  Testing Document Lookup (TEST-DOC-001):');
        const doc = await DocumentSecurity.findOne({
            where: { documentId: 'TEST-DOC-001' }
        });

        if (doc) {
            console.log(`   ✅ Document found!`);
            console.log(`   - Security Score: ${doc.securityScore}`);
            console.log(`   - Security Status: ${doc.securityStatus}`);
            console.log(`   - Flagged: ${doc.flagged}`);
            console.log(`   - Verified By: ${doc.verifiedBy || 'Not verified'}`);
            console.log(`   - QR Code Detected: ${doc.qrCodeDetected}`);
            console.log(`   - Barcode Detected: ${doc.barcodeDetected}`);
            console.log(`   - Watermark Detected: ${doc.watermarkDetected}\n`);
        } else {
            console.log('   ⚠️  Document not found (run seed-data.sh first)\n');
        }

        // 8. Test flagged documents
        console.log('8️⃣  Flagged Documents:');
        const flaggedDocs = await DocumentSecurity.findAll({
            where: { flagged: true },
            attributes: ['documentId', 'securityScore', 'securityStatus', 'flagReason'],
            limit: 5
        });

        if (flaggedDocs.length > 0) {
            flaggedDocs.forEach(doc => {
                console.log(`   - ${doc.documentId}: ${doc.securityStatus} (Score: ${doc.securityScore})`);
                console.log(`     Reason: ${doc.flagReason}`);
            });
        } else {
            console.log('   No flagged documents found');
        }
        console.log('');

        // 9. Test average security score
        console.log('9️⃣  Average Security Score:');
        const [avgScore] = await sequelize.query(
            `SELECT ROUND(AVG(security_score), 2) as avg_score,
                    MIN(security_score) as min_score,
                    MAX(security_score) as max_score
             FROM ocr.document_security`,
            { type: QueryTypes.SELECT }
        );

        console.log(`   Average: ${avgScore.avg_score || 0}`);
        console.log(`   Minimum: ${avgScore.min_score || 0}`);
        console.log(`   Maximum: ${avgScore.max_score || 0}\n`);

        // 10. Test feature detection counts
        console.log('🔟 Security Feature Detection:');
        const [features] = await sequelize.query(
            `SELECT
                COUNT(*) FILTER (WHERE qr_code_detected = true) as qr_codes,
                COUNT(*) FILTER (WHERE barcode_detected = true) as barcodes,
                COUNT(*) FILTER (WHERE watermark_detected = true) as watermarks,
                COUNT(*) FILTER (WHERE hologram_detected = true) as holograms,
                COUNT(*) FILTER (WHERE digital_signature_valid = true) as valid_signatures
             FROM ocr.document_security`,
            { type: QueryTypes.SELECT }
        );

        console.log(`   QR Codes: ${features.qr_codes}`);
        console.log(`   Barcodes: ${features.barcodes}`);
        console.log(`   Watermarks: ${features.watermarks}`);
        console.log(`   Holograms: ${features.holograms}`);
        console.log(`   Valid Digital Signatures: ${features.valid_signatures}\n`);

        // Summary
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('✅ Database Testing Complete!');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

        console.log('Next Steps:');
        console.log('  1. Start the server: npm start');
        console.log('  2. Run API tests: ./test-api.sh');
        console.log('  3. Test with Postman or curl\n');

        process.exit(0);

    } catch (error) {
        console.error('\n❌ Database test failed:', error.message);
        console.error('\nStack trace:', error.stack);
        console.error('\nTroubleshooting:');
        console.error('  1. Ensure PostgreSQL is running: docker-compose up -d postgres');
        console.error('  2. Run migrations: cd database && ./migrate-docker.sh');
        console.error('  3. Seed mock data: cd database && ./seed-data.sh');
        console.error('  4. Check database credentials in .env file\n');

        process.exit(1);
    }
}

// Run tests
testDatabase();
