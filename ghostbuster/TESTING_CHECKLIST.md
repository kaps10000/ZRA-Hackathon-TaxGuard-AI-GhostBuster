# GhostBuster Testing Checklist

Use this checklist to verify everything works before the hackathon demo.

---

## Pre-Testing Setup

- [ ] Python 3.8+ installed
- [ ] Node.js 16+ installed
- [ ] Backend dependencies installed (`pip install -r requirements.txt`)
- [ ] Frontend dependencies installed (`npm install`)
- [ ] Datasets generated (`python generate_datasets.py`)

---

## Backend Testing

### 1. Dataset Generation

```bash
cd backend
python generate_datasets.py
```

**Expected Output:**
- [x] "Generating master employee records..." appears
- [x] "✓ Generated 10000 master records"
- [x] "✓ Generated XXXXX NAPSA contribution records"
- [x] "✓ Generated 10000 Home Affairs registry records"
- [x] "✓ Generated XXXXX bank transaction records"
- [x] Files created in `data/` folder:
  - master_records.csv
  - napsa_contributions.csv
  - home_affairs_registry.csv
  - bank_transactions.csv

**Verify:**
- [ ] All 4 CSV files exist
- [ ] Files have data (not empty)
- [ ] master_records.csv has 10,000 rows

---

### 2. Backend Server

```bash
python app.py
```

**Expected Output:**
- [x] "Loading datasets..."
- [x] "✓ Datasets loaded successfully"
- [x] "GhostBuster API Server" banner
- [x] API endpoints list displayed
- [x] "Running on http://0.0.0.0:5000"

**Verify:**
- [ ] Server starts without errors
- [ ] Port 5000 is accessible

---

### 3. API Health Check

**Open browser:** http://localhost:5000/api/health

**Expected Response:**
```json
{
  "status": "healthy",
  "timestamp": "2025-01-19T...",
  "datasets_loaded": true
}
```

**Verify:**
- [ ] Response status: 200 OK
- [ ] "datasets_loaded": true

---

### 4. API Statistics

**Open browser:** http://localhost:5000/api/stats

**Expected Response:**
```json
{
  "total_employees": 10000,
  "total_napsa_records": 50000+,
  "total_nrc_records": 10000,
  "total_bank_transactions": 500000+,
  "ghost_distribution": {
    "LEGITIMATE": 7000,
    "DECEASED": 1000,
    "DUPLICATE": 800,
    "PHANTOM": 700,
    "OVER_AGE": 500
  }
}
```

**Verify:**
- [ ] All counts are positive numbers
- [ ] Ghost distribution adds up to 10,000

---

### 5. Individual Analysis API Test

**Using curl or Postman:**

```bash
curl -X POST http://localhost:5000/api/analyze/individual \
  -H "Content-Type: application/json" \
  -d '{"nrc": "123456/78/9"}'
```

**Expected Response:**
- [ ] Status: 200 OK
- [ ] JSON response with:
  - nrc
  - full_name
  - risk_level
  - risk_score
  - classification
  - evidence array
  - recommendations array

---

## Frontend Testing

### 1. Frontend Server

```bash
cd frontend
npm start
```

**Expected Output:**
- [x] Webpack compilation starts
- [x] "Compiled successfully!"
- [x] Browser opens automatically to http://localhost:3000
- [x] No errors in console

**Verify:**
- [ ] Server starts without errors
- [ ] Port 3000 is accessible
- [ ] Browser opens automatically

---

### 2. Dashboard Load

**Check browser at http://localhost:3000**

**Expected:**
- [ ] GhostBuster header visible
- [ ] "ZRA Ghost Employee Detection System" subtitle
- [ ] Four tabs visible:
  - Individual Analysis
  - Batch Analysis
  - Results
  - Statistics
- [ ] No errors in browser console (F12)

---

### 3. Individual Analysis Tab

**Navigate to Individual Analysis**

**Verify:**
- [ ] Form loads correctly
- [ ] Input fields visible:
  - NRC Number (required)
  - Full Name (optional)
  - Monthly Salary (optional)
  - Employment Start Date (optional)
- [ ] "Load Samples" button visible
- [ ] "Analyze Employee" button visible

---

### 4. Load Samples Feature

**Click "Load Samples" button**

**Expected:**
- [ ] Success message appears
- [ ] Sample cards appear below form
- [ ] 5 categories visible:
  - LEGITIMATE
  - DECEASED
  - DUPLICATE
  - PHANTOM
  - OVER_AGE
