import React, { useState } from 'react';

const BlockchainLedger = () => {
  const [selectedBlock, setSelectedBlock] = useState(null);
  const [showDetails, setShowDetails] = useState(false);

  const transactions = [
    {
      id: 1,
      blockNumber: 12345,
      txHash: '0xabc123def456789ghijklmnop',
      timestamp: '2025-10-19 01:00:00',
      action: 'OCR_SCAN_RECORDED',
      data: { fileName: 'Tax_Return_ABC_Mining.pdf', status: 'FLAGGED', riskScore: 87 },
      verified: true,
      previousHash: '0x9876543210abcdef'
    },
    {
      id: 2,
      blockNumber: 12344,
      txHash: '0xdef456ghi789012jklmnopqr',
      timestamp: '2025-10-18 23:55:00',
      action: 'GHOSTBUSTER_DETECTION',
      data: { company: 'ABC Mining Ltd', classification: 'GHOST_COMPANY', riskScore: 92 },
      verified: true,
      previousHash: '0x8765432109876543'
    },
    {
      id: 3,
      blockNumber: 12343,
      txHash: '0xghi789jkl012345mnopqrstu',
      timestamp: '2025-10-18 22:30:00',
      action: 'WHISTLEPRO_CASE_SUBMITTED',
      data: { caseId: 'WP-001', category: 'Tax Evasion', priority: 'High' },
      verified: true,
      previousHash: '0x7654321098765432'
    },
    {
      id: 4,
      blockNumber: 12342,
      txHash: '0xjkl012mno345678pqrstuvwx',
      timestamp: '2025-10-18 21:00:00',
      action: 'CASE_STATUS_UPDATE',
      data: { caseId: 'WP-002', oldStatus: 'Open', newStatus: 'Under Investigation' },
      verified: true,
      previousHash: '0x6543210987654321'
    }
  ];

  const viewBlock = (tx) => {
    setSelectedBlock(tx);
    setShowDetails(true);
  };

  return (
    <div className="max-w-7xl mx-auto">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-800">Blockchain Ledger Viewer</h2>
          <p className="text-gray-600 mt-1">
            Immutable audit trail of all system transactions
          </p>
        </div>

        {/* Blockchain Stats */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="bg-purple-50 p-4 rounded-lg">
            <p className="text-sm text-gray-600">Total Blocks</p>
            <p className="text-2xl font-bold text-purple-600">{transactions[0].blockNumber}</p>
          </div>
          <div className="bg-blue-50 p-4 rounded-lg">
            <p className="text-sm text-gray-600">Verified Transactions</p>
            <p className="text-2xl font-bold text-blue-600">{transactions.length}</p>
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
          {transactions.map((tx) => (
            <div key={tx.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <span className="font-mono text-sm text-gray-600">Block #{tx.blockNumber}</span>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      tx.verified ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                    }`}>
                      {tx.verified ? '✓ Verified' : 'Pending'}
                    </span>
                    <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-medium">
                      {tx.action}
                    </span>
                  </div>

                  <p className="font-mono text-xs text-gray-500 mb-2">
                    TX: {tx.txHash}
                  </p>

                  <p className="text-sm text-gray-600">
                    {tx.timestamp}
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
          ))}
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
                  <h3 className="text-2xl font-bold text-gray-800">Block #{selectedBlock.blockNumber}</h3>
                  <p className="text-gray-600 font-mono text-sm">{selectedBlock.txHash}</p>
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
                      <p className="font-medium">{selectedBlock.timestamp}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Action Type</p>
                      <p className="font-medium">{selectedBlock.action}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Status</p>
                      <p className="font-medium text-green-600">✓ Verified</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Previous Hash</p>
                      <p className="font-mono text-xs">{selectedBlock.previousHash}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-blue-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-blue-800 mb-2">Transaction Data</h4>
                  <pre className="text-sm bg-white p-3 rounded overflow-x-auto">
                    {JSON.stringify(selectedBlock.data, null, 2)}
                  </pre>
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
