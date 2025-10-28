import DashboardCard from "./DashboardCard";

const OCRMonitor = ({ data }) => {
  // Use real-time data from the API
  const total = data?.documents_processed || 0;
  const lowRisk = data?.low_risk || 0;
  const mediumRisk = data?.medium_risk || 0;
  const highRisk = data?.high_risk_flagged || 0;

  // Calculate percentages
  const lowPercent = total > 0 ? Math.round((lowRisk / total) * 100) : 0;
  const mediumPercent = total > 0 ? Math.round((mediumRisk / total) * 100) : 0;
  const highPercent = total > 0 ? Math.round((highRisk / total) * 100) : 0;

  return (
    <DashboardCard title="Document Processing" accent="blue">
      <div className="space-y-3 text-sm">
        <div className="flex justify-between">
          <span className="text-gray-600">Total Processed:</span>
          <span className="font-semibold text-gray-900">{total}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-green-600">Low Risk:</span>
          <span>{lowRisk} ({lowPercent}%)</span>
        </div>
        <div className="flex justify-between">
          <span className="text-yellow-600">Medium:</span>
          <span>{mediumRisk} ({mediumPercent}%)</span>
        </div>
        <div className="flex justify-between">
          <span className="text-red-600">High Risk:</span>
          <span>{highRisk} ({highPercent}%)</span>
        </div>
      </div>
    </DashboardCard>
  );
};

export default OCRMonitor;