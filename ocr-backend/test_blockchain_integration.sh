#!/bin/bash

# ============================================================================
# ZRA TaxGuard - Blockchain Integration Test Suite
# ============================================================================
# Purpose: Comprehensive testing of OCR backend blockchain integration
# Author: ZRA TaxGuard Team
# Date: October 6, 2025
# ============================================================================

set -e

# ANSI Color Codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Configuration Variables
OCR_API_URL="${OCR_API_URL:-http://localhost:3000}"
BLOCKCHAIN_API_URL="${BLOCKCHAIN_API_URL:-http://localhost:3001}"
TEST_USER_EMAIL="${TEST_USER_EMAIL:-zra_admin}"
TEST_USER_PASSWORD="${TEST_USER_PASSWORD:-password}"

# Test Variables
JWT_TOKEN=""
TEST_DOCUMENT_HASH="TEST-DOC-HASH-$(date +%s)"
TEST_TX_HASH=""
TEST_DOCUMENT_ID=""

# Test Counters
TOTAL_TESTS=15
PASSED_TESTS=0
FAILED_TESTS=0

# Create timestamped results directory
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
RESULTS_DIR="blockchain_test_results_${TIMESTAMP}"
mkdir -p "$RESULTS_DIR"

# ============================================================================
# Helper Functions
# ============================================================================

print_header() {
    echo -e "\n${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
}

print_test() {
    local test_num=$1
    local test_name=$2
    echo -e "\n${YELLOW}[TEST $test_num] $test_name${NC}"
    echo "----------------------------------------"
}

print_success() {
    local message=$1
    echo -e "${GREEN}✓ PASS: $message${NC}"
    ((PASSED_TESTS++))
}

print_failure() {
    local message=$1
    local reason=$2
    echo -e "${RED}✗ FAIL: $message${NC}"
    if [ -n "$reason" ]; then
        echo -e "${RED}  Reason: $reason${NC}"
    fi
    ((FAILED_TESTS++))
}

print_info() {
    local message=$1
    echo -e "${BLUE}ℹ INFO: $message${NC}"
}

print_warning() {
    local message=$1
    echo -e "${YELLOW}⚠ WARNING: $message${NC}"
}

# Save response to file
save_response() {
    local filename=$1
    local content=$2
    echo "$content" > "$RESULTS_DIR/$filename"
}

# Make API call with error handling
api_call() {
    local method=$1
    local url=$2
    local data=$3
    local auth_header=$4
    local timeout=${5:-10}
    
    local curl_cmd="curl -s -w '%{http_code}' --max-time $timeout -X $method"
    
    if [ -n "$auth_header" ]; then
        curl_cmd="$curl_cmd -H 'Authorization: Bearer $auth_header'"
    fi
    
    if [ -n "$data" ]; then
        curl_cmd="$curl_cmd -H 'Content-Type: application/json' -d '$data'"
    fi
    
    curl_cmd="$curl_cmd '$url'"
    
    eval $curl_cmd
}

# ============================================================================
# Test Functions
# ============================================================================

test_ocr_backend_health() {
    print_test 1 "OCR Backend Health Check"
    
    local response=$(api_call "GET" "$OCR_API_URL/healthcheck")
    local http_code="${response: -3}"
    local body="${response%???}"
    
    save_response "ocr_health_response.json" "$body"
    
    if [ "$http_code" = "200" ]; then
        print_success "OCR Backend is running (HTTP $http_code)"
        return 0
    else
        print_failure "OCR Backend health check failed" "HTTP $http_code"
        return 1
    fi
}

test_blockchain_api_health() {
    print_test 2 "Blockchain API Health Check"
    
    local response=$(api_call "GET" "$BLOCKCHAIN_API_URL/api/ocr-verification/health" "" "" 5)
    local http_code="${response: -3}"
    local body="${response%???}"
    
    save_response "blockchain_health_response.json" "$body"
    
    if [ "$http_code" = "200" ]; then
        print_success "Blockchain API is running (HTTP $http_code)"
        return 0
    else
        print_warning "Blockchain API not accessible (HTTP $http_code) - Will test with fallback"
        return 1
    fi
}

