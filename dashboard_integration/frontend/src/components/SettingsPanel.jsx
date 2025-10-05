import React from 'react';

export default function SettingsPanel({ demoMode, setDemoMode, apiBaseUrl, setApiBaseUrl, onClose }){
  const [localUrl, setLocalUrl] = React.useState(apiBaseUrl || 'http://localhost:4000');

  const [testStatus, setTestStatus] = React.useState('idle'); // idle, testing, ok, failed
  const [testMessage, setTestMessage] = React.useState('');

  async function testUrl(){
    setTestStatus('testing');
    setTestMessage('Testing...');
    try {
      const res = await fetch((localUrl||'') + '/api/health');
      if(!res.ok) throw new Error('status ' + res.status);
      const json = await res.json();
      setTestStatus('ok');
      setTestMessage('OK: ' + JSON.stringify(json));
    } catch (e){
      setTestStatus('failed');
      setTestMessage('Failed: ' + e.message);
    }
  }

  function save(){
    setApiBaseUrl(localUrl);
    onClose();
  }

  return (
    <div style={{ width: 360, background: '#fff', border: '1px solid #ddd', borderRadius: 8, boxShadow: '0 6px 18px rgba(0,0,0,0.08)', padding: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <div style={{ fontWeight: 600 }}>Settings</div>
        <button onClick={onClose} style={{ fontSize: 12, padding: '4px 8px' }}>Close</button>
      </div>

      <div style={{ marginBottom: 8 }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <input type="checkbox" checked={demoMode} onChange={e => setDemoMode(e.target.checked)} />
          <span>Use Mock APIs</span>
        </label>
        <div style={{ fontSize: 12, color: '#666', marginTop: 6 }}>Toggle between mock and live API endpoints.</div>
      </div>

      <div style={{ marginTop: 8 }}>
        <div style={{ fontSize: 12, color: '#444', marginBottom: 6 }}>Live API Base URL</div>
        <input value={localUrl} onChange={e=>setLocalUrl(e.target.value)} style={{ width: '100%', padding: 8, border: '1px solid #ddd', borderRadius: 6 }} />
        <div style={{ display: 'flex', gap: 8, marginTop: 8, alignItems: 'center' }}>
          <button onClick={testUrl} style={{ padding: '6px 10px' }}>Test</button>
          <button onClick={save} style={{ padding: '6px 10px' }}>Save</button>
          <div style={{ marginLeft: 8 }}>
            {testStatus === 'idle' && <div style={{ fontSize: 12, color: '#666' }}>Idle</div>}
            {testStatus === 'testing' && <div style={{ fontSize: 12, color: '#0ea5e9' }}>Testing…</div>}
            {testStatus === 'ok' && <div style={{ fontSize: 12, color: '#16a34a' }}>{testMessage}</div>}
            {testStatus === 'failed' && <div style={{ fontSize: 12, color: '#dc2626' }}>{testMessage}</div>}
          </div>
        </div>
      </div>

    </div>
  );
}
