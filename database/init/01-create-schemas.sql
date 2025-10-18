-- ========================================
-- ZRA TAXGUARD UNIFIED DATABASE
-- Single database for all modules
-- ========================================

-- Create all module schemas
CREATE SCHEMA IF NOT EXISTS ocr;
CREATE SCHEMA IF NOT EXISTS whistlepro;
CREATE SCHEMA IF NOT EXISTS ghostbuster;
CREATE SCHEMA IF NOT EXISTS risk;
CREATE SCHEMA IF NOT EXISTS compliance;
CREATE SCHEMA IF NOT EXISTS audit;
CREATE SCHEMA IF NOT EXISTS blockchain;

-- Grant permissions
GRANT ALL PRIVILEGES ON SCHEMA ocr TO postgres;
GRANT ALL PRIVILEGES ON SCHEMA whistlepro TO postgres;
GRANT ALL PRIVILEGES ON SCHEMA ghostbuster TO postgres;
GRANT ALL PRIVILEGES ON SCHEMA risk TO postgres;
GRANT ALL PRIVILEGES ON SCHEMA compliance TO postgres;
GRANT ALL PRIVILEGES ON SCHEMA audit TO postgres;
GRANT ALL PRIVILEGES ON SCHEMA blockchain TO postgres;

COMMENT ON SCHEMA ocr IS 'OCR document processing and verification';
COMMENT ON SCHEMA whistlepro IS 'Whistleblower anonymous reporting system';
COMMENT ON SCHEMA ghostbuster IS 'Ghost employee and phantom company detection';
COMMENT ON SCHEMA risk IS 'AI risk scoring and analytics';
COMMENT ON SCHEMA compliance IS 'Tax compliance checks and triggers';
COMMENT ON SCHEMA audit IS 'System-wide audit logging';
COMMENT ON SCHEMA blockchain IS 'Blockchain integration and verification';