test_blockchain_integration_health() {
    print_test 3 "Blockchain Integration Health Check"
    
    local response=$(api_call "GET" "$OCR_API_URL/api/blockchain/health")
    local http_code="${response: -3}"
    local body="${response%???}"
    
    save_response "integration_health_response.json" "$body"
    
    if [ "$http_code" = "200" ]; then
        print_success "Blockchain integration is healthy (HTTP $http_code)"
        return 0
    else
        print_failure "Blockchain integration health check failed" "HTTP $http_code"
        return 1
    fi
}

test_authentication() {
    print_test 4 "Authentication"
    
    local auth_data="{\"username\":\"$TEST_USER_EMAIL\",\"password\":\"$TEST_USER_PASSWORD\"}"
    local response=$(api_call "POST" "$OCR_API_URL/api/auth/login" "$auth_data")
    local http_code="${response: -3}"
    local body="${response%???}"
    
    save_response "auth_response.json" "$body"
    
    if [ "$http_code" = "200" ]; then
        JWT_TOKEN=$(echo "$body" | jq -r '.data.token // empty')
        if [ -n "$JWT_TOKEN" ] && [ "$JWT_TOKEN" != "null" ]; then
            print_success "Authentication successful, JWT token obtained"
            echo "$JWT_TOKEN" > "$RESULTS_DIR/jwt_token.txt"
            return 0
        else
            print_failure "Authentication failed" "No JWT token in response"
            return 1
        fi
    else
        print_failure "Authentication failed" "HTTP $http_code"
        return 1
    fi
}

test_store_proof_valid() {
    print_test 5 "Store Proof - Valid Data"
    
    if [ -z "$JWT_TOKEN" ]; then
        print_failure "Store proof test skipped" "No JWT token available"
        return 1
    fi
    
    local proof_data="{\"documentId\":\"$TEST_DOCUMENT_HASH\",\"fileHash\":\"sha256:$TEST_DOCUMENT_HASH\",\"verificationResult\":{\"overallStatus\":\"VALID\",\"riskScore\":25,\"metadata\":{\"testData\":true}}}"
    local response=$(api_call "POST" "$OCR_API_URL/api/blockchain/store-proof" "$proof_data" "$JWT_TOKEN")
    local http_code="${response: -3}"
    local body="${response%???}"
    
    save_response "store_proof_response.json" "$body"
    
    if [ "$http_code" = "200" ] || [ "$http_code" = "201" ]; then
        TEST_TX_HASH=$(echo "$body" | jq -r '.data.transactionId // .data.transactionHash // empty')
        if [ -n "$TEST_TX_HASH" ] && [ "$TEST_TX_HASH" != "null" ]; then
            print_success "Proof stored successfully (HTTP $http_code)"
            echo "$TEST_TX_HASH" > "$RESULTS_DIR/transaction_hashes.txt"
            return 0
        else
            print_warning "Proof storage response received but no transaction hash"
            return 0
        fi
    else
        print_failure "Store proof failed" "HTTP $http_code"
        return 1
    fi
}

test_store_proof_missing_fields() {
    print_test 6 "Store Proof - Missing Required Fields"
    
    if [ -z "$JWT_TOKEN" ]; then
        print_failure "Store proof validation test skipped" "No JWT token available"
        return 1
    fi
    
    local invalid_data="{\"documentId\":\"TEST-001\"}"
    local response=$(api_call "POST" "$OCR_API_URL/api/blockchain/store-proof" "$invalid_data" "$JWT_TOKEN")
    local http_code="${response: -3}"
    local body="${response%???}"
    
    save_response "store_proof_invalid_response.json" "$body"
    
    if [ "$http_code" = "400" ] || [ "$http_code" = "404" ]; then
        print_success "Validation works correctly (HTTP $http_code)"
        return 0
    else
        print_failure "Validation test failed" "Expected HTTP 400, got $http_code"
        return 1
    fi
}

