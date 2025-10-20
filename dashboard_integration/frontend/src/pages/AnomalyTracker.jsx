import React, { useState } from 'react';
import axios from 'axios';

const API_BASE = 'http://localhost:4001/api/anomaly-tracker';
const API_DB = 'http://localhost:4001/api/anomaly-tracker-db';

const AnomalyTracker = () => {
  const [activeTab, setActiveTab] = useState('manual'); // 'manual', 'ml', 'results'
  const [analyzing, setAnalyzing] = useState(false);
  const [results, setResults] = useState(null);
  const [method, setMethod] = useState('ml'); // 'ml' or 'manual'

  // Manual input state for single taxpayer
  const [taxpayerData, setTaxpayerData] = useState({
    tin: '',
    taxpayer_name: '',
    amount: '',
    transaction_count: '',
    avg_transaction: '',
    sector: '',
    region: '',
  });

  // Handle input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setTaxpayerData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Calculate average transaction automatically
  const calculateAvgTransaction = () => {
    const amount = parseFloat(taxpayerData.amount) || 0;
    const count = parseFloat(taxpayerData.transaction_count) || 1;
    return count > 0 ? (amount / count).toFixed(2) : '0.00';
  };

  // Handle ML-based risk scoring
  const handleMLPrediction = async () => {
    if (!taxpayerData.tin || !taxpayerData.taxpayer_name) {
      alert('Please provide at least TIN and Taxpayer Name');
      return;
    }

    setAnalyzing(true);

    try {
      // Prepare payload
      const payload = [{
        tin: taxpayerData.tin,
        taxpayer_name: taxpayerData.taxpayer_name,
        amount: parseFloat(taxpayerData.amount) || 0,
        transaction_count: parseInt(taxpayerData.transaction_count) || 0,
        avg_transaction: parseFloat(taxpayerData.avg_transaction || calculateAvgTransaction()) || 0,
        sector: taxpayerData.sector || 'Unknown',
        region: taxpayerData.region || 'Unknown',
      }];

      const response = await axios.post(`${API_BASE}/predict/ml`, payload);

      if (response.data.success && response.data.results && response.data.results.length > 0) {
        const result = response.data.results[0];
        setResults({
          ...result,
          method: 'ML Model',
          description: 'Machine Learning based risk prediction using XGBoost'
        });
        setActiveTab('results');

        // Save to database
        try {
          await axios.post(`${API_DB}/save`, {
            tin: result.tin,
            taxpayerName: result.taxpayer_name,
            amount: result.amount,
            transactionCount: result.transaction_count,
            avgTransaction: result.avg_transaction,
            sector: result.sector,
            region: result.region,
            riskScore: result.risk_score,
            riskLevel: result.risk_level,
            method: 'ml'
          });
        } catch (saveError) {
          console.error('Failed to save risk score:', saveError);
        }
      } else {
        alert('No results returned from ML model');
      }
    } catch (error) {
      console.error('ML prediction error:', error);
      alert(error.response?.data?.error || 'Failed to predict risk score using ML');
    } finally {
      setAnalyzing(false);
    }
  };

  // Handle manual formula-based risk scoring
  const handleManualPrediction = async () => {
    if (!taxpayerData.tin || !taxpayerData.taxpayer_name) {
      alert('Please provide at least TIN and Taxpayer Name');
      return;
    }

    setAnalyzing(true);

    try {
      // Prepare payload
      const payload = [{
        tin: taxpayerData.tin,
        taxpayer_name: taxpayerData.taxpayer_name,
        amount: parseFloat(taxpayerData.amount) || 0,
        transaction_count: parseInt(taxpayerData.transaction_count) || 0,
        avg_transaction: parseFloat(taxpayerData.avg_transaction || calculateAvgTransaction()) || 0,
        sector: taxpayerData.sector || 'Unknown',
        region: taxpayerData.region || 'Unknown',
      }];

      const response = await axios.post(`${API_BASE}/predict/manual`, payload);

      if (response.data.success && response.data.results && response.data.results.length > 0) {
        const result = response.data.results[0];
        setResults({
          ...result,
          method: 'Manual Formula',
          description: 'Rule-based risk scoring using predefined formulas'
        });
        setActiveTab('results');

        // Save to database
        try {
          await axios.post(`${API_DB}/save`, {
            tin: result.tin,
            taxpayerName: result.taxpayer_name,
            amount: result.amount,
            transactionCount: result.transaction_count,
            avgTransaction: result.avg_transaction,
            sector: result.sector,
            region: result.region,
            riskScore: result.risk_score,
            riskLevel: result.risk_level,
            method: 'manual'
          });
        } catch (saveError) {
          console.error('Failed to save risk score:', saveError);
        }
      } else {
        alert('No results returned from manual prediction');
      }
    } catch (error) {
      console.error('Manual prediction error:', error);
      alert(error.response?.data?.error || 'Failed to predict risk score using manual formula');
    } finally {
      setAnalyzing(false);
    }
  };

  // Reset form
  const handleReset = () => {
    setTaxpayerData({
      tin: '',
      taxpayer_name: '',
      amount: '',
      transaction_count: '',
      avg_transaction: '',
      sector: '',
      region: '',
    });
    setResults(null);
    setActiveTab('manual');
  };

  // Get risk color
  const getRiskColor = (riskLevel) => {
    switch (riskLevel) {
      case 'High': return 'bg-red-100 text-red-700 border-red-300';
      case 'Medium': return 'bg-yellow-100 text-yellow-700 border-yellow-300';
      case 'Low': return 'bg-green-100 text-green-700 border-green-300';
      default: return 'bg-gray-100 text-gray-700 border-gray-300';
    }
  };

  return (
    <div className="max-w-7xl mx-auto">
      <div className="bg-white rounded-lg shadow-lg p-6">
        {/* Header */}
        <div className="mb-6">
          <h2 className="text-3xl font-bold text-gray-800 flex items-center">
            <span className="text-4xl mr-3">📊</span>
            Anomaly Tracker - AI Risk Scoring
          </h2>
          <p className="text-gray-600 mt-2">
            Advanced taxpayer risk analysis using Machine Learning and rule-based scoring
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-gray-200 mb-6">
          <button
            onClick={() => setActiveTab('manual')}
            className={`px-6 py-3 font-medium transition-colors ${
              activeTab === 'manual'
                ? 'border-b-2 border-blue-600 text-blue-600'
                : 'text-gray-600 hover:text-blue-600'
            }`}
          >
            Taxpayer Data Entry
          </button>
          <button
            onClick={() => setActiveTab('results')}
            className={`px-6 py-3 font-medium transition-colors ${
              activeTab === 'results'
                ? 'border-b-2 border-blue-600 text-blue-600'
                : !results
                ? 'text-gray-400 cursor-not-allowed'
                : 'text-gray-600 hover:text-blue-600'
            }`}
            disabled={!results}
            title={!results ? 'Run an analysis first to view results' : 'View analysis results'}
          >
            Analysis Results {!results && '(Run Analysis First)'}
          </button>
        </div>

        {/* Manual Input Tab */}
        {activeTab === 'manual' && (
          <div className="space-y-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
              <h3 className="font-semibold text-blue-800 mb-2">Risk Scoring Methods</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white p-3 rounded border border-blue-100">
                  <h4 className="font-medium text-blue-700 mb-1">ML-Based Scoring</h4>
                  <p className="text-sm text-gray-600">Uses XGBoost machine learning model trained on historical data for accurate risk prediction</p>
                </div>
                <div className="bg-white p-3 rounded border border-blue-100">
                  <h4 className="font-medium text-blue-700 mb-1">Manual Formula</h4>
                  <p className="text-sm text-gray-600">Rule-based scoring using predefined formulas and business logic</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
              {/* Left Column */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    TIN (Taxpayer Identification Number) *
                  </label>
                  <input
                    type="text"
                    name="tin"
                    value={taxpayerData.tin}
                    onChange={handleInputChange}
                    placeholder="e.g., 1234567890"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Taxpayer Name *
                  </label>
                  <input
                    type="text"
                    name="taxpayer_name"
                    value={taxpayerData.taxpayer_name}
                    onChange={handleInputChange}
                    placeholder="e.g., ABC Corporation Ltd"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Total Transaction Amount (ZMW)
                  </label>
                  <input
                    type="number"
                    name="amount"
                    value={taxpayerData.amount}
                    onChange={handleInputChange}
                    placeholder="e.g., 1000000"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Number of Transactions
                  </label>
                  <input
                    type="number"
                    name="transaction_count"
                    value={taxpayerData.transaction_count}
                    onChange={handleInputChange}
                    placeholder="e.g., 150"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>

              {/* Right Column */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Average Transaction (Auto-calculated)
                  </label>
                  <input
                    type="number"
                    name="avg_transaction"
                    value={taxpayerData.avg_transaction || calculateAvgTransaction()}
                    onChange={handleInputChange}
                    placeholder="Auto-calculated"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Business Sector
                  </label>
                  <select
                    name="sector"
                    value={taxpayerData.sector}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Select Sector</option>
                    <option value="Mining">Mining</option>
                    <option value="Agriculture">Agriculture</option>
                    <option value="Manufacturing">Manufacturing</option>
                    <option value="Retail">Retail</option>
                    <option value="Services">Services</option>
                    <option value="Construction">Construction</option>
                    <option value="Healthcare">Healthcare</option>
                    <option value="Education">Education</option>
                    <option value="Technology">Technology</option>
                    <option value="Transportation">Transportation</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Region
                  </label>
                  <select
                    name="region"
                    value={taxpayerData.region}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Select Region</option>
                    <option value="Lusaka">Lusaka</option>
                    <option value="Copperbelt">Copperbelt</option>
                    <option value="Southern">Southern</option>
                    <option value="Central">Central</option>
                    <option value="Eastern">Eastern</option>
                    <option value="Western">Western</option>
                    <option value="Northwestern">Northwestern</option>
                    <option value="Northern">Northern</option>
                    <option value="Luapula">Luapula</option>
                    <option value="Muchinga">Muchinga</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex space-x-4 pt-4">
              <button
                onClick={handleMLPrediction}
                disabled={analyzing}
                className="flex-1 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed font-medium flex items-center justify-center space-x-2"
              >
                {analyzing ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    <span>Analyzing with ML...</span>
                  </>
                ) : (
                  <>
                    <span>🤖</span>
                    <span>Analyze with ML Model</span>
                  </>
                )}
              </button>

              <button
                onClick={handleManualPrediction}
                disabled={analyzing}
                className="flex-1 bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed font-medium flex items-center justify-center space-x-2"
              >
                {analyzing ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    <span>Analyzing with Formula...</span>
                  </>
                ) : (
                  <>
                    <span>📐</span>
                    <span>Analyze with Manual Formula</span>
                  </>
                )}
              </button>

              <button
                onClick={handleReset}
                className="bg-gray-200 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-300 font-medium"
              >
                Reset
              </button>
            </div>
          </div>
        )}

        {/* Results Tab */}
        {activeTab === 'results' && results && (
          <div className="space-y-6">
            {/* Risk Score Header */}
            <div className={`border-2 rounded-xl p-6 ${getRiskColor(results.risk_level)}`}>
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-2xl font-bold mb-2">Risk Assessment Complete</h3>
                  <p className="text-sm opacity-80">{results.description}</p>
                </div>
                <div className="text-center">
                  <div className="text-5xl font-bold">{results.risk_score}</div>
                  <div className="text-sm font-medium mt-1">Risk Score</div>
                </div>
              </div>
            </div>

            {/* Taxpayer Information */}
            <div className="bg-gray-50 rounded-lg p-6">
              <h4 className="font-semibold text-gray-800 mb-4 text-lg">Taxpayer Information</h4>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <p className="text-sm text-gray-600">TIN</p>
                  <p className="font-medium text-gray-900">{results.tin}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Name</p>
                  <p className="font-medium text-gray-900">{results.taxpayer_name}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Risk Level</p>
                  <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${getRiskColor(results.risk_level)}`}>
                    {results.risk_level}
                  </span>
                </div>
              </div>
            </div>

            {/* Transaction Details */}
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h4 className="font-semibold text-gray-800 mb-4 text-lg">Transaction Details</h4>
              <div className="grid grid-cols-4 gap-4">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600 mb-1">Total Amount</p>
                  <p className="text-xl font-bold text-blue-700">
                    ZMW {(results.amount || 0).toLocaleString()}
                  </p>
                </div>
                <div className="bg-green-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600 mb-1">Transactions</p>
                  <p className="text-xl font-bold text-green-700">
                    {(results.transaction_count || 0).toLocaleString()}
                  </p>
                </div>
                <div className="bg-purple-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600 mb-1">Average</p>
                  <p className="text-xl font-bold text-purple-700">
                    ZMW {(results.avg_transaction || 0).toLocaleString()}
                  </p>
                </div>
                <div className="bg-orange-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600 mb-1">Sector</p>
                  <p className="text-xl font-bold text-orange-700">{results.sector || 'N/A'}</p>
                </div>
              </div>
            </div>

            {/* Recommendations */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
              <h4 className="font-semibold text-yellow-800 mb-3 flex items-center">
                <span className="mr-2">💡</span>
                Recommendations
              </h4>
              <ul className="space-y-2 text-sm text-yellow-900">
                {results.risk_level === 'High' && (
                  <>
                    <li>• Immediate investigation recommended - High risk detected</li>
                    <li>• Review all transaction records and supporting documents</li>
                    <li>• Consider field audit or enhanced compliance check</li>
                    <li>• Flag for priority investigation queue</li>
                  </>
                )}
                {results.risk_level === 'Medium' && (
                  <>
                    <li>• Enhanced monitoring recommended</li>
                    <li>• Review transaction patterns for anomalies</li>
                    <li>• Request additional documentation if needed</li>
                    <li>• Schedule follow-up assessment in next quarter</li>
                  </>
                )}
                {results.risk_level === 'Low' && (
                  <>
                    <li>• Standard compliance monitoring sufficient</li>
                    <li>• Maintain regular filing schedule</li>
                    <li>• No immediate action required</li>
                    <li>• Continue periodic reviews as per policy</li>
                  </>
                )}
              </ul>
            </div>

            {/* Action Buttons */}
            <div className="flex space-x-4">
              <button
                onClick={() => setActiveTab('manual')}
                className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 font-medium"
              >
                Analyze Another Taxpayer
              </button>
              <button
                onClick={() => window.print()}
                className="bg-gray-200 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-300 font-medium"
              >
                Print Report
              </button>
            </div>
          </div>
        )}

        {/* Info Panel */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="font-semibold text-blue-800 mb-2">ℹ️ About Anomaly Tracker</h4>
          <ul className="text-sm text-blue-700 space-y-1">
            <li>• Uses advanced ML algorithms (XGBoost) trained on historical taxpayer data</li>
            <li>• Risk scores range from 0-100, with higher scores indicating greater risk</li>
            <li>• Combines transaction patterns, sector analysis, and regional data</li>
            <li>• All predictions are stored securely in the database for audit trails</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default AnomalyTracker;
