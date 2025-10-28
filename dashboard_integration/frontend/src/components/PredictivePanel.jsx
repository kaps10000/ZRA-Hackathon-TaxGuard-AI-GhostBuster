import React from 'react';
import DashboardCard from './DashboardCard';

const PredictivePanel = ({ data }) => {
  return (
    <DashboardCard title="Revenue Forecasting" accent='green'>
      <div className="bg-blue-50 rounded p-4 mb-4">
        <p className="text-sm text-gray-600">6-Month Forecast</p>
        <p className="text-3xl font-bold text-blue-900">ZMW 42.5M</p>
        <p className="text-sm text-green-600 mt-1">↑ 15% increase</p>
      </div>

      <div className="space-y-2">
        <div className="border border-yellow-300 bg-yellow-50 rounded p-3">
          <p className="text-sm font-semibold text-yellow-800">Copper Price Drop (-10%)</p>
          <p className="text-sm text-gray-700">Impact: -ZMW 2.3M</p>
        </div>
      </div>
    </DashboardCard>
  );
};

export default PredictivePanel;
