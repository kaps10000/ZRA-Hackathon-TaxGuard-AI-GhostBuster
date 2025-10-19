import React, { useState, useEffect } from 'react';
import axios from 'axios';

const DatabaseViewer = () => {
  const [activeTable, setActiveTable] = useState('companies');
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Mock database tables with sample data
  const mockData = {
    companies: [
      { id: 1, tin: '1234567890', name: 'ABC Mining Ltd', status: 'Active', employees: 150, registrationDate: '2020-01-15' },
      { id: 2, tin: '0987654321', name: 'XYZ Traders', status: 'Active', employees: 45, registrationDate: '2019-06-20' },
      { id: 3, tin: '1122334455', name: 'Phantom Corp', status: 'Flagged', employees: 0, registrationDate: '2024-01-01' },
      { id: 4, tin: '5566778899', name: 'Shell Company Ltd', status: 'Flagged', employees: 2, registrationDate: '2023-12-15' },
      { id: 5, tin: '9988776655', name: 'Legitimate Business Inc', status: 'Active', employees: 320, registrationDate: '2018-03-10' },
    ],
    employees: [
      { id: 1, nrc: '123456/78/9', name: 'John Mwale', employer: 'ABC Mining Ltd', tin: '1234567890', napsaNumber: 'NAPSA001', status: 'Active' },
      { id: 2, nrc: '987654/32/1', name: 'Mary Banda', employer: 'XYZ Traders', tin: '0987654321', napsaNumber: 'NAPSA002', status: 'Active' },
      { id: 3, nrc: '111222/33/4', name: 'Ghost Employee', employer: 'Phantom Corp', tin: '1122334455', napsaNumber: null, status: 'Flagged' },
      { id: 4, nrc: '555666/77/8', name: 'Sarah Phiri', employer: 'Legitimate Business Inc', tin: '9988776655', napsaNumber: 'NAPSA003', status: 'Active' },
    ],
    detections: [
      { id: 1, type: 'Ghost Company', entityName: 'Phantom Corp', tin: '1122334455', riskScore: 92, date: '2025-10-15', status: 'Under Investigation' },
      { id: 2, type: 'Phantom Employee', entityName: 'Ghost Employee', nrc: '111222/33/4', riskScore: 78, date: '2025-10-14', status: 'Resolved' },
      { id: 3, type: 'Ghost Company', entityName: 'Shell Company Ltd', tin: '5566778899', riskScore: 85, date: '2025-10-13', status: 'Flagged' },
    ],
    transactions: [
      { id: 1, txHash: '0xabc123def456', action: 'Document Hash Stored', timestamp: '2025-10-18 22:00:00', verified: true, blockNumber: 12345 },
      { id: 2, txHash: '0xdef456ghi789', action: 'Detection Recorded', timestamp: '2025-10-18 21:55:00', verified: true, blockNumber: 12344 },
      { id: 3, txHash: '0xghi789jkl012', action: 'Case Submitted', timestamp: '2025-10-18 21:30:00', verified: true, blockNumber: 12343 },
      { id: 4, txHash: '0xjkl012mno345', action: 'Audit Trail Updated', timestamp: '2025-10-18 21:00:00', verified: true, blockNumber: 12342 },
    ],
    cases: [
      { id: 1, caseId: 'CASE-001', type: 'Tax Evasion', entity: 'ABC Mining Ltd', investigator: 'John Doe', status: 'Open', priority: 'High', date: '2025-10-10' },
      { id: 2, caseId: 'CASE-002', type: 'Fraud Detection', entity: 'Phantom Corp', investigator: 'Mary Johnson', status: 'In Progress', priority: 'Critical', date: '2025-10-15' },
      { id: 3, caseId: 'CASE-003', type: 'Compliance Review', entity: 'XYZ Traders', investigator: 'Sarah Williams', status: 'Closed', priority: 'Medium', date: '2025-09-20' },
    ]
  };

  const tables = [
    { id: 'companies', name: 'Companies', icon: '🏢', count: mockData.companies.length },
    { id: 'employees', name: 'Employees', icon: '👥', count: mockData.employees.length },
    { id: 'detections', name: 'Detections', icon: '🔍', count: mockData.detections.length },
    { id: 'transactions', name: 'Blockchain Transactions', icon: '⛓️', count: mockData.transactions.length },
    { id: 'cases', name: 'Investigation Cases', icon: '📋', count: mockData.cases.length },
  ];

  useEffect(() => {
    setData(mockData[activeTable] || []);
  }, [activeTable]);

  const filteredData = data.filter(item => {
    const searchLower = searchTerm.toLowerCase();
    return Object.values(item).some(val =>
      val && val.toString().toLowerCase().includes(searchLower)
    );
  });

  const renderTableHeaders = () => {
    if (filteredData.length === 0) return null;
    const headers = Object.keys(filteredData[0]);
    return headers.map(header => (
      <th key={header} className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider bg-gray-100">
        {header.replace(/([A-Z])/g, ' $1').trim()}
      </th>
    ));
  };

  const renderTableRows = () => {
    return filteredData.map((row, idx) => (
      <tr key={idx} className="hover:bg-gray-50 border-b border-gray-200">
        {Object.entries(row).map(([key, value], cellIdx) => (
          <td key={cellIdx} className="px-4 py-3 text-sm text-gray-800">
            {key === 'status' ? (
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                value === 'Active' ? 'bg-green-100 text-green-700' :
                value === 'Flagged' ? 'bg-red-100 text-red-700' :
                value === 'Open' || value === 'In Progress' ? 'bg-yellow-100 text-yellow-700' :
                value === 'Closed' || value === 'Resolved' ? 'bg-gray-100 text-gray-700' :
                'bg-blue-100 text-blue-700'
              }`}>
                {value}
              </span>
            ) : key === 'priority' ? (
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                value === 'Critical' ? 'bg-red-100 text-red-700' :
                value === 'High' ? 'bg-orange-100 text-orange-700' :
                value === 'Medium' ? 'bg-yellow-100 text-yellow-700' :
                'bg-green-100 text-green-700'
              }`}>
                {value}
              </span>
            ) : key === 'verified' ? (
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                value ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
              }`}>
                {value ? '✓ Verified' : '✗ Unverified'}
              </span>
            ) : (
              value?.toString() || 'N/A'
            )}
          </td>
        ))}
      </tr>
    ));
  };

  return (
    <div className="max-w-7xl mx-auto">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-800">Database Viewer</h2>
          <p className="text-gray-600 mt-1">
            View and search all data stored in the TaxGuard system
          </p>
        </div>

        {/* Table Selector */}
        <div className="grid grid-cols-5 gap-4 mb-6">
          {tables.map(table => (
            <button
              key={table.id}
              onClick={() => setActiveTable(table.id)}
              className={`p-4 rounded-lg border-2 transition-all ${
                activeTable === table.id
                  ? 'border-blue-600 bg-blue-50'
                  : 'border-gray-200 hover:border-blue-300'
              }`}
            >
              <div className="text-3xl mb-2">{table.icon}</div>
              <div className="font-semibold text-gray-800 text-sm">{table.name}</div>
              <div className="text-xs text-gray-600 mt-1">
                {table.count} records
              </div>
            </button>
          ))}
        </div>

        {/* Search Bar */}
        <div className="mb-4">
          <input
            type="text"
            placeholder="Search in table..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        {/* Table Display */}
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr>
                  {renderTableHeaders()}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredData.length > 0 ? (
                  renderTableRows()
                ) : (
                  <tr>
                    <td colSpan={100} className="px-4 py-8 text-center text-gray-500">
                      {searchTerm ? 'No results found' : 'No data available'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Record Count */}
        <div className="mt-4 text-sm text-gray-600">
          Showing <span className="font-bold">{filteredData.length}</span> of{' '}
          <span className="font-bold">{data.length}</span> records
          {searchTerm && ` (filtered by "${searchTerm}")`}
        </div>

        {/* Export Options */}
        <div className="mt-6 flex space-x-3">
          <button className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 flex items-center space-x-2">
            <span>📥</span>
            <span>Export to CSV</span>
          </button>
          <button className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 flex items-center space-x-2">
            <span>📊</span>
            <span>Generate Report</span>
          </button>
          <button className="bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700 flex items-center space-x-2">
            <span>🔄</span>
            <span>Refresh Data</span>
          </button>
        </div>

        {/* Info Panel */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="font-semibold text-blue-800 mb-2">ℹ️ Database Information</h4>
          <ul className="text-sm text-blue-700 space-y-1">
            <li>• All data is synchronized across the TaxGuard system</li>
            <li>• Flagged records indicate potential fraud or anomalies</li>
            <li>• Blockchain transactions provide immutable audit trails</li>
            <li>• Use the search bar to quickly find specific records</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default DatabaseViewer;
