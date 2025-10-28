const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');

const app = express();
app.use(cors());
app.use(bodyParser.json());

const fetch = require('node-fetch');

// Configuration: set GHOSTBUSTER_MODE=proxy and GHOSTBUSTER_URL to forward requests
const GHOSTBUSTER_MODE = process.env.GHOSTBUSTER_MODE || 'mock'; // 'mock' or 'proxy'
const GHOSTBUSTER_URL = process.env.GHOSTBUSTER_URL || '';

const DATA_DIR = path.join(__dirname, 'data');
const FS = require('fs');
const CONFIG_FILE = path.join(__dirname, '.ghost-config.json');

function loadConfig(){
  try{
    if(FS.existsSync(CONFIG_FILE)){
      const raw = FS.readFileSync(CONFIG_FILE, 'utf8');
      return JSON.parse(raw);
    }
  }catch(e){ console.warn('Failed to read ghost config', e); }
  return { mode: GHOSTBUSTER_MODE, url: GHOSTBUSTER_URL };
}

function saveConfig(obj){
  try{ FS.writeFileSync(CONFIG_FILE, JSON.stringify(obj, null, 2), 'utf8'); }catch(e){ console.warn('Failed to write ghost config', e); }
}

let runtimeConfig = loadConfig();

app.get('/api/risk-top', (req, res) => {
  res.sendFile(path.join(DATA_DIR, 'risk_top.json'));
});

app.get('/api/ghost-alerts', (req, res) => {
  res.sendFile(path.join(DATA_DIR, 'ghost_alerts.json'));
});

// Config endpoints (local-only)
function isLocalRequest(req){
  const ip = req.ip || req.connection && req.connection.remoteAddress || '';
  return ip === '127.0.0.1' || ip === '::1' || ip === '::ffff:127.0.0.1';
}

app.get('/api/_ghost-config', (req, res) => {
  const cfg = loadConfig();
  res.json({ status: 'ok', config: cfg });
});

app.post('/api/_ghost-config', (req, res) => {
  if(!isLocalRequest(req)) return res.status(403).json({ status: 'error', message: 'forbidden' });
  const body = req.body || {};
  const mode = body.mode === 'proxy' ? 'proxy' : 'mock';
  const url = body.url || '';
  runtimeConfig = { mode, url };
  saveConfig(runtimeConfig);
  res.json({ status: 'ok', config: runtimeConfig });
});

app.post('/api/ghost-check', (req, res) => {
  // If configured to proxy, forward the request to the real GhostBuster endpoint
  const mode = runtimeConfig.mode || GHOSTBUSTER_MODE;
  const url = runtimeConfig.url || GHOSTBUSTER_URL;
  if (mode === 'proxy' && url) {
    (async () => {
      try {
        const upstreamRes = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(req.body),
        });
        const data = await upstreamRes.json();
        return res.status(upstreamRes.status).json(data);
      } catch (e) {
        console.error('GhostBuster proxy error:', e);
        return res.status(502).json({ status: 'error', message: 'Failed to proxy to GhostBuster' });
      }
    })();
    return;
  }

  // Fallback: Very simple mock: if payload contains company_id with '9001' -> return a high-risk alert
  const payload = req.body;
  const companyId = payload.company_id || payload.companyId || 'unknown';

  if (companyId && typeof companyId === 'string' && companyId.includes('9001')) {
    return res.json({ status: 'ok', result: { alert_id: 'G-MOCK1', ghost_score: 93, issues: ['Director mismatch', 'Duplicate NRC'] } });
  }

  return res.json({ status: 'ok', result: { alert_id: 'G-MOCK2', ghost_score: 12, issues: [] } });
});

app.post('/api/report', (req, res) => {
  const report = req.body;
  // mock case id and hash
  const caseId = 'R-' + Math.floor(Math.random() * 90000 + 10000);
  const hash = Buffer.from(JSON.stringify(report)).toString('base64').slice(0, 20);
  res.json({ status: 'ok', case_id: caseId, proof_hash: hash });
});

app.get('/api/forecast', (req, res) => {
  res.json({ status: 'ok', baseline: 120000000, scenarios: [{ name: 'Copper -10%', impact: -5000000 }, { name: 'Copper +15%', impact: 7000000 }] });
});

// Root and health endpoints
app.get('/', (req, res) => {
  res.type('text').send(
    'TaxGuard Mock API - available routes:\n' +
    '/api/risk-top\n' +
    '/api/ghost-alerts\n' +
    '/api/ghost-check (POST)\n' +
    '/api/report (POST)\n' +
    '/api/forecast\n' +
    '/api/health\n'
  );
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', uptime: process.uptime() });
});

const port = process.env.PORT || 4001;
const server = app.listen(port, () => console.log(`Mock API server listening on http://localhost:${port}`));

server.on('error', (err) => {
  if (err && err.code === 'EADDRINUSE') {
    console.error(`\nError: port ${port} is already in use.\n` +
      `If you already have the mock server running, stop it or start this server on a different port:\n` +
      `  - To run on a different port (PowerShell): $env:PORT=4001; npm start\n` +
      `  - To find and kill the process using the port: netstat -ano | findstr :${port} -> note PID, then taskkill /PID <pid> /F\n`
    );
    process.exit(1);
  }
  console.error('Server error:', err);
  process.exit(1);
});
