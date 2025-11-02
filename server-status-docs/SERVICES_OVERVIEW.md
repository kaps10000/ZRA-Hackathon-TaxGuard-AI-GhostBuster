# ZRA TaxGuard AI - Complete Services Overview

**Last Updated:** October 25, 2025 @ 5:40 AM

---

## 📦 Available Startup Scripts

| Script | Services | Use Case |
|--------|----------|----------|
| **Start-Core-Services.ps1** | 6 Core | Essential dashboard functionality |
| **Start-Additional-Services.ps1** | 4 Additional | Extended features |
| **Start-ALL-Services.ps1** | All 10 | Complete system |
| **Stop-All-Services.ps1** | Stops all | Clean shutdown |

---

## 🎯 Core Services (Essential - 6 Services)

### These are REQUIRED for the main dashboard to work:

| # | Service | Port | Status | Why It's Core |
|---|---------|------|--------|---------------|
| 1 | **Dashboard Frontend** | 3000 | ✅ Working | Main UI - embeds all other services |
| 2 | **VRT Guard (NEW)** | 5000 | ✅ Working | VAT fraud detection - dashboard feature |
| 3 | **GhostBuster Backend** | 3005 | ✅ Working | Ghost detection API - provides data |
| 4 | **GhostBuster Frontend** | 3004 | ✅ Working | Ghost detection UI - embedded in dashboard |
| 5 | **API Gateway** | 4001 | ✅ Working | Dashboard overview data aggregation |
| 6 | **Predictive Analytics** | 5003 | ✅ Working | Revenue forecasts - dashboard feature |

**Start Core Services:**
```powershell
.\Start-Core-Services.ps1
```

---

## ➕ Additional Services (Optional - 4 Services)

### These provide EXTRA functionality beyond the core dashboard:

| # | Service | Port | Purpose | When to Use |
|---|---------|------|---------|-------------|
| 7 | **Blockchain Service** | 3001 | Audit trail & immutable records | If you need blockchain verification |
| 8 | **WhistlePro Backend** | 4000 | Anonymous whistleblower reports | If you need whistleblower system |
| 9 | **Main Flask Backend (OCR)** | 5001 | Document OCR & text extraction | If you need to process scanned documents |
| 10 | **Anomaly Tracker** | 5002 | AI risk scoring & anomaly detection | If you need additional risk analysis |

**Start Additional Services:**
```powershell
.\Start-Additional-Services.ps1
```

**OR Start Everything:**
```powershell
.\Start-ALL-Services.ps1
```

---

## 📊 Detailed Service Information

### CORE SERVICE 1: Dashboard Frontend (Port 3000)
**Technology:** React + Vite  
**Directory:** `dashboard_integration\frontend`

**Purpose:**
- Main user interface
- Embeds VRT Guard and GhostBuster UIs via iframes
- System-wide navigation

**Features:**
- Overview page with metrics
- Navigation to all modules
- Real-time updates via WebSocket

**Dependencies:**
- API Gateway (port 4001) for overview data
- VRT Guard (port 5000) for embedding
- GhostBuster (port 3004) for embedding
- Predictive Analytics (port 5003) for forecasts

**Access:** http://localhost:3000

---

### CORE SERVICE 2: VRT Guard (NEW) (Port 5000)
**Technology:** Python Flask + Machine Learning  
**Directory:** `ZRA Tax Refund NEW`

**Purpose:**
- VAT refund fraud detection
- AI-powered risk scoring
- Auditor recommendations

**Features:**
- Upload VAT return CSV/JSON
- Fraud probability analysis (0-100%)
- Risk level classification (HIGH/MEDIUM/LOW)
- Detailed risk factor breakdown
- Export analysis results

**Datasets:**
- ZRA taxpayer master
- VAT claims history
- Purchase/sales transactions
- Customs export/import data
- Compliance history
- PACRA business registry

**Access:** http://localhost:5000

---

### CORE SERVICE 3: GhostBuster Backend (Port 3005)
**Technology:** Python Flask  
**Directory:** `GhostBuster\backend`

**Purpose:**
- Ghost employee detection API
- Dataset management
- Analysis engine

**Datasets Loaded:**
- **607,019** NAPSA contribution records
- **10,000** Home Affairs death registry
- **3,695,750** Bank transaction records
- **10,000** Master employee records

