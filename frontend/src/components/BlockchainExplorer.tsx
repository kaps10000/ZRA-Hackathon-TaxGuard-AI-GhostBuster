import { useState, useEffect } from 'react';
import { Shield, Box, Hash, Clock, Database, CheckCircle, AlertCircle, TrendingUp, Activity } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import axios from 'axios';

interface Block {
  index: number;
  timestamp: string;
  transactions: any[];
  previousHash: string;
  hash: string;
  nonce: number;
}

interface BlockchainInfo {
  length: number;
  latestBlock: Block;
  isValid: boolean;
  totalEvents: number;
}

interface Event {
  eventId: string;
  eventType: string;
  timestamp: string;
  anonymizedUserId: string;
  hashOfPayload: string;
  blockIndex: number;
  notes?: string;
}

const BlockchainExplorer = () => {
  const [blockchain, setBlockchain] = useState<BlockchainInfo | null>(null);
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [selectedBlock, setSelectedBlock] = useState<Block | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'blocks' | 'events'>('overview');

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api';

  useEffect(() => {
    fetchBlockchainData();
    const interval = setInterval(fetchBlockchainData, 10000); // Refresh every 10 seconds
    return () => clearInterval(interval);
  }, []);

  const fetchBlockchainData = async () => {
    try {
      const [chainRes, eventsRes] = await Promise.all([
        axios.get(`${API_BASE_URL}/blockchain`),
        axios.get(`${API_BASE_URL}/events`).catch(() => ({ data: { events: [] } }))
      ]);

      if (chainRes.data.chain) {
        setBlocks(chainRes.data.chain);
        setBlockchain({
          length: chainRes.data.chain.length,
          latestBlock: chainRes.data.chain[chainRes.data.chain.length - 1],
          isValid: chainRes.data.isValid,
          totalEvents: chainRes.data.chain.reduce((sum: number, block: Block) =>
            sum + (block.transactions?.length || 0), 0
          )
        });
      }

      if (eventsRes.data.events) {
        setEvents(eventsRes.data.events);
      }
    } catch (error) {
      console.error('Failed to fetch blockchain data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatHash = (hash: string) => {
    if (!hash) return 'N/A';
    return `${hash.substring(0, 8)}...${hash.substring(hash.length - 8)}`;
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString();
  };

  const getEventTypeColor = (type: string) => {
    const colors: { [key: string]: string } = {
      filing: 'bg-blue-500',
      payment: 'bg-green-500',
      auditFlag: 'bg-red-500',
      compliance: 'bg-yellow-500',
      adminChange: 'bg-purple-500',
      whistleblower: 'bg-orange-500'
    };
    return colors[type] || 'bg-gray-500';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading Blockchain Data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <Shield className="h-8 w-8 text-blue-600" />
              Blockchain Explorer
            </h1>
            <p className="text-gray-600 mt-1">
              Explore the immutable TaxGuard blockchain ledger
            </p>
          </div>
          {blockchain && (
            <Badge variant="outline" className={blockchain.isValid ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'}>
              <CheckCircle className="h-4 w-4 mr-1" />
              Chain {blockchain.isValid ? 'Valid' : 'Invalid'}
            </Badge>
          )}
        </div>

        {/* Navigation Tabs */}
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="flex space-x-8 px-6">
            {[
              { id: 'overview', name: 'Overview', icon: Database },
              { id: 'blocks', name: 'Blocks', icon: Box },
              { id: 'events', name: 'Events', icon: Activity }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center space-x-2 py-4 px-2 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <tab.icon className="h-4 w-4" />
                <span>{tab.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && blockchain && (
          <div className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Blocks</CardTitle>
                  <Box className="h-4 w-4 text-blue-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{blockchain.length}</div>
                  <p className="text-xs text-muted-foreground">
                    Including genesis block
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Events</CardTitle>
                  <Activity className="h-4 w-4 text-green-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{blockchain.totalEvents}</div>
                  <p className="text-xs text-muted-foreground">
                    Immutable transactions
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Latest Block</CardTitle>
                  <Hash className="h-4 w-4 text-purple-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">#{blockchain.latestBlock.index}</div>
                  <p className="text-xs text-muted-foreground">
                    {formatHash(blockchain.latestBlock.hash)}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Chain Status</CardTitle>
                  <Shield className="h-4 w-4 text-green-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">Valid</div>
                  <p className="text-xs text-muted-foreground">
                    Integrity verified
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Latest Block Details */}
            <Card>
              <CardHeader>
                <CardTitle>Latest Block Details</CardTitle>
                <CardDescription>Most recent block added to the chain</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium text-gray-500">Block Index</p>
                      <p className="text-lg font-mono">#{blockchain.latestBlock.index}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">Timestamp</p>
                      <p className="text-sm">{formatTimestamp(blockchain.latestBlock.timestamp)}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">Transactions</p>
                      <p className="text-lg">{blockchain.latestBlock.transactions?.length || 0} events</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">Nonce</p>
                      <p className="text-lg font-mono">{blockchain.latestBlock.nonce}</p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div>
                      <p className="text-sm font-medium text-gray-500">Block Hash</p>
                      <div className="bg-gray-50 p-3 rounded-lg">
                        <p className="text-xs font-mono break-all">{blockchain.latestBlock.hash}</p>
                      </div>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">Previous Hash</p>
                      <div className="bg-gray-50 p-3 rounded-lg">
                        <p className="text-xs font-mono break-all">{blockchain.latestBlock.previousHash}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Chain Visualization */}
            <Card>
              <CardHeader>
                <CardTitle>Blockchain Structure</CardTitle>
                <CardDescription>Visual representation of the block chain</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex overflow-x-auto space-x-4 pb-4">
                  {blocks.slice(-5).map((block, index) => (
                    <div key={block.index} className="flex items-center">
                      <div
                        className="min-w-[200px] bg-gradient-to-br from-blue-500 to-blue-600 text-white p-4 rounded-lg shadow-lg cursor-pointer hover:shadow-xl transition-shadow"
                        onClick={() => setSelectedBlock(block)}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium">Block #{block.index}</span>
                          <Box className="h-4 w-4" />
                        </div>
                        <div className="text-xs opacity-90 mb-2">
                          {formatTimestamp(block.timestamp)}
                        </div>
                        <div className="text-xs font-mono opacity-75">
                          {formatHash(block.hash)}
                        </div>
                        <div className="mt-2 pt-2 border-t border-blue-400">
                          <span className="text-xs">{block.transactions?.length || 0} transactions</span>
                        </div>
                      </div>
                      {index < blocks.slice(-5).length - 1 && (
                        <div className="flex-shrink-0 w-8 h-0.5 bg-blue-300"></div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Blocks Tab */}
        {activeTab === 'blocks' && (
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>All Blocks</CardTitle>
                <CardDescription>Complete blockchain ledger ({blocks.length} blocks)</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {blocks.map((block) => (
                    <div
                      key={block.index}
                      className="border rounded-lg p-4 hover:bg-gray-50 cursor-pointer transition-colors"
                      onClick={() => setSelectedBlock(block)}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                            <Box className="h-5 w-5 text-blue-600" />
                          </div>
                          <div>
                            <p className="font-semibold">Block #{block.index}</p>
                            <p className="text-sm text-gray-500">{formatTimestamp(block.timestamp)}</p>
                          </div>
                        </div>
                        <Badge variant="outline">
                          {block.transactions?.length || 0} events
                        </Badge>
                      </div>

                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-gray-500">Hash</p>
                          <p className="font-mono text-xs">{formatHash(block.hash)}</p>
                        </div>
                        <div>
                          <p className="text-gray-500">Previous Hash</p>
                          <p className="font-mono text-xs">{formatHash(block.previousHash)}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Events Tab */}
        {activeTab === 'events' && (
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Blockchain Events</CardTitle>
                <CardDescription>All recorded tax events on the blockchain</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {events.length > 0 ? events.map((event) => (
                    <div
                      key={event.eventId}
                      className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-3">
                          <div className={`w-3 h-3 rounded-full ${getEventTypeColor(event.eventType)}`}></div>
                          <div>
                            <p className="font-semibold capitalize">{event.eventType}</p>
                            <p className="text-sm text-gray-500">{event.eventId}</p>
                          </div>
                        </div>
                        <Badge variant="outline">Block #{event.blockIndex}</Badge>
                      </div>

                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-gray-500">User ID</p>
                          <p className="font-mono text-xs">{event.anonymizedUserId}</p>
                        </div>
                        <div>
                          <p className="text-gray-500">Timestamp</p>
                          <p className="text-xs">{formatTimestamp(event.timestamp)}</p>
                        </div>
                        <div className="col-span-2">
                          <p className="text-gray-500">Payload Hash</p>
                          <p className="font-mono text-xs">{formatHash(event.hashOfPayload)}</p>
                        </div>
                        {event.notes && (
                          <div className="col-span-2">
                            <p className="text-gray-500">Notes</p>
                            <p className="text-sm">{event.notes}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )) : (
                    <div className="text-center py-12 text-gray-500">
                      <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No events recorded yet</p>
                      <p className="text-sm">Submit your first tax event to see it here</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Selected Block Modal */}
        {selectedBlock && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50" onClick={() => setSelectedBlock(null)}>
            <Card className="max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
              <CardHeader>
                <CardTitle>Block #{selectedBlock.index} Details</CardTitle>
                <CardDescription>{formatTimestamp(selectedBlock.timestamp)}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Block Index</p>
                    <p className="text-lg font-mono">#{selectedBlock.index}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Nonce</p>
                    <p className="text-lg font-mono">{selectedBlock.nonce}</p>
                  </div>
                </div>

                <div>
                  <p className="text-sm font-medium text-gray-500 mb-2">Block Hash</p>
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <p className="text-xs font-mono break-all">{selectedBlock.hash}</p>
                  </div>
                </div>

                <div>
                  <p className="text-sm font-medium text-gray-500 mb-2">Previous Hash</p>
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <p className="text-xs font-mono break-all">{selectedBlock.previousHash}</p>
                  </div>
                </div>

                <div>
                  <p className="text-sm font-medium text-gray-500 mb-2">Transactions ({selectedBlock.transactions?.length || 0})</p>
                  {selectedBlock.transactions && selectedBlock.transactions.length > 0 ? (
                    <div className="space-y-2">
                      {selectedBlock.transactions.map((tx: any, idx: number) => (
                        <div key={idx} className="bg-gray-50 p-3 rounded-lg text-xs">
                          <pre className="overflow-x-auto">{JSON.stringify(tx, null, 2)}</pre>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500">No transactions in this block</p>
                  )}
                </div>

                <button
                  onClick={() => setSelectedBlock(null)}
                  className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Close
                </button>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};

export default BlockchainExplorer;
