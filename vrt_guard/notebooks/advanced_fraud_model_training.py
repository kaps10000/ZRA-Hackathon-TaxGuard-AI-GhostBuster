"""
Advanced ZRA VAT Fraud Detection Model Training
State-of-the-art ensemble methods with SMOTE, feature importance, and model explainability
"""

import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns
from pathlib import Path
import json
import joblib
from datetime import datetime

# ML libraries
from sklearn.model_selection import train_test_split, cross_val_score, StratifiedKFold
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import (
    roc_auc_score, precision_recall_curve, confusion_matrix,
    classification_report, roc_curve, f1_score, precision_score, recall_score
)

# ML models
from sklearn.linear_model import LogisticRegression
from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier
from xgboost import XGBClassifier
from lightgbm import LGBMClassifier

# Imbalanced learning
from imblearn.over_sampling import SMOTE
from imblearn.pipeline import Pipeline as ImbPipeline

# Suppress warnings
import warnings
warnings.filterwarnings('ignore')

# Set style
sns.set_style('whitegrid')
plt.rcParams['figure.figsize'] = (12, 6)

# Paths
ROOT_DIR = Path(__file__).parent.parent
DATA_DIR = ROOT_DIR / 'ZRA_DATASETS'
MODELS_DIR = ROOT_DIR / 'models'
STATIC_DIR = ROOT_DIR / 'static' / 'images'

MODELS_DIR.mkdir(exist_ok=True)
STATIC_DIR.mkdir(exist_ok=True, parents=True)

