-- TaxGuard Blockchain Database Schema
-- PostgreSQL Database for persistent blockchain storage

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Blocks Table - Store all blockchain blocks
CREATE TABLE IF NOT EXISTS blocks (
    id SERIAL PRIMARY KEY,
    block_index INTEGER UNIQUE NOT NULL,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    previous_hash VARCHAR(64) NOT NULL,
    hash VARCHAR(64) UNIQUE NOT NULL,
    data JSONB NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create index for faster block lookups
CREATE INDEX IF NOT EXISTS idx_blocks_hash ON blocks(hash);
CREATE INDEX IF NOT EXISTS idx_blocks_index ON blocks(block_index);
CREATE INDEX IF NOT EXISTS idx_blocks_timestamp ON blocks(timestamp);

-- 2. Events Table - Store all blockchain events
CREATE TABLE IF NOT EXISTS events (
    id SERIAL PRIMARY KEY,
    event_id VARCHAR(100) UNIQUE NOT NULL,
    event_type VARCHAR(50) NOT NULL,
    timestamp TIMESTAMPTZ NOT NULL,
    anonymized_user_id VARCHAR(200) NOT NULL,
    hash_of_payload VARCHAR(64) NOT NULL,
    notes TEXT,
    block_index INTEGER REFERENCES blocks(block_index) ON DELETE CASCADE,
    metadata JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for faster event lookups
CREATE INDEX IF NOT EXISTS idx_events_event_id ON events(event_id);
CREATE INDEX IF NOT EXISTS idx_events_type ON events(event_type);
CREATE INDEX IF NOT EXISTS idx_events_user ON events(anonymized_user_id);
CREATE INDEX IF NOT EXISTS idx_events_timestamp ON events(timestamp);
CREATE INDEX IF NOT EXISTS idx_events_block_index ON events(block_index);

-- 3. GhostBuster Detections Table
CREATE TABLE IF NOT EXISTS ghostbuster_detections (
    id SERIAL PRIMARY KEY,
    detection_id VARCHAR(100) UNIQUE NOT NULL,
    event_id VARCHAR(100) REFERENCES events(event_id) ON DELETE CASCADE,
    detection_type VARCHAR(50) NOT NULL, -- phantom_employee, ghost_company
    entity_id VARCHAR(200) NOT NULL,
    confidence_score INTEGER CHECK (confidence_score >= 0 AND confidence_score <= 100),
    detection_method VARCHAR(100),
    indicators JSONB,
    severity VARCHAR(20) CHECK (severity IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),
    investigator_id VARCHAR(100),
    evidence_hash VARCHAR(64) NOT NULL,
    review_status VARCHAR(50) DEFAULT 'pending',
    metadata JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ghostbuster_entity ON ghostbuster_detections(entity_id);
CREATE INDEX IF NOT EXISTS idx_ghostbuster_type ON ghostbuster_detections(detection_type);
CREATE INDEX IF NOT EXISTS idx_ghostbuster_severity ON ghostbuster_detections(severity);

-- 4. WhistlePro Reports Table
CREATE TABLE IF NOT EXISTS whistlepro_reports (
    id SERIAL PRIMARY KEY,
    report_id VARCHAR(100) UNIQUE NOT NULL,
    case_code VARCHAR(50) UNIQUE NOT NULL,
    event_id VARCHAR(100) REFERENCES events(event_id) ON DELETE CASCADE,
    report_type VARCHAR(50) NOT NULL, -- tax_evasion, fraud, corruption, money_laundering
    target_entity VARCHAR(200),
    severity VARCHAR(20) CHECK (severity IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),
    description_encrypted TEXT,
    evidence_hash VARCHAR(64) NOT NULL,
    estimated_amount DECIMAL(15, 2),
    location VARCHAR(200),
    whistleblower_key TEXT,
    review_status VARCHAR(50) DEFAULT 'submitted',
    priority VARCHAR(20) DEFAULT 'MEDIUM',
    assigned_to VARCHAR(100),
    metadata JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_whistlepro_case ON whistlepro_reports(case_code);
CREATE INDEX IF NOT EXISTS idx_whistlepro_type ON whistlepro_reports(report_type);
CREATE INDEX IF NOT EXISTS idx_whistlepro_severity ON whistlepro_reports(severity);

-- 5. AI Risk Assessments Table
CREATE TABLE IF NOT EXISTS ai_risk_assessments (
    id SERIAL PRIMARY KEY,
    assessment_id VARCHAR(100) UNIQUE NOT NULL,
    event_id VARCHAR(100) REFERENCES events(event_id) ON DELETE CASCADE,
    taxpayer_id VARCHAR(200) NOT NULL,
    risk_score INTEGER CHECK (risk_score >= 0 AND risk_score <= 100),
    risk_level VARCHAR(20) CHECK (risk_level IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),
    model_version VARCHAR(50),
    features JSONB,
    predictions JSONB,
    confidence INTEGER CHECK (confidence >= 0 AND confidence <= 100),
    risk_factors JSONB,
    recommendations JSONB,
    data_hash VARCHAR(64) NOT NULL,
    metadata JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ai_risk_taxpayer ON ai_risk_assessments(taxpayer_id);
CREATE INDEX IF NOT EXISTS idx_ai_risk_level ON ai_risk_assessments(risk_level);
CREATE INDEX IF NOT EXISTS idx_ai_risk_score ON ai_risk_assessments(risk_score);

-- 6. Predictive Forecasts Table
CREATE TABLE IF NOT EXISTS predictive_forecasts (
    id SERIAL PRIMARY KEY,
    forecast_id VARCHAR(100) UNIQUE NOT NULL,
    event_id VARCHAR(100) REFERENCES events(event_id) ON DELETE CASCADE,
    forecast_type VARCHAR(50) NOT NULL, -- revenue, compliance, etc.
    target_entity VARCHAR(200),
    timeframe VARCHAR(50),
    prediction JSONB NOT NULL,
    confidence INTEGER CHECK (confidence >= 0 AND confidence <= 100),
    methodology VARCHAR(200),
    factors JSONB,
    historical_data_hash VARCHAR(64),
    model_version VARCHAR(50),
    actual_outcome JSONB,
    accuracy DECIMAL(5, 2),
    verified_at TIMESTAMPTZ,
    metadata JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_forecast_type ON predictive_forecasts(forecast_type);
CREATE INDEX IF NOT EXISTS idx_forecast_entity ON predictive_forecasts(target_entity);

-- 7. Update Tracking Table (for whistlepro case updates)
CREATE TABLE IF NOT EXISTS case_updates (
    id SERIAL PRIMARY KEY,
    report_id VARCHAR(100) REFERENCES whistlepro_reports(report_id) ON DELETE CASCADE,
    update_type VARCHAR(50),
    public_update TEXT,
    internal_notes TEXT,
    updated_by VARCHAR(100),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_case_updates_report ON case_updates(report_id);

-- 8. Blockchain Stats View for quick analytics
CREATE OR REPLACE VIEW blockchain_stats AS
SELECT
    (SELECT COUNT(*) FROM blocks) as total_blocks,
    (SELECT COUNT(*) FROM events) as total_events,
    (SELECT COUNT(*) FROM events WHERE timestamp >= NOW() - INTERVAL '24 hours') as events_last_24h,
    (SELECT COUNT(*) FROM events WHERE timestamp >= NOW() - INTERVAL '1 hour') as events_last_hour,
    (SELECT COUNT(*) FROM ghostbuster_detections) as total_detections,
    (SELECT COUNT(*) FROM whistlepro_reports) as total_reports,
    (SELECT COUNT(*) FROM ai_risk_assessments) as total_assessments,
    (SELECT COUNT(*) FROM predictive_forecasts) as total_forecasts;

-- 9. Event Type Stats View
CREATE OR REPLACE VIEW event_type_stats AS
SELECT
    event_type,
    COUNT(*) as count,
    MAX(timestamp) as latest_event
FROM events
GROUP BY event_type
ORDER BY count DESC;

-- 10. Module Activity View
CREATE OR REPLACE VIEW module_activity AS
SELECT
    'ghostbuster' as module,
    COUNT(*) as total,
    COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '24 hours') as last_24h
FROM ghostbuster_detections
UNION ALL
SELECT
    'whistlepro' as module,
    COUNT(*) as total,
    COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '24 hours') as last_24h
FROM whistlepro_reports
UNION ALL
SELECT
    'ai_risk' as module,
    COUNT(*) as total,
    COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '24 hours') as last_24h
FROM ai_risk_assessments
UNION ALL
SELECT
    'predictive' as module,
    COUNT(*) as total,
    COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '24 hours') as last_24h
FROM predictive_forecasts;

-- Create a function to automatically update timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for whistlepro_reports
CREATE TRIGGER update_whistlepro_reports_updated_at BEFORE UPDATE
    ON whistlepro_reports FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Insert genesis block if not exists
INSERT INTO blocks (block_index, timestamp, previous_hash, hash, data)
VALUES (
    0,
    NOW(),
    '0',
    'genesis_hash_0000000000000000000000000000000000000000000000000000000',
    '{"message": "Genesis Block - TaxGuard AI Blockchain", "system": "TaxGuard"}'::jsonb
) ON CONFLICT (block_index) DO NOTHING;

-- Grant permissions (adjust for your user)
-- GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO postgres;
-- GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO postgres;

COMMENT ON TABLE blocks IS 'Stores all blockchain blocks with hash chain integrity';
COMMENT ON TABLE events IS 'Stores all blockchain events from all modules';
COMMENT ON TABLE ghostbuster_detections IS 'Stores GhostBuster phantom employee/company detections';
COMMENT ON TABLE whistlepro_reports IS 'Stores WhistlePro anonymous whistleblower reports';
COMMENT ON TABLE ai_risk_assessments IS 'Stores AI-generated risk assessments';
COMMENT ON TABLE predictive_forecasts IS 'Stores predictive analytics forecasts';
COMMENT ON TABLE case_updates IS 'Tracks updates to whistleblower cases';

-- Success message
SELECT 'TaxGuard Blockchain Database Schema Created Successfully!' as message;
