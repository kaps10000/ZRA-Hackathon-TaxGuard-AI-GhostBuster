# Integration Guide — TaxGuard AI System

This document helps integrate all team modules into the complete TaxGuard AI system.

## Current System Architecture

### Dashboard Integration Module (YOUR PART - COMPLETE ✅)

**What it does:**
- React frontend investigator dashboard (Vite)
- Express mock API with runtime proxy support
- Runtime config system for switching between mock/live endpoints

**Provides these capabilities:**
- Ghost-Check UI flow (company ID → alert → report creation)
- ReportModal with proof hash copy
- ReportHistory (session-based, localStorage)
- SettingsPanel (runtime config, demo/live toggle)
- Mock API endpoints:
  - `POST /api/ghost-check` → returns ghost analysis
  - `POST /api/report` → creates tamper-proof report
  - `GET/POST /api/_ghost-config` → runtime proxy configuration
  - `GET /api/health` → health check

**Tech stack:**
- Frontend: React 18 + Vite + Tailwind CSS + axios
- API: Node.js + Express + CORS + node-fetch (for proxying)
- Tests: Jest + React Testing Library (7 tests, all passing)

---

## Integration Requirements from Teammates

### Template for Each Teammate Module

Send this to each teammate and ask them to fill it out:

```markdown
## Module: [MODULE_NAME]

### 1. Service Information
- **Module name**: 
- **Purpose** (one sentence): 
- **Local dev URL**: (e.g., http://localhost:8000)
- **Deployed URL** (if available): 

### 2. API Endpoints

List each endpoint your service exposes:

#### Endpoint 1
- **URL**: 
- **Method**: (GET, POST, etc.)
- **Request Headers**: (e.g., Content-Type, Authorization, API-Key)
- **Request Body** (example JSON):
```json
{
  "example_field": "value"
}
```
- **Response Body** (success example JSON):
```json
{
  "example_response": "value"
}
```
- **Error Responses**:
  - 400: [describe when this happens]
  - 401: [describe when this happens]
  - 500: [describe when this happens]

#### Endpoint 2
[repeat format above for each endpoint]

### 3. Authentication / Security
- **Does your service require authentication?** Yes / No
- **If yes, what type?**:
  - [ ] API Key (provide key or how to generate)
  - [ ] Bearer Token (provide token or how to generate)
  - [ ] Basic Auth (provide username/password)
  - [ ] Other: [describe]
- **Required headers**: (e.g., `X-API-Key: xxx`, `Authorization: Bearer xxx`)

### 4. Running Your Service Locally
Provide exact commands to run your service:

```bash
# Step 1: Install dependencies
[your command here]

# Step 2: Start service
[your command here]

# Step 3: Verify it's running
curl http://localhost:[PORT]/health
```

- **Port(s) used**: 
- **Environment variables needed**: (list any .env vars required)
- **Dependencies**: (database, Redis, external APIs, etc.)

### 5. Test Data

Provide sample test inputs and expected outputs:

**Valid Test Case**:
- Input: 
```json
{
  "company_id": "G-9001"
}
```
- Expected Output:
```json
{
  "result": "example"
}
```

**Error Test Case**:
- Input:
```json
{
  "company_id": "INVALID"
}
```
- Expected Output:
```json
{
  "error": "Company not found"
}
```

### 6. Integration Status
- [ ] Service is ready for integration
- [ ] Service needs more work (describe what's pending):
- **Blockers** (if any): 

### 7. Documentation
- **Link to API docs** (if available): 
- **Link to README**: 
- **Contact person for questions**: 

```

---

## Expected Team Modules (Fill this in after receiving teammate responses)

### Module 1: [NAME - e.g., GhostBuster Detection Engine]
**Status**: ⏳ Waiting for info from teammate  
**Contact**: [teammate name]

_[Once you receive their filled template, paste it here]_

---

### Module 2: [NAME - e.g., Blockchain Proof Service]
**Status**: ⏳ Waiting for info from teammate  
**Contact**: [teammate name]

_[Once you receive their filled template, paste it here]_

---

### Module 3: [NAME - e.g., Data Ingestion Pipeline]
**Status**: ⏳ Waiting for info from teammate  
**Contact**: [teammate name]

_[Once you receive their filled template, paste it here]_

---

## Integration Checklist

Use this checklist to track integration progress for each module:

### Phase 1: Information Gathering
- [ ] Sent integration template to all 3 teammates
- [ ] Received completed templates from all teammates
- [ ] Verified all endpoints are documented
- [ ] Identified any authentication requirements

### Phase 2: Local Setup
- [ ] Can run Module 1 locally
- [ ] Can run Module 2 locally
- [ ] Can run Module 3 locally
- [ ] Can run dashboard + all modules together

### Phase 3: API Integration (per module)

For each module, complete these steps:

**Module 1: [NAME]**
- [ ] Updated `api_integration/index.js` with proxy routes
- [ ] Updated `SettingsPanel` with module config
- [ ] Tested health check endpoint
- [ ] Tested all endpoints with sample data
- [ ] Handled error cases (timeouts, 4xx, 5xx)
- [ ] Added integration test

