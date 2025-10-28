import React from 'react';

const GhostBusterDetection = () => {
  return (
    <div className="w-full h-full" style={{ height: 'calc(100vh - 150px)' }}>
      <div className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white p-4 mb-2 rounded-lg shadow-lg">
        <div className="flex items-center space-x-3">
          <span className="text-3xl">👻</span>
          <div>
            <h2 className="text-2xl font-bold">GhostBuster Detection System</h2>
            <p className="text-sm opacity-90">AI-Powered Ghost Employee Detection - Running on Port 3004</p>
          </div>
        </div>
      </div>
      <iframe
        src="http://localhost:3004" 
        className="w-full border-2 border-gray-300 rounded-lg shadow-lg"
        style={{ height: 'calc(100vh - 250px)' }}
        title="GhostBuster Detection System"
        allow="fullscreen"
      />
    </div>
  );
};

export default GhostBusterDetection;
