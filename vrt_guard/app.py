from __future__ import annotations
import os
import io
import json
import zipfile
from datetime import datetime
from pathlib import Path
from typing import Dict, Any, List, Tuple

from flask import Flask, render_template, request, jsonify, send_from_directory
import pandas as pd
import numpy as np
import joblib

APP_ROOT = Path(__file__).resolve().parent
MODELS_DIR = APP_ROOT / 'models'
DATA_DIR = APP_ROOT / 'data'
STATIC_DIR = APP_ROOT / 'static'

FEATURE_CONFIG_PATH = MODELS_DIR / 'feature_config.json'
MODEL_PATH = MODELS_DIR / 'best_model.pkl'
METRICS_PATH = MODELS_DIR / 'metrics.json'
SUMMARY_PATH = MODELS_DIR / 'summary.json'

app = Flask(__name__)
# Increase upload size to accommodate zipped datasets / Excel bundles (50MB)
app.config['MAX_CONTENT_LENGTH'] = 50 * 1024 * 1024

# Lazy-loaded global artifacts
_model = None
_feature_config: Dict[str, Any] = {}
_metrics: Dict[str, Any] = {}
_summary: Dict[str, Any] = {}

@app.before_request
def before_request():
    """Ensure artifacts are loaded before handling any request"""
    ensure_loaded()


def load_artifacts():
    global _model, _feature_config, _metrics, _summary
    print(f"Loading artifacts from {MODELS_DIR}...")
    
    if FEATURE_CONFIG_PATH.exists():
        _feature_config = json.loads(FEATURE_CONFIG_PATH.read_text())
        print(f"✓ Loaded feature config with {len(_feature_config.get('features', []))} features")
    else:
        print(f"⚠ Warning: Feature config not found at {FEATURE_CONFIG_PATH}")
        
    if METRICS_PATH.exists():
        _metrics = json.loads(METRICS_PATH.read_text())
        print(f"✓ Loaded model metrics")
    else:
        print(f"⚠ Warning: Metrics not found at {METRICS_PATH}")
        
    if SUMMARY_PATH.exists():
        _summary = json.loads(SUMMARY_PATH.read_text())
        print(f"✓ Loaded summary")
    else:
        print(f"⚠ Warning: Summary not found at {SUMMARY_PATH}")
        
    if MODEL_PATH.exists():
        try:
            _model = joblib.load(MODEL_PATH)
            print(f"✓ Model loaded successfully: {type(_model)}")
        except Exception as e:
            print(f"✗ Error loading model from {MODEL_PATH}: {e}")
            import traceback
            traceback.print_exc()
            print("  Service will run in limited mode without predictions.")
            _model = None
    else:
        print(f"✗ Model file not found at {MODEL_PATH}")
        _model = None


def ensure_loaded():
    global _model, _feature_config
    if _model is None or not _feature_config:
        print("Ensuring artifacts are loaded...")
        load_artifacts()
    if _model is None:
        print("WARNING: Model is still None after load_artifacts()")


def _allowed_file(filename: str) -> bool:
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in {'csv', 'json'}


def _allowed_dataset_bundle(filename: str) -> bool:
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in {'zip', 'xlsx'}


def _predict_dataframe(df_features: pd.DataFrame) -> pd.DataFrame:
    """Ensure feature order and run predictions, returning df with outputs."""
    features = _feature_config.get('features', [])
    if not features:
        raise RuntimeError('Feature config not found. Train the model first.')

    # Keep any id columns present for output (optional)
    id_cols = set(_feature_config.get('id_cols', [])) & set(df_features.columns)
    X = df_features.copy()

    # Subset and order columns as per training; missing columns default to 0
    for col in features:
        if col not in X.columns:
            X[col] = 0
    X = X[features]

    # Predict
    if hasattr(_model, 'predict_proba'):
        probs = _model.predict_proba(X)[:, 1]
    else:
        d = _model.decision_function(X)
        probs = 1 / (1 + np.exp(-d))
    preds = (probs >= 0.5).astype(int)

    out_cols: List[str] = []
    if id_cols:
        out_cols.extend([c for c in _feature_config.get('id_cols', []) if c in df_features.columns])
    out = pd.DataFrame({'fraud_probability': probs, 'prediction': preds})
    if out_cols:
        out = pd.concat([df_features[list(out_cols)].reset_index(drop=True), out], axis=1)
    return out


