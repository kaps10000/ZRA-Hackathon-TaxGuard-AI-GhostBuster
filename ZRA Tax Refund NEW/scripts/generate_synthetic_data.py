"""
Advanced Synthetic Data Generator for ZRA VAT Fraud Detection
Generates realistic, non-overfitting training data with complex patterns
"""
import pandas as pd
import numpy as np
from datetime import datetime, timedelta
import random

np.random.seed(42)
random.seed(42)

# Configuration
N_TAXPAYERS = 500
N_CLAIMS = 2000
FRAUD_RATE = 0.20  # 20% fraud cases

def generate_taxpayer_id():
    """Generate realistic TPIN"""
    return f"TPIN_{np.random.randint(10000000, 99999999)}"

def generate_claim_id():
    """Generate realistic claim ID"""
    return f"CLM_{np.random.randint(100000, 999999)}"

def generate_dates():
    """Generate realistic date ranges"""
    start_date = datetime(2024, 1, 1)
    period_start = start_date + timedelta(days=np.random.randint(0, 365))
    period_end = period_start + timedelta(days=89)  # ~3 months
    claim_date = period_end + timedelta(days=np.random.randint(5, 30))
    return period_start, period_end, claim_date

def generate_legitimate_claim():
    """Generate a realistic legitimate VAT refund claim"""
    # Export-heavy businesses (legitimate refunds)
    is_export_heavy = np.random.random() < 0.7

    # Business size (realistic distribution)
    business_size = np.random.choice(['small', 'medium', 'large'], p=[0.5, 0.35, 0.15])

    if business_size == 'small':
        total_sales = np.random.uniform(100000, 500000)
    elif business_size == 'medium':
        total_sales = np.random.uniform(500000, 2000000)
    else:
        total_sales = np.random.uniform(2000000, 10000000)

    # Export sales (if export business)
    if is_export_heavy:
        export_sales = total_sales * np.random.uniform(0.5, 0.9)
    else:
        export_sales = total_sales * np.random.uniform(0, 0.3)

    # Domestic sales
    domestic_sales = total_sales - export_sales

    # VAT calculations (realistic)
    vat_rate = 0.16
    output_vat = domestic_sales * vat_rate

    # Input VAT (realistic business operations)
    cost_ratio = np.random.uniform(0.6, 0.85)
    input_vat = total_sales * cost_ratio * vat_rate

    # Net refund (if applicable)
    net_refund = max(0, input_vat - output_vat)

    # If no refund, not a refund claim
    if net_refund < 1000:
        net_refund = 0
        output_vat = input_vat * np.random.uniform(1.05, 1.3)

    # Transaction volumes
    sales_invoice_count = int(total_sales / np.random.uniform(5000, 50000))
    sales_invoice_count = max(10, min(sales_invoice_count, 500))

    # Supporting documents
    supporting_docs = np.random.randint(8, 30)

    # Professional submission
    submitted_by = np.random.choice(['Tax Agent', 'Self'], p=[0.7, 0.3])

    # Business age
    business_age = np.random.uniform(2, 20)

    # Other fields
    zero_rated_sales = export_sales * 0.9
    exempt_sales = total_sales * np.random.uniform(0, 0.1)

    return {
        'total_sales_amount': total_sales,
        'export_sales_value': export_sales,
        'output_vat': output_vat,
        'input_vat': input_vat,
        'net_refund_amount': net_refund,
        'sales_invoice_count': sales_invoice_count,
        'supporting_docs_count': supporting_docs,
        'submitted_by': submitted_by,
        'zero_rated_sales': zero_rated_sales,
        'exempt_sales': exempt_sales,
        'business_age_years': business_age,
        'is_fraud': 0
    }

