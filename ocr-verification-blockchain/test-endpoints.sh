#!/bin/bash

# OCR Verification API Test Script
# Tests all endpoints with sample data

API_BASE="http://localhost:3001/api/ocr-verification"

echo "╔═══════════════════════════════════════════════════════════╗"
echo "║     🧪 Testing OCR Verification API Endpoints            ║"
echo "╚═══════════════════════════════════════════════════════════╝"
echo ""

# Test 1: Health Check
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "TEST 1: Health Check"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
curl -s "$API_BASE/health" | python3 -m json.tool
echo ""
echo ""

# Test 2: Store Valid Document (Low Risk)
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "TEST 2: Store Valid Document (Risk Score: 15)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
curl -s -X POST "$API_BASE/store" \
  -H "Content-Type: application/json" \
  -d '{
    "docId": "INV-2025-001",
    "docHash": "abc123def456",
    "extractedData": {
      "invoiceNumber": "INV-2025-001",
      "importerName": "ABC Corporation",
      "hsCode": "8471.30",
      "value": 50000,
      "currency": "USD",
      "origin": "China"
    },
    "riskScore": 15,
    "aiMetadata": {
      "ocrConfidence": 0.95,
      "aiModel": "tesseract-v5",
      "processingTime": 1250,
      "documentType": "invoice"
    }
  }' | python3 -m json.tool
echo ""
echo ""

# Test 3: Store Suspicious Document (Medium Risk)
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "TEST 3: Store Suspicious Document (Risk Score: 55)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
curl -s -X POST "$API_BASE/store" \
  -H "Content-Type: application/json" \
  -d '{
    "docId": "INV-2025-002",
    "docHash": "xyz789ghi012",
    "extractedData": {
      "invoiceNumber": "INV-2025-002",
      "importerName": "XYZ Trading Ltd",
      "hsCode": "8528.72",
      "value": 125000,
      "currency": "USD"
    },
    "riskScore": 55,
    "aiMetadata": {
      "ocrConfidence": 0.78,
      "aiModel": "tesseract-v5",
      "processingTime": 2100,
      "documentType": "invoice",
      "anomalies": ["Unusual value for HS code", "Low OCR confidence"]
    }
  }' | python3 -m json.tool
echo ""
echo ""

# Test 4: Store Fraudulent Document (High Risk)
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "TEST 4: Store Fraudulent Document (Risk Score: 85)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
curl -s -X POST "$API_BASE/store" \
  -H "Content-Type: application/json" \
  -d '{
    "docId": "INV-2025-003",
    "docHash": "fraud999alert",
    "extractedData": {
      "invoiceNumber": "INV-2025-003",
      "importerName": "Suspicious Imports Inc",
      "hsCode": "9999.99",
      "value": 1000000,
      "currency": "USD"
    },
    "riskScore": 85,
    "aiMetadata": {
      "ocrConfidence": 0.42,
      "aiModel": "tesseract-v5",
      "processingTime": 3500,
      "documentType": "invoice",
      "anomalies": [
        "Invalid HS code",
        "Extreme value mismatch",
        "Very low OCR confidence",
        "Known fraudulent importer"
      ]
    }
  }' | python3 -m json.tool
echo ""
echo ""

# Test 5: Retrieve Document by ID
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "TEST 5: Retrieve Document (INV-2025-001)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
curl -s "$API_BASE/INV-2025-001" | python3 -m json.tool
echo ""
echo ""

# Test 6: Flag Suspicious Document
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "TEST 6: Flag Document as Suspicious"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
curl -s -X POST "$API_BASE/flag" \
  -H "Content-Type: application/json" \
  -d '{
    "docId": "INV-2025-002",
    "reason": "Manual review required - inconsistent HS code",
    "flaggedBy": "ZRA_Officer_Mwansa"
  }' | python3 -m json.tool
echo ""
echo ""

# Test 7: Query by Status - VALID
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "TEST 7: Query Documents by Status (VALID)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
curl -s "$API_BASE/query/status/VALID" | python3 -m json.tool
echo ""
echo ""

# Test 8: Query by Status - SUSPICIOUS
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "TEST 8: Query Documents by Status (SUSPICIOUS)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
curl -s "$API_BASE/query/status/SUSPICIOUS" | python3 -m json.tool
echo ""
echo ""

# Test 9: Query by Status - FRAUDULENT
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "TEST 9: Query Documents by Status (FRAUDULENT)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
curl -s "$API_BASE/query/status/FRAUDULENT" | python3 -m json.tool
echo ""
echo ""

# Test 10: Get Flagged Documents
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "TEST 10: Get All Flagged Documents"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
curl -s "$API_BASE/flagged" | python3 -m json.tool
echo ""
echo ""

# Test 11: Get Statistics
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "TEST 11: Get Verification Statistics"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
curl -s "$API_BASE/statistics" | python3 -m json.tool
echo ""
echo ""

# Test 12: Batch Verification
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "TEST 12: Batch Verify Multiple Documents"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
curl -s -X POST "$API_BASE/batch" \
  -H "Content-Type: application/json" \
  -d '{
    "documents": [
      {
        "docId": "BATCH-001",
        "docHash": "batch1hash",
        "extractedData": {"invoiceNumber": "B001", "value": 10000},
        "riskScore": 10,
        "aiMetadata": {"confidence": 0.98}
      },
      {
        "docId": "BATCH-002",
        "docHash": "batch2hash",
        "extractedData": {"invoiceNumber": "B002", "value": 20000},
        "riskScore": 25,
        "aiMetadata": {"confidence": 0.92}
      },
      {
        "docId": "BATCH-003",
        "docHash": "batch3hash",
        "extractedData": {"invoiceNumber": "B003", "value": 30000},
        "riskScore": 70,
        "aiMetadata": {"confidence": 0.65}
      }
    ]
  }' | python3 -m json.tool
echo ""
echo ""

# Final Statistics
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "FINAL: Updated Statistics After All Tests"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
curl -s "$API_BASE/statistics" | python3 -m json.tool
echo ""
echo ""

echo "╔═══════════════════════════════════════════════════════════╗"
echo "║     ✅ All Endpoint Tests Complete!                       ║"
echo "╚═══════════════════════════════════════════════════════════╝"
