# 🧪 Blockchain Integration Test Suite

**Comprehensive testing for ZRA TaxGuard OCR Backend blockchain integration**

---

## 📋 Overview

This test suite validates the complete blockchain integration between the OCR backend and Kaps' blockchain API system.

### **Test Coverage:**
- ✅ **15 comprehensive tests**
- ✅ **Health checks** for all systems
- ✅ **Authentication** and security
- ✅ **Blockchain operations** (store, retrieve, verify)
- ✅ **Automatic integration** workflow
- ✅ **Error handling** and timeouts
- ✅ **Data integrity** verification

---

## 🚀 Quick Start

### **Run the Test Suite:**
```bash
# Make executable
chmod +x test_blockchain_integration.sh

# Run with defaults
./test_blockchain_integration.sh

# Run with custom configuration
OCR_API_URL=http://localhost:3000 \
BLOCKCHAIN_API_URL=http://localhost:3001 \
TEST_USER_EMAIL=zra_admin \
TEST_USER_PASSWORD=password \
./test_blockchain_integration.sh
```

### **Prerequisites:**
- **curl** - HTTP client
- **jq** - JSON processor
- **OCR Backend** running on port 3000
- **Blockchain API** running on port 3001 (optional)

---

## 📊 Test Details

### **Test 1-3: Health Checks**
- OCR Backend health
- Blockchain API health  
- Integration bridge health

### **Test 4: Authentication**
- JWT token acquisition
- Token validation

### **Test 5-7: Proof Storage**
- Valid proof storage
- Validation testing
- Authorization testing

### **Test 8-10: Proof Retrieval**
- By transaction hash
- By document hash
- Invalid hash handling

### **Test 11-12: Advanced Operations**
- Cross-system verification
- Document flagging

### **Test 13-15: Integration Testing**
- Automatic blockchain storage
- Timeout handling
- Data integrity verification

---

## 📁 Output Structure

### **Results Directory:**
```
blockchain_test_results_YYYYMMDD_HHMMSS/
├── ocr_health_response.json
├── blockchain_health_response.json
├── integration_health_response.json
├── auth_response.json
├── store_proof_response.json
├── get_proof_response.json
├── verify_hash_response.json
├── flag_document_response.json
├── automatic_storage_test.json
├── jwt_token.txt
└── transaction_hashes.txt
```

### **Console Output:**
- **Colorized results** with pass/fail indicators
- **Real-time progress** with test descriptions
- **Detailed summary** with success rates
- **Status indicators** for integration health

---

## 🎯 Success Criteria

### **Production Ready (12+ tests pass):**
- ✅ Integration Status: OPERATIONAL
- ✅ Blockchain Connectivity: HEALTHY
- ✅ Auto-Storage: WORKING

### **Partial Success (8-11 tests pass):**
- ⚠️ Integration Status: PARTIAL
- ⚠️ Some features may need attention

### **Issues Detected (<8 tests pass):**
- ❌ Integration Status: ISSUES DETECTED
- ❌ Requires investigation

---

## 🔧 Configuration

### **Environment Variables:**
```bash
OCR_API_URL=http://localhost:3000          # OCR Backend URL
BLOCKCHAIN_API_URL=http://localhost:3001   # Blockchain API URL
TEST_USER_EMAIL=zra_admin                  # Test user credentials
TEST_USER_PASSWORD=password                # Test user password
```

### **Timeout Settings:**
- **Default API timeout:** 10 seconds
- **Blockchain timeout:** 5 seconds
- **Timeout test:** 2 seconds

---

## 🛡️ Error Handling

### **Graceful Degradation:**
- **Blockchain API down:** Tests continue with warnings
- **Authentication fails:** Protected tests skipped
- **Timeouts:** Handled gracefully without crashes
- **404 responses:** Acceptable for non-existent test data

### **Exit Codes:**
- **0:** All tests passed
- **1:** Some tests failed (check results)

---

## 📈 Expected Results

### **Fresh System (No Data):**
- Health checks: ✅ PASS
- Authentication: ✅ PASS
- Store operations: ✅ PASS
- Retrieve operations: ⚠️ 404 (expected)
- Validation: ✅ PASS

### **System with Data:**
- All operations: ✅ PASS
- Data integrity: ✅ PASS
- Cross-verification: ✅ PASS

---

## 🔍 Troubleshooting

### **Common Issues:**

#### **"OCR Backend not running"**
```bash
# Start OCR backend
cd ocr-backend
npm start
```

#### **"Blockchain API not accessible"**
```bash
# Start blockchain service
cd blockchain
npm start
```

#### **"Authentication failed"**
- Check test credentials in .env
- Verify user exists in system
- Check JWT configuration

#### **"jq command not found"**
```bash
# Install jq
sudo apt-get install jq  # Ubuntu/Debian
brew install jq          # macOS
```

---

## 📚 Integration Architecture

### **Test Flow:**
```
Test Suite → OCR Backend (3000) → Blockchain API (3001)
     ↓              ↓                      ↓
  Results    Document Storage      Blockchain Storage
```

### **Automatic Integration:**
```
Document Upload → Verification → Auto Blockchain Storage
                                        ↓
                              Transaction Hash Stored
```

---

## 🎉 Production Readiness

### **When All Tests Pass:**
- ✅ **Blockchain integration operational**
- ✅ **Automatic proof storage working**
- ✅ **Error handling implemented**
- ✅ **Security measures active**
- ✅ **Data integrity maintained**

**System is ready for production deployment!** 🚀

---

## 📞 Support

### **Test Failures:**
1. Check service status (OCR backend, blockchain API)
2. Verify network connectivity
3. Review error logs in results directory
4. Check authentication credentials
5. Validate environment configuration

### **Integration Issues:**
1. Confirm blockchain API endpoints
2. Check API key configuration
3. Verify timeout settings
4. Review firewall/network settings

**The test suite provides comprehensive validation of the blockchain integration and ensures production readiness!** ✅
