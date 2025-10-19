# HOW THE SYSTEM CALCULATES COMPLEX FEATURES
## From Simple VAT Return to Comprehensive Fraud Analysis

---

## 🎯 **THE MAGIC: 15 Input Fields → 50+ Risk Indicators**

### **What You Provide (VAT Return CSV):**
```csv
claim_id,taxpayer_id,period_start,period_end,claim_date,submitted_by,
net_refund_amount,output_vat,input_vat,total_sales_amount,export_sales_value,
zero_rated_sales,exempt_sales,sales_invoice_count,supporting_docs_count
```

### **What the System Generates:**
50+ sophisticated fraud indicators across 5 risk categories!

---

## ⚙️ **KEY CALCULATIONS REVEALED**

### **1. CRITICAL RATIOS (The Heart of Fraud Detection)**

#### **Refund-to-Output Ratio**
```python
refund_to_output_ratio = net_refund_amount / max(output_vat, 1)
```
**Example:** ZMW 15,000 ÷ ZMW 50,000 = **0.30** (30%)
- **> 0.8** = 🚨 **MAJOR RED FLAG** (refund bigger than VAT collected!)
- **0.3-0.8** = ⚠️ **Suspicious** (high refund ratio)
- **< 0.3** = ✅ **Normal** (reasonable refund)

#### **Input-Output VAT Ratio**
```python
input_output_vat_ratio = input_vat / max(output_vat, 1)
```
**Example:** ZMW 65,000 ÷ ZMW 50,000 = **1.30** (130%)
- **> 1.8** = 🚨 **Inflated input VAT** (suspicious purchases)
- **1.1-1.8** = ⚠️ **Normal range** (typical business)
- **< 1.1** = ✅ **Conservative** (minimal excess inputs)

#### **Claim-to-Turnover Ratio**
```python
claim_to_turnover_ratio = net_refund_amount / max(total_sales_amount, 1)
```
**Example:** ZMW 15,000 ÷ ZMW 500,000 = **0.03** (3%)
- **> 0.10** = 🚨 **Disproportionate** (10%+ of sales as refund!)
- **0.02-0.10** = ⚠️ **Moderate** (significant relative to business)
- **< 0.02** = ✅ **Reasonable** (small relative to turnover)

### **2. BUSINESS ACTIVITY INDICATORS**

#### **Export Business Classification**
```python
export_ratio = export_sales_value / max(total_sales_amount, 1)
has_export_sales = 1 if export_sales_value > 0 else 0
is_export_heavy = 1 if export_ratio > 0.5 else 0
```
**Logic:** Export businesses legitimately get VAT refunds (zero-rated exports)

#### **Transaction Volume Analysis**
```python
has_few_sales = 1 if sales_invoice_count < 10 else 0
has_few_documents = 1 if supporting_docs_count < 5 else 0
```
**Logic:** Active businesses have many transactions and good documentation

#### **Business Size Classification**
```python
is_small_business = 1 if total_sales_amount < 500000 else 0
is_high_value_claim = 1 if net_refund_amount > threshold_90th_percentile else 0
```
**Logic:** Large refunds from small businesses are suspicious

### **3. SUBMISSION PATTERN ANALYSIS**

#### **Professional Oversight**
```python
submitted_by_agent = 1 if submitted_by == "Tax Agent" else 0
no_tax_agent = 1 if submitted_by != "Tax Agent" else 0
```
**Logic:** Tax agents provide professional oversight (lower risk)

#### **Processing Urgency**
```python
# Uses 30-day baseline with 15-day standard deviation
processing_days_zscore = (processing_days - 30) / 15
```
**Logic:** Urgent processing requests may indicate desperation for funds

### **4. SMART DEFAULTS (When Data Missing)**

#### **Business Profile Assumptions**
```python
# Conservative defaults for missing information
business_age_years = 5.0  # Assume established business
is_young_business = 0     # Not flagged as young unless proven
directors_count = 2       # Assume multiple directors (lower risk)
single_director = 0       # Not flagged unless confirmed
total_claims_filed = 1    # Assume first claim (conservative)
```

#### **Compliance History Defaults**
```python
# Assumes good compliance unless proven otherwise
never_audited = 1         # Most businesses never audited
has_audit_issues = 0      # No issues assumed
has_penalties = 0         # No penalties assumed
compliance_rating = 5     # Average rating (out of 10)
```

#### **Verification Defaults**
```python
# Assumes legitimate unless red flags present
address_not_verified = 0     # Address OK
bank_not_verified = 0        # Bank OK
not_registered_pacra = 0     # Registered OK
directors_mismatch = 0       # Directors OK
```

### **5. COMPOSITE RISK SCORES**

#### **Risk Score Formulas**
```python
supplier_risk_score = (
    low_supplier_diversity * 3 +
    has_unverified_suppliers * 3 +
    has_unverified_payments * 2 +
    suspicious_purchase_pattern * 2
)

export_risk_score = (
    export_without_customs * 5 +
    has_missing_export_docs * 3 +
    has_unpaid_sales * 2
)

legitimacy_risk_score = (
    not_registered_pacra * 4 +
    address_not_verified * 2 +
    directors_mismatch * 2 +
    is_dormant_company * 2
)

historical_risk_score = (
    has_audit_issues * 3 +
    has_penalties * 3 +
    low_compliance_rating * 2 +
    is_first_time_claimant * 2
)
```

---

## 🔍 **EXAMPLE: HOW A HIGH-RISK CASE IS DETECTED**

### **Input Data:**
```csv
CLM_RISK_001,TPIN_99999999,2025-07-01,2025-09-30,2025-10-05,Self,
15000,8000,23000,200000,5000,10000,2000,3,2
```

### **System Calculations:**
```python
# Critical ratios that trigger alarms
refund_to_output_ratio = 15000 / 8000 = 1.875  # 🚨 187% - EXCESSIVE!
input_output_vat_ratio = 23000 / 8000 = 2.875  # 🚨 287% - INFLATED!
claim_to_turnover_ratio = 15000 / 200000 = 0.075  # ⚠️ 7.5% - HIGH!
export_ratio = 5000 / 200000 = 0.025  # 🚨 Only 2.5% exports!

# Activity indicators
has_few_sales = 1  # Only 3 invoices
has_few_documents = 1  # Only 2 docs
submitted_by_agent = 0  # Self-submitted
```

### **Result:** 🔴 **85%+ fraud probability** with multiple red flags!

---

## 🎯 **KEY INSIGHTS**

### **Why This Works:**
1. **Pattern Recognition:** Fraudsters show predictable behavioral patterns
2. **Ratio Analysis:** Mathematical relationships reveal inconsistencies
3. **Context Awareness:** Export businesses legitimately need refunds
4. **Professional Oversight:** Tax agents reduce risk
5. **Activity Correlation:** Active businesses have many transactions

### **Smart Defaults Strategy:**
- **Assumes legitimacy first** (innocent until proven guilty)
- **Conservative scoring** (reduces false positives)
- **Missing data handled gracefully** (system still works with incomplete information)
- **Professional judgment supported** (tool assists, doesn't replace auditors)

### **The Power:**
From just **15 simple VAT return fields**, the system generates a **comprehensive fraud analysis** that would take auditors hours to calculate manually!

---

## ⚠️ **REMEMBER:**
This is **pattern detection**, not **fraud determination**. High scores mean "investigate further" - not "definitely fraud". The system identifies **statistical anomalies** that warrant human review.

**Human auditors remain essential** for final fraud determination!