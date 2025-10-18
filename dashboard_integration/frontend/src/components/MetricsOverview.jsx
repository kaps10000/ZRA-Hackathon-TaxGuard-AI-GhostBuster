import React from 'react';

const MetricCard = ({ title, value, trend, icon, severity = 'normal' }) => {
  const severityColors = {
    normal: 'bg-white border-gray-200',
    warning: 'bg-yellow-50 border-yellow-300',
    danger: 'bg-red-50 border-red-300',
    success: 'bg-green-50 border-green-300'
  };

  const trendColor = trend >= 0 ? 'text-green-600' : 'text-red-600';

  return (
    <div className={severityColors[severity] + ' border rounded-lg p-6 shadow-sm'}>
      <div className="flex justify-between items-start">
        <div>
          <p className="text-gray-600 text-sm font-medium">{title}</p>
          <p className="text-3xl font-bold mt-2">{value || '0'}</p>
          {trend !== undefined && (
            <p className={trendColor + ' text-sm mt-1'}>
              {trend >= 0 ? '↑' : '↓'} {Math.abs(trend)}% (24h)
            </p>
          )}
        </div>
        <div className="text-3xl">{icon}</div>
      </div>
    </div>
  );
};

const MetricsOverview = ({ data }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <MetricCard
        title="Documents Processed"
        value={data?.ocr?.documents_processed || 0}
        trend={15}
        icon="📄"
      />
      <MetricCard
        title="Active Cases"
        value={data?.whistlepro?.active_cases || 0}
        trend={-5}
        icon="📋"
      />
      <MetricCard
        title="Detections"
        value={data?.ghostbuster?.phantom_employees_detected || 0}
        trend={8}
        icon="🚨"
        severity="warning"
      />
      <MetricCard
        title="Revenue Forecast"
        value="ZMW 42M"
        trend={15}
        icon="💰"
        severity="success"
      />
    </div>
  );
};

export default MetricsOverview;
