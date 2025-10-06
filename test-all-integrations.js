#!/usr/bin/env node

const axios = require('axios');
const fs = require('fs');
const path = require('path');

// API Base URLs
const OCR_API = 'http://localhost:3000/api';
const BLOCKCHAIN_API = 'http://localhost:3001/api';
const AI_API = 'http://localhost:5000/api';

// Test Results
const results = {
  timestamp: new Date().toISOString(),
  tests: [],
  summary: { passed: 0, failed: 0, total: 0 }
};

// Helper function to run test
async function runTest(name, testFn) {
  console.log(`\n🧪 Testing: ${name}`);
  const startTime = Date.now();
  
  try {
    const result = await testFn();
    const duration = Date.now() - startTime;
    
    console.log(`✅ PASSED: ${name} (${duration}ms)`);
    results.tests.push({
      name,
      status: 'PASSED',
      duration,
      result
    });
    results.summary.passed++;
  } catch (error) {
    const duration = Date.now() - startTime;
    
    console.log(`❌ FAILED: ${name} (${duration}ms)`);
    console.log(`   Error: ${error.message}`);
    results.tests.push({
      name,
      status: 'FAILED',
      duration,
      error: error.message
    });
    results.summary.failed++;
  }
  
  results.summary.total++;
}

// Test Functions
async function testOCRBackendHealth() {
  const response = await axios.get(`${OCR_API}/../healthcheck`, { timeout: 5000 });
  if (!response.data.success) throw new Error('Health check failed');
  return response.data;
}

async function testBlockchainAPIHealth() {
  const response = await axios.get(`${BLOCKCHAIN_API}/ocr-verification/health`, { timeout: 5000 });
  if (!response.data.success) throw new Error('Blockchain health check failed');
  return response.data;
}

async function testOCRBlockchainIntegration() {
  // Test OCR backend blockchain endpoints
  const testDoc = {
    docId: `test_${Date.now()}`,
    docHash: `0x${Math.random().toString(16).substr(2, 8)}`,
    extractedData: { invoice: '12345', amount: 1000 },
    riskScore: 0.85,
    verificationStatus: 'Valid'
  };

  const response = await axios.post(`${OCR_API}/blockchain/store-proof`, testDoc, { timeout: 10000 });
  if (!response.data.success) throw new Error('Blockchain store failed');
  
  return { testDoc, response: response.data };
}

async function testBlockchainOCREndpoints() {
  // Test dedicated OCR endpoints in blockchain
  const testDoc = {
    docId: `blockchain_test_${Date.now()}`,
    docHash: `0x${Math.random().toString(16).substr(2, 8)}`,
    extractedData: { invoice: '67890', amount: 2000 },
    riskScore: 0.75,
    verificationStatus: 'Valid'
  };

  // Store
  const storeResponse = await axios.post(`${BLOCKCHAIN_API}/ocr-verification/store`, testDoc, { timeout: 10000 });
  if (!storeResponse.data.success) throw new Error('Blockchain OCR store failed');

  // Retrieve
  const getResponse = await axios.get(`${BLOCKCHAIN_API}/ocr-verification/verify/${testDoc.docId}`, { timeout: 5000 });
  if (!getResponse.data.success) throw new Error('Blockchain OCR retrieve failed');

  return { testDoc, store: storeResponse.data, retrieve: getResponse.data };
}

async function testOCRVerificationFlow() {
  // Test complete OCR verification flow
  const formData = new FormData();
  const testFile = Buffer.from('Test invoice content');
  formData.append('file', new Blob([testFile]), 'test-invoice.txt');

  try {
    const response = await axios.post(`${OCR_API}/verify/document`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 15000
    });
    return response.data;
  } catch (error) {
    if (error.code === 'ECONNREFUSED') {
      throw new Error('OCR backend not running');
    }
    throw error;
  }
}

async function testBlockchainEventStorage() {
  // Test blockchain events API
  const event = {
    eventType: 'OCR_VERIFICATION',
    anonymizedUserId: `ocr_test_${Date.now()}`,
    payload: {
      docId: `event_test_${Date.now()}`,
      verificationStatus: 'Valid',
      timestamp: new Date().toISOString()
    }
  };

  const response = await axios.post(`${BLOCKCHAIN_API}/events`, event, { timeout: 10000 });
  return response.data;
}

async function testAIServiceIntegration() {
  // Test AI service if available
  try {
    const response = await axios.get(`${AI_API}/health`, { timeout: 5000 });
    return response.data;
  } catch (error) {
    if (error.code === 'ECONNREFUSED') {
      throw new Error('AI service not running');
    }
    throw error;
  }
}

async function testCrossServiceIntegration() {
  // Test integration between services
  const testData = {
    docId: `integration_test_${Date.now()}`,
    docHash: `0x${Math.random().toString(16).substr(2, 8)}`,
    extractedData: { invoice: 'INT-001', amount: 5000 },
    riskScore: 0.95,
    verificationStatus: 'Suspicious'
  };

  // Store via OCR backend
  const ocrResponse = await axios.post(`${OCR_API}/blockchain/store-proof`, testData, { timeout: 10000 });
  
  // Verify via blockchain API
  const blockchainResponse = await axios.get(`${BLOCKCHAIN_API}/ocr-verification/verify/${testData.docId}`, { timeout: 5000 });

  return {
    ocr: ocrResponse.data,
    blockchain: blockchainResponse.data,
    crossVerified: blockchainResponse.data.success
  };
}

// Main test execution
async function runAllTests() {
  console.log('🚀 Starting Comprehensive API Integration Tests');
  console.log('=' .repeat(60));

  // Core Health Checks
  await runTest('OCR Backend Health Check', testOCRBackendHealth);
  await runTest('Blockchain API Health Check', testBlockchainAPIHealth);
  await runTest('AI Service Health Check', testAIServiceIntegration);

  // Integration Tests
  await runTest('OCR-Blockchain Integration', testOCRBlockchainIntegration);
  await runTest('Blockchain OCR Endpoints', testBlockchainOCREndpoints);
  await runTest('Blockchain Event Storage', testBlockchainEventStorage);
  
  // Flow Tests
  await runTest('OCR Verification Flow', testOCRVerificationFlow);
  await runTest('Cross-Service Integration', testCrossServiceIntegration);

  // Results Summary
  console.log('\n' + '=' .repeat(60));
  console.log('📊 TEST RESULTS SUMMARY');
  console.log('=' .repeat(60));
  console.log(`✅ Passed: ${results.summary.passed}`);
  console.log(`❌ Failed: ${results.summary.failed}`);
  console.log(`📈 Total:  ${results.summary.total}`);
  console.log(`🎯 Success Rate: ${((results.summary.passed / results.summary.total) * 100).toFixed(1)}%`);

  // Save detailed results
  const reportPath = path.join(__dirname, 'test-results.json');
  fs.writeFileSync(reportPath, JSON.stringify(results, null, 2));
  console.log(`\n📄 Detailed results saved to: ${reportPath}`);

  // Exit with appropriate code
  process.exit(results.summary.failed > 0 ? 1 : 0);
}

// Handle errors
process.on('unhandledRejection', (error) => {
  console.error('❌ Unhandled error:', error.message);
  process.exit(1);
});

// Run tests
runAllTests().catch(console.error);
