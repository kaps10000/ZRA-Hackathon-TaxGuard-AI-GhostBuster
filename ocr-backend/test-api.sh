#!/bin/bash

# =====================================================
# ZRA TaxGuard OCR - API Testing Script
# =====================================================
# Tests all security endpoints with mock data
# =====================================================

set -e

# Configuration
API_URL="${API_URL:-http://localhost:5000}"
OFFICER_ID="${OFFICER_ID:-OFFICER-001}"
AUTH_TOKEN="${AUTH_TOKEN:-test_token_12345}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Function to print section headers
print_header() {
    echo ""
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${BLUE}  $1${NC}"
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
}

# Function to make API request and pretty print response
api_request() {
    local method=$1
    local endpoint=$2
    local data=$3
    local description=$4

    echo -e "${CYAN}▶ ${description}${NC}"
    echo -e "${YELLOW}  ${method} ${endpoint}${NC}"

    if [ -n "$data" ]; then
        response=$(curl -s -X ${method} \
            "${API_URL}${endpoint}" \
            -H "Content-Type: application/json" \
            -H "Authorization: Bearer ${AUTH_TOKEN}" \
            -H "x-officer-id: ${OFFICER_ID}" \
            -d "${data}")
    else
        response=$(curl -s -X ${method} \
            "${API_URL}${endpoint}" \
            -H "Authorization: Bearer ${AUTH_TOKEN}" \
            -H "x-officer-id: ${OFFICER_ID}")
    fi

    # Pretty print JSON response
    echo "$response" | python3 -m json.tool 2>/dev/null || echo "$response"
    echo ""
}

