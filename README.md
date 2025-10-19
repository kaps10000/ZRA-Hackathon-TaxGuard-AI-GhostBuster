# GhostBuster - ZRA Ghost Employee Detection System

A state-of-the-art system to detect ghost employees in the Zambian government using multi-source data analysis.

## Features

- **Multi-Source Cross-Referencing**: NAPSA, Home Affairs (Death Registry), Bank Transactions
- **Advanced Pattern Detection**: Analyzes withdrawal patterns across 10+ Zambian banks
- **Evidence-Based Scoring**: Each flag includes detailed evidence and severity levels
- **Age-Based Detection**: Flags employees over retirement age (65+)
- **Duplicate Detection**: Identifies duplicate NRCs and identity theft
- **Modern Web UI**: Beautiful interface for individual and batch processing
- **Detailed Reporting**: Export results with full evidence trails

## Detection Capabilities

### Red Flags Detected:
- ✅ Deceased individuals still receiving salary
- ✅ Invalid or duplicate NRCs
- ✅ Missing or low NAPSA contributions
- ✅ Exact salary withdrawals (immediate, repetitive)
- ✅ Shell company transfers
- ✅ Over retirement age (65+)
- ✅ Suspicious withdrawal patterns

## Installation

### Backend Setup
```bash
cd backend
pip install -r requirements.txt
python generate_datasets.py  # Generate synthetic data
python app.py  # Start API server
```

### Frontend Setup
```bash
cd frontend
npm install
npm start
```

## Usage

1. **Individual Check**: Enter NRC number in the UI
2. **Batch Processing**: Upload CSV/Excel file with employee records
3. **View Results**: See risk scores, evidence, and recommendations
4. **Export Reports**: Download detailed reports for investigators

## Tech Stack

- **Backend**: Python, Flask, Pandas, Scikit-learn
- **Frontend**: React, Material-UI, Recharts
- **Data Processing**: NumPy, Faker (synthetic data)
- **Analysis**: Pattern detection, anomaly detection

## Dataset Structure

- **NAPSA**: 10,000 contribution records
- **Home Affairs**: 10,000 NRC registry records (includes death registry)
- **Bank Transactions**: 50,000+ transactions across 10 banks
- **Master Records**: 10,000 government employees

## License

MIT License - Built for ZRA Hackathon