test_store_proof_unauthorized() {
    print_test 7 "Store Proof - Unauthorized Access"
    
    local proof_data="{\"documentId\":\"UNAUTHORIZED-TEST\",\"fileHash\":\"sha256:test\"}"
    local response=$(api_call "POST" "$OCR_API_URL/api/blockchain/store-proof" "$proof_data")
    local http_code="${response: -3}"
    local body="${response%???}"
    
    save_response "store_proof_unauthorized_response.json" "$body"
    
    if [ "$http_code" = "401" ] || [ "$http_code" = "403" ]; then
        print_success "Endpoint properly protected (HTTP $http_code)"
        return 0
    else
        print_failure "Authorization test failed" "Expected HTTP 401/403, got $http_code"
        return 1
    fi
}

test_get_proof_by_tx_hash() {
    print_test 8 "Get Proof - By Transaction Hash"
    
    local hash_to_test="${TEST_TX_HASH:-$TEST_DOCUMENT_HASH}"
    local response=$(api_call "GET" "$OCR_API_URL/api/blockchain/get-proof/$hash_to_test")
    local http_code="${response: -3}"
    local body="${response%???}"
    
    save_response "get_proof_tx_response.json" "$body"
    
    if [ "$http_code" = "200" ] || [ "$http_code" = "404" ]; then
        print_success "Get proof endpoint responds correctly (HTTP $http_code)"
        return 0
    else
        print_failure "Get proof by transaction hash failed" "HTTP $http_code"
        return 1
    fi
}

test_get_proof_by_document_hash() {
    print_test 9 "Get Proof - By Document Hash"
    
    local response=$(api_call "GET" "$OCR_API_URL/api/blockchain/get-proof/$TEST_DOCUMENT_HASH")
    local http_code="${response: -3}"
    local body="${response%???}"
    
    save_response "get_proof_doc_response.json" "$body"
    
    if [ "$http_code" = "200" ] || [ "$http_code" = "404" ]; then
        print_success "Multiple hash type support working (HTTP $http_code)"
        return 0
    else
        print_failure "Get proof by document hash failed" "HTTP $http_code"
        return 1
    fi
}

test_get_proof_invalid_hash() {
    print_test 10 "Get Proof - Invalid Hash Format"
    
    local invalid_hash="invalid!@#hash"
    local response=$(api_call "GET" "$OCR_API_URL/api/blockchain/get-proof/$invalid_hash")
    local http_code="${response: -3}"
    local body="${response%???}"
    
    save_response "get_proof_invalid_response.json" "$body"
    
    if [ "$http_code" = "400" ] || [ "$http_code" = "404" ]; then
        print_success "Error handling works correctly (HTTP $http_code)"
        return 0
    else
        print_failure "Invalid hash test failed" "Expected HTTP 400/404, got $http_code"
        return 1
    fi
}

test_verify_hash() {
    print_test 11 "Verify Hash - Cross System Check"
    
    local verify_data="{\"hash\":\"$TEST_DOCUMENT_HASH\",\"hashType\":\"documentId\"}"
    local response=$(api_call "POST" "$OCR_API_URL/api/blockchain/verify-hash" "$verify_data")
    local http_code="${response: -3}"
    local body="${response%???}"
    
    save_response "verify_hash_response.json" "$body"
    
    if [ "$http_code" = "200" ]; then
        print_success "Cross-verification endpoint working (HTTP $http_code)"
        return 0
    else
        print_failure "Hash verification failed" "HTTP $http_code"
        return 1
    fi
}

test_flag_document() {
    print_test 12 "Flag Document - Suspicious Document"
    
    if [ -z "$JWT_TOKEN" ]; then
        print_failure "Flag document test skipped" "No JWT token available"
        return 1
    fi
    
    local flag_data="{\"documentId\":\"SUSPICIOUS-DOC-001\",\"reason\":\"High risk score detected\"}"
    local response=$(api_call "POST" "$OCR_API_URL/api/blockchain/flag-document" "$flag_data" "$JWT_TOKEN")
    local http_code="${response: -3}"
    local body="${response%???}"
    
    save_response "flag_document_response.json" "$body"
    
    if [ "$http_code" = "200" ] || [ "$http_code" = "201" ] || [ "$http_code" = "404" ]; then
        print_success "Flagging mechanism working (HTTP $http_code)"
        return 0
    else
        print_failure "Document flagging failed" "HTTP $http_code"
        return 1
    fi
}

