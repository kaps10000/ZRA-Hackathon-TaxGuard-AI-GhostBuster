import React from 'react';

const GhostBusterPanel = ({ data }) => {
  const stats = {phantomEmployees: 12, ghostCompanies: 5, networks: 8};

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-bold mb-4">GhostBuster Detections</h3>
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span>Phantom Employees:</span>
          <span className="font-semibold text-red-600">{stats.phantomEmployees}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span>Ghost Companies:</span>
          <span className="font-semibold text-red-600">{stats.ghostCompanies}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span>Related Networks:</span>
          <span className="font-semibold">{stats.networks}</span>
        </div>
      </div>
      <button className="mt-4 w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700">
        View Network
      </button>
    </div>
  );
};

export default GhostBusterPanel;
