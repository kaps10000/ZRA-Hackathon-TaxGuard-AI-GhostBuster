-- =====================================================
-- ZRA TaxGuard OCR - Mock Data for Testing
-- =====================================================
-- Purpose: Insert realistic test data for security features
-- Tables: ocr.documents, ocr.document_security, ocr.security_audit_log, ocr.anomaly_detection
-- =====================================================

-- Clean up existing test data (optional - comment out if you want to keep existing data)
-- DELETE FROM ocr.anomaly_detection WHERE document_id LIKE 'TEST-%';
-- DELETE FROM ocr.security_audit_log WHERE document_id LIKE 'TEST-%';
-- DELETE FROM ocr.document_security WHERE document_id LIKE 'TEST-%';
-- DELETE FROM ocr.documents WHERE document_id LIKE 'TEST-%';

-- =====================================================
-- 1. Insert Test Documents (ocr.documents)
-- =====================================================

INSERT INTO ocr.documents (document_id, file_path, filename, uploaded_at) VALUES
('TEST-DOC-001', '/uploads/test/invoice_001.pdf', 'invoice_001.pdf', NOW() - INTERVAL '5 days'),
('TEST-DOC-002', '/uploads/test/receipt_002.jpg', 'receipt_002.jpg', NOW() - INTERVAL '4 days'),
('TEST-DOC-003', '/uploads/test/customs_003.pdf', 'customs_003.pdf', NOW() - INTERVAL '3 days'),
('TEST-DOC-004', '/uploads/test/tax_form_004.pdf', 'tax_form_004.pdf', NOW() - INTERVAL '2 days'),
('TEST-DOC-005', '/uploads/test/suspicious_005.jpg', 'suspicious_005.jpg', NOW() - INTERVAL '1 day'),
('TEST-DOC-006', '/uploads/test/secure_006.pdf', 'secure_006.pdf', NOW() - INTERVAL '12 hours'),
('TEST-DOC-007', '/uploads/test/compromised_007.pdf', 'compromised_007.pdf', NOW() - INTERVAL '6 hours'),
('TEST-DOC-008', '/uploads/test/barcode_008.jpg', 'barcode_008.jpg', NOW() - INTERVAL '3 hours'),
('TEST-DOC-009', '/uploads/test/qr_code_009.pdf', 'qr_code_009.pdf', NOW() - INTERVAL '1 hour'),
('TEST-DOC-010', '/uploads/test/watermark_010.pdf', 'watermark_010.pdf', NOW() - INTERVAL '30 minutes')
ON CONFLICT (document_id) DO NOTHING;

-- =====================================================
-- 2. Insert Security Scan Results (ocr.document_security)
-- =====================================================

