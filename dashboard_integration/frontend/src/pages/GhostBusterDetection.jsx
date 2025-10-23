import React, { useState } from 'react';
import axios from 'axios';

const API_BASE = 'http://localhost:5001/api';

const GhostBusterDetection = () => {
  const [activeTab, setActiveTab] = useState('individual'); // 'individual', 'batch', 'results', 'statistics'

  // Individual Analysis State
  const [nrc, setNrc] = useState('');
  const [fullName, setFullName] = useState('');
  const [salary, setSalary] = useState('');
  const [employmentStart, setEmploymentStart] = useState('');
  const [analyzing, setAnalyzing] = useState(false);

  // Batch Analysis State
  const [batchFile, setBatchFile] = useState(null);
  const [batchAnalyzing, setBatchAnalyzing] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Results State
  const [results, setResults] = useState(null);
  const [sampleData, setSampleData] = useState(null);

  // Statistics State
  const [stats, setStats] = useState(null);
  const [statsLoading, setStatsLoading] = useState(false);

  // Individual Analysis
  const handleIndividualAnalysis = async () => {
    if (!nrc.trim()) {
      alert('NRC is required');
      return;
    }

    setAnalyzing(true);

    try {
      const payload = {
        nrc: nrc.trim(),
      };

      if (fullName.trim()) payload.full_name = fullName.trim();
      if (salary) payload.salary = parseFloat(salary);
      if (employmentStart) payload.employment_start = employmentStart;

      const response = await axios.post(`${API_BASE}/analyze/individual`, payload);

      if (response.data.error) {
        alert(response.data.error);
      } else {
        setResults(response.data);
        setActiveTab('results');

        // Save detection result to database
        try {
          await axios.post('http://localhost:4001/api/ghostbuster/save', {
            nrc: response.data.employee.nrc,
            fullName: response.data.employee.full_name,
            salary: response.data.employee.salary,
            isGhost: response.data.is_ghost,
            ghostProbability: response.data.ghost_probability,
            flags: response.data.flags,
            analysisType: 'individual'
          });
        } catch (saveError) {
          console.error('Failed to save detection result:', saveError);
          // Don't alert user - this is a background operation
        }
      }
    } catch (error) {
      alert(error.response?.data?.error || 'Failed to analyze employee');
    } finally {
      setAnalyzing(false);
    }
  };

  // Batch Analysis
  const handleBatchAnalysis = async () => {
    if (!batchFile) {
      alert('Please upload a file first');
      return;
    }

    setBatchAnalyzing(true);
    setUploadProgress(0);

    try {
      const formData = new FormData();
      formData.append('file', batchFile);

      const response = await axios.post(`${API_BASE}/analyze/batch`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          );
          setUploadProgress(percentCompleted);
        },
      });

      if (response.data.error) {
        alert(response.data.error);
      } else {
        setResults(response.data);
        setActiveTab('results');
        alert(`Analyzed ${response.data.summary.total_analyzed} employees successfully`);

        // Save all batch detection results to database
        if (response.data.results && response.data.results.length > 0) {
          try {
            const savePromises = response.data.results.map(employee =>
              axios.post('http://localhost:4001/api/ghostbuster/save', {
                nrc: employee.nrc,
                fullName: employee.full_name,
                salary: employee.salary,
                isGhost: employee.is_ghost,
                ghostProbability: employee.ghost_probability,
                flags: employee.flags || [],
                analysisType: 'batch'
              }).catch(err => console.error('Failed to save employee:', employee.nrc, err))
            );
            await Promise.all(savePromises);
          } catch (saveError) {
            console.error('Failed to save batch results:', saveError);
            // Don't alert user - this is a background operation
          }
        }
      }
    } catch (error) {
      alert(error.response?.data?.error || 'Failed to analyze batch');
    } finally {
      setBatchAnalyzing(false);
      setUploadProgress(0);
    }
  };

  // Load Sample Data
  const loadSampleData = async () => {
    try {
      const response = await axios.get(`${API_BASE}/sample`);
      setSampleData(response.data);
    } catch (error) {
      alert('Failed to load sample data');
    }
  };

  const fillSample = (sample) => {
    setNrc(sample.nrc);
    setFullName(sample.full_name);
    setSalary(sample.salary.toString());
  };

  // Download Template
  const downloadTemplate = () => {
    const csvContent = 'nrc,full_name,salary,employment_start\n123456/78/9,John Banda,10000,2018-01-15\n987654/32/1,Mary Phiri,12000,2019-03-20';
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'ghostbuster_template.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  // File Drop Handler
  const handleFileDrop = (e) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile && (droppedFile.name.endsWith('.csv') || droppedFile.name.endsWith('.xlsx') || droppedFile.name.endsWith('.xls'))) {
      setBatchFile(droppedFile);
    } else {
      alert('Please upload a CSV or Excel file');
    }
  };

  const handleFileSelect = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setBatchFile(selectedFile);
    }
  };

  // Load Statistics
  const loadStatistics = async () => {
    setStatsLoading(true);
    try {
      const response = await axios.get(`${API_BASE}/stats`);
      setStats(response.data);
    } catch (error) {
      alert('Failed to load statistics');
    } finally {
      setStatsLoading(false);
    }
  };

  // Load statistics when Statistics tab is clicked
  const handleTabClick = (tab) => {
    setActiveTab(tab);
    if (tab === 'statistics' && !stats) {
      loadStatistics();
    }
  };

  return (
    <div className="max-w-7xl mx-auto">
      <div className="bg-white rounded-lg shadow-lg p-6">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center space-x-3 mb-2">
            <span className="text-4xl">👻</span>
            <h2 className="text-2xl font-bold text-gray-800">GhostBuster Detection</h2>
          </div>
          <p className="text-gray-600">
            AI-powered system to detect ghost employees and phantom workers
          </p>
        </div>

        {/* Tabs */}
        <div className="flex space-x-2 mb-6 border-b border-gray-200">
          <button
            onClick={() => handleTabClick('individual')}
            className={`px-6 py-3 font-medium transition-colors ${
              activeTab === 'individual'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            🔍 Individual Analysis
          </button>
          <button
            onClick={() => handleTabClick('batch')}
            className={`px-6 py-3 font-medium transition-colors ${
              activeTab === 'batch'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            📁 Batch Analysis
          </button>
          <button
            onClick={() => handleTabClick('results')}
            className={`px-6 py-3 font-medium transition-colors ${
              activeTab === 'results'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            📊 Results
          </button>
          <button
            onClick={() => handleTabClick('statistics')}
            className={`px-6 py-3 font-medium transition-colors ${
              activeTab === 'statistics'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            📈 Statistics
          </button>
        </div>

        {/* Individual Analysis Tab */}
        {activeTab === 'individual' && (
          <div className="space-y-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-800">
                Enter employee details to analyze for ghost worker indicators. NRC is required; other fields are optional and will be looked up from the database.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  NRC Number *
                </label>
                <input
                  type="text"
                  placeholder="123456/78/9"
                  value={nrc}
                  onChange={(e) => setNrc(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <p className="text-xs text-gray-500 mt-1">Zambian National Registration Card number</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Full Name (Optional)
                </label>
                <input
                  type="text"
                  placeholder="John Banda"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Monthly Salary (Optional)
                </label>
                <input
                  type="number"
                  placeholder="10000"
                  value={salary}
                  onChange={(e) => setSalary(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <p className="text-xs text-gray-500 mt-1">Salary in ZMW (Zambian Kwacha)</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Employment Start Date (Optional)
                </label>
                <input
                  type="date"
                  value={employmentStart}
                  onChange={(e) => setEmploymentStart(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-3">
              <button
                onClick={loadSampleData}
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
              >
                Load Samples
              </button>
              <button
                onClick={handleIndividualAnalysis}
                disabled={analyzing}
                className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 flex items-center space-x-2"
              >
                {analyzing && (
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                )}
                <span>{analyzing ? 'Analyzing...' : 'Analyze Employee'}</span>
              </button>
            </div>

            {/* Sample Data */}
            {sampleData && (
              <div className="mt-6 bg-gray-50 rounded-lg p-4">
                <h3 className="font-semibold text-gray-800 mb-3">Sample Test Data</h3>
                <p className="text-sm text-gray-600 mb-3">Click on any sample to auto-fill the form</p>

                {Object.entries(sampleData).map(([type, samples]) => (
                  <div key={type} className="mb-4">
                    <h4 className="text-sm font-medium text-blue-600 mb-2 capitalize">
                      {type.replace('_', ' ')}
                    </h4>
                    <div className="grid grid-cols-3 gap-3">
                      {samples.map((sample, idx) => (
                        <div
                          key={idx}
                          onClick={() => fillSample(sample)}
                          className="p-3 bg-white border border-gray-200 rounded-lg cursor-pointer hover:shadow-md hover:border-blue-300 transition-all"
                        >
                          <p className="font-semibold text-gray-800">{sample.full_name}</p>
                          <p className="text-xs text-gray-600">NRC: {sample.nrc}</p>
                          <p className="text-xs text-gray-600">Salary: K{sample.salary.toLocaleString()}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Batch Analysis Tab */}
        {activeTab === 'batch' && (
          <div className="space-y-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-800">
                Upload a CSV or Excel file containing employee NRC numbers for bulk analysis. The file must contain an "nrc" column. Other columns (full_name, salary, employment_start) are optional.
              </p>
            </div>

            {/* File Upload Dropzone */}
            <div
              onDrop={handleFileDrop}
              onDragOver={(e) => e.preventDefault()}
              className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center hover:border-blue-500 transition-colors cursor-pointer"
            >
              <input
                type="file"
                accept=".csv,.xlsx,.xls"
                onChange={handleFileSelect}
                className="hidden"
                id="batch-file-input"
              />
              <label htmlFor="batch-file-input" className="cursor-pointer">
                <div className="text-6xl mb-4">📤</div>
                <h3 className="text-lg font-semibold text-gray-800 mb-2">
                  Drag & drop a file here, or click to browse
                </h3>
                <p className="text-sm text-gray-600">
                  Supported formats: CSV, XLS, XLSX (Max 1000 records)
                </p>
              </label>
            </div>

            {/* Selected File */}
            {batchFile && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-gray-800">{batchFile.name}</p>
                    <p className="text-sm text-gray-600">
                      Size: {(batchFile.size / 1024).toFixed(2)} KB | Type: {batchFile.type}
                    </p>
                  </div>
                  <button
                    onClick={() => setBatchFile(null)}
                    className="text-red-600 hover:text-red-800 font-semibold"
                  >
                    Remove
                  </button>
                </div>
              </div>
            )}

            {/* Progress Bar */}
            {batchAnalyzing && (
              <div className="space-y-2">
                <p className="text-sm text-gray-600">Analyzing employees... {uploadProgress}%</p>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div
                    className="bg-blue-600 h-3 rounded-full transition-all"
                    style={{ width: `${uploadProgress}%` }}
                  ></div>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex justify-between">
              <button
                onClick={downloadTemplate}
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
              >
                Download Template
              </button>
              <button
                onClick={handleBatchAnalysis}
                disabled={!batchFile || batchAnalyzing}
                className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 flex items-center space-x-2"
              >
                {batchAnalyzing && (
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                )}
                <span>{batchAnalyzing ? 'Analyzing...' : 'Analyze Batch'}</span>
              </button>
            </div>

            {/* File Format Instructions */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-semibold text-gray-800 mb-3">CSV/Excel File Format</h3>
              <p className="text-sm text-gray-600 mb-3">Your file should have the following columns:</p>
              <ul className="space-y-2 text-sm text-gray-700">
                <li className="flex items-start">
                  <span className="font-medium mr-2">• nrc (required):</span>
                  <span className="text-gray-600">National Registration Card number (e.g., 123456/78/9)</span>
                </li>
                <li className="flex items-start">
                  <span className="font-medium mr-2">• full_name (optional):</span>
                  <span className="text-gray-600">Employee full name</span>
                </li>
                <li className="flex items-start">
                  <span className="font-medium mr-2">• salary (optional):</span>
                  <span className="text-gray-600">Monthly salary in ZMW</span>
                </li>
                <li className="flex items-start">
                  <span className="font-medium mr-2">• employment_start (optional):</span>
                  <span className="text-gray-600">Employment start date (YYYY-MM-DD format)</span>
                </li>
              </ul>
            </div>
          </div>
        )}

        {/* Results Tab */}
        {activeTab === 'results' && (
          <div>
            {!results ? (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">📊</div>
                <h3 className="text-xl font-semibold text-gray-800 mb-2">No Results Yet</h3>
                <p className="text-gray-600">
                  Run an individual or batch analysis to see results here
                </p>
              </div>
            ) : results.analysis_type === 'individual' ? (
              // Individual Results
              <div className="space-y-6">
                <div className={`${
                  results.is_ghost ? 'bg-red-50 border-red-500' : 'bg-green-50 border-green-500'
                } border-4 rounded-lg p-6 text-center`}>
                  <div className="text-6xl mb-3">
                    {results.is_ghost ? '⚠️' : '✅'}
                  </div>
                  <h2 className={`text-3xl font-bold mb-2 ${
                    results.is_ghost ? 'text-red-700' : 'text-green-700'
                  }`}>
                    {results.is_ghost ? 'GHOST EMPLOYEE DETECTED' : 'LEGITIMATE EMPLOYEE'}
                  </h2>
                  <p className="text-lg font-semibold">
                    Risk Score: <span className={results.is_ghost ? 'text-red-600' : 'text-green-600'}>
                      {(results.ghost_probability * 100).toFixed(1)}%
                    </span>
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h3 className="font-semibold text-gray-800 mb-3">Employee Information</h3>
                    <div className="space-y-2 text-sm">
                      <div><span className="font-medium">NRC:</span> {results.employee.nrc}</div>
                      <div><span className="font-medium">Name:</span> {results.employee.full_name}</div>
                      <div><span className="font-medium">Salary:</span> K{results.employee.salary?.toLocaleString()}</div>
                      {results.employee.employment_start && (
                        <div><span className="font-medium">Employment Start:</span> {results.employee.employment_start}</div>
                      )}
                    </div>
                  </div>

                  <div className="bg-gray-50 rounded-lg p-4">
                    <h3 className="font-semibold text-gray-800 mb-3">Risk Indicators</h3>
                    <div className="space-y-2">
                      {results.flags && results.flags.length > 0 ? (
                        results.flags.map((flag, idx) => (
                          <div key={idx} className={`p-2 rounded text-sm ${
                            flag.includes('missing') || flag.includes('suspicious') || flag.includes('NAPSA')
                              ? 'bg-red-100 text-red-800'
                              : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {flag}
                          </div>
                        ))
                      ) : (
                        <p className="text-sm text-gray-600">No risk indicators found</p>
                      )}
                    </div>
                  </div>
                </div>

                <div className={`${
                  results.is_ghost ? 'bg-red-50 border-red-200' : 'bg-green-50 border-green-200'
                } border rounded-lg p-4`}>
                  <h3 className="font-semibold text-gray-800 mb-2">Recommendation</h3>
                  <p className={`text-sm ${results.is_ghost ? 'text-red-800' : 'text-green-800'}`}>
                    {results.is_ghost
                      ? 'This employee exhibits characteristics of a ghost worker. Immediate investigation recommended.'
                      : 'This employee appears legitimate. No immediate action required.'}
                  </p>
                </div>
              </div>
            ) : (
              // Batch Results
              <div className="space-y-6">
                <div className="grid grid-cols-4 gap-4">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
                    <p className="text-2xl font-bold text-blue-600">{results.summary.total_analyzed}</p>
                    <p className="text-sm text-gray-600">Total Analyzed</p>
                  </div>
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
                    <p className="text-2xl font-bold text-red-600">{results.summary.ghost_employees}</p>
                    <p className="text-sm text-gray-600">Ghost Employees</p>
                  </div>
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
                    <p className="text-2xl font-bold text-green-600">{results.summary.legitimate_employees}</p>
                    <p className="text-sm text-gray-600">Legitimate</p>
                  </div>
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-center">
                    <p className="text-2xl font-bold text-yellow-600">
                      {((results.summary.ghost_employees / results.summary.total_analyzed) * 100).toFixed(1)}%
                    </p>
                    <p className="text-sm text-gray-600">Ghost Rate</p>
                  </div>
                </div>

                <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                  <div className="overflow-x-auto max-h-96">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-100 sticky top-0">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">NRC</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Name</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Salary</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Status</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Risk Score</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {results.results && results.results.map((employee, idx) => (
                          <tr key={idx} className="hover:bg-gray-50">
                            <td className="px-4 py-3 text-sm text-gray-800">{employee.nrc}</td>
                            <td className="px-4 py-3 text-sm text-gray-800">{employee.full_name}</td>
                            <td className="px-4 py-3 text-sm text-gray-800">K{employee.salary?.toLocaleString()}</td>
                            <td className="px-4 py-3 text-sm">
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                employee.is_ghost
                                  ? 'bg-red-100 text-red-700'
                                  : 'bg-green-100 text-green-700'
                              }`}>
                                {employee.is_ghost ? 'GHOST' : 'LEGITIMATE'}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-sm">
                              <span className={`font-bold ${
                                employee.is_ghost ? 'text-red-600' : 'text-green-600'
                              }`}>
                                {(employee.ghost_probability * 100).toFixed(1)}%
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Statistics Tab */}
        {activeTab === 'statistics' && (
          <div>
            {statsLoading ? (
              <div className="text-center py-12">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
                <p className="text-gray-600">Loading statistics...</p>
              </div>
            ) : !stats ? (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">📊</div>
                <h3 className="text-xl font-semibold text-gray-800 mb-2">Unable to load statistics</h3>
                <p className="text-gray-600">Please try again later</p>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Overview Cards */}
                <div className="grid grid-cols-4 gap-4">
                  <div className="bg-gradient-to-br from-purple-500 to-purple-700 text-white rounded-lg p-6 shadow-lg">
                    <div className="text-4xl mb-2">👥</div>
                    <div className="text-3xl font-bold">{stats.total_employees?.toLocaleString()}</div>
                    <div className="text-sm opacity-90">Total Employees</div>
                  </div>

                  <div className="bg-gradient-to-br from-pink-500 to-red-600 text-white rounded-lg p-6 shadow-lg">
                    <div className="text-4xl mb-2">🏦</div>
                    <div className="text-3xl font-bold">{stats.total_napsa_records?.toLocaleString()}</div>
                    <div className="text-sm opacity-90">NAPSA Records</div>
                  </div>

                  <div className="bg-gradient-to-br from-cyan-500 to-blue-600 text-white rounded-lg p-6 shadow-lg">
                    <div className="text-4xl mb-2">🆔</div>
                    <div className="text-3xl font-bold">{stats.total_nrc_records?.toLocaleString()}</div>
                    <div className="text-sm opacity-90">NRC Registry Records</div>
                  </div>

                  <div className="bg-gradient-to-br from-green-500 to-teal-600 text-white rounded-lg p-6 shadow-lg">
                    <div className="text-4xl mb-2">💳</div>
                    <div className="text-3xl font-bold">{stats.total_bank_transactions?.toLocaleString()}</div>
                    <div className="text-sm opacity-90">Bank Transactions</div>
                  </div>
                </div>

                {/* About Section */}
                <div className="bg-white border border-gray-200 rounded-lg p-6">
                  <h3 className="text-xl font-semibold text-gray-800 mb-4">About GhostBuster</h3>
                  <p className="text-gray-600 mb-4">
                    GhostBuster is an advanced ghost employee detection system designed for the Zambia Revenue Authority (ZRA).
                    It uses multi-source data analysis to identify fraudulent employees in the Zambian government payroll.
                  </p>

                  <h4 className="font-semibold text-gray-800 mb-3">Detection Methods:</h4>
                  <ul className="space-y-2 text-gray-700">
                    <li className="flex items-start">
                      <span className="text-blue-600 mr-2">✓</span>
                      <span>Cross-reference with NAPSA contributions database</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-blue-600 mr-2">✓</span>
                      <span>Verify against Home Affairs death registry</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-blue-600 mr-2">✓</span>
                      <span>Analyze bank withdrawal patterns across 10+ Zambian banks</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-blue-600 mr-2">✓</span>
                      <span>Detect duplicate NRC usage and identity theft</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-blue-600 mr-2">✓</span>
                      <span>Flag employees over retirement age (65+)</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-blue-600 mr-2">✓</span>
                      <span>Identify shell company transfers and suspicious withdrawal patterns</span>
                    </li>
                  </ul>
                </div>

                {/* System Info */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="font-semibold text-blue-800 mb-2">💡 System Information</h4>
                  <p className="text-sm text-blue-700">
                    GhostBuster uses machine learning algorithms and cross-database verification to detect fraudulent employees.
                    The system processes millions of records daily to ensure payroll integrity for the Zambian government.
                  </p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default GhostBusterDetection;
