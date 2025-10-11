const { TaxGuardBlockchain } = require('./deploy');

// Initialize blockchain
const blockchain = new TaxGuardBlockchain();

console.log('🚀 Adding detailed sample events...');

// 1. Tax Filing Event
blockchain.createEvent(
    'evt-filing-001',
    'filing',
    '2025-10-01T10:30:00Z',
    'taxpayer-abc123',
    'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
    'VAT Return Filed - Q3 2025 | Amount: K50,000 | Status: Submitted | Deadline: Met'
);

// 2. Payment Event
blockchain.createEvent(
    'evt-payment-002',
    'payment',
    '2025-10-01T11:00:00Z',
    'taxpayer-def456',
    '5d41402abc4b2a76b9719d911017c592',
    'Income Tax Payment - K25,000 | Method: Bank Transfer | Reference: PAY2025001 | Status: Confirmed'
);

// 3. Compliance Check Event
blockchain.createEvent(
    'evt-compliance-003',
    'compliance',
    '2025-10-01T12:15:00Z',
    'taxpayer-ghi789',
    'comp789hash123456',
    'Compliance Verification - Business License Valid | VAT Registration Active | Tax Clearance: Current'
);

// 4. Audit Flag Event
blockchain.createEvent(
    'evt-audit-004',
    'auditFlag',
    '2025-10-01T13:30:00Z',
    'taxpayer-jkl012',
    'audit456hash789',
    'Risk Alert - Revenue Mismatch Detected | Declared: K100,000 | Expected: K150,000 | Variance: 33% | Priority: High'
);

// 5. Whistleblower Report
blockchain.createEvent(
    'evt-whistle-005',
    'auditFlag',
    '2025-10-01T14:45:00Z',
    'anonymous-report-001',
    'whistle789hash456',
    'Anonymous Report - Tax Evasion Suspected | Company: XYZ Ltd | Allegation: Under-reporting sales | Case ID: WB2025001'
);

// 6. Administrative Change
blockchain.createEvent(
    'evt-admin-006',
    'adminChange',
    '2025-10-01T15:00:00Z',
    'admin-user-001',
    'admin123hash789',
    'System Update - Tax Rate Changed | VAT Rate: 16% → 18% | Effective Date: 2025-11-01 | Updated By: Tax Admin'
);

console.log('\n📊 Updated Blockchain Status:');
console.log(blockchain.getChainInfo());

console.log('\n📋 All Detailed Events:');
blockchain.queryAllEvents().forEach((event, index) => {
    console.log(`\n${index + 1}. ${event.eventType.toUpperCase()} EVENT:`);
    console.log(`   ID: ${event.eventId}`);
    console.log(`   User: ${event.anonymizedUserId}`);
    console.log(`   Time: ${event.timestamp}`);
    console.log(`   Details: ${event.notes}`);
    console.log(`   Hash: ${event.hashOfPayload.substring(0, 16)}...`);
});

module.exports = { blockchain };