-- Document 1: SECURE - All security features present
INSERT INTO ocr.document_security (
    document_id,
    file_hash_sha256,
    file_hash_sha512,
    original_hash,
    hash_verified,

    -- Physical features (all detected)
    watermark_detected, watermark_confidence, watermark_details,
    hologram_detected, hologram_confidence, hologram_details,
    microprinting_detected, microprinting_confidence, microprinting_details,
    security_thread_detected, security_thread_confidence, security_thread_details,
    uv_features_detected, uv_features_confidence, uv_features_details,

    -- Digital features (all verified)
    qr_code_detected, qr_code_content, qr_code_verified, qr_code_details,
    barcode_detected, barcode_content, barcode_verified, barcode_details,
    digital_signature_present, digital_signature_valid, digital_signature_details,
    serial_number, serial_number_verified, serial_number_details,

    -- Metadata
    exif_data, exif_anomalies, exif_tampering_detected,
    file_format_valid, file_format_details,

    -- Security assessment
    security_score, security_status, score_breakdown,

    -- Blockchain
    blockchain_tx_id, blockchain_timestamp, blockchain_proof,

    -- Verification
    verified_by, verification_timestamp, officer_notes,

    -- Flags
    flagged, flag_reason
) VALUES (
    'TEST-DOC-001',
    'a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6a7b8c9d0e1f2',
    'f2e1d0c9b8a7z6y5x4w3v2u1t0s9r8q7p6o5n4m3l2k1j0i9h8g7f6e5d4c3b2a1f0e9d8c7b6a5z4y3x2w1v0u9t8s7r6q5p4o3n2m1l0k9j8i7h6g5f4e3d2c1b0a9z8y7x6w5v4u3t2s1r0q9p8o7n6m5l4k3j2i1h0g9f8e7d6c5b4a3z2y1x0w9v8',
    'e5d4c3b2a1f0e9d8c7b6a5z4y3x2w1v0',
    true,

    true, 95.5, '{"type": "digital", "pattern": "ZRA-OFFICIAL", "location": "center"}'::jsonb,
    true, 92.0, '{"type": "3D", "colors": ["silver", "gold"], "verified": true}'::jsonb,
    true, 88.5, '{"text": "SECURE DOCUMENT", "font_size": "0.5mm", "readable": true}'::jsonb,
    true, 90.0, '{"position": "embedded", "continuous": true, "material": "metallic"}'::jsonb,
    true, 85.0, '{"uv_ink": true, "patterns": ["ZRA-SEAL"], "verified": true}'::jsonb,

    true, 'https://verify.zra.gov.zm/doc/TEST-DOC-001', true, '{"version": "2.0", "valid": true, "expires": "2026-12-31"}'::jsonb,
    true, '978-0-123456-78-9', true, '{"type": "EAN-13", "valid": true, "country": "ZM"}'::jsonb,
    true, true, '{"algorithm": "RSA-2048", "issuer": "ZRA-CA", "valid_until": "2026-12-31"}'::jsonb,
    'ZRA-2025-001234', true, '{"issued_date": "2025-01-15", "issuing_office": "Lusaka Central"}'::jsonb,

    '{"Make": "Canon", "Model": "EOS 5D", "DateTime": "2025:01:15 10:30:00", "Software": "Adobe Photoshop"}'::jsonb,
    '[]'::jsonb,
    false,
    true, '{"mime_type": "application/pdf", "version": "1.7", "encrypted": false}'::jsonb,

    98.5, 'SECURE', '{"hash_integrity": 20, "physical_features": 30, "digital_features": 25, "metadata": 13.5, "blockchain": 10}'::jsonb,

    'bc_tx_1a2b3c4d5e6f7g8h9i0j', '2025-10-06T10:30:00Z', '{"block": 12345, "confirmations": 6}'::jsonb,

    'OFFICER-001', NOW() - INTERVAL '4 days', 'All security features verified. Document is authentic.',

    false, NULL
) ON CONFLICT (document_id) DO NOTHING;

-- Document 2: ACCEPTABLE - Most features present
INSERT INTO ocr.document_security (
    document_id, file_hash_sha256, file_hash_sha512, original_hash, hash_verified,
    watermark_detected, watermark_confidence, watermark_details,
    hologram_detected, hologram_confidence, hologram_details,
    qr_code_detected, qr_code_content, qr_code_verified, qr_code_details,
    barcode_detected, barcode_content, barcode_verified, barcode_details,
    digital_signature_present, digital_signature_valid,
    exif_data, exif_anomalies, exif_tampering_detected,
    file_format_valid,
    security_score, security_status, score_breakdown,
    blockchain_tx_id, blockchain_timestamp,
    verified_by, verification_timestamp, officer_notes,
    flagged
) VALUES (
    'TEST-DOC-002',
    'b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6a7b8c9d0e1f2g3',
    'g3f2e1d0c9b8a7z6y5x4w3v2u1t0s9r8q7p6o5n4m3l2k1j0i9h8g7f6e5d4c3b2a1',
    'f0e9d8c7b6a5z4y3x2w1v0u9t8s7r6q5',
    true,
    true, 85.0, '{"type": "digital", "pattern": "ZRA-STD"}'::jsonb,
    false, 0, '{}'::jsonb,
    true, 'https://verify.zra.gov.zm/doc/TEST-DOC-002', true, '{"version": "1.0", "valid": true}'::jsonb,
    true, '123456789012', true, '{"type": "UPC-A", "valid": true}'::jsonb,
    false, false,
    '{"Make": "iPhone 12", "DateTime": "2025:01:16 14:20:00"}'::jsonb,
    '[]'::jsonb,
    false,
    true,
    78.0, 'ACCEPTABLE', '{"hash_integrity": 20, "physical_features": 8, "digital_features": 16, "metadata": 14, "blockchain": 10}'::jsonb,
    'bc_tx_2b3c4d5e6f7g8h9i0j1k', '2025-10-07T14:20:00Z',
    'OFFICER-002', NOW() - INTERVAL '3 days', 'Missing hologram but other features verified.',
    false
) ON CONFLICT (document_id) DO NOTHING;

