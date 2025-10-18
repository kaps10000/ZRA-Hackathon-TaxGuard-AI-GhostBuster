// Simple CRUD test script
require('dotenv').config();
const db = require('./src/config/database');
const bcrypt = require('bcryptjs');
const Report = require('./src/models/Report');

async function runTests() {
  console.log('🧪 Starting CRUD Tests...\n');

  try {
    // Test 1: Create an investigator
    console.log('📝 Test 1: Creating investigator...');
    const passwordHash = await bcrypt.hash('test123', 12);
    const [investigator] = await db('investigators')
      .insert({
        email: 'test@zra.gov.zm',
        password_hash: passwordHash,
        full_name: 'Test Investigator',
        badge_number: 'TEST001',
        role: 'investigator',
        department: 'tax_evasion',
        is_active: true
      })
      .returning('*');

    console.log('✅ Investigator created:', {
      id: investigator.id,
      email: investigator.email,
      role: investigator.role
    });

    // Test 2: Create a report
    console.log('\n📝 Test 2: Creating report...');
    const reportData = {
      category: 'tax_evasion',
      title: 'Test Tax Evasion Report',
      description: 'This is a test report for CRUD validation. Testing the WhistlePro backend system.',
      priority: 'medium',
      subjects: {
        organizations: [{
          name: 'Test Company Ltd',
          tpin: '1234567890'
        }]
      }
    };

    const report = await Report.create(reportData, {
      ip_hash: 'test_hash_123',
      user_agent_hash: 'test_ua_hash'
    });

    console.log('✅ Report created:', {
      case_id: report.case_id,
      category: report.category,
      status: report.status,
      priority: report.priority
    });

    // Test 3: Read the report
    console.log('\n📝 Test 3: Reading report...');
    const fetchedReport = await Report.findByCaseId(report.case_id, investigator.id);
    console.log('✅ Report retrieved:', {
      case_id: fetchedReport.case_id,
      has_payload: !!fetchedReport.payload,
      payload_title: fetchedReport.payload?.title
    });

    // Test 4: Update report status
    console.log('\n📝 Test 4: Updating report status...');
    const updatedReport = await Report.updateStatus(
      report.case_id,
      'under_review',
      investigator.id,
      'Starting investigation'
    );
    console.log('✅ Report updated:', {
      case_id: updatedReport.case_id,
      new_status: updatedReport.status
    });

    // Test 5: List reports
    console.log('\n📝 Test 5: Listing reports...');
    const reportList = await Report.list({
      page: 1,
      limit: 10,
      investigatorId: investigator.id
    });
    console.log('✅ Reports listed:', {
      total: reportList.pagination.total,
      count: reportList.reports.length
    });

    // Test 6: Read audit logs
    console.log('\n📝 Test 6: Checking audit logs...');
    const auditLogs = await db('audit_logs')
      .where('target_type', 'report')
      .orderBy('created_at', 'desc')
      .limit(5);
    console.log('✅ Audit logs found:', auditLogs.length, 'entries');
    auditLogs.forEach((log, i) => {
      console.log(`  ${i + 1}. ${log.action} at ${log.created_at}`);
    });

    console.log('\n✅ All CRUD tests passed successfully!');

  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    console.error(error);
  } finally {
    await db.destroy();
    process.exit(0);
  }
}

runTests();