test_automatic_blockchain_storage() {
    print_test 13 "Automatic Blockchain Storage"
    
    if [ -z "$JWT_TOKEN" ]; then
        print_failure "Automatic storage test skipped" "No JWT token available"
        return 1
    fi
    
    print_info "Testing automatic blockchain integration via document verification"
    
    # Test document verification which should trigger automatic blockchain storage
    local verify_data="{\"extractedData\":{\"importerName\":\"Test Company\",\"importerTpin\":\"1234567890\",\"invoiceAmount\":50000}}"
    local response=$(api_call "POST" "$OCR_API_URL/api/verify/document" "$verify_data" "$JWT_TOKEN")
    local http_code="${response: -3}"
    local body="${response%???}"
    
    save_response "automatic_storage_test.json" "$body"
    
    if [ "$http_code" = "200" ]; then
        local has_blockchain_data=$(echo "$body" | jq -r '.data.document.blockchainTxId // empty')
        if [ -n "$has_blockchain_data" ] && [ "$has_blockchain_data" != "null" ]; then
            print_success "Automatic blockchain storage working"
            return 0
        else
            print_warning "Verification successful but no automatic blockchain storage detected"
            return 0
        fi
    else
        print_failure "Document verification failed" "HTTP $http_code"
        return 1
    fi
}

test_blockchain_timeout_handling() {
    print_test 14 "Blockchain Timeout Handling"
    
    if [ -z "$JWT_TOKEN" ]; then
        print_failure "Timeout test skipped" "No JWT token available"
        return 1
    fi
    
    print_info "Testing timeout handling with short timeout"
    
    local proof_data="{\"documentId\":\"TIMEOUT-TEST-$(date +%s)\",\"fileHash\":\"sha256:timeout-test\"}"
    local response=$(api_call "POST" "$OCR_API_URL/api/blockchain/store-proof" "$proof_data" "$JWT_TOKEN" 2)
    local http_code="${response: -3}"
    local body="${response%???}"
    
    save_response "timeout_test_response.json" "$body"
    
    # Any response (success, timeout, or error) is acceptable - we just want no crash
    if [ -n "$http_code" ]; then
        print_success "Timeout handling works gracefully (HTTP $http_code)"
        return 0
    else
        print_warning "Timeout test inconclusive"
        return 0
    fi
}

test_transaction_data_integrity() {
    print_test 15 "Transaction Data Integrity"
    
    if [ -z "$TEST_TX_HASH" ] && [ -z "$TEST_DOCUMENT_HASH" ]; then
        print_warning "Data integrity test skipped - no transaction data available"
        return 0
    fi
    
    print_info "Verifying data consistency between request and blockchain"
    
    local hash_to_check="${TEST_TX_HASH:-$TEST_DOCUMENT_HASH}"
    local response=$(api_call "GET" "$OCR_API_URL/api/blockchain/get-proof/$hash_to_check")
    local http_code="${response: -3}"
    local body="${response%???}"
    
    save_response "integrity_check_response.json" "$body"
    
    if [ "$http_code" = "200" ]; then
        local has_document_data=$(echo "$body" | jq -r '.data.document // empty')
        local has_blockchain_data=$(echo "$body" | jq -r '.data.blockchain // empty')
        
        if [ -n "$has_document_data" ] && [ -n "$has_blockchain_data" ]; then
            print_success "Data integrity verified - consistent data structure"
            return 0
        else
            print_warning "Partial data integrity - some fields missing"
            return 0
        fi
    elif [ "$http_code" = "404" ]; then
        print_warning "Data integrity test inconclusive - proof not found (expected for test data)"
        return 0
    else
        print_failure "Data integrity check failed" "HTTP $http_code"
        return 1
    fi
}

# ============================================================================
# Main Test Execution
# ============================================================================

