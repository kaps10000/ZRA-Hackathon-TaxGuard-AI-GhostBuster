"""
GhostBuster API Service
Flask API for phantom detection
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
from detector import PhantomDetector
import logging

app = Flask(__name__)
CORS(app)

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize detector
detector = PhantomDetector()

@app.route('/health', methods=['GET'])
def health():
    """Health check endpoint"""
    return jsonify({
        "status": "healthy",
        "service": "GhostBuster Detection API",
        "version": "1.0.0"
    })

@app.route('/detect/company', methods=['POST'])
def detect_company():
    """
    Detect ghost company
    
    Request body:
    {
        "tin": "123456789",
        "name": "ABC Trading Ltd",
        "address": "123 Main St",
        "phone": "+260123456789",
        "bank_account": "1234567890"
    }
    """
    try:
        company_data = request.get_json()
        
        if not company_data or 'tin' not in company_data:
            return jsonify({"error": "Company TIN is required"}), 400
        
        result = detector.detect_ghost_company(company_data)
        logger.info(f"Ghost company detection: TIN={company_data['tin']}, Risk={result['risk_score']}")
        
        return jsonify(result)
    
    except Exception as e:
        logger.error(f"Error detecting ghost company: {str(e)}")
        return jsonify({"error": str(e)}), 500

@app.route('/detect/employee', methods=['POST'])
def detect_employee():
    """
    Detect phantom employee
    
    Request body:
    {
        "nrc": "NRC123456",
        "name": "John Doe",
        "employer_tin": "1001",
        "salary": 5000,
        "bank_account": "9876543210"
    }
    """
    try:
        employee_data = request.get_json()
        
        if not employee_data or 'nrc' not in employee_data:
            return jsonify({"error": "Employee NRC is required"}), 400
        
        result = detector.detect_phantom_employee(employee_data)
        logger.info(f"Phantom employee detection: NRC={employee_data['nrc']}, Risk={result['risk_score']}")
        
        return jsonify(result)
    
    except Exception as e:
        logger.error(f"Error detecting phantom employee: {str(e)}")
        return jsonify({"error": str(e)}), 500

@app.route('/analyze/network', methods=['POST'])
def analyze_network():
    """
    Analyze entity network
    
    Request body:
    {
        "entities": [
            {"tin": "123", "name": "Company A", "address": "123 St"},
            {"tin": "456", "name": "Company B", "address": "123 St"}
        ]
    }
    """
    try:
        data = request.get_json()
        
        if not data or 'entities' not in data:
            return jsonify({"error": "Entities list is required"}), 400
        
        result = detector.analyze_network(data['entities'])
        logger.info(f"Network analysis: {result['network_count']} suspicious networks found")
        
        return jsonify(result)
    
    except Exception as e:
        logger.error(f"Error analyzing network: {str(e)}")
        return jsonify({"error": str(e)}), 500

@app.route('/stats', methods=['GET'])
def get_stats():
    """Get detection statistics"""
    # In production, these would come from a database
    return jsonify({
        "phantom_employees_detected": 12,
        "ghost_companies_flagged": 5,
        "shell_entities": 3,
        "related_networks": 8,
        "total_detections": 20
    })

if __name__ == '__main__':
    port = 3003
    logger.info(f"Starting GhostBuster API on port {port}")
    app.run(host='0.0.0.0', port=port, debug=True)