def _analyze_fraud_probability(df_features: pd.DataFrame, fraud_prob: float, row_idx: int = 0) -> Dict[str, Any]:
    """Generate detailed fraud analysis report for a single record."""
    row = df_features.iloc[row_idx]
    
    analysis = {
        'fraud_probability': fraud_prob,
        'risk_level': 'HIGH' if fraud_prob > 0.7 else 'MEDIUM' if fraud_prob > 0.3 else 'LOW',
        'key_indicators': [],
        'risk_factors': [],
        'protective_factors': [],
        'detailed_analysis': {
            'claim_patterns': {},
            'business_profile': {},
            'transaction_behavior': {},
            'compliance_history': {},
            'risk_scores': {}
        },
        'recommendations': []
    }
    
    # Analyze Claim Patterns
    claim_analysis = analysis['detailed_analysis']['claim_patterns']
    
    # Refund amount and ratios
    net_refund = row.get('net_refund_amount', 0)
    refund_ratio = row.get('refund_to_output_ratio', 0)
    input_output_ratio = row.get('input_output_vat_ratio', 1)
    
    claim_analysis['net_refund_amount'] = f"ZMW {net_refund:,.0f}"
    claim_analysis['refund_to_output_ratio'] = f"{refund_ratio:.3f}"
    claim_analysis['input_output_vat_ratio'] = f"{input_output_ratio:.3f}"
    
    # High-risk claim patterns
    if refund_ratio > 0.8:
        analysis['risk_factors'].append(f"Very high refund-to-output ratio ({refund_ratio:.2f}) - suggests minimal legitimate business activity")
    elif refund_ratio > 0.5:
        analysis['risk_factors'].append(f"High refund-to-output ratio ({refund_ratio:.2f}) - requires verification")
    else:
        analysis['protective_factors'].append(f"Normal refund-to-output ratio ({refund_ratio:.2f}) - indicates legitimate business activity")
    
    if input_output_ratio > 1.8:
        analysis['risk_factors'].append(f"Excessive input VAT ratio ({input_output_ratio:.2f}) - possible inflated input claims")
    elif input_output_ratio < 1.1:
        analysis['protective_factors'].append(f"Conservative input VAT ratio ({input_output_ratio:.2f}) - suggests genuine business")
    
    # Claim frequency and timing
    if row.get('is_first_time_claimant', 0):
        analysis['risk_factors'].append("First-time claimant - higher scrutiny required")
    
    if row.get('is_high_value_claim', 0):
        analysis['risk_factors'].append("High-value claim (top 10%) - requires enhanced verification")
    
    processing_zscore = row.get('processing_days_zscore', 0)
    if processing_zscore < -1:
        analysis['risk_factors'].append("Unusually fast processing request - may indicate urgency to obtain funds")
    elif processing_zscore > 1:
        analysis['protective_factors'].append("Normal processing timeframe - no urgency concerns")
    
    # Business Profile Analysis
    business_analysis = analysis['detailed_analysis']['business_profile']
    
    business_age = row.get('business_age_years', 0)
    business_analysis['business_age'] = f"{business_age:.1f} years"
    
    if row.get('is_young_business', 0):
        analysis['risk_factors'].append(f"Young business (<2 years old) - limited trading history")
    else:
        analysis['protective_factors'].append(f"Established business ({business_age:.1f} years) - good trading history")
    
    if row.get('single_director', 0):
        analysis['risk_factors'].append("Single director company - concentrated control")
    
    if row.get('is_sole_proprietor', 0):
        analysis['risk_factors'].append("Sole proprietorship - individual control structure")
    
    # Address and verification issues
    if row.get('address_not_verified', 0):
        analysis['risk_factors'].append("Address not verified - location concerns")
    
    if row.get('bank_not_verified', 0):
        analysis['risk_factors'].append("Bank account not verified - payment destination unclear")
    
    # Tax agent usage
    if row.get('submitted_by_agent', 0):
        analysis['protective_factors'].append("Submitted by tax agent - professional oversight")
    elif row.get('no_tax_agent', 0):
        analysis['risk_factors'].append("No tax agent - lacks professional oversight")
    
    # Transaction Behavior Analysis
    transaction_analysis = analysis['detailed_analysis']['transaction_behavior']
    
    # Supplier diversity and verification
    if row.get('low_supplier_diversity', 0):
        analysis['risk_factors'].append("Low supplier diversity (≤3 suppliers) - limited business network")
    
    if row.get('has_unverified_suppliers', 0):
        unverified_ratio = row.get('unverified_supplier_ratio', 0)
        analysis['risk_factors'].append(f"Unverified suppliers present ({unverified_ratio:.1%} of suppliers) - supply chain risks")
    
    if row.get('has_few_purchases', 0):
        analysis['risk_factors'].append("Few purchase transactions - limited business activity")
    
    if row.get('suspicious_purchase_pattern', 0):
        analysis['risk_factors'].append("Suspicious purchase patterns detected - uniform transaction amounts")
    
    # Sales patterns
    if row.get('has_export_sales', 0):
        if row.get('is_export_heavy', 0):
            analysis['protective_factors'].append("Export-heavy business - legitimate reason for VAT refunds")
        else:
            analysis['protective_factors'].append("Has export sales - supports refund claim")
    
    if row.get('has_missing_export_docs', 0):
        analysis['risk_factors'].append("Missing export documentation - incomplete evidence")
    
    if row.get('has_unpaid_sales', 0):
        analysis['risk_factors'].append("Unpaid sales present - cash flow concerns")
    
    if row.get('single_export_destination', 0):
        analysis['risk_factors'].append("Single export destination - limited market diversification")
    
    # Customs verification
    if row.get('export_without_customs', 0):
        analysis['risk_factors'].append("Export sales without customs records - documentation gap")
    
    if row.get('large_export_customs_mismatch', 0):
        analysis['risk_factors'].append("Large mismatch between export sales and customs data - verification required")
    
    # Compliance History Analysis
    compliance_analysis = analysis['detailed_analysis']['compliance_history']
    
    if row.get('never_audited', 0):
        analysis['risk_factors'].append("Never been audited - no compliance verification history")
    
    if row.get('has_audit_issues', 0):
        analysis['risk_factors'].append("Previous audit issues found - compliance concerns")
    
    if row.get('has_penalties', 0):
        analysis['risk_factors'].append("Previous penalties imposed - compliance violations")
    
    if row.get('low_compliance_rating', 0):
        analysis['risk_factors'].append("Low compliance rating (<60) - poor compliance track record")
    
    # PACRA verification
    if row.get('not_registered_pacra', 0):
        analysis['risk_factors'].append("Not registered with PACRA - legitimacy concerns")
    
    if row.get('directors_mismatch', 0):
        analysis['risk_factors'].append("Directors mismatch with PACRA records - identity verification issues")
    
    if row.get('address_mismatch_pacra', 0):
        analysis['risk_factors'].append("Address mismatch with PACRA records - location verification issues")
    
    if row.get('is_dormant_company', 0):
        analysis['risk_factors'].append("Dormant company status - inactive business claiming refunds")
    
    # Business size validation
    claim_to_turnover = row.get('claim_to_turnover_ratio', 0)
    if row.get('claim_exceeds_business_size', 0):
        analysis['risk_factors'].append(f"Refund claim exceeds reasonable business size (claim-to-turnover: {claim_to_turnover:.1%})")
    
    if row.get('claim_exceeds_share_capital', 0):
        analysis['risk_factors'].append("Refund claim exceeds 10x share capital - disproportionate to company size")
    
    # Risk Scores Analysis
    risk_scores = analysis['detailed_analysis']['risk_scores']
    supplier_risk = row.get('supplier_risk_score', 0)
    export_risk = row.get('export_risk_score', 0)
    legitimacy_risk = row.get('legitimacy_risk_score', 0)
    historical_risk = row.get('historical_risk_score', 0)
    
    risk_scores['supplier_risk'] = f"{supplier_risk}/10"
    risk_scores['export_risk'] = f"{export_risk}/10"
    risk_scores['legitimacy_risk'] = f"{legitimacy_risk}/10"
    risk_scores['historical_risk'] = f"{historical_risk}/10"
    
    # Key indicators summary
    total_risk_factors = len(analysis['risk_factors'])
    total_protective_factors = len(analysis['protective_factors'])
    
    if total_risk_factors > 8:
        analysis['key_indicators'].append(f"Multiple red flags detected ({total_risk_factors} risk factors)")
    elif total_risk_factors > 4:
        analysis['key_indicators'].append(f"Several concerns identified ({total_risk_factors} risk factors)")
    
    if total_protective_factors > 4:
        analysis['key_indicators'].append(f"Strong positive indicators ({total_protective_factors} protective factors)")
    
    # Recommendations
    if fraud_prob > 0.7:
        analysis['recommendations'].extend([
            "IMMEDIATE REVIEW REQUIRED - High fraud probability",
            "Conduct thorough document verification",
            "Verify business premises and operations",
            "Cross-check with customs and PACRA records",
            "Consider on-site audit before processing refund"
        ])
    elif fraud_prob > 0.3:
        analysis['recommendations'].extend([
            "Enhanced due diligence recommended",
            "Verify supporting documentation",
            "Cross-reference with external databases",
            "Monitor for future claims patterns"
        ])
    else:
        analysis['recommendations'].extend([
            "Standard processing acceptable",
            "Routine verification sufficient",
            "Monitor for any unusual patterns in future claims"
        ])
    
    return analysis


def _safe_ratio(a, b):
    b = np.where(pd.Series(b).fillna(0) == 0, np.nan, b)
    return np.array(a, dtype=float) / np.array(b, dtype=float)


def _years_from_date(datestr: Any) -> float:
    try:
        dt = pd.to_datetime(datestr)
        return max(0.0, (pd.Timestamp(datetime.utcnow().date()) - dt).days / 365.25)
    except Exception:
        return np.nan