-- Document 3: SUSPICIOUS - Some anomalies detected
INSERT INTO ocr.document_security (
    document_id, file_hash_sha256, file_hash_sha512, original_hash, hash_verified,
    watermark_detected, watermark_confidence,
    qr_code_detected, qr_code_verified,
    barcode_detected, barcode_verified,
    digital_signature_present, digital_signature_valid,
    exif_data, exif_anomalies, exif_tampering_detected,
    file_format_valid,
    security_score, security_status, score_breakdown,
    blockchain_tx_id, blockchain_timestamp,
    flagged, flag_reason
) VALUES (
    'TEST-DOC-005',
    'c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6a7b8c9d0e1f2g3h4',
    'h4g3f2e1d0c9b8a7z6y5x4w3v2u1t0s9r8q7p6o5n4m3l2k1j0i9h8g7f6e5d4c3',
    'g0f9e8d7c6b5a4z3y2x1w0v9u8t7s6r5',
    true,
    true, 45.0,
    true, false,
    false, false,
    true, false,
    '{"Make": "Unknown", "Model": "Scanner", "DateTime": "2025:12:31 23:59:59", "Software": "GIMP 2.10"}'::jsonb,
    '[{"type": "FUTURE_DATE", "severity": "HIGH", "description": "Document creation date is in the future"}]'::jsonb,
    true,
    true,
    55.0, 'SUSPICIOUS', '{"hash_integrity": 20, "physical_features": 4, "digital_features": 1, "metadata": 0, "blockchain": 10, "penalties": -8}'::jsonb,
    'bc_tx_5c6d7e8f9g0h1i2j3k4l', '2025-10-10T08:15:00Z',
    true, 'Future date in EXIF metadata detected. Possible tampering.'
) ON CONFLICT (document_id) DO NOTHING;

