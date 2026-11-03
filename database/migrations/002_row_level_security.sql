-- ==============================================================================
-- TrustTrace AI - Row Level Security (RLS) Policies (002_row_level_security.sql)
-- Target: Supabase / PostgreSQL
-- ==============================================================================

-- Enable RLS on core tables
ALTER TABLE shipments ENABLE ROW LEVEL SECURITY;
ALTER TABLE shipment_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE sensor_readings ENABLE ROW LEVEL SECURITY;
ALTER TABLE prediction_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE verification_records ENABLE ROW LEVEL SECURITY;

-- 1. Shipments Policies
-- Admins and Auditors have unrestricted read access
CREATE POLICY "Admins and Auditors full read" ON shipments
    FOR SELECT
    USING (
        auth.jwt() ->> 'role' IN ('Admin', 'Auditor')
    );

-- Organizations can only view their own shipments
CREATE POLICY "Organizations can view own shipments" ON shipments
    FOR SELECT
    USING (
        organization_id = (auth.jwt() ->> 'organization_id')
    );

-- Authorized carriers can update shipment status and telemetrics
CREATE POLICY "Carriers can update assigned shipments" ON shipments
    FOR UPDATE
    USING (
        carrier_id = (auth.jwt() ->> 'carrier_id')
        OR auth.jwt() ->> 'role' = 'Admin'
    );

-- 2. Shipment Events Policies
CREATE POLICY "Users can view events for accessible shipments" ON shipment_events
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM shipments s
            WHERE s.shipment_id = shipment_events.shipment_id
            AND (
                s.organization_id = (auth.jwt() ->> 'organization_id')
                OR auth.jwt() ->> 'role' IN ('Admin', 'Auditor')
            )
        )
    );

-- Authorized submitters can insert new events
CREATE POLICY "Authorized submitters can insert events" ON shipment_events
    FOR INSERT
    WITH CHECK (
        auth.jwt() ->> 'role' IN ('Admin', 'Carrier', 'Warehouse')
    );

-- 3. Sensor Readings Policies
CREATE POLICY "Users can view sensor telemetry for accessible shipments" ON sensor_readings
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM shipments s
            WHERE s.shipment_id = sensor_readings.shipment_id
            AND (
                s.organization_id = (auth.jwt() ->> 'organization_id')
                OR auth.jwt() ->> 'role' IN ('Admin', 'Auditor')
            )
        )
    );
