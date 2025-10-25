import DashboardCard from "./DashboardCard";

const OCRMonitor = ({ data }) => {
  const stats = { total: 1247, pending: 89, highRisk: 23, low: 1068, medium: 156 };

  return (
    <DashboardCard title="Document Processing" accent="blue">
      <div className="space-y-3 text-sm">
        <div className="flex justify-between">
          <span className="text-gray-600">Total Processed:</span>
          <span className="font-semibold text-gray-900">{stats.total}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-green-600">Low Risk:</span>
          <span>{stats.low} (86%)</span>
        </div>
        <div className="flex justify-between">
          <span className="text-yellow-600">Medium:</span>
          <span>{stats.medium} (12%)</span>
        </div>
        <div className="flex justify-between">
          <span className="text-red-600">High Risk:</span>
          <span>{stats.highRisk} (2%)</span>
        </div>
      </div>
    </DashboardCard>
  );
};

export default OCRMonitor;