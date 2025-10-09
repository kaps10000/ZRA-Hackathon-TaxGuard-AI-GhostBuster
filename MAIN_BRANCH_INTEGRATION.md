# 🎯 Dashboard Integration Guide — Main Branch APIs

**Date**: October 9, 2025  
**Your Module**: Dashboard Integration (Thomas)  
**Status**: Ready to integrate with main branch APIs ✅

---

## 🎉 Great News!

All the APIs you need are **already built and running** in the `main` branch! Your teammates have completed:

1. ✅ **Blockchain API** (Port 3001) — Core ledger system
2. ✅ **API Gateway** (Port 4000) — Unified API access point
3. ✅ **GhostBuster Module** (Ezra) — Phantom detection
4. ✅ **WhistlePro Backend** (Kelvin) — Whistleblower reports
5. ✅ **AI Risk Scoring** (Shuan) — Risk analysis
6. ✅ **Predictive Analytics** (Emmanuel) — Forecasting

---

## 🗺️ System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│        Your Dashboard (Thomas) — Port 3000                  │
│        C:\...\dashboard_integration\frontend                │
└────────────────────────┬────────────────────────────────────┘
                         │ HTTP Requests
                         ▼
┌─────────────────────────────────────────────────────────────┐
│           API Gateway — Port 4000                            │
│           C:\...\api-gateway\server.js                      │
│                                                              │
│  Routes:                                                     │
│  • /api/events — Blockchain events                          │
│  • /api/ghostbuster — Phantom detections                    │
│  • /api/whistlepro — Whistleblower reports                  │
│  • /api/ai-risk — Risk scoring                              │
│  • /api/predictive — Analytics                              │
│  • /health — System health                                  │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│        Blockchain API — Port 3001                            │
│        C:\...\blockchain\api\server.js                      │
│                                                              │
│  • Immutable ledger                                          │
│  • Smart contracts                                           │
│  • Event recording                                           │
└─────────────────────────────────────────────────────────────┘
```

---

## 🚀 Quick Start: Run All APIs

### Step 1: Start Blockchain API (Port 3001)
```powershell
cd C:\ZRA-Hackathon-TaxGuard-AI-GhostBuster
git checkout main
cd blockchain
npm install  # First time only
npm start
```

**✅ Expected output**: "Blockchain API listening on port 3001"

---

### Step 2: Start API Gateway (Port 4000)
Open a **new PowerShell window**:
```powershell
cd C:\ZRA-Hackathon-TaxGuard-AI-GhostBuster\api-gateway
npm install  # First time only
npm start
```

**✅ Expected output**: "API Gateway running on port 4000"

---

### Step 3: Start Your Dashboard (Port 3000)
Open a **new PowerShell window**:
```powershell
cd C:\ZRA-Hackathon-TaxGuard-AI-GhostBuster
git checkout Thomas
cd dashboard_integration\frontend
npm run dev
```

**✅ Expected output**: "Local: http://localhost:3000"

---

### Step 4: Verify All Services Running
Open a **new PowerShell window**:
```powershell
# Test Blockchain API
curl http://localhost:3001/health

# Test API Gateway
curl http://localhost:4000/health

# Test Your Dashboard
curl http://localhost:3000
```

---

## 📡 Available API Endpoints

### 1. GhostBuster Detection API

**Base URL**: `http://localhost:4000/api/ghostbuster`

#### POST /detection — Submit Detection
```javascript
// Your dashboard sends this to record a phantom detection
const detection = {
  detectionType: "phantom_employee",
  entityId: "TPN-12345-ANON",
  confidenceScore: 95,
  detectionMethod: "pattern_analysis",
  indicators: [
    "No biometric records",
    "Multiple employees same address"
  ],
  severity: "HIGH",
  investigatorId: "ghostbuster-ai",
  evidenceHash: "a3f7e92b...",
  metadata: {
    department: "Ministry of Finance",
    detectionDate: "2025-10-09"
  }
};

const response = await fetch('http://localhost:4000/api/ghostbuster/detection', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(detection)
});

const result = await response.json();
console.log(result.detection.detectionId);
console.log(result.detection.blockIndex);
```

#### GET /detections — Get All Detections
```javascript
// Get recent detections for your dashboard
const response = await fetch('http://localhost:4000/api/ghostbuster/detections?limit=10&severity=HIGH');
const { detections } = await response.json();

// Display in your dashboard
detections.forEach(d => {
  console.log(`${d.detectionId}: ${d.confidenceScore}%`);
});
```

#### GET /stats — Detection Statistics
```javascript
// Get stats for your dashboard overview
const response = await fetch('http://localhost:4000/api/ghostbuster/stats');
const { stats } = await response.json();

console.log(`Total detections: ${stats.total}`);
console.log(`Phantom employees: ${stats.byType.phantom_employee}`);
console.log(`Ghost companies: ${stats.byType.ghost_company}`);
```

---

### 2. WhistlePro API

