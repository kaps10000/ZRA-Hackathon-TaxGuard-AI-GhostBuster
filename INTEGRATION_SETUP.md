# TaxGuard AI - Integration Setup Guide

This guide helps team members set up the integrated TaxGuard AI system with VRT Guard and Anomaly Tracker.

## 🚀 Quick Start

### Prerequisites
- Node.js v18+ and npm
- Python 3.8+
- Docker and Docker Compose
- Git

## 📦 Installation Steps

### 1. Clone and Navigate
```bash
git clone <repository-url>
cd ZRA-Hackathon-TaxGuard-AI-GhostBuster
git checkout integration-dashboard
```

### 2. Install API Gateway Dependencies
```bash
cd api-gateway
npm install
cd ..
```

### 3. Install Dashboard Frontend Dependencies
```bash
cd dashboard_integration/frontend
npm install
cd ../..
```

### 4. Set Up VRT Guard (VAT Fraud Detection)
```bash
cd vrt_guard
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
cd ..
```

### 5. Set Up Anomaly Tracker (AI Risk Scoring)
```bash
cd ai_risk_scoring
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
cd ..
```

### 6. Set Up GhostBuster Module
```bash
cd ghostbuster_module
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
cd ..
```

### 7. Set Up GhostBuster Backend
```bash
cd ghostbuster/backend
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
cd ../..
```

## 🏃 Running the System

### Start All Services (Recommended Order)

**Terminal 1 - API Gateway:**
```bash
cd api-gateway
PORT=4001 node server.js
```

**Terminal 2 - Dashboard Frontend:**
```bash
cd dashboard_integration/frontend
npm run dev
```

**Terminal 3 - VRT Guard Service:**
```bash
cd vrt_guard
source venv/bin/activate
PORT=5002 python app.py
```

**Terminal 4 - Anomaly Tracker Service:**
```bash
cd ai_risk_scoring
source venv/bin/activate
PORT=5000 PYTHONPATH=/absolute/path/to/ai_risk_scoring python api/scoring_api_improved.py
```

**Terminal 5 - GhostBuster Module:**
```bash
cd ghostbuster_module
source venv/bin/activate
python api.py
```

### Access Points
- **Dashboard**: http://localhost:3000
- **API Gateway**: http://localhost:4001
- **VRT Guard API**: http://localhost:5002
- **Anomaly Tracker API**: http://localhost:5000

## 🔧 Configuration

### Environment Variables
Create `.env` files in respective directories:

**api-gateway/.env:**
```
PORT=4001
VRT_GUARD_URL=http://localhost:5002
ANOMALY_TRACKER_URL=http://localhost:5000
GHOSTBUSTER_URL=http://localhost:3004
```

**vrt_guard/.env:**
```
PORT=5002
FLASK_ENV=development
```

**ai_risk_scoring/.env:**
```
PORT=5000
FLASK_ENV=development
MODEL_PATH=models/risk_model.pkl
SCALER_PATH=models/risk_scaler.pkl
```

## 📊 Features Integrated

### 1. VRT Guard (VAT Fraud Detection)
- **Location**: `vrt_guard/`
- **Frontend Page**: Database Viewer → VRT Guard menu
- **API Endpoints**:
  - `POST /api/vrtguard/upload/return` - Upload VAT return for analysis
  - `POST /api/vrtguard/predict/manual` - Manual VAT fraud prediction
  - `GET /api/vrtguard-db/detections` - Get all detections
  - `GET /api/vrtguard-db/stats` - Get detection statistics

### 2. Anomaly Tracker (AI Risk Scoring)
- **Location**: `ai_risk_scoring/`
- **Frontend Page**: Anomaly Tracker menu (🎯 icon)
- **API Endpoints**:
  - `POST /api/anomaly-tracker/predict/ml` - ML-based risk scoring (XGBoost)
  - `POST /api/anomaly-tracker/predict/manual` - Manual formula-based scoring
  - `GET /api/anomaly-tracker-db/scores` - Get all risk scores
  - `GET /api/anomaly-tracker-db/stats` - Get statistics

