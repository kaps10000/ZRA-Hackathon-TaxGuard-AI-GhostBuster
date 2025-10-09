# End-to-End Testing Checklist — TaxGuard Dashboard

**Date**: October 9, 2025  
**Tester**: [Your Name]  
**Test Environment**: Local development

## Pre-Test Setup ✅

- [x] API server running on http://localhost:4000
- [x] Frontend running on http://localhost:3000
- [x] Browser opened to frontend URL

---

## Test Flow 1: Ghost-Check (Mock Mode)

### Step 1.1: Enter Company ID
1. Open http://localhost:3000 in browser
2. Locate the "Ghost-Check" form
3. Enter company ID: `G-9001`
4. Click "Run Check" button

**Expected Result:**
- Loading state shows briefly ("Checking...")
- Alert result appears with:
  - Alert ID (e.g., `ALERT-12345`)
  - Ghost Score (e.g., `0.87`)
  - Issues list (e.g., "Suspicious registration", "No tax history")

**Status**: [ ] Pass [ ] Fail  
**Notes**: _____________________

### Step 1.2: Create Report from Alert
1. With alert visible, click "Create report" button

**Expected Result:**
- Button shows "Creating..." briefly
- Report modal appears showing:
  - Title: "Report Created"
  - Case ID (e.g., `R-67890`)
  - Proof Hash (long string)
  - Full report JSON (debug section)

**Status**: [ ] Pass [ ] Fail  
**Notes**: _____________________

---

## Test Flow 2: ReportModal Functionality

### Step 2.1: Copy Proof Hash
1. With modal open, click "Copy proof hash" button

**Expected Result:**
- "Copied!" message appears next to button
- Message disappears after ~2 seconds
- Proof hash is in clipboard (paste to verify)

**Status**: [ ] Pass [ ] Fail  
**Actual clipboard content**: _____________________

### Step 2.2: Close Modal (Mouse)
1. Click "Close" button

**Expected Result:**
- Modal closes
- Can see alert result again
- Report is added to "Session Reports" section below

**Status**: [ ] Pass [ ] Fail  
**Notes**: _____________________

### Step 2.3: Keyboard Navigation
1. Open report modal again (click "Open report" from inline report or create another)
2. Press Tab key several times

