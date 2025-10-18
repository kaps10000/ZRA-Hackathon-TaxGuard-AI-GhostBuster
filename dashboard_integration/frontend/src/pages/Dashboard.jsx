import React from 'react';
import { useDashboardData } from '../hooks/useDashboardData';
import MetricsOverview from '../components/MetricsOverview';
import RecentAlerts from '../components/RecentAlerts';
import OCRMonitor from '../components/OCRMonitor';
import WhistleProPanel from '../components/WhistleProPanel';
import GhostBusterPanel from '../components/GhostBusterPanel';
import PredictivePanel from '../components/PredictivePanel';
import BlockchainAudit from '../components/BlockchainAudit';

const Dashboard = () => {
  const { data, loading, error, refresh } = useDashboardData();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">Loading Dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md">
          <h2 className="text-red-800 text-xl font-bold mb-2">Error Loading Dashboard</h2>
          <p className="text-red-600 mb-4">{error}</p>
          <button 
            onClick={refresh}
            className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-blue-900 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold">TaxGuard AI GhostBuster</h1>
              <p className="text-blue-200 text-sm">Investigator Dashboard</p>
            </div>
            <div className="flex items-center space-x-4">
              <button 
                onClick={refresh}
                className="bg-blue-700 hover:bg-blue-600 px-3 py-2 rounded text-sm"
              >
                🔄 Refresh
              </button>
              <div className="text-sm">
                <span className="text-blue-200">User:</span> John Doe (Auditor)
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Dashboard Content */}
      <main className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
        {/* Metrics Overview */}
        <MetricsOverview data={data} />

        {/* Recent Alerts */}
        <RecentAlerts data={data} />

        {/* Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
          {/* OCR Monitor */}
          <OCRMonitor data={data?.ocr} />

          {/* GhostBuster Panel */}
          <GhostBusterPanel data={data?.ghostbuster} />
        </div>

        {/* Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
          {/* WhistlePro Panel */}
          <WhistleProPanel data={data?.whistlepro} />

          {/* Predictive Panel */}
          <PredictivePanel data={data?.predictive} />
        </div>

        {/* Blockchain Audit Trail */}
        <BlockchainAudit data={data?.blockchain} />
      </main>
    </div>
  );
};

export default Dashboard;
