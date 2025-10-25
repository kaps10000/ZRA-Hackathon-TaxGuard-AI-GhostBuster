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
    print("✓ Datasets loaded successfully")
else:
    print("✗ Error loading datasets - run generate_datasets.py first")

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
        if engine.master_df is None:
            return jsonify({
                'error': 'Datasets not loaded',
                'total_employees': 0,
                'total_napsa_records': 0,
                'total_nrc_records': 0,
                'total_bank_transactions': 0,
                'ghost_distribution': {}
            }), 500
        
        stats = {
            'total_employees': int(len(engine.master_df)),
            'total_napsa_records': int(len(engine.napsa_df)) if engine.napsa_df is not None else 0,
            'total_nrc_records': int(len(engine.home_affairs_df)) if engine.home_affairs_df is not None else 0,
            'total_bank_transactions': int(len(engine.bank_df)) if engine.bank_df is not None else 0,
        }

        # Calculate ghost distribution with proper handling of NaN values
        if 'ghost_type' in engine.master_df.columns:
            # Drop NaN values and get counts
            ghost_counts = engine.master_df['ghost_type'].dropna().value_counts()
            stats['ghost_distribution'] = {str(k): int(v) for k, v in ghost_counts.to_dict().items()}
            
            # Add legitimate employees count (where ghost_type is NaN or 'legitimate')
            legitimate_count = len(engine.master_df[engine.master_df['ghost_type'].isna() | (engine.master_df['ghost_type'] == 'legitimate')])
            if legitimate_count > 0 and 'legitimate' not in stats['ghost_distribution']:
                stats['ghost_distribution']['legitimate'] = int(legitimate_count)
        else:
            stats['ghost_distribution'] = {}

        # Add additional useful statistics
        if engine.master_df is not None:
            stats['ghost_employees'] = int(len(engine.master_df[engine.master_df['is_ghost'] == True])) if 'is_ghost' in engine.master_df.columns else 0
            stats['legitimate_employees'] = int(len(engine.master_df)) - stats['ghost_employees']
            
            # Calculate total monthly cost of ghost employees
            if 'is_ghost' in engine.master_df.columns and 'salary' in engine.master_df.columns:
                ghost_salary_total = engine.master_df[engine.master_df['is_ghost'] == True]['salary'].sum()
                stats['ghost_salary_cost'] = float(ghost_salary_total) if not pd.isna(ghost_salary_total) else 0.0

        return jsonify(stats)

    except Exception as e:
        import traceback
        print(f"Error in /api/stats: {e}")
        traceback.print_exc()
        return jsonify({'error': str(e), 'details': traceback.format_exc()}), 500

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

        samples = {}
        
        # Get samples from each ghost type (excluding NaN)
        if 'ghost_type' in engine.master_df.columns:
            unique_types = engine.master_df['ghost_type'].dropna().unique()
            
            for ghost_type in unique_types:
                sample_df = engine.master_df[engine.master_df['ghost_type'] == ghost_type].head(5)
                
                # Convert to records with proper data type handling
                records = []
                for _, row in sample_df.iterrows():
                    records.append({
                        'nrc': str(row['nrc']),
                        'full_name': str(row['full_name']),
                        'salary': float(row['salary']) if not pd.isna(row['salary']) else 0.0,
                        'ghost_type': str(row['ghost_type']) if not pd.isna(row['ghost_type']) else 'unknown'
                    })
                
                samples[str(ghost_type)] = records
        
        # Add a few legitimate employees as well
        if 'is_ghost' in engine.master_df.columns:
            legitimate_sample = engine.master_df[engine.master_df['is_ghost'] == False].head(5)
            if len(legitimate_sample) > 0:
                records = []
                for _, row in legitimate_sample.iterrows():
                    records.append({
                        'nrc': str(row['nrc']),
                        'full_name': str(row['full_name']),
                        'salary': float(row['salary']) if not pd.isna(row['salary']) else 0.0,
                        'ghost_type': 'legitimate'
                    })
                samples['legitimate'] = records

        return jsonify(samples)

    except Exception as e:
        import traceback
        print(f"Error in /api/sample: {e}")
        traceback.print_exc()
        return jsonify({'error': str(e), 'details': traceback.format_exc()}), 500

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
    print("\nStarting server on http://localhost:3005")
    print("=" * 60 + "\n")

    app.run(debug=True, port=3005, host='0.0.0.0')
