import DashboardCard from './DashboardCard';

const WhistleProPanel = ({ data }) => {
  // Use real-time data from the API
  const newCases = data?.new_reports_24h || 0;
  const inProgress = data?.in_progress || 0;
  const urgent = data?.urgent || 0;
  const activeCases = data?.active_cases || 0;
  const totalReports = data?.total_reports || 0;

  return (
    <DashboardCard title="WhistlePro Cases" accent="yellow">
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="bg-green-50 border border-green-100 rounded-xl p-3">
          <p className="text-xs text-green-600 font-medium">New (24h)</p>
          <p className="text-2xl font-bold">{newCases}</p>
        </div>
        <div className="bg-yellow-50 border border-yellow-100 rounded-xl p-3">
          <p className="text-xs text-yellow-600 font-medium">In Progress</p>
          <p className="text-2xl font-bold">{inProgress}</p>
        </div>
      </div>
      <div className="flex justify-between text-sm mb-3">
        <span className="text-gray-600">Active Cases:</span>
        <span className="font-semibold">{activeCases}</span>
      </div>
      <div className="flex justify-between text-sm mb-4">
        <span className="text-red-600">Urgent:</span>
        <span className="font-semibold text-red-600">{urgent}</span>
      </div>
      <button className="w-full border py-2.5 rounded-lg font-medium text-gray-700 hover:bg-gray-50 transition">
        View All Cases
      </button>
    </DashboardCard>
  );
};

export default WhistleProPanel;