**Module 2: [NAME]**
- [ ] Updated `api_integration/index.js` with proxy routes
- [ ] Updated `SettingsPanel` with module config
- [ ] Tested health check endpoint
- [ ] Tested all endpoints with sample data
- [ ] Handled error cases (timeouts, 4xx, 5xx)
- [ ] Added integration test

**Module 3: [NAME]**
- [ ] Updated `api_integration/index.js` with proxy routes
- [ ] Updated `SettingsPanel` with module config
- [ ] Tested health check endpoint
- [ ] Tested all endpoints with sample data
- [ ] Handled error cases (timeouts, 4xx, 5xx)
- [ ] Added integration test

### Phase 4: End-to-End Testing
- [ ] Tested full flow: Ghost-Check → Report → Proof
- [ ] Verified all modules communicate correctly
- [ ] Tested error handling (one module down, others still work)
- [ ] Tested authentication flows
- [ ] Documented known issues

### Phase 5: Documentation & Deployment
- [ ] Updated README with full system architecture
- [ ] Created docker-compose or unified start script
- [ ] Documented integration issues and solutions
- [ ] Created deployment guide (if needed)

---

## Integration Code Changes Needed

Once you receive teammate info, you'll need to update these files:

### 1. `dashboard_integration/api_integration/index.js`

Add proxy routes for each teammate service:

```javascript
// Example: Proxy to GhostBuster module
app.post('/api/ghost-check-real', async (req, res) => {
  try {
    const ghostbusterUrl = process.env.GHOSTBUSTER_URL || 'http://localhost:8001';
    const response = await fetch(`${ghostbusterUrl}/analyze`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        // Add auth headers if needed
        // 'X-API-Key': process.env.GHOSTBUSTER_API_KEY
      },
      body: JSON.stringify(req.body)
    });
    const data = await response.json();
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to connect to GhostBuster service' });
  }
});

// Repeat for each teammate module...
```

### 2. `dashboard_integration/frontend/src/components/SettingsPanel.jsx`

Add configuration UI for each service:

```jsx
// Add state for each service
const [ghostbusterUrl, setGhostbusterUrl] = React.useState('http://localhost:8001');
const [blockchainUrl, setBlockchainUrl] = React.useState('http://localhost:8002');
// ... etc

// Add UI sections for each service config
<div>
  <label>GhostBuster Service URL</label>
  <input value={ghostbusterUrl} onChange={e=>setGhostbusterUrl(e.target.value)} />
  <button onClick={()=>testService(ghostbusterUrl)}>Test</button>
</div>
```

### 3. Environment Configuration

Create `.env.example` file:

```bash
# Dashboard API
PORT=4000

# Teammate Services
GHOSTBUSTER_URL=http://localhost:8001
GHOSTBUSTER_API_KEY=your_key_here

BLOCKCHAIN_URL=http://localhost:8002
BLOCKCHAIN_API_KEY=your_key_here

# Add more as needed...
```

---

## Common Integration Issues & Solutions

### Issue 1: CORS Errors
**Symptom**: Browser shows "blocked by CORS policy"  
**Solution**: Ensure teammate services have CORS enabled:
```javascript
// In their Express app
app.use(cors({
  origin: 'http://localhost:5173', // Vite dev server
  credentials: true
}));
```

### Issue 2: Port Conflicts
**Symptom**: Service won't start, says port is in use  
**Solution**: Document all ports being used:
- 3000-5173: Frontend (Vite)
- 4000: Dashboard mock API
- 8001: GhostBuster module
- 8002: Blockchain module
- etc.

### Issue 3: Authentication Failures
**Symptom**: 401 Unauthorized errors  
**Solution**: Verify API keys are correctly passed in headers:
```javascript
const response = await fetch(url, {
  headers: {
    'X-API-Key': process.env.API_KEY, // Check this exists
    'Content-Type': 'application/json'
  }
});
```

### Issue 4: Different Request/Response Formats
**Symptom**: Service returns data but frontend can't parse it  
**Solution**: Add adapter/transformer functions:
```javascript
// Adapter to convert teammate's format to our format
function adaptGhostBusterResponse(theirFormat) {
  return {
    alert_id: theirFormat.id,
    ghost_score: theirFormat.score,
    issues: theirFormat.findings
  };
}
```

---

## Next Steps (After Integration)

Once all modules are integrated:

1. **Create unified launcher script** (like `start-all.sh` or `docker-compose.yml`)
2. **Add E2E integration tests** (test full flow across all services)
3. **Document the complete system** (architecture diagram, data flow)
4. **Create deployment guide** (how to deploy all services together)
5. **Demo preparation** (create demo script, prepare sample data)

---

## Questions?

If you have questions during integration, note them here and bring them up with the team:

- [ ] Question 1: [your question]
- [ ] Question 2: [your question]

---

**Last Updated**: [Date]  
**Status**: Ready for teammate responses  
**Next Action**: Send integration template to 3 teammates and collect responses