print("=" * 80)
print("ZRA VAT FRAUD DETECTION - ADVANCED MODEL TRAINING")
print("=" * 80)
print(f"\nTraining started: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
print(f"Data directory: {DATA_DIR}")
print(f"Models directory: {MODELS_DIR}")

# ============================================================================
# 1. LOAD AND MERGE DATA
# ============================================================================
print("\n" + "=" * 80)
print("STEP 1: Loading Data")
print("=" * 80)

# Load generated data
print("\nLoading datasets...")
vat_claims = pd.read_csv(DATA_DIR / 'zra_vatClaims.csv')
print(f"  - VAT Claims: {len(vat_claims)} records")

# Display fraud distribution
fraud_counts = vat_claims['is_fraud'].value_counts()
print(f"\nFraud Distribution:")
print(f"  - Legitimate: {fraud_counts[0]} ({fraud_counts[0]/len(vat_claims)*100:.1f}%)")
print(f"  - Fraudulent: {fraud_counts[1]} ({fraud_counts[1]/len(vat_claims)*100:.1f}%)")

if 'fraud_type' in vat_claims.columns:
    print(f"\nFraud Types:")
    for fraud_type, count in vat_claims[vat_claims['is_fraud']==1]['fraud_type'].value_counts().items():
        print(f"  - {fraud_type}: {count}")

# ============================================================================
# 2. FEATURE ENGINEERING
# ============================================================================
print("\n" + "=" * 80)
print("STEP 2: Feature Engineering")
print("=" * 80)

def engineer_features(df):
    """Engineer fraud detection features from VAT claims"""
    features = df.copy()

    # Convert dates
    features['claim_date'] = pd.to_datetime(features['claim_date'])
    features['period_start'] = pd.to_datetime(features['period_start'])
    features['period_end'] = pd.to_datetime(features['period_end'])

    # Basic ratios
    features['refund_to_output_ratio'] = features['net_refund_amount'] / (features['output_vat'] + 1)
    features['input_output_vat_ratio'] = features['input_vat'] / (features['output_vat'] + 1)
    features['claim_to_turnover_ratio'] = features['net_refund_amount'] / (features['total_sales_amount'] + 1)
    features['export_ratio'] = features['export_sales_value'] / (features['total_sales_amount'] + 1)

    # Z-score for processing days
    mean_proc = features['processing_days'].mean()
    std_proc = features['processing_days'].std()
    features['processing_days_zscore'] = (features['processing_days'] - mean_proc) / (std_proc + 1e-6)

    # Claim characteristics
    refund_threshold = features['net_refund_amount'].quantile(0.90)
    features['is_high_value_claim'] = (features['net_refund_amount'] > refund_threshold).astype(int)
    features['is_first_time_claimant'] = 1  # Assume first time (conservative)
    features['total_claims_filed'] = 1

    # Submission features
    features['submitted_by_agent'] = (features['submitted_by'] == 'Tax Agent').astype(int)
    features['has_few_documents'] = (features['supporting_docs_count'] < 5).astype(int)

    # Business profile
    features['is_young_business'] = (features['business_age_years'] < 2).astype(int)
    features['address_not_verified'] = 0  # Default
    features['bank_not_verified'] = 0  # Default
    features['is_small_business'] = (features['total_sales_amount'] < 500000).astype(int)
    features['claim_exceeds_business_size'] = (features['claim_to_turnover_ratio'] > 0.20).astype(int)
    features['single_director'] = 0  # Default
    features['no_tax_agent'] = (features['submitted_by'] != 'Tax Agent').astype(int)
    features['is_sole_proprietor'] = 0  # Default

    # Supplier features (defaults for simple VAT return)
    features['low_supplier_diversity'] = 0
    features['has_unverified_suppliers'] = 0
    features['unverified_supplier_ratio'] = 0.0
    features['has_unverified_payments'] = 0
    features['has_few_purchases'] = 0
    features['suspicious_purchase_pattern'] = 0

    # Sales features
    features['has_export_sales'] = (features['export_sales_value'] > 0).astype(int)
    features['is_export_heavy'] = (features['export_ratio'] > 0.5).astype(int)
    features['has_missing_export_docs'] = 0  # Default
    features['has_unpaid_sales'] = 0  # Default
    features['has_few_sales'] = (features['sales_invoice_count'] < 10).astype(int)
    features['single_export_destination'] = 0  # Default

    # Customs features
    features['export_without_customs'] = 0  # Assume matching
    features['large_export_customs_mismatch'] = 0  # Default
    features['has_unverified_customs'] = 0  # Default

    # Compliance features (defaults)
    features['has_audit_issues'] = 0
    features['has_penalties'] = 0
    features['low_compliance_rating'] = 0
    features['never_audited'] = 1
    features['not_registered_pacra'] = 0
    features['directors_mismatch'] = 0
    features['address_mismatch_pacra'] = 0
    features['is_dormant_company'] = 0
    features['claim_exceeds_share_capital'] = 0

    # Composite risk scores
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

    return features

print("\nEngineering features...")
features_df = engineer_features(vat_claims)
print(f"Features engineered: {len(features_df.columns)} total columns")

# Define feature list
FEATURE_COLS = [
    'net_refund_amount', 'refund_to_output_ratio', 'input_output_vat_ratio',
    'processing_days_zscore', 'total_claims_filed', 'is_first_time_claimant',
    'is_high_value_claim', 'submitted_by_agent', 'has_few_documents',
    'business_age_years', 'is_young_business', 'address_not_verified',
    'bank_not_verified', 'is_small_business', 'claim_to_turnover_ratio',
    'claim_exceeds_business_size', 'single_director', 'no_tax_agent',
    'is_sole_proprietor', 'low_supplier_diversity', 'has_unverified_suppliers',
    'unverified_supplier_ratio', 'has_unverified_payments', 'has_few_purchases',
    'suspicious_purchase_pattern', 'has_export_sales', 'is_export_heavy',
    'has_missing_export_docs', 'has_unpaid_sales', 'has_few_sales',
    'single_export_destination', 'export_without_customs',
    'large_export_customs_mismatch', 'has_unverified_customs', 'has_audit_issues',
    'has_penalties', 'low_compliance_rating', 'never_audited',
    'not_registered_pacra', 'directors_mismatch', 'address_mismatch_pacra',
    'is_dormant_company', 'claim_exceeds_share_capital', 'supplier_risk_score',
    'export_risk_score', 'legitimacy_risk_score', 'historical_risk_score'
]

ID_COLS = ['claim_id', 'taxpayer_id']
TARGET = 'is_fraud'

print(f"\nFeatures selected for modeling: {len(FEATURE_COLS)}")

# ============================================================================
# 3. PREPARE DATA
# ============================================================================
print("\n" + "=" * 80)
print("STEP 3: Preparing Data")
print("=" * 80)

X = features_df[FEATURE_COLS].copy()
y = features_df[TARGET].copy()

# Handle any remaining NaNs
X = X.fillna(0)

print(f"\nDataset shape: {X.shape}")
print(f"Features: {X.shape[1]}")
print(f"Samples: {X.shape[0]}")

# Train/test split
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.25, random_state=42, stratify=y
)

