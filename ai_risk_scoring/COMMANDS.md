# AI Risk Scoring Module - Commands Guide

This document provides all the essential commands to setup, train, test, and run the AI Risk Scoring module.

## 🚀 Quick Start

### 1. Install Dependencies
```bash
# Install core dependencies
pip install pandas numpy scikit-learn xgboost joblib flask flask-cors requests

# Or install from requirements file
pip install -r requirements.txt
```

### 2. Train the Model
```bash
# Train ML model with improved feature engineering
python -m pipeline.training_pipeline
```

### 3. Start the API
```bash
# Start API server (foreground)
python -m api.scoring_api

# Or start in background
python -m api.scoring_api &
```

### 4. Test the API
```bash
# Run comprehensive test suite
python test_api.py

# Or test individual endpoints manually (see below)
```

---

## 📋 Detailed Commands

### **Setup & Environment**

#### Virtual Environment (Recommended)
```bash
# Create virtual environment
python -m venv .venv

# Activate (Linux/Mac)
source .venv/bin/activate

# Activate (Windows)
.venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt
```

#### Check Installation
```bash
# Verify Python packages
pip list | grep -E "(pandas|numpy|sklearn|xgboost|flask)"

# Test imports
python -c "import pandas, numpy, sklearn, xgboost, flask; print('✅ All packages imported successfully')"
```

---

### **Model Training & Management**

#### Train Model
```bash
# Train with improved feature engineering
python -m pipeline.training_pipeline

# Expected output:
# ✅ Model trained successfully
# ✅ Scaler trained and saved
# Model saved as models/risk_model.pkl
```

#### Verify Model Files
```bash
# Check model files exist
ls -la models/
# Should see: risk_model.pkl, risk_scaler.pkl
```

#### Train Individual Components
```bash
# Train only the risk scorer (manual scoring)
python -c "
from models.risk_scoring import RiskScorer
from data_processing.data_loader import load_csv
from data_processing.feature_engineering import create_features, prepare_features_for_model
df = load_csv('data/income_data.csv')
features_df = create_features(df, group_by_taxpayer=False)
X, _ = prepare_features_for_model(features_df)
scorer = RiskScorer()
scorer.fit_scaler(X)
print('✅ Manual scorer trained')
"
```

---

### **API Server Management**

#### Start API Server
```bash
# Development server (with debug info)
python -m api.scoring_api

# Production server with Gunicorn
gunicorn -w 4 -b 0.0.0.0:5000 api.scoring_api:app

# Background process
nohup python -m api.scoring_api > api.log 2>&1 &

# Check if running
ps aux | grep scoring_api
```

#### Stop API Server
```bash
# Kill by process name
pkill -f "python -m api.scoring_api"

# Kill by port
lsof -ti:5000 | xargs kill

# Kill background job
jobs  # shows background jobs
kill %1  # kills job 1
```

---

### **API Testing**

#### Health Check
```bash
# Basic health check
curl http://127.0.0.1:5000/health

# Formatted JSON output
curl -s http://127.0.0.1:5000/health | python -m json.tool

# Check specific service status
curl -s http://127.0.0.1:5000/health | grep -o '"status": "[^"]*"'
```

#### API Information
```bash
# Get API info and available endpoints
curl http://127.0.0.1:5000/

# Pretty print
curl -s http://127.0.0.1:5000/ | python -m json.tool
```

#### Manual Risk Scoring
```bash
# Simple manual scoring
curl -X POST http://127.0.0.1:5000/predict/manual \
-H "Content-Type: application/json" \
-d '[{"amount": 8500}, {"amount": 4000}, {"amount": 12000}]'

# With error handling test
curl -X POST http://127.0.0.1:5000/predict/manual \
-H "Content-Type: application/json" \
-d '[{"amount": "invalid"}, {"amount": 4000}]'

# Empty data test
curl -X POST http://127.0.0.1:5000/predict/manual \
-H "Content-Type: application/json" \
-d '[]'
```

#### ML Model Prediction
```bash
# Note: ML prediction requires full feature set (run test_api.py instead)
# For manual testing, use the test script:
python -c "
from test_api import test_with_proper_features
test_with_proper_features()
"
```

#### Comprehensive Testing
```bash
# Run full test suite
python test_api.py

# Test individual functions
python -c "from test_api import test_health; test_health()"
python -c "from test_api import test_simple_manual_scoring; test_simple_manual_scoring()"
```

---

### **Integration Testing**

#### Test with Main API Gateway
```bash
# From parent directory, test integration
cd ..
curl -X POST http://localhost:4000/api/ai-risk/assessment \
-H "Content-Type: application/json" \
-H "Authorization: Bearer YOUR_TOKEN_HERE" \
-d '{
  "taxpayer_data": [
    {"amount": 8500, "sector": "Finance", "region": "Lusaka"},
    {"amount": 4000, "sector": "Retail", "region": "Ndola"}
  ]
}'
```

