# GhostBuster User Guide

## Table of Contents
1. [Overview](#overview)
2. [Getting Started](#getting-started)
3. [Individual Analysis](#individual-analysis)
4. [Batch Analysis](#batch-analysis)
5. [Understanding Results](#understanding-results)
6. [Detection Capabilities](#detection-capabilities)
7. [Export Options](#export-options)

---

## Overview

GhostBuster is an intelligent system that detects ghost employees in the Zambian government by analyzing multiple data sources:

- **NAPSA Database**: Pension contribution records
- **Home Affairs**: Death registry and NRC verification
- **Bank Transactions**: Withdrawal patterns from 10+ Zambian banks

### What is a Ghost Employee?

A ghost employee is a fraudulent entry on the payroll who:
- Doesn't actually work but receives salary
- Is deceased but still getting paid
- Uses fake/duplicate identity
- Is over retirement age
- Has suspicious financial patterns

---

## Getting Started

### Launch the Application

1. Start the backend server:
   ```
   start_backend.bat
   ```
   Wait for "Running on http://0.0.0.0:5000"

2. Start the frontend (in a new terminal):
   ```
   start_frontend.bat
   ```
   The app will open at http://localhost:3000

### Dashboard Overview

The application has 4 main sections:

1. **Individual Analysis** - Check one employee at a time
2. **Batch Analysis** - Upload CSV/Excel with multiple employees
3. **Results** - View analysis results with detailed evidence
4. **Statistics** - System overview and dataset statistics

---

## Individual Analysis

### How to Analyze a Single Employee

1. Click the "Individual Analysis" tab

2. Enter the employee's **NRC** (National Registration Card number)
   - Format: `123456/78/9`
   - This is the only required field

3. Optional fields (auto-filled from database if available):
   - Full Name
   - Monthly Salary
   - Employment Start Date

4. Click "Analyze Employee"

### Using Sample Data

1. Click "Load Samples" button
2. Browse different employee types:
   - LEGITIMATE - Normal employees
   - DECEASED - Dead but still receiving salary
   - DUPLICATE - Same NRC used by multiple people
   - PHANTOM - No/low NAPSA contributions
   - OVER_AGE - Above retirement age

3. Click any sample card to auto-fill the form

---

## Batch Analysis

### Analyzing Multiple Employees

1. Click the "Batch Analysis" tab

2. **Option A: Download Template**
   - Click "Download Template"
   - Open the CSV file
   - Add employee NRCs
   - Save the file

3. **Option B: Use Existing File**
   - Prepare a CSV or Excel file with these columns:
     - `nrc` (required) - Employee NRC
     - `full_name` (optional)
     - `salary` (optional)
     - `employment_start` (optional)

4. **Upload File**
   - Drag & drop the file into the upload area
   - Or click to browse and select

5. Click "Analyze Batch"

### Batch Limits

- Maximum: 1,000 employees per batch
- Supported formats: CSV, XLS, XLSX
- Processing time: ~1-2 seconds per employee

---

## Understanding Results

### Risk Levels

Results are categorized by risk:

- **CRITICAL** 🔴 - Immediate action required
- **HIGH** 🟠 - High priority investigation
- **MEDIUM** 🟡 - Needs verification
- **LOW** 🟢 - Low risk, routine check

### Classification Types

- **CONFIRMED_GHOST** - Definitive evidence (95%+ confidence)
- **LIKELY_GHOST** - Strong evidence (85%+ confidence)
- **SUSPICIOUS** - Some red flags (65%+ confidence)
- **NEEDS_REVIEW** - Minor concerns (50%+ confidence)
- **LEGITIMATE** - No issues detected

### Evidence Details

Each flag includes:

1. **Source**: Where the evidence comes from
   - NAPSA Database
   - Home Affairs (Death Registry)
   - Bank Transaction Analysis
   - Age Verification
   - Duplicate NRC Check

2. **Severity**: How serious the finding is
   - CRITICAL
   - HIGH
   - MEDIUM
   - LOW

3. **Evidence Strength**:
   - **DEFINITIVE** - Irrefutable proof (e.g., death certificate)
   - **STRONG** - Very reliable evidence
   - **MODERATE** - Reasonable suspicion
   - **WEAK** - Minor indicator

4. **Details**: Explanation of the finding

---

## Detection Capabilities

### 1. Death Registry Check

**What it does:**
- Checks if employee is deceased in Home Affairs registry

**Red Flags:**
- Status: DECEASED
- Still receiving salary after death date

**Evidence Strength:** DEFINITIVE

**Example:**
```
Finding: Person is Deceased
Details: CRITICAL: This person died on 2021-06-15 but is still
receiving salary. This is a ghost worker.
```

---

### 2. NAPSA Contribution Analysis

**What it does:**
- Verifies pension contributions
- Checks regularity and frequency

**Red Flags:**
- NO_NAPSA_RECORD - Zero contributions
- LOW_CONTRIBUTIONS - Fewer than 12 contributions
- INSUFFICIENT_CONTRIBUTIONS - Below 50% of expected

**Evidence Strength:** STRONG (no contributions) / MODERATE (low contributions)

**Example:**
```
Finding: No NAPSA Record
Details: Found 0 NAPSA contributions. Expected: 70+.
Legitimate workers MUST have regular monthly contributions.
```

---

### 3. Bank Withdrawal Pattern Analysis

**What it does:**
- Analyzes withdrawal behavior across all banks
- Detects suspicious patterns

**Red Flags:**

#### a) Exact Salary Withdrawals
- Withdrawing exactly the salary amount (±2%)
- Example: Salary = K10,000, Withdrawal = K10,000.00
- **Legitimate workers**: 0-2 exact withdrawals
- **Ghost workers**: 10+ exact withdrawals

#### b) Immediate Withdrawals
- Withdrawing within 3 days of month start
- Salary deposited on day 1, withdrawn on day 2-3
- Pattern repeats every month

#### c) Shell Company Transfers
- Transfers to suspicious companies:
  - ABC Trading Ltd
  - Universal Services
  - Crown Investments
  - Eagle Enterprises
  - etc.

#### d) Low Balance Pattern
- Average balance after withdrawal < K100
- Account completely drained every month

**Evidence Strength:** STRONG

**Example:**
```
Finding: Exact Salary Withdrawals
Details: Found 36 withdrawals of exactly K10,000.00 (the exact
salary amount). Legitimate workers typically withdraw varying amounts.

Finding: Shell Company Transfers
Details: Found 28 transfers to companies: ABC Trading Ltd,
Universal Services, Crown Investments. These may be shell
companies used to launder ghost worker salaries.
```

---

### 4. Age Verification

**What it does:**
- Calculates age from date of birth
- Flags employees over retirement age

**Red Flags:**
- OVER_RETIREMENT_AGE - Above 65 years old

**Evidence Strength:** STRONG

**Example:**
```
Finding: Over Retirement Age
Details: Employee is 68 years old, which is above the retirement
age of 65. Should not be receiving salary.
```

---

### 5. Duplicate NRC Detection

**What it does:**
- Searches all datasets for same NRC
- Identifies identity theft

**Red Flags:**
- DUPLICATE_NRC - Same NRC, different names

**Evidence Strength:** DEFINITIVE

**Example:**
```
Finding: Duplicate NRC
Details: This NRC is registered to multiple names: John Banda,
Mary Phiri. This indicates identity theft or fraud.
```

---

## Risk Scoring

The system calculates a risk score (0-100%) based on:

1. **Evidence Severity**
   - CRITICAL findings: 40% weight
   - HIGH findings: 25% weight
   - MEDIUM findings: 15% weight
   - LOW findings: 5% weight

2. **Evidence Strength**
   - DEFINITIVE: 100% multiplier
   - STRONG: 80% multiplier
   - MODERATE: 50% multiplier
   - WEAK: 30% multiplier

3. **Number of Findings**
   - Multiple red flags increase score

### Score Interpretation

- **80-100%**: CRITICAL - Confirmed ghost
- **60-79%**: HIGH - Likely ghost
- **40-59%**: MEDIUM - Suspicious activity
- **0-39%**: LOW - Minimal concerns

---

## Recommendations

Based on the classification, the system provides action items:

### CONFIRMED_GHOST
- ⚠️ IMMEDIATE ACTION REQUIRED: Suspend salary payments immediately
- Escalate to fraud investigation unit
- Recover all payments made after death date (if deceased)
- Verify with family and notify pension office

### LIKELY_GHOST
- HIGH PRIORITY: Initiate verification process
- Require in-person verification with biometric confirmation
- Freeze salary payments pending verification

### SUSPICIOUS
- MEDIUM PRIORITY: Schedule verification within 30 days
- Request updated documentation (NRC, proof of life)
- Monitor bank transactions closely

### NEEDS_REVIEW
- Schedule routine verification
- Update employee records

---

## Export Options

### Export CSV

**Best for:**
- Quick overview
- Excel analysis
- Management reports

**Includes:**
- NRC, Name, Age, Salary
- Risk Level, Risk Score
- Classification, Confidence
- Red Flags (comma-separated)
- Evidence Count
- Recommendations
- Total Amount Paid

**How to:**
1. View results
2. Click "Export CSV"
3. File downloads automatically

---

### Export Detailed JSON

**Best for:**
- Complete evidence trail
- Technical analysis
- Archival purposes

**Includes:**
- Full employee details
- All evidence with sources
- Cross-reference results
- Bank analysis details
- Financial impact breakdown
- Complete recommendations

**How to:**
1. View results
2. Click "Export Detailed JSON"
3. File downloads automatically

---

## Real-World Example

### Case Study: Robert Mbewe

**Input:**
- NRC: 654321/75/8
- Name: Robert Mbewe
- Salary: K10,000
- Employment: 2018-present

**Analysis Results:**

**Risk Level:** CRITICAL (95% risk score)
**Classification:** CONFIRMED_GHOST (98% confidence)

**Evidence:**

1. **Home Affairs - CRITICAL**
   - Finding: Person is Deceased
   - Death Date: 2021-06-15
   - Evidence: DEFINITIVE
   - Details: Died 3+ years ago but still receiving salary

2. **NAPSA - MEDIUM**
   - Finding: Low Contributions
   - Count: 8 contributions (expected 70+)
   - Evidence: MODERATE

3. **Bank Analysis - CRITICAL**
   - Exact Salary Withdrawals: 36 times
   - Immediate Withdrawals: 32 times
   - Shell Transfers: 28 times (to ABC Trading Ltd, etc.)
   - Average Balance: K15
   - Evidence: STRONG

**Financial Impact:**
- Monthly Salary: K10,000
- Months Employed: 84
- Total Paid: K840,000
- **Lost to Fraud: K840,000** (entire amount)

**Recommendations:**
1. IMMEDIATE ACTION: Suspend payments
2. Escalate to fraud investigation
3. Recover K840,000 in fraudulent payments
4. Prosecute perpetrators

---

## Best Practices

### For Individual Analysis

1. Always start with NRC (required field)
2. Use "Load Samples" to test the system first
3. Review all evidence before making decisions
4. Export detailed results for records

### For Batch Analysis

1. Start with small batches (100-500) to test
2. Use the provided template
3. Ensure NRC format is correct
4. Review summary statistics before diving into individual results

### For Investigations

1. **CRITICAL cases**: Act immediately
2. **HIGH cases**: Prioritize for investigation
3. **MEDIUM cases**: Schedule verification
4. **LOW cases**: Routine audit

### Data Security

1. Export and store results securely
2. Limit access to authorized personnel
3. Follow data protection regulations
4. Maintain audit trail

---

## FAQ

**Q: How long does analysis take?**
A: Individual: 1-2 seconds | Batch: 1-2 seconds per employee

**Q: Can I analyze the same employee multiple times?**
A: Yes, results are generated fresh each time

**Q: What if an employee is not in the database?**
A: You'll see an error. Provide optional fields (name, salary, date) to continue

**Q: How accurate is the system?**
A: Death registry checks are 100% accurate (DEFINITIVE evidence). Pattern analysis is highly reliable (STRONG evidence).

**Q: Can I customize the detection rules?**
A: Yes, edit `backend/detection_engine.py` to adjust thresholds

**Q: How do I report a false positive?**
A: Review the evidence carefully. False positives are rare but can occur with legitimate unusual patterns.

---

## Support

For technical support or questions:
- Review this guide
- Check INSTALLATION_GUIDE.md
- Review the code documentation in the backend

---

**GhostBuster v1.0**
Built for Zambia Revenue Authority (ZRA)
© 2025 ZRA Hackathon Project
