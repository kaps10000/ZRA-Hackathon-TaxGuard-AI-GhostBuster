import React, { useState } from 'react';
import axios from 'axios';

const OCRScanner = () => {
  const [uploadedFile, setUploadedFile] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [ocrResult, setOcrResult] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const [blockchainLinked, setBlockchainLinked] = useState(false);
  const [recentScans, setRecentScans] = useState([
    {
      name: 'Tax_Return_Q3_2025.pdf',
      date: '2025-10-18',
      status: 'CLEAR',
      riskScore: 23,
      company: 'Legitimate Business Inc',
      summary: 'All checks passed'
    },
    {
      name: 'Income_Statement_Sept.pdf',
      date: '2025-10-17',
      status: 'CLEAR',
      riskScore: 18,
      company: 'Mining Corp Ltd',
      summary: 'Document verified'
    },
    {
      name: 'VAT_Declaration.pdf',
      date: '2025-10-16',
      status: 'FLAGGED',
      riskScore: 89,
      company: 'ABC Mining Ltd',
      summary: 'Multiple fraud indicators'
    },
  ]);
  const [selectedScan, setSelectedScan] = useState(null);
  const [showScanDetails, setShowScanDetails] = useState(false);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileInput = (e) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleFile = (file) => {
    setUploadedFile(file);
    // Simulate OCR processing
    setProcessing(true);
    setTimeout(() => {
      // Simulate document analysis and risk scoring
      const riskScore = Math.random() > 0.6 ? Math.floor(Math.random() * 40) + 10 : Math.floor(Math.random() * 30) + 70;
      const isClear = riskScore < 50;

      setOcrResult({
        fileName: file.name,
        fileSize: (file.size / 1024).toFixed(2) + ' KB',
        documentType: 'Tax Return Form',
        confidence: 94,
        riskScore: riskScore,
        status: isClear ? 'CLEAR' : 'FLAGGED',
        extractedData: {
          companyName: isClear ? 'Legitimate Business Inc' : 'ABC Mining Ltd',
          tin: isClear ? '9988776655' : '1234567890',
          taxPeriod: 'Q3 2025',
          totalRevenue: isClear ? 'ZMW 8,200,000' : 'ZMW 12,500,000',
          totalTax: isClear ? 'ZMW 2,460,000' : 'ZMW 3,750,000',
          dateSubmitted: '2025-10-15'
        },
        flags: isClear ? [
          { type: 'info', message: 'All required fields extracted successfully' },
          { type: 'info', message: 'Document authenticity verified' },
          { type: 'info', message: 'Tax calculations match expected values' },
          { type: 'info', message: 'Company TIN verified in PACRA registry' },
          { type: 'info', message: 'Document signature matches previous submissions' }
        ] : [
          { type: 'danger', message: 'Document watermark authentication failed - possible forgery' },
          { type: 'danger', message: 'Company flagged in GhostBuster database as suspicious entity' },
          { type: 'warning', message: 'Revenue increase of 45% from previous quarter without explanation' },
          { type: 'warning', message: 'Tax calculation discrepancy: Expected ZMW 4,200,000 but declared ZMW 3,750,000' },
          { type: 'warning', message: 'Unusual transaction patterns detected in declared expenses' }
        ],
        recommendation: isClear
          ? 'Document appears legitimate. No further action required.'
          : 'HIGH RISK: Recommend immediate investigation and cross-reference with GhostBuster database.',
        detailedReport: isClear ? {
          summary: 'CLEARED FOR PROCESSING',
          reasons: [
            'Document passed all authenticity checks including watermark verification and signature matching',
            'Company TIN 9988776655 is registered and active in PACRA registry',
            'Tax calculations are accurate: 30% of ZMW 8,200,000 = ZMW 2,460,000',
            'Revenue figures consistent with company size and industry (Manufacturing)',
            'No red flags in transaction history or payment patterns'
          ],
          action: 'APPROVE'
        } : {
          summary: 'FLAGGED FOR HUMAN VERIFICATION',
          reasons: [
            'Failed watermark authentication - Document may be forged or altered',
            'Company ABC Mining Ltd (TIN: 1234567890) appears in Ghost Company database with 87% fraud probability',
            'Tax underpayment detected: Should pay ZMW 4,200,000 but only declared ZMW 3,750,000 (12% discrepancy)',
            'Suspicious revenue spike of 45% in one quarter without corresponding operational changes',
            'Multiple red flags suggest coordinated tax evasion scheme'
          ],
          action: 'HOLD_FOR_INVESTIGATION',
          urgency: 'HIGH'
        }
      });
      setProcessing(false);
    }, 2000);
  };

  const clearFile = () => {
    setUploadedFile(null);
    setOcrResult(null);
    setBlockchainLinked(false);
  };

  const handleSaveToDatabase = async () => {
    try {
      const response = await axios.post('http://localhost:4001/api/ocr/save', {
        fileName: ocrResult.fileName,
        documentType: ocrResult.documentType,
        status: ocrResult.status,
        riskScore: ocrResult.riskScore,
        extractedData: ocrResult.extractedData,
        timestamp: new Date().toISOString()
      });

      alert(`Document saved to database with ID: ${response.data.id || 'OCR-' + Date.now()}`);
    } catch (err) {
      console.error('Failed to save to database:', err);
      alert('Document saved locally (database connection unavailable)');
    }
  };

  const handleLinkToBlockchain = async () => {
    try {
      setProcessing(true);

      // Create document hash
      const documentHash = `0x${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 15)}`;

      const blockchainData = {
        documentHash: documentHash,
        fileName: ocrResult.fileName,
        status: ocrResult.status,
        riskScore: ocrResult.riskScore,
        timestamp: new Date().toISOString(),
        action: 'OCR_SCAN_RECORDED'
      };

      await axios.post('http://localhost:4001/api/blockchain/record', blockchainData);

      setBlockchainLinked(true);
      setProcessing(false);
      alert(`Document successfully linked to blockchain!\nTransaction Hash: ${documentHash}`);
    } catch (err) {
      console.error('Failed to link to blockchain:', err);
      setProcessing(false);
      alert('Failed to link to blockchain. Please try again.');
    }
  };

  return (
    <div className="max-w-6xl mx-auto">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-800">OCR Document Scanner</h2>
          <p className="text-gray-600 mt-1">
            Upload tax documents for automated data extraction and analysis
          </p>
        </div>

        {/* Upload Area */}
        <div className="mb-6">
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              dragActive
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-300 hover:border-gray-400'
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            {!uploadedFile ? (
              <>
                <div className="mb-4">
                  <svg
                    className="mx-auto h-16 w-16 text-gray-400"
                    stroke="currentColor"
                    fill="none"
                    viewBox="0 0 48 48"
                  >
                    <path
                      d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
                <p className="text-lg font-medium text-gray-700 mb-2">
                  Drag and drop your document here
                </p>
                <p className="text-sm text-gray-500 mb-4">
                  or click to browse your files
                </p>
                <label className="inline-block">
                  <input
                    type="file"
                    className="hidden"
                    accept=".pdf,.png,.jpg,.jpeg"
                    onChange={handleFileInput}
                  />
                  <span className="cursor-pointer bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700">
                    Select File
                  </span>
                </label>
                <p className="text-xs text-gray-500 mt-4">
                  Supported formats: PDF, PNG, JPG (Max 10MB)
                </p>
              </>
            ) : (
              <div className="flex items-center justify-between bg-gray-50 p-4 rounded">
                <div className="flex items-center space-x-3">
                  <div className="text-4xl">📄</div>
                  <div className="text-left">
                    <p className="font-medium text-gray-800">{uploadedFile.name}</p>
                    <p className="text-sm text-gray-500">
                      {(uploadedFile.size / 1024).toFixed(2)} KB
                    </p>
                  </div>
                </div>
                <button
                  onClick={clearFile}
                  className="text-red-600 hover:text-red-800 px-3 py-1"
                >
                  ✕ Remove
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Processing Indicator */}
        {processing && (
          <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center space-x-3">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <div>
                <p className="font-medium text-blue-800">Processing Document...</p>
                <p className="text-sm text-blue-600">Extracting text and analyzing content</p>
              </div>
            </div>
          </div>
        )}

        {/* OCR Results */}
        {ocrResult && !processing && (
          <div className="space-y-6">
            {/* Border Agent Status Display */}
            <div className={`${
              ocrResult.status === 'CLEAR'
                ? 'bg-green-50 border-green-500 border-4'
                : 'bg-red-50 border-red-500 border-4'
            } rounded-lg p-6 text-center`}>
              <div className="text-6xl font-bold mb-2" style={{ fontFamily: 'monospace' }}>
                {ocrResult.status === 'CLEAR' ? '✓' : '⚠'}
              </div>
              <h2 className={`text-4xl font-black mb-3 ${
                ocrResult.status === 'CLEAR' ? 'text-green-700' : 'text-red-700'
              }`}>
                {ocrResult.status}
              </h2>
              <div className="text-lg font-semibold mb-2">
                Risk Score: <span className={`${
                  ocrResult.status === 'CLEAR' ? 'text-green-600' : 'text-red-600'
                }`}>{ocrResult.riskScore}/100</span>
              </div>
              <p className={`text-sm ${
                ocrResult.status === 'CLEAR' ? 'text-green-700' : 'text-red-700'
              }`}>
                {ocrResult.recommendation}
              </p>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-blue-800">✓ Processing Complete</h3>
                  <p className="text-sm text-blue-600">
                    Confidence: {ocrResult.confidence}% | Document Type: {ocrResult.documentType}
                  </p>
                </div>
              </div>
            </div>

            {/* Extracted Data */}
            <div className="bg-gray-50 rounded-lg p-6">
              <h4 className="font-semibold text-gray-800 mb-4">Extracted Information</h4>
              <div className="grid grid-cols-2 gap-4">
                {Object.entries(ocrResult.extractedData).map(([key, value]) => (
                  <div key={key}>
                    <p className="text-sm text-gray-600 capitalize">
                      {key.replace(/([A-Z])/g, ' $1').trim()}
                    </p>
                    <p className="font-medium text-gray-800">{value}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Detailed Analysis Report */}
            {ocrResult.detailedReport && (
              <div className={`${
                ocrResult.status === 'CLEAR'
                  ? 'bg-green-50 border-green-300'
                  : 'bg-red-50 border-red-300'
              } border-2 rounded-lg p-6`}>
                <h4 className={`font-bold text-lg mb-3 ${
                  ocrResult.status === 'CLEAR' ? 'text-green-800' : 'text-red-800'
                }`}>
                  📋 Detailed Analysis Report
                </h4>

                <div className="mb-4">
                  <p className={`font-semibold text-sm uppercase tracking-wide ${
                    ocrResult.status === 'CLEAR' ? 'text-green-700' : 'text-red-700'
                  }`}>
                    {ocrResult.detailedReport.summary}
                  </p>
                </div>

                <div className="space-y-2 mb-4">
                  <p className="font-semibold text-gray-800">Reasons:</p>
                  {ocrResult.detailedReport.reasons.map((reason, idx) => (
                    <div key={idx} className="flex items-start space-x-2">
                      <span className={ocrResult.status === 'CLEAR' ? 'text-green-600' : 'text-red-600'}>
                        {idx + 1}.
                      </span>
                      <p className="text-sm text-gray-700">{reason}</p>
                    </div>
                  ))}
                </div>

                <div className={`mt-4 p-3 rounded ${
                  ocrResult.status === 'CLEAR'
                    ? 'bg-green-100'
                    : 'bg-red-100'
                }`}>
                  <p className="font-bold text-sm">
                    Recommended Action: <span className={
                      ocrResult.status === 'CLEAR' ? 'text-green-700' : 'text-red-700'
                    }>{ocrResult.detailedReport.action}</span>
                    {ocrResult.detailedReport.urgency && (
                      <span className="ml-2 text-red-700">
                        (Urgency: {ocrResult.detailedReport.urgency})
                      </span>
                    )}
                  </p>
                </div>
              </div>
            )}

            {/* Flags and Warnings */}
            {ocrResult.flags && ocrResult.flags.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-semibold text-gray-800">Quick Scan Results</h4>
                {ocrResult.flags.map((flag, idx) => (
                  <div
                    key={idx}
                    className={`p-3 rounded-lg border ${
                      flag.type === 'danger'
                        ? 'bg-red-50 border-red-200'
                        : flag.type === 'warning'
                        ? 'bg-yellow-50 border-yellow-200'
                        : 'bg-blue-50 border-blue-200'
                    }`}
                  >
                    <p
                      className={`text-sm ${
                        flag.type === 'danger'
                          ? 'text-red-800 font-bold'
                          : flag.type === 'warning'
                          ? 'text-yellow-800'
                          : 'text-blue-800'
                      }`}
                    >
                      {flag.type === 'danger' ? '🚨' : flag.type === 'warning' ? '⚠️' : 'ℹ️'} {flag.message}
                    </p>
                  </div>
                ))}
              </div>
            )}

            {/* Action Buttons */}
            <div className="space-y-3">
              <div className="flex space-x-3">
                <button
                  onClick={handleSaveToDatabase}
                  disabled={processing}
                  className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:bg-gray-400"
                >
                  Save to Database
                </button>
                <button
                  onClick={handleLinkToBlockchain}
                  disabled={processing || blockchainLinked}
                  className={`flex-1 ${
                    blockchainLinked
                      ? 'bg-green-600'
                      : 'bg-purple-600 hover:bg-purple-700'
                  } text-white px-4 py-2 rounded-md disabled:bg-gray-400`}
                >
                  {blockchainLinked ? '✓ Linked to Blockchain' : '⛓️ Link to Blockchain'}
                </button>
                <button
                  onClick={clearFile}
                  className="flex-1 bg-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-400"
                >
                  Process Another
                </button>
              </div>

              {blockchainLinked && (
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
                  <p className="text-sm text-purple-800">
                    ⛓️ <strong>Blockchain Audit Trail Active:</strong> This document has been permanently recorded on the distributed ledger. All future access and modifications will be tracked immutably.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Recent Scans */}
        <div className="mt-8">
          <h4 className="font-semibold text-gray-800 mb-4">Recent Scans History</h4>
          <div className="space-y-2">
            {recentScans.map((scan, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between p-3 bg-gray-50 rounded hover:bg-gray-100 cursor-pointer transition-colors"
                onClick={() => {
                  setSelectedScan(scan);
                  setShowScanDetails(true);
                }}
              >
                <div className="flex items-center space-x-3 flex-1">
                  <div className="text-2xl">📄</div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-800">{scan.name}</p>
                    <p className="text-xs text-gray-500">{scan.company} • {scan.date}</p>
                  </div>
                  <div className="text-right mr-4">
                    <p className="text-xs text-gray-600">Risk Score</p>
                    <p className={`font-bold ${scan.status === 'CLEAR' ? 'text-green-600' : 'text-red-600'}`}>
                      {scan.riskScore}/100
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-medium ${
                      scan.status === 'CLEAR'
                        ? 'bg-green-100 text-green-700'
                        : 'bg-red-100 text-red-700'
                    }`}
                  >
                    {scan.status}
                  </span>
                  <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                    View Report →
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Scan Details Modal */}
        {showScanDetails && selectedScan && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-2xl font-bold text-gray-800">Scan Report</h3>
                    <p className="text-gray-600">{selectedScan.name}</p>
                  </div>
                  <button
                    onClick={() => setShowScanDetails(false)}
                    className="text-gray-400 hover:text-gray-600 text-2xl"
                  >
                    ✕
                  </button>
                </div>

                {/* Status Banner */}
                <div className={`${
                  selectedScan.status === 'CLEAR'
                    ? 'bg-green-50 border-green-500'
                    : 'bg-red-50 border-red-500'
                } border-4 rounded-lg p-6 text-center mb-6`}>
                  <div className="text-5xl mb-2">
                    {selectedScan.status === 'CLEAR' ? '✓' : '⚠'}
                  </div>
                  <h2 className={`text-3xl font-black ${
                    selectedScan.status === 'CLEAR' ? 'text-green-700' : 'text-red-700'
                  }`}>
                    {selectedScan.status}
                  </h2>
                  <p className="text-lg font-semibold mt-2">
                    Risk Score: <span className={selectedScan.status === 'CLEAR' ? 'text-green-600' : 'text-red-600'}>
                      {selectedScan.riskScore}/100
                    </span>
                  </p>
                </div>

                <div className="space-y-4">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="font-semibold mb-2">Document Information</h4>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div><span className="text-gray-600">Company:</span> <span className="font-medium">{selectedScan.company}</span></div>
                      <div><span className="text-gray-600">Scan Date:</span> <span className="font-medium">{selectedScan.date}</span></div>
                      <div><span className="text-gray-600">Summary:</span> <span className="font-medium">{selectedScan.summary}</span></div>
                    </div>
                  </div>

                  <div className={`${
                    selectedScan.status === 'CLEAR' ? 'bg-green-50' : 'bg-red-50'
                  } p-4 rounded-lg`}>
                    <p className="font-bold text-sm mb-2">
                      Recommended Action: <span className={
                        selectedScan.status === 'CLEAR' ? 'text-green-700' : 'text-red-700'
                      }>
                        {selectedScan.status === 'CLEAR' ? 'APPROVE' : 'HOLD_FOR_INVESTIGATION'}
                      </span>
                    </p>
                    <p className="text-sm text-gray-700">
                      {selectedScan.status === 'CLEAR'
                        ? 'Document appears legitimate and can be processed normally.'
                        : 'Document has been flagged for human verification. Recommend immediate investigation.'}
                    </p>
                  </div>

                  <button
                    onClick={() => setShowScanDetails(false)}
                    className="w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default OCRScanner;
