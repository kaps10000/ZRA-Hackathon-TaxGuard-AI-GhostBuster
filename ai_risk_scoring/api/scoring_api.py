from typing import Any
# ---------------------------
# Helpers
# ---------------------------
def parse_json_request() -> tuple[Any, str]:
    """Robustly parse JSON body, returning (data, raw_text)."""
    raw = request.get_data(cache=False, as_text=True) or ""
    data = request.get_json(silent=True)
    if data is None and raw:
        try:
            data = json.loads(raw)
        except Exception as e:
            logger.error(f"JSON parse error: {e}; raw_prefix={raw[:200]}")
            return None, raw
    return data, raw
from flask import Flask, request, jsonify
from flask_cors import CORS
import pandas as pd
import joblib
import os
import logging
from typing import Dict, List, Any
from pathlib import Path
from ai_risk_scoring.models.risk_scoring_improved import RiskScorer
from ai_risk_scoring.data_processing.feature_engineering import create_features, prepare_features_for_model
import json
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, f1_score, confusion_matrix
from xgboost import XGBClassifier
import io

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize Flask with CORS
app = Flask(__name__)
CORS(app)  # Enable CORS for frontend integration

# Configuration
# Resolve paths relative to the package root so execution location doesn't matter
PKG_ROOT = Path(__file__).resolve().parent.parent  # ai_risk_scoring/
MODEL_PATH = str(PKG_ROOT / "models" / "risk_model.pkl")
REQUIRED_FEATURES = ['amount']
OPTIONAL_FEATURES = ['transaction_count', 'avg_transaction', 'sector', 'region']

# ---------------------------
# Model Loading
# ---------------------------
def load_ml_model():
    """Load ML model with proper error handling"""
    if os.path.exists(MODEL_PATH):
        try:
            model = joblib.load(MODEL_PATH)
            logger.info("✅ ML model loaded successfully")
            return model
        except Exception as e:
            logger.error(f"❌ Error loading ML model: {e}")
            return None
    else:
        logger.warning("⚠️ ML model not found. Train it first with training_pipeline.py")
        return None

# Load models
ml_model = load_ml_model()
scorer = RiskScorer(scaler_path=str(PKG_ROOT / "models" / "risk_scaler.pkl"))

# ---------------------------
# Validation Functions
# ---------------------------
def validate_request_data(data: Any) -> tuple[bool, str]:
    """Validate incoming request data"""
    if not data:
        return False, "No data provided"
    
    if not isinstance(data, list):
        return False, "Data must be a list of objects"
    
    if len(data) == 0:
        return False, "Empty data list"
    
    if len(data) > 1000:  # Prevent abuse
        return False, "Too many records (max 1000)"
    
    # Check required fields
    for i, record in enumerate(data):
        if not isinstance(record, dict):
            return False, f"Record {i} must be an object"
        
        for field in REQUIRED_FEATURES:
            if field not in record:
                return False, f"Missing required field '{field}' in record {i}"
            
            if not isinstance(record[field], (int, float)):
                return False, f"Field '{field}' must be numeric in record {i}"
    
    return True, "Valid"

def sanitize_dataframe(df: pd.DataFrame) -> pd.DataFrame:
    """Clean and sanitize DataFrame"""
    # Remove any non-numeric characters and convert to proper types
    for col in df.columns:
        if col in ['amount', 'transaction_count', 'avg_transaction']:
            df[col] = pd.to_numeric(df[col], errors='coerce')
    
    # Remove rows with NaN values
    df = df.dropna()
    
    return df

# ---------------------------
# Error Handling
# ---------------------------
@app.errorhandler(400)
def bad_request(error):
    return jsonify({"error": "Bad request", "message": str(error)}), 400

@app.errorhandler(500)
def internal_error(error):
    logger.error(f"Internal server error: {error}")
    return jsonify({"error": "Internal server error"}), 500

# ---------------------------
# Routes
# ---------------------------
@app.route('/', methods=['GET'])
def home():
    """API information endpoint"""
    return jsonify({
        "service": "AI Risk Scoring API",
        "version": "1.1.0",
        "endpoints": {
            "POST /predict/ml": "ML-based risk scoring",
            "POST /predict/manual": "Manual formula-based risk scoring",
            "GET /health": "Health check",
            "GET /": "This information"
        },
        "required_fields": REQUIRED_FEATURES,
        "optional_fields": OPTIONAL_FEATURES
    })

