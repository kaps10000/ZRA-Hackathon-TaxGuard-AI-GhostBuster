import React from 'react';

const GhostBusterPanel = ({ data }) => {
  // Use real data if available, otherwise show loading or error state
  if (!data) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-bold mb-4">GhostBuster Detections</h3>
        <div className="text-center py-4 text-gray-500">
          Loading statistics...
        </div>
      </div>
    );
  }

  // Check if data loaded successfully
  if (data.error) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-bold mb-4">GhostBuster Detections</h3>
        <div className="text-center py-4 text-red-600">
          {data.error}
        </div>
      </div>
    );
  }

  // Check if we have the required data
  if (!data.total_employees && !data.phantom_employees_detected) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-bold mb-4">GhostBuster Detections</h3>
        <div className="text-center py-4 text-red-600">
          Unable to load statistics
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-bold mb-4">GhostBuster Detections</h3>
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span>Phantom Employees:</span>
          <span className="font-semibold text-red-600">{data.phantom_employees_detected || 0}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span>Deceased Employees:</span>
          <span className="font-semibold text-red-600">{data.deceased_employees || 0}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span>Duplicate Employees:</span>
          <span className="font-semibold text-orange-600">{data.duplicate_employees || 0}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span>Over Age:</span>
          <span className="font-semibold text-orange-600">{data.over_age_employees || 0}</span>
        </div>
        <div className="flex justify-between text-sm border-t pt-2 mt-2">
          <span className="font-bold">Total Ghosts:</span>
          <span className="font-bold text-red-600">{data.total_ghosts || 0}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span>Legitimate:</span>
          <span className="font-semibold text-green-600">{data.legitimate_employees || 0}</span>
        </div>
        <div className="flex justify-between text-sm border-t pt-2 mt-2">
          <span className="font-bold">Total Employees:</span>
          <span className="font-bold">{data.total_employees || 0}</span>
        </div>
      </div>
      <button className="mt-4 w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700">
        View Details
      </button>
    </div>
  );
};

export default GhostBusterPanel;
// Force reload Sun Oct 26 14:26:05 CAT 2025