#### Load Testing
```bash
# Simple load test with curl
for i in {1..10}; do
  curl -X POST http://127.0.0.1:5000/predict/manual \
  -H "Content-Type: application/json" \
  -d "[{\"amount\": $((RANDOM % 10000 + 1000))}]" &
done
wait
```

---

### **Data Management**

#### View Sample Data
```bash
# View training data
head -n 5 data/income_data.csv
cat data/income_data.csv

# Count records
wc -l data/income_data.csv
```

#### Test Feature Engineering
```bash
# Test feature creation
python -c "
from data_processing.data_loader import load_csv
from data_processing.feature_engineering import create_features
df = load_csv('data/income_data.csv')
features = create_features(df, group_by_taxpayer=False)
print('Features created:', list(features.columns))
print('Shape:', features.shape)
"
```

#### Validate Data
```bash
# Run data validation
python -c "
from data_processing.data_validation import validate_data
from data_processing.data_loader import load_csv
df = load_csv('data/income_data.csv')
is_valid = validate_data(df)
print('Data validation:', '✅ Valid' if is_valid else '❌ Invalid')
"
```

---

### **Debugging & Logs**

#### View API Logs
```bash
# If running in background with logging
tail -f api.log

# View recent errors
grep -i error api.log | tail -10

# Monitor real-time requests
tail -f api.log | grep -i "INFO:werkzeug"
```

#### Debug Feature Engineering
```bash
# Test feature engineering step by step
python -c "
import pandas as pd
from data_processing.feature_engineering import create_features, prepare_features_for_model

# Load and inspect
df = pd.read_csv('data/income_data.csv')
print('Original data shape:', df.shape)
print('Columns:', list(df.columns))

# Create features
features_df = create_features(df, group_by_taxpayer=False)
print('After feature engineering:', features_df.shape)
print('New columns:', list(features_df.columns))

# Prepare for model
X, y = prepare_features_for_model(features_df, 'risk_label')
print('Model features:', X.shape)
print('Feature columns:', list(X.columns))
print('Any NaN values:', X.isnull().any().any())
"
```

#### Check Model Performance
```bash
# Quick model evaluation
python -c "
import joblib
import pandas as pd
from data_processing.data_loader import load_csv
from data_processing.feature_engineering import create_features, prepare_features_for_model

# Load model and data
model = joblib.load('models/risk_model.pkl')
df = load_csv('data/income_data.csv')
features_df = create_features(df, group_by_taxpayer=False)
X, y = prepare_features_for_model(features_df, 'risk_label')

# Test prediction
predictions = model.predict_proba(X)[:, 1] * 100
print('Risk scores:', [round(p, 2) for p in predictions])
print('Actual labels:', list(y))
"
```

---

### **Maintenance & Cleanup**

#### Clean Up Files
```bash
# Remove model files (to retrain)
rm models/risk_model.pkl models/risk_scaler.pkl

# Clean Python cache
find . -name "*.pyc" -delete
find . -name "__pycache__" -type d -exec rm -rf {} +

# Remove virtual environment
rm -rf .venv/
```

#### Reset and Restart
```bash
# Complete reset
pkill -f "python -m api.scoring_api"  # Stop API
rm models/*.pkl  # Remove models
python -m pipeline.training_pipeline  # Retrain
python -m api.scoring_api &  # Restart API
python test_api.py  # Test
```

---

## 🔧 Troubleshooting

### Common Issues & Solutions

#### "ModuleNotFoundError: No module named 'pandas'"
```bash
# Solution: Install dependencies
pip install -r requirements.txt
```

#### "FileNotFoundError: No such file or directory: 'data/income_data.csv'"
```bash
# Solution: Run from correct directory
cd ai_risk_scoring
python -m pipeline.training_pipeline
```

#### "Model not found" error in API
```bash
# Solution: Train model first
python -m pipeline.training_pipeline
```

#### API not responding
```bash
# Check if API is running
curl http://127.0.0.1:5000/health
# If not working, restart:
pkill -f scoring_api
python -m api.scoring_api &
```

#### "Feature names mismatch" error
```bash
# Solution: Retrain model and restart API
python -m pipeline.training_pipeline
pkill -f scoring_api
python -m api.scoring_api &
```

---

## 📚 Additional Resources

- **API Documentation**: Start server and visit `http://127.0.0.1:5000/`
- **Test Script**: Run `python test_api.py` for comprehensive testing
- **Integration Guide**: See `../TEAM_INTEGRATION_DOCUMENTATION.md`
- **Main Project Guide**: See `../WARP.md`

---

## ✅ Success Indicators

Your setup is working correctly if:

1. ✅ `python -m pipeline.training_pipeline` completes without errors
2. ✅ `curl http://127.0.0.1:5000/health` returns status "OK"
3. ✅ `python test_api.py` shows "API Testing Complete!"
4. ✅ Model files exist: `ls models/*.pkl` shows `risk_model.pkl` and `risk_scaler.pkl`

---

**Happy Risk Scoring! 🎯**