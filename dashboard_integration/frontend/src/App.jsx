import React from 'react';
import './index.css';
import Home from './pages/Home';
import { useState, useEffect } from 'react';
import SettingsPanel from './components/SettingsPanel';

function App() {
  const [demoMode, setDemoMode] = useState(true);
  const [showSettings, setShowSettings] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem('taxguard:demoMode');
    if (stored != null) setDemoMode(stored === 'true');
  }, []);

  useEffect(() => {
    localStorage.setItem('taxguard:demoMode', demoMode ? 'true' : 'false');
  }, [demoMode]);
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto py-4 px-6 flex items-center justify-between">
          <h1 className="text-xl font-bold">TaxGuard Investigator Dashboard</h1>
          <div className="flex items-center space-x-4">
            <div className="px-3 py-1 rounded border text-sm">
              Mode: <span className="font-semibold">{demoMode ? 'Mock' : 'Live'}</span>
            </div>
            <button
              className="px-3 py-1 border rounded text-sm bg-gray-50"
              onClick={() => setShowSettings(s => !s)}
            >
              Settings
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-6">
        <Home demoMode={demoMode} />
        {showSettings && (
          <div style={{ position: 'fixed', bottom: 24, right: 24, zIndex: 9999 }}>
            <SettingsPanel demoMode={demoMode} setDemoMode={setDemoMode} onClose={() => setShowSettings(false)} />
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
