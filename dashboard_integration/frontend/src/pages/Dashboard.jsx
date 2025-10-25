import React from 'react';
import { useDashboardData } from '../hooks/useDashboardData';
import MetricsOverview from '../components/MetricsOverview';
import RecentAlerts from '../components/RecentAlerts';
import OCRMonitor from '../components/OCRMonitor';
import WhistleProPanel from '../components/WhistleProPanel';
import GhostBusterPanel from '../components/GhostBusterPanel';
import PredictivePanel from '../components/PredictivePanel';
import BlockchainAudit from '../components/BlockchainAudit';
import { Network, RotateCcw } from "lucide-react"

const Dashboard = ({ onNavigate }) => {
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
                className="flex items-center gap-1 bg-blue-700 hover:bg-blue-600 px-3 py-2 rounded text-sm"
              >
                  <RotateCcw size={17} />
                Refresh
              </button>
              
            </div>
          </div>
        </div>
      </header>

      {/* Main Dashboard Content */}
      <main className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
        {/* Metrics Overview */}
        <MetricsOverview data={data} />

        {/* Recent Alerts */}
        <RecentAlerts data={data} onNavigate={onNavigate} />

      {/* Two-column rows with equal-height cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6 items-stretch">
        <div
          onClick={() => onNavigate && onNavigate('ocr')}
          className="cursor-pointer hover:shadow-xl transition-shadow group h-full"
        >
          <div className="h-full min-h-[220px] flex flex-col">
            <div className="flex-1">
              <OCRMonitor data={data?.ocr} />
            </div>
          </div>
        </div>

        <div
          onClick={() => onNavigate && onNavigate('ghostbuster')}
          className="cursor-pointer hover:shadow-xl transition-shadow group h-full"
        >
          <div className="h-full min-h-[220px] flex flex-col">
            <div className="flex-1">
              <GhostBusterPanel data={data?.ghostbuster} />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6 items-stretch">
        <div
          onClick={() => onNavigate && onNavigate('whistlepro')}
          className="cursor-pointer hover:shadow-xl transition-shadow group h-full"
        >
          <div className="h-full min-h-[220px] flex flex-col">
            <div className="flex-1">
              <WhistleProPanel data={data?.whistlepro} />
            </div>
          </div>
        </div>

        <div
          onClick={() => onNavigate && onNavigate('predictive')}
          className="cursor-pointer hover:shadow-xl transition-shadow group h-full"
        >
          <div className="h-full min-h-[220px] flex flex-col">
            <div className="flex-1">
              <PredictivePanel data={data?.predictive} />
            </div>
          </div>
        </div>
      </div>


        {/* Network Analysis Button */}
        <div className="mt-6">
          <button
            onClick={() => onNavigate && onNavigate('network')}
            className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white px-6 py-4 rounded-lg shadow-lg hover:shadow-xl transition-all flex items-center justify-center space-x-3"
          >
            <Network size={28} aria-hidden="true" className="text-white" />
            <span className="text-lg font-bold">Analyze Entity Networks & Relationships</span>
            <span className="text-sm bg-white/20 px-3 py-1 rounded-full">Click to Explore</span>
          </button>
        </div>

        {/* Blockchain Audit Trail */}
        <div onClick={() => onNavigate && onNavigate('blockchain')} className="cursor-pointer hover:shadow-xl transition-shadow mt-6">
          <BlockchainAudit data={data?.blockchain} />
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
