import React from 'react';

export default function SettingsPanel({ demoMode, setDemoMode, apiBaseUrl, setApiBaseUrl, onClose }){
  const [localUrl, setLocalUrl] = React.useState(apiBaseUrl || 'http://localhost:4000');

  const [testStatus, setTestStatus] = React.useState('idle'); // idle, testing, ok, failed
  const [testMessage, setTestMessage] = React.useState('');
  const [saveMsg, setSaveMsg] = React.useState('');

  // GhostBuster runtime config lifted here so Save can POST it
  const [ghostMode, setGhostMode] = React.useState('mock');
  const [ghostUrl, setGhostUrl] = React.useState('');
  const [ghostMsg, setGhostMsg] = React.useState('');
  const [ghostLoading, setGhostLoading] = React.useState(false);
  const [ghostLoadError, setGhostLoadError] = React.useState('');

  React.useEffect(()=>{
    (async ()=>{
      setGhostLoading(true);
      try{
        const res = await fetch('/api/_ghost-config');
        if(!res.ok) throw new Error('status ' + res.status);
        const j = await res.json();
        if(j && j.config){ setGhostMode(j.config.mode||'mock'); setGhostUrl(j.config.url||''); }
      }catch(e){ setGhostLoadError('Failed to load server config'); }
      setGhostLoading(false);
    })();
  }, []);

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

  async function save(){
    setApiBaseUrl(localUrl);
    try{
      localStorage.setItem('taxguard:demoMode', JSON.stringify(demoMode));
      localStorage.setItem('taxguard:apiBaseUrl', localUrl);
    }catch(e){ /* ignore storage errors */ }

    // attempt to POST the ghost runtime config to server
    try{
      const res = await fetch('/api/_ghost-config', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ mode: ghostMode, url: ghostUrl }) });
      if(!res.ok) throw new Error('status ' + res.status);
      setGhostMsg('Server config saved');
    }catch(e){
      setGhostMsg('Server save failed');
    }

    setSaveMsg('Saved');
    setTimeout(()=>setSaveMsg(''), 1800);
    onClose();
  }

  return (
    <div style={{ width: 360, background: '#fff', border: '1px solid #ddd', borderRadius: 8, boxShadow: '0 6px 18px rgba(0,0,0,0.08)', padding: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <div>
          <div style={{ fontWeight: 600 }}>Settings</div>
          <div style={{ fontSize: 12, color: '#666' }}>
            {ghostLoading && 'Server: loading...'}
            {!ghostLoading && ghostLoadError && 'Server: not available'}
            {!ghostLoading && !ghostLoadError && <span>Server: <strong>{ghostMode}</strong> {ghostUrl ? `— ${ghostUrl}` : ''}</span>}
          </div>
        </div>
        <button onClick={onClose} style={{ fontSize: 12, padding: '4px 8px' }}>Close</button>
      </div>

      <div style={{ marginBottom: 8 }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <input type="checkbox" checked={demoMode} onChange={e => {
            const val = e.target.checked;
            setDemoMode(val);
            // if switching to demo/mock, point base URL to local API path
            if(val){ setLocalUrl('/api'); }
          }} />
          <span>Use Mock APIs</span>
        </label>
        <div style={{ fontSize: 12, color: '#666', marginTop: 6 }}>Toggle between mock and live API endpoints.</div>
      </div>

      <div style={{ marginTop: 8 }}>
        {/* GhostBuster runtime config (lifted state) */}
        <div style={{ marginBottom: 8 }}>
          <div style={{ fontSize: 12, color: '#444', marginBottom: 6 }}>GhostBuster runtime (mock/proxy)</div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 6 }}>
            <select value={ghostMode} onChange={e=>setGhostMode(e.target.value)}>
              <option value="mock">mock</option>
              <option value="proxy">proxy</option>
            </select>
            <input value={ghostUrl} onChange={e=>setGhostUrl(e.target.value)} placeholder="Proxy URL (e.g. https://api.example/ghost-check)" style={{ flex: 1, padding: 8, border: '1px solid #ddd', borderRadius: 6 }} />
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <button onClick={async ()=>{
              try{
                const res = await fetch('/api/_ghost-config', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ mode: ghostMode, url: ghostUrl }) });
                if(!res.ok) throw new Error('status ' + res.status);
                setGhostMsg('Saved');
                setTimeout(()=>setGhostMsg(''),2000);
              }catch(e){ setGhostMsg('Failed to save: ' + e.message); }
            }} style={{ padding: '6px 10px' }}>Save ghost config</button>
            <div style={{ fontSize: 12, color: '#666' }}>{ghostMsg}{ghostLoading? ' Loading...' : ''}{ghostLoadError? ' ' + ghostLoadError : ''}</div>
          </div>
        </div>
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
            {saveMsg && <div style={{ fontSize: 12, color: '#16a34a' }}>{saveMsg}</div>}
          </div>
        </div>
      </div>

    </div>
  );
}

function GhostBusterConfig(){
  const [ghostMode, setGhostMode] = React.useState('mock');
  const [ghostUrl, setGhostUrl] = React.useState('');
  const [ghostMsg, setGhostMsg] = React.useState('');

  React.useEffect(()=>{
    (async()=>{
      try{
        const res = await fetch('/api/_ghost-config');
        if(!res.ok) return;
        const j = await res.json();
        if(j && j.config){ setGhostMode(j.config.mode||'mock'); setGhostUrl(j.config.url||''); }
      }catch(e){ /* ignore */ }
    })();
  },[]);

  async function saveGhostConfig(){
    try{
      const res = await fetch('/api/_ghost-config', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ mode: ghostMode, url: ghostUrl }) });
      if(!res.ok) throw new Error('status ' + res.status);
      setGhostMsg('Saved');
      setTimeout(()=>setGhostMsg(''),2000);
    }catch(e){ setGhostMsg('Failed to save: ' + e.message); }
  }

  return (
    <div style={{ marginBottom: 8 }}>
      <div style={{ fontSize: 12, color: '#444', marginBottom: 6 }}>GhostBuster runtime (mock/proxy)</div>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 6 }}>
        <select value={ghostMode} onChange={e=>setGhostMode(e.target.value)}>
          <option value="mock">mock</option>
          <option value="proxy">proxy</option>
        </select>
        <input value={ghostUrl} onChange={e=>setGhostUrl(e.target.value)} placeholder="Proxy URL (e.g. https://api.example/ghost-check)" style={{ flex: 1, padding: 8, border: '1px solid #ddd', borderRadius: 6 }} />
      </div>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <button onClick={saveGhostConfig} style={{ padding: '6px 10px' }}>Save ghost config</button>
        <div style={{ fontSize: 12, color: '#666' }}>{ghostMsg}</div>
      </div>
    </div>
  );
}
