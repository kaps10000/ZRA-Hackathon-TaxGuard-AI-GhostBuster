"""
GhostBuster Flask API
RESTful API for ghost employee detection system
"""

from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
from detection_engine import GhostBusterEngine
import pandas as pd
import json
import os
from datetime import datetime
from io import BytesIO

app = Flask(__name__)
CORS(app)

# Initialize detection engine
engine = GhostBusterEngine()

# Load datasets on startup
print("Loading datasets...")
if engine.load_datasets():
    print("[OK] Datasets loaded successfully")
else:
    print("[ERROR] Error loading datasets - run generate_datasets.py first")

@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'timestamp': datetime.now().isoformat(),
        'datasets_loaded': engine.napsa_df is not None
    })

@app.route('/api/analyze/individual', methods=['POST'])
def analyze_individual():
    """
    Analyze a single employee by NRC

    Request body:
    {
        "nrc": "123456/78/9",
        "full_name": "John Banda" (optional),
        "salary": 10000 (optional),
        "employment_start": "2018-01-15" (optional)
    }
    """
    try:
        data = request.get_json()

        if 'nrc' not in data:
            return jsonify({'error': 'NRC is required'}), 400

        nrc = data['nrc']
        full_name = data.get('full_name')
        salary = data.get('salary')
        employment_start = data.get('employment_start')

        if employment_start:
            employment_start = pd.to_datetime(employment_start)

        # Run analysis
        result = engine.analyze_employee(
            nrc=nrc,
            full_name=full_name,
            salary=salary,
            employment_start=employment_start
        )

        return jsonify(result)

    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/analyze/batch', methods=['POST'])
def analyze_batch():
    """
    Analyze multiple employees

    Request body:
    {
        "nrcs": ["123456/78/9", "987654/32/1", ...]
    }

    Or upload CSV/Excel file with 'nrc' column
    """
    try:
        # Check if file upload
        if 'file' in request.files:
            file = request.files['file']

            # Read file based on extension
            if file.filename.endswith('.csv'):
                df = pd.read_csv(file)
            elif file.filename.endswith(('.xlsx', '.xls')):
                df = pd.read_excel(file)
            else:
                return jsonify({'error': 'Unsupported file format. Use CSV or Excel'}), 400

            if 'nrc' not in df.columns:
                return jsonify({'error': 'File must contain "nrc" column'}), 400

            nrcs = df['nrc'].tolist()

        else:
            # JSON request
            data = request.get_json()

            if 'nrcs' not in data:
                return jsonify({'error': 'nrcs array is required'}), 400

            nrcs = data['nrcs']

        # Limit batch size
        if len(nrcs) > 1000:
            return jsonify({'error': 'Maximum 1000 records per batch'}), 400

        # Run batch analysis
        results = engine.batch_analyze(nrcs)

        # Calculate summary statistics
        summary = {
            'total_analyzed': len(results),
            'critical': len([r for r in results if r.get('risk_level') == 'CRITICAL']),
            'high': len([r for r in results if r.get('risk_level') == 'HIGH']),
            'medium': len([r for r in results if r.get('risk_level') == 'MEDIUM']),
            'low': len([r for r in results if r.get('risk_level') == 'LOW']),
            'confirmed_ghosts': len([r for r in results if r.get('classification') == 'CONFIRMED_GHOST']),
            'likely_ghosts': len([r for r in results if r.get('classification') == 'LIKELY_GHOST'])
        }

        return jsonify({
            'summary': summary,
            'results': results
        })

    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/export/csv', methods=['POST'])
