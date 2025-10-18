import React from 'react';

const BlockchainAudit = ({ data }) => {
  const txs = [
    {tx: '0xabc123...', action: 'Doc Hash Stored', time: '14:23:45', status: 'verified'},
    {tx: '0xdef456...', action: 'Detection Recorded', time: '14:18:12', status: 'verified'}
  ];

  return (
    <div className="bg-white rounded-lg shadow p-6 mt-6">
      <h2 className="text-xl font-bold mb-4">Blockchain Audit Trail</h2>
      <table className="min-w-full">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-4 py-2 text-left text-xs">TX Hash</th>
            <th className="px-4 py-2 text-left text-xs">Action</th>
            <th className="px-4 py-2 text-left text-xs">Time</th>
            <th className="px-4 py-2 text-left text-xs">Status</th>
          </tr>
        </thead>
        <tbody>
          {txs.map((tx, idx) => (
            <tr key={idx}>
              <td className="px-4 py-3 text-sm font-mono">{tx.tx}</td>
              <td className="px-4 py-3 text-sm">{tx.action}</td>
              <td className="px-4 py-3 text-sm">{tx.time}</td>
              <td className="px-4 py-3 text-sm text-green-600">{tx.status}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default BlockchainAudit;
