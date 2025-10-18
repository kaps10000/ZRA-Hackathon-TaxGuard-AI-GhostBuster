"""
Predictive Analytics API Service
Flask API for revenue forecasting
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
from forecaster import RevenueForecaster
import logging

app = Flask(__name__)
CORS(app)

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize forecaster
forecaster = RevenueForecaster()

@app.route('/health', methods=['GET'])
def health():
    """Health check endpoint"""
    return jsonify({
        "status": "healthy",
        "service": "Predictive Analytics API",
        "version": "1.0.0"
    })

@app.route('/revenue-forecast', methods=['GET'])
def revenue_forecast():
    """
    Get revenue forecast
    Query params: months (default: 6)
    """
    try:
        months = int(request.args.get('months', 6))
        
        if months < 1 or months > 24:
            return jsonify({"error": "Months must be between 1 and 24"}), 400
        
        result = forecaster.forecast_revenue(months)
        logger.info(f"Revenue forecast generated for {months} months")
        
        return jsonify(result)
    
    except Exception as e:
        logger.error(f"Error generating forecast: {str(e)}")
        return jsonify({"error": str(e)}), 500

@app.route('/scenario-analysis', methods=['POST'])
def scenario_analysis():
    """
    Run scenario analysis
    
    Request body:
    {
        "type": "copper_impact" or "compliance_impact",
        "change_percent": -10 or +5
    }
    """
    try:
        data = request.get_json()
        
        if not data or 'type' not in data or 'change_percent' not in data:
            return jsonify({"error": "Type and change_percent are required"}), 400
        
        scenario_type = data['type']
        change_percent = float(data['change_percent'])
        
        if scenario_type == 'copper_impact':
            result = forecaster.analyze_copper_impact(change_percent)
        elif scenario_type == 'compliance_impact':
            result = forecaster.analyze_compliance_impact(change_percent)
        else:
            return jsonify({"error": "Invalid scenario type"}), 400
        
        logger.info(f"Scenario analysis: {scenario_type}, change={change_percent}%")
        
        return jsonify(result)
    
    except Exception as e:
        logger.error(f"Error running scenario: {str(e)}")
        return jsonify({"error": str(e)}), 500

@app.route('/compliance-trends', methods=['GET'])
def compliance_trends():
    """Get compliance trends"""
    try:
        result = forecaster.get_compliance_trends()
        logger.info("Compliance trends retrieved")
        
        return jsonify(result)
    
    except Exception as e:
        logger.error(f"Error getting compliance trends: {str(e)}")
        return jsonify({"error": str(e)}), 500

@app.route('/copper-impact', methods=['GET'])
def copper_impact():
    """Get copper price impact (default -10%)"""
    try:
        change = float(request.args.get('change', -10))
        result = forecaster.analyze_copper_impact(change)
        
        return jsonify(result)
    
    except Exception as e:
        logger.error(f"Error analyzing copper impact: {str(e)}")
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    port = 3004
    logger.info(f"Starting Predictive Analytics API on port {port}")
    app.run(host='0.0.0.0', port=port, debug=True)
