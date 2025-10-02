#!/bin/bash

# TaxGuard API Debugging Script
# Tests all endpoints and reports status

echo "🔍 TaxGuard API Debugging Report"
echo "=================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Test counter
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0

# Function to test endpoint
test_endpoint() {
    local method=$1
    local url=$2
    local description=$3
    local expected_status=$4
    local data=$5
    local headers=$6

    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    echo -n "Testing: $description... "

    if [ "$method" = "GET" ]; then
        response=$(curl -s -w "\n%{http_code}" $headers "$url" 2>&1)
    else
        response=$(curl -s -w "\n%{http_code}" -X "$method" $headers -H "Content-Type: application/json" -d "$data" "$url" 2>&1)
    fi

    status_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | head -n-1)

    if [ "$status_code" = "$expected_status" ]; then
        echo -e "${GREEN}✅ PASS${NC} (Status: $status_code)"
        PASSED_TESTS=$((PASSED_TESTS + 1))
        return 0
    else
        echo -e "${RED}❌ FAIL${NC} (Expected: $expected_status, Got: $status_code)"
        echo "   Response: $(echo $body | head -c 100)..."
        FAILED_TESTS=$((FAILED_TESTS + 1))
        return 1
    fi
}

echo "📡 Step 1: Checking Service Health"
echo "-----------------------------------"

# Check Blockchain API
test_endpoint "GET" "http://localhost:3001/api/health" "Blockchain API Health" "200"

# Check API Gateway
test_endpoint "GET" "http://localhost:4000/health" "API Gateway Health" "200"

# Check Frontend
if curl -s http://localhost:5173 > /dev/null 2>&1; then
    echo -e "Testing: Frontend Availability... ${GREEN}✅ PASS${NC}"
    PASSED_TESTS=$((PASSED_TESTS + 1))
else
    echo -e "Testing: Frontend Availability... ${RED}❌ FAIL${NC}"
    FAILED_TESTS=$((FAILED_TESTS + 1))
fi
TOTAL_TESTS=$((TOTAL_TESTS + 1))

echo ""
echo "🔐 Step 2: Testing Authentication"
echo "-----------------------------------"

# Test login endpoint
test_endpoint "POST" "http://localhost:4000/api/auth/login" \
    "Login with valid credentials" "200" \
    '{"username":"taxpayer1","password":"password123"}'

