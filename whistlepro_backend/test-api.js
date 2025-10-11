// API Testing Script
const http = require('http');

const API_URL = 'http://localhost:3003';

function makeRequest(method, path, body = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, API_URL);
    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method: method,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(data) });
        } catch (e) {
          resolve({ status: res.statusCode, data });
        }
      });
    });

    req.on('error', reject);

    if (body) {
      req.write(JSON.stringify(body));
    }

    req.end();
  });
}

async function runTests() {
  console.log('🧪 Testing WhistlePro API Endpoints\n');

  try {
    // Test 1: Submit a report
    console.log('📝 Test 1: POST /api/reports - Submit anonymous report');
    const submitResponse = await makeRequest('POST', '/api/reports', {
      category: 'tax_evasion',
      title: 'Test Report - Company XYZ Tax Evasion',
      description: 'This is a test report for the WhistlePro backend API. The company has been suspected of underreporting income for the past 2 years to avoid paying proper taxes.',
      priority: 'high',
      subjects: {
        organizations: [{
          name: 'XYZ Trading Limited',
          tpin: '1234567890',
          address: 'Plot 123, Independence Ave, Lusaka'
        }]
      },
      evidence: {
        financial_details: {
          estimated_amount: 500000,
          currency: 'ZMW',
          frequency: 'yearly'
        }
      }
    });

    if (submitResponse.status === 201 && submitResponse.data.success) {
      const caseId = submitResponse.data.data.case_id;
      console.log(`✅ Report submitted successfully!`);
      console.log(`   Case ID: ${caseId}`);
      console.log(`   Status: ${submitResponse.data.data.status}`);
      console.log(`   Priority: ${submitResponse.data.data.priority}\n`);

      // Test 2: Get report by case ID
      console.log(`📝 Test 2: GET /api/reports/${caseId} - Retrieve report`);
      const getResponse = await makeRequest('GET', `/api/reports/${caseId}`);

      if (getResponse.status === 200 && getResponse.data.success) {
        console.log(`✅ Report retrieved successfully!`);
        console.log(`   Title: ${getResponse.data.data.payload.title}`);
        console.log(`   Category: ${getResponse.data.data.category}`);
        console.log(`   Has encrypted payload: ${!!getResponse.data.data.payload}\n`);
      } else {
        console.log(`❌ Failed to retrieve report`);
        console.log(`   Status: ${getResponse.status}`);
        console.log(`   Response:`, JSON.stringify(getResponse.data, null, 2), '\n');
      }

      // Test 3: List reports
      console.log('📝 Test 3: GET /api/reports - List all reports');
      const listResponse = await makeRequest('GET', '/api/reports?page=1&limit=10');

      if (listResponse.status === 200 && listResponse.data.success) {
        console.log(`✅ Reports listed successfully!`);
        console.log(`   Total reports: ${listResponse.data.pagination.total}`);
        console.log(`   Reports on this page: ${listResponse.data.data.length}\n`);
      } else {
        console.log(`❌ Failed to list reports`);
        console.log(`   Status: ${listResponse.status}\n`);
      }

      // Test 4: Update report status
      console.log(`📝 Test 4: PATCH /api/reports/${caseId}/status - Update status`);
      const updateResponse = await makeRequest('PATCH', `/api/reports/${caseId}/status`, {
        status: 'under_review',
        notes: 'Case assigned for investigation'
      });

      if (updateResponse.status === 200 && updateResponse.data.success) {
        console.log(`✅ Status updated successfully!`);
        console.log(`   New status: ${updateResponse.data.data.status}\n`);
      } else {
        console.log(`❌ Failed to update status`);
        console.log(`   Status: ${updateResponse.status}\n`);
      }

      // Test 5: Get statistics
      console.log('📝 Test 5: GET /api/reports/stats - Get statistics');
      const statsResponse = await makeRequest('GET', '/api/reports/stats');

      if (statsResponse.status === 200 && statsResponse.data.success) {
        console.log(`✅ Statistics retrieved successfully!`);
        console.log(`   Total reports: ${statsResponse.data.data.total_reports}`);
        console.log(`   Pending: ${statsResponse.data.data.pending_reports}`);
        console.log(`   Under review: ${statsResponse.data.data.under_review}\n`);
      } else {
        console.log(`❌ Failed to get statistics`);
        console.log(`   Status: ${statsResponse.status}\n`);
      }

      // Test 6: Test validation (invalid data)
      console.log('📝 Test 6: POST /api/reports - Test validation (short title)');
      const invalidResponse = await makeRequest('POST', '/api/reports', {
        category: 'fraud',
        title: 'Short',  // Too short (< 10 chars)
        description: 'This description is long enough but the title is too short.'
      });

      if (invalidResponse.status === 400) {
        console.log(`✅ Validation working correctly!`);
        console.log(`   Received 400 error as expected`);
        console.log(`   Error: ${invalidResponse.data.error.message}\n`);
      } else {
        console.log(`❌ Validation failed - should have returned 400\n`);
      }

    } else {
      console.log('❌ Failed to submit report');
      console.log(`   Status: ${submitResponse.status}`);
      console.log(`   Response:`, JSON.stringify(submitResponse.data, null, 2));
    }

    console.log('\n✅ All API tests completed!');

  } catch (error) {
    console.error('\n❌ Test error:', error.message);
  }
}

runTests();