-- Document 4: COMPROMISED - Multiple security failures
INSERT INTO ocr.document_security (
    document_id, file_hash_sha256, file_hash_sha512, original_hash, hash_verified,
    watermark_detected, hologram_detected, microprinting_detected,
    qr_code_detected, barcode_detected,
    digital_signature_present, digital_signature_valid,
    exif_data, exif_anomalies, exif_tampering_detected,
    file_format_valid, file_format_details,
    security_score, security_status, security_flags, score_breakdown,
    blockchain_tx_id, blockchain_timestamp,
    verified_by, verification_timestamp, officer_notes,
    flagged, flag_reason
) VALUES (
    'TEST-DOC-007',
    'd4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6a7b8c9d0e1f2g3h4i5',
    'i5h4g3f2e1d0c9b8a7z6y5x4w3v2u1t0s9r8q7p6o5n4m3l2k1j0i9h8g7f6e5d4',
    'h0g9f8e7d6c5b4a3z2y1x0w9v8u7t6s5',
    false,
    false, false, false,
    false, false,
    false, false,
    '{"Software": "Photoshop CS6", "ModifyDate": "2025:10:09 22:00:00"}'::jsonb,
    '[{"type": "METADATA", "severity": "CRITICAL"}, {"type": "FORMAT", "severity": "HIGH"}]'::jsonb,
    true,
    false, '{"suspicious_elements": true, "embedded_scripts": true}'::jsonb,
    25.0, 'COMPROMISED', '[{"type": "MISSING_FEATURES", "count": 8}, {"type": "HASH_MISMATCH", "critical": true}]'::jsonb,
    '{"hash_integrity": 0, "physical_features": 0, "digital_features": 0, "metadata": 0, "blockchain": 10, "penalties": -15}'::jsonb,
    'bc_tx_7d8e9f0g1h2i3j4k5l6m', '2025-10-11T06:45:00Z',
    'OFFICER-003', NOW() - INTERVAL '5 hours', 'REJECTED: No security features detected. File appears to be tampered.',
    true, 'Multiple critical security failures. Hash verification failed. Document rejected.'
) ON CONFLICT (document_id) DO NOTHING;

-- Documents 6, 8, 9, 10: Various test scenarios
INSERT INTO ocr.document_security (
    document_id, file_hash_sha256, file_hash_sha512, original_hash, hash_verified,
    watermark_detected, watermark_confidence,
    qr_code_detected, qr_code_content, qr_code_verified, qr_code_details,
    barcode_detected, barcode_content, barcode_verified, barcode_details,
    security_score, security_status, score_breakdown,
    blockchain_tx_id, blockchain_timestamp,
    flagged
) VALUES
-- Document 6: High security score
('TEST-DOC-006', 'e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6a7b8c9d0e1f2g3h4i5j6',
 'j6i5h4g3f2e1d0c9b8a7z6y5x4w3v2u1t0s9r8q7p6o5n4m3l2k1j0i9h8g7f6e5',
 'i0h9g8f7e6d5c4b3a2z1y0x9w8v7u6t5', true,
 true, 92.0,
 true, 'https://verify.zra.gov.zm/doc/TEST-DOC-006', true, '{"version": "2.0", "valid": true}'::jsonb,
 true, '987654321098', true, '{"type": "EAN-13", "valid": true}'::jsonb,
 95.0, 'SECURE', '{"hash_integrity": 20, "physical_features": 25, "digital_features": 23, "metadata": 17, "blockchain": 10}'::jsonb,
 'bc_tx_6d7e8f9g0h1i2j3k4l5m', '2025-10-11T00:30:00Z',
 false),

-- Document 8: Barcode focused
('TEST-DOC-008', 'f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6a7b8c9d0e1f2g3h4i5j6k7',
 'k7j6i5h4g3f2e1d0c9b8a7z6y5x4w3v2u1t0s9r8q7p6o5n4m3l2k1j0i9h8g7f6',
 'j0i9h8g7f6e5d4c3b2a1z0y9x8w7v6u5', true,
 false, 0,
 false, NULL, false, '{}'::jsonb,
 true, 'CODE128-ZRA-2025-ABC123', true, '{"type": "CODE128", "format": "custom", "valid": true}'::jsonb,
 72.0, 'ACCEPTABLE', '{"hash_integrity": 20, "physical_features": 0, "digital_features": 16, "metadata": 16, "blockchain": 10}'::jsonb,
 'bc_tx_8e9f0g1h2i3j4k5l6m7n', '2025-10-11T08:45:00Z',
 false),