# Get token for subsequent tests
TOKEN_RESPONSE=$(curl -s -X POST http://localhost:4000/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"username":"taxpayer1","password":"password123"}')
TOKEN=$(echo $TOKEN_RESPONSE | grep -o '"token":"[^"]*' | cut -d'"' -f4)

if [ ! -z "$TOKEN" ]; then
    echo -e "${GREEN}✅ Token obtained successfully${NC}"
else
    echo -e "${RED}❌ Failed to obtain token${NC}"
fi

# Test invalid login
test_endpoint "POST" "http://localhost:4000/api/auth/login" \
    "Login with invalid credentials" "401" \
    '{"username":"invalid","password":"wrong"}'

# Test profile endpoint
if [ ! -z "$TOKEN" ]; then
    test_endpoint "GET" "http://localhost:4000/api/auth/profile" \
        "Get user profile (authenticated)" "200" "" \
        "-H \"Authorization: Bearer $TOKEN\""
fi

echo ""
echo "📦 Step 3: Testing Blockchain API"
echo "-----------------------------------"

# Test blockchain endpoints
test_endpoint "GET" "http://localhost:3001/api/blockchain" \
    "Get blockchain data" "200"

test_endpoint "GET" "http://localhost:3001/api/events" \
    "Get all events" "200"

test_endpoint "GET" "http://localhost:3001/api/stats" \
    "Get blockchain stats" "200"

test_endpoint "GET" "http://localhost:3001/api/dashboard-feed/summary" \
    "Get dashboard summary" "200"

test_endpoint "GET" "http://localhost:3001/api/dashboard-feed/live" \
    "Get live event feed" "200"

echo ""
echo "📝 Step 4: Testing Event Submission"
echo "-----------------------------------"

if [ ! -z "$TOKEN" ]; then
    # Test event submission
    test_endpoint "POST" "http://localhost:4000/api/events" \
        "Submit tax event (authenticated)" "200" \
        '{"eventType":"filing","anonymizedUserId":"test-user-'$(date +%s)'","hashOfPayload":"'$(echo -n "test" | sha256sum | cut -d' ' -f1)'","notes":"Debug test event"}' \
        "-H \"Authorization: Bearer $TOKEN\""

    # Test without authentication
    test_endpoint "POST" "http://localhost:4000/api/events" \
        "Submit event (no auth - should fail)" "401" \
        '{"eventType":"filing","anonymizedUserId":"test","hashOfPayload":"'$(echo -n "test" | sha256sum | cut -d' ' -f1)'"}'
else
    echo -e "${YELLOW}⚠️  Skipping event tests (no token)${NC}"
fi

echo ""
echo "🎯 Step 5: Testing Team Integration APIs"
echo "-----------------------------------"

# GhostBuster API
test_endpoint "GET" "http://localhost:3001/api/ghostbuster/stats" \
    "GhostBuster - Get stats" "200"

# WhistlePro API
test_endpoint "GET" "http://localhost:3001/api/whistlepro/reports" \
    "WhistlePro - Get reports" "200"

# AI Risk API
test_endpoint "GET" "http://localhost:3001/api/ai-risk/stats" \
    "AI Risk - Get stats" "200"

# Predictive API
test_endpoint "GET" "http://localhost:3001/api/predictive/accuracy-report" \
    "Predictive - Get accuracy" "200"

# Dashboard Feed
test_endpoint "GET" "http://localhost:3001/api/dashboard-feed/alerts" \
    "Dashboard - Get alerts" "200"

echo ""
echo "📊 Step 6: Testing Monitoring Endpoints"
echo "-----------------------------------"

test_endpoint "GET" "http://localhost:4000/metrics" \
    "Prometheus metrics" "200"

test_endpoint "GET" "http://localhost:4000/metrics/json" \
    "JSON metrics" "200"

test_endpoint "GET" "http://localhost:4000/api-docs" \
    "API Documentation" "200"

echo ""
echo "🔍 Step 7: Testing Error Handling"
echo "-----------------------------------"

test_endpoint "GET" "http://localhost:4000/api/events/nonexistent-id" \
    "Get non-existent event (should fail)" "401"

test_endpoint "POST" "http://localhost:4000/api/events" \
    "Invalid event data" "400" \
    '{"eventType":"invalid","anonymizedUserId":"test"}' \
    "-H \"Authorization: Bearer $TOKEN\""

test_endpoint "GET" "http://localhost:4000/nonexistent-endpoint" \
    "Non-existent endpoint" "404"

echo ""
echo "=================================="
echo "📈 Test Summary"
echo "=================================="
echo -e "Total Tests:  ${BLUE}$TOTAL_TESTS${NC}"
echo -e "Passed:       ${GREEN}$PASSED_TESTS${NC}"
echo -e "Failed:       ${RED}$FAILED_TESTS${NC}"

if [ $FAILED_TESTS -eq 0 ]; then
    echo -e "\n${GREEN}🎉 All tests passed! APIs are working correctly.${NC}"
    exit 0
else
    PASS_RATE=$((PASSED_TESTS * 100 / TOTAL_TESTS))
    echo -e "\n${YELLOW}⚠️  Some tests failed. Pass rate: ${PASS_RATE}%${NC}"
    echo -e "\n${BLUE}💡 Troubleshooting tips:${NC}"
    echo "1. Check if all services are running (blockchain, api-gateway, frontend)"
    echo "2. Review service logs for errors"
    echo "3. Verify database connections if applicable"
    echo "4. Check environment variables (.env files)"
    exit 1
fi