**Ghost Detection Results:**
- DECEASED: 1,000 employees
- DUPLICATE NRC: 800 employees
- PHANTOM: 700 employees
- OVER RETIREMENT AGE: 500 employees
- LEGITIMATE: 7,000 employees
- **Total Ghost Cost:** ZMW 52.1 million/month

**API Endpoints:**
- `POST /api/analyze/individual` - Single employee analysis
- `POST /api/analyze/batch` - Batch CSV upload
- `GET /api/stats` - System statistics
- `GET /api/sample` - Sample data
- `GET /api/search?q=<query>` - Search employees
- `POST /api/export/csv` - Export to CSV
- `POST /api/export/detailed` - Export detailed JSON

**Access:** http://localhost:3005/api/stats

---

### CORE SERVICE 4: GhostBuster Frontend (Port 3004)
**Technology:** React + Material-UI  
**Directory:** `GhostBuster\frontend`

**Purpose:**
- User interface for ghost detection
- Beautiful visualizations
- Interactive analysis

**Features:**
- Search employee by NRC
- Upload batch CSV files
- Statistics dashboard with gradient cards
- Risk level visualization
- Distribution charts
- Export functionality

**Connects to:** GhostBuster Backend (port 3005)

**Access:** http://localhost:3004

---

### CORE SERVICE 5: API Gateway (Port 4001)
**Technology:** Node.js Express  
**Directory:** `api-gateway`

**Purpose:**
- Aggregates data from all backend services
- Provides unified API for dashboard
- WebSocket support for real-time updates

**Endpoints:**
- `GET /health` - Health check
- `GET /api/dashboard/feed` - Dashboard overview data
- `GET /api/dashboard/stats` - System statistics
- WebSocket for real-time updates

**Why It's Core:**
The dashboard overview page relies on this service to display:
- Total cases processed
- Ghost employees detected
- Compliance metrics
- Recent alerts
- Service status

**Access:** http://localhost:4001/health

---

### CORE SERVICE 6: Predictive Analytics (Port 5003)
**Technology:** Python Flask  
**Directory:** `predictive_analytics`

**Purpose:**
- Revenue forecasting
- Economic scenario analysis
- Impact projections

**Features:**
- **Revenue Forecast:** 1-24 months ahead
- **Copper Price Impact:** Analyze effect of copper price changes on revenue
- **Compliance Impact:** Model revenue gains from improved tax compliance
- **Economic Trends:** Historical data analysis

**Datasets:**
- 34 months Zambian economic data
- Historical copper prices
- Bank of Zambia bond data
- Economic indicators (GDP, inflation, etc.)

**API Endpoints:**
- `GET /revenue-forecast?months=<N>` - Revenue predictions
- `POST /copper-impact` - Copper price scenario
- `POST /scenario-analysis` - Compliance improvement scenario
- `GET /compliance-trends` - Historical compliance
- `GET /health` - Service health

**Access:** http://localhost:5003/health

---

## ➕ ADDITIONAL SERVICES

### ADDITIONAL SERVICE 7: Blockchain Service (Port 3001)
**Technology:** Node.js  
**Directory:** `blockchain`

**Purpose:**
- Immutable audit trail
- Blockchain-based record keeping
- Transaction verification

**Features:**
- Store audit logs on blockchain
- Verify transaction integrity
- Timestamped records
- Cryptographic verification

**Use Cases:**
- Legal audit trails
- Evidence preservation
- Tamper-proof records
- Compliance documentation

**When to Use:**
- If you need legally verifiable audit trails
- If you require tamper-proof evidence
- For regulatory compliance requiring blockchain

**Access:** http://localhost:3001

---

### ADDITIONAL SERVICE 8: WhistlePro Backend (Port 4000)
**Technology:** Node.js Express  
**Directory:** `whistlepro_backend`

**Purpose:**
- Anonymous whistleblower reporting system
- Case management
- Investigation tracking

**Features:**
- Anonymous report submission
- Secure case tracking
- Evidence upload
- Status updates
- Investigation workflow

**Use Cases:**
- Internal fraud reporting
- Corruption allegations
- Policy violations
- Anonymous tips

**When to Use:**
- If you need a whistleblower hotline
- For anonymous reporting capability
- Investigation case management

**Access:** http://localhost:4000/api

---

### ADDITIONAL SERVICE 9: Main Flask Backend - OCR (Port 5001)
**Technology:** Python Flask + OCR  
**Directory:** `E:\ZRA PROJECT` (root `app.py`)