def _featureize_from_intake(df: pd.DataFrame) -> pd.DataFrame:
    """Map a simplified intake CSV to the model's feature frame.
    The intake schema is documented in the downloadable template (data/intake_template.csv).
    Unknown or missing fields default sensibly to 0/NaN before model preprocessing.
    """
    features = _feature_config.get('features', [])
    if not features:
        raise RuntimeError('Feature config not found. Train the model first.')

    # Start with zeros for all expected features
    out = pd.DataFrame(0, index=df.index, columns=features, dtype=float)

    # Convenience getters with defaults
    g = df.get
    nz = lambda x: pd.to_numeric(x, errors='coerce').fillna(0.0)

    net_refund = nz(g('net_refund_amount')) if 'net_refund_amount' in df.columns else 0.0
    output_vat = nz(g('output_vat')) if 'output_vat' in df.columns else 0.0
    input_vat = nz(g('input_vat')) if 'input_vat' in df.columns else 0.0
    processing_days = nz(g('processing_days')) if 'processing_days' in df.columns else 0.0
    total_claims = nz(g('total_claims_filed')) if 'total_claims_filed' in df.columns else 0.0
    docs_count = nz(g('docs_count')) if 'docs_count' in df.columns else 0.0
    turnover = nz(g('turnover')) if 'turnover' in df.columns else 0.0
    directors_count = nz(g('directors_count')) if 'directors_count' in df.columns else 0.0
    supplier_count = nz(g('supplier_count')) if 'supplier_count' in df.columns else 0.0
    unverified_supplier_count = nz(g('unverified_supplier_count')) if 'unverified_supplier_count' in df.columns else 0.0
    purchases_count = nz(g('purchases_count')) if 'purchases_count' in df.columns else 0.0
    export_sales_value = nz(g('export_sales_value')) if 'export_sales_value' in df.columns else 0.0
    sales_count = nz(g('sales_count')) if 'sales_count' in df.columns else 0.0
    export_destination_count = nz(g('export_destination_count')) if 'export_destination_count' in df.columns else 0.0
    customs_export_value = nz(g('customs_export_value')) if 'customs_export_value' in df.columns else 0.0
    customs_mismatch_value = nz(g('customs_mismatch_value')) if 'customs_mismatch_value' in df.columns else 0.0
    share_capital = nz(g('share_capital')) if 'share_capital' in df.columns else 0.0

    # Flags (coerce to 0/1)
    b = lambda name: (pd.to_numeric(g(name), errors='coerce').fillna(0.0).astype(int) if name in df.columns else 0)
    submitted_by_agent = b('submitted_by_agent')
    has_tax_agent = b('has_tax_agent')
    is_sole_proprietor = b('is_sole_proprietor')
    payments_unverified_flag = b('payments_unverified_flag')
    suspicious_purchase_flag = b('suspicious_purchase_flag')
    export_docs_missing = b('export_docs_missing')
    unpaid_sales_flag = b('unpaid_sales_flag')
    customs_unverified_flag = b('customs_unverified_flag')
    audit_issues_count = nz(g('audit_issues_count')) if 'audit_issues_count' in df.columns else 0.0
    penalties_count = nz(g('penalties_count')) if 'penalties_count' in df.columns else 0.0
    compliance_rating = nz(g('compliance_rating')) if 'compliance_rating' in df.columns else 0.0
    ever_audited_flag = b('ever_audited_flag')
    pacra_registered_flag = b('pacra_registered_flag')
    directors_mismatch_flag = b('directors_mismatch_flag')
    address_mismatch_flag = b('address_mismatch_flag')
    dormant_flag = b('dormant_flag')

    # No composite risk scores expected from intake; they will be computed from raw flags below

    # Derived features matching model schema where possible
    out['net_refund_amount'] = net_refund
    out['refund_to_output_ratio'] = _safe_ratio(net_refund, np.maximum(output_vat, 1e-9))
    out['input_output_vat_ratio'] = _safe_ratio(input_vat, np.maximum(output_vat, 1e-9))

    # Heuristic z-score around a nominal mean/std (adjust as needed)
    out['processing_days_zscore'] = (processing_days - 30.0) / 15.0

    out['total_claims_filed'] = total_claims
    out['is_first_time_claimant'] = (total_claims <= 1).astype(int)
    out['is_high_value_claim'] = (net_refund > 10000).astype(int)
    out['submitted_by_agent'] = submitted_by_agent
    out['has_few_documents'] = (docs_count < 5).astype(int)

    # Business age - use directly if provided, otherwise calculate from date
    if 'business_age_years' in df.columns:
        age_years = nz(g('business_age_years'))
    elif 'business_start_date' in df.columns:
        age_years = df['business_start_date'].apply(_years_from_date)
    elif 'business_start_year' in df.columns:
        age_years = datetime.utcnow().year - pd.to_numeric(df['business_start_year'], errors='coerce').fillna(datetime.utcnow().year)
    else:
        age_years = pd.Series(np.nan, index=df.index)
    out['business_age_years'] = age_years
    out['is_young_business'] = (age_years < 2).fillna(0).astype(int)

    out['address_not_verified'] = (address_mismatch_flag > 0).astype(int)
    out['bank_not_verified'] = 0  # not provided in intake

    out['is_small_business'] = (turnover < 500000).astype(int)
    out['claim_to_turnover_ratio'] = _safe_ratio(net_refund, np.maximum(turnover, 1e-9))
    out['claim_exceeds_business_size'] = (out['claim_to_turnover_ratio'] > 0.1).astype(int)

    out['single_director'] = (directors_count == 1).astype(int)
    out['no_tax_agent'] = (has_tax_agent == 0).astype(int)
    out['is_sole_proprietor'] = is_sole_proprietor

    out['low_supplier_diversity'] = (supplier_count <= 3).astype(int)
    out['has_unverified_suppliers'] = (unverified_supplier_count > 0).astype(int)
    out['unverified_supplier_ratio'] = _safe_ratio(unverified_supplier_count, np.maximum(supplier_count, 1))

    out['has_unverified_payments'] = payments_unverified_flag
    out['has_few_purchases'] = (purchases_count < 10).astype(int)
    out['suspicious_purchase_pattern'] = suspicious_purchase_flag

    out['has_export_sales'] = (export_sales_value > 0).astype(int)
    out['is_export_heavy'] = (export_sales_value > 0.5 * turnover).astype(int)
    out['has_missing_export_docs'] = export_docs_missing
    out['has_unpaid_sales'] = unpaid_sales_flag
    out['has_few_sales'] = (sales_count < 10).astype(int)
    out['single_export_destination'] = ((export_destination_count == 1) & (export_sales_value > 0)).astype(int)

    out['export_without_customs'] = ((export_sales_value > 0) & (customs_export_value == 0)).astype(int)
    mismatch_ratio = _safe_ratio(np.abs(export_sales_value - customs_export_value), np.maximum(export_sales_value, 1))
    out['large_export_customs_mismatch'] = (mismatch_ratio > 0.2).astype(int)
    out['has_unverified_customs'] = customs_unverified_flag

    out['has_audit_issues'] = (audit_issues_count > 0).astype(int)
    out['has_penalties'] = (penalties_count > 0).astype(int)
    out['low_compliance_rating'] = (compliance_rating <= 3).astype(int)
    out['never_audited'] = (ever_audited_flag == 0).astype(int)
    out['not_registered_pacra'] = (pacra_registered_flag == 0).astype(int)
    out['directors_mismatch'] = (directors_mismatch_flag > 0).astype(int)
    out['address_mismatch_pacra'] = (address_mismatch_flag > 0).astype(int)
    out['is_dormant_company'] = (dormant_flag > 0).astype(int)

    out['claim_exceeds_share_capital'] = (net_refund > (share_capital * 10)).astype(int)

    # Compute composite risk scores from raw, user-friendly flags (no manual math required)
    out['supplier_risk_score'] = (
        out['low_supplier_diversity'] * 3 +
        out['has_unverified_suppliers'] * 3 +
        out['has_unverified_payments'] * 2 +
        out['suspicious_purchase_pattern'] * 2
    )
    out['export_risk_score'] = (
        out['export_without_customs'] * 5 +
        out['has_missing_export_docs'] * 3 +
        out['has_unpaid_sales'] * 2
    )
    out['legitimacy_risk_score'] = (
        (1 - pd.to_numeric(g('pacra_registered_flag'), errors='coerce').fillna(0).astype(int) if 'pacra_registered_flag' in df.columns else 0) * 4 +
        out['address_not_verified'] * 2 +
        (pd.to_numeric(g('directors_mismatch_flag'), errors='coerce').fillna(0).astype(int) if 'directors_mismatch_flag' in df.columns else 0) * 2 +
        (pd.to_numeric(g('dormant_flag'), errors='coerce').fillna(0).astype(int) if 'dormant_flag' in df.columns else 0) * 2
    )
    out['historical_risk_score'] = (
        (pd.to_numeric(g('audit_issues_count'), errors='coerce').fillna(0) > 0).astype(int) * 3 +
        (pd.to_numeric(g('penalties_count'), errors='coerce').fillna(0) > 0).astype(int) * 3 +
        (pd.to_numeric(g('compliance_rating'), errors='coerce').fillna(0) <= 3).astype(int) * 2 +
        (pd.to_numeric(g('total_claims_filed'), errors='coerce').fillna(0) <= 1).astype(int) * 2
    )

    # Return features aligned to expected order
    return out[features]


