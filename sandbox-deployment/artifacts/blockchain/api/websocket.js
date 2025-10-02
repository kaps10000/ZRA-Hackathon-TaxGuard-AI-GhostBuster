const { Server } = require('socket.io');

let io;

const initWebSocket = (server) => {
    io = new Server(server, {
        cors: {
            origin: "*",
            methods: ["GET", "POST"]
        }
    });

    io.on('connection', (socket) => {
        console.log(`📡 Client connected: ${socket.id}`);
        
        // Send current blockchain status
        const { blockchain } = require('../scripts/add-sample-events');
        socket.emit('blockchain-status', blockchain.getChainInfo());
        
        socket.on('subscribe-events', (eventTypes) => {
            socket.join('event-subscribers');
            console.log(`🔔 Client ${socket.id} subscribed to events:`, eventTypes);
        });
        
        socket.on('disconnect', () => {
            console.log(`📡 Client disconnected: ${socket.id}`);
        });
    });
    
    return io;
};

const broadcastEvent = (event) => {
    if (io) {
        io.to('event-subscribers').emit('new-event', {
            timestamp: new Date().toISOString(),
            event,
            message: `New ${event.eventType} event created`
        });
    }
};

const broadcastBlockchainUpdate = (blockchainInfo) => {
    if (io) {
        io.emit('blockchain-update', blockchainInfo);
    }
};

module.exports = {
    initWebSocket,
    broadcastEvent,
    broadcastBlockchainUpdate
};
