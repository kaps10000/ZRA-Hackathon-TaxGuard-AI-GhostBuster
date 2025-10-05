import React, { useState } from 'react';
import axios from 'axios';
import ReportModal from './ReportModal';

export default function GhostCheckForm({ demoMode, apiBaseUrl }) {
  const [companyId, setCompanyId] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [creatingReport, setCreatingReport] = useState(false);
  const [reportResult, setReportResult] = useState(null);
  const [showReportModal, setShowReportModal] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const client = axios.create({ baseURL: demoMode ? '' : apiBaseUrl });
      const res = await client.post('/api/ghost-check', { company_id: companyId });
      setResult(res.data.result);
      setReportResult(null);
    } catch (err) {
      setError(err.message || 'Failed to check');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="p-4 bg-white rounded shadow-sm mb-6">
      <form onSubmit={handleSubmit} className="space-y-2">
        <div className="font-semibold mb-2">Ghost-Check</div>
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={companyId}
            onChange={e => setCompanyId(e.target.value)}
            placeholder="Enter Company ID (e.g. G-9001)"
            className="border px-3 py-2 rounded w-64"
            required
          />
          <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded" disabled={loading}>
            {loading ? 'Checking...' : 'Run Check'}
          </button>
        </div>
        {error && <div className="text-red-600 text-sm">Error: {error}</div>}
        {result && (
          <div className="mt-3 p-3 border rounded bg-gray-50">
            <div><span className="font-semibold">Alert ID:</span> {result.alert_id}</div>
            <div><span className="font-semibold">Ghost Score:</span> {result.ghost_score}</div>
            <div><span className="font-semibold">Issues:</span> {result.issues && result.issues.length ? result.issues.join(', ') : 'None'}</div>
            <div className="mt-3">
              <button className="px-3 py-1 bg-green-600 text-white rounded" onClick={async ()=>{
                setCreatingReport(true);
                setReportResult(null);
                try{
                  const client = axios.create({ baseURL: demoMode ? '' : apiBaseUrl });
                  const rr = await client.post('/api/report', { alert: result, company_id: companyId });
                  setReportResult(rr.data);
                  setShowReportModal(true);
                }catch(e){
                  setError('Failed to create report: ' + (e.message||e));
                }finally{ setCreatingReport(false); }
              }} disabled={creatingReport}>{creatingReport? 'Creating...':'Create report'}</button>
            </div>
            {reportResult && (
              <div className="mt-2 p-2 bg-white border rounded">
                <div><span className="font-semibold">Case ID:</span> {reportResult.case_id}</div>
                <div><span className="font-semibold">Proof Hash:</span> {reportResult.proof_hash}</div>
                <div className="mt-2"><button onClick={()=>setShowReportModal(true)} className="px-3 py-1 border rounded">Open report</button></div>
              </div>
            )}
          </div>
        )}
      </form>
      <ReportModal open={showReportModal} onClose={()=>setShowReportModal(false)} report={reportResult||{}} />
    </div>
  );
}