import React from 'react';

const PredictivePanel = ({ data }) => {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-bold mb-4">Revenue Forecasting</h3>
      <div className="bg-blue-50 rounded p-4 mb-4">
        <p className="text-sm text-gray-600">6-Month Forecast</p>
        <p className="text-3xl font-bold text-blue-900">ZMW 42.5M</p>
        <p className="text-sm text-green-600 mt-1">↑ 15% increase</p>
      </div>
      <div className="space-y-2">
        <div className="border border-yellow-300 bg-yellow-50 rounded p-3">
          <p className="text-sm font-semibold">Copper Price Drop (-10%)</p>
          <p className="text-sm">Impact: -ZMW 2.3M</p>
        </div>
      </div>
    </div>
  );
};

export default PredictivePanel;
