import React, { useState } from 'react';
import axios from 'axios';

const GhostBusterDetection = () => {
  const [activeTab, setActiveTab] = useState('company');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  // Company detection form
  const [companyData, setCompanyData] = useState({
    tin: '',
    company_name: '',
    registration_number: '',
    address: '',
    industry: '',
    registration_date: ''
  });

  // Employee detection form
  const [employeeData, setEmployeeData] = useState({
    nrc: '',
    full_name: '',
    employer_tin: '',
    napsa_number: '',
    employment_date: ''
  });

  const handleCompanyDetection = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await axios.post('http://localhost:3003/detect/company', companyData);
      setResult(response.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to detect ghost company');
    } finally {
      setLoading(false);
    }
  };

  const handleEmployeeDetection = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await axios.post('http://localhost:3003/detect/employee', employeeData);
      setResult(response.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to detect phantom employee');
    } finally {
      setLoading(false);
    }
  };

  const getRiskColor = (score) => {
    if (score >= 70) return 'text-red-600 bg-red-100';
    if (score >= 40) return 'text-yellow-600 bg-yellow-100';
    return 'text-green-600 bg-green-100';
  };

  return (
    <div className="max-w-6xl mx-auto">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">GhostBuster Detection System</h2>

        {/* Tabs */}
        <div className="border-b border-gray-200 mb-6">
          <nav className="flex space-x-4">
            <button
              onClick={() => setActiveTab('company')}
              className={`px-4 py-2 font-medium ${
                activeTab === 'company'
                  ? 'border-b-2 border-blue-600 text-blue-600'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              Ghost Company Detection
            </button>
            <button
              onClick={() => setActiveTab('employee')}
              className={`px-4 py-2 font-medium ${
                activeTab === 'employee'
                  ? 'border-b-2 border-blue-600 text-blue-600'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              Phantom Employee Detection
            </button>
          </nav>
        </div>

        {/* Company Detection Form */}
        {activeTab === 'company' && (
          <form onSubmit={handleCompanyDetection} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  TIN (TPIN) *
                </label>
                <input
                  type="text"
                  required
                  value={companyData.tin}
                  onChange={(e) => setCompanyData({...companyData, tin: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  placeholder="e.g., 1234567890"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Company Name *
                </label>
                <input
                  type="text"
                  required
                  value={companyData.company_name}
                  onChange={(e) => setCompanyData({...companyData, company_name: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Company Ltd"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Registration Number
                </label>
                <input
                  type="text"
                  value={companyData.registration_number}
                  onChange={(e) => setCompanyData({...companyData, registration_number: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  placeholder="REG123456"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Industry
                </label>
                <input
                  type="text"
                  value={companyData.industry}
                  onChange={(e) => setCompanyData({...companyData, industry: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  placeholder="e.g., Mining, Retail"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Registration Date
                </label>
                <input
                  type="date"
                  value={companyData.registration_date}
                  onChange={(e) => setCompanyData({...companyData, registration_date: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Address
                </label>
                <input
                  type="text"
                  value={companyData.address}
                  onChange={(e) => setCompanyData({...companyData, address: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  placeholder="123 Main St, Lusaka"
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {loading ? 'Analyzing...' : 'Detect Ghost Company'}
            </button>
          </form>
        )}

        {/* Employee Detection Form */}
        {activeTab === 'employee' && (
          <form onSubmit={handleEmployeeDetection} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  NRC Number *
                </label>
                <input
                  type="text"
                  required
                  value={employeeData.nrc}
                  onChange={(e) => setEmployeeData({...employeeData, nrc: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  placeholder="123456/78/9"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={employeeData.full_name}
                  onChange={(e) => setEmployeeData({...employeeData, full_name: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  placeholder="John Mwale"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Employer TIN *
                </label>
                <input
                  type="text"
                  required
                  value={employeeData.employer_tin}
                  onChange={(e) => setEmployeeData({...employeeData, employer_tin: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  placeholder="1234567890"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  NAPSA Number
                </label>
                <input
                  type="text"
                  value={employeeData.napsa_number}
                  onChange={(e) => setEmployeeData({...employeeData, napsa_number: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  placeholder="NAPSA123456"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Employment Date
                </label>
                <input
                  type="date"
                  value={employeeData.employment_date}
                  onChange={(e) => setEmployeeData({...employeeData, employment_date: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {loading ? 'Analyzing...' : 'Detect Phantom Employee'}
            </button>
          </form>
        )}

        {/* Error Display */}
        {error && (
          <div className="mt-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-800 font-medium">Error</p>
            <p className="text-red-600">{error}</p>
          </div>
        )}

        {/* Results Display */}
        {result && (
          <div className="mt-6 bg-gray-50 border border-gray-200 rounded-lg p-6">
            <h3 className="text-lg font-bold text-gray-800 mb-4">Detection Results</h3>

            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <p className="text-sm text-gray-600">Classification</p>
                <p className={`text-2xl font-bold ${result.classification === 'GHOST_COMPANY' || result.classification === 'PHANTOM_EMPLOYEE' ? 'text-red-600' : 'text-green-600'}`}>
                  {result.classification}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Risk Score</p>
                <p className={`text-2xl font-bold px-3 py-1 rounded inline-block ${getRiskColor(result.risk_score)}`}>
                  {result.risk_score}/100
                </p>
              </div>
            </div>

            {result.evidence && result.evidence.length > 0 && (
              <div className="mb-4">
                <p className="font-medium text-gray-700 mb-2">Evidence:</p>
                <ul className="list-disc list-inside space-y-1">
                  {result.evidence.map((item, idx) => (
                    <li key={idx} className="text-sm text-gray-600">{item}</li>
                  ))}
                </ul>
              </div>
            )}

            {result.flags && result.flags.length > 0 && (
              <div className="mb-4">
                <p className="font-medium text-gray-700 mb-2">Red Flags:</p>
                <div className="flex flex-wrap gap-2">
                  {result.flags.map((flag, idx) => (
                    <span key={idx} className="px-3 py-1 bg-red-100 text-red-700 text-sm rounded-full">
                      {flag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {result.recommendation && (
              <div className="bg-blue-50 border border-blue-200 rounded p-3">
                <p className="text-sm font-medium text-blue-800">Recommendation:</p>
                <p className="text-sm text-blue-700">{result.recommendation}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default GhostBusterDetection;
