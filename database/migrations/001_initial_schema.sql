-- ==============================================================================
-- TrustTrace AI - Initial Schema Migration (001_initial_schema.sql)
-- Target: Supabase / PostgreSQL / Standard SQL
-- ==============================================================================

CREATE TABLE IF NOT EXISTS organizations (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    org_type VARCHAR(50) NOT NULL, -- SUPPLIER, CARRIER, WAREHOUSE, AUDITOR, ADMIN
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS profiles (
    id VARCHAR(50) PRIMARY KEY,
    email VARCHAR(100) UNIQUE NOT NULL,
    hashed_password VARCHAR(200) NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'Viewer', -- Admin, Supplier, Carrier, Warehouse, Viewer
    organization_id VARCHAR(50) REFERENCES organizations(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS shipments (
    shipment_id VARCHAR(50) PRIMARY KEY,
    product_category VARCHAR(100) NOT NULL,
    transport_mode VARCHAR(50) NOT NULL,
    origin VARCHAR(100) NOT NULL,
    destination VARCHAR(100) NOT NULL,
    distance_km DOUBLE PRECISION NOT NULL,
    planned_dispatch_time TIMESTAMP WITH TIME ZONE NOT NULL,
    planned_delivery_time TIMESTAMP WITH TIME ZONE NOT NULL,
    actual_delivery_time TIMESTAMP WITH TIME ZONE,
    carrier_id VARCHAR(100) NOT NULL,
    supplier_id VARCHAR(100) NOT NULL,
    weather_condition VARCHAR(100) NOT NULL,
    traffic_index DOUBLE PRECISION NOT NULL,
    customs_delay_hours DOUBLE PRECISION NOT NULL,
    ambient_temperature_c DOUBLE PRECISION NOT NULL,
    recorded_temperature_c DOUBLE PRECISION NOT NULL,
    target_temperature_min_c DOUBLE PRECISION NOT NULL,
    target_temperature_max_c DOUBLE PRECISION NOT NULL,
    temperature_excursion_duration DOUBLE PRECISION DEFAULT 0.0,
    sensor_gap_duration DOUBLE PRECISION DEFAULT 0.0,
    shipment_status VARCHAR(50) NOT NULL DEFAULT 'IN_TRANSIT',
    delay_risk_label INTEGER NOT NULL,
    temperature_quality_risk_label INTEGER NOT NULL,
    data_provenance VARCHAR(50) NOT NULL DEFAULT 'synthetic_simulated',
    source_dataset VARCHAR(100) NOT NULL,
    organization_id VARCHAR(50) REFERENCES organizations(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_shipments_status ON shipments(shipment_status);
CREATE INDEX IF NOT EXISTS idx_shipments_category ON shipments(product_category);
CREATE INDEX IF NOT EXISTS idx_shipments_carrier ON shipments(carrier_id);
CREATE INDEX IF NOT EXISTS idx_shipments_provenance ON shipments(data_provenance);

CREATE TABLE IF NOT EXISTS shipment_events (
    event_id VARCHAR(60) PRIMARY KEY,
    shipment_id VARCHAR(50) NOT NULL REFERENCES shipments(shipment_id) ON DELETE CASCADE,
    event_type VARCHAR(50) NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
    location VARCHAR(100) NOT NULL,
    description TEXT NOT NULL,
    submitter VARCHAR(100) NOT NULL,
    payload_hash VARCHAR(100),
    anchored_on_chain BOOLEAN DEFAULT FALSE,
    blockchain_tx_hash VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_events_shipment ON shipment_events(shipment_id);

CREATE TABLE IF NOT EXISTS sensor_readings (
    reading_id VARCHAR(60) PRIMARY KEY,
    shipment_id VARCHAR(50) NOT NULL REFERENCES shipments(shipment_id) ON DELETE CASCADE,
    timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
    sensor_type VARCHAR(50) DEFAULT 'COLD_CHAIN_LOGGER',
    temperature_c DOUBLE PRECISION NOT NULL,
    ambient_temperature_c DOUBLE PRECISION,
    humidity_pct DOUBLE PRECISION,
    battery_pct DOUBLE PRECISION,
    is_excursion BOOLEAN DEFAULT FALSE
);

CREATE INDEX IF NOT EXISTS idx_readings_shipment_time ON sensor_readings(shipment_id, timestamp);

CREATE TABLE IF NOT EXISTS prediction_records (
    id SERIAL PRIMARY KEY,
    shipment_id VARCHAR(50) REFERENCES shipments(shipment_id) ON DELETE SET NULL,
    prediction_type VARCHAR(50) NOT NULL,
    predicted_class INTEGER NOT NULL,
    risk_score DOUBLE PRECISION NOT NULL,
    threshold_used DOUBLE PRECISION NOT NULL,
    model_version VARCHAR(50) NOT NULL,
    input_features JSONB NOT NULL,
    contributing_factors JSONB,
    provenance VARCHAR(50) DEFAULT 'synthetic_simulated',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS verification_records (
    id SERIAL PRIMARY KEY,
    shipment_id VARCHAR(50) NOT NULL REFERENCES shipments(shipment_id) ON DELETE CASCADE,
    event_id VARCHAR(60) NOT NULL,
    is_valid BOOLEAN NOT NULL,
    status VARCHAR(50) NOT NULL,
    anchored_hash VARCHAR(100) NOT NULL,
    computed_hash VARCHAR(100) NOT NULL,
    tampered_fields JSONB,
    verified_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    verifier_address VARCHAR(100)
);

CREATE TABLE IF NOT EXISTS audit_logs (
    id SERIAL PRIMARY KEY,
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(50) NOT NULL,
    entity_id VARCHAR(100) NOT NULL,
    actor_id VARCHAR(50) NOT NULL,
    details JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
