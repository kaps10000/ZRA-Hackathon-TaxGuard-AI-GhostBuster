import DashboardCard from './DashboardCard';

const WhistleProPanel = ({ data }) => {
  const stats = { newCases: 3, inProgress: 18, urgent: 5, total: 23 };

  return (
    <DashboardCard title="WhistlePro Cases" accent="yellow">
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="bg-green-50 border border-green-100 rounded-xl p-3">
          <p className="text-xs text-green-600 font-medium">New (24h)</p>
          <p className="text-2xl font-bold">{stats.newCases}</p>
        </div>
        <div className="bg-yellow-50 border border-yellow-100 rounded-xl p-3">
          <p className="text-xs text-yellow-600 font-medium">In Progress</p>
          <p className="text-2xl font-bold">{stats.inProgress}</p>
        </div>
      </div>
      <button className="w-full border py-2.5 rounded-lg font-medium text-gray-700 hover:bg-gray-50 transition">
        View All Cases
      </button>
    </DashboardCard>
  );
};

export default WhistleProPanel;