def export_csv():
    """
    Export analysis results to CSV

    Request body: analysis results array
    """
    try:
        data = request.get_json()
        results = data.get('results', [])

        # Flatten results for CSV export
        flattened = []
        for result in results:
            if 'error' in result:
                continue

            row = {
                'NRC': result.get('nrc'),
                'Full Name': result.get('full_name'),
                'Age': result.get('age'),
                'Salary (ZMW)': result.get('salary'),
                'Risk Level': result.get('risk_level'),
                'Risk Score': result.get('risk_score'),
                'Classification': result.get('classification'),
                'Confidence': result.get('confidence'),
                'Red Flags': ', '.join(result.get('red_flags', [])),
                'Evidence Count': len(result.get('evidence', [])),
                'Recommendations': ' | '.join(result.get('recommendations', [])),
                'Total Paid (ZMW)': result.get('financial_impact', {}).get('total_paid'),
            }

            flattened.append(row)

        df = pd.DataFrame(flattened)

        # Create CSV in memory
        output = BytesIO()
        df.to_csv(output, index=False)
        output.seek(0)

        return send_file(
            output,
            mimetype='text/csv',
            as_attachment=True,
            download_name=f'ghostbuster_results_{datetime.now().strftime("%Y%m%d_%H%M%S")}.csv'
        )

    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/export/detailed', methods=['POST'])
def export_detailed():
    """
    Export detailed analysis with evidence to JSON
    """
    try:
        data = request.get_json()
        results = data.get('results', [])

        output = BytesIO()
        output.write(json.dumps(results, indent=2).encode('utf-8'))
        output.seek(0)

        return send_file(
            output,
            mimetype='application/json',
            as_attachment=True,
            download_name=f'ghostbuster_detailed_{datetime.now().strftime("%Y%m%d_%H%M%S")}.json'
        )

    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/stats', methods=['GET'])
def get_statistics():
    """Get overall system statistics"""
    try:
        stats = {
            'total_employees': len(engine.master_df) if engine.master_df is not None else 0,
            'total_napsa_records': len(engine.napsa_df) if engine.napsa_df is not None else 0,
            'total_nrc_records': len(engine.home_affairs_df) if engine.home_affairs_df is not None else 0,
            'total_bank_transactions': len(engine.bank_df) if engine.bank_df is not None else 0,
        }

        if engine.master_df is not None:
            stats['ghost_distribution'] = engine.master_df['ghost_type'].value_counts().to_dict()

        return jsonify(stats)

    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/search', methods=['GET'])
def search_employee():
    """
    Search for employee by NRC or name

    Query params: ?q=search_term
    """
    try:
        query = request.args.get('q', '').strip()

        if not query:
            return jsonify({'error': 'Search query required'}), 400

        if engine.master_df is None:
            return jsonify({'error': 'Datasets not loaded'}), 500

        # Search in master records
        results = engine.master_df[
            (engine.master_df['nrc'].str.contains(query, case=False, na=False)) |
            (engine.master_df['full_name'].str.contains(query, case=False, na=False))
        ].head(10)

        employees = results[['nrc', 'full_name', 'salary', 'ministry', 'ghost_type']].to_dict('records')

        return jsonify({
            'count': len(employees),
            'employees': employees
        })

    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/sample', methods=['GET'])
def get_sample_data():
    """Get sample NRCs for testing"""
    try:
        if engine.master_df is None:
            return jsonify({'error': 'Datasets not loaded'}), 500

        # Get samples from each ghost type
        samples = {}
        for ghost_type in engine.master_df['ghost_type'].unique():
            sample = engine.master_df[engine.master_df['ghost_type'] == ghost_type].head(3)
            samples[ghost_type] = sample[['nrc', 'full_name', 'salary']].to_dict('records')

        return jsonify(samples)

    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    print("\n" + "=" * 60)
    print("GhostBuster API Server")
    print("=" * 60)
    print("\nAPI Endpoints:")
    print("  POST /api/analyze/individual - Analyze single employee")
    print("  POST /api/analyze/batch      - Analyze multiple employees")
    print("  POST /api/export/csv         - Export results to CSV")
    print("  POST /api/export/detailed    - Export detailed JSON")
    print("  GET  /api/stats              - System statistics")
    print("  GET  /api/search?q=<query>   - Search employees")
    print("  GET  /api/sample             - Get sample data")
    print("  GET  /api/health             - Health check")
    port = int(os.environ.get('GHOSTBUSTER_PORT', 3006))
    print(f"\nStarting server on http://localhost:{port}")
    print("=" * 60 + "\n")

    app.run(debug=True, port=port, host='0.0.0.0')
