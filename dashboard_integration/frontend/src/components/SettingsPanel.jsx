import React from 'react';

export default function SettingsPanel({ demoMode, setDemoMode, onClose }){
  return (
    <div style={{ width: 320, background: '#fff', border: '1px solid #ddd', borderRadius: 8, boxShadow: '0 6px 18px rgba(0,0,0,0.08)', padding: 12 }}>
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

    </div>
  );
}