- [ ] Each category has 3 samples
- [ ] Each sample shows: name, NRC, salary

**Click any sample card:**
- [ ] Form auto-fills with sample data
- [ ] NRC field populated
- [ ] Full Name field populated
- [ ] Salary field populated

---

### 5. Individual Analysis - Test Cases

#### Test Case 1: Legitimate Employee

1. Load Samples
2. Click any LEGITIMATE sample
3. Click "Analyze Employee"

**Expected:**
- [ ] "Analyzing..." shows briefly
- [ ] Switches to Results tab
- [ ] Result card appears with:
  - Risk Level: LOW (green)
  - Classification: LEGITIMATE
  - Low risk score (< 40%)
- [ ] Expand accordion to see details
- [ ] Evidence section has few/no flags
- [ ] Financial impact shown

---

#### Test Case 2: Deceased Ghost

1. Load Samples
2. Click any DECEASED sample
3. Click "Analyze Employee"

**Expected:**
- [ ] Switches to Results tab
- [ ] Result card shows:
  - Risk Level: CRITICAL (red)
  - Classification: CONFIRMED_GHOST
  - High risk score (80%+)
- [ ] Expand accordion
- [ ] Evidence includes:
  - "Person is Deceased" - CRITICAL
  - Source: Home Affairs (Death Registry)
  - Evidence Strength: DEFINITIVE
- [ ] Bank analysis shows suspicious patterns
- [ ] Recommendations include "IMMEDIATE ACTION"

---

#### Test Case 3: Phantom Worker

1. Load Samples
2. Click any PHANTOM sample
3. Click "Analyze Employee"

**Expected:**
- [ ] Risk Level: HIGH or CRITICAL
- [ ] Evidence includes:
  - "No NAPSA Record" or "Low Contributions"
  - Severity: CRITICAL or HIGH
- [ ] Recommendations for verification

---

#### Test Case 4: Over-Age Employee

1. Load Samples
2. Click any OVER_AGE sample
3. Click "Analyze Employee"

**Expected:**
- [ ] Evidence includes:
  - "Over Retirement Age"
  - Age shown (66+)
  - Severity: HIGH
- [ ] Recommendations mention age verification

---

#### Test Case 5: Duplicate NRC

1. Load Samples
2. Click any DUPLICATE sample
3. Click "Analyze Employee"

**Expected:**
- [ ] Evidence includes:
  - "Duplicate NRC"
  - Multiple names listed
  - Severity: CRITICAL
  - Evidence Strength: DEFINITIVE

---

### 6. Batch Analysis Tab

**Navigate to Batch Analysis**

**Verify:**
- [ ] Upload area visible
- [ ] "Drag & drop" message
- [ ] "Download Template" button
- [ ] "Analyze Batch" button (disabled initially)

---

### 7. Template Download

**Click "Download Template"**

**Expected:**
- [ ] File downloads: `ghostbuster_template.csv`
- [ ] Open file - should contain:
  - Header row: nrc,full_name,salary,employment_start
  - 2 sample rows

---

### 8. Batch Upload

1. Download template
2. Drag template file into upload area

**Expected:**
- [ ] File appears in list
- [ ] File details shown (name, size, type)
- [ ] "Analyze Batch" button enabled

---

### 9. Batch Analysis

**Click "Analyze Batch"**

**Expected:**
- [ ] Progress bar appears
- [ ] "Analyzing employees..." message
- [ ] Switches to Results tab after completion
- [ ] Summary cards show:
  - Total Analyzed: 2 (from template)
  - Critical/High/Medium/Low counts
  - Confirmed ghosts count
- [ ] Individual results in accordions below

---

### 10. Results Tab

**After any analysis:**

**Verify:**
- [ ] Summary cards visible (if batch)
- [ ] Risk distribution chart (if batch)
- [ ] Export buttons:
  - Export CSV
  - Export Detailed JSON
- [ ] Individual result accordions
- [ ] Each accordion shows:
  - Name, NRC
  - Risk level chip (colored)
  - Classification chip
  - Risk score percentage

**Expand any accordion:**
- [ ] Employee Information card
- [ ] Financial Impact card
- [ ] Evidence list with icons
- [ ] Recommendations list

---

### 11. Export Functionality

#### CSV Export

1. Run any analysis
2. Go to Results tab
3. Click "Export CSV"

