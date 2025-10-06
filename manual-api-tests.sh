#!/bin/bash

echo "🚀 Manual API Testing Script"
echo "================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test function
test_endpoint() {
    local name="$1"
    local method="$2"
    local url="$3"
    local data="$4"
    
    echo -e "\n🧪 Testing: ${YELLOW}$name${NC}"
    
    if [ "$method" = "GET" ]; then
        response=$(curl -s -w "HTTPSTATUS:%{http_code}" "$url")
    else
        response=$(curl -s -w "HTTPSTATUS:%{http_code}" -X "$method" -H "Content-Type: application/json" -d "$data" "$url")
    fi
    
    http_code=$(echo "$response" | tr -d '\n' | sed -e 's/.*HTTPSTATUS://')
    body=$(echo "$response" | sed -e 's/HTTPSTATUS:.*//g')
    
    if [ "$http_code" -eq 200 ]; then
        echo -e "✅ ${GREEN}PASSED${NC} ($http_code)"
        echo "   Response: $(echo "$body" | head -c 100)..."
    else
        echo -e "❌ ${RED}FAILED${NC} ($http_code)"
        echo "   Error: $body"
    fi
}

# Test data
DOC_ID="test_$(date +%s)"
DOC_HASH="0x$(openssl rand -hex 8)"

TEST_DATA="{
  \"docId\": \"$DOC_ID\",
  \"docHash\": \"$DOC_HASH\",
  \"extractedData\": {
    \"invoice\": \"TEST-001\",
    \"amount\": 1000
  },
  \"riskScore\": 0.85,
  \"verificationStatus\": \"Valid\"
}"

echo "Test Document ID: $DOC_ID"
echo "Test Document Hash: $DOC_HASH"

# Health Checks
echo -e "\n📋 Health Checks"
echo "=================="
test_endpoint "OCR Backend Health" "GET" "http://localhost:3000/healthcheck"
test_endpoint "Blockchain API Health" "GET" "http://localhost:3001/api/ocr-verification/health"

# OCR Backend Tests
echo -e "\n🔍 OCR Backend Tests"
echo "===================="
test_endpoint "Store Blockchain Proof" "POST" "http://localhost:3000/api/blockchain/store-proof" "$TEST_DATA"
test_endpoint "Get Blockchain Proof" "GET" "http://localhost:3000/api/blockchain/get-proof/$DOC_ID"
test_endpoint "Blockchain Service Health" "GET" "http://localhost:3000/api/blockchain/health"

# Blockchain API Tests
echo -e "\n⛓️  Blockchain API Tests"
echo "======================="
test_endpoint "Store OCR Verification" "POST" "http://localhost:3001/api/ocr-verification/store" "$TEST_DATA"
test_endpoint "Verify OCR Document" "GET" "http://localhost:3001/api/ocr-verification/verify/$DOC_ID"

FLAG_DATA="{\"docId\": \"$DOC_ID\", \"reason\": \"Test flag\"}"
test_endpoint "Flag Document" "POST" "http://localhost:3001/api/ocr-verification/flag" "$FLAG_DATA"
test_endpoint "Get Flagged Documents" "GET" "http://localhost:3001/api/ocr-verification/flagged"

# Summary
echo -e "\n📊 Test Summary"
echo "==============="
echo "✅ Tests completed"
echo "📄 Check individual test results above"
echo "🔧 If tests fail, ensure services are running:"
echo "   - OCR Backend: cd ocr-backend && npm start"
echo "   - Blockchain API: cd blockchain && npm start"
