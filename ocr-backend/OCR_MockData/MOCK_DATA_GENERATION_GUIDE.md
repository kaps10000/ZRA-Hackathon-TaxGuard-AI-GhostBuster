# ZRA TaxGuard - Mock Data Generation Guide

## 🎯 Purpose

This guide explains the validation rules and security requirements for generating mock tax documents that will pass the OCR AI Service verification. Use this guide to create realistic test data for testing and demonstration purposes.

---

## 📊 Document Verification Overview

The OCR AI Service performs comprehensive verification using:

1. **Field Validation** - Individual field format and content checks
2. **Anomaly Detection** - Pattern recognition and missing data detection
3. **Risk Scoring** - Overall document quality assessment (0-100 scale)
4. **Risk Level Classification** - LOW, MEDIUM, HIGH, CRITICAL
5. **Verification Status** - VERIFIED, FLAGGED, REJECTED

---

## 🎚️ Risk Score Thresholds

| Risk Score Range | Risk Level | Verification Status | Description |
|-----------------|------------|---------------------|-------------|
| **70-100** | LOW | ✅ VERIFIED | Document appears legitimate, auto-approve |
| **50-69** | MEDIUM | ⚡ FLAGGED | Requires review before approval |
| **30-49** | HIGH | ⚠️ FLAGGED | Requires thorough manual verification |
| **0-29** | CRITICAL | ⛔ REJECTED | Critical issues, reject document |

**Goal:** Aim for a risk score of **70+** for documents to pass verification automatically.

---

## 🔍 Field Validation Rules

### 1. Invoice Number

**Validation Function:** `validate_invoice_number()`

**Requirements:**
- ✅ Minimum length: **5 characters**
- ✅ Valid characters: **Alphanumeric + hyphens (-) + slashes (/)**
- ❌ Cannot be all zeros (e.g., "00000")
- ❌ No special characters except `-` and `/`

**Scoring Penalties:**
- Too short (< 5 chars): **-20 points**
- All zeros: **-30 points** + marked invalid
- Invalid characters: **-15 points**

**Valid Examples:**
```
INV-2025-001
ZRA/123456
TAX-2025/Q4/001
ABC123XYZ
12345-67890
```

**Invalid Examples:**
```
INV1        (too short)
00000       (all zeros)
INV@123     (invalid character @)
```

---

### 2. HS Codes (Harmonized System Codes)

**Validation Function:** `validate_hs_code()`

**Requirements:**
- ✅ Must be **6-10 digits long**
- ✅ **Numeric only** (no letters or special characters)
- ✅ Valid range: 000000-9999999999

**Scoring Penalties:**
- Non-numeric: **-30 points** + marked invalid
- Invalid length: **-20 points**

**Valid Examples:**
```
8517120000  (Mobile phones - 10 digits)
851712      (Mobile phones - 6 digits)
620342      (Men's trousers - 6 digits)
271019      (Petroleum oils - 6 digits)
```

**Invalid Examples:**
```
12345       (too short - only 5 digits)
12345678901 (too long - 11 digits)
ABC123      (contains letters)
85-1712     (contains hyphen)
```

**Common HS Code Categories:**
- Electronics: 8517xxxxxx (phones), 8471xxxxxx (computers)
- Textiles: 6203xxxxxx (men's clothing), 6204xxxxxx (women's clothing)
- Food: 1901xxxxxx (prepared foods), 2101xxxxxx (coffee/tea)
- Vehicles: 8703xxxxxx (passenger cars), 8704xxxxxx (trucks)

---

### 3. Document Date

**Validation Function:** `validate_date()`

**Requirements:**
- ✅ Valid date format (ISO 8601 recommended: `YYYY-MM-DD`)
- ✅ **Not in the future**
- ✅ **Not older than 5 years**
- ✅ Parseable date string

**Scoring Penalties:**
- Future date: **-40 points** + marked invalid
- Older than 5 years: **-20 points**
- Invalid format: **0 points** (complete failure) + marked invalid

**Valid Examples:**
```
2025-10-12            (ISO format - recommended)
2024-06-15            (within 5 years)
12/10/2025            (DD/MM/YYYY)
2025-10-12T14:30:00Z  (ISO with time)
15 Jan 2025           (Month name format)
```

