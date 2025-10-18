const http = require('http');
const app = require('./server');
const { initializeWebSocket } = require('./websocket');
const logger = require('./utils/logger');

const PORT = process.env.PORT || 4000;

// Create HTTP server
const server = http.createServer(app);

// Initialize WebSocket
initializeWebSocket(server);

// Start server with WebSocket support
server.listen(PORT, () => {
  logger.info('Server with WebSocket Started', {
    port: PORT,
    environment: process.env.NODE_ENV,
    timestamp: new Date().toISOString()
  });
  console.log(`🚀 TaxGuard API Gateway with WebSocket running on port ${PORT}`);
  console.log(`📡 WebSocket endpoint: ws://localhost:${PORT}`);
  console.log(`📊 Dashboard API: http://localhost:${PORT}/api/dashboard/feed`);
  console.log(`🏥 Health Check: http://localhost:${PORT}/health`);
});

module.exports = server;