def _load_bundle_to_frames(file_storage) -> Tuple[Dict[str, pd.DataFrame], List[str]]:
    """Parse a ZIP or XLSX upload into the 8 expected DataFrames.
    Returns (frames_by_key, missing_keys) where keys are:
      claims, taxpayers, purchases, sales, customs, compliance, pacra, labels
    """
    name_map = {
        'zra_vatclaims.csv': 'claims',
        'zra_taxpayermaster.csv': 'taxpayers',
        'zra_purchasetransactions.csv': 'purchases',
        'zra_salestransactions.csv': 'sales',
        'zra_customsdata.csv': 'customs',
        'zra_compliancehistory.csv': 'compliance',
        'zra_thirdpartyverification.csv': 'pacra',
        'zra_auditoutcomes.csv': 'labels',
    }
    frames: Dict[str, pd.DataFrame] = {}

    filename = file_storage.filename.lower()
    if filename.endswith('.zip'):
        data = file_storage.read()
        with zipfile.ZipFile(io.BytesIO(data)) as zf:
            members = {m.filename.lower(): m for m in zf.infolist() if not m.is_dir()}
            # Find each expected by suffix match (to tolerate subfolders)
            for expected, key in name_map.items():
                match = next((n for n in members.keys() if n.endswith(expected)), None)
                if match:
                    with zf.open(members[match]) as fh:
                        frames[key] = pd.read_csv(fh)
    elif filename.endswith('.xlsx'):
        # Read all sheets, try to match by normalized sheet names
        xls_bytes = file_storage.read()
        xls = pd.ExcelFile(io.BytesIO(xls_bytes))
        sheet_map = {s.lower(): s for s in xls.sheet_names}
        synonyms = {
            'zra_vatclaims': 'claims', 'vatclaims': 'claims', 'claims': 'claims',
            'zra_taxpayermaster': 'taxpayers', 'taxpayermaster': 'taxpayers', 'taxpayers': 'taxpayers',
            'zra_purchasetransactions': 'purchases', 'purchasetransactions': 'purchases', 'purchases': 'purchases',
            'zra_salestransactions': 'sales', 'salestransactions': 'sales', 'sales': 'sales',
            'zra_customsdata': 'customs', 'customsdata': 'customs', 'customs': 'customs',
            'zra_compliancehistory': 'compliance', 'compliancehistory': 'compliance', 'compliance': 'compliance',
            'zra_thirdpartyverification': 'pacra', 'thirdpartyverification': 'pacra', 'pacra': 'pacra',
            'zra_auditoutcomes': 'labels', 'auditoutcomes': 'labels', 'labels': 'labels',
        }
        for norm, sheet in sheet_map.items():
            if norm in synonyms:
                key = synonyms[norm]
                frames[key] = xls.parse(sheet)
    else:
        raise ValueError('Unsupported file type. Please upload a .zip or .xlsx bundle.')

    expected_keys = ['claims','taxpayers','purchases','sales','customs','compliance','pacra','labels']
    missing = [k for k in expected_keys if k not in frames]
    return frames, missing