def generate_fraudulent_claim():
    """Generate a realistic fraudulent VAT refund claim with red flags"""
    # Fraud type
    fraud_type = np.random.choice(['inflated_inputs', 'fake_exports', 'ghost_business', 'carousel'])

    if fraud_type == 'inflated_inputs':
        # Inflated input VAT claims
        total_sales = np.random.uniform(50000, 500000)
        export_sales = total_sales * np.random.uniform(0, 0.2)
        output_vat = (total_sales - export_sales) * 0.16
        # Suspicious: very high input VAT
        input_vat = output_vat * np.random.uniform(2.0, 4.0)
        net_refund = input_vat - output_vat
        sales_invoice_count = np.random.randint(5, 20)  # Few transactions
        supporting_docs = np.random.randint(2, 8)  # Few docs
        submitted_by = 'Self'  # Self-submitted
        business_age = np.random.uniform(0.5, 3)  # Young business

    elif fraud_type == 'fake_exports':
        # Fake export claims
        total_sales = np.random.uniform(100000, 800000)
        export_sales = total_sales * np.random.uniform(0.7, 0.95)  # Claim high exports
        output_vat = (total_sales - export_sales) * 0.16
        input_vat = total_sales * np.random.uniform(0.7, 0.9) * 0.16
        net_refund = input_vat - output_vat
        sales_invoice_count = np.random.randint(5, 30)
        supporting_docs = np.random.randint(2, 10)  # Poor documentation
        submitted_by = 'Self'
        business_age = np.random.uniform(0.3, 2.5)

    elif fraud_type == 'ghost_business':
        # Minimal real activity
        total_sales = np.random.uniform(30000, 200000)
        export_sales = total_sales * np.random.uniform(0.4, 0.8)
        output_vat = (total_sales - export_sales) * 0.16
        input_vat = output_vat * np.random.uniform(1.5, 3.0)
        net_refund = input_vat - output_vat
        sales_invoice_count = np.random.randint(2, 10)  # Very few transactions
        supporting_docs = np.random.randint(1, 5)  # Minimal docs
        submitted_by = 'Self'
        business_age = np.random.uniform(0.1, 1.5)  # Very young

    else:  # carousel
        # VAT carousel fraud
        total_sales = np.random.uniform(500000, 3000000)  # High value
        export_sales = total_sales * np.random.uniform(0.6, 0.9)
        output_vat = (total_sales - export_sales) * 0.16
        input_vat = total_sales * 0.16 * 1.3
        net_refund = input_vat - output_vat
        sales_invoice_count = np.random.randint(10, 50)
        supporting_docs = np.random.randint(5, 15)
        submitted_by = np.random.choice(['Self', 'Tax Agent'], p=[0.7, 0.3])
        business_age = np.random.uniform(1, 4)

    zero_rated_sales = export_sales * 0.8
    exempt_sales = total_sales * np.random.uniform(0, 0.05)

    return {
        'total_sales_amount': total_sales,
        'export_sales_value': export_sales,
        'output_vat': output_vat,
        'input_vat': input_vat,
        'net_refund_amount': net_refund,
        'sales_invoice_count': sales_invoice_count,
        'supporting_docs_count': supporting_docs,
        'submitted_by': submitted_by,
        'zero_rated_sales': zero_rated_sales,
        'exempt_sales': exempt_sales,
        'business_age_years': business_age,
        'is_fraud': 1,
        'fraud_type': fraud_type
    }