-- Document 9: QR code focused
('TEST-DOC-009', 'g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6a7b8c9d0e1f2g3h4i5j6k7l8',
 'l8k7j6i5h4g3f2e1d0c9b8a7z6y5x4w3v2u1t0s9r8q7p6o5n4m3l2k1j0i9h8g7',
 'k0j9i8h7g6f5e4d3c2b1a0z9y8x7w6v5', true,
 false, 0,
 true, '{"doc_id": "TEST-DOC-009", "verified": true, "issuer": "ZRA"}', true, '{"version": "2.0", "error_correction": "H", "valid": true}'::jsonb,
 false, NULL, false, '{}'::jsonb,
 76.0, 'ACCEPTABLE', '{"hash_integrity": 20, "physical_features": 0, "digital_features": 20, "metadata": 16, "blockchain": 10}'::jsonb,
 'bc_tx_9f0g1h2i3j4k5l6m7n8o', '2025-10-11T10:15:00Z',
 false),

-- Document 10: Watermark focused
('TEST-DOC-010', 'h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6a7b8c9d0e1f2g3h4i5j6k7l8m9',
 'm9l8k7j6i5h4g3f2e1d0c9b8a7z6y5x4w3v2u1t0s9r8q7p6o5n4m3l2k1j0i9h8',
 'l0k9j8i7h6g5f4e3d2c1b0a9z8y7x6w5', true,
 true, 98.0,
 false, NULL, false, '{}'::jsonb,
 false, NULL, false, '{}'::jsonb,
 74.0, 'ACCEPTABLE', '{"hash_integrity": 20, "physical_features": 20, "digital_features": 0, "metadata": 14, "blockchain": 10}'::jsonb,
 'bc_tx_0g1h2i3j4k5l6m7n8o9p', '2025-10-11T11:00:00Z',
 false)
ON CONFLICT (document_id) DO NOTHING;

-- =====================================================
-- 3. Insert Anomalies (ocr.anomaly_detection)
-- =====================================================

INSERT INTO ocr.anomaly_detection (
    document_id, anomaly_type, anomaly_description, confidence_score,
    severity, detection_method, detection_details, false_positive, resolved
) VALUES
-- Anomalies for TEST-DOC-005 (suspicious document)
('TEST-DOC-005', 'EXIF', 'Document creation date is in the future (2025-12-31)', 95.0,
 'HIGH', 'EXIF_ANALYSIS', '{"field": "DateTime", "value": "2025:12:31 23:59:59", "current_date": "2025-10-11"}'::jsonb,
 false, false),

('TEST-DOC-005', 'METADATA', 'Image editing software detected in EXIF (GIMP)', 85.0,
 'MEDIUM', 'EXIF_ANALYSIS', '{"field": "Software", "value": "GIMP 2.10", "suspicious": true}'::jsonb,
 false, false),

('TEST-DOC-005', 'CONTENT', 'Watermark confidence below threshold', 75.0,
 'MEDIUM', 'AI', '{"confidence": 45.0, "threshold": 70.0, "feature": "watermark"}'::jsonb,
 false, false),

-- Anomalies for TEST-DOC-007 (compromised document)
('TEST-DOC-007', 'FORMAT', 'Suspicious PDF structure detected', 92.0,
 'CRITICAL', 'RULE_BASED', '{"embedded_scripts": true, "suspicious_objects": 3}'::jsonb,
 false, false),

('TEST-DOC-007', 'CONTENT', 'Hash verification failed', 100.0,
 'CRITICAL', 'RULE_BASED', '{"expected_hash": "different", "actual_hash": "h0g9f8e7..."}'::jsonb,
 false, false),

('TEST-DOC-007', 'METADATA', 'Recent modification detected', 88.0,
 'HIGH', 'EXIF_ANALYSIS', '{"ModifyDate": "2025:10:09 22:00:00", "uploaded": "2025:10:11 06:45:00"}'::jsonb,
 false, false),

('TEST-DOC-007', 'BEHAVIOR', 'No security features detected', 95.0,
 'CRITICAL', 'STATISTICAL', '{"watermark": false, "hologram": false, "qr_code": false, "barcode": false}'::jsonb,
 false, false),

-- Some resolved anomalies for TEST-DOC-002
('TEST-DOC-002', 'CONTENT', 'Hologram not detected', 70.0,
 'LOW', 'AI', '{"feature": "hologram", "confidence": 0}'::jsonb,
 true, true),