def _build_features_from_datasets(frames: Dict[str, pd.DataFrame]) -> pd.DataFrame:
    """Reproduce feature engineering pipeline from the raw datasets.
    Expects frames dict with keys: claims, taxpayers, purchases, sales, customs, compliance, pacra, labels.
    Missing datasets are handled with safe defaults where possible.
    Returns a DataFrame containing id columns, net_refund_amount, is_fraud (if labels provided), and engineered features.
    """
    # Retrieve with defaults
    claims = frames.get('claims', pd.DataFrame())
    taxpayers = frames.get('taxpayers', pd.DataFrame())
    purchases = frames.get('purchases', pd.DataFrame())
    sales = frames.get('sales', pd.DataFrame())
    customs = frames.get('customs', pd.DataFrame())
    compliance = frames.get('compliance', pd.DataFrame())
    pacra = frames.get('pacra', pd.DataFrame())
    labels = frames.get('labels', pd.DataFrame())

    if claims.empty:
        raise ValueError('Claims dataset is required and was not found.')

    features = claims.copy()

    # Ensure required id cols exist
    for col in ['claim_id','taxpayer_id']:
        if col not in features.columns:
            raise ValueError(f'Missing required column in claims: {col}')

    # Basic claim features
    features['net_refund_amount'] = pd.to_numeric(features.get('net_refund_amount', 0), errors='coerce').fillna(0.0)
    out_vat = pd.to_numeric(features.get('output_vat_paid', 0), errors='coerce').fillna(0.0)
    in_vat = pd.to_numeric(features.get('input_vat_claimed', 0), errors='coerce').fillna(0.0)
    proc_days = pd.to_numeric(features.get('processing_days', 0), errors='coerce').fillna(0.0)

    features['refund_to_output_ratio'] = _safe_ratio(features['net_refund_amount'], np.maximum(out_vat, 1e-9))
    features['input_output_vat_ratio'] = _safe_ratio(in_vat, np.maximum(out_vat, 1e-9))
    # Z-score relative to in-sample stats if available, else heuristic baseline 30/15
    if proc_days.std(ddof=0) > 0:
        features['processing_days_zscore'] = (proc_days - proc_days.mean()) / (proc_days.std() + 1e-3)
    else:
        features['processing_days_zscore'] = (proc_days - 30.0) / 15.0

    claim_counts = features.groupby('taxpayer_id').size().reset_index(name='total_claims_filed')
    features = features.merge(claim_counts, on='taxpayer_id', how='left')
    features['is_first_time_claimant'] = (pd.to_numeric(features.get('previous_refunds_count', 0), errors='coerce').fillna(0) == 0).astype(int)
    refund_threshold = features['net_refund_amount'].quantile(0.90) if not features['net_refund_amount'].empty else 0.0
    features['is_high_value_claim'] = (features['net_refund_amount'] > refund_threshold).astype(int)
    features['submitted_by_agent'] = (features.get('submitted_by', '').astype(str) == 'Tax Agent').astype(int)
    features['has_few_documents'] = (pd.to_numeric(features.get('supporting_docs_count', 0), errors='coerce').fillna(0) < 5).astype(int)

    # Taxpayer profile features
    if not taxpayers.empty:
        if 'registration_date' in taxpayers.columns:
            taxpayers['registration_date'] = pd.to_datetime(taxpayers['registration_date'], errors='coerce')
        if 'claim_date' in features.columns:
            features['claim_date'] = pd.to_datetime(features['claim_date'], errors='coerce')
        features = features.merge(taxpayers, on='taxpayer_id', how='left')
    else:
        # Create placeholders for merge-dependent columns so downstream code works
        for col in ['registration_date','physical_address','address_verified','bank_account_verified','num_employees','annual_turnover','directors','tax_agent_tpin','business_type']:
            if col not in features.columns:
                features[col] = np.nan

    if 'registration_date' in features.columns and 'claim_date' in features.columns:
        features['business_age_years'] = ((features['claim_date'] - features['registration_date']).dt.days / 365.25)
        features['business_age_years'] = features['business_age_years'].fillna(5)
    else:
        features['business_age_years'] = 5
    features['is_young_business'] = (features['business_age_years'] < 2).astype(int)

    if 'physical_address' in features.columns:
        features['address_not_verified'] = features['physical_address'].astype(str).str.contains('Not Verified', na=False).astype(int)
    elif 'address_verified' in features.columns:
        features['address_not_verified'] = (features['address_verified'] == 'No').astype(int)
    else:
        features['address_not_verified'] = 0

    if 'bank_account_verified' in features.columns:
        features['bank_not_verified'] = (features['bank_account_verified'] == 'No').astype(int)
    else:
        features['bank_not_verified'] = 0

    if 'num_employees' in features.columns:
        features['is_small_business'] = (pd.to_numeric(features['num_employees'], errors='coerce').fillna(0) < 10).astype(int)
    else:
        features['is_small_business'] = 0

    if 'annual_turnover' in features.columns:
        ann_turnover = pd.to_numeric(features['annual_turnover'], errors='coerce').fillna(0)
        features['claim_to_turnover_ratio'] = _safe_ratio(features['net_refund_amount'], np.maximum(ann_turnover, 1e-9))
    else:
        features['claim_to_turnover_ratio'] = 0
    features['claim_exceeds_business_size'] = (features['claim_to_turnover_ratio'] > 0.20).astype(int)

    if 'directors' in features.columns:
        features['single_director'] = (features['directors'].astype(str) == '1').astype(int)
    else:
        features['single_director'] = 0

    if 'tax_agent_tpin' in features.columns:
        features['no_tax_agent'] = (features['tax_agent_tpin'].astype(str) == 'None').astype(int)
    else:
        features['no_tax_agent'] = 0

    if 'business_type' in features.columns:
        features['is_sole_proprietor'] = (features['business_type'].astype(str) == 'Sole Proprietor').astype(int)
    else:
        features['is_sole_proprietor'] = 0

    # Purchase transaction features
    if not purchases.empty and 'claim_id' in purchases.columns:
        purchase_agg = purchases.groupby('claim_id').agg({
            'supplier_tpin': 'nunique',
            'vat_amount': ['sum', 'mean', 'std'],
            'transaction_id': 'count'
        }).reset_index()
        purchase_agg.columns = [
            'claim_id', 'num_unique_suppliers', 'total_input_vat', 
            'avg_purchase_vat', 'std_purchase_vat', 'num_purchase_transactions'
        ]
        if 'supplier_verified' in purchases.columns:
            unverified_suppliers = purchases.groupby('claim_id')['supplier_verified'].apply(lambda x: (x == 'No').sum()).reset_index(name='num_unverified_suppliers')
            purchase_agg = purchase_agg.merge(unverified_suppliers, on='claim_id', how='left')
        else:
            purchase_agg['num_unverified_suppliers'] = 0
        if 'payment_verified' in purchases.columns:
            unverified_payments = purchases.groupby('claim_id')['payment_verified'].apply(lambda x: (x == 'No').sum()).reset_index(name='num_unverified_payments')
            purchase_agg = purchase_agg.merge(unverified_payments, on='claim_id', how='left')
        else:
            purchase_agg['num_unverified_payments'] = 0
        features = features.merge(purchase_agg, on='claim_id', how='left')
    else:
        for col in ['num_unique_suppliers','total_input_vat','avg_purchase_vat','std_purchase_vat','num_purchase_transactions','num_unverified_suppliers','num_unverified_payments']:
            features[col] = 0

    for col in ['num_unique_suppliers', 'num_purchase_transactions', 'num_unverified_suppliers', 'num_unverified_payments']:
        features[col] = pd.to_numeric(features[col], errors='coerce').fillna(0)
    features['low_supplier_diversity'] = (features['num_unique_suppliers'] <= 3).astype(int)
    features['has_unverified_suppliers'] = (features['num_unverified_suppliers'] > 0).astype(int)
    features['unverified_supplier_ratio'] = _safe_ratio(features['num_unverified_suppliers'], np.maximum(features['num_unique_suppliers'], 1))
    features['has_unverified_payments'] = (features['num_unverified_payments'] > 0).astype(int)
    features['has_few_purchases'] = (features['num_purchase_transactions'] < 5).astype(int)
    features['std_purchase_vat'] = pd.to_numeric(features.get('std_purchase_vat', 0), errors='coerce').fillna(0)
    features['avg_purchase_vat'] = pd.to_numeric(features.get('avg_purchase_vat', 0), errors='coerce').fillna(1)
    features['purchase_amount_consistency'] = _safe_ratio(features['std_purchase_vat'], np.maximum(features['avg_purchase_vat'], 1))
    features['suspicious_purchase_pattern'] = (features['purchase_amount_consistency'] < 0.3).astype(int)

    # Sales features
    if not sales.empty and 'claim_id' in sales.columns:
        sales_agg = sales.groupby('claim_id').agg({
            'gross_amount': ['sum', 'mean'],
            'customer_country': 'nunique',
            'transaction_id': 'count'
        }).reset_index()
        sales_agg.columns = [
            'claim_id', 'total_sales_amount', 'avg_sale_amount',
            'num_customer_countries', 'num_sales_transactions'
        ]
        if 'is_export' in sales.columns:
            export_counts = sales.groupby('claim_id')['is_export'].apply(lambda x: (x == 'Yes').sum()).reset_index(name='num_export_sales')
            sales_agg = sales_agg.merge(export_counts, on='claim_id', how='left')
        else:
            sales_agg['num_export_sales'] = 0
        if 'payment_received' in sales.columns:
            unpaid = sales.groupby('claim_id')['payment_received'].apply(lambda x: (x == 'No').sum()).reset_index(name='num_unpaid_sales')
            sales_agg = sales_agg.merge(unpaid, on='claim_id', how='left')
        else:
            sales_agg['num_unpaid_sales'] = 0
        if 'export_doc_reference' in sales.columns:
            missing_docs = sales.groupby('claim_id')['export_doc_reference'].apply(lambda x: (x == 'N/A').sum()).reset_index(name='num_missing_export_docs')
            sales_agg = sales_agg.merge(missing_docs, on='claim_id', how='left')
        else:
            sales_agg['num_missing_export_docs'] = 0
        features = features.merge(sales_agg, on='claim_id', how='left')
    else:
        for col in ['total_sales_amount','avg_sale_amount','num_customer_countries','num_sales_transactions','num_export_sales','num_unpaid_sales','num_missing_export_docs']:
            features[col] = 0

    for col in ['num_export_sales', 'num_sales_transactions', 'num_unpaid_sales', 'num_missing_export_docs']:
        features[col] = pd.to_numeric(features[col], errors='coerce').fillna(0)
    features['has_export_sales'] = (features['num_export_sales'] > 0).astype(int)
    features['export_sales_ratio'] = _safe_ratio(features['num_export_sales'], np.maximum(features['num_sales_transactions'], 1))
    features['is_export_heavy'] = (features['export_sales_ratio'] > 0.5).astype(int)
    features['has_missing_export_docs'] = (features['num_missing_export_docs'] > 0).astype(int)
    features['has_unpaid_sales'] = (features['num_unpaid_sales'] > 0).astype(int)
    features['has_few_sales'] = (features['num_sales_transactions'] < 10).astype(int)
    features['single_export_destination'] = (pd.to_numeric(features.get('num_customer_countries', 0), errors='coerce').fillna(0) == 1).astype(int)

    # Customs data features
    if not customs.empty and 'taxpayer_id' in customs.columns:
        exports_only = customs[customs.get('declaration_type', '').astype(str) == 'Export'] if 'declaration_type' in customs.columns else customs.iloc[0:0]
        customs_agg = exports_only.groupby('taxpayer_id').agg({'customs_value': 'sum', 'declaration_id': 'count'}).reset_index() if not exports_only.empty else pd.DataFrame({'taxpayer_id': [], 'customs_value': [], 'declaration_id': []})
        customs_agg.columns = ['taxpayer_id', 'total_customs_export_value', 'num_customs_declarations']
        if 'verified' in customs.columns and not exports_only.empty:
            unverified = exports_only.groupby('taxpayer_id')['verified'].apply(lambda x: (x == 'No').sum()).reset_index(name='num_unverified_customs')
            customs_agg = customs_agg.merge(unverified, on='taxpayer_id', how='left')
        else:
            customs_agg['num_unverified_customs'] = 0
        features = features.merge(customs_agg, on='taxpayer_id', how='left')
    else:
        for col in ['total_customs_export_value','num_customs_declarations','num_unverified_customs']:
            features[col] = 0

    features['total_customs_export_value'] = pd.to_numeric(features.get('total_customs_export_value', 0), errors='coerce').fillna(0)
    features['num_customs_declarations'] = pd.to_numeric(features.get('num_customs_declarations', 0), errors='coerce').fillna(0)
    features['num_unverified_customs'] = pd.to_numeric(features.get('num_unverified_customs', 0), errors='coerce').fillna(0)
    features['export_without_customs'] = ((features['has_export_sales'] == 1) & (features['num_customs_declarations'] == 0)).astype(int)
    features['total_sales_amount'] = pd.to_numeric(features.get('total_sales_amount', 0), errors='coerce').fillna(0)
    features['export_customs_value_diff'] = features['total_sales_amount'] - features['total_customs_export_value']
    features['large_export_customs_mismatch'] = (features['export_customs_value_diff'].abs() > 100000).astype(int)
    features['has_unverified_customs'] = (features['num_unverified_customs'] > 0).astype(int)

    # Compliance history features
    if not compliance.empty and 'taxpayer_id' in compliance.columns:
        compliance_agg = compliance.groupby('taxpayer_id').agg({'audit_date': 'count'}).reset_index() if 'audit_date' in compliance.columns else compliance.groupby('taxpayer_id').size().reset_index(name='audit_date')
        compliance_agg.columns = ['taxpayer_id', 'num_audits']
        if 'audit_result' in compliance.columns:
            issues = compliance.groupby('taxpayer_id')['audit_result'].apply(lambda x: (x == 'Issues Found').sum()).reset_index(name='num_audits_with_issues')
            compliance_agg = compliance_agg.merge(issues, on='taxpayer_id', how='left')
        else:
            compliance_agg['num_audits_with_issues'] = 0
        for col in ['penalties_imposed', 'tax_adjustments', 'compliance_rating']:
            if col in compliance.columns:
                agg_data = compliance.groupby('taxpayer_id')[col].agg('sum' if col != 'compliance_rating' else 'mean').reset_index()
                agg_data.columns = ['taxpayer_id', f'total_{col}' if col != 'compliance_rating' else f'avg_{col}']
                compliance_agg = compliance_agg.merge(agg_data, on='taxpayer_id', how='left')
            else:
                compliance_agg[f'total_{col}' if col != 'compliance_rating' else f'avg_{col}'] = 0 if col != 'compliance_rating' else 70
        features = features.merge(compliance_agg, on='taxpayer_id', how='left')
    else:
        for col in ['num_audits','num_audits_with_issues','total_penalties_imposed','total_tax_adjustments','avg_compliance_rating']:
            features[col] = 0 if col != 'avg_compliance_rating' else 70

    features['num_audits'] = pd.to_numeric(features.get('num_audits', 0), errors='coerce').fillna(0)
    features['avg_compliance_rating'] = pd.to_numeric(features.get('avg_compliance_rating', 70), errors='coerce').fillna(70)
    features['has_audit_issues'] = (pd.to_numeric(features.get('num_audits_with_issues', 0), errors='coerce').fillna(0) > 0).astype(int)
    features['has_penalties'] = (pd.to_numeric(features.get('total_penalties_imposed', 0), errors='coerce').fillna(0) > 0).astype(int)
    features['low_compliance_rating'] = (features['avg_compliance_rating'] < 60).astype(int)
    features['never_audited'] = (features['num_audits'] == 0).astype(int)

    # PACRA verification features
    if not pacra.empty and 'taxpayer_id' in pacra.columns:
        features = features.merge(pacra, on='taxpayer_id', how='left')
    for col, feature_name, condition in [
        ('business_registered_pacra', 'not_registered_pacra', 'No'),
        ('directors_match', 'directors_mismatch', 'No'),
        ('registered_address_match', 'address_mismatch_pacra', 'No'),
        ('company_status', 'is_dormant_company', 'Dormant')
    ]:
        if col in features.columns:
            features[feature_name] = (features[col] == condition).astype(int)
        else:
            features[feature_name] = 0
    if 'share_capital' in features.columns:
        features['share_capital'] = pd.to_numeric(features['share_capital'], errors='coerce').fillna(0)
    else:
        features['share_capital'] = 0
    features['claim_exceeds_share_capital'] = (features['net_refund_amount'] > features['share_capital'] * 10).astype(int)

    # Composite scores
    features['supplier_risk_score'] = (
        features['low_supplier_diversity'] * 3 +
        features['has_unverified_suppliers'] * 3 +
        features['has_unverified_payments'] * 2 +
        features['suspicious_purchase_pattern'] * 2
    )
    features['export_risk_score'] = (
        features['export_without_customs'] * 5 +
        features['has_missing_export_docs'] * 3 +
        features['has_unpaid_sales'] * 2
    )
    features['legitimacy_risk_score'] = (
        features['not_registered_pacra'] * 4 +
        features['address_not_verified'] * 2 +
        features['directors_mismatch'] * 2 +
        features['is_dormant_company'] * 2
    )
    features['historical_risk_score'] = (
        features['has_audit_issues'] * 3 +
        features['has_penalties'] * 3 +
        features['low_compliance_rating'] * 2 +
        features['is_first_time_claimant'] * 2
    )

    # Labels (optional)
    if not labels.empty and 'claim_id' in labels.columns and 'audit_result' in labels.columns:
        features = features.merge(labels[['claim_id','audit_result']], on='claim_id', how='left')
        features['is_fraud'] = (features['audit_result'] == 'Fraud').astype(int)
    else:
        if 'is_fraud' not in features.columns:
            features['is_fraud'] = np.nan

    # Final selection for downstream predict; keep id cols and net_refund_amount for display
    selected_feature_cols = _feature_config.get('features', [])
    base_cols = ['claim_id','taxpayer_id','net_refund_amount','is_fraud']
    keep_cols = [c for c in base_cols if c in features.columns] + selected_feature_cols
    final_features = features.loc[:, dict.fromkeys(keep_cols).keys()]  # deduplicate while preserving order
    return final_features