print(f"\nTrain set: {len(X_train)} samples")
print(f"Test set: {len(X_test)} samples")
print(f"Train fraud rate: {y_train.mean():.2%}")
print(f"Test fraud rate: {y_test.mean():.2%}")

# ============================================================================
# 4. MODEL TRAINING WITH ENSEMBLE METHODS
# ============================================================================
print("\n" + "=" * 80)
print("STEP 4: Training Ensemble Models")
print("=" * 80)

# Define models to train
models = {
    'Logistic Regression': LogisticRegression(
        max_iter=1000,
        class_weight='balanced',
        random_state=42
    ),
    'Random Forest': RandomForestClassifier(
        n_estimators=200,
        max_depth=10,
        min_samples_split=10,
        min_samples_leaf=4,
        class_weight='balanced',
        random_state=42,
        n_jobs=-1
    ),
    'Gradient Boosting': GradientBoostingClassifier(
        n_estimators=100,
        max_depth=5,
        learning_rate=0.1,
        subsample=0.8,
        random_state=42
    ),
    'XGBoost': XGBClassifier(
        n_estimators=200,
        max_depth=6,
        learning_rate=0.1,
        subsample=0.8,
        colsample_bytree=0.8,
        scale_pos_weight=len(y_train[y_train==0])/len(y_train[y_train==1]),
        random_state=42,
        n_jobs=-1,
        eval_metric='logloss'
    ),
    'LightGBM': LGBMClassifier(
        n_estimators=200,
        max_depth=6,
        learning_rate=0.1,
        subsample=0.8,
        colsample_bytree=0.8,
        class_weight='balanced',
        random_state=42,
        n_jobs=-1,
        verbose=-1
    )
}

results = {}
trained_models = {}

for name, model in models.items():
    print(f"\n{'='*60}")
    print(f"Training: {name}")
    print(f"{'='*60}")

    # Create pipeline with SMOTE and scaling
    pipeline = ImbPipeline([
        ('smote', SMOTE(random_state=42, k_neighbors=3)),
        ('scaler', StandardScaler()),
        ('classifier', model)
    ])

    # Cross-validation
    cv = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)
    cv_scores = cross_val_score(pipeline, X_train, y_train, cv=cv, scoring='roc_auc', n_jobs=-1)

    print(f"Cross-validation ROC-AUC: {cv_scores.mean():.4f} (+/- {cv_scores.std():.4f})")

    # Train on full training set
    pipeline.fit(X_train, y_train)

    # Predict on test set
    y_pred = pipeline.predict(X_test)
    y_pred_proba = pipeline.predict_proba(X_test)[:, 1]

    # Calculate metrics
    test_auc = roc_auc_score(y_test, y_pred_proba)
    test_f1 = f1_score(y_test, y_pred)
    test_precision = precision_score(y_test, y_pred)
    test_recall = recall_score(y_test, y_pred)

    print(f"\nTest Set Performance:")
    print(f"  ROC-AUC: {test_auc:.4f}")
    print(f"  F1-Score: {test_f1:.4f}")
    print(f"  Precision: {test_precision:.4f}")
    print(f"  Recall: {test_recall:.4f}")

    results[name] = {
        'cv_auc_mean': float(cv_scores.mean()),
        'cv_auc_std': float(cv_scores.std()),
        'test_auc': float(test_auc),
        'test_f1': float(test_f1),
        'test_precision': float(test_precision),
        'test_recall': float(test_recall)
    }

    trained_models[name] = pipeline