**Invalid Examples:**
```
2026-01-01            (future date)
2019-01-01            (older than 5 years from 2025)
32/13/2025            (invalid date)
not-a-date            (unparseable)
```

**Recommended Date Range:**
- **Earliest:** 2020-10-12 (5 years ago from today: 2025-10-12)
- **Latest:** 2025-10-12 (today)
- **Optimal:** Recent dates within last 3-6 months

---

### 4. Total Amount

**Validation Function:** `validate_amount()`

**Requirements:**
- ✅ **Must be positive** (> 0)
- ✅ Reasonable range: **0.01 to 10,000,000**
- ✅ Valid currency: **ZMW, USD, EUR, GBP**
- ⚠️ Avoid suspiciously round numbers (e.g., exactly 100,000)

**Scoring Penalties:**
- Zero or negative: **-40 points** + marked invalid
- > 10 million: **-30 points**
- Suspiciously round (multiple of 1000 and > 10,000): **-10 points**
- Invalid currency: **-20 points**

**Valid Examples:**
```
Amount: 5,234.50   Currency: ZMW
Amount: 125.00     Currency: USD
Amount: 15,678.23  Currency: EUR
Amount: 999,999.99 Currency: GBP
Amount: 1,234.56   Currency: ZMW
```

**Invalid Examples:**
```
Amount: 0.00       (zero amount)
Amount: -500.00    (negative)
Amount: 15000000   (> 10 million)
Amount: 100000     Currency: ZMW (suspiciously round)
Amount: 5000       Currency: XYZ (invalid currency)
```

**Recommendations:**
- Use realistic amounts with cents: `1,234.56` instead of `1,000.00`
- Vary amounts to avoid patterns
- Match currency to document context (ZMW for Zambia)

---

### 5. TPIN (Tax Payer Identification Number)

**Validation Function:** `validate_tpin()`

**Requirements:**
- ✅ **Exactly 10 digits**
- ✅ **Numeric only**
- ❌ Cannot be all the same digit (e.g., "1111111111")
- ❌ No sequential patterns

**Scoring Penalties:**
- Non-numeric: **-40 points** + marked invalid
- Wrong length: **-30 points** + marked invalid
- All repeated digits: **-50 points** + marked invalid

**Valid Examples:**
```
1234567890
9876543210
1002003004
2025100001
```

**Invalid Examples:**
```
123456789    (only 9 digits)
12345678901  (11 digits)
TPIN123456   (contains letters)
1111111111   (all same digit)
0123456789   (sequential pattern - risky)
```

**Generating Realistic TPINs:**
```python
# Python example
import random
tpin = ''.join([str(random.randint(1, 9)) for _ in range(10)])
```

---

## 🚨 Anomaly Detection Rules

The system automatically detects anomalies that reduce risk scores:

### Critical Anomalies (Severe Impact)

| Anomaly Type | Severity | Risk Score Penalty | Description |
|--------------|----------|-------------------|-------------|
| **Missing Critical Field** | HIGH | -15 points | Missing `invoice_number` or `document_date` |
| **Low OCR Confidence** | HIGH | -15 points | OCR confidence < 70% |
| **Missing HS Codes** | HIGH | -15 points | Customs declaration without HS codes |
| **Missing TPIN** | MEDIUM | -8 points | Tax ID not found |
| **Missing Amount** | MEDIUM | -8 points | Invoice without total amount |
| **Invalid Currency** | MEDIUM | -8 points | Unrecognized currency code |

### OCR Confidence Impact

| OCR Confidence | Risk Score Penalty | Description |
|---------------|-------------------|-------------|
| **90-100%** | 0 points | Excellent quality |
| **70-89%** | -4 to -8 points | Good quality |
| **50-69%** | -8 to -16 points | Poor quality |
| **< 50%** | -16 to -20 points | Very poor quality |

**Formula:** `penalty = (0.9 - ocr_confidence) * 40`

---

## 📋 Required vs Optional Fields

### Critical Fields (MUST Have)

To avoid HIGH severity anomalies, always include:

