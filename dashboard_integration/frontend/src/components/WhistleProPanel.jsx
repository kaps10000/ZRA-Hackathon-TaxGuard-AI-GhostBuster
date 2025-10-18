import React from 'react';

const WhistleProPanel = ({ data }) => {
  const stats = {newCases: 3, inProgress: 18, urgent: 5, total: 23};

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-bold mb-4">WhistlePro Cases</h3>
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="bg-green-50 border rounded p-3">
          <p className="text-xs text-green-600">New (24h)</p>
          <p className="text-2xl font-bold">{stats.newCases}</p>
        </div>
        <div className="bg-yellow-50 border rounded p-3">
          <p className="text-xs text-yellow-600">In Progress</p>
          <p className="text-2xl font-bold">{stats.inProgress}</p>
        </div>
      </div>
      <button className="w-full border py-2 rounded hover:bg-gray-50">
        View All Cases
      </button>
    </div>
  );
};

export default WhistleProPanel;
