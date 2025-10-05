import React from 'react';

export default function ReportHistory({ reports = [], onOpen, onClear }){
  const [confirmClear, setConfirmClear] = React.useState(false);

  if(!reports || !reports.length) return (
    <div className="mt-4 text-sm text-gray-600">No reports in this session.</div>
  );

  return (
    <div className="mt-4 border p-2 rounded bg-white">
      <div className="flex items-center justify-between">
        <div className="font-semibold">Session Reports</div>
        <div>
          {!confirmClear && (
            <button onClick={()=>setConfirmClear(true)} className="text-sm text-red-600">Clear</button>
          )}
          {confirmClear && (
            <span className="space-x-2">
              <button onClick={()=>{ setConfirmClear(false); onClear && onClear(); }} className="text-sm text-red-600">Yes, clear</button>
              <button onClick={()=>setConfirmClear(false)} className="text-sm">Cancel</button>
            </span>
          )}
        </div>
      </div>
      <ul className="mt-2 space-y-2 max-h-48 overflow-auto">
        {reports.map((r, idx) => (
          <li key={r.case_id + '-' + idx}>
            <button
              type="button"
              onClick={()=>onOpen && onOpen(r)}
              className="w-full text-left p-2 border rounded hover:bg-gray-50 flex items-center justify-between"
            >
              <div>
                <div className="text-sm"><span className="font-medium">{r.case_id}</span> — <span className="text-xs text-gray-600">{r.proof_hash?.slice(0,24)}{r.proof_hash && r.proof_hash.length>24?'...':''}</span></div>
                <div className="text-xs text-gray-500">{new Date(r.created_at || Date.now()).toLocaleString()}</div>
              </div>
              <div className="text-xs text-gray-400">Open</div>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
