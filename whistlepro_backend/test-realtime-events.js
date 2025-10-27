// Comprehensive Real-Time Events Test
const io = require('socket.io-client');
const axios = require('axios');

const BASE_URL = 'http://localhost:3005';
let eventsReceived = [];

console.log('🧪 Testing WhistlePro Real-Time Event Broadcasting\n');

// Create Socket.io connection (as investigator would)
const socket = io(BASE_URL, {
  transports: ['websocket', 'polling']
});

socket.on('connect', () => {
  console.log('✓ Socket connected:', socket.id);
  console.log('  Waiting for real-time events...\n');
});

socket.on('connected', (data) => {
  console.log('✓ Received connection acknowledgment');
  console.log(`  User role: ${data.user.role}`);
  console.log(`  Available events: ${Object.keys(data.availableEvents).length}\n`);

  // After connection, submit a test report via REST API
  setTimeout(async () => {
    console.log('📝 Submitting new report via REST API...');

    try {
      const response = await axios.post(`${BASE_URL}/api/reports`, {
        title: 'Real-Time Test Report',
        company: 'Test Company Ltd',
        category: 'Tax Evasion',
        priority: 'High',
        reporter: 'Anonymous',
        description: 'Testing real-time event broadcasting',
        evidence: ['Test evidence']
      });

      console.log(`✓ Report submitted: ${response.data.caseId}\n`);

      // Wait for real-time event
      setTimeout(() => {
        console.log('⏱️  Checking if real-time event was received...\n');

        if (eventsReceived.length > 0) {
          console.log('✅ SUCCESS! Real-time events received:');
          eventsReceived.forEach((event, index) => {
            console.log(`\nEvent ${index + 1}:`);
            console.log(`  Type: ${event.type}`);
            console.log(`  Data:`, JSON.stringify(event.data, null, 4));
          });
        } else {
          console.log('❌ FAILED: No real-time events received');
        }

        // Disconnect and exit
        socket.disconnect();
        process.exit(eventsReceived.length > 0 ? 0 : 1);
      }, 2000);

    } catch (error) {
      console.error('❌ Error submitting report:', error.message);
      socket.disconnect();
      process.exit(1);
    }
  }, 1000);
});

// Listen for all possible events
socket.on('newReport', (data) => {
  console.log('📡 Received real-time event: NEW REPORT');
  console.log(`   Case ID: ${data.report?.caseId}`);
  console.log(`   Title: ${data.report?.title}`);
  console.log(`   Timestamp: ${data.timestamp}\n`);

  eventsReceived.push({
    type: 'newReport',
    data: data
  });
});

socket.on('statusChanged', (data) => {
  console.log('📡 Received real-time event: STATUS CHANGED');
  eventsReceived.push({
    type: 'statusChanged',
    data: data
  });
});

socket.on('reportUpdated', (data) => {
  console.log('📡 Received real-time event: REPORT UPDATED');
  eventsReceived.push({
    type: 'reportUpdated',
    data: data
  });
});

socket.on('connect_error', (error) => {
  console.error('❌ Connection error:', error.message);
  process.exit(1);
});

socket.on('error', (error) => {
  console.error('❌ Socket error:', error);
});

socket.on('disconnect', (reason) => {
  console.log(`\n🔌 Disconnected: ${reason}`);
});

// Timeout after 10 seconds
setTimeout(() => {
  console.error('\n⏱️  Test timeout - taking too long');
  socket.disconnect();
  process.exit(1);
}, 10000);
