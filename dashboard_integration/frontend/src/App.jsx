import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
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
import Login from './components/Login';

// Protected Route Component
function ProtectedRoute({ children }) {
  const token = localStorage.getItem('token');
  const location = useLocation();
  
  if (!token) {
    return <Navigate to="/auth/login" state={{ from: location }} replace />;
  }
  
  return children;
}

// Main App Component
function AppContent() {
  const [activePage, setActivePage] = useState('dashboard');
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    // Check if user is already logged in
    const token = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');
    
    if (token && savedUser) {
      setUser(JSON.parse(savedUser));
    }
    setLoading(false);
  }, []);

  const handleLogin = (userData) => {
    setUser(userData);
    navigate('/'); // Redirect to home after login
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    navigate('/auth/login');
  };

  if (loading) {
    return <div style={{display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh'}}>Loading...</div>;
  }

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
    <Routes>
      {/* Login Route */}
      <Route path="/auth/login" element={<Login onLogin={handleLogin} />} />
      
      {/* Protected Routes */}
      <Route path="/*" element={
        <ProtectedRoute>
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
                
                {/* User info and logout */}
                {sidebarOpen && user && (
                  <div className="mt-8 pt-4 border-t border-blue-800">
                    <div className="px-3 py-2 text-sm text-blue-200">
                      <div className="font-medium">{user.name || user.username}</div>
                      <div className="text-xs text-blue-300">{user.role || 'User'}</div>
                    </div>
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-blue-200 hover:bg-red-600 hover:text-white transition-colors mt-2"
                    >
                      <span className="text-xl">🚪</span>
                      <span className="font-medium">Logout</span>
                    </button>
                  </div>
                )}
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
                        {navigation.find(nav => nav.id === activePage)?.name || 'Dashboard'}
                      </h2>
                      <p className="text-gray-600 mt-1">
                        ZRA TaxGuard AI - Advanced Tax Revenue Management System
                      </p>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                        <span className="text-sm text-gray-600">System Online</span>
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
        </ProtectedRoute>
      } />
      
      {/* Redirect root to dashboard */}
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}

export default App;
