# ZRA TaxGuard AI - Port Configuration

## Current Port Assignments

All services have been configured with the following port assignments:

| Service | Port | Status | URL | Notes |
|---------|------|--------|-----|-------|
| **Dashboard Frontend** | 3000 | ✅ Active | http://localhost:3000 | React + Vite integrated dashboard |
| **Blockchain Service** | 3001 | ✅ Active | http://localhost:3001/explorer | Node.js blockchain explorer |
| **GhostBuster Frontend** | 3004 | ✅ Updated | http://localhost:3004 | React Material-UI standalone app |
| **GhostBuster Backend** | 3005 | ✅ Active | http://localhost:3005/api | Flask API for ghost detection |
| **WhistlePro Backend** | 4000 | ✅ Updated | http://localhost:4000/api | Node.js whistleblower reporting |
| **API Gateway** | 4001 | ✅ Updated | http://localhost:4001/api | Main Node.js API gateway |
| **Main Flask Backend (OCR)** | 5000 | ✅ Active | http://localhost:5000 | Flask ML fraud detection |
| **Anomaly Tracker (AI Risk)** | 5001 | ✅ Active | http://localhost:5001 | Flask risk scoring API |
| **VRT Guard** | 5002 | ✅ Active | http://localhost:5002 | Flask VAT fraud detection |
| **OCR AI Service** | 8000 | ⚠️ Optional | http://localhost:8000 | FastAPI OCR service |
| **PostgreSQL Database** | 5432 | 📦 Database | localhost:5432 | PostgreSQL server |

## Updated Components

### 1. GhostBuster Frontend
- **File:** `E:\ZRA PROJECT\GhostBuster\frontend\package.json`
- **Change:** Port updated from 3002 to 3004
- **Script:** `"start": "set PORT=3004 && react-scripts start"`

### 2. API Gateway
- **File:** `E:\ZRA PROJECT\api-gateway\server.js`
- **Change:** Port updated from 4000 to 4001
- **Code:** `const PORT = process.env.PORT || 4001;`

### 3. WhistlePro Backend
- **File:** `E:\ZRA PROJECT\whistlepro_backend\src\server.js`
- **Change:** Port updated from 3006 to 4000
- **Code:** `const PORT = process.env.PORT || 4000;`

### 4. Dashboard Integration
- **GhostBuster Page:** Now embeds the full GhostBuster UI via iframe from port 3004
- **VRT Guard Page:** Now embeds the full VRT Guard UI via iframe from port 5002
- **Benefits:**
  - Complete functionality preserved
  - Original UI design maintained
  - All features available directly in dashboard

## Dashboard Integration Details

### GhostBuster Detection (Iframe Integration)
```jsx
// File: dashboard_integration/frontend/src/pages/GhostBusterDetection.jsx
<iframe 
  src="http://localhost:3004" 
  title="GhostBuster Detection System"
  allow="fullscreen"
/>
```

**Features Available:**
- Individual employee analysis
- Batch CSV upload
- NAPSA verification
- Death registry checks
- Bank withdrawal pattern analysis
- Real-time ghost detection results
- Comprehensive statistics

### VRT Guard (Iframe Integration)
```jsx
// File: dashboard_integration/frontend/src/pages/VRTGuard.jsx
<iframe 
  src="http://localhost:5002" 
  title="VRT Guard VAT Fraud Detection"
  allow="fullscreen"
/>
```

**Features Available:**
- VAT return upload (CSV/JSON)
- Single and batch fraud analysis
- Risk level assessment (HIGH/MEDIUM/LOW)
- Detailed fraud indicators
- Protective factors analysis
- Recommendation engine
- Export functionality

## Service Startup

### PowerShell Script (Recommended)
```powershell
.\Start-AllServices.ps1
```

### Manual Start Commands

#### 1. Dashboard Frontend (Port 3000)
```powershell
cd "E:\ZRA PROJECT\dashboard_integration\frontend"
npm run dev
```

#### 2. Main Flask Backend (Port 5000)
```powershell
cd "E:\ZRA PROJECT"
$env:PYTHONIOENCODING='utf-8'
python app.py
```

#### 3. VRT Guard (Port 5002)
```powershell
cd "E:\ZRA PROJECT\vrt_guard"
$env:PYTHONIOENCODING='utf-8'
.\venv\Scripts\python.exe app.py
```

#### 4. Anomaly Tracker (Port 5001)
```powershell
cd "E:\ZRA PROJECT\ai_risk_scoring"
$env:PYTHONIOENCODING='utf-8'
.\venv\Scripts\python.exe -m api.scoring_api
```

#### 5. GhostBuster Backend (Port 3005)
```powershell
cd "E:\ZRA PROJECT\GhostBuster\backend"
$env:PYTHONIOENCODING='utf-8'
python app.py
```

#### 6. GhostBuster Frontend (Port 3004)
```powershell
cd "E:\ZRA PROJECT\GhostBuster\frontend"
npm start
```

#### 7. Blockchain Service (Port 3001)
```powershell
cd "E:\ZRA PROJECT\blockchain"
npm start
```

#### 8. WhistlePro Backend (Port 4000)
```powershell
cd "E:\ZRA PROJECT\whistlepro_backend"
node src/server.js
```

#### 9. API Gateway (Port 4001)
```powershell
cd "E:\ZRA PROJECT\api-gateway"
node server.js
```

## Service Dependencies

### Backend Services
- **GhostBuster Backend** → Requires datasets (run `generate_datasets.py` if needed)
- **VRT Guard** → Requires ML model files in `models/` directory
- **Anomaly Tracker** → Requires trained XGBoost model
- **Main Flask Backend** → Requires scikit-learn models

### Frontend Services
- **Dashboard** → Depends on API Gateway (port 4001)
- **GhostBuster Frontend** → Depends on GhostBuster Backend (port 3005)

### Database Services
- **API Gateway** → Connects to PostgreSQL (port 5432)
- **WhistlePro** → Connects to PostgreSQL (port 5432)
- **Blockchain** → Connects to PostgreSQL (port 5432)

## Verification

### Check Running Services
```powershell
powershell -ExecutionPolicy Bypass -File check-all-services.ps1
```

### Quick Port Check
```powershell
netstat -ano | findstr ":3000 :3001 :3004 :3005 :4000 :4001 :5000 :5001 :5002"
```

## Troubleshooting

### Port Already in Use
If a port is already in use, find and kill the process:
```powershell
# Find process using port (e.g., 3000)
netstat -ano | findstr ":3000"

# Kill process by PID
taskkill /F /PID <PID>
```

### Unicode Encoding Errors
Python services require UTF-8 encoding:
```powershell
$env:PYTHONIOENCODING='utf-8'
```

### Module Not Found Errors
Ensure virtual environments are activated:
```powershell
# For venv-based services
.\venv\Scripts\Activate.ps1
```

## Notes

1. **Dashboard Access:** Main entry point is http://localhost:3000
2. **Full Functionality:** GhostBuster and VRT Guard run as standalone services embedded in dashboard
3. **Data Persistence:** Database services store data in PostgreSQL
4. **Real-time Updates:** Blockchain service provides WebSocket updates
5. **Security:** All services include CORS configuration for localhost development

## Production Deployment

For production deployment, update the following:
- Change all `localhost` URLs to production domains
- Enable HTTPS
- Update CORS configurations
- Set `debug=False` in Flask apps
- Use production WSGI servers (gunicorn, uwsgi)
- Use reverse proxy (nginx, Apache)
- Configure environment variables properly
- Set up proper logging and monitoring

---

**Last Updated:** October 25, 2025
**Configuration Version:** 2.0
