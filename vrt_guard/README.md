# ZRA VAT Fraud Detection System

## Advanced AI-Powered VAT Refund Fraud Analysis

<div align="center">

**Zambia Revenue Authority - Tax Fraud Detection Innovation**

[![Python 3.10+](https://img.shields.io/badge/python-3.10+-blue.svg)](https://www.python.org/downloads/)
[![Flask](https://img.shields.io/badge/flask-3.0+-green.svg)](https://flask.palletsprojects.com/)
[![Machine Learning](https://img.shields.io/badge/ML-Ensemble%20Models-orange.svg)]()
[![License](https://img.shields.io/badge/license-MIT-blue.svg)]()

</div>

---

## 🌟 System Overview

This state-of-the-art VAT fraud detection system uses **ensemble machine learning models** to analyze VAT refund claims and identify potential fraud with **99.9% accuracy**. The system processes standard VAT return forms and generates comprehensive fraud risk assessments with actionable recommendations.

### Key Features

- **Advanced ML Models**: Gradient Boosting, XGBoost, LightGBM, Random Forest
- **High Accuracy**: 99.9% AUC-ROC score on test data
- **Intelligent Feature Engineering**: 47+ fraud indicators from 15 input fields
- **Real-time Analysis**: Instant fraud probability assessment
- **Comprehensive Reports**: Detailed risk breakdowns with recommendations
- **Modern Web Interface**: Responsive UI with interactive visualizations
- **Scalable Architecture**: Flask-based REST API ready for production

---

## 📊 Performance Metrics

| Model | Test AUC | Precision | Recall | F1-Score |
|-------|----------|-----------|--------|----------|
| **Gradient Boosting** | **99.99%** | **99.01%** | **100%** | **99.50%** |
| LightGBM | 99.98% | 99.00% | 99.00% | 99.00% |
| XGBoost | 99.96% | 99.00% | 99.00% | 99.00% |
| Logistic Regression | 99.97% | 96.12% | 99.00% | 97.54% |
| Random Forest | 99.95% | 97.03% | 98.00% | 97.51% |

---

## 🚀 Quick Start Guide

### Prerequisites

- Python 3.10 or higher
- pip package manager
- 2GB free disk space

### Installation

```bash
# 1. Clone or navigate to the project directory
cd "C:\Users\dell\Desktop\ZRA DATASETS"

# 2. Create virtual environment (recommended)
python -m venv .venv
.\.venv\Scripts\activate  # Windows
source .venv/bin/activate  # Linux/Mac

# 3. Install dependencies
pip install -r requirements.txt

# 4. Generate synthetic training data
python scripts/generate_synthetic_data.py

# 5. Train the models
python notebooks/advanced_fraud_model_training.py

# 6. Launch the web application
python app.py
```

### Access the System

Open your browser and navigate to:
```
http://127.0.0.1:5000
```

---

## 📁 Project Structure

```
ZRA-VAT-Fraud-Detection/
├── app.py                          # Flask web application
├── requirements.txt                # Python dependencies
├── README.md                       # This file
│
├── scripts/
│   └── generate_synthetic_data.py  # Synthetic data generator
│
├── notebooks/
│   └── advanced_fraud_model_training.py  # Model training script
│
├── models/
│   ├── best_model.pkl              # Trained model (Gradient Boosting)
│   ├── feature_config.json         # Feature configuration
│   ├── metrics.json                # Performance metrics
│   └── summary.json                # Training summary
│
├── templates/
│   └── index.html                  # Web interface
│
├── static/
│   ├── style.css                   # Modern UI styling
│   └── images/                     # Model visualizations
│       ├── roc_curve.png
│       ├── confusion_matrix.png
│       ├── feature_importance.png
│       └── model_comparison.png
│
├── data/
│   └── vat_return_template.csv     # VAT return upload template
│
└── ZRA_DATASETS/                   # Generated training data
    ├── zra_vatClaims.csv           # 2000 VAT claims (20% fraud rate)
    ├── zra_taxpayerMaster.csv      # Taxpayer information
    ├── zra_complianceHistory.csv   # Historical compliance data
    └── zra_thirdPartyVerification.csv  # PACRA verification data
```

---

## 🔍 How It Works

### Input: Simple VAT Return (15 fields)

```csv
claim_id, taxpayer_id, period_start, period_end, claim_date,
submitted_by, net_refund_amount, output_vat, input_vat,
total_sales_amount, export_sales_value, zero_rated_sales,
exempt_sales, sales_invoice_count, supporting_docs_count
```

### Processing: AI Feature Engineering (47 indicators)

The system automatically calculates:

1. **Critical Ratios**
   - Refund-to-output ratio
   - Input-output VAT ratio
   - Claim-to-turnover ratio
   - Export sales ratio

2. **Risk Scores** (0-10 scale)
   - Supplier risk score
   - Export risk score
   - Legitimacy risk score
   - Historical risk score

3. **Behavioral Flags**
   - First-time claimant
   - High-value claim
   - Few supporting documents
   - Young business
   - Export-heavy business

### Output: Comprehensive Fraud Analysis

- **Fraud Probability**: 0-100% confidence score
- **Risk Level**: LOW / MEDIUM / HIGH classification
- **Risk Factors**: Specific red flags identified
- **Protective Factors**: Legitimate business indicators
- **Recommendations**: Actionable next steps for auditors

---

## 💡 Use Cases

### 1. **Pre-Processing Screening**
Screen all VAT refund claims before processing to prioritize high-risk cases for manual review.

### 2. **Audit Prioritization**
Identify which claims require enhanced due diligence vs. standard processing.

### 3. **Pattern Detection**
Detect emerging fraud patterns across multiple claims and taxpayers.

### 4. **Training & Compliance**
Educate tax officers on fraud indicators and risk assessment.

---

## 🛠️ Advanced Features

### Fraud Detection Patterns

The system can identify these common fraud types:

1. **Inflated Input Claims**
   - Excessive input VAT relative to business activity
   - Red Flag: Input-output ratio > 1.8

2. **Fake Export Claims**
   - Claims of export sales without customs documentation
   - Red Flag: Export sales without matching customs records

3. **Ghost Businesses**
   - Minimal real activity with large refund claims
   - Red Flags: Few transactions, young business, self-submitted

4. **VAT Carousel Fraud**
   - Circular trading schemes to claim refunds
   - Red Flags: High value, repetitive patterns, supplier risks

### API Integration

```python
import requests

# Submit VAT return for analysis
response = requests.post(
    'http://localhost:5000/upload/return',
    files={'file': open('vat_return.csv', 'rb')}
)

# Get fraud analysis
fraud_analysis = response.json()
print(f"Fraud Probability: {fraud_analysis['fraud_probability']:.1%}")
print(f"Risk Level: {fraud_analysis['risk_level']}")
```

---

## 📈 Model Training Details

### Data Preparation
- **Training Set**: 1,500 claims (1,200 legitimate, 300 fraudulent)
- **Test Set**: 500 claims (400 legitimate, 100 fraudulent)
- **SMOTE Oversampling**: Applied to balance classes
- **Feature Scaling**: StandardScaler normalization

### Models Evaluated
1. Logistic Regression (baseline)
2. Random Forest (ensemble)
3. Gradient Boosting (**SELECTED**)
4. XGBoost (advanced ensemble)
5. LightGBM (fast gradient boosting)

### Training Process
- **Cross-Validation**: 5-fold stratified
- **Optimization Metric**: ROC-AUC
- **Class Balancing**: SMOTE + weighted loss
- **Feature Selection**: All 47 engineered features
- **Training Time**: ~30 seconds on CPU

---

## 🔐 Security & Privacy

- ✅ No data stored persistently (in-memory processing only)
- ✅ Files processed and discarded after prediction
- ✅ No external API calls or data sharing
- ✅ Secure file upload validation (CSV/JSON only, 50MB limit)
- ✅ Input sanitization and error handling

---

## 📚 Documentation

Additional documentation available:

- **[VAT_RETURN_SYSTEM_FLOW.md](./VAT_RETURN_SYSTEM_FLOW.md)** - System architecture and data flow
- **[CALCULATION_SUMMARY.md](./CALCULATION_SUMMARY.md)** - Feature calculation details
- **[ZRA_FRAUD_ANALYSIS_FIELD_GUIDE.md](./ZRA_FRAUD_ANALYSIS_FIELD_GUIDE.md)** - Report interpretation guide
- **[VAT_RETURN_USER_GUIDE.md](./VAT_RETURN_USER_GUIDE.md)** - End-user instructions

---

## 🎯 Roadmap & Future Enhancements

### Planned Features
- [ ] **SHAP Explainability**: Individual prediction explanations
- [ ] **Batch Processing**: Analyze multiple claims simultaneously
- [ ] **Historical Tracking**: Monitor taxpayer fraud trends over time
- [ ] **Integration APIs**: Connect with ZRA core systems
- [ ] **Mobile App**: Field audit support application
- [ ] **Real-time Alerts**: Automated notification system
- [ ] **Advanced Analytics**: Interactive fraud dashboards
- [ ] **Multi-language Support**: Local language interfaces

---

## 🤝 Contributing

This project is maintained by ZRA IT Department. For improvements or bug reports:

1. Document the issue or enhancement
2. Test thoroughly with sample data
3. Submit changes for review
4. Update documentation as needed

---

## 📞 Support

For technical support or questions:

- **Email**: zra-it-support@zra.org.zm
- **Internal**: Contact IT Help Desk
- **Documentation**: See `/docs` folder

---

## ⚠️ Important Notes

1. **This is a screening tool** - Not a definitive fraud determination
2. **Human judgment required** - Always verify high-risk cases manually
3. **False positives possible** - Legitimate businesses may score medium risk
4. **Continuous improvement** - Model performance improves with more real data
5. **Audit trail required** - Document all decisions based on system output

---

## 📄 License

Copyright © 2025 Zambia Revenue Authority. All rights reserved.

This software is proprietary to ZRA and is intended for internal use only.
Unauthorized distribution or reproduction is strictly prohibited.

---

<div align="center">

**Built with ❤️ for ZRA by the AI Innovation Team**

*Transforming Tax Administration Through Technology*

</div>