('TEST-DOC-002', 'METADATA', 'Mobile device capture detected', 60.0,
 'LOW', 'EXIF_ANALYSIS', '{"device": "iPhone 12", "note": "Mobile captures are acceptable for receipts"}'::jsonb,
 true, true)
ON CONFLICT DO NOTHING;

-- Update resolved anomalies with resolution details
UPDATE ocr.anomaly_detection
SET resolved_by = 'OFFICER-002',
    resolved_at = NOW() - INTERVAL '3 days',
    resolution_notes = 'False positive - hologram not required for this document type.'
WHERE document_id = 'TEST-DOC-002' AND anomaly_type = 'CONTENT';

UPDATE ocr.anomaly_detection
SET resolved_by = 'OFFICER-002',
    resolved_at = NOW() - INTERVAL '3 days',
    resolution_notes = 'Acceptable - receipts captured with mobile devices are permitted.'
WHERE document_id = 'TEST-DOC-002' AND anomaly_type = 'METADATA';

-- =====================================================
-- 4. Insert Audit Log Entries (ocr.security_audit_log)
-- =====================================================

INSERT INTO ocr.security_audit_log (
    document_id, event_type, event_category, event_details, severity,
    officer_id, officer_name, ip_address, endpoint, http_method, timestamp
) VALUES
-- Scans
('TEST-DOC-001', 'SCAN', 'SECURITY_CHECK', '{"score": 98.5, "status": "SECURE"}'::jsonb, 'INFO',
 'OFFICER-001', 'John Mwansa', '192.168.1.100', '/api/security/scan/TEST-DOC-001', 'POST', NOW() - INTERVAL '5 days'),

('TEST-DOC-002', 'SCAN', 'SECURITY_CHECK', '{"score": 78.0, "status": "ACCEPTABLE"}'::jsonb, 'INFO',
 'OFFICER-002', 'Mary Banda', '192.168.1.101', '/api/security/scan/TEST-DOC-002', 'POST', NOW() - INTERVAL '4 days'),

('TEST-DOC-005', 'SCAN', 'SECURITY_CHECK', '{"score": 55.0, "status": "SUSPICIOUS"}'::jsonb, 'WARNING',
 'OFFICER-001', 'John Mwansa', '192.168.1.100', '/api/security/scan/TEST-DOC-005', 'POST', NOW() - INTERVAL '1 day'),

('TEST-DOC-007', 'SCAN', 'SECURITY_CHECK', '{"score": 25.0, "status": "COMPROMISED"}'::jsonb, 'CRITICAL',
 'OFFICER-003', 'Peter Phiri', '192.168.1.102', '/api/security/scan/TEST-DOC-007', 'POST', NOW() - INTERVAL '6 hours'),

-- Verifications
('TEST-DOC-001', 'APPROVE', 'OFFICER_ACTION', '{"action": "APPROVE", "notes": "All security features verified"}'::jsonb, 'INFO',
 'OFFICER-001', 'John Mwansa', '192.168.1.100', '/api/security/verify/TEST-DOC-001', 'POST', NOW() - INTERVAL '4 days'),

('TEST-DOC-002', 'APPROVE', 'OFFICER_ACTION', '{"action": "APPROVE", "notes": "Missing hologram but acceptable"}'::jsonb, 'INFO',
 'OFFICER-002', 'Mary Banda', '192.168.1.101', '/api/security/verify/TEST-DOC-002', 'POST', NOW() - INTERVAL '3 days'),

('TEST-DOC-007', 'REJECT', 'OFFICER_ACTION', '{"action": "REJECT", "notes": "Multiple security failures"}'::jsonb, 'WARNING',
 'OFFICER-003', 'Peter Phiri', '192.168.1.102', '/api/security/verify/TEST-DOC-007', 'POST', NOW() - INTERVAL '5 hours'),