1. ✅ **Invoice Number** - Unique document identifier
2. ✅ **Document Date** - Date of document creation
3. ✅ **Total Amount** - Main monetary value (for invoices/customs)
4. ✅ **Importer Name** - Company or individual name

**Missing ANY critical field = -15 points per field**

### Important Fields (Should Have)

To achieve 70+ risk score, include:

1. **TPIN** - Tax identification number (-8 if missing)
2. **Currency** - ZMW, USD, EUR, or GBP
3. **HS Codes** - For customs declarations (-15 if missing)
4. **Company Name** - Supplier/Importer name

### Optional Fields (Nice to Have)

These improve completeness score:

- Phone number
- Email address
- Address
- Additional line items
- Serial numbers
- Contact person

**Completeness Formula:**
```
completeness = found_fields / expected_fields
if completeness < 0.75:
    risk_score -= (0.75 - completeness) * 40
```

**Example:** If only 2 of 4 expected fields found:
- Completeness = 2/4 = 0.5
- Penalty = (0.75 - 0.5) * 40 = **-10 points**

---

## 🎯 Risk Score Calculation Formula

Understanding how the final risk score is calculated:

```
Starting Score: 100 points

Deductions:
1. OCR Confidence: up to -20 points
2. Field Validation Failures: -10 points per invalid field
3. Field Validation Issues: -0.1 * (100 - field_score) per field
4. Anomalies:
   - CRITICAL: -25 points each
   - HIGH: -15 points each
   - MEDIUM: -8 points each
   - LOW: -3 points each
5. Completeness: up to -10 points (if < 75% complete)

Final Score: max(0, min(100, calculated_score))
```

---

## 📝 Mock Data Generation Strategy

### Strategy 1: Perfect Document (Risk Score: 95-100)

**Characteristics:**
- All critical fields present
- All validations pass
- No anomalies
- High OCR confidence (assumed 90%+)
- Complete data

**Example Invoice:**
```json
{
  "invoice_number": "INV-2025-10-12-001",
  "document_date": "2025-10-12",
  "total_amount": 15234.56,
  "currency": "ZMW",
  "tpin": "1234567890",
  "importer_name": "ABC Trading Limited",
  "phone": "+260 977 123456",
  "email": "info@abctrading.zm"
}
```

**Expected Result:**
- Risk Score: **95-100**
- Risk Level: **LOW**
- Status: **✅ VERIFIED**

---

### Strategy 2: Good Document with Minor Issues (Risk Score: 70-85)

**Characteristics:**
- All critical fields present
- Most validations pass
- 1-2 LOW severity anomalies
- Missing 1 optional field

**Example Invoice:**
```json
{
  "invoice_number": "TAX2025001",
  "document_date": "2024-03-15",
  "total_amount": 50000.00,
  "currency": "ZMW",
  "importer_name": "XYZ Corporation Ltd"
}
```

**Issues:**
- Missing TPIN (-8 points)
- Suspiciously round amount (-10 points)
- Missing contact info

**Expected Result:**
- Risk Score: **70-80**
- Risk Level: **LOW or MEDIUM**
- Status: **✅ VERIFIED or ⚡ FLAGGED**

---

### Strategy 3: Flagged Document (Risk Score: 50-69)

**Characteristics:**
- All critical fields present
- Some validation failures
- Multiple MEDIUM anomalies
- Missing 2-3 fields

**Example Invoice:**
```json
{
  "invoice_number": "12345",
  "document_date": "2022-01-01",
  "total_amount": 9500000,
  "currency": "ZMW"
}
```

**Issues:**
- Invoice number at minimum length (borderline)
- Date older than 3 years (-10 points for age)
- Amount very high (-15 points)
- Missing TPIN (-8 points)
- Missing importer name (-15 points)
- Low completeness (-10 points)

**Expected Result:**
- Risk Score: **50-65**
- Risk Level: **MEDIUM**
- Status: **⚡ FLAGGED**

---

### Strategy 4: Rejected Document (Risk Score: < 30)

**Characteristics:**
- Missing critical fields
- Multiple validation failures
- HIGH/CRITICAL anomalies
- Poor data quality