def generate_vat_claims_dataset():
    """Generate complete VAT claims dataset"""
    claims = []

    n_fraud = int(N_CLAIMS * FRAUD_RATE)
    n_legitimate = N_CLAIMS - n_fraud

    print(f"Generating {n_legitimate} legitimate claims...")
    for i in range(n_legitimate):
        period_start, period_end, claim_date = generate_dates()
        claim = generate_legitimate_claim()

        claim.update({
            'claim_id': generate_claim_id(),
            'taxpayer_id': generate_taxpayer_id(),
            'period_start': period_start.strftime('%Y-%m-%d'),
            'period_end': period_end.strftime('%Y-%m-%d'),
            'claim_date': claim_date.strftime('%Y-%m-%d'),
        })
        claims.append(claim)

    print(f"Generating {n_fraud} fraudulent claims...")
    for i in range(n_fraud):
        period_start, period_end, claim_date = generate_dates()
        claim = generate_fraudulent_claim()

        claim.update({
            'claim_id': generate_claim_id(),
            'taxpayer_id': generate_taxpayer_id(),
            'period_start': period_start.strftime('%Y-%m-%d'),
            'period_end': period_end.strftime('%Y-%m-%d'),
            'claim_date': claim_date.strftime('%Y-%m-%d'),
        })
        claims.append(claim)

    df = pd.DataFrame(claims)

    # Add processing days
    df['claim_date_dt'] = pd.to_datetime(df['claim_date'])
    df['processing_days'] = np.random.randint(10, 60, size=len(df))

    # Fraudulent claims often want faster processing
    df.loc[df['is_fraud'] == 1, 'processing_days'] = np.random.randint(5, 30, size=(df['is_fraud'] == 1).sum())

    df = df.drop('claim_date_dt', axis=1)

    # Shuffle
    df = df.sample(frac=1).reset_index(drop=True)

    return df

def generate_taxpayer_master():
    """Generate taxpayer master data"""
    taxpayers = []

    for i in range(N_TAXPAYERS):
        business_type = np.random.choice(['Limited Company', 'Sole Proprietor', 'Partnership'], p=[0.6, 0.3, 0.1])

        registration_date = datetime(2024, 1, 1) - timedelta(days=np.random.randint(30, 7300))

        taxpayer = {
            'taxpayer_id': generate_taxpayer_id(),
            'business_name': f"Business_{i:04d}",
            'business_type': business_type,
            'registration_date': registration_date.strftime('%Y-%m-%d'),
            'num_employees': np.random.randint(1, 200),
            'annual_turnover': np.random.uniform(100000, 10000000),
            'physical_address': f"Address_{i}",
            'address_verified': np.random.choice(['Yes', 'No'], p=[0.85, 0.15]),
            'bank_account_verified': np.random.choice(['Yes', 'No'], p=[0.9, 0.1]),
            'tax_agent_tpin': f"AGENT_{np.random.randint(1000, 9999)}" if np.random.random() < 0.6 else 'None',
            'directors': np.random.randint(1, 5) if business_type == 'Limited Company' else 1
        }
        taxpayers.append(taxpayer)

    return pd.DataFrame(taxpayers)

