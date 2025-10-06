const express = require('express');
const crypto = require('crypto');

// Multi-node blockchain network
class BlockchainNode {
    constructor(nodeId, port) {
        this.nodeId = nodeId;
        this.port = port;
        this.peers = [];
        this.blockchain = [];
        this.app = express();
        this.app.use(express.json());
        this.setupRoutes();
    }

    setupRoutes() {
        this.app.get('/node/info', (req, res) => {
            res.json({
                nodeId: this.nodeId,
                port: this.port,
                peers: this.peers.length,
                blocks: this.blockchain.length,
                status: 'active'
            });
        });

        this.app.get('/peers', (req, res) => {
            res.json({ peers: this.peers });
        });

        this.app.post('/sync', (req, res) => {
            res.json({ synced: true, blocks: this.blockchain.length });
        });

        this.app.get('/blockchain', (req, res) => {
            res.json({ blockchain: this.blockchain });
        });
    }

    addPeer(peerUrl) {
        if (!this.peers.includes(peerUrl)) {
            this.peers.push(peerUrl);
        }
    }

    start() {
        this.app.listen(this.port, () => {
            console.log(`🌐 Node ${this.nodeId} running on port ${this.port}`);
        });
    }
}

// Create and start nodes
const nodes = [
    new BlockchainNode('node-1', 3011),
    new BlockchainNode('node-2', 3012),
    new BlockchainNode('node-3', 3013)
];

// Connect nodes as peers
nodes[0].addPeer('http://localhost:3012');
nodes[0].addPeer('http://localhost:3013');
nodes[1].addPeer('http://localhost:3011');
nodes[1].addPeer('http://localhost:3013');
nodes[2].addPeer('http://localhost:3011');
nodes[2].addPeer('http://localhost:3012');

// Start all nodes
nodes.forEach(node => node.start());

console.log('🚀 Multi-node blockchain network started');
console.log('📡 Node 1: http://localhost:3011');
console.log('📡 Node 2: http://localhost:3012');
console.log('📡 Node 3: http://localhost:3013');