**Example Invoice:**
```json
{
  "invoice_number": "00000",
  "document_date": "2026-12-31",
  "total_amount": -500,
  "currency": "XYZ",
  "tpin": "123"
}
```

**Issues:**
- All zeros invoice number (-30 + invalid)
- Future date (-40 + invalid)
- Negative amount (-40 + invalid)
- Invalid currency (-20)
- Invalid TPIN (-40 + invalid)
- Missing critical fields (-15 each)

**Expected Result:**
- Risk Score: **0-25**
- Risk Level: **CRITICAL**
- Status: **⛔ REJECTED**

---

## 📄 Document Type Specific Requirements

### Invoice

**Required Fields:**
- Invoice Number
- Document Date
- Total Amount
- Currency
- Importer/Supplier Name

**Optional but Recommended:**
- TPIN
- Line items
- Tax amounts
- Payment terms

**Keywords to Include in Text:**
"invoice", "bill", "payment", "amount due"

---

### Customs Declaration

**Required Fields:**
- Document Number
- Document Date
- HS Codes (one or more)
- Total Amount
- Importer Name

**Optional but Recommended:**
- TPIN
- Country of origin
- Port of entry
- Duty amounts

**Keywords to Include in Text:**
"customs declaration", "import", "export", "tariff", "duty", "HS code"

---

### Receipt

**Required Fields:**
- Receipt Number
- Transaction Date
- Total Amount
- Currency

**Optional but Recommended:**
- Merchant name
- Payment method
- Transaction ID

**Keywords to Include in Text:**
"receipt", "paid", "transaction", "payment received"

---

## 🛠️ Mock Data Generation Tools

### Python Script Example

```python
import random
from datetime import datetime, timedelta

def generate_mock_invoice(quality="perfect"):
    """Generate mock invoice data

    quality: 'perfect', 'good', 'flagged', or 'rejected'
    """

    if quality == "perfect":
        return {
            "invoice_number": f"INV-2025-{random.randint(1000, 9999)}",
            "document_date": (datetime.now() - timedelta(days=random.randint(1, 90))).isoformat(),
            "total_amount": round(random.uniform(1000, 100000), 2),
            "currency": "ZMW",
            "tpin": ''.join([str(random.randint(1, 9)) for _ in range(10)]),
            "importer_name": f"Trading Company {random.randint(1, 100)} Ltd",
            "phone": f"+260 977 {random.randint(100000, 999999)}",
            "email": f"contact{random.randint(1, 100)}@example.zm"
        }

    elif quality == "good":
        return {
            "invoice_number": f"TAX{random.randint(10000, 99999)}",
            "document_date": (datetime.now() - timedelta(days=random.randint(100, 300))).isoformat(),
            "total_amount": round(random.uniform(5000, 500000), 0),  # Round number
            "currency": "ZMW",
            "importer_name": f"ABC Trading {random.randint(1, 50)} Ltd"
            # Missing TPIN and contact info
        }

    elif quality == "flagged":
        return {
            "invoice_number": f"{random.randint(10000, 99999)}",  # Just numbers
            "document_date": (datetime.now() - timedelta(days=random.randint(1000, 1500))).isoformat(),  # Old
            "total_amount": round(random.uniform(5000000, 9500000), 2),  # Very high
            "currency": "ZMW"
            # Missing TPIN and importer name
        }

    elif quality == "rejected":
        return {
            "invoice_number": "00000",  # Invalid
            "document_date": (datetime.now() + timedelta(days=30)).isoformat(),  # Future
            "total_amount": -500,  # Negative
            "currency": "XYZ",  # Invalid
            "tpin": "123"  # Too short
        }

# Usage
perfect_invoice = generate_mock_invoice("perfect")
print(perfect_invoice)
```

---

### JSON Template for Perfect Invoice