**Base URL**: `http://localhost:4000/api/whistlepro`

#### POST /report — Submit Whistleblower Report
```javascript
const report = {
  reportType: "corruption",
  severity: "HIGH",
  description: "Suspected tax evasion by XYZ Corp",
  evidenceHash: "e3b0c44298fc...",
  anonymousId: "WB-" + Date.now(),
  location: "Lusaka Province",
  involvedParties: ["Company A", "Official B"]
};

const response = await fetch('http://localhost:4000/api/whistlepro/report', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(report)
});
```

#### GET /reports — Get All Reports
```javascript
// Get recent whistleblower reports
const response = await fetch('http://localhost:4000/api/whistlepro/reports?status=pending');
const { reports } = await response.json();
```

---

### 3. AI Risk Scoring API

**Base URL**: `http://localhost:4000/api/ai-risk`

#### POST /score — Calculate Risk Score
```javascript
const entityData = {
  entityId: "TPN-12345",
  entityType: "individual",
  features: {
    filingHistory: "irregular",
    incomeVariability: "high",
    industryRisk: "medium"
  }
};

const response = await fetch('http://localhost:4000/api/ai-risk/score', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(entityData)
});

const { riskScore, riskLevel, factors } = await response.json();
console.log(`Risk Score: ${riskScore}/100 (${riskLevel})`);
```

#### GET /high-risk — Get High-Risk Entities
```javascript
// Get list of high-risk taxpayers for dashboard alerts
const response = await fetch('http://localhost:4000/api/ai-risk/high-risk?threshold=75');
const { entities } = await response.json();
```

---

### 4. Blockchain Events API

**Base URL**: `http://localhost:4000/api/events`

#### POST /events — Record Event on Blockchain
```javascript
const event = {
  eventType: "filing",
  anonymizedUserId: "TPN-12345-ANON",
  hashOfPayload: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
  notes: "VAT filing Q3-2025"
};

const response = await fetch('http://localhost:4000/api/events', {
  method: 'POST',
  headers: { 
    'Content-Type': 'application/json',
    'Authorization': 'Bearer ' + token  // Optional: some endpoints need auth
  },
  body: JSON.stringify(event)
});
```

#### GET /events — Get All Events
```javascript
// Get recent blockchain events for dashboard feed
const response = await fetch('http://localhost:4000/api/events?limit=20');
const { events } = await response.json();
```

---

### 5. System Health API

**Base URL**: `http://localhost:4000/health`

#### GET /health — System Health Check
```javascript
// Monitor system health in your dashboard
const response = await fetch('http://localhost:4000/health');
const health = await response.json();

console.log(`Status: ${health.status}`);
console.log(`Uptime: ${health.uptime}s`);
console.log(`Blockchain: ${health.services.blockchain}`);
console.log(`Database: ${health.services.database}`);
```

---

## 🔌 Integrating with Your Dashboard

### Step 1: Update Your Mock API to Proxy Real APIs

**File**: `dashboard_integration/api_integration/index.js`

Add proxy routes to forward requests to the real API Gateway:

```javascript
const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');
const app = express();

app.use(cors());
app.use(express.json());

// API Gateway URL
const API_GATEWAY = 'http://localhost:4000';

// Proxy: GhostBuster endpoints
app.post('/api/ghost-check', async (req, res) => {
  try {
    const response = await fetch(`${API_GATEWAY}/api/ghostbuster/detection`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req.body)
    });
    const data = await response.json();
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/ghost-check/detections', async (req, res) => {
  try {
    const response = await fetch(`${API_GATEWAY}/api/ghostbuster/detections`);
    const data = await response.json();
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Proxy: WhistlePro endpoints
app.post('/api/whistlepro/report', async (req, res) => {
  try {
    const response = await fetch(`${API_GATEWAY}/api/whistlepro/report`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req.body)
    });
    const data = await response.json();
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Proxy: AI Risk Scoring
app.post('/api/ai-risk/score', async (req, res) => {
  try {
    const response = await fetch(`${API_GATEWAY}/api/ai-risk/score`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req.body)
    });
    const data = await response.json();
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Health check for the real API Gateway
app.get('/api/health', async (req, res) => {
  try {
    const response = await fetch(`${API_GATEWAY}/health`);
    const data = await response.json();
    res.json(data);
  } catch (error) {
    res.json({ status: 'error', message: error.message });
  }
});

// Keep existing mock endpoints as fallback
app.post('/api/report', (req, res) => {
  // Your existing mock report endpoint
  res.json({
    status: 'ok',
    case_id: 'R-' + Math.floor(Math.random() * 100000),
    proof_hash: 'mock-hash-' + Date.now(),
    created_at: Date.now()
  });
});

const PORT = 4000;
app.listen(PORT, () => {
  console.log(`Dashboard API (with proxy) running on http://localhost:${PORT}`);
});
```

---

### Step 2: Update Frontend to Use Real APIs

Your frontend is already configured to use `/api` endpoints through Vite proxy (port 3000 → port 4000), so **no frontend changes needed**!

The Vite config already has:
```javascript
// dashboard_integration/frontend/vite.config.js
server: {
  port: 3000,
  proxy: {
    '/api': 'http://localhost:4000'  // ✅ Already configured!
  }
}
```

This means when your React app calls `/api/ghost-check`, Vite automatically forwards it to `http://localhost:4000/api/ghost-check`.

