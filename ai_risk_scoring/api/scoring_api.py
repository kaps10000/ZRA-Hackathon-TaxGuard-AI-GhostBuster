from flask import Flask, request, jsonify
from flask_cors import CORS
import pandas as pd
import joblib
import os
import logging
from typing import Dict, List, Any
from models.risk_scoring_improved import RiskScorer

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize Flask with CORS
app = Flask(__name__)
CORS(app)  # Enable CORS for frontend integration

# Configuration
MODEL_PATH = os.path.join("models", "risk_model.pkl")
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
scorer = RiskScorer()

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
        data = request.get_json()
        is_valid, message = validate_request_data(data)
        
        if not is_valid:
            return jsonify({"error": "Invalid input", "message": message}), 400
        
        # Create DataFrame and sanitize
        df = pd.DataFrame(data)
        df = sanitize_dataframe(df)
        
        if df.empty:
            return jsonify({
                "error": "No valid records",
                "message": "All records contain invalid data"
            }), 400
        
        # Select only numeric columns for prediction
        numeric_df = df.select_dtypes(include=['number'])
        
        if numeric_df.empty:
            return jsonify({
                "error": "No numeric features",
                "message": "Unable to find numeric features for prediction"
            }), 400
        
        # Predict risk scores
        try:
            risk_probabilities = ml_model.predict_proba(numeric_df)
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
        data = request.get_json()
        is_valid, message = validate_request_data(data)
        
        if not is_valid:
            return jsonify({"error": "Invalid input", "message": message}), 400
        
        # Create DataFrame and sanitize
        df = pd.DataFrame(data)
        df = sanitize_dataframe(df)
        
        if df.empty:
            return jsonify({
                "error": "No valid records",
                "message": "All records contain invalid data"
            }), 400
        
        # Select numeric features
        numeric_df = df.select_dtypes(include=['number'])
        
        if numeric_df.empty:
            return jsonify({
                "error": "No numeric features",
                "message": "Unable to find numeric features for scoring"
            }), 400
        
        # Compute risk scores
        try:
            risk_scores = scorer.compute_risk_score(numeric_df)
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
        # Test scorer
        test_data = pd.DataFrame([{"amount": 1000}])
        scorer_status = True
        try:
            _ = scorer.compute_risk_score(test_data)
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