**Purpose:**
- Optical Character Recognition
- Document text extraction
- Image to text conversion

**Features:**
- Upload scanned documents
- Extract text from images/PDFs
- Process forms automatically
- Data entry automation

**Use Cases:**
- Digitizing paper tax returns
- Processing scanned invoices
- Extracting data from forms
- Automating manual data entry

**When to Use:**
- If you have scanned documents to process
- Need to extract text from images
- Want to automate document processing

**Note:** Changed to port 5001 to avoid conflict with VRT Guard (port 5000)

**Access:** http://localhost:5001

---

### ADDITIONAL SERVICE 10: Anomaly Tracker (Port 5002)
**Technology:** Python Flask + AI/ML  
**Directory:** `ai_risk_scoring`

**Purpose:**
- AI-powered anomaly detection
- Risk scoring algorithms
- Pattern recognition

**Features:**
- Transaction anomaly detection
- Behavioral risk scoring
- Pattern-based alerts
- ML-based predictions

**Use Cases:**
- Detecting unusual transactions
- Risk-based auditing
- Fraud pattern recognition
- Predictive risk assessment

**When to Use:**
- If you need additional anomaly detection
- For advanced risk scoring
- Complement to other fraud detection tools

**Access:** http://localhost:5002

---

## 🚀 Which Script Should You Use?

### Scenario 1: Basic Dashboard Use
**Use:** `Start-Core-Services.ps1`

**You get:**
- ✅ Dashboard with all main features
- ✅ VRT Guard fraud detection
- ✅ GhostBuster ghost detection
- ✅ Predictive analytics
- ✅ Everything embedded and integrated

**Good for:**
- Daily operations
- Standard tax fraud analysis
- Most common use cases

---

### Scenario 2: Need Extra Features
**Use:** `Start-Core-Services.ps1` THEN `Start-Additional-Services.ps1`

**You get:**
- ✅ All core features
- ✅ PLUS Blockchain audit trails
- ✅ PLUS Whistleblower system
- ✅ PLUS OCR document processing
- ✅ PLUS Advanced anomaly detection

**Good for:**
- Comprehensive analysis
- When you need document OCR
- If using whistleblower reports
- When blockchain verification is required

---

### Scenario 3: Full System Deployment
**Use:** `Start-ALL-Services.ps1`

**You get:**
- ✅ Complete ZRA TaxGuard AI ecosystem
- ✅ All 10 services running
- ✅ Every feature available

**Good for:**
- Production deployment
- Full system demonstration
- Maximum functionality

---

## 📋 Port Summary

| Port | Service | Type | Required |
|------|---------|------|----------|
| 3000 | Dashboard Frontend | Core | ✅ Yes |
| 3001 | Blockchain Service | Additional | ⚪ Optional |
| 3004 | GhostBuster Frontend | Core | ✅ Yes |
| 3005 | GhostBuster Backend | Core | ✅ Yes |
| 4000 | WhistlePro Backend | Additional | ⚪ Optional |
| 4001 | API Gateway | Core | ✅ Yes |
| 5000 | VRT Guard (NEW) | Core | ✅ Yes |
| 5001 | Main Flask Backend (OCR) | Additional | ⚪ Optional |
| 5002 | Anomaly Tracker | Additional | ⚪ Optional |
| 5003 | Predictive Analytics | Core | ✅ Yes |

---

## 🎯 Quick Decision Guide

**I just want the dashboard working:**
```powershell
.\Start-Core-Services.ps1
```

**I need blockchain verification too:**
```powershell
.\Start-Core-Services.ps1
.\Start-Additional-Services.ps1
```

**I want EVERYTHING:**
```powershell
.\Start-ALL-Services.ps1
```

**I want to stop everything:**
```powershell
.\Stop-All-Services.ps1
```

---

## 💡 Recommendations

### For Most Users:
**Start with Core Services Only**
- They provide all essential functionality
- Dashboard works perfectly
- All main features available
- Less resource intensive

### Add Additional Services When:
- You need document OCR (service 9)
- You want blockchain audit trails (service 7)
- You need whistleblower reporting (service 8)
- You want extra anomaly detection (service 10)

---

## ✅ Summary

**Core Services (6):** Essential for dashboard  
**Additional Services (4):** Optional extended features  
**Total Available:** 10 services

**All scripts are ready to use - just choose what you need!** 🎉