def generate_compliance_history():
    """Generate compliance history"""
    records = []

    for _ in range(N_TAXPAYERS // 2):  # Not all have audit history
        n_audits = np.random.randint(1, 5)
        taxpayer_id = generate_taxpayer_id()

        for _ in range(n_audits):
            audit_date = datetime(2024, 1, 1) - timedelta(days=np.random.randint(30, 1095))

            audit_result = np.random.choice(['Compliant', 'Issues Found'], p=[0.7, 0.3])

            record = {
                'taxpayer_id': taxpayer_id,
                'audit_date': audit_date.strftime('%Y-%m-%d'),
                'audit_result': audit_result,
                'penalties_imposed': np.random.randint(0, 50000) if audit_result == 'Issues Found' else 0,
                'tax_adjustments': np.random.randint(0, 100000) if audit_result == 'Issues Found' else 0,
                'compliance_rating': np.random.randint(3, 6) if audit_result == 'Issues Found' else np.random.randint(6, 10)
            }
            records.append(record)

    return pd.DataFrame(records)

def generate_pacra_verification():
    """Generate PACRA third-party verification data"""
    records = []

    for i in range(N_TAXPAYERS):
        record = {
            'taxpayer_id': generate_taxpayer_id(),
            'business_registered_pacra': np.random.choice(['Yes', 'No'], p=[0.9, 0.1]),
            'directors_match': np.random.choice(['Yes', 'No'], p=[0.85, 0.15]),
            'registered_address_match': np.random.choice(['Yes', 'No'], p=[0.8, 0.2]),
            'company_status': np.random.choice(['Active', 'Dormant'], p=[0.95, 0.05]),
            'share_capital': np.random.uniform(1000, 1000000)
        }
        records.append(record)

    return pd.DataFrame(records)

if __name__ == '__main__':
    print("=" * 60)
    print("ZRA VAT Fraud Detection - Synthetic Data Generator")
    print("=" * 60)

    # Create output directory
    import os
    output_dir = 'ZRA_DATASETS'
    os.makedirs(output_dir, exist_ok=True)

    print("\nGenerating datasets...")
    print("-" * 60)

    # Generate main claims data
    print("\n1. VAT Claims Dataset")
    vat_claims = generate_vat_claims_dataset()
    output_file = os.path.join(output_dir, 'zra_vatClaims.csv')
    vat_claims.to_csv(output_file, index=False)
    print(f"   [OK] Saved: {output_file}")
    print(f"   - Total claims: {len(vat_claims)}")
    print(f"   - Legitimate: {(vat_claims['is_fraud'] == 0).sum()}")
    print(f"   - Fraudulent: {(vat_claims['is_fraud'] == 1).sum()}")
    print(f"   - Fraud rate: {vat_claims['is_fraud'].mean():.1%}")

    # Generate taxpayer master
    print("\n2. Taxpayer Master Dataset")
    taxpayer_master = generate_taxpayer_master()
    output_file = os.path.join(output_dir, 'zra_taxpayerMaster.csv')
    taxpayer_master.to_csv(output_file, index=False)
    print(f"   [OK] Saved: {output_file}")
    print(f"   - Total taxpayers: {len(taxpayer_master)}")

    # Generate compliance history
    print("\n3. Compliance History Dataset")
    compliance = generate_compliance_history()
    output_file = os.path.join(output_dir, 'zra_complianceHistory.csv')
    compliance.to_csv(output_file, index=False)
    print(f"   [OK] Saved: {output_file}")
    print(f"   - Total records: {len(compliance)}")

    # Generate PACRA data
    print("\n4. PACRA Verification Dataset")
    pacra = generate_pacra_verification()
    output_file = os.path.join(output_dir, 'zra_thirdPartyVerification.csv')
    pacra.to_csv(output_file, index=False)
    print(f"   [OK] Saved: {output_file}")
    print(f"   - Total records: {len(pacra)}")

    print("\n" + "=" * 60)
    print("[SUCCESS] Data generation complete!")
    print("=" * 60)

    # Display statistics
    print("\n[STATS] Dataset Statistics:")
    print("-" * 60)
    print(f"Fraud cases distribution:")
    if 'fraud_type' in vat_claims.columns:
        fraud_dist = vat_claims[vat_claims['is_fraud'] == 1]['fraud_type'].value_counts()
        for fraud_type, count in fraud_dist.items():
            print(f"  - {fraud_type}: {count}")

    print(f"\nKey metrics (legitimate claims):")
    legit = vat_claims[vat_claims['is_fraud'] == 0]
    print(f"  - Avg refund: ZMW {legit['net_refund_amount'].mean():,.0f}")
    print(f"  - Avg sales: ZMW {legit['total_sales_amount'].mean():,.0f}")
    print(f"  - Avg docs: {legit['supporting_docs_count'].mean():.1f}")

    print(f"\nKey metrics (fraudulent claims):")
    fraud = vat_claims[vat_claims['is_fraud'] == 1]
    print(f"  - Avg refund: ZMW {fraud['net_refund_amount'].mean():,.0f}")
    print(f"  - Avg sales: ZMW {fraud['total_sales_amount'].mean():,.0f}")
    print(f"  - Avg docs: {fraud['supporting_docs_count'].mean():.1f}")