### 3. Database Viewer Enhancements
- **Location**: `dashboard_integration/frontend/src/pages/DatabaseViewer.jsx`
- **New Tables**:
  - OCR Documents
  - Ghost Detections
  - VAT Fraud Detections
  - Risk Scores
  - Combined Detections View

## 🐛 Troubleshooting

### Issue: "Module not found" errors for Python services

**Solution:**
```bash
# For Anomaly Tracker
cd ai_risk_scoring
export PYTHONPATH=/absolute/path/to/ai_risk_scoring
source venv/bin/activate
python api/scoring_api_improved.py
```

### Issue: "Port already in use"

**Solution:**
```bash
# Kill process on specific port (example: 4001)
lsof -ti:4001 | xargs kill -9

# Or use different ports by changing PORT environment variable
PORT=4002 node server.js
```

### Issue: "XGBoost model version warning"

**Solution:** This is a non-critical warning. The model will still load and work correctly.

### Issue: "CORS errors" in browser

**Solution:** Ensure API Gateway is running on port 4001 and all services are accessible.

### Issue: npm install fails

**Solution:**
```bash
# Clear npm cache and reinstall
rm -rf node_modules package-lock.json
npm cache clean --force
npm install
```

## 📝 Development Workflow

### Working on Frontend
1. Make changes in `dashboard_integration/frontend/src/`
2. Hot reload is enabled - changes appear automatically
3. Test in browser at http://localhost:3000

### Working on Backend APIs
1. Make changes in respective service directories
2. Restart the service
3. Test using Postman or browser

### Adding New Features
1. Create feature branch: `git checkout -b feature/your-feature-name`
2. Make changes
3. Test thoroughly
4. Commit with descriptive message
5. Push and create pull request

## 🧪 Testing

### Test VRT Guard
```bash
curl -X POST http://localhost:4001/api/vrtguard/predict/manual \
  -H "Content-Type: application/json" \
  -d '{
    "tin": "1234567890",
    "taxpayer_name": "Test Company",
    "total_sales": 1000000,
    "total_purchases": 800000,
    "output_vat": 160000,
    "input_vat": 128000,
    "net_vat": 32000
  }'
```

### Test Anomaly Tracker
```bash
curl -X POST http://localhost:4001/api/anomaly-tracker/predict/ml \
  -H "Content-Type: application/json" \
  -d '[{
    "tin": "1234567890",
    "taxpayer_name": "Test Corp",
    "amount": 1000000,
    "transaction_count": 100,
    "avg_transaction": 10000,
    "sector": "Mining",
    "region": "Lusaka"
  }]'
```

## 📚 Additional Resources

- **API Gateway Routes**: `api-gateway/routes/`
- **Frontend Components**: `dashboard_integration/frontend/src/`
- **Backend Services**: Individual service directories
- **Database Storage**: In-memory (for development)

## 🤝 Team Collaboration

### Before Starting Work
```bash
git pull origin integration-dashboard
npm install  # if package.json changed
pip install -r requirements.txt  # if requirements.txt changed
```

### Committing Changes
```bash
git add <files>
git commit -m "Clear description of changes"
git push origin integration-dashboard
```

### Avoiding Conflicts
- Pull latest changes before starting work
- Commit frequently with clear messages
- Communicate with team about file changes
- Use feature branches for major changes

## ⚠️ Important Notes

1. **Do NOT commit**:
   - `node_modules/` directories
   - `venv/` directories
   - `.env` files
   - Log files
   - `__pycache__/` directories
   - `.pyc` files

2. **Always commit**:
   - Source code files
   - Configuration templates
   - Requirements files
   - Documentation

3. **Virtual Environments**:
   - Each Python service needs its own venv
   - Activate venv before running Python services
   - Never commit venv directories

## 🆘 Getting Help

If you encounter issues:
1. Check this documentation
2. Review error logs
3. Check if all services are running
4. Verify port numbers
5. Ask team members in the project chat

## 📞 Contact

For questions or issues, contact the integration team lead.

---

**Last Updated**: 2025-10-20
**Version**: 1.0.0
**Branch**: integration-dashboard
