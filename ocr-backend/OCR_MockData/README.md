# OCR Mock Data Generator

This directory contains tools and guides for generating valid mock tax documents for the ZRA TaxGuard OCR AI Service.

---

## 📁 Contents

| File | Description |
|------|-------------|
| **MOCK_DATA_GENERATION_GUIDE.md** | Complete guide with all validation rules and requirements |
| **generate_mock_data.py** | Python script to generate mock invoices, customs declarations, and receipts |
| **sample_perfect_invoice.json** | Example of a perfect invoice (Risk Score: 95-100) |
| **sample_perfect_customs.json** | Example of a perfect customs declaration (Risk Score: 95-100) |

---

## 🚀 Quick Start

### Generate Mock Data

```bash
# Generate a perfect invoice (prints to stdout)
python3 generate_mock_data.py --type invoice --quality perfect --pretty

# Save to file
python3 generate_mock_data.py --type invoice --quality perfect --output my_invoice.json --pretty

# Generate customs declaration
python3 generate_mock_data.py --type customs --quality good --output customs.json

# Generate multiple documents
python3 generate_mock_data.py --type invoice --quality perfect --count 10 --output batch_invoices.json
```

### Quality Levels

| Quality | Risk Score Range | Status | Use Case |
|---------|-----------------|--------|----------|
| **perfect** | 95-100 (LOW) | ✅ VERIFIED | Testing successful verification |
| **good** | 70-85 (LOW-MEDIUM) | ✅ VERIFIED or ⚡ FLAGGED | Testing with minor issues |
| **flagged** | 50-69 (MEDIUM) | ⚡ FLAGGED | Testing review workflow |
| **rejected** | 0-29 (CRITICAL) | ⛔ REJECTED | Testing rejection workflow |

---

## 📝 Validation Rules Summary

### Critical Fields (Must Have)

✅ **Invoice Number** - 5+ characters, alphanumeric + `-` `/`
✅ **Document Date** - Valid date, not future, not >5 years old
✅ **Total Amount** - Positive, <10M, valid currency
✅ **Currency** - ZMW, USD, EUR, or GBP
✅ **Importer Name** - Company or individual name

### Important Fields (Should Have)

✅ **TPIN** - Exactly 10 digits, numeric, not repeated
✅ **HS Codes** - 6-10 digits, numeric only (for customs)

### Risk Score Target

**70+ points** for automatic verification ✅

---

## 🎯 Usage Examples

### Example 1: Perfect Invoice for Testing

```bash
python3 generate_mock_data.py --type invoice --quality perfect --output test_invoice.json --pretty
```

**Expected Output:**
```json
{
  "document_type": "invoice",
  "invoice_number": "INV-2025-10-12-5678",
  "document_date": "2025-10-12",
  "total_amount": 45678.90,
  "currency": "ZMW",
  "tpin": "1234567890",
  "importer_name": "Global Trading Ltd",
  ...
}
```

### Example 2: Customs Declaration

```bash
python3 generate_mock_data.py --type customs --quality perfect --output customs_test.json --pretty
```

**Expected Fields:**
- Multiple HS codes (6-10 digits each)
- Country of origin
- Port of entry
- Duty amounts

### Example 3: Batch Generation

```bash
# Generate 50 perfect invoices
python3 generate_mock_data.py --type invoice --quality perfect --count 50 --output batch_50.json

# Generate mixed quality documents
for quality in perfect good flagged rejected; do
  python3 generate_mock_data.py --type invoice --quality $quality --count 5 --output "batch_${quality}.json"
done
```

---

## 📊 Field Validation Reference

### Invoice Number
- **Format:** Alphanumeric + `-` `/`
- **Min Length:** 5 characters
- **Examples:** `INV-2025-001`, `TAX/123456`
- **Invalid:** `00000`, `INV1` (too short), `INV@123` (special chars)

### HS Code
- **Format:** 6-10 digits, numeric only
- **Examples:** `8517120000`, `851712`, `620342`
- **Invalid:** `12345` (too short), `ABC123` (letters)

### Date
- **Format:** ISO 8601 recommended (`YYYY-MM-DD`)
- **Valid Range:** 2020-10-12 to 2025-10-12 (today)
- **Invalid:** Future dates, dates >5 years old

### Amount
- **Range:** 0.01 to 10,000,000
- **Currency:** ZMW, USD, EUR, GBP
- **Tip:** Use realistic amounts with cents

### TPIN
- **Format:** Exactly 10 digits, numeric
- **Examples:** `1234567890`, `9876543210`
- **Invalid:** `123` (too short), `1111111111` (repeated)

---

## 🧪 Testing Workflow

### Step 1: Generate Mock Data
```bash
python3 generate_mock_data.py --type invoice --quality perfect --output test.json --pretty
```

### Step 2: Test with OCR API

**Option A: Using JSON data (requires creating an image)**
- Create a visual document from the JSON
- Save as PNG/JPG
- Upload to API

**Option B: Use existing sample files**
```bash
# View sample data
cat sample_perfect_invoice.json

# Create your own based on this template
```

### Step 3: Verify via API
```bash
curl -X POST http://localhost:8000/api/verify \
  -F "file=@your_document.png"
```

### Step 4: Check Results
- **Risk Score 70+** ✅ Document will be verified
- **Risk Score 50-69** ⚡ Document will be flagged
- **Risk Score <30** ⛔ Document will be rejected

---

## 📚 Additional Resources

### Full Documentation
See **MOCK_DATA_GENERATION_GUIDE.md** for:
- Complete validation rules
- Risk scoring formulas
- Anomaly detection details
- Document type specifications
- Visual document creation tips
- Advanced generation strategies

### API Documentation
- **Swagger UI:** http://localhost:8000/docs
- **Complete API Guide:** `/home/kaps100/ZRA-Hackathon-TaxGuard-AI-GhostBuster/COMPLETE_API_GUIDE.html`
- **API Testing Guide:** `/home/kaps100/ZRA-Hackathon-TaxGuard-AI-GhostBuster/README_API_TESTING.md`

---

## 🎓 Tips for Valid Mock Data

1. **Always include critical fields** (invoice number, date, amount, currency, importer name)
2. **Use realistic values** (recent dates, reasonable amounts)
3. **Follow format rules** (correct lengths, valid patterns)
4. **Avoid common mistakes** (all zeros, future dates, negative amounts)
5. **Test different quality levels** to understand the verification system

---

## 🆘 Common Issues

### Issue: Generated data gets rejected
**Solution:** Check that all critical fields are present and follow validation rules

### Issue: Risk score too low
**Solution:** Use `--quality perfect` and ensure all fields are valid

### Issue: Script won't run
**Solution:** Make sure Python 3 is installed: `python3 --version`

### Issue: Need different document types
**Solution:** Use `--type` flag with `invoice`, `customs`, or `receipt`

---

**Created:** 2025-10-12
**Version:** 1.0.0
**Status:** Ready for use

For detailed validation rules, see **MOCK_DATA_GENERATION_GUIDE.md**