**Expected:**
- [ ] File downloads: `ghostbuster_results_YYYYMMDD_HHMMSS.csv`
- [ ] Open file - should contain:
  - Header row with all fields
  - Data rows for each analyzed employee
  - Readable format

---

#### JSON Export

1. Click "Export Detailed JSON"

**Expected:**
- [ ] File downloads: `ghostbuster_detailed_YYYYMMDD_HHMMSS.json`
- [ ] Open file - should contain:
  - Valid JSON format
  - Complete evidence details
  - All analysis data

---

### 12. Statistics Tab

**Navigate to Statistics tab**

**Verify:**
- [ ] Overview cards display:
  - Total Employees: 10,000
  - NAPSA Records: 50,000+
  - NRC Registry Records: 10,000
  - Bank Transactions: 500,000+
- [ ] Cards have gradient backgrounds
- [ ] Bar chart shows employee distribution
- [ ] Chart displays all ghost types
- [ ] About section visible

---

## Error Handling Tests

### 1. Invalid NRC

1. Individual Analysis
2. Enter: "invalid-nrc"
3. Click Analyze

**Expected:**
- [ ] Error message appears
- [ ] "Employee not found" or similar

---

### 2. Empty NRC

1. Leave NRC field empty
2. Click Analyze

**Expected:**
- [ ] Error: "NRC is required"

---

### 3. Backend Down

1. Stop backend server
2. Try to analyze employee

**Expected:**
- [ ] Error message: "Failed to analyze employee"
- [ ] No crash

---

### 4. Large Batch (Over Limit)

1. Create CSV with 1,001 NRCs
2. Upload and analyze

**Expected:**
- [ ] Error: "Maximum 1000 records per batch"

---

### 5. Invalid File Format

1. Upload a .txt file
2. Try to analyze

**Expected:**
- [ ] Error: "Unsupported file format"

---

## Performance Tests

### 1. Individual Analysis Speed

- [ ] Analysis completes in < 3 seconds
- [ ] UI remains responsive

---

### 2. Batch Analysis Speed (100 records)

- [ ] Completes in < 3 minutes
- [ ] Progress updates smoothly

---

### 3. Page Load Speed

- [ ] Initial load < 2 seconds
- [ ] Tab switching instantaneous
- [ ] No lag when typing

---

## Cross-Browser Testing

Test in multiple browsers:

**Chrome:**
- [ ] All features work
- [ ] UI displays correctly
- [ ] No console errors

**Firefox:**
- [ ] All features work
- [ ] UI displays correctly
- [ ] No console errors

**Edge:**
- [ ] All features work
- [ ] UI displays correctly
- [ ] No console errors

---

## Mobile Responsiveness (Optional)

**Resize browser to mobile size:**
- [ ] Layout adjusts
- [ ] Buttons remain clickable
- [ ] Forms usable
- [ ] Charts display

---

## Final Integration Test

**Complete workflow:**

1. [ ] Start backend server
2. [ ] Start frontend server
3. [ ] Load application
4. [ ] Navigate all tabs
5. [ ] Load samples
6. [ ] Analyze DECEASED case
7. [ ] Review evidence
8. [ ] Export CSV
9. [ ] Upload batch
10. [ ] Analyze batch
11. [ ] Export JSON
12. [ ] Check statistics
13. [ ] Everything works end-to-end

---

## Documentation Verification

- [ ] README.md exists and is complete
- [ ] INSTALLATION_GUIDE.md has step-by-step instructions
- [ ] USER_GUIDE.md explains all features
- [ ] PITCH.md ready for presentation
- [ ] DEMO_GUIDE.md has demo script
- [ ] All setup scripts (.bat files) work

---

## Pre-Demo Final Check (Day Before)

- [ ] Run all tests above
- [ ] Fix any issues found
- [ ] Practice demo flow
- [ ] Take screenshots (backup)
- [ ] Charge laptop
- [ ] Test HDMI connection (if presenting)
- [ ] Prepare answers to expected questions
- [ ] Get good sleep!

---

## During Demo Day

- [ ] Arrive early
- [ ] Test connection/setup
- [ ] Start backend 10 minutes before
- [ ] Start frontend 5 minutes before
- [ ] Load samples in advance
- [ ] Have DEMO_GUIDE.md open for reference
- [ ] Smile and be confident!

---

**You're Ready!**

If all checkboxes above are checked, GhostBuster is working perfectly.

Good luck with the hackathon!