@app.route('/predict/ml', methods=['POST'])
def predict_ml():
    """ML model risk scoring with improved error handling"""
    try:
        if ml_model is None:
            return jsonify({
                "error": "ML model not available",
                "message": "Please train the model first using training_pipeline.py"
            }), 503
        
        # Get and validate data
        data, raw = parse_json_request()
        if data is None:
            return jsonify({"error": "Invalid JSON", "message": "Request body must be valid JSON"}), 400
        is_valid, message = validate_request_data(data)
        
        if not is_valid:
            return jsonify({"error": "Invalid input", "message": message}), 400
        
        # Create DataFrame, sanitize, and engineer features to match training pipeline
        df = pd.DataFrame(data)
        df = sanitize_dataframe(df)
        if df.empty:
            return jsonify({
                "error": "No valid records",
                "message": "All records contain invalid data"
            }), 400
        
        # Engineer features and select the same numeric matrix used in training
        features_df = create_features(df, group_by_taxpayer=False)
        X, _ = prepare_features_for_model(features_df, 'risk_label')
        # Replace problematic values to ensure JSON/ML compatibility
        X = X.replace([np.inf, -np.inf], 0).fillna(0)
        if X.empty:
            return jsonify({
                "error": "No valid features",
                "message": "Unable to engineer valid features for prediction"
            }), 400
        # Align columns to the scaler's fitted features (ensures order/coverage match training)
        try:
            expected_cols = list(getattr(scorer.scaler, 'feature_names_in_', []))
            if expected_cols:
                # Missing cols -> fill with 0; Extra cols -> drop
                for c in expected_cols:
                    if c not in X.columns:
                        X[c] = 0
                X = X[expected_cols]
        except Exception as e:
            logger.warning(f"Feature alignment warning (ML): {e}")
        logger.info(f"ML request len={len(raw)} cols={list(X.columns)[:5]}... total_cols={X.shape[1]} rows={X.shape[0]}")
        
        # Predict risk scores
        try:
            risk_probabilities = ml_model.predict_proba(X)
            if risk_probabilities.shape[1] > 1:
                risk_scores = risk_probabilities[:, 1] * 100  # High risk class probability
            else:
                risk_scores = risk_probabilities[:, 0] * 100
                
        except Exception as e:
            logger.error(f"Model prediction error: {e}")
            return jsonify({
                "error": "Prediction failed",
                "message": "Error during model prediction"
            }), 500
        
        return jsonify({
            "success": True,
            "risk_scores": [round(float(score), 2) for score in risk_scores],
            "method": "ML model (XGBoost)",
            "records_processed": len(risk_scores)
        })
        
    except Exception as e:
        logger.error(f"Error in predict_ml: {e}")
        return jsonify({
            "error": "Unexpected error",
            "message": "An unexpected error occurred during prediction"
        }), 500

@app.route('/predict/manual', methods=['POST'])
def predict_manual():
    """Manual formula-based risk scoring with validation"""
    try:
        # Get and validate data
        data, raw = parse_json_request()
        if data is None:
            return jsonify({"error": "Invalid JSON", "message": "Request body must be valid JSON"}), 400
        is_valid, message = validate_request_data(data)
        
        if not is_valid:
            return jsonify({"error": "Invalid input", "message": message}), 400
        
        # Create DataFrame, sanitize, and engineer features to match training pipeline
        df = pd.DataFrame(data)
        df = sanitize_dataframe(df)
        if df.empty:
            return jsonify({
                "error": "No valid records",
                "message": "All records contain invalid data"
            }), 400
        
        # Engineer features and select the same numeric matrix used in training
        features_df = create_features(df, group_by_taxpayer=False)
        X, _ = prepare_features_for_model(features_df, 'risk_label')
        # Replace problematic values
        X = X.replace([np.inf, -np.inf], 0).fillna(0)
        if X.empty:
            return jsonify({
                "error": "No valid features",
                "message": "Unable to engineer valid features for scoring"
            }), 400
        # Align columns to the scaler's fitted features
        try:
            expected_cols = list(getattr(scorer.scaler, 'feature_names_in_', []))
            if expected_cols:
                for c in expected_cols:
                    if c not in X.columns:
                        X[c] = 0
                X = X[expected_cols]
        except Exception as e:
            logger.warning(f"Feature alignment warning (manual): {e}")
        logger.info(f"Manual request len={len(raw)} cols={list(X.columns)[:5]}... total_cols={X.shape[1]} rows={X.shape[0]}")
        
        # Compute risk scores
        try:
            risk_scores = scorer.compute_risk_score(X)
        except Exception as e:
            logger.error(f"Manual scoring error: {e}")
            return jsonify({
                "error": "Scoring failed",
                "message": f"Error computing manual risk scores: {str(e)}"
            }), 500
        
        return jsonify({
            "success": True,
            "risk_scores": [round(float(score), 2) for score in risk_scores],
            "method": "Manual formula",
            "records_processed": len(risk_scores)
        })
        
    except Exception as e:
        logger.error(f"Error in predict_manual: {e}")
        return jsonify({
            "error": "Unexpected error",
            "message": "An unexpected error occurred during manual scoring"
        }), 500