@app.route('/', methods=['GET'])
def index():
    ensure_loaded()
    return render_template(
        'index.html',
        metrics=_metrics,
        summary=_summary,
    )


@app.route('/templates/<kind>', methods=['GET'])
def download_template(kind: str):
    # kind in {'return','intake','features'} (keeping legacy ones if needed)
    if kind == 'return':
        return send_from_directory(DATA_DIR, 'vat_return_template.csv', as_attachment=True)
    elif kind == 'intake':
        return send_from_directory(DATA_DIR, 'intake_template.csv', as_attachment=True)
    elif kind == 'features':
        return send_from_directory(DATA_DIR, 'feature_template.csv', as_attachment=True)
    return jsonify({'error': 'Unknown template kind'}), 404


@app.route('/upload/features', methods=['POST'])
def upload_features():
    ensure_loaded()
    if _model is None:
        return jsonify({'error': 'Model not found. Please run the training notebook.'}), 400

    f = request.files.get('file')
    if not f or not _allowed_file(f.filename):
        return jsonify({'error': 'Please upload a CSV or JSON file.'}), 400

    # Parse
    if f.filename.lower().endswith('.json'):
        payload = json.load(io.TextIOWrapper(f.stream, encoding='utf-8'))
        df = pd.DataFrame(payload if isinstance(payload, list) else [payload])
    else:
        df = pd.read_csv(f)

    try:
        preds = _predict_dataframe(df)
    except Exception as e:
        return jsonify({'error': f'Prediction failed: {e}'}), 400

    # Prepare table rows for UI (limit to first 200 rows for display)
    rows = preds.head(200).to_dict(orient='records')
    return render_template('index.html', predictions=rows, metrics=_metrics, summary=_summary, mode='features')


