import React from 'react';

export default function ReportModal({ open, onClose, report }){
  if(!open) return null;

  const [copied, setCopied] = React.useState(false);

  React.useEffect(() => {
    function handleKey(e){
      if(e.key === 'Escape') onClose && onClose();
    }
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onClose]);

  async function copyHash(){
    try{
      const textToCopy = report.proof_hash || JSON.stringify(report || {});
      await navigator.clipboard.writeText(textToCopy);
      setCopied(true);
      setTimeout(()=>setCopied(false), 2000);
    }catch(e){
      // show temporary failed state
      setCopied(false);
      console.error('Copy failed', e);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="w-[420px] bg-white rounded-lg p-4">
        <div className="flex justify-between items-center">
          <div className="font-semibold">Report Created</div>
        </div>
        <div className="mt-3">
          <div><strong>Case ID:</strong> {report.case_id || '(none)'}</div>
          <div className="mt-2">
            <strong>Proof Hash:</strong>
            <div className="mt-1">
              <code className="bg-gray-100 px-2 py-1 rounded text-sm inline-block max-w-full overflow-x-auto block">
                {report.proof_hash || '(none)'}
              </code>
            </div>
          </div>
          <div className="mt-2 text-sm text-gray-600">
            <div>Full report (debug):</div>
            <pre className="bg-gray-50 p-2 rounded-md max-h-[160px] overflow-auto text-xs">{JSON.stringify(report || {}, null, 2)}</pre>
          </div>
        </div>
        <div className="mt-3 flex gap-2 items-center">
          <button onClick={copyHash} className="px-3 py-1 bg-sky-500 text-white rounded">Copy proof hash</button>
          <button onClick={onClose} className="px-3 py-1">Close</button>
          <div className="ml-2">
            {copied && <span className="text-sm text-emerald-600">Copied!</span>}
          </div>
        </div>
      </div>
    </div>
  );
}
