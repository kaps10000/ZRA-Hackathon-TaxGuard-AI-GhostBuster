import React, { useState } from 'react';
import './index.css';
import Dashboard from './pages/Dashboard';
import PredictiveAnalytics from './pages/PredictiveAnalytics';
import VRTGuard from './pages/VRTGuard';
import PastCases from './pages/PastCases';
import DatabaseViewer from './pages/DatabaseViewer';
import OCRScanner from './pages/OCRScanner';
import WhistlePro from './pages/WhistlePro';
import BlockchainLedger from './pages/BlockchainLedger';
import GhostBusterDetection from './pages/GhostBusterDetection';
import AnomalyTracker from './pages/AnomalyTracker';

function App() {
  const [activePage, setActivePage] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const navigation = [
    { id: 'dashboard', name: 'Dashboard Overview', icon: '📊' },
    { id: 'database', name: 'Database Viewer', icon: '💾' },
    { id: 'ocr', name: 'OCR Document Scanner', icon: '📄' },
    { id: 'whistlepro', name: 'WhistlePro Cases', icon: '📢' },
    { id: 'ghostbuster', name: 'GhostBuster Detection', icon: '👻' },
    { id: 'anomalytracker', name: 'Anomaly Tracker', icon: '🎯' },
    { id: 'predictive', name: 'Predictive Analytics', icon: '📈' },
    { id: 'vrtguard', name: 'VRT Guard', icon: '🛡️' },
    { id: 'blockchain', name: 'Blockchain Ledger', icon: '⛓️' },
    { id: 'cases', name: 'Past Cases', icon: '📋' },
  ];

  const renderPage = () => {
    switch (activePage) {
      case 'dashboard':
        return <Dashboard onNavigate={setActivePage} />;
      case 'ghostbuster':
        return <GhostBusterDetection />;
      case 'anomalytracker':
        return <AnomalyTracker />;
      case 'predictive':
        return <PredictiveAnalytics />;
      case 'vrtguard':
        return <VRTGuard />;
      case 'database':
        return <DatabaseViewer />;
      case 'blockchain':
        return <BlockchainLedger />;
      case 'ocr':
        return <OCRScanner />;
      case 'whistlepro':
        return <WhistlePro />;
      case 'cases':
        return <PastCases />;
      default:
        return <Dashboard onNavigate={setActivePage} />;
    }
  };

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <aside className={`${sidebarOpen ? 'w-64' : 'w-16'} bg-blue-900 text-white transition-all duration-300`}>
        <div className="p-4">
          <div className="flex items-center justify-between mb-8">
            {sidebarOpen && <h1 className="text-xl font-bold">TaxGuard AI</h1>}
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="text-white hover:bg-blue-800 p-2 rounded"
            >
              {sidebarOpen ? '◀' : '▶'}
            </button>
          </div>

          <nav className="space-y-2">
            {navigation.map((item) => (
              <button
                key={item.id}
                onClick={() => setActivePage(item.id)}
                className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors ${
                  activePage === item.id
                    ? 'bg-blue-700 text-white'
                    : 'text-blue-200 hover:bg-blue-800 hover:text-white'
                }`}
              >
                <span className="text-2xl">{item.icon}</span>
                {sidebarOpen && <span className="font-medium">{item.name}</span>}
              </button>
            ))}
          </nav>
        </div>

        {sidebarOpen && (
          <div className="absolute bottom-0 left-0 right-0 p-4 bg-blue-950 border-t border-blue-800">
            <div className="text-xs text-blue-300">
              <div className="font-semibold">ZRA - Zambia Revenue Authority</div>
              <div>GhostBuster AI System v1.0</div>
            </div>
          </div>
        )}
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        {/* Header */}
        <header className="bg-white shadow-sm border-b border-gray-200">
          <div className="px-6 py-4">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold text-gray-800">
                  {navigation.find(n => n.id === activePage)?.name}
                </h2>
                <p className="text-sm text-gray-600 mt-1">
                  Integrated Tax Fraud Detection & Analytics Platform
                </p>
              </div>
              <div className="flex items-center space-x-4">
                <div className="text-sm text-gray-600">
                  <span className="font-medium">User:</span> John Doe (Tax Investigator)
                </div>
                <div className="h-10 w-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold">
                  JD
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="p-6">
          {renderPage()}
        </div>
      </main>
    </div>
  );
}

export default App;
