import React from 'react';
import DashboardCard from './DashboardCard';

const PredictivePanel = ({ data }) => {
  // Use real-time data from the API
  const forecast = data?.revenue_forecast || 42000000;
  const forecastFormatted = data?.revenue_forecast_formatted || `ZMW ${(forecast / 1000000).toFixed(1)}M`;
  const trend = data?.trend || 0;
  const recoveryPotential = data?.fraud_recovery_potential || 0;
  const confidence = data?.confidence || 50;
  const trendSymbol = trend >= 0 ? '↑' : '↓';
  const trendColor = trend >= 0 ? 'text-green-600' : 'text-red-600';

  return (
    <DashboardCard title="Revenue Forecasting" accent='green'>
      <div className="bg-blue-50 rounded p-4 mb-4">
        <p className="text-sm text-gray-600">6-Month Forecast</p>
        <p className="text-3xl font-bold text-blue-900">{forecastFormatted}</p>
        <p className={`text-sm ${trendColor} mt-1`}>
          {trendSymbol} {Math.abs(trend)}% {trend >= 0 ? 'increase' : 'decrease'}
        </p>
      </div>

      <div className="space-y-2">
        <div className="border border-green-300 bg-green-50 rounded p-3">
          <p className="text-sm font-semibold text-green-800">Fraud Recovery Potential</p>
          <p className="text-sm text-gray-700">
            Impact: +ZMW {(recoveryPotential / 1000000).toFixed(2)}M
          </p>
        </div>
        <div className="border border-blue-300 bg-blue-50 rounded p-3">
          <p className="text-sm font-semibold text-blue-800">Confidence Level</p>
          <p className="text-sm text-gray-700">{confidence}%</p>
        </div>
      </div>
    </DashboardCard>
  );
};

export default PredictivePanel;