```json
{
  "document_type": "invoice",
  "invoice_number": "INV-2025-10-12-5678",
  "document_date": "2025-10-12",
  "total_amount": 45678.90,
  "currency": "ZMW",
  "tpin": "1234567890",
  "importer_name": "Global Trading Ltd",
  "supplier_name": "Manufacturing Co Ltd",
  "phone": "+260 977 123456",
  "email": "accounts@globaltrading.zm",
  "line_items": [
    {
      "description": "Product A",
      "quantity": 100,
      "unit_price": 123.45,
      "amount": 12345.00
    },
    {
      "description": "Product B",
      "quantity": 50,
      "unit_price": 666.78,
      "amount": 33339.00
    }
  ],
  "tax_amount": 4567.89,
  "subtotal": 41111.01
}
```

---

### JSON Template for Perfect Customs Declaration

```json
{
  "document_type": "customs_declaration",
  "invoice_number": "CUSTOMS-2025-001234",
  "document_date": "2025-10-10",
  "hs_codes": ["8517120000", "620342", "271019"],
  "total_amount": 125000.50,
  "currency": "USD",
  "tpin": "9876543210",
  "importer_name": "Import Export Ltd",
  "country_of_origin": "China",
  "port_of_entry": "Lusaka International Airport",
  "phone": "+260 966 789012",
  "items": [
    {
      "description": "Mobile phones",
      "hs_code": "8517120000",
      "quantity": 500,
      "value": 50000.00
    },
    {
      "description": "Men's trousers",
      "hs_code": "620342",
      "quantity": 1000,
      "value": 25000.50
    },
    {
      "description": "Petroleum products",
      "hs_code": "271019",
      "quantity": 10000,
      "value": 50000.00
    }
  ],
  "duty_amount": 12500.05
}
```

---

## 🎨 Creating Visual Mock Documents

### Recommended Tools

1. **Microsoft Word / Google Docs**
   - Create invoice templates
   - Export as PDF or image
   - Print-friendly fonts

2. **Canva / Photoshop**
   - Professional invoice designs
   - Export as PNG/JPG
   - High resolution (300 DPI recommended)

3. **Python + Pillow**
   - Programmatic image generation
   - Batch creation of test documents

### Design Guidelines

**Text Quality:**
- Font: Arial, Helvetica, or similar sans-serif (clear OCR)
- Size: 10-12pt for body, 14-16pt for headers
- Color: Black text on white background (best OCR)
- Spacing: Adequate line spacing (1.5x)
- Resolution: 300 DPI minimum for images

**Layout:**
- Clear sections (header, items, totals)
- Aligned columns
- Visible field labels
- No overlapping text
- Margins: At least 0.5 inch

**Common OCR Pitfalls to Avoid:**
- ❌ Low resolution images (< 150 DPI)
- ❌ Rotated or skewed text
- ❌ Decorative/script fonts
- ❌ Colored backgrounds
- ❌ Low contrast (gray text)
- ❌ Watermarks over text
- ❌ Compressed JPEGs with artifacts

---

## 🧪 Testing Your Mock Data

### Step 1: Create Mock Document
Generate your invoice/customs declaration with required fields.

### Step 2: Save as Image
Export as PNG or JPG (recommended: PNG for clarity).

### Step 3: Test via API

```bash
# Test with cURL
curl -X POST http://localhost:8000/api/verify \
  -F "file=@your-mock-invoice.png"
```

### Step 4: Analyze Results

The API returns:
```json
{
  "status": "VERIFIED | FLAGGED | REJECTED",
  "risk_score": 0-100,
  "risk_level": "LOW | MEDIUM | HIGH | CRITICAL",
  "anomalies": [...],
  "details": {
    "checks_performed": [...],
    "passed_checks": [...],
    "failed_checks": [...],
    "warnings": [...]
  },
  "recommendations": [...]
}
```

### Step 5: Iterate
- If risk_score < 70: Review failed_checks and anomalies
- Fix validation issues
- Add missing fields
- Improve document quality
- Retest

---

## 📊 Quick Reference Checklist

### ✅ To Pass Verification (Risk Score 70+)

**Must Have:**
- [ ] Invoice number (5+ chars, alphanumeric/-/)
- [ ] Document date (valid, not future, < 5 years old)
- [ ] Total amount (positive, reasonable)
- [ ] Currency (ZMW/USD/EUR/GBP)
- [ ] Company/Importer name
- [ ] TPIN (10 digits, numeric)

