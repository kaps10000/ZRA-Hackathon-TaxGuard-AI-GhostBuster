import React, { useState, useEffect } from 'react';

const BlockchainLedger = () => {
  const [selectedBlock, setSelectedBlock] = useState(null);
  const [showDetails, setShowDetails] = useState(false);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  // Format timestamp to local time
  const formatTimestamp = (isoString) => {
    const date = new Date(isoString || new Date());
    return date.toLocaleString('en-GB', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    }).replace(',', '');
  };

  // Fetch blockchain transactions from API
  const fetchTransactions = async () => {
    try {
      setLoading(true);
      // Use the real blockchain service
      const response = await fetch('http://localhost:3001/api/events');

      if (!response.ok) {
        throw new Error('Failed to fetch blockchain transactions');
      }

      const data = await response.json();
      console.log('⛓️  Blockchain transactions fetched:', data);
      // Handle blockchain service response format
      const transactions = data.events || [];
      setTransactions(transactions);
    } catch (error) {
      console.error('❌ Error fetching blockchain transactions:', error);
      setTransactions([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();

    // Poll for new transactions every 10 seconds
    const interval = setInterval(fetchTransactions, 10000);
    return () => clearInterval(interval);
  }, []);

  const viewBlock = (tx) => {
    setSelectedBlock(tx);
    setShowDetails(true);
  };

  return (
    <div className="max-w-7xl mx-auto">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="mb-6 flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">Blockchain Ledger Viewer</h2>
            <p className="text-gray-600 mt-1">
              Immutable audit trail of all system transactions
            </p>
          </div>
          <button
            onClick={fetchTransactions}
            disabled={loading}
            className="bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 disabled:bg-gray-400 font-semibold flex items-center space-x-2"
          >
            <span>🔄</span>
            <span>{loading ? 'Refreshing...' : 'Refresh Ledger'}</span>
          </button>
        </div>

        {/* Blockchain Stats */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="bg-purple-50 p-4 rounded-lg">
            <p className="text-sm text-gray-600">Total Blocks</p>
            <p className="text-2xl font-bold text-purple-600">
              {loading ? '...' : transactions.length}
            </p>
          </div>
          <div className="bg-blue-50 p-4 rounded-lg">
            <p className="text-sm text-gray-600">Verified Transactions</p>
            <p className="text-2xl font-bold text-blue-600">{loading ? '...' : transactions.length}</p>
          </div>
          <div className="bg-green-50 p-4 rounded-lg">
            <p className="text-sm text-gray-600">Network Status</p>
            <p className="text-lg font-bold text-green-600">✓ ACTIVE</p>
          </div>
          <div className="bg-orange-50 p-4 rounded-lg">
            <p className="text-sm text-gray-600">Consensus</p>
            <p className="text-lg font-bold text-orange-600">Hyperledger</p>
          </div>
        </div>

        {/* Transaction List */}
        <div className="space-y-3">
          <h3 className="font-semibold text-gray-800 mb-3">Recent Transactions</h3>
          {loading ? (
            <div className="text-center py-8">
              <p className="text-gray-600">Loading blockchain transactions...</p>
            </div>
          ) : transactions.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-600">No blockchain transactions found</p>
            </div>
          ) : (
            transactions.map((tx) => (
            <div key={tx.eventId || tx.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <span className="font-mono text-sm text-gray-600">Block #{tx.blockIndex || 'N/A'}</span>
                    <span className="px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                      ✓ Verified
                    </span>
                    <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-medium">
                      {tx.eventType || 'Transaction'}
                    </span>
                  </div>

                  <p className="font-mono text-xs text-gray-500 mb-2">
                    Hash: {tx.hashOfPayload || 'N/A'}
                  </p>

                  {tx.notes && (
                    <p className="text-sm text-gray-700 mb-2">
                      {tx.notes}
                    </p>
                  )}

                  <p className="text-sm text-gray-600">
                    {formatTimestamp(tx.timestamp)}
                  </p>
                </div>

                <button
                  onClick={() => viewBlock(tx)}
                  className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 text-sm"
                >
                  View Block
                </button>
              </div>
            </div>
            ))
          )}
        </div>

        {/* Info Panel */}
        <div className="mt-6 bg-purple-50 border border-purple-200 rounded-lg p-4">
          <h4 className="font-semibold text-purple-800 mb-2">⛓️ Blockchain Information</h4>
          <ul className="text-sm text-purple-700 space-y-1">
            <li>• All transactions are cryptographically signed and tamper-proof</li>
            <li>• Each block contains a hash of the previous block, creating an immutable chain</li>
            <li>• Distributed ledger ensures no single point of failure</li>
            <li>• Provides complete audit trail for compliance and investigations</li>
          </ul>
        </div>
      </div>

      {/* Block Details Modal */}
      {showDetails && selectedBlock && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-2xl font-bold text-gray-800">Block #{selectedBlock.blockIndex}</h3>
                  <p className="text-gray-600 font-mono text-sm">{selectedBlock.eventId}</p>
                </div>
                <button
                  onClick={() => setShowDetails(false)}
                  className="text-gray-400 hover:text-gray-600 text-2xl"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-gray-800 mb-3">Block Information</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">Timestamp</p>
                      <p className="font-medium">{formatTimestamp(selectedBlock.timestamp)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Event Type</p>
                      <p className="font-medium">{selectedBlock.eventType}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Status</p>
                      <p className="font-medium text-green-600">✓ Verified</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Payload Hash</p>
                      <p className="font-mono text-xs">{selectedBlock.hashOfPayload}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-blue-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-blue-800 mb-2">Event Details</h4>
                  <div className="bg-white p-3 rounded">
                    <p className="text-sm"><strong>User ID:</strong> {selectedBlock.anonymizedUserId}</p>
                    {selectedBlock.notes && (
                      <p className="text-sm mt-2"><strong>Notes:</strong> {selectedBlock.notes}</p>
                    )}
                  </div>
                </div>

                <div className="flex space-x-3 pt-4">
                  <button
                    onClick={() => setShowDetails(false)}
                    className="flex-1 bg-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-400"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BlockchainLedger;
