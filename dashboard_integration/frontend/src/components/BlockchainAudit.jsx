import React from 'react';
import { ShieldCheck } from 'lucide-react';

const BlockchainAudit = ({ data }) => {
  const txs = [
    { tx: '0xabc123...f6e9', action: 'Doc Hash Stored', time: '14:23:45', status: 'verified' },
    { tx: '0xdef456...a2c1', action: 'Detection Recorded', time: '14:18:12', status: 'verified' }
  ];

  return (
    <div className="relative bg-white rounded-lg border border-gray-200 shadow-sm p-6 mt-6 overflow-hidden group hover:shadow-md transition-all duration-300">
      {/* Animated Top Border */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-0 h-[3px] bg-blue-500 transition-all duration-500 group-hover:w-full"></div>

      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold text-gray-800">Blockchain Audit Trail</h2>
        <span className="text-sm text-gray-500">Last synced: 2 mins ago</span>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full border-collapse">
          <thead>
            <tr className="bg-gradient-to-r from-blue-50 to-indigo-50 text-gray-600 text-xs uppercase tracking-wider border-b">
              <th className="px-4 py-3 text-left">TX Hash</th>
              <th className="px-4 py-3 text-left">Action</th>
              <th className="px-4 py-3 text-left">Time</th>
              <th className="px-4 py-3 text-left">Status</th>
            </tr>
          </thead>
          <tbody>
            {txs.map((tx, idx) => (
              <tr
                key={idx}
                className="hover:bg-blue-50 transition-colors border-b last:border-0"
              >
                <td className="px-4 py-3 text-sm font-mono text-gray-800">
                  {tx.tx}
                </td>
                <td className="px-4 py-3 text-sm text-gray-700">{tx.action}</td>
                <td className="px-4 py-3 text-sm text-gray-600">{tx.time}</td>
                <td className="px-4 py-3 text-sm">
                  {tx.status === 'verified' ? (
                    <span className="inline-flex items-center gap-1 bg-green-100 text-green-700 text-xs font-medium px-2 py-1 rounded-full">
                      <ShieldCheck size={14} />
                      Verified
                    </span>
                  ) : (
                    <span className="text-yellow-600">{tx.status}</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default BlockchainAudit;
