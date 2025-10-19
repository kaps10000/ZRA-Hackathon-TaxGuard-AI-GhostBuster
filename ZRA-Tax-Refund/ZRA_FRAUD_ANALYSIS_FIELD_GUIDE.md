# ZRA VAT FRAUD ANALYSIS - FIELD GUIDE
## Understanding Your Fraud Detection Report

---

## 📋 **TABLE OF CONTENTS**
1. [Input Fields Explained](#input-fields)
2. [Key Calculated Ratios](#calculated-ratios)
3. [Risk Factor Categories](#risk-categories)
4. [Risk Scores Breakdown](#risk-scores)
5. [Report Interpretation Guide](#interpretation)

---

## 🔍 **INPUT FIELDS EXPLAINED** {#input-fields}

### **Basic VAT Return Fields (User Provides)**
These are the standard fields from a VAT return that users upload:

| **Field** | **Description** | **Example** |
|-----------|-----------------|-------------|
| `claim_id` | Unique refund claim identifier | CLM_001 |
| `taxpayer_id` | Taxpayer identification number | TPIN_12345678 |
| `period_start` | VAT period start date | 2025-07-01 |
| `period_end` | VAT period end date | 2025-09-30 |
| `claim_date` | Date claim was submitted | 2025-10-05 |
| `submitted_by` | Who submitted (Self/Tax Agent) | Tax Agent |
| `net_refund_amount` | Amount claimed for refund | ZMW 15,000 |
| `output_vat` | VAT charged on sales | ZMW 50,000 |
| `input_vat` | VAT paid on purchases | ZMW 65,000 |
| `total_sales_amount` | Total sales for period | ZMW 500,000 |
| `export_sales_value` | Value of export sales | ZMW 300,000 |
| `zero_rated_sales` | Zero-rated domestic sales | ZMW 100,000 |
| `exempt_sales` | VAT-exempt sales | ZMW 25,000 |
| `sales_invoice_count` | Number of sales invoices | 45 |
| `supporting_docs_count` | Number of supporting documents | 8 |

---

## ⚖️ **KEY CALCULATED RATIOS** {#calculated-ratios}

### **1. Refund-to-Output Ratio**
**Formula:** `net_refund_amount ÷ output_vat`
- **Purpose:** Measures refund size relative to VAT charged on sales
- **Interpretation:**
  - `< 0.3` = Normal (Low risk)
  - `0.3 - 0.8` = Moderate (Medium risk)  
  - `> 0.8` = Excessive (High risk)
- **Example:** ZMW 15,000 ÷ ZMW 50,000 = 0.30 (30%)

### **2. Input-Output VAT Ratio**
**Formula:** `input_vat ÷ output_vat`
- **Purpose:** Compares VAT paid on purchases vs VAT charged on sales
- **Interpretation:**
  - `< 1.1` = Conservative (Low risk)
  - `1.1 - 1.8` = Normal (Medium risk)
  - `> 1.8` = Inflated inputs (High risk)
- **Example:** ZMW 65,000 ÷ ZMW 50,000 = 1.30 (130%)

### **3. Claim-to-Turnover Ratio**
**Formula:** `net_refund_amount ÷ total_sales_amount`
- **Purpose:** Refund size relative to total business activity
- **Interpretation:**
  - `< 0.02` = Reasonable (Low risk)
  - `0.02 - 0.10` = Moderate (Medium risk)
  - `> 0.10` = Disproportionate (High risk)
- **Example:** ZMW 15,000 ÷ ZMW 500,000 = 0.03 (3%)

### **4. Export Sales Ratio**
**Formula:** `export_sales_value ÷ total_sales_amount`
- **Purpose:** Determines if business qualifies for legitimate refunds
- **Interpretation:**
  - `> 0.5` = Export-heavy (Supports refund claim)
  - `0.2 - 0.5` = Mixed business (Moderate support)
  - `< 0.2` = Domestic-focused (Weak refund justification)
- **Example:** ZMW 300,000 ÷ ZMW 500,000 = 0.60 (60% exports)

---

## 🚨 **RISK FACTOR CATEGORIES** {#risk-categories}

### **📊 CLAIM PATTERNS**
**Fields Analyzed:**
- `net_refund_amount` → **Amount Analysis**
- `refund_to_output_ratio` → **Refund Intensity**
- `input_output_vat_ratio` → **VAT Balance Check**
- `processing_days_zscore` → **Urgency Pattern**
- `is_first_time_claimant` → **Experience Level**
- `is_high_value_claim` → **Size Category**

**How System Calculates:**
- **First-time claimant:** Assumes 1 previous claim (conservative default)
- **High-value claim:** Compares against 90th percentile threshold
- **Processing urgency:** Uses 30-day baseline with 15-day standard deviation

### **🏢 BUSINESS PROFILE**
**Fields Analyzed:**
- `business_age_years` → **Operating History**
- `is_young_business` → **Maturity Flag**
- `submitted_by_agent` → **Professional Oversight**
- `single_director` → **Control Structure**
- `is_sole_proprietor` → **Business Type**

**How System Calculates:**
- **Business age:** Defaults to established business (5+ years) if unknown
- **Professional submission:** Detects "Tax Agent" vs "Self" submission
- **Structure flags:** Uses conservative defaults (multiple directors, not sole proprietor)

### **💼 TRANSACTION BEHAVIOR**
**Fields Analyzed:**
- `sales_invoice_count` → **Activity Level**
- `supporting_docs_count` → **Documentation Quality**
- `export_sales_value` → **Export Activity**
- `has_few_sales` → **Transaction Volume**
- `has_few_documents` → **Evidence Sufficiency**

**How System Calculates:**
- **Few sales:** Less than 10 invoices = suspicious
- **Few documents:** Less than 5 supporting docs = insufficient
- **Export patterns:** Matches export sales with customs data (assumed matching if unknown)

### **📋 COMPLIANCE HISTORY**
**Fields Analyzed (Defaults Used):**
- `never_audited` → **Audit History** (Assumes never audited)
- `has_audit_issues` → **Past Problems** (Assumes none)
- `has_penalties` → **Violation History** (Assumes none)
- `low_compliance_rating` → **Rating Score** (Assumes average rating)

**Default Assumptions:**
- No previous audits (conservative)
- No historical penalties
- Average compliance rating (5/10)
- Registered with PACRA
- No address/director mismatches

---

## 📈 **RISK SCORES BREAKDOWN** {#risk-scores}

### **Supplier Risk Score (0-10)**
**Calculated from:**
- Low supplier diversity (≤3 suppliers): +3 points
- Unverified suppliers present: +3 points  
- Unverified payments: +2 points
- Suspicious purchase patterns: +2 points

**Default for VAT returns:** Usually 0 (no supplier data available)

### **Export Risk Score (0-10)**
**Calculated from:**
- Export without customs records: +5 points
- Missing export documentation: +3 points
- Unpaid export sales: +2 points

**Default for VAT returns:** Usually 0-5 (conservative assumptions)

### **Legitimacy Risk Score (0-10)**
**Calculated from:**
- Not registered with PACRA: +4 points
- Address not verified: +2 points
- Directors mismatch: +2 points
- Dormant company: +2 points

**Default for VAT returns:** Usually 0 (assumes legitimate registration)

### **Historical Risk Score (0-10)**
**Calculated from:**
- Previous audit issues: +3 points
- Past penalties: +3 points
- Low compliance rating: +2 points
- First-time claimant: +2 points

**Default for VAT returns:** Usually 0-2 (conservative history)

---

## 🎯 **REPORT INTERPRETATION GUIDE** {#interpretation}

### **Risk Level Classification**
- **🟢 LOW (0-30%):** Standard processing acceptable
- **🟡 MEDIUM (30-70%):** Enhanced due diligence recommended
- **🔴 HIGH (70-100%):** Immediate review required

### **Key Indicators to Watch**
1. **Refund-to-output ratio > 0.8** = Major red flag
2. **Input-output VAT ratio > 1.8** = Suspicious inputs
3. **Low export percentage + high refund** = Weak justification
4. **Self-submitted + few documents** = Poor evidence
5. **High claim-to-turnover ratio** = Disproportionate to business size

### **Protective Factors that Lower Risk**
1. **Tax agent submission** = Professional oversight
2. **High export percentage** = Legitimate refund reason
3. **Many supporting documents** = Good evidence
4. **Conservative ratios** = Genuine business patterns
5. **High transaction volume** = Active trading business

### **Understanding False Positives**
The system may flag legitimate businesses if:
- New export businesses (appear as first-time claimants)
- Seasonal businesses (low transaction volumes)
- Businesses with legitimate one-off large purchases

### **System Limitations**
- **No real compliance history:** Uses conservative defaults
- **No supplier verification:** Cannot detect fake suppliers
- **No customs cross-checking:** Assumes export records match
- **Limited business intelligence:** Cannot verify actual business operations

---

## ⚠️ **IMPORTANT NOTES**

1. **This is a screening tool** - Not a definitive fraud determination
2. **Human judgment required** - Investigate high-risk cases manually  
3. **False positives possible** - Legitimate businesses may score medium risk
4. **Continuous learning** - System improves with more data and feedback
5. **Multiple verification needed** - Cross-check with external databases

---

## 📞 **For Technical Support**
Contact ZRA IT Support for questions about:
- Field calculations
- Risk score interpretation
- System limitations
- False positive handling

**Remember:** This system assists decision-making but cannot replace professional tax audit judgment.