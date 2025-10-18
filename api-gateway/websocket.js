const { Server } = require('socket.io');
const logger = require('./utils/logger');

let io;

function initializeWebSocket(server) {
  io = new Server(server, {
    cors: {
      origin: process.env.NODE_ENV === 'production' ? ['https://zra.gov.zm'] : '*',
      methods: ['GET', 'POST']
    }
  });

  io.on('connection', (socket) => {
    logger.info('WebSocket connection established', {
      socketId: socket.id,
      clientIP: socket.handshake.address
    });

    console.log(`✅ WebSocket connected: ${socket.id}`);

    // Subscribe to dashboard updates
    socket.on('subscribe:dashboard', () => {
      socket.join('dashboard');
      logger.info('Client subscribed to dashboard updates', { socketId: socket.id });
    });

    // Subscribe to alerts
    socket.on('subscribe:alerts', () => {
      socket.join('alerts');
      logger.info('Client subscribed to alerts', { socketId: socket.id });
    });

    socket.on('disconnect', () => {
      logger.info('WebSocket disconnected', { socketId: socket.id });
      console.log(`❌ WebSocket disconnected: ${socket.id}`);
    });
  });

  // Start broadcasting dashboard updates every 30 seconds
  setInterval(() => {
    broadcastDashboardUpdate();
  }, 30000);

  return io;
}

// Broadcast dashboard update to all connected clients
function broadcastDashboardUpdate() {
  if (io) {
    const update = {
      timestamp: new Date().toISOString(),
      type: 'dashboard:update'
    };
    
    io.to('dashboard').emit('dashboard:update', update);
  }
}

// Broadcast alert to all connected clients
function broadcastAlert(alert) {
  if (io) {
    io.to('alerts').emit('dashboard:alert', {
      ...alert,
      timestamp: new Date().toISOString()
    });
    
    logger.info('Alert broadcasted', { alert });
  }
}

module.exports = {
  initializeWebSocket,
  broadcastDashboardUpdate,
  broadcastAlert,
  getIO: () => io
};
