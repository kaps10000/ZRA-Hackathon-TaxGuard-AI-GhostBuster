from flask import Flask, request, jsonify
import pandas as pd
import joblib
import os
from models.risk_scoring import RiskScorer  # Manual formula-based scoring

# Initialize Flask
app = Flask(__name__)

# ---------------------------
# Load trained ML model
# ---------------------------
MODEL_PATH = os.path.join("models", "risk_model.pkl")

if os.path.exists(MODEL_PATH):
    ml_model = joblib.load(MODEL_PATH)
    print("✅ Trained ML model loaded successfully.")
else:
    ml_model = None
    print("⚠️ Warning: ML model not found. Train it first with training_pipeline.py")

# Initialize manual RiskScorer
scorer = RiskScorer()
print("✅ Manual RiskScorer initialized.")

# ---------------------------
# Routes
# ---------------------------

@app.route('/predict/ml', methods=['POST'])
def predict_ml():
    """ML model risk scoring"""
    if ml_model is None:
        return jsonify({"error": "ML model not loaded. Please train it first."}), 500

    data = request.get_json()
    df = pd.DataFrame(data)
    numeric_df = df.select_dtypes(include=['number'])
    
    # Predict risk score (probability of high risk class)
    risk_scores = ml_model.predict_proba(numeric_df)[:, 1] * 100
    
    return jsonify({
        "risk_scores": [round(score, 2) for score in risk_scores],
        "method": "ML model"
    })


@app.route('/predict/manual', methods=['POST'])
def predict_manual():
    """Manual formula-based risk scoring"""
    data = request.get_json()
    df = pd.DataFrame(data)
    numeric_df = df.select_dtypes(include=['number'])
    
    risk_scores = scorer.compute_risk_score(numeric_df)
    
    return jsonify({
        "risk_scores": [round(score, 2) for score in risk_scores],
        "method": "Manual formula"
    })


@app.route('/health', methods=['GET'])
def health():
    """Check API and model status"""
    return jsonify({
        "status": "OK",
        "ml_model_loaded": ml_model is not None,
        "manual_scorer_ready": True
    })


# ---------------------------
# Run Flask
# ---------------------------
if __name__ == '__main__':
    app.run(debug=True)