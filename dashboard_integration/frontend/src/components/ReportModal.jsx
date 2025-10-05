import React from 'react';

export default function ReportModal({ open, onClose, report }){
  if(!open) return null;

  const [copied, setCopied] = React.useState(false);

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
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
      <div style={{ width: 420, background: '#fff', borderRadius: 8, padding: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontWeight: 700 }}>Report Created</div>
          <button onClick={onClose} style={{ fontSize: 12 }}>Close</button>
        </div>
        <div style={{ marginTop: 12 }}>
          <div><strong>Case ID:</strong> {report.case_id || '(none)'}</div>
          <div style={{ marginTop: 8 }}>
            <strong>Proof Hash:</strong>
            <div style={{ marginTop: 6 }}>
              <code style={{ background: '#f3f4f6', padding: 6, borderRadius: 4, display: 'inline-block', maxWidth: '100%', overflowX: 'auto' }}>
                {report.proof_hash || '(none)'}
              </code>
            </div>
          </div>
          <div style={{ marginTop: 8, fontSize: 12, color: '#666' }}>
            <div>Full report (debug):</div>
            <pre style={{ background: '#f8fafc', padding: 8, borderRadius: 6, maxHeight: 160, overflow: 'auto' }}>{JSON.stringify(report || {}, null, 2)}</pre>
          </div>
        </div>
        <div style={{ marginTop: 12, display: 'flex', gap: 8, alignItems: 'center' }}>
          <button onClick={copyHash} style={{ padding: '6px 10px', background: '#0ea5e9', color: '#fff', borderRadius: 6 }}>Copy proof hash</button>
          <button onClick={onClose} style={{ padding: '6px 10px' }}>Close</button>
          <div style={{ marginLeft: 8 }}>
            {copied && <span style={{ fontSize: 12, color: '#16a34a' }}>Copied!</span>}
          </div>
        </div>
      </div>
    </div>
  );
}
