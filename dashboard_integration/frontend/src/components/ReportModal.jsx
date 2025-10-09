import React from 'react';

const FOCUSABLE_SELECTORS = [
  'a[href]',
  'button:not([disabled])',
  'textarea:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  '[tabindex]:not([tabindex="-1"])'
].join(',');

export default function ReportModal({ open, onClose, report }){
  if(!open) return null;

  const [copied, setCopied] = React.useState(false);
  const dialogRef = React.useRef(null);
  const previouslyFocused = React.useRef(null);

  React.useEffect(() => {
    if (!open) return;

    // save previously focused element so we can restore focus later
    previouslyFocused.current = document.activeElement;

    function handleKey(e){
      if(e.key === 'Escape'){
        onClose && onClose();
      }

      if(e.key === 'Tab'){
        const dialog = dialogRef.current;
        if(!dialog) return;
        const nodes = Array.from(dialog.querySelectorAll(FOCUSABLE_SELECTORS)).filter(n => n.offsetParent !== null);
        if(nodes.length === 0){
          // nothing to focus, keep focus on dialog
          e.preventDefault();
          dialog.focus();
          return;
        }
        const first = nodes[0];
        const last = nodes[nodes.length - 1];

        if(e.shiftKey){
          if(document.activeElement === first || document.activeElement === dialog){
            e.preventDefault();
            last.focus();
          }
        } else {
          if(document.activeElement === last){
            e.preventDefault();
            first.focus();
          }
        }
      }
    }

    window.addEventListener('keydown', handleKey);

    // focus the first focusable element or dialog itself
    const dialog = dialogRef.current;
    if(dialog){
      const nodes = Array.from(dialog.querySelectorAll(FOCUSABLE_SELECTORS)).filter(n => n.offsetParent !== null);
      if(nodes.length) nodes[0].focus();
      else dialog.focus();
    }

    // prevent background from being keyboard-focusable by setting inert-like attributes (best-effort)
    const bodyChildren = Array.from(document.body.children).filter(c => !dialog || !dialog.contains(c));
    bodyChildren.forEach(el => el.setAttribute('aria-hidden', 'true'));

    return () => {
      window.removeEventListener('keydown', handleKey);
      // restore aria-hidden
      bodyChildren.forEach(el => el.removeAttribute('aria-hidden'));
      // restore previous focus
      try{ previouslyFocused.current && previouslyFocused.current.focus(); }catch(e){}
    };
  }, [open, onClose]);

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
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="report-modal-title"
        tabIndex={-1}
        className="w-[420px] bg-white rounded-lg p-4"
      >
        <div className="flex justify-between items-center">
          <div id="report-modal-title" className="font-semibold">Report Created</div>
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
          <button type="button" onClick={copyHash} className="px-3 py-1 bg-sky-500 text-white rounded">Copy proof hash</button>
          <button type="button" onClick={onClose} className="px-3 py-1">Close</button>
          <div className="ml-2">
            {copied && <span className="text-sm text-emerald-600">Copied!</span>}
          </div>
        </div>
      </div>
    </div>
  );
}