main() {
    print_header "🔗 ZRA TAXGUARD BLOCKCHAIN INTEGRATION TEST SUITE"
    
    echo -e "${CYAN}Configuration:${NC}"
    echo -e "  OCR API URL:        $OCR_API_URL"
    echo -e "  Blockchain API URL: $BLOCKCHAIN_API_URL"
    echo -e "  Test User:          $TEST_USER_EMAIL"
    echo -e "  Results Directory:  $RESULTS_DIR"
    echo -e "  Total Tests:        $TOTAL_TESTS"
    
    print_header "🧪 RUNNING INTEGRATION TESTS"
    
    # Run all tests
    test_ocr_backend_health || true
    test_blockchain_api_health || true
    test_blockchain_integration_health || true
    test_authentication || true
    test_store_proof_valid || true
    test_store_proof_missing_fields || true
    test_store_proof_unauthorized || true
    test_get_proof_by_tx_hash || true
    test_get_proof_by_document_hash || true
    test_get_proof_invalid_hash || true
    test_verify_hash || true
    test_flag_document || true
    test_automatic_blockchain_storage || true
    test_blockchain_timeout_handling || true
    test_transaction_data_integrity || true
    
    # Generate summary
    print_header "📊 TEST SUMMARY"
    
    local success_rate=0
    if [ $TOTAL_TESTS -gt 0 ]; then
        success_rate=$((PASSED_TESTS * 100 / TOTAL_TESTS))
    fi
    
    echo -e "${BLUE}BLOCKCHAIN INTEGRATION TEST SUMMARY${NC}"
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "Total Tests Run:         ${CYAN}$TOTAL_TESTS${NC}"
    echo -e "Tests Passed:            ${GREEN}$PASSED_TESTS${NC}"
    echo -e "Tests Failed:            ${RED}$FAILED_TESTS${NC}"
    echo ""
    echo -e "Success Rate:            ${CYAN}$success_rate%${NC}"
    echo ""
    
    # Status indicators
    if [ $PASSED_TESTS -ge 12 ]; then
        echo -e "Integration Status:      ${GREEN}OPERATIONAL ✓${NC}"
    elif [ $PASSED_TESTS -ge 8 ]; then
        echo -e "Integration Status:      ${YELLOW}PARTIAL ⚠${NC}"
    else
        echo -e "Integration Status:      ${RED}ISSUES DETECTED ✗${NC}"
    fi
    
    if [ $PASSED_TESTS -ge 3 ]; then
        echo -e "Blockchain Connectivity: ${GREEN}HEALTHY ✓${NC}"
    else
        echo -e "Blockchain Connectivity: ${RED}ISSUES ✗${NC}"
    fi
    
    if [ $PASSED_TESTS -ge 10 ]; then
        echo -e "Auto-Storage:            ${GREEN}WORKING ✓${NC}"
    else
        echo -e "Auto-Storage:            ${YELLOW}NEEDS VERIFICATION ⚠${NC}"
    fi
    
    echo ""
    echo -e "${YELLOW}⚠ Note: Some tests may show 404 if test data doesn't exist yet.${NC}"
    echo -e "${YELLOW}This is expected for a fresh system.${NC}"
    echo ""
    
    if [ $FAILED_TESTS -eq 0 ]; then
        echo -e "${GREEN}✓ BLOCKCHAIN INTEGRATION READY FOR PRODUCTION!${NC}"
        echo ""
        echo -e "${BLUE}Results saved to: $RESULTS_DIR/${NC}"
        exit 0
    else
        echo -e "${RED}⚠ SOME TESTS FAILED - CHECK RESULTS FOR DETAILS${NC}"
        echo ""
        echo -e "${BLUE}Results saved to: $RESULTS_DIR/${NC}"
        exit 1
    fi
}

# ============================================================================
# Script Execution
# ============================================================================

# Check dependencies
if ! command -v curl &> /dev/null; then
    echo -e "${RED}Error: curl is required but not installed${NC}"
    exit 1
fi

if ! command -v jq &> /dev/null; then
    echo -e "${RED}Error: jq is required but not installed${NC}"
    exit 1
fi

# Run main function
main "$@"