@app.route('/upload/intake', methods=['POST'])
def upload_intake():
    ensure_loaded()
    if _model is None:
        return jsonify({'error': 'Model not found. Please run the training notebook.'}), 400

    f = request.files.get('file')
    if not f or not _allowed_file(f.filename):
        return jsonify({'error': 'Please upload a CSV (recommended) or JSON intake file.'}), 400

    # Parse intake
    if f.filename.lower().endswith('.json'):
        payload = json.load(io.TextIOWrapper(f.stream, encoding='utf-8'))
        df_intake = pd.DataFrame(payload if isinstance(payload, list) else [payload])
    else:
        df_intake = pd.read_csv(f)

    try:
        df_features = _featureize_from_intake(df_intake)
        # Keep id cols if provided for display
        preds = _predict_dataframe(pd.concat([df_intake[['claim_id','taxpayer_id']] if set(['claim_id','taxpayer_id']).issubset(df_intake.columns) else pd.DataFrame(index=df_intake.index),
                                              df_features], axis=1))
    except Exception as e:
        return jsonify({'error': f'Featureization/prediction failed: {e}'}), 400

    rows = preds.head(200).to_dict(orient='records')
    return render_template('index.html', predictions=rows, metrics=_metrics, summary=_summary, mode='intake')


@app.route('/upload/datasets', methods=['POST'])
def upload_datasets():
    """Accept a single ZIP or XLSX containing the 8 raw datasets and run full feature engineering + prediction."""
    ensure_loaded()
    if _model is None:
        return jsonify({'error': 'Model not found. Please run the training notebook.'}), 400

    f = request.files.get('file')
    if not f or not _allowed_dataset_bundle(f.filename):
        return jsonify({'error': 'Please upload a .zip (8 CSVs) or .xlsx (8 sheets) bundle.'}), 400

    try:
        frames, missing = _load_bundle_to_frames(f)
        if missing:
            return jsonify({'error': f'Missing datasets in bundle: {", ".join(missing)}'}), 400
        final_features = _build_features_from_datasets(frames)
        preds = _predict_dataframe(final_features)
    except Exception as e:
        return jsonify({'error': f'Failed to process datasets: {e}'}), 400

    rows = preds.head(200).to_dict(orient='records')
    return render_template('index.html', predictions=rows, metrics=_metrics, summary=_summary, mode='datasets')