# Start testing
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}  ZRA TaxGuard OCR - API Testing Suite${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "API URL: ${CYAN}${API_URL}${NC}"
echo -e "Officer ID: ${CYAN}${OFFICER_ID}${NC}"
echo -e "Auth Token: ${CYAN}${AUTH_TOKEN:0:20}...${NC}"
echo ""

# =====================================================
# Test 1: Health Check
# =====================================================
print_header "Test 1: Health Check"
api_request GET "/api/security/health" "" "Check if security service is operational"

# =====================================================
# Test 2: Dashboard Statistics
# =====================================================
print_header "Test 2: Dashboard Statistics"
api_request GET "/api/security/dashboard" "" "Get security overview dashboard"

# =====================================================
# Test 3: Get Security Report (SECURE Document)
# =====================================================
print_header "Test 3: Security Report - SECURE Document"
api_request GET "/api/security/report/TEST-DOC-001" "" "Get detailed security report for TEST-DOC-001 (98.5 score)"

# =====================================================
# Test 4: Get Security Report (SUSPICIOUS Document)
# =====================================================
print_header "Test 4: Security Report - SUSPICIOUS Document"
api_request GET "/api/security/report/TEST-DOC-005" "" "Get security report for TEST-DOC-005 (55 score, flagged)"

# =====================================================
# Test 5: Get Security Report (COMPROMISED Document)
# =====================================================
print_header "Test 5: Security Report - COMPROMISED Document"
api_request GET "/api/security/report/TEST-DOC-007" "" "Get security report for TEST-DOC-007 (25 score, rejected)"

# =====================================================
# Test 6: List All Anomalies
# =====================================================
print_header "Test 6: List All Anomalies"
api_request GET "/api/security/anomalies?limit=20" "" "List all detected anomalies (paginated)"

# =====================================================
# Test 7: Filter Anomalies by Severity
# =====================================================
print_header "Test 7: Filter Anomalies - HIGH Severity"
api_request GET "/api/security/anomalies?severity=HIGH" "" "List only HIGH severity anomalies"

# =====================================================
# Test 8: Filter Anomalies - Unresolved Only
# =====================================================
print_header "Test 8: Filter Anomalies - Unresolved"
api_request GET "/api/security/anomalies?status=unresolved" "" "List only unresolved anomalies"

# =====================================================
# Test 9: Get Audit Log for Document
# =====================================================
print_header "Test 9: Audit Log for TEST-DOC-001"
api_request GET "/api/security/audit-log/TEST-DOC-001" "" "Get complete audit trail for TEST-DOC-001"

# =====================================================
# Test 10: Get Flagged Documents
# =====================================================
print_header "Test 10: List Flagged Documents"
api_request GET "/api/security/flagged" "" "Get all flagged documents"

# =====================================================
# Test 11: Get Statistics
# =====================================================
print_header "Test 11: Comprehensive Statistics"
api_request GET "/api/security/statistics" "" "Get detailed security statistics"

# =====================================================
# Test 12: Verify Document (APPROVE)
# =====================================================
print_header "Test 12: Officer Verification - APPROVE"
api_request POST "/api/security/verify/TEST-DOC-006" \
    '{"action": "APPROVE", "notes": "Manual verification completed. All features verified."}' \
    "Approve TEST-DOC-006"

# =====================================================
# Test 13: Flag Document
# =====================================================
print_header "Test 13: Flag Document for Review"
api_request POST "/api/security/flag/TEST-DOC-008" \
    '{"reason": "Document requires additional review due to missing watermark feature.", "severity": "MEDIUM"}' \
    "Flag TEST-DOC-008 for review"

# =====================================================
# Test 14: Resolve Anomaly (First unresolved anomaly)
# =====================================================
print_header "Test 14: Resolve Anomaly"
api_request POST "/api/security/resolve-anomaly/1" \
    '{"resolution": "RESOLVED", "notes": "Verified with document issuer. Future date was intentional for validity period."}' \
    "Resolve anomaly ID 1"

# =====================================================
# Test 15: Verify Document (REJECT)
# =====================================================
print_header "Test 15: Officer Verification - REJECT"
api_request POST "/api/security/verify/TEST-DOC-009" \
    '{"action": "REJECT", "notes": "QR code content could not be verified with issuing authority."}' \
    "Reject TEST-DOC-009"

# =====================================================
# Test 16: Request Review
# =====================================================
print_header "Test 16: Request Additional Review"
api_request POST "/api/security/verify/TEST-DOC-010" \
    '{"action": "REQUEST_REVIEW", "notes": "Watermark detected but confidence is borderline. Requesting senior officer review."}' \
    "Request review for TEST-DOC-010"

# =====================================================
# Test 17: Get Certificate (Blockchain)
# =====================================================
print_header "Test 17: Get Verification Certificate"
api_request GET "/api/security/certificate/TEST-DOC-001" "" "Generate verification certificate for TEST-DOC-001"

# =====================================================
# Test 18: Invalid Document ID (Error Handling)
# =====================================================
print_header "Test 18: Error Handling - Invalid Document ID"
api_request GET "/api/security/report/INVALID-DOC-999" "" "Test 404 error for non-existent document"

# =====================================================
# Test 19: Invalid Action (Error Handling)
# =====================================================
print_header "Test 19: Error Handling - Invalid Action"
api_request POST "/api/security/verify/TEST-DOC-001" \
    '{"action": "INVALID_ACTION", "notes": "Test"}' \
    "Test validation error for invalid action"

# =====================================================
# Test 20: Dashboard After Changes
# =====================================================
print_header "Test 20: Dashboard After Updates"
api_request GET "/api/security/dashboard" "" "Get updated dashboard statistics after verification actions"

# =====================================================
# Summary
# =====================================================
echo ""
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}  ✅ API Testing Complete!${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "Tests executed: ${CYAN}20${NC}"
echo -e "Endpoints tested: ${CYAN}12${NC}"
echo ""
echo -e "${YELLOW}Next Steps:${NC}"
echo "  1. Review the API responses above"
echo "  2. Check database for updated records"
echo "  3. Verify audit log entries were created"
echo "  4. Test with real document uploads"
echo ""
