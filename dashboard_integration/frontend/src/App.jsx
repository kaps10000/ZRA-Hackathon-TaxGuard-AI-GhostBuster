import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import './index.css';

// Pages
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

// Icons
import {
  BarChart2,
  Database,
  ScanText,
  Megaphone,
  Ghost,
  Target,
  LineChart,
  Shield,
  Link2,
  ClipboardList,
  Menu,
  ChevronLeft,
  ChevronRight,
  X
} from 'lucide-react';

function App() {
  const [activePage, setActivePage] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(() =>
    typeof window !== 'undefined' ? window.innerWidth >= 768 : true
  );

  useEffect(() => {
    const handleResize = () => {
      if (typeof window !== 'undefined' && window.innerWidth >= 768) {
        setSidebarOpen(true);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const navigation = [
    { id: 'dashboard', name: 'Dashboard Overview', icon: BarChart2 },
    { id: 'database', name: 'Database Viewer', icon: Database },
    { id: 'ocr', name: 'OCR Document Scanner', icon: ScanText },
    { id: 'whistlepro', name: 'WhistlePro Cases', icon: Megaphone },
    { id: 'ghostbuster', name: 'GhostBuster Detection', icon: Ghost },
    { id: 'anomalytracker', name: 'Anomaly Tracker', icon: Target },
    { id: 'predictive', name: 'Predictive Analytics', icon: LineChart },
    { id: 'vrtguard', name: 'VRT Guard', icon: Shield },
    { id: 'blockchain', name: 'Blockchain Ledger', icon: Link2 },
    { id: 'cases', name: 'Past Cases', icon: ClipboardList },
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
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-30 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar with Framer Motion */}
      <motion.aside
        animate={{ width: sidebarOpen ? 256 : 80 }}
        transition={{ duration: 0.4, ease: 'easeInOut' }}
        className="fixed md:static inset-y-0 left-0 z-40 bg-gradient-to-b from-blue-900 to-blue-800 text-white shadow-xl flex flex-col justify-between"
      >
        {/* Top Section */}
        <div className="p-4 relative">
          {/* Always-visible toggle button */}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className={`absolute -right-3 top-6 z-50 bg-blue-900 border border-blue-700 hover:bg-blue-800 rounded-full p-1.5 transition-colors duration-200 shadow-md`}
            aria-label={sidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}
          >
            {sidebarOpen ? <ChevronLeft size={18} /> : <ChevronRight size={18} />}
          </button>

          {/* Logo / Title */}
          <motion.h1
            initial={false}
            animate={{ opacity: sidebarOpen ? 1 : 0 }}
            transition={{ duration: 0.3 }}
            className="text-xl font-bold whitespace-nowrap mt-2 mb-8"
          >
            {sidebarOpen && 'TaxGuard AI'}
          </motion.h1>

          {/* Navigation */}
          <nav className="space-y-2">
            {navigation.map((item) => {
              const Icon = item.icon;
              const active = activePage === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActivePage(item.id);
                    if (window.innerWidth < 768) setSidebarOpen(false);
                  }}
                  className={`group relative flex items-center w-full rounded-lg px-3 py-2 
                    ${sidebarOpen ? 'space-x-3' : 'justify-center'} 
                    transition-all duration-300 ease-in-out 
                    ${
                      active
                        ? 'bg-blue-700 border-l-4 border-blue-400 text-white'
                        : 'text-blue-200 hover:bg-blue-800 hover:text-white'
                    }`}
                >
                  <Icon
                    className={`shrink-0 transition-transform duration-300 group-hover:scale-110 ${
                      sidebarOpen ? 'h-5 w-5' : 'h-7 w-7'
                    }`}
                  />
                  <motion.span
                    initial={false}
                    animate={{
                      opacity: sidebarOpen ? 1 : 0,
                      x: sidebarOpen ? 0 : -10,
                    }}
                    transition={{ duration: 0.3 }}
                    className={`text-sm font-medium whitespace-nowrap ${
                      sidebarOpen ? 'block' : 'hidden'
                    }`}
                  >
                    {item.name}
                  </motion.span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Footer */}
        <motion.div
          initial={false}
          animate={{
            opacity: sidebarOpen ? 1 : 0,
            height: sidebarOpen ? 'auto' : 0,
          }}
          transition={{ duration: 0.4 }}
          className="p-4 bg-blue-950 border-t border-blue-800 overflow-hidden"
        >
          <div className="text-xs text-blue-300">
            <div className="font-semibold">ZRA - Zambia Revenue Authority</div>
            <div>GhostBuster AI System v1.0</div>
          </div>
        </motion.div>
      </motion.aside>


      {/* Main Content */}
      <main className="flex-1">
        {/* Header */}
        <motion.header
          animate={{ 
            left: sidebarOpen ? 256 : 80,
          }}
          transition={{ duration: 0.4, ease: 'easeInOut' }}
          className="fixed top-0 right-0 bg-white shadow-sm border-b border-gray-200 z-10"
        >
          <div className="px-6 py-4">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-3">
                <button
                  className="md:hidden inline-flex items-center justify-center rounded-md p-2 text-gray-700 hover:bg-gray-100"
                  onClick={() => setSidebarOpen(true)}
                  aria-label="Open sidebar"
                >
                  <Menu size={20} />
                </button>
                <div>
                  <h2 className="text-2xl font-bold text-gray-800">
                    {navigation.find((n) => n.id === activePage)?.name}
                  </h2>
                  <p className="text-sm text-gray-600 mt-1">
                    Integrated Tax Fraud Detection & Analytics Platform
                  </p>
                </div>
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
        </motion.header>

        {/* Page Content */}
        <div className="pt-[88px] p-6 overflow-y-auto h-screen">{renderPage()}</div>
      </main>
    </div>
  );
}

export default App;