**Expected Result:**
- Focus cycles between "Copy proof hash" and "Close" buttons
- Focus stays within modal (doesn't escape to background)

**Status**: [ ] Pass [ ] Fail  
**Notes**: _____________________

### Step 2.4: Close Modal (Escape Key)
1. With modal open, press Escape key

**Expected Result:**
- Modal closes immediately
- Focus returns to previous element

**Status**: [ ] Pass [ ] Fail  
**Notes**: _____________________

---

## Test Flow 3: ReportHistory

### Step 3.1: View Session Reports
1. After creating 2-3 reports, scroll to "Session Reports" section

**Expected Result:**
- Lists all reports created in this session
- Each item shows:
  - Case ID
  - Truncated proof hash
  - Timestamp (formatted: "10/9/2025, 3:45:23 PM")
- Items are keyboard-focusable buttons

**Status**: [ ] Pass [ ] Fail  
**Number of reports visible**: _____________________

### Step 3.2: Open Report from History
1. Click any report in the history list

**Expected Result:**
- Report modal opens
- Shows the selected report's data
- Can copy proof hash from history item

**Status**: [ ] Pass [ ] Fail  
**Notes**: _____________________

### Step 3.3: Clear Reports (Confirmation)
1. Click "Clear" button in Session Reports header

**Expected Result:**
- Button changes to show "Yes, clear" and "Cancel"
- No reports deleted yet

**Status**: [ ] Pass [ ] Fail  
**Notes**: _____________________

### Step 3.4: Cancel Clear
1. Click "Cancel"

**Expected Result:**
- Buttons return to just "Clear"
- Reports still visible

**Status**: [ ] Pass [ ] Fail  
**Notes**: _____________________

### Step 3.5: Confirm Clear
1. Click "Clear" again
2. Click "Yes, clear"

**Expected Result:**
- All reports disappear
- Message: "No reports in this session."
- localStorage cleared (verify in DevTools: Application → Local Storage → `taxguard:reports` should be empty)

**Status**: [ ] Pass [ ] Fail  
**Notes**: _____________________

---

## Test Flow 4: Settings Panel

### Step 4.1: Open Settings
1. Locate and click the settings/gear icon (or Settings link)

**Expected Result:**
- Settings panel opens
- Shows:
  - "Use Mock APIs" checkbox (checked by default)
  - "Server: mock" status line
  - "Live API Base URL" input field
  - "GhostBuster runtime (mock/proxy)" section

**Status**: [ ] Pass [ ] Fail  
**Notes**: _____________________

### Step 4.2: Test API Base URL
1. In "Live API Base URL" field, value should show `http://localhost:4000`
2. Click "Test" button

**Expected Result:**
- Status changes to "Testing..."
- Then shows "OK: {status: ok, uptime: ...}"

**Status**: [ ] Pass [ ] Fail  
**Notes**: _____________________

### Step 4.3: Toggle Demo Mode
1. Uncheck "Use Mock APIs" checkbox

**Expected Result:**
- Live API Base URL should update to `/api`
- (App will now use relative URLs instead of mock)

**Status**: [ ] Pass [ ] Fail  
**Notes**: _____________________

### Step 4.4: Save Settings
1. Click "Save" button

**Expected Result:**
- Settings panel closes
- "Saved" confirmation appears briefly
- localStorage updated (check DevTools: `taxguard:demoMode` and `taxguard:apiBaseUrl`)

**Status**: [ ] Pass [ ] Fail  
**Notes**: _____________________

### Step 4.5: GhostBuster Runtime Config
1. Open Settings again
2. In "GhostBuster runtime" section, change mode from "mock" to "proxy"
3. Enter a proxy URL (e.g., `https://example.com/ghost-check`)
4. Click "Save ghost config" button

**Expected Result:**
- "Saved" message appears
- Server config updates (verify by refreshing settings — should show "Server: proxy — https://example.com/ghost-check")

**Status**: [ ] Pass [ ] Fail  
**Notes**: _____________________

---

## Test Flow 5: Persistence (Refresh)

### Step 5.1: Verify Settings Persistence
1. Refresh the browser page (F5)
2. Open Settings panel

**Expected Result:**
- Settings values are retained from before refresh
- Demo mode checkbox state is preserved
- API Base URL is preserved
- GhostBuster runtime config is preserved

**Status**: [ ] Pass [ ] Fail  
**Notes**: _____________________

### Step 5.2: Verify Report History Persistence
1. Create 1-2 new reports
2. Refresh the browser page
3. Check Session Reports section

**Expected Result:**
- Reports from before refresh are still visible
- New reports are also visible
- Total count matches expected

**Status**: [ ] Pass [ ] Fail  
**Notes**: _____________________

---

## Test Flow 6: Error Handling

### Step 6.1: Invalid Company ID
1. Enter an invalid company ID (e.g., `INVALID-ID`)
2. Click "Run Check"

**Expected Result:**
- Mock API should still return a result (mock doesn't validate)
- If using live mode, should show error message

**Status**: [ ] Pass [ ] Fail  
**Notes**: _____________________

### Step 6.2: Network Error (Simulated)
1. Stop the API server (close the API terminal window)
2. Try to run a Ghost-Check

**Expected Result:**
- Error message appears: "Error: Failed to check" or similar
- App doesn't crash
- Can still interact with UI

**Status**: [ ] Pass [ ] Fail  
**Notes**: _____________________

---

## Test Flow 7: Accessibility

### Step 7.1: Keyboard-Only Navigation
1. Restart both servers if needed
2. Use only Tab and Enter keys to:
   - Navigate to company ID input
   - Enter a value
   - Submit the form
   - Open the report modal
   - Copy proof hash
   - Close modal

**Expected Result:**
- All interactive elements are reachable via keyboard
- Visual focus indicator is visible
- Enter key activates buttons

**Status**: [ ] Pass [ ] Fail  
**Notes**: _____________________

### Step 7.2: Screen Reader Test (Optional)
1. Enable Windows Narrator (Win + Ctrl + Enter)
2. Navigate through the app

**Expected Result:**
- Form labels are announced
- Button purposes are clear
- Modal is announced as dialog
- Error messages are announced

**Status**: [ ] Pass [ ] Fail  
**Notes**: _____________________

---

## Summary

### Test Results
- **Total Tests**: 20
- **Passed**: _____ / 20
- **Failed**: _____ / 20
- **Skipped**: _____ / 20

### Critical Issues Found
1. _____________________
2. _____________________
3. _____________________

### Minor Issues Found
1. _____________________
2. _____________________
3. _____________________

### Overall Assessment
- [ ] Ready for integration (all critical flows work)
- [ ] Needs fixes before integration
- [ ] Blocked (cannot test further)

### Notes for Integration
_____________________
_____________________
_____________________

---

## Next Steps After Testing

1. **If all tests pass**: Mark your part as integration-ready ✅
2. **If issues found**: Document them and fix before integration
3. **Share results**: Send this checklist to your team to show your part is ready

---

**Completed by**: _____________________  
**Date**: _____________________  
**Signature**: _____________________