**For Customs Declarations:**
- [ ] HS codes (6-10 digits, numeric)

**Document Quality:**
- [ ] Clear, high-resolution image
- [ ] No rotated/skewed text
- [ ] Good contrast
- [ ] Readable fonts

**Avoid:**
- [ ] All-zero invoice numbers
- [ ] Future dates
- [ ] Dates older than 5 years
- [ ] Zero/negative amounts
- [ ] Invalid currencies
- [ ] TPINs with repeated digits
- [ ] HS codes outside 6-10 digit range
- [ ] Missing critical fields

---

## 🚀 Quick Start: Generate Valid Mock Data

### Minimal Valid Invoice

```json
{
  "invoice_number": "INV-2025-001",
  "document_date": "2025-10-12",
  "total_amount": 1234.56,
  "currency": "ZMW",
  "tpin": "1234567890",
  "importer_name": "Test Company Ltd"
}
```

**Expected Risk Score:** 75-85 (LOW risk, VERIFIED)

---

### Optimal Invoice with All Fields

```json
{
  "invoice_number": "ZRA-INV-2025-10-12-5678",
  "document_date": "2025-10-12",
  "total_amount": 45678.90,
  "currency": "ZMW",
  "tpin": "9876543210",
  "importer_name": "Premium Trading Limited",
  "supplier_name": "Manufacturing Corp",
  "phone": "+260 977 123456",
  "email": "info@premiumtrading.zm",
  "address": "Plot 123, Great East Road, Lusaka"
}
```

**Expected Risk Score:** 95-100 (LOW risk, VERIFIED)

---

## 📚 Additional Resources

### API Endpoints

- **Health Check:** `GET http://localhost:8000/health`
- **Verify Document:** `POST http://localhost:8000/api/verify`
- **Extract Data:** `POST http://localhost:8000/api/extract`
- **Interactive Docs:** http://localhost:8000/docs

### Test Files Location

- Sample invoices: `/home/kaps100/ZRA-Hackathon-TaxGuard-AI-GhostBuster/ocr-backend/test-invoice.png`
- Test documents: `/home/kaps100/ZRA-Hackathon-TaxGuard-AI-GhostBuster/ocr-backend/test-invoice.jpg`

### Documentation Files

- **Complete API Guide:** `COMPLETE_API_GUIDE.html`
- **API Testing Guide:** `README_API_TESTING.md`
- **Postman Collection:** `COMPLETE_API_COLLECTION.postman_collection.json`

---

## ⚙️ Advanced: Field Extraction Patterns

### Regex Patterns Used by Extractor

**Invoice Number:**
```regex
(?:invoice|inv|receipt|doc|document)\s*(?:no|number|#)?[\s:]*([A-Z0-9\-/]+)
```

**HS Code:**
```regex
(?:HS|H\.S\.|harmonized)\s*(?:code)?[\s:]*(\d{4,10})
```

**Date Formats Supported:**
- `DD/MM/YYYY` or `DD-MM-YYYY`
- `YYYY-MM-DD` (ISO format)
- `DD Month YYYY` (e.g., "15 Jan 2025")

**Amount:**
```regex
(?:ZMW|USD|EUR|GBP|ZK|K)?\s*(\d+(?:,\d{3})*(?:\.\d{2})?)
```

**TPIN:**
```regex
(?:TPIN|tax\s+id)[\s:]*(\d{10})
```

---

## 🎓 Summary

**To create mock data that passes verification:**

1. **Include all critical fields** (invoice number, date, amount, currency, TPIN, importer name)
2. **Follow validation rules** (correct formats, lengths, patterns)
3. **Use realistic values** (recent dates, reasonable amounts, proper TPINs)
4. **Avoid common pitfalls** (zeros, future dates, negative amounts)
5. **Create quality documents** (clear images, good fonts, high resolution)
6. **Test and iterate** (use API to verify, adjust based on feedback)

**Target Risk Score: 70+** for automatic verification.

---

**Document Version:** 1.0.0
**Last Updated:** 2025-10-12
**Status:** Complete

For questions or issues, refer to the API documentation at http://localhost:8000/docs
