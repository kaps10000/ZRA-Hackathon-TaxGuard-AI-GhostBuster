import React from 'react';

export default function ReportHistory({ reports = [], onOpen, onClear }){
  if(!reports || !reports.length) return (
    <div className="mt-4 text-sm text-gray-600">No reports in this session.</div>
  );

  return (
    <div className="mt-4 border p-2 rounded bg-white">
      <div className="flex items-center justify-between">
        <div className="font-semibold">Session Reports</div>
        <button onClick={onClear} className="text-sm text-red-600">Clear</button>
      </div>
      <ul className="mt-2 space-y-2 max-h-48 overflow-auto">
        {reports.map((r, idx) => (
          <li key={r.case_id + '-' + idx} className="p-2 border rounded hover:bg-gray-50 cursor-pointer" onClick={()=>onOpen(r)}>
            <div className="text-sm"><span className="font-medium">{r.case_id}</span> — <span className="text-xs text-gray-600">{r.proof_hash?.slice(0,24)}{r.proof_hash && r.proof_hash.length>24?'...':''}</span></div>
            <div className="text-xs text-gray-500">{new Date(r.created_at || Date.now()).toLocaleString()}</div>
          </li>
        ))}
      </ul>
    </div>
  );
}
