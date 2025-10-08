AI Risk Scoring System

📖 Project Overview

The AI Risk Scoring System is a Python-based solution for calculating taxpayer compliance risk using ML and rule-based scoring. It is designed for use with Zambia Revenue Authority (ZRA) datasets, enabling risk analysis, anomaly detection, and identification of revenue mismatches.

The system provides:

ML-based risk scores using XGBoost

Manual formula-based scoring for quick evaluation

API endpoints to score taxpayers programmatically

Feature engineering and validation for reliable predictions



---

⚡ Key Features

Risk Score Calculation: Generates scores from 0–100 indicating taxpayer compliance risk.

ML-Based Scoring: Trained XGBoost model predicts risk probability based on historical taxpayer data.

Manual Formula Scoring: RiskScorer class calculates scores using standardized numeric features.

Anomaly Detection: Identify unusual transactions exceeding normal thresholds.

Pattern Matching: Derive features like average transaction value and transaction counts.

Revenue Mismatch Identification: Flag taxpayers with abnormal amounts relative to sector or region.

Top Risk Ranking: Output sorted risk scores for targeted follow-up.



---

🛠️ Tech Stack

Language: Python 3.x

ML Framework: Scikit-learn, XGBoost

Data Processing: Pandas, NumPy

API: Flask

Visualization: Matplotlib, Seaborn (optional)



---

📂 Project Structure

ai_risk_scoring_fixed/
├── models/                # ML models & risk scoring logic
│   ├── risk_scoring.py
│   ├── model_training.py
│   └── pattern_detection.py
├── data_processing/       # Data loaders and feature engineering
│   ├── data_loader.py
│   ├── feature_engineering.py
│   └── data_validation.py
├── pipeline/              # Training and scoring pipelines
│   ├── training_pipeline.py
│   └── scoring_pipeline.py
├── api/                   # Flask API
│   └── scoring_api.py
├── data/                  # Sample datasets
│   └── income_data.csv
├── tests/                 # Optional test scripts
└── README.md              # Project documentation


---

⚙️ Installation & Setup

1. Clone the repository



git clone <repository_url>
cd ai_risk_scoring_fixed

2. Create a virtual environment (recommended)



python -m venv venv
source venv/bin/activate        # Linux/Mac
venv\Scripts\activate           # Windows

3. Install dependencies



pip install -r requirements.txt

> Example requirements.txt content:



pandas
numpy
scikit-learn
xgboost
flask
joblib

4. Check dataset Ensure data/income_data.csv exists with numeric fields like amount, transaction_count, avg_transaction, and risk_label.




---

🚀 Training the Model

Run the training pipeline from the project root:

python -m pipeline.training_pipeline

This will:

Load income_data.csv

Create features

Train the XGBoost model

Save the trained model as models/risk_model.pkl



---

🌐 Running the API

Start the Flask API:

python -m api.scoring_api

By default, it runs on http://127.0.0.1:5000.

🔹 API Routes

Route	Method	Description

/predict/ml	POST	Returns ML-based risk scores for submitted taxpayer data
/predict/manual	POST	Returns formula-based risk scores using RiskScorer
/health	GET	Checks if the API and ML model are ready
/	GET	Optional HTML info page (if added)


🔹 Example POST JSON

[
  {"amount": 8500, "transaction_count": 5, "avg_transaction": 1700},
  {"amount": 4000, "transaction_count": 3, "avg_transaction": 1300}
]

🔹 Example curl Request

ML route:

curl -X POST http://127.0.0.1:5000/predict/ml \
-H "Content-Type: application/json" \
-d '[{"amount": 8500, "transaction_count": 5, "avg_transaction": 1700}]'

Manual route:

curl -X POST http://127.0.0.1:5000/predict/manual \
-H "Content-Type: application/json" \
-d '[{"amount": 8500, "transaction_count": 5, "avg_transaction": 1700}]'

Health check:

curl http://127.0.0.1:5000/health


---

🧪 Testing

You can use curl, Postman, or a Python script (requests.post) to test the API endpoints.

Use /predict/ml for ML-based scoring.

Use /predict/manual for quick formula-based scoring.

/health confirms the API and model are ready.



---

💡 Notes & Tips

1. Always run the API from the project root to avoid ModuleNotFoundError.


2. Retrain the model if the dataset is updated, and restart the Flask server to use the new model.


3. You can expand the RiskScorer formula or add additional features for more accurate scoring.


4. Optional: Add / route with a simple HTML form for browser-based testing.




---
