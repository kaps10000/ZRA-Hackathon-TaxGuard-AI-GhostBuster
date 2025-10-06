const { TaxGuardBlockchain } = require('./deploy');
const express = require('express');

class BlockchainNode {
    constructor(nodeId, port) {
        this.nodeId = nodeId;
        this.port = port;
        this.blockchain = new TaxGuardBlockchain();
        this.peers = new Set();
        this.app = express();
        this.setupRoutes();
    }
    
    setupRoutes() {
        this.app.use(express.json());
        
        // Node info
        this.app.get('/node/info', (req, res) => {
            res.json({
                nodeId: this.nodeId,
                port: this.port,
                peers: Array.from(this.peers),
                blockchain: this.blockchain.getChainInfo()
            });
        });
        
        // Add peer
        this.app.post('/node/peers', (req, res) => {
            const { peerUrl } = req.body;
            this.peers.add(peerUrl);
            res.json({ message: 'Peer added', peers: Array.from(this.peers) });
        });
        
        // Sync blockchain
        this.app.post('/node/sync', async (req, res) => {
            try {
                await this.syncWithPeers();
                res.json({ message: 'Sync completed', blockchain: this.blockchain.getChainInfo() });
            } catch (error) {
                res.status(500).json({ error: error.message });
            }
        });
        
        // Broadcast event
        this.app.post('/node/broadcast', async (req, res) => {
            const { eventData } = req.body;
            
            // Add to local blockchain
            const event = this.blockchain.createEvent(
                eventData.eventId,
                eventData.eventType,
                eventData.timestamp,
                eventData.anonymizedUserId,
                eventData.hashOfPayload,
                eventData.notes
            );
            
            // Broadcast to peers
            await this.broadcastToPeers('new-event', event);
            
            res.json({ message: 'Event broadcasted', event });
        });
        
        // Receive broadcasted event
        this.app.post('/node/receive-event', (req, res) => {
            const { event } = req.body;
            
            // Verify and add event if valid
            if (!this.blockchain.events.has(event.eventId)) {
                this.blockchain.events.set(event.eventId, event);
                console.log(`📡 Node ${this.nodeId} received event: ${event.eventId}`);
            }
            
            res.json({ message: 'Event received' });
        });
    }
    
    async syncWithPeers() {
        for (const peerUrl of this.peers) {
            try {
                const response = await fetch(`${peerUrl}/node/info`);
                const peerInfo = await response.json();
                
                // Simple sync: adopt longer chain
                if (peerInfo.blockchain.length > this.blockchain.chain.length) {
                    console.log(`🔄 Node ${this.nodeId} syncing with ${peerUrl}`);
                    // In production, implement proper chain validation
                }
            } catch (error) {
                console.error(`❌ Failed to sync with ${peerUrl}:`, error.message);
            }
        }
    }
    
    async broadcastToPeers(type, data) {
        const promises = Array.from(this.peers).map(async (peerUrl) => {
            try {
                await fetch(`${peerUrl}/node/receive-event`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ event: data })
                });
            } catch (error) {
                console.error(`❌ Failed to broadcast to ${peerUrl}:`, error.message);
            }
        });
        
        await Promise.allSettled(promises);
    }
    
    start() {
        this.app.listen(this.port, () => {
            console.log(`🚀 Blockchain Node ${this.nodeId} running on port ${this.port}`);
        });
    }
}

// Network manager
class BlockchainNetwork {
    constructor() {
        this.nodes = new Map();
    }
    
    createNode(nodeId, port) {
        const node = new BlockchainNode(nodeId, port);
        this.nodes.set(nodeId, node);
        return node;
    }
    
    connectNodes(nodeId1, nodeId2) {
        const node1 = this.nodes.get(nodeId1);
        const node2 = this.nodes.get(nodeId2);
        
        if (node1 && node2) {
            node1.peers.add(`http://localhost:${node2.port}`);
            node2.peers.add(`http://localhost:${node1.port}`);
            console.log(`🔗 Connected nodes ${nodeId1} and ${nodeId2}`);
        }
    }
    
    startNetwork() {
        console.log('🌐 Starting TaxGuard Blockchain Network...');
        
        // Create 3 nodes
        const node1 = this.createNode('ZRA-Node-1', 3011);
        const node2 = this.createNode('ZRA-Node-2', 3012);
        const node3 = this.createNode('ZRA-Node-3', 3013);
        
        // Connect nodes
        this.connectNodes('ZRA-Node-1', 'ZRA-Node-2');
        this.connectNodes('ZRA-Node-2', 'ZRA-Node-3');
        this.connectNodes('ZRA-Node-1', 'ZRA-Node-3');
        
        // Start all nodes
        node1.start();
        node2.start();
        node3.start();
        
        console.log('✅ Multi-node blockchain network started!');
        console.log('📊 Node endpoints:');
        console.log('   - Node 1: http://localhost:3011/node/info');
        console.log('   - Node 2: http://localhost:3012/node/info');
        console.log('   - Node 3: http://localhost:3013/node/info');
    }
}

// Start network if run directly
if (require.main === module) {
    const network = new BlockchainNetwork();
    network.startNetwork();
}

module.exports = { BlockchainNode, BlockchainNetwork };