-- Flags
('TEST-DOC-005', 'FLAG', 'OFFICER_ACTION', '{"reason": "Future date detected", "severity": "HIGH"}'::jsonb, 'WARNING',
 'OFFICER-001', 'John Mwansa', '192.168.1.100', '/api/security/flag/TEST-DOC-005', 'POST', NOW() - INTERVAL '1 day'),

('TEST-DOC-007', 'FLAG', 'OFFICER_ACTION', '{"reason": "Hash verification failed", "severity": "CRITICAL"}'::jsonb, 'CRITICAL',
 'OFFICER-003', 'Peter Phiri', '192.168.1.102', '/api/security/flag/TEST-DOC-007', 'POST', NOW() - INTERVAL '6 hours'),

-- Anomaly resolutions
('TEST-DOC-002', 'RESOLVE_ANOMALY', 'OFFICER_ACTION', '{"anomalyId": 8, "resolution": "FALSE_POSITIVE"}'::jsonb, 'INFO',
 'OFFICER-002', 'Mary Banda', '192.168.1.101', '/api/security/resolve-anomaly/8', 'POST', NOW() - INTERVAL '3 days'),

('TEST-DOC-002', 'RESOLVE_ANOMALY', 'OFFICER_ACTION', '{"anomalyId": 9, "resolution": "FALSE_POSITIVE"}'::jsonb, 'INFO',
 'OFFICER-002', 'Mary Banda', '192.168.1.101', '/api/security/resolve-anomaly/9', 'POST', NOW() - INTERVAL '3 days'),

-- Dashboard views
('', 'VIEW_DASHBOARD', 'ACCESS', '{"action": "dashboard_view"}'::jsonb, 'INFO',
 'OFFICER-001', 'John Mwansa', '192.168.1.100', '/api/security/dashboard', 'GET', NOW() - INTERVAL '2 hours'),

('', 'VIEW_DASHBOARD', 'ACCESS', '{"action": "dashboard_view"}'::jsonb, 'INFO',
 'OFFICER-002', 'Mary Banda', '192.168.1.101', '/api/security/dashboard', 'GET', NOW() - INTERVAL '1 hour')
ON CONFLICT DO NOTHING;

-- =====================================================
-- Verification & Statistics
-- =====================================================

-- Check inserted data
SELECT '=== MOCK DATA INSERTION SUMMARY ===' as status;

SELECT 'Documents inserted:' as metric, COUNT(*) as count FROM ocr.documents WHERE document_id LIKE 'TEST-%';
SELECT 'Security scans inserted:' as metric, COUNT(*) as count FROM ocr.document_security WHERE document_id LIKE 'TEST-%';
SELECT 'Anomalies inserted:' as metric, COUNT(*) as count FROM ocr.anomaly_detection WHERE document_id LIKE 'TEST-%';
SELECT 'Audit log entries inserted:' as metric, COUNT(*) as count FROM ocr.security_audit_log WHERE document_id LIKE 'TEST-%' OR document_id = '';

SELECT '=== SECURITY STATUS DISTRIBUTION ===' as status;
SELECT security_status, COUNT(*) as count
FROM ocr.document_security
WHERE document_id LIKE 'TEST-%'
GROUP BY security_status
ORDER BY count DESC;

SELECT '=== ANOMALY SEVERITY DISTRIBUTION ===' as status;
SELECT severity, COUNT(*) as count, COUNT(*) FILTER (WHERE resolved = true) as resolved
FROM ocr.anomaly_detection
WHERE document_id LIKE 'TEST-%'
GROUP BY severity
ORDER BY CASE severity
    WHEN 'CRITICAL' THEN 1
    WHEN 'HIGH' THEN 2
    WHEN 'MEDIUM' THEN 3
    WHEN 'LOW' THEN 4
END;

SELECT '✅ MOCK DATA INSERTION COMPLETE!' as status;