@app.route('/health', methods=['GET'])
def health():
    """Enhanced health check with detailed status"""
    try:
        # Test scorer with engineered/aligned features to match training
        scorer_status = True
        try:
            df = pd.DataFrame([{"amount": 1000, "sector": "Retail", "region": "Ndola"}])
            features_df = create_features(df, group_by_taxpayer=False)
            X, _ = prepare_features_for_model(features_df, 'risk_label')
            expected_cols = list(getattr(scorer.scaler, 'feature_names_in_', []))
            if expected_cols:
                for c in expected_cols:
                    if c not in X.columns:
                        X[c] = 0
                X = X[expected_cols]
            _ = scorer.compute_risk_score(X)
        except Exception as e:
            scorer_status = False
            logger.error(f"Scorer health check failed: {e}")
        
        return jsonify({
            "status": "OK" if (ml_model is not None or scorer_status) else "DEGRADED",
            "timestamp": pd.Timestamp.now().isoformat(),
            "services": {
                "ml_model": {
                    "status": "available" if ml_model is not None else "unavailable",
                    "model_path": MODEL_PATH
                },
                "manual_scorer": {
                    "status": "available" if scorer_status else "error"
                }
            },
            "api_info": {
                "version": "1.1.0",
                "required_features": REQUIRED_FEATURES,
                "optional_features": OPTIONAL_FEATURES
            }
        })
        
    except Exception as e:
        logger.error(f"Health check error: {e}")
        return jsonify({
            "status": "ERROR",
            "message": "Health check failed"
        }), 500

# ---------------------------
# Training Endpoint
# ---------------------------
@app.route('/train', methods=['POST'])
def train():
    """Train an XGBoost model on uploaded CSV with selected features and params.

    Expects multipart/form-data with fields:
    - file: CSV file
    - features: JSON array of feature column names
    - target: target column name
    - learning_rate: float (optional)
    - n_estimators: int (optional)
    - test_size: float between 0 and 0.9 (optional)
    """
    try:
        if 'file' not in request.files:
            return jsonify({"error": "No file provided"}), 400

        file = request.files['file']
        if file.filename == '':
            return jsonify({"error": "Empty filename"}), 400

        try:
            df = pd.read_csv(file)
        except Exception as e:
            logger.error(f"CSV read error: {e}")
            return jsonify({"error": "Invalid CSV file"}), 400

        features_raw = request.form.get('features', '[]')
        try:
            features = json.loads(features_raw)
            if not isinstance(features, list):
                features = []
        except Exception:
            features = []

        target = request.form.get('target')
        if not target:
            return jsonify({"error": "Missing target column"}), 400

        if not features:
            # default: all numeric columns except target
            features = [c for c in df.select_dtypes(include=[np.number]).columns if c != target]

        missing_cols = [c for c in features + [target] if c not in df.columns]
        if missing_cols:
            return jsonify({"error": f"Missing columns: {missing_cols}"}), 400

        # Build X, y
        data = df[features + [target]].dropna()
        if data.empty:
            return jsonify({"error": "No valid rows after dropping NaNs"}), 400
        X = data[features]
        y = data[target]

        # Params
        try:
            learning_rate = float(request.form.get('learning_rate', 0.1))
        except Exception:
            learning_rate = 0.1
        try:
            n_estimators = int(request.form.get('n_trees', request.form.get('n_estimators', 100)))
        except Exception:
            n_estimators = 100
        try:
            test_size = float(request.form.get('test_size', 0.2))
            if test_size <= 0 or test_size >= 0.9:
                test_size = 0.2
        except Exception:
            test_size = 0.2

        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=test_size, random_state=42, stratify=y if len(y.unique()) > 1 else None
        )

        model = XGBClassifier(
            use_label_encoder=False,
            eval_metric='logloss',
            learning_rate=learning_rate,
            n_estimators=n_estimators
        )
        model.fit(X_train, y_train)

        # Metrics
        y_pred = model.predict(X_test)
        acc = float(accuracy_score(y_test, y_pred))
        f1 = float(f1_score(y_test, y_pred, average='weighted'))
        cm = confusion_matrix(y_test, y_pred)
        cm_list = cm.tolist()

        # Feature importances (if available)
        importances = []
        try:
            fi = getattr(model, 'feature_importances_', None)
            if fi is not None:
                importances = [
                    {"feature": f, "importance": float(v)} for f, v in zip(features, fi)
                ]
                importances.sort(key=lambda x: x["importance"], reverse=True)
        except Exception as e:
            logger.warning(f"Feature importance not available: {e}")

        # Save model and update in-memory reference
        try:
            joblib.dump(model, MODEL_PATH)
            global ml_model
            ml_model = model
        except Exception as e:
            logger.error(f"Failed to save model: {e}")

        # Fit and save scaler for manual scorer on the same features
        try:
            manual_scorer = RiskScorer()
            manual_scorer.fit_scaler(X)
        except Exception as e:
            logger.warning(f"Failed to fit scaler: {e}")

        return jsonify({
            "success": True,
            "metrics": {
                "accuracy": acc,
                "f1": f1,
                "confusion_matrix": cm_list
            },
            "features_used": features,
            "feature_importance": importances,
            "rows_used": int(len(data)),
            "test_size": test_size,
            "params": {
                "learning_rate": learning_rate,
                "n_estimators": n_estimators
            }
        })
    except Exception as e:
        logger.error(f"Training error: {e}")
        return jsonify({"error": "Training failed", "message": str(e)}), 500

# ---------------------------
# Run Flask
# ---------------------------
if __name__ == '__main__':
    # Port 5001 - Anomaly Tracker (AI Risk Scoring)
    port = int(os.environ.get('PORT', 5001))
    app.run(
        debug=False,  # Set to False in production
        host='0.0.0.0',  # Allow external connections
        port=port
    )