import React from 'react';
import { FileText, ClipboardList, AlertTriangle, DollarSign } from 'lucide-react';
import { motion } from 'framer-motion';

const MetricCard = ({ title, value, trend, icon, severity = 'normal' }) => {
  const severityStyles = {
    normal: 'bg-white border-gray-200 hover:shadow-lg',
    warning: 'bg-yellow-50 border-yellow-200 hover:shadow-lg',
    danger: 'bg-red-50 border-red-200 hover:shadow-lg',
    success: 'bg-green-50 border-green-200 hover:shadow-lg'
  };

  const trendColor = trend >= 0 ? 'text-green-600' : 'text-red-600';
  const trendSymbol = trend >= 0 ? '▲' : '▼';

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      transition={{ type: 'spring', stiffness: 200 }}
      className={`
        relative border rounded-2xl p-5 sm:p-6 transition-all duration-300 
        ${severityStyles[severity]} shadow-sm overflow-hidden group
      `}
    >
      {/* Animated top border only */}
      <span
        className="absolute top-0 left-1/2 h-[3px] w-0 bg-gradient-to-r from-blue-500 to-indigo-500 
                   transition-all duration-500 ease-out group-hover:w-full group-hover:left-0 rounded-t-2xl"
      ></span>

      <div className="relative flex justify-between items-center">
        <div className="flex flex-col">
          <p className="text-sm text-gray-500 font-medium">{title}</p>
          <h3 className="text-3xl font-semibold text-gray-800 mt-2 tracking-tight">
            {value || '0'}
          </h3>
        </div>
        <div className="p-3 rounded-xl bg-gray-100">{icon}</div>
      </div>

      {trend !== undefined && (
        <div className={`relative mt-4 text-sm font-medium ${trendColor}`}>
          {trendSymbol} {Math.abs(trend)}% <span className="text-gray-500">(last 24h)</span>
        </div>
      )}
    </motion.div>
  );
};

const MetricsOverview = ({ data }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
      <MetricCard
        title="Documents Processed"
        value={data?.ocr?.documents_processed || 0}
        trend={data?.ocr?.trend || 15}
        icon={<FileText size={28} className="text-blue-600" />}
      />
      <MetricCard
        title="Active Cases"
        value={data?.whistlepro?.active_cases || 0}
        trend={data?.whistlepro?.trend || -5}
        icon={<ClipboardList size={28} className="text-indigo-600" />}
      />
      <MetricCard
        title="Detections"
        value={data?.ghostbuster?.total_ghosts || data?.ghostbuster?.phantom_employees_detected || 0}
        trend={data?.ghostbuster?.trend || 8}
        icon={<AlertTriangle size={28} className="text-yellow-600" />}
        severity="warning"
      />
      <MetricCard
        title="Revenue Forecast"
        value={data?.predictive?.revenue_forecast_formatted || `ZMW ${((data?.predictive?.revenue_forecast || 42000000) / 1000000).toFixed(1)}M`}
        trend={data?.predictive?.trend || 15}
        icon={<DollarSign size={28} className="text-green-600" />}
        severity="success"
      />
    </div>
  );
};

export default MetricsOverview;
