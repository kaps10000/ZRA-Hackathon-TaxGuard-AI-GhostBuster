import React, { useState } from 'react';
import axios from 'axios';

const NetworkAnalysis = () => {
  const [entities, setEntities] = useState([
    { id: '1', tin: '1234567890', name: 'ABC Mining Ltd', type: 'company' },
    { id: '2', tin: '0987654321', name: 'XYZ Traders', type: 'company' },
  ]);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const analyzeNetwork = async () => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await axios.post('http://localhost:3003/analyze/network', {
        entities: entities
      });
      setResult(response.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to analyze network');
    } finally {
      setLoading(false);
    }
  };

  const addEntity = () => {
    setEntities([...entities, {
      id: Date.now().toString(),
      tin: '',
      name: '',
      type: 'company'
    }]);
  };

  const removeEntity = (id) => {
    setEntities(entities.filter(e => e.id !== id));
  };

  const updateEntity = (id, field, value) => {
    setEntities(entities.map(e =>
      e.id === id ? { ...e, [field]: value } : e
    ));
  };

  return (
    <div className="max-w-6xl mx-auto">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-800">Entity Network Analysis</h2>
          <p className="text-gray-600 mt-1">
            Analyze relationships and connections between companies and individuals
          </p>
        </div>

        {/* Entity Input Section */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-700">Entities to Analyze</h3>
            <button
              onClick={addEntity}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 flex items-center space-x-2"
            >
              <span>➕</span>
              <span>Add Entity</span>
            </button>
          </div>

          <div className="space-y-3">
            {entities.map((entity, idx) => (
              <div key={entity.id} className="flex items-center space-x-3 p-4 bg-gray-50 rounded-lg">
                <div className="flex-none w-8 text-center font-bold text-gray-500">
                  {idx + 1}
                </div>
                <div className="flex-1 grid grid-cols-3 gap-3">
                  <input
                    type="text"
                    placeholder="TIN/NRC"
                    value={entity.tin}
                    onChange={(e) => updateEntity(entity.id, 'tin', e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  />
                  <input
                    type="text"
                    placeholder="Name"
                    value={entity.name}
                    onChange={(e) => updateEntity(entity.id, 'name', e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  />
                  <select
                    value={entity.type}
                    onChange={(e) => updateEntity(entity.id, 'type', e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="company">Company</option>
                    <option value="individual">Individual</option>
                  </select>
                </div>
                <button
                  onClick={() => removeEntity(entity.id)}
                  className="flex-none text-red-600 hover:text-red-800 px-3 py-2"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        </div>

        <button
          onClick={analyzeNetwork}
          disabled={loading || entities.length === 0}
          className="w-full bg-purple-600 text-white py-3 px-4 rounded-md hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed font-semibold"
        >
          {loading ? 'Analyzing Network...' : '🔗 Analyze Network Connections'}
        </button>

        {/* Error Display */}
        {error && (
          <div className="mt-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-800 font-medium">Error</p>
            <p className="text-red-600">{error}</p>
          </div>
        )}

        {/* Results Display */}
        {result && (
          <div className="mt-6 space-y-6">
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
              <h3 className="text-lg font-bold text-gray-800 mb-4">Network Analysis Results</h3>

              {/* Summary Stats */}
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="bg-white p-4 rounded-lg shadow-sm">
                  <p className="text-sm text-gray-600">Related Entities</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {result.network?.related_entities?.length || 0}
                  </p>
                </div>
                <div className="bg-white p-4 rounded-lg shadow-sm">
                  <p className="text-sm text-gray-600">Direct Connections</p>
                  <p className="text-2xl font-bold text-green-600">
                    {result.network?.connections?.length || 0}
                  </p>
                </div>
                <div className="bg-white p-4 rounded-lg shadow-sm">
                  <p className="text-sm text-gray-600">Risk Level</p>
                  <p className={`text-2xl font-bold ${
                    result.network?.risk_level === 'HIGH' ? 'text-red-600' :
                    result.network?.risk_level === 'MEDIUM' ? 'text-yellow-600' :
                    'text-green-600'
                  }`}>
                    {result.network?.risk_level || 'LOW'}
                  </p>
                </div>
              </div>

              {/* Related Entities */}
              {result.network?.related_entities && result.network.related_entities.length > 0 && (
                <div className="mb-6">
                  <h4 className="font-semibold text-gray-700 mb-3">Related Entities</h4>
                  <div className="space-y-2">
                    {result.network.related_entities.map((entity, idx) => (
                      <div key={idx} className="flex items-center justify-between p-3 bg-white rounded border border-gray-200">
                        <div>
                          <p className="font-medium text-gray-800">{entity.name || entity.tin}</p>
                          <p className="text-sm text-gray-600">TIN: {entity.tin}</p>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-sm ${
                          entity.relationship === 'OWNER' ? 'bg-purple-100 text-purple-700' :
                          entity.relationship === 'DIRECTOR' ? 'bg-blue-100 text-blue-700' :
                          entity.relationship === 'SHAREHOLDER' ? 'bg-green-100 text-green-700' :
                          'bg-gray-100 text-gray-700'
                        }`}>
                          {entity.relationship || 'RELATED'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Red Flags */}
              {result.network?.red_flags && result.network.red_flags.length > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <h4 className="font-semibold text-red-800 mb-2">⚠️ Red Flags Detected</h4>
                  <ul className="list-disc list-inside space-y-1">
                    {result.network.red_flags.map((flag, idx) => (
                      <li key={idx} className="text-sm text-red-700">{flag}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Recommendation */}
              {result.recommendation && (
                <div className="bg-blue-50 border border-blue-200 rounded p-4 mt-4">
                  <p className="text-sm font-medium text-blue-800">Recommendation:</p>
                  <p className="text-sm text-blue-700 mt-1">{result.recommendation}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Info Panel */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="font-semibold text-blue-800 mb-2">ℹ️ How Network Analysis Works</h4>
          <ul className="text-sm text-blue-700 space-y-1">
            <li>• Analyzes relationships between companies and individuals</li>
            <li>• Identifies common ownership, directorship, and shareholding patterns</li>
            <li>• Detects potential shell companies and related party transactions</li>
            <li>• Flags suspicious network structures used for tax evasion</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default NetworkAnalysis;
