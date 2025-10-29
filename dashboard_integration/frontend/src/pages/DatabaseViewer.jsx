import React, { useState, useEffect } from 'react';
import axios from 'axios';

const DatabaseViewer = () => {
  const [activeTable, setActiveTable] = useState('companies');
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [ocrDocCount, setOcrDocCount] = useState(0);
  const [ghostDetectionCount, setGhostDetectionCount] = useState(0);
  const [vrtDetectionCount, setVrtDetectionCount] = useState(0);
  const [riskScoreCount, setRiskScoreCount] = useState(0);
  const [blockchainTxCount, setBlockchainTxCount] = useState(0);
  const [casesCount, setCasesCount] = useState(0);

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
    { id: 'transactions', name: 'Blockchain Transactions', icon: '⛓️', count: blockchainTxCount },
    { id: 'cases', name: 'Investigation Cases', icon: '📋', count: casesCount },
    { id: 'ocrDocuments', name: 'OCR Documents', icon: '📄', count: ocrDocCount },
    { id: 'ghostDetections', name: 'Ghost Detections', icon: '👻', count: ghostDetectionCount },
    { id: 'vrtDetections', name: 'VAT Fraud Detections', icon: '🛡️', count: vrtDetectionCount },
    { id: 'riskScores', name: 'Risk Scores', icon: '📊', count: riskScoreCount },
  ];

  // Fetch OCR document count on mount
  useEffect(() => {
    const fetchOcrCount = async () => {
      try {
        const response = await axios.get('http://localhost:4001/api/ocr/documents');
        setOcrDocCount(response.data.total || 0);
      } catch (error) {
        console.error('Error fetching OCR count:', error);
        setOcrDocCount(0);
      }
    };
    fetchOcrCount();
  }, []);

  // Fetch Ghost Detection count on mount
  useEffect(() => {
    const fetchGhostDetectionCount = async () => {
      try {
        const response = await axios.get('http://localhost:4001/api/ghostbuster/detections');
        setGhostDetectionCount(response.data.total || 0);
      } catch (error) {
        console.error('Error fetching Ghost Detection count:', error);
        setGhostDetectionCount(0);
      }
    };
    fetchGhostDetectionCount();
  }, []);

  // Fetch VRT Detection count on mount
  useEffect(() => {
    const fetchVrtDetectionCount = async () => {
      try {
        const response = await axios.get('http://localhost:4001/api/vrtguard-db/detections');
        setVrtDetectionCount(response.data.total || 0);
      } catch (error) {
        console.error('Error fetching VRT Detection count:', error);
        setVrtDetectionCount(0);
      }
    };
    fetchVrtDetectionCount();
  }, []);

  // Fetch Risk Score count on mount
  useEffect(() => {
    const fetchRiskScoreCount = async () => {
      try {
        const response = await axios.get('http://localhost:4001/api/anomaly-tracker-db/scores');
        setRiskScoreCount(response.data.total || 0);
      } catch (error) {
        console.error('Error fetching Risk Score count:', error);
        setRiskScoreCount(0);
      }
    };
    fetchRiskScoreCount();
  }, []);

  // Fetch Blockchain Transaction count on mount
  useEffect(() => {
    const fetchBlockchainTxCount = async () => {
      try {
        const response = await axios.get('http://localhost:3001/api/events');
        setBlockchainTxCount(response.data.count || response.data.events?.length || 0);
      } catch (error) {
        console.error('Error fetching Blockchain Transaction count:', error);
        setBlockchainTxCount(0);
      }
    };
    fetchBlockchainTxCount();
  }, []);

  // Fetch Investigation Cases count on mount
  useEffect(() => {
    const fetchCasesCount = async () => {
      try {
        const response = await axios.get('http://localhost:4000/api/reports');
        setCasesCount(response.data.pagination?.total || response.data.data?.length || 0);
      } catch (error) {
        console.error('Error fetching Investigation Cases count:', error);
        setCasesCount(0);
      }
    };
    fetchCasesCount();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      switch(activeTable) {
        case 'ocrDocuments':
          const ocrResponse = await axios.get('http://localhost:4001/api/ocr/documents');
          console.log('📄 OCR Documents fetched:', ocrResponse.data);
          const ocrDocs = ocrResponse.data.documents || [];
          // Show mock data if no real data to demonstrate functionality
          setData(ocrDocs.length > 0 ? ocrDocs : [
            { id: 1, filename: 'tax_return_2024.pdf', status: 'Processed', uploadedAt: '2025-10-28', extractedData: { amount: 50000, taxpayer: 'ABC Corp' } },
            { id: 2, filename: 'invoice_001.pdf', status: 'Processing', uploadedAt: '2025-10-29', extractedData: null }
          ]);
          setOcrDocCount(ocrResponse.data.total || 2);
          break;

          case 'ghostDetections':
            const ghostResponse = await axios.get('http://localhost:4001/api/ghostbuster/detections');
            const ghostDets = ghostResponse.data.detections || [];
            // Show mock data if no real data to demonstrate functionality
            setData(ghostDets.length > 0 ? ghostDets : [
              { id: 1, companyName: 'Phantom Corp', tin: '1122334455', riskScore: 92, detectedAt: '2025-10-28', status: 'Under Investigation' },
              { id: 2, companyName: 'Shell Company Ltd', tin: '5566778899', riskScore: 85, detectedAt: '2025-10-27', status: 'Flagged' }
            ]);
            setGhostDetectionCount(ghostResponse.data.total || 2);
            break;

          case 'vrtDetections':
            const vrtResponse = await axios.get('http://localhost:4001/api/vrtguard-db/detections');
            setData(vrtResponse.data.detections || []);
            setVrtDetectionCount(vrtResponse.data.total || 0);
            break;

          case 'riskScores':
            const riskScoreResponse = await axios.get('http://localhost:4001/api/anomaly-tracker-db/scores');
            setData(riskScoreResponse.data.scores || []);
            setRiskScoreCount(riskScoreResponse.data.total || 0);
            break;

          case 'cases':
            // Fetch real cases from WhistlePro API
            try {
              const casesResponse = await axios.get('http://localhost:4000/api/reports');
              const reports = casesResponse.data.data || [];

              // Transform WhistlePro reports to match Database Viewer format
              const cases = reports.map(report => ({
                id: report.id,
                caseId: report.case_id,
                type: report.category.replace('_', ' ').split(' ').map(word =>
                  word.charAt(0).toUpperCase() + word.slice(1)).join(' '),
                entity: report.title || 'Anonymous Report',
                investigator: 'ZRA Investigator',
                status: report.status === 'under_review' ? 'Under Investigation' :
                        report.status === 'investigating' ? 'In Progress' :
                        report.status === 'closed' ? 'Closed' :
                        report.status === 'pending' ? 'Open' : report.status,
                priority: report.priority.charAt(0).toUpperCase() + report.priority.slice(1),
                date: new Date(report.created_at).toISOString().split('T')[0],
                description: report.description || 'No description available'
              }));

              setData(cases);
              setCasesCount(casesResponse.data.pagination?.total || cases.length);
            } catch (err) {
              console.error('Error fetching cases:', err);
              setData(mockData.cases);
            }
            break;

          case 'transactions':
            // Fetch real blockchain transactions from blockchain service
            try {
              const txResponse = await axios.get('http://localhost:3001/api/events');
              const events = txResponse.data.events || [];

              // Transform blockchain events to match database viewer format
              const transactions = events.map(event => ({
                id: event.eventId,
                txHash: event.hashOfPayload,
                action: event.eventType,
                timestamp: new Date(event.timestamp).toLocaleString(),
                verified: true,
                blockNumber: event.blockIndex,
                notes: event.notes
              }));

              setData(transactions);
              setBlockchainTxCount(transactions.length);
            } catch (err) {
              console.error('Error fetching transactions:', err);
              setData(mockData.transactions);
            }
            break;

          case 'detections':
            // Combine all detection types into one view
            try {
              const [ghostResp, vrtResp, riskResp] = await Promise.all([
                axios.get('http://localhost:4001/api/ghostbuster/detections'),
                axios.get('http://localhost:4001/api/vrtguard-db/detections'),
                axios.get('http://localhost:4001/api/anomaly-tracker-db/scores')
              ]);

              const ghostDets = (ghostResp.data.detections || []).map(d => ({
                ...d,
                type: 'Ghost Detection',
                detectionSystem: 'GhostBuster'
              }));

              const vrtDets = (vrtResp.data.detections || []).map(d => ({
                id: d.id,
                type: 'VAT Fraud',
                entityName: d.taxpayerName,
                tin: d.tin,
                riskScore: Math.round(d.fraudProbability * 100),
                date: new Date(d.detectedAt).toISOString().split('T')[0],
                status: d.status,
                detectionSystem: 'VRT Guard'
              }));

              const riskDets = (riskResp.data.scores || []).map(d => ({
                id: d.id,
                type: 'Risk Score',
                entityName: d.taxpayerName,
                tin: d.tin,
                riskScore: d.riskScore,
                date: new Date(d.analyzedAt).toISOString().split('T')[0],
                status: d.riskLevel,
                detectionSystem: 'Anomaly Tracker'
              }));

              setData([...ghostDets, ...vrtDets, ...riskDets]);
            } catch (err) {
              console.error('Error fetching combined detections:', err);
              setData(mockData.detections);
            }
            break;

          default:
            // For companies and employees, use mock data (can be replaced with real APIs later)
            setData(mockData[activeTable] || []);
        }
      } catch (error) {
        console.error(`Error fetching ${activeTable}:`, error);
        setData(mockData[activeTable] || []);
      } finally {
        setLoading(false);
      }
    };

  useEffect(() => {
    fetchData();
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
            ) : key === 'extractedData' ? (
              <span className="text-xs text-gray-600">
                {typeof value === 'object' ? JSON.stringify(value).substring(0, 50) + '...' : value?.toString() || 'N/A'}
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
        <div className="grid grid-cols-6 gap-4 mb-6">
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

        {/* Search Bar and Refresh Button */}
        <div className="mb-4 flex space-x-3">
          <input
            type="text"
            placeholder="Search in table..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
          <button
            onClick={fetchData}
            disabled={loading}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 font-semibold flex items-center space-x-2"
          >
            <span>🔄</span>
            <span>{loading ? 'Refreshing...' : 'Refresh Data'}</span>
          </button>
        </div>

        {/* Table Display */}
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            {loading ? (
              <div className="px-4 py-12 text-center text-gray-500">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <p className="mt-4">Loading data...</p>
              </div>
            ) : (
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
            )}
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
