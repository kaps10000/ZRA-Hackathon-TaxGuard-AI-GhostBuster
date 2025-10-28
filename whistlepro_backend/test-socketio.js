// Quick Socket.io Connection Test
const io = require('socket.io-client');

console.log('Testing Socket.io connection to WhistlePro backend...\n');

const socket = io('http://localhost:3005', {
  transports: ['websocket', 'polling']
});

socket.on('connect', () => {
  console.log('✓ Connected to Socket.io server');
  console.log(`Socket ID: ${socket.id}`);
});

socket.on('connected', (data) => {
  console.log('\n✓ Received welcome message:');
  console.log(JSON.stringify(data, null, 2));

  // Test successful, disconnect
  setTimeout(() => {
    console.log('\n✓ Socket.io test successful!');
    socket.disconnect();
    process.exit(0);
  }, 1000);
});

socket.on('connect_error', (error) => {
  console.error('✗ Connection error:', error.message);
  process.exit(1);
});

socket.on('disconnect', (reason) => {
  console.log(`\nDisconnected: ${reason}`);
});

// Timeout after 5 seconds
setTimeout(() => {
  console.error('\n✗ Connection timeout');
  process.exit(1);
}, 5000);