def _featureize_from_vat_return(df: pd.DataFrame) -> pd.DataFrame:
    """Map a VAT Return row to the model's feature frame using only standard VAT-return fields.
    Columns supported (CSV/JSON):
      claim_id, taxpayer_id, period_start, period_end, claim_date, submitted_by,
      net_refund_amount, output_vat, input_vat, total_sales_amount,
      export_sales_value, zero_rated_sales, exempt_sales,
      sales_invoice_count, supporting_docs_count
    All other engineered features are computed automatically with safe defaults.
    """
    # Build a minimalist intake-like frame from return columns
    mapped = pd.DataFrame(index=df.index)
    g = df.get
    nz = lambda x: pd.to_numeric(x, errors='coerce').fillna(0.0)

    mapped['claim_id'] = g('claim_id') if 'claim_id' in df.columns else pd.Series([None]*len(df))
    mapped['taxpayer_id'] = g('taxpayer_id') if 'taxpayer_id' in df.columns else pd.Series([None]*len(df))

    mapped['net_refund_amount'] = nz(g('net_refund_amount')) if 'net_refund_amount' in df.columns else 0.0
    mapped['output_vat'] = nz(g('output_vat')) if 'output_vat' in df.columns else 0.0
    mapped['input_vat'] = nz(g('input_vat')) if 'input_vat' in df.columns else 0.0
    mapped['processing_days'] = 30.0  # unknown from return; nominal baseline
    mapped['total_claims_filed'] = 5  # assume reasonable claim history unless provided

    # Submitter and docs
    submitted_by = (g('submitted_by').astype(str) if 'submitted_by' in df.columns else pd.Series(['Self']*len(df)))
    mapped['submitted_by_agent'] = (submitted_by == 'Tax Agent').astype(int)
    mapped['docs_count'] = nz(g('supporting_docs_count')) if 'supporting_docs_count' in df.columns else 10.0

    # Business and turnover proxies
    # Support direct business_age_years or business_start_date
    if 'business_age_years' in df.columns:
        mapped['business_age_years'] = nz(g('business_age_years'))
        mapped['business_start_date'] = pd.NaT  # not needed if age is provided
    else:
        mapped['business_start_date'] = pd.to_datetime(g('business_start_date'), errors='coerce') if 'business_start_date' in df.columns else pd.NaT
    mapped['turnover'] = nz(g('total_sales_amount')) if 'total_sales_amount' in df.columns else 0.0
    mapped['directors_count'] = 2  # assume typical SME structure
    mapped['has_tax_agent'] = (mapped['submitted_by_agent'] == 1).astype(int)
    mapped['is_sole_proprietor'] = 0

    # Purchases/suppliers not present in return => assume reasonable business activity
    mapped['supplier_count'] = 5  # assume typical supplier base
    mapped['unverified_supplier_count'] = 0
    mapped['payments_unverified_flag'] = 0
    mapped['purchases_count'] = 15  # assume normal purchase activity
    mapped['suspicious_purchase_flag'] = 0

    # Sales granularity
    mapped['export_sales_value'] = nz(g('export_sales_value')) if 'export_sales_value' in df.columns else 0.0
    mapped['export_docs_missing'] = 0
    mapped['unpaid_sales_flag'] = 0
    mapped['sales_count'] = nz(g('sales_invoice_count')) if 'sales_invoice_count' in df.columns else 0.0
    mapped['export_destination_count'] = 0

    # Customs unavailable in return; set to match export to avoid false positives
    mapped['customs_export_value'] = mapped['export_sales_value']
    mapped['customs_mismatch_value'] = 0.0
    mapped['customs_unverified_flag'] = 0

    # Compliance/PACRA defaults (not part of return)
    mapped['audit_issues_count'] = 0
    mapped['penalties_count'] = 0
    mapped['compliance_rating'] = 5
    mapped['ever_audited_flag'] = 1  # assume been audited at least once
    mapped['pacra_registered_flag'] = 1
    mapped['directors_mismatch_flag'] = 0
    mapped['address_mismatch_flag'] = 0
    mapped['dormant_flag'] = 0
    # Set share capital proportional to refund claim to avoid false positive
    mapped['share_capital'] = nz(g('net_refund_amount')) * 0.5 if 'net_refund_amount' in df.columns else 10000.0

    # Reuse the existing intake featureizer to compute engineered features
    return _featureize_from_intake(mapped)


@app.route('/upload/return', methods=['POST'])
def upload_vat_return():
    ensure_loaded()
    if _model is None:
        return jsonify({'error': 'Model not found. Please run the training notebook.'}), 400

    f = request.files.get('file')
    if not f or not _allowed_file(f.filename):
        return jsonify({'error': 'Please upload a CSV (recommended) or JSON VAT Return file.'}), 400

    if f.filename.lower().endswith('.json'):
        payload = json.load(io.TextIOWrapper(f.stream, encoding='utf-8'))
        df_return = pd.DataFrame(payload if isinstance(payload, list) else [payload])
    else:
        df_return = pd.read_csv(f)

    # Check batch size limit
    if len(df_return) > 1000:
        return jsonify({'error': 'Batch size limit exceeded. Maximum 1000 claims per upload.'}), 400

    try:
        df_features = _featureize_from_vat_return(df_return)
        # Preserve ids if present for display
        features_with_ids = pd.concat([
            df_return[['claim_id','taxpayer_id']] if set(['claim_id','taxpayer_id']).issubset(df_return.columns) else pd.DataFrame(index=df_return.index),
            df_features
        ], axis=1)

        preds = _predict_dataframe(features_with_ids)

        # Add risk level classification
        preds['risk_level'] = preds['fraud_probability'].apply(
            lambda x: 'HIGH' if x > 0.7 else ('MEDIUM' if x > 0.3 else 'LOW')
        )

        # Determine if single or batch
        is_batch = len(preds) > 1

        # Generate detailed fraud analysis
        fraud_analysis = None
        batch_analyses = []

        if len(preds) == 1:
            # Single record - full detailed analysis
            fraud_prob = preds.iloc[0]['fraud_probability']
            fraud_analysis = _analyze_fraud_probability(features_with_ids, fraud_prob, 0)
        else:
            # Batch - generate summary for each record
            for idx in range(len(preds)):
                fraud_prob = preds.iloc[idx]['fraud_probability']
                analysis = _analyze_fraud_probability(features_with_ids, fraud_prob, idx)

                # Create compact summary for batch view
                summary = {
                    'claim_id': preds.iloc[idx].get('claim_id', f'Row {idx+1}'),
                    'taxpayer_id': preds.iloc[idx].get('taxpayer_id', 'N/A'),
                    'fraud_probability': fraud_prob,
                    'risk_level': preds.iloc[idx]['risk_level'],
                    'top_risk_factors': analysis['risk_factors'][:5],  # Top 5 risks
                    'top_protective_factors': analysis['protective_factors'][:3],  # Top 3 protective
                    'key_ratios': {
                        'refund_to_output': analysis['detailed_analysis']['claim_patterns'].get('refund_to_output_ratio', 'N/A'),
                        'input_output': analysis['detailed_analysis']['claim_patterns'].get('input_output_vat_ratio', 'N/A'),
                    },
                    'recommendations': analysis['recommendations'][:2]  # Top 2 recommendations
                }
                batch_analyses.append(summary)

    except Exception as e:
        return jsonify({'error': f'VAT return processing failed: {e}'}), 400

    # For batch, show summary table; for single, show detailed analysis
    if is_batch:
        rows = preds.to_dict(orient='records')
        return render_template('index.html',
                             predictions=rows,
                             batch_analyses=batch_analyses,
                             is_batch=True,
                             batch_count=len(rows),
                             metrics=_metrics,
                             summary=_summary,
                             mode='return')
    else:
        rows = preds.head(200).to_dict(orient='records')
        return render_template('index.html',
                             predictions=rows,
                             fraud_analysis=fraud_analysis,
                             is_batch=False,
                             metrics=_metrics,
                             summary=_summary,
                             mode='return')


# Backward compatible JSON predict endpoint (single record)
@app.route('/api/predict', methods=['POST'])
def api_predict():
    ensure_loaded()
    payload = request.get_json(force=True, silent=True) or {}
    # Accept either feature-ready payload or intake payload (detected by presence of feature columns)
    features = _feature_config.get('features', [])
    if features and all(k in payload for k in features[:min(5, len(features))]):
        df = pd.DataFrame([payload])
    else:
        df = _featureize_from_intake(pd.DataFrame([payload]))
    preds = _predict_dataframe(df)
    return jsonify(preds.iloc[0].to_dict())


if __name__ == '__main__':
    load_artifacts()
    app.run(host='0.0.0.0', port=int(os.environ.get('PORT', 5002)), debug=True)
