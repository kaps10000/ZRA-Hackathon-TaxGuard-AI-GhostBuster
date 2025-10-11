# WhistlePro Backend - Test Documentation

## Test Suite Overview

Comprehensive unit and integration tests for the WhistlePro anonymous reporting backend.

---

## Test Statistics

**Total Test Files:** 5
**Test Categories:**
- ✅ Database Integration Tests
- ✅ Model Tests (Report)
- ✅ Service Tests (Encryption, Audit)
- ✅ API Route Tests (POST, GET, PATCH)
- ✅ Security & Middleware Tests

---

## Running Tests

### Run All Tests
```bash
npm test
```

### Run Tests with Coverage
```bash
npm test -- --coverage
```

### Run Specific Test File
```bash
npm test -- __tests__/models/Report.test.js
```

### Run Tests in Watch Mode
```bash
npm run test:watch
```

---

## Test Files

### 1. Database Integration Tests
**File:** `__tests__/database.test.js`

**Tests:**
- ✅ Database connection
- ✅ Table schema validation (reports, investigators, audit_logs)
- ✅ Constraints (unique, foreign keys)
- ✅ Indexes verification
- ✅ CRUD operations
- ✅ Transaction support (commit/rollback)

**Total Tests:** ~20 tests

---

### 2. Report Model Tests
**File:** `__tests__/models/Report.test.js`

**Test Suites:**

#### `generateCaseId()`
- ✅ Valid format (ZRA-YYYY-XXXXXX)
- ✅ Current year inclusion
- ✅ Uniqueness

#### `create()`
- ✅ Report creation with encryption
- ✅ Default priority setting
- ✅ Metadata hash generation (blockchain)
- ✅ Audit log creation

#### `findByCaseId()`
- ✅ Find by valid case ID
- ✅ Return null for non-existent
- ✅ Payload decryption
- ✅ Audit log on view

#### `list()`
- ✅ Default pagination
- ✅ Filter by status/category/priority
- ✅ Pagination limits
- ✅ Ordering (created_at DESC)

#### `updateStatus()`
- ✅ Status update
- ✅ Audit logging
- ✅ Error handling
- ✅ Timestamp updates

#### Database Integrity
- ✅ Unique case_id constraint
- ✅ Required fields
- ✅ Default values

**Total Tests:** ~30 tests

---

### 3. Encryption Service Tests
**File:** `__tests__/services/encryptionService.test.js`

**Test Suites:**

#### `encrypt()` and `decrypt()`
- ✅ Correct encryption/decryption
- ✅ Random IV per encryption
- ✅ JSON object handling
- ✅ Empty string handling
- ✅ Long text handling
- ✅ Unicode & special characters

#### `encrypt()` format
- ✅ IV:AuthTag:Ciphertext format
- ✅ Correct component lengths

#### `decrypt()` error handling
- ✅ Invalid format detection
- ✅ Tampered ciphertext detection
- ✅ Tampered auth tag detection

#### `hashSensitiveData()`
- ✅ Consistent hashing
- ✅ Different data → different hashes
- ✅ Salt usage
- ✅ Deterministic with same salt

#### `generateSecureToken()`
- ✅ Default length (64 hex chars)
- ✅ Custom length support
- ✅ Uniqueness

#### `createBlockchainHash()`
- ✅ SHA-256 hash creation
- ✅ Deterministic hashing
- ✅ Different data → different hashes
- ✅ Complex nested objects

#### Security Properties
- ✅ AES-256-GCM algorithm
- ✅ 256-bit key length
- ✅ Authenticated encryption (tamper-proof)

**Total Tests:** ~25 tests

---

### 4. API Route Tests
**File:** `__tests__/routes/reportRoutes.test.js`

**Test Suites:**

#### `POST /api/reports` - Submit Report
- ✅ Create report with valid data
- ✅ Reject short title (<10 chars)
- ✅ Reject short description (<50 chars)
- ✅ Reject invalid category
- ✅ Default priority handling
- ✅ Reject invalid priority
- ✅ Handle complex reports with all fields

#### `GET /api/reports/:caseId` - Get Report
- ✅ Retrieve by valid case ID
- ✅ 404 for non-existent report
- ✅ 400 for invalid format
- ✅ Decrypted payload inclusion

#### `GET /api/reports` - List Reports
- ✅ Default pagination
- ✅ Filter by status
- ✅ Filter by category
- ✅ Filter by priority
- ✅ Custom page size
- ✅ Pagination support
- ✅ Max results limit (100)

#### `PATCH /api/reports/:caseId/status` - Update Status
- ✅ Update status successfully
- ✅ Reject invalid status
- ✅ All valid statuses accepted
- ✅ Optional notes parameter

#### `GET /api/reports/stats` - Statistics
- ✅ Return statistics
- ✅ Date filters support

#### Security Middleware Integration
- ✅ XSS sanitization
- ✅ Rate limiting

**Total Tests:** ~30 tests

---

## Test Configuration

### Jest Config (`jest.config.js`)
```javascript
{
  testEnvironment: 'node',
  testMatch: ['**/__tests__/**/*.test.js'],
  setupFilesAfterEnv: ['<rootDir>/__tests__/setup.js'],
  collectCoverageFrom: ['src/**/*.js'],
  coveragePathIgnorePatterns: ['/node_modules/'],
  testTimeout: 10000
}
```

### Test Environment (`.env.test`)
- Test database: `whistlepro_test`
- High rate limits (disabled for testing)
- Test JWT/encryption keys
- Error-level logging only

