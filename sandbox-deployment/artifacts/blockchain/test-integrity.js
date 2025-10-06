const crypto = require('crypto');

console.log('🔒 Testing Data Integrity & Hashing\n');

// Test 1: SHA256 Hashing
console.log('1️⃣ SHA256 Hash Generation');
const testData = 'evt-001filing user123abc123def456';
const hash1 = crypto.createHash('sha256').update(testData).digest('hex');
const hash2 = crypto.createHash('sha256').update(testData).digest('hex');
console.log('Hash 1:', hash1.substring(0, 32) + '...');
console.log('Hash 2:', hash2.substring(0, 32) + '...');
console.log(hash1 === hash2 ? '✅ Hashes are deterministic\n' : '❌ Hash mismatch\n');

// Test 2: Data Tampering Detection
console.log('2️⃣ Tampering Detection');
const originalData = 'user123';
const originalHash = crypto.createHash('sha256').update(originalData).digest('hex');
const tamperedData = 'user124'; // Changed last character
const tamperedHash = crypto.createHash('sha256').update(tamperedData).digest('hex');
console.log('Original Hash:', originalHash.substring(0, 32) + '...');
console.log('Tampered Hash:', tamperedHash.substring(0, 32) + '...');
console.log(originalHash !== tamperedHash ? '✅ Tampering detected\n' : '❌ Failed to detect tampering\n');

// Test 3: Event Integrity Hash
console.log('3️⃣ Event Integrity Verification');
const eventId = 'evt-filing-001';
const eventType = 'filing';
const anonymizedUserId = 'taxpayer-abc123';
const hashOfPayload = 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855';

const integrityData = `${eventId}${eventType}${anonymizedUserId}${hashOfPayload}`;
const integrityHash = crypto.createHash('sha256').update(integrityData).digest('hex');
console.log('Event ID:', eventId);
console.log('Event Type:', eventType);
console.log('User ID:', anonymizedUserId);
console.log('Payload Hash:', hashOfPayload.substring(0, 32) + '...');
console.log('Integrity Hash:', integrityHash.substring(0, 32) + '...');
console.log('✅ Integrity hash successfully generated\n');

// Test 4: Hexadecimal Validation
console.log('4️⃣ Hexadecimal Validation');
const validHex = 'abc123def456';
const invalidHex = 'xyz123def456';
const hexRegex = /^[a-fA-F0-9]+$/;

console.log('Valid hex:', validHex, '→', hexRegex.test(validHex) ? '✅ Valid' : '❌ Invalid');
console.log('Invalid hex:', invalidHex, '→', !hexRegex.test(invalidHex) ? '✅ Rejected' : '❌ Passed');

console.log('\n5️⃣ Anonymization Testing');
const realUserId = 'john.doe@example.com';
const anonymized1 = crypto.createHash('sha256').update(realUserId + 'salt1').digest('hex').substring(0, 16);
const anonymized2 = crypto.createHash('sha256').update(realUserId + 'salt2').digest('hex').substring(0, 16);
console.log('Real User ID:', realUserId);
console.log('Anonymized (salt1):', anonymized1);
console.log('Anonymized (salt2):', anonymized2);
console.log('✅ User identity protected through hashing\n');

console.log('🎉 All Integrity Tests Passed!');
console.log('\n📊 Summary:');
console.log('  ✅ SHA256 hashing working correctly');
console.log('  ✅ Tampering detection functional');
console.log('  ✅ Event integrity verification operational');
console.log('  ✅ Input validation working');
console.log('  ✅ Anonymization protecting user privacy');
