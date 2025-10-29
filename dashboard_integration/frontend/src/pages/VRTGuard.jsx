import React from 'react';

const VRTGuard = () => {
  return (
    <div className="w-full h-full" style={{ height: 'calc(100vh - 150px)' }}>
      <div className="bg-gradient-to-r from-blue-600 to-cyan-600 text-white p-4 mb-2 rounded-lg shadow-lg">
        <div className="flex items-center space-x-3">
          <span className="text-3xl">🛡️</span>
          <div>
            <h2 className="text-2xl font-bold">VRT Guard - VAT Fraud Detection</h2>
            <p className="text-sm opacity-90">AI-Powered VAT Return Fraud Analysis System - Running on Port 5002</p>
          </div>
        </div>
      </div>
      <iframe
        src="http://localhost:5002"
        className="w-full border-2 border-gray-300 rounded-lg shadow-lg"
        style={{ height: 'calc(100vh - 250px)' }}
        title="VRT Guard VAT Fraud Detection"
        allow="fullscreen"
      />
    </div>
  );
};

export default VRTGuard;
