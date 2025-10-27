// Test Status Change Event (broadcasts to all users)
const io = require('socket.io-client');
const axios = require('axios');

const BASE_URL = 'http://localhost:3005';
let eventReceived = false;

console.log('🧪 Testing Status Change Real-Time Event\n');

const socket = io(BASE_URL, {
  transports: ['websocket', 'polling']
});

socket.on('connect', () => {
  console.log('✓ Socket connected:', socket.id, '\n');
});

socket.on('connected', (data) => {
  console.log('✓ Connection acknowledged');
  console.log(`  Role: ${data.user.role}\n`);

  // After connection, update a report status
  setTimeout(async () => {
    console.log('🔄 Updating report status via REST API...');

    try {
      const response = await axios.patch(`${BASE_URL}/api/reports/WP-001/status`, {
        status: 'Resolved'
      });

      console.log(`✓ Status updated: ${response.data.caseId}`);
      console.log(`  ${response.data.oldStatus} → ${response.data.newStatus}\n`);

      // Wait for real-time event
      setTimeout(() => {
        if (eventReceived) {
          console.log('✅ SUCCESS! Status change event received via Socket.io');
        } else {
          console.log('❌ FAILED: No real-time event received');
        }

        socket.disconnect();
        process.exit(eventReceived ? 0 : 1);
      }, 2000);

    } catch (error) {
      console.error('❌ Error:', error.message);
      socket.disconnect();
      process.exit(1);
    }
  }, 1000);
});

// Listen for status changed event (broadcasts to ALL users)
socket.on('statusChanged', (data) => {
  console.log('📡 Real-time event received: STATUS CHANGED');
  console.log(`   Case ID: ${data.caseId}`);
  console.log(`   Old Status: ${data.oldStatus}`);
  console.log(`   New Status: ${data.newStatus}`);
  console.log(`   Timestamp: ${data.timestamp}\n`);

  eventReceived = true;
});

socket.on('connect_error', (error) => {
  console.error('❌ Connection error:', error.message);
  process.exit(1);
});

socket.on('disconnect', (reason) => {
  console.log(`🔌 Disconnected: ${reason}`);
});

setTimeout(() => {
  console.error('\n⏱️  Test timeout');
  socket.disconnect();
  process.exit(1);
}, 10000);
