import React from 'react';

const OCRMonitor = ({ data }) => {
  const stats = {total: 1247, pending: 89, highRisk: 23, low: 1068, medium: 156};

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-bold mb-4">Document Processing</h3>
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Total Processed:</span>
          <span className="font-semibold">{stats.total}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-green-600">Low Risk:</span>
          <span>{stats.low} (86%)</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-yellow-600">Medium:</span>
          <span>{stats.medium} (12%)</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-red-600">High Risk:</span>
          <span>{stats.highRisk} (2%)</span>
        </div>
      </div>
    </div>
  );
};

export default OCRMonitor;
