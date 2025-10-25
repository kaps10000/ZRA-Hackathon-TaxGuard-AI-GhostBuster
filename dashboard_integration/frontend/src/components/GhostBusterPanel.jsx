import DashboardCard from "./DashboardCard";


const GhostBusterPanel = ({ data }) => {
  const stats = { phantomEmployees: 12, ghostCompanies: 5, networks: 8 };

  return (
    <DashboardCard title="GhostBuster Detections" accent="red">
      <div className="space-y-3 text-sm">
        <div className="flex justify-between">
          <span>Phantom Employees:</span>
          <span className="font-semibold text-red-600">{stats.phantomEmployees}</span>
        </div>
        <div className="flex justify-between">
          <span>Ghost Companies:</span>
          <span className="font-semibold text-red-600">{stats.ghostCompanies}</span>
        </div>
        <div className="flex justify-between">
          <span>Related Networks:</span>
          <span className="font-semibold text-gray-900">{stats.networks}</span>
        </div>
      </div>

      <button className="mt-5 w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-2.5 rounded-lg font-medium hover:opacity-90 transition">
        View Network
      </button>
    </DashboardCard>
  );
};

export default GhostBusterPanel;