---

### Step 3: Test Integration

1. **Start all services** (Blockchain → API Gateway → Dashboard)
2. **Open your dashboard**: http://localhost:3000
3. **Open Settings panel**
4. **Uncheck "Use Mock APIs"** (this switches to live mode)
5. **Run a Ghost-Check** with a real company ID
6. **Verify** the detection appears in the API Gateway logs

---

## 📊 Dashboard Data Flow

```
User Action (Dashboard)
        ↓
React Component calls /api/ghost-check
        ↓
Vite Proxy forwards to http://localhost:4000/api/ghost-check
        ↓
Your API Integration (index.js) proxies to http://localhost:4000/api/ghostbuster/detection
        ↓
API Gateway forwards to Blockchain API
        ↓
Blockchain records event and returns response
        ↓
Response flows back through the chain
        ↓
Dashboard displays result
```

---

## 🧪 Testing Checklist

- [ ] Blockchain API running on port 3001
- [ ] API Gateway running on port 4000
- [ ] Dashboard running on port 3000
- [ ] Can access http://localhost:4000/health (returns 200 OK)
- [ ] Can access http://localhost:3001/health (returns 200 OK)
- [ ] Dashboard Settings shows "Connected: Live" when mock mode is off
- [ ] Ghost-Check returns real data from API Gateway
- [ ] Reports are recorded on blockchain
- [ ] Session Reports show blockchain event IDs

---

## 🎯 Next Steps

1. ✅ **Run all APIs** using the Quick Start commands above
2. ✅ **Update your API proxy** (index.js) to forward requests
3. ✅ **Test with Settings panel** (toggle mock/live mode)
4. ✅ **Verify blockchain events** in API Gateway logs
5. ✅ **Document integration** in your testing report

---

## 📝 Important Notes

### Port Configuration
- **Blockchain API**: 3001 (already running in main branch)
- **API Gateway**: 4000 (already running in main branch)
- **Your Dashboard**: 3000 (your Thomas branch)
- **Your Mock API**: Also 4000 (conflict! — see solution below)

### Port Conflict Solution

Since both API Gateway (main) and your mock API (Thomas) use port 4000, you have **two options**:

**Option A: Change Your Mock API Port**
```javascript
// dashboard_integration/api_integration/index.js
const PORT = 4001;  // Change from 4000 to 4001
app.listen(PORT, () => console.log(`Running on ${PORT}`));
```

Then update Vite config:
```javascript
// dashboard_integration/frontend/vite.config.js
proxy: {
  '/api': 'http://localhost:4001'  // Point to your proxy on 4001
}
```

**Option B: Skip Your Mock API (Recommended)**
- Don't run your mock API at all
- Point Vite directly to API Gateway on port 4000
- Your mock API becomes unnecessary once real APIs are running

**Recommended Flow**:
```
Dashboard (3000) → Vite Proxy → API Gateway (4000) → Blockchain (3001)
```

---

## 🆘 Troubleshooting

### "Cannot connect to API Gateway"
```powershell
# Check if API Gateway is running
curl http://localhost:4000/health

# If not running, start it
cd api-gateway
npm start
```

### "Port 4000 already in use"
```powershell
# Find process using port 4000
netstat -ano | findstr :4000

# Kill the process (replace PID with actual number)
taskkill /PID <PID> /F
```

### "Blockchain API not responding"
```powershell
# Check if Blockchain is running
curl http://localhost:3001/health

# If not running, start it
cd blockchain
npm start
```

---

## 📚 Additional Resources

From the main branch:
- **TEAM_INTEGRATION_DOCUMENTATION.md** — Full API specs for all modules
- **QUICK_START_GUIDE.md** — How to run all services
- **API_TEST_RESULTS.md** — API testing documentation
- **BLOCKCHAIN_APIs.README** — Blockchain API reference

---

## ✅ Integration Completion Checklist

- [ ] Cloned main branch and explored APIs
- [ ] Started Blockchain API (port 3001)
- [ ] Started API Gateway (port 4000)
- [ ] Started Dashboard (port 3000)
- [ ] Updated API proxy to forward to real endpoints
- [ ] Tested Ghost-Check with live API
- [ ] Verified blockchain event recording
- [ ] Tested WhistlePro integration
- [ ] Tested AI Risk Scoring integration
- [ ] Updated TESTING_RESULTS.md with integration tests
- [ ] Committed changes to Thomas branch
- [ ] Ready for final demo! 🎉

---

**Author**: GitHub Copilot  
**Date**: October 9, 2025  
**Status**: Ready for Integration ✅