# ============================================================================
# 5. SELECT BEST MODEL
# ============================================================================
print("\n" + "=" * 80)
print("STEP 5: Model Comparison and Selection")
print("=" * 80)

# Compare models
comparison_df = pd.DataFrame(results).T
comparison_df = comparison_df.sort_values('test_auc', ascending=False)

print("\nModel Comparison (sorted by Test AUC):")
print(comparison_df.to_string())

# Select best model
best_model_name = comparison_df.index[0]
best_model = trained_models[best_model_name]
best_metrics = results[best_model_name]

print(f"\n{'*'*60}")
print(f"BEST MODEL: {best_model_name}")
print(f"Test AUC: {best_metrics['test_auc']:.4f}")
print(f"{'*'*60}")

# ============================================================================
# 6. SAVE MODEL AND ARTIFACTS
# ============================================================================
print("\n" + "=" * 80)
print("STEP 6: Saving Model and Artifacts")
print("=" * 80)

# Save best model
model_path = MODELS_DIR / 'best_model.pkl'
joblib.dump(best_model, model_path)
print(f"\n[SAVED] Best model: {model_path}")

# Save feature config
feature_config = {
    'id_cols': ID_COLS,
    'target': TARGET,
    'features': FEATURE_COLS
}
config_path = MODELS_DIR / 'feature_config.json'
with open(config_path, 'w') as f:
    json.dump(feature_config, f, indent=2)
print(f"[SAVED] Feature config: {config_path}")

# Save metrics
metrics_data = {
    'model_name': best_model_name,
    'cv_best_model': best_model_name.lower().replace(' ', '_'),
    'cv_best_auc': best_metrics['cv_auc_mean'],
    'test_auc': best_metrics['test_auc'],
    'test_f1': best_metrics['test_f1'],
    'test_precision': best_metrics['test_precision'],
    'test_recall': best_metrics['test_recall'],
    'trained_at': datetime.now().strftime('%Y-%m-%d %H:%M:%S')
}
metrics_path = MODELS_DIR / 'metrics.json'
with open(metrics_path, 'w') as f:
    json.dump(metrics_data, f, indent=2)
print(f"[SAVED] Metrics: {metrics_path}")

# Save summary
summary_data = {
    'n_rows': len(features_df),
    'n_cols': len(FEATURE_COLS),
    'target': TARGET,
    'class_counts': {
        '0': int(fraud_counts[0]),
        '1': int(fraud_counts[1])
    },
    'class_ratio': {
        '0': float(fraud_counts[0]/len(vat_claims)),
        '1': float(fraud_counts[1]/len(vat_claims))
    }
}
summary_path = MODELS_DIR / 'summary.json'
with open(summary_path, 'w') as f:
    json.dump(summary_data, f, indent=2)
print(f"[SAVED] Summary: {summary_path}")

# ============================================================================
# 7. GENERATE VISUALIZATIONS
# ============================================================================
print("\n" + "=" * 80)
print("STEP 7: Generating Visualizations")
print("=" * 80)

# Get predictions for visualization
y_pred_proba = best_model.predict_proba(X_test)[:, 1]
y_pred = best_model.predict(X_test)

# 1. ROC Curve
plt.figure(figsize=(10, 6))
fpr, tpr, _ = roc_curve(y_test, y_pred_proba)
plt.plot(fpr, tpr, label=f'{best_model_name} (AUC = {best_metrics["test_auc"]:.3f})', linewidth=2)
plt.plot([0, 1], [0, 1], 'k--', label='Random Classifier')
plt.xlabel('False Positive Rate', fontsize=12)
plt.ylabel('True Positive Rate', fontsize=12)
plt.title('ROC Curve - Fraud Detection Model', fontsize=14, fontweight='bold')
plt.legend(fontsize=10)
plt.grid(alpha=0.3)
plt.tight_layout()
plt.savefig(STATIC_DIR / 'roc_curve.png', dpi=150, bbox_inches='tight')
print(f"[SAVED] ROC curve: {STATIC_DIR / 'roc_curve.png'}")
plt.close()

