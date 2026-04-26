import DashboardCard from "./DashboardCard";


const GhostBusterPanel = ({ data }) => {
  // Use real-time data from the API
  const phantomEmployees = data?.phantom_employees_detected || 0;
  const deceased = data?.deceased_employees || 0;
  const duplicate = data?.duplicate_employees || 0;
  const totalGhosts = data?.total_ghosts || (phantomEmployees + deceased + duplicate);
  const legitimate = data?.legitimate_employees || 0;

  return (
    <DashboardCard title="GhostBuster Detections" accent="red">
      <div className="space-y-3 text-sm">
        <div className="flex justify-between">
          <span>Phantom Employees:</span>
          <span className="font-semibold text-red-600">{phantomEmployees}</span>
        </div>
        <div className="flex justify-between">
          <span>Deceased Employees:</span>
          <span className="font-semibold text-red-600">{deceased}</span>
        </div>
        <div className="flex justify-between">
          <span>Duplicate Entries:</span>
          <span className="font-semibold text-orange-600">{duplicate}</span>
        </div>
        <div className="flex justify-between border-t pt-2 mt-2">
          <span className="font-semibold">Total Ghosts:</span>
          <span className="font-bold text-red-700">{totalGhosts}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-green-600">Legitimate:</span>
          <span className="font-semibold text-green-600">{legitimate}</span>
        </div>
      </div>

      <button className="mt-5 w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-2.5 rounded-lg font-medium hover:opacity-90 transition">
        View Network
      </button>
    </DashboardCard>
  );
};

export default GhostBusterPanel;