---

## Test Helpers

Global test helpers available in all tests:

### `createTestInvestigator()`
Creates a test investigator in the database.

```javascript
const investigator = await global.testHelpers.createTestInvestigator();
// Returns: { id, email, role, ... }
```

### `createTestReport(data)`
Creates a test report with optional custom data.

```javascript
const report = await global.testHelpers.createTestReport({
  category: 'fraud',
  priority: 'high'
});
// Returns: { id, case_id, category, ... }
```

### `generateJWT(investigator)`
Generates a JWT token for testing authenticated endpoints.

```javascript
const token = global.testHelpers.generateJWT(investigator);
// Returns: JWT string
```

---

## Test Database Setup

### Automatic Setup (Before All Tests)
1. Load test environment variables
2. Run database migrations
3. Create clean test database

### Cleanup (After Each Test)
- Clear `audit_logs` table
- Clear `reports` table
- Clear `investigators` table

### Teardown (After All Tests)
- Close database connection
- Clean up resources

---

## Code Coverage Goals

**Target Coverage:** >80%

**Critical Areas:**
- ✅ Models: 90%+
- ✅ Services: 90%+
- ✅ Routes: 85%+
- ✅ Middleware: 80%+

**Generate Coverage Report:**
```bash
npm test -- --coverage
open coverage/index.html
```

---

## Writing New Tests

### Test File Structure
```javascript
const Model = require('../../src/models/Model');

describe('Model Name', () => {
  describe('methodName()', () => {
    it('should do something specific', async () => {
      // Arrange
      const input = 'test data';

      // Act
      const result = await Model.methodName(input);

      // Assert
      expect(result).toBe('expected');
    });
  });
});
```

### Best Practices

1. **Clear Test Names**
   ```javascript
   ✅ it('should reject invalid email format')
   ❌ it('test validation')
   ```

2. **Arrange-Act-Assert Pattern**
   ```javascript
   // Arrange - Set up test data
   const data = { ... };

   // Act - Execute the function
   const result = await someFunction(data);

   // Assert - Verify the result
   expect(result).toBe(expected);
   ```

3. **Test One Thing**
   ```javascript
   ✅ it('should hash IP addresses')
   ✅ it('should hash user agents')
   ❌ it('should hash IPs and UAs')
   ```

4. **Use Descriptive Assertions**
   ```javascript
   ✅ expect(report.case_id).toMatch(/^ZRA-\d{4}-[A-F0-9]{6}$/)
   ❌ expect(report.case_id).toBeTruthy()
   ```

5. **Clean Up Resources**
   ```javascript
   afterEach(async () => {
     await db('table').del(); // Clean test data
   });
   ```

---

## Common Issues & Solutions

### Issue: Database Connection Timeout
**Solution:** Increase timeout in jest.config.js
```javascript
testTimeout: 15000
```

### Issue: Tests Fail Due to Dirty Database
**Solution:** Ensure cleanup in `afterEach` hook
```javascript
afterEach(async () => {
  await db('audit_logs').del();
  await db('reports').del();
});
```

### Issue: Rate Limiting Fails Tests
**Solution:** Use high limits in `.env.test`
```env
REPORT_RATE_LIMIT_MAX=1000
```

### Issue: Encryption Tests Fail
**Solution:** Ensure `.env.test` has valid encryption key
```env
ENCRYPTION_KEY=test-key-must-be-32-chars-long
```

---

## Continuous Integration

### GitHub Actions Example
```yaml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest

    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: postgres
        options: >-
          --health-cmd pg_isready
          --health-interval 10s

    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: '18'

      - run: npm install
      - run: npm run migrate
      - run: npm test -- --coverage

      - name: Upload coverage
        uses: codecov/codecov-action@v2
```

---

## Test Reports

### Jest Output
```
 PASS  __tests__/models/Report.test.js
 PASS  __tests__/services/encryptionService.test.js
 PASS  __tests__/routes/reportRoutes.test.js
 PASS  __tests__/database.test.js

Test Suites: 4 passed, 4 total
Tests:       105 passed, 105 total
Snapshots:   0 total
Time:        12.345 s
```

### Coverage Report
```
---------------------|---------|----------|---------|---------|
File                 | % Stmts | % Branch | % Funcs | % Lines |
---------------------|---------|----------|---------|---------|
All files            |   92.15 |    85.42 |   94.28 |   91.87 |
 models/Report.js    |   95.12 |    88.23 |   100   |   94.87 |
 services/...        |   96.42 |    91.66 |   100   |   96.12 |
 routes/...          |   88.76 |    82.14 |   91.30 |   88.45 |
---------------------|---------|----------|---------|---------|
```

---

## Future Test Additions

### Planned Tests
- [ ] Authentication middleware tests
- [ ] Authorization tests (role-based)
- [ ] File upload tests (evidence attachments)
- [ ] Performance tests (load testing)
- [ ] Security penetration tests

### Test Data Factories
Consider using a factory library like `factory-girl` for complex test data:
```javascript
const factory = require('factory-girl').factory;

factory.define('report', Report, {
  category: 'tax_evasion',
  title: factory.sequence(n => `Report ${n}`),
  description: 'Test description...'
});
```

---

**Maintained by:** Kelvin - WhistlePro Backend Team
**Last Updated:** October 11, 2025
**Test Framework:** Jest v29.7.0
**Test Database:** PostgreSQL 15