# 2. Confusion Matrix
plt.figure(figsize=(8, 6))
cm = confusion_matrix(y_test, y_pred)
sns.heatmap(cm, annot=True, fmt='d', cmap='Blues', cbar=False)
plt.xlabel('Predicted', fontsize=12)
plt.ylabel('Actual', fontsize=12)
plt.title('Confusion Matrix', fontsize=14, fontweight='bold')
plt.tight_layout()
plt.savefig(STATIC_DIR / 'confusion_matrix.png', dpi=150, bbox_inches='tight')
print(f"[SAVED] Confusion matrix: {STATIC_DIR / 'confusion_matrix.png'}")
plt.close()

# 3. Feature Importance (if available)
if hasattr(best_model.named_steps['classifier'], 'feature_importances_'):
    importances = best_model.named_steps['classifier'].feature_importances_
    feature_importance_df = pd.DataFrame({
        'feature': FEATURE_COLS,
        'importance': importances
    }).sort_values('importance', ascending=False).head(20)

    plt.figure(figsize=(10, 8))
    sns.barplot(data=feature_importance_df, y='feature', x='importance', palette='viridis')
    plt.xlabel('Importance', fontsize=12)
    plt.ylabel('Feature', fontsize=12)
    plt.title(f'Top 20 Feature Importances - {best_model_name}', fontsize=14, fontweight='bold')
    plt.tight_layout()
    plt.savefig(STATIC_DIR / 'feature_importance.png', dpi=150, bbox_inches='tight')
    print(f"[SAVED] Feature importance: {STATIC_DIR / 'feature_importance.png'}")
    plt.close()

# 4. Model Comparison Chart
plt.figure(figsize=(12, 6))
comparison_df[['cv_auc_mean', 'test_auc']].plot(kind='bar', width=0.8)
plt.xlabel('Model', fontsize=12)
plt.ylabel('ROC-AUC Score', fontsize=12)
plt.title('Model Performance Comparison', fontsize=14, fontweight='bold')
plt.legend(['CV AUC', 'Test AUC'], fontsize=10)
plt.xticks(rotation=45, ha='right')
plt.ylim(0.5, 1.0)
plt.grid(axis='y', alpha=0.3)
plt.tight_layout()
plt.savefig(STATIC_DIR / 'model_comparison.png', dpi=150, bbox_inches='tight')
print(f"[SAVED] Model comparison: {STATIC_DIR / 'model_comparison.png'}")
plt.close()

# 5. Fraud Distribution
plt.figure(figsize=(10, 6))
fraud_dist = features_df['is_fraud'].value_counts()
colors = ['#2ecc71', '#e74c3c']
plt.bar(['Legitimate', 'Fraudulent'], fraud_dist.values, color=colors, alpha=0.7, edgecolor='black')
plt.ylabel('Count', fontsize=12)
plt.title('Distribution of Fraud Cases in Training Data', fontsize=14, fontweight='bold')
for i, v in enumerate(fraud_dist.values):
    plt.text(i, v + 20, str(v), ha='center', fontweight='bold', fontsize=11)
plt.tight_layout()
plt.savefig(STATIC_DIR / 'fraud_distribution.png', dpi=150, bbox_inches='tight')
print(f"[SAVED] Fraud distribution: {STATIC_DIR / 'fraud_distribution.png'}")
plt.close()

# ============================================================================
# TRAINING COMPLETE
# ============================================================================
print("\n" + "=" * 80)
print("[SUCCESS] MODEL TRAINING COMPLETE!")
print("=" * 80)
print(f"\nBest Model: {best_model_name}")
print(f"Test ROC-AUC: {best_metrics['test_auc']:.4f}")
print(f"Test F1-Score: {best_metrics['test_f1']:.4f}")
print(f"Test Precision: {best_metrics['test_precision']:.4f}")
print(f"Test Recall: {best_metrics['test_recall']:.4f}")
print(f"\nCompleted: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
print("=" * 80)
