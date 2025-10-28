import React, { useState, useEffect } from 'react';
import { whistleproAPI, connectWhistleProWebSocket, disconnectWhistleProWebSocket } from '../services/api';

const WhistlePro = () => {
  const [selectedCase, setSelectedCase] = useState(null);
  const [showDetails, setShowDetails] = useState(false);
  const [filter, setFilter] = useState('all');
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [realtimeConnected, setRealtimeConnected] = useState(false);

  // Fetch cases from WhistlePro backend (port 3005)
  useEffect(() => {
    const fetchCases = async () => {
      try {
        setLoading(true);
        const response = await whistleproAPI.getCases();
        setCases(response.data.reports || []);
        setError(null);
      } catch (err) {
        console.error('Failed to fetch reports:', err);
        setError('Unable to load reports from WhistlePro backend');
        // Fall back to mock data
        setCases(mockCases);
      } finally {
        setLoading(false);
      }
    };

    fetchCases();

    // Connect to real-time WebSocket
    const socket = connectWhistleProWebSocket();

    socket.on('connect', () => {
      console.log('✅ Real-time connection established');
      setRealtimeConnected(true);
    });

    socket.on('disconnect', () => {
      console.log('❌ Real-time connection lost');
      setRealtimeConnected(false);
    });

    socket.on('connected', (data) => {
      console.log('📡 WhistlePro real-time service ready:', data);
    });

    // Listen for new reports
    socket.on('newReport', (data) => {
      console.log('📢 New report received:', data.report);
      fetchCases(); // Refresh the list
    });

    // Listen for status changes
    socket.on('statusChanged', (data) => {
      console.log('🔄 Status changed:', data);
      // Update the specific case in state
      setCases(prevCases =>
        prevCases.map(c =>
          c.caseId === data.caseId
            ? { ...c, status: data.newStatus }
            : c
        )
      );
    });

    // Cleanup on unmount
    return () => {
      disconnectWhistleProWebSocket();
    };
  }, []);

  const mockCases = [
    {
      id: 'WP-001',
      title: 'Suspected Tax Evasion at ABC Mining',
      company: 'ABC Mining Ltd',
      reportedDate: '2025-10-15',
      priority: 'High',
      status: 'Under Investigation',
      category: 'Tax Evasion',
      reporter: 'Anonymous',
      description: 'Company suspected of underreporting revenue from copper exports. Multiple invoices appear to be falsified.',
      evidence: ['Document scans', 'Financial records', 'Witness testimony'],
      assignedTo: 'John Doe'
    },
    {
      id: 'WP-002',
      title: 'Phantom Employees at XYZ Traders',
      company: 'XYZ Traders',
      reportedDate: '2025-10-14',
      priority: 'Critical',
      status: 'Open',
      category: 'Payroll Fraud',
      reporter: 'Anonymous',
      description: 'Several employees on payroll do not exist. NAPSA numbers appear to be fabricated.',
      evidence: ['Payroll documents', 'Employee records'],
      assignedTo: 'Mary Johnson'
    },
    {
      id: 'WP-003',
      title: 'VAT Fraud Investigation',
      company: 'Shell Company Ltd',
      reportedDate: '2025-10-10',
      priority: 'Medium',
      status: 'In Progress',
      category: 'VAT Fraud',
      reporter: 'Former Employee',
      description: 'Company claiming VAT refunds for non-existent transactions.',
      evidence: ['VAT returns', 'Invoice copies'],
      assignedTo: 'Sarah Williams'
    },
    {
      id: 'WP-004',
      title: 'Bribery Allegation',
      company: 'Legitimate Business Inc',
      reportedDate: '2025-09-28',
      priority: 'Low',
      status: 'Resolved',
      category: 'Corruption',
      reporter: 'Anonymous',
      description: 'Allegations of bribing tax officials. Investigation concluded - no evidence found.',
      evidence: ['Email communications'],
      assignedTo: 'John Doe'
    },
  ];

  const filteredCases = filter === 'all'
    ? cases
    : cases.filter(c => c.status === filter);

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'Critical': return 'bg-red-100 text-red-700';
      case 'High': return 'bg-orange-100 text-orange-700';
      case 'Medium': return 'bg-yellow-100 text-yellow-700';
      case 'Low': return 'bg-green-100 text-green-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Open': return 'bg-blue-100 text-blue-700';
      case 'Under Investigation': return 'bg-yellow-100 text-yellow-700';
      case 'In Progress': return 'bg-purple-100 text-purple-700';
      case 'Resolved': return 'bg-green-100 text-green-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const viewDetails = (caseData) => {
    setSelectedCase(caseData);
    setShowDetails(true);
  };

  return (
    <div className="max-w-7xl mx-auto">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="mb-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold text-gray-800">WhistlePro Case Management</h2>
              <p className="text-gray-600 mt-1">
                Manage whistleblower reports and fraud investigations
              </p>
            </div>
            <div className="flex items-center space-x-2">
              {loading && <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>}
              <div className="flex items-center space-x-1">
                <div className={`h-2 w-2 rounded-full ${realtimeConnected ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                <span className="text-xs text-gray-500">
                  {realtimeConnected ? 'Live Updates Active' : 'Connecting...'}
                </span>
              </div>
            </div>
          </div>
          {error && (
            <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded p-3">
              <p className="text-sm text-yellow-800">{error} - Showing cached data</p>
            </div>
          )}
        </div>

        {/* Filters */}
        <div className="mb-6">
          <div className="flex space-x-2">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-md font-medium ${
                filter === 'all'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              All Cases ({cases.length})
            </button>
            <button
              onClick={() => setFilter('Open')}
              className={`px-4 py-2 rounded-md font-medium ${
                filter === 'Open'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Open
            </button>
            <button
              onClick={() => setFilter('Under Investigation')}
              className={`px-4 py-2 rounded-md font-medium ${
                filter === 'Under Investigation'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Investigating
            </button>
            <button
              onClick={() => setFilter('Resolved')}
              className={`px-4 py-2 rounded-md font-medium ${
                filter === 'Resolved'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Resolved
            </button>
          </div>
        </div>

        {/* Cases List */}
        <div className="space-y-4">
          {filteredCases.map((caseItem) => (
            <div key={caseItem.caseId || caseItem.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <span className="font-bold text-gray-800">{caseItem.caseId || caseItem.id}</span>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getPriorityColor(caseItem.priority)}`}>
                      {caseItem.priority} Priority
                    </span>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(caseItem.status)}`}>
                      {caseItem.status}
                    </span>
                    <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-medium">
                      {caseItem.category}
                    </span>
                  </div>

                  <h3 className="text-lg font-semibold text-gray-800 mb-2">{caseItem.title}</h3>

                  <div className="grid grid-cols-4 gap-4 mt-3">
                    <div>
                      <p className="text-xs text-gray-500">Company</p>
                      <p className="text-sm font-medium text-gray-800">{caseItem.company}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Reported Date</p>
                      <p className="text-sm font-medium text-gray-800">{caseItem.reportedDate}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Assigned To</p>
                      <p className="text-sm font-medium text-gray-800">{caseItem.assignedTo}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Reporter</p>
                      <p className="text-sm font-medium text-gray-800">{caseItem.reporter}</p>
                    </div>
                  </div>
                </div>

                <div className="flex-none ml-4">
                  <button
                    onClick={() => viewDetails(caseItem)}
                    className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 text-sm"
                  >
                    View Details
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredCases.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">No cases found matching your filter</p>
          </div>
        )}

        {/* Statistics */}
        <div className="mt-8 grid grid-cols-4 gap-4">
          <div className="bg-blue-50 p-4 rounded-lg">
            <p className="text-sm text-gray-600">Total Reports</p>
            <p className="text-2xl font-bold text-blue-600">{cases.length}</p>
          </div>
          <div className="bg-yellow-50 p-4 rounded-lg">
            <p className="text-sm text-gray-600">Active Cases</p>
            <p className="text-2xl font-bold text-yellow-600">
              {cases.filter(c => c.status !== 'Resolved').length}
            </p>
          </div>
          <div className="bg-red-50 p-4 rounded-lg">
            <p className="text-sm text-gray-600">High/Critical Priority</p>
            <p className="text-2xl font-bold text-red-600">
              {cases.filter(c => c.priority === 'High' || c.priority === 'Critical').length}
            </p>
          </div>
          <div className="bg-green-50 p-4 rounded-lg">
            <p className="text-sm text-gray-600">Resolved</p>
            <p className="text-2xl font-bold text-green-600">
              {cases.filter(c => c.status === 'Resolved').length}
            </p>
          </div>
        </div>
      </div>

      {/* Details Modal */}
      {showDetails && selectedCase && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-2xl font-bold text-gray-800">{selectedCase.caseId || selectedCase.id}</h3>
                  <p className="text-gray-600">{selectedCase.title}</p>
                </div>
                <button
                  onClick={() => setShowDetails(false)}
                  className="text-gray-400 hover:text-gray-600 text-2xl"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-4">
                {/* Status Badges */}
                <div className="flex space-x-2">
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${getPriorityColor(selectedCase.priority)}`}>
                    {selectedCase.priority} Priority
                  </span>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(selectedCase.status)}`}>
                    {selectedCase.status}
                  </span>
                </div>

                {/* Case Information */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-gray-800 mb-3">Case Information</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">Company</p>
                      <p className="font-medium">{selectedCase.company}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Category</p>
                      <p className="font-medium">{selectedCase.category}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Reported Date</p>
                      <p className="font-medium">{selectedCase.reportedDate}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Assigned To</p>
                      <p className="font-medium">{selectedCase.assignedTo}</p>
                    </div>
                  </div>
                </div>

                {/* Description */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-gray-800 mb-2">Description</h4>
                  <p className="text-gray-700">{selectedCase.description}</p>
                </div>

                {/* Evidence */}
                {selectedCase.evidence && selectedCase.evidence.length > 0 && (
                  <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
                    <h4 className="font-semibold text-blue-800 mb-2">Evidence Provided</h4>
                    <ul className="list-disc list-inside space-y-1">
                      {selectedCase.evidence.map((item, idx) => (
                        <li key={idx} className="text-sm text-blue-700">{item}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Evidence Files (from file upload) */}
                {selectedCase.evidenceFiles && selectedCase.evidenceFiles.length > 0 && (
                  <div className="bg-green-50 border border-green-200 p-4 rounded-lg">
                    <h4 className="font-semibold text-green-800 mb-2">Uploaded Evidence Files ({selectedCase.evidenceFiles.length})</h4>
                    <div className="space-y-2">
                      {selectedCase.evidenceFiles.map((file, idx) => (
                        <div key={idx} className="flex items-center justify-between bg-white p-2 rounded border border-green-200">
                          <div className="flex items-center space-x-2">
                            <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            <div>
                              <p className="text-sm font-medium text-gray-800">{file.originalName}</p>
                              <p className="text-xs text-gray-500">{(file.size / 1024).toFixed(2)} KB - {file.mimetype}</p>
                            </div>
                          </div>
                          <a
                            href={`http://localhost:3005${file.url}`}
                            target="_blank"
                            rel="noreferrer"
                            className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                          >
                            View
                          </a>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="flex justify-end pt-4">
                  <button
                    onClick={() => setShowDetails(false)}
                    className="bg-gray-300 text-gray-700 px-6 py-2 rounded-md hover:bg-gray-400"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WhistlePro;
