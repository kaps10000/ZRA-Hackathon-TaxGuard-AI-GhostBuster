import React, { useState, useEffect } from 'react';

const PastCases = () => {
  const [activeTab, setActiveTab] = useState('detections');
  const [filter, setFilter] = useState('all');
  const [selectedCase, setSelectedCase] = useState(null);
  const [showModal, setShowModal] = useState(false);

  const viewDetails = (caseData) => {
    setSelectedCase(caseData);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedCase(null);
  };

  // Mock data for past detections
  const mockDetections = [
    {
      id: 'DET-001',
      date: '2025-10-15',
      type: 'Ghost Company',
      entity: 'ABC Phantom Ltd',
      tin: '9876543210',
      riskScore: 92,
      status: 'Under Investigation',
      investigator: 'John Doe',
      details: {
        address: 'No physical location found',
        registrationDate: '2024-01-15',
        employees: 0,
        taxFilings: 'None in past 12 months',
        redFlags: ['No PACRA registration', 'No employees', 'Suspicious address', 'No tax filings'],
        notes: 'Company appears to be a shell entity with no operational activities. Recommend immediate audit.'
      }
    },
    {
      id: 'DET-002',
      date: '2025-10-14',
      type: 'Phantom Employee',
      entity: 'Jane Smith',
      nrc: '123456/78/9',
      riskScore: 78,
      status: 'Resolved',
      investigator: 'Mary Johnson'
    },
    {
      id: 'DET-003',
      date: '2025-10-13',
      type: 'Ghost Company',
      entity: 'XYZ Shell Corp',
      tin: '1357924680',
      riskScore: 85,
      status: 'Flagged for Audit',
      investigator: 'John Doe'
    },
    {
      id: 'DET-004',
      date: '2025-10-12',
      type: 'Network Fraud',
      entity: 'Linked Entities Network',
      tin: 'Multiple',
      riskScore: 95,
      status: 'Legal Action',
      investigator: 'Sarah Williams'
    },
    {
      id: 'DET-005',
      date: '2025-10-11',
      type: 'Phantom Employee',
      entity: 'Robert Brown',
      nrc: '987654/32/1',
      riskScore: 65,
      status: 'Resolved',
      investigator: 'Mary Johnson'
    },
  ];

  const filteredCases = filter === 'all'
    ? mockDetections
    : mockDetections.filter(d => d.status === filter);

  const getRiskColor = (score) => {
    if (score >= 80) return 'bg-red-100 text-red-700';
    if (score >= 60) return 'bg-yellow-100 text-yellow-700';
    return 'bg-green-100 text-green-700';
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Under Investigation': return 'bg-blue-100 text-blue-700';
      case 'Resolved': return 'bg-green-100 text-green-700';
      case 'Flagged for Audit': return 'bg-yellow-100 text-yellow-700';
      case 'Legal Action': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className="max-w-7xl mx-auto">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-800">Past Cases & Detections</h2>
          <p className="text-gray-600 mt-1">
            View and manage historical fraud detection cases
          </p>
        </div>

        {/* Filters */}
        <div className="mb-6 flex items-center justify-between">
          <div className="flex space-x-2">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-md font-medium ${
                filter === 'all'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              All Cases
            </button>
            <button
              onClick={() => setFilter('Under Investigation')}
              className={`px-4 py-2 rounded-md font-medium ${
                filter === 'Under Investigation'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Under Investigation
            </button>
            <button
              onClick={() => setFilter('Flagged for Audit')}
              className={`px-4 py-2 rounded-md font-medium ${
                filter === 'Flagged for Audit'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Flagged
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

          <div className="text-sm text-gray-600">
            Showing <span className="font-bold">{filteredCases.length}</span> cases
          </div>
        </div>

        {/* Cases List */}
        <div className="space-y-4">
          {filteredCases.map((detection) => (
            <div key={detection.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <span className="font-bold text-gray-800">{detection.id}</span>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getRiskColor(detection.riskScore)}`}>
                      Risk: {detection.riskScore}/100
                    </span>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(detection.status)}`}>
                      {detection.status}
                    </span>
                    <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-medium">
                      {detection.type}
                    </span>
                  </div>

                  <div className="grid grid-cols-4 gap-4 mt-3">
                    <div>
                      <p className="text-xs text-gray-500">Entity Name</p>
                      <p className="text-sm font-medium text-gray-800">{detection.entity}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Identifier</p>
                      <p className="text-sm font-medium text-gray-800">{detection.tin || detection.nrc}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Detection Date</p>
                      <p className="text-sm font-medium text-gray-800">{detection.date}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Investigator</p>
                      <p className="text-sm font-medium text-gray-800">{detection.investigator}</p>
                    </div>
                  </div>
                </div>

                <div className="flex-none ml-4">
                  <button
                    onClick={() => viewDetails(detection)}
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

        {/* Statistics Summary */}
        <div className="mt-8 grid grid-cols-4 gap-4">
          <div className="bg-blue-50 p-4 rounded-lg">
            <p className="text-sm text-gray-600">Total Cases</p>
            <p className="text-2xl font-bold text-blue-600">{mockDetections.length}</p>
          </div>
          <div className="bg-yellow-50 p-4 rounded-lg">
            <p className="text-sm text-gray-600">Under Investigation</p>
            <p className="text-2xl font-bold text-yellow-600">
              {mockDetections.filter(d => d.status === 'Under Investigation').length}
            </p>
          </div>
          <div className="bg-green-50 p-4 rounded-lg">
            <p className="text-sm text-gray-600">Resolved</p>
            <p className="text-2xl font-bold text-green-600">
              {mockDetections.filter(d => d.status === 'Resolved').length}
            </p>
          </div>
          <div className="bg-red-50 p-4 rounded-lg">
            <p className="text-sm text-gray-600">High Risk (80+)</p>
            <p className="text-2xl font-bold text-red-600">
              {mockDetections.filter(d => d.riskScore >= 80).length}
            </p>
          </div>
        </div>

        {/* Details Modal */}
        {showModal && selectedCase && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-2xl font-bold text-gray-800">{selectedCase.id}</h3>
                    <p className="text-gray-600">{selectedCase.type} Detection</p>
                  </div>
                  <button
                    onClick={closeModal}
                    className="text-gray-400 hover:text-gray-600 text-2xl"
                  >
                    ✕
                  </button>
                </div>

                <div className="space-y-4">
                  {/* Status Badges */}
                  <div className="flex space-x-2">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getRiskColor(selectedCase.riskScore)}`}>
                      Risk Score: {selectedCase.riskScore}/100
                    </span>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(selectedCase.status)}`}>
                      {selectedCase.status}
                    </span>
                  </div>

                  {/* Basic Info */}
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-gray-800 mb-3">Basic Information</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-gray-600">Entity Name</p>
                        <p className="font-medium">{selectedCase.entity}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Identifier</p>
                        <p className="font-medium">{selectedCase.tin || selectedCase.nrc}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Detection Date</p>
                        <p className="font-medium">{selectedCase.date}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Assigned Investigator</p>
                        <p className="font-medium">{selectedCase.investigator}</p>
                      </div>
                    </div>
                  </div>

                  {/* Detailed Information */}
                  {selectedCase.details && (
                    <>
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <h4 className="font-semibold text-gray-800 mb-3">Additional Details</h4>
                        <div className="space-y-2">
                          {selectedCase.details.address && (
                            <div>
                              <p className="text-sm text-gray-600">Address</p>
                              <p className="font-medium">{selectedCase.details.address}</p>
                            </div>
                          )}
                          {selectedCase.details.registrationDate && (
                            <div>
                              <p className="text-sm text-gray-600">Registration Date</p>
                              <p className="font-medium">{selectedCase.details.registrationDate}</p>
                            </div>
                          )}
                          {selectedCase.details.employees !== undefined && (
                            <div>
                              <p className="text-sm text-gray-600">Employees</p>
                              <p className="font-medium">{selectedCase.details.employees}</p>
                            </div>
                          )}
                          {selectedCase.details.taxFilings && (
                            <div>
                              <p className="text-sm text-gray-600">Tax Filings</p>
                              <p className="font-medium">{selectedCase.details.taxFilings}</p>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Red Flags */}
                      {selectedCase.details.redFlags && selectedCase.details.redFlags.length > 0 && (
                        <div className="bg-red-50 border border-red-200 p-4 rounded-lg">
                          <h4 className="font-semibold text-red-800 mb-2">⚠️ Red Flags</h4>
                          <ul className="list-disc list-inside space-y-1">
                            {selectedCase.details.redFlags.map((flag, idx) => (
                              <li key={idx} className="text-sm text-red-700">{flag}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Investigation Notes */}
                      {selectedCase.details.notes && (
                        <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
                          <h4 className="font-semibold text-blue-800 mb-2">Investigation Notes</h4>
                          <p className="text-sm text-blue-700">{selectedCase.details.notes}</p>
                        </div>
                      )}
                    </>
                  )}

                  {/* Action Buttons */}
                  <div className="flex space-x-3 pt-4">
                    <button className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700">
                      Update Status
                    </button>
                    <button className="flex-1 bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700">
                      Generate Report
                    </button>
                    <button
                      onClick={closeModal}
                      className="flex-1 bg-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-400"
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
    </div>
  );
};

export default PastCases;
