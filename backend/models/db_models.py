"""
TrustTrace AI - SQLAlchemy Database Models
Maps:
- Organization & UserProfile (RBAC)
- Shipment & ShipmentEvent
- SensorReading (telemetry time-series)
- PredictionRecord (audit of ML inferences)
- ModelVersion & VerificationRecord
- AuditLog
"""

from datetime import datetime
from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, ForeignKey, Text, JSON
from sqlalchemy.orm import declarative_base, relationship

Base = declarative_base()

class Organization(Base):
    __tablename__ = "organizations"

    id = Column(String(50), primary_key=True)
    name = Column(String(100), nullable=False)
    org_type = Column(String(50), nullable=False) # SUPPLIER, CARRIER, WAREHOUSE, AUDITOR, ADMIN
    created_at = Column(DateTime, default=datetime.utcnow)

    users = relationship("UserProfile", back_populates="organization")
    shipments = relationship("Shipment", back_populates="organization")

class UserProfile(Base):
    __tablename__ = "profiles"

    id = Column(String(50), primary_key=True)
    email = Column(String(100), unique=True, nullable=False)
    hashed_password = Column(String(200), nullable=False)
    full_name = Column(String(100), nullable=False)
    role = Column(String(50), nullable=False, default="Viewer") # Admin, Supplier, Carrier, Warehouse, Viewer
    organization_id = Column(String(50), ForeignKey("organizations.id"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    organization = relationship("Organization", back_populates="users")

class Shipment(Base):
    __tablename__ = "shipments"

    shipment_id = Column(String(50), primary_key=True, index=True)
    product_category = Column(String(100), nullable=False, index=True)
    transport_mode = Column(String(50), nullable=False)
    origin = Column(String(100), nullable=False)
    destination = Column(String(100), nullable=False)
    distance_km = Column(Float, nullable=False)
    planned_dispatch_time = Column(DateTime, nullable=False)
    planned_delivery_time = Column(DateTime, nullable=False)
    actual_delivery_time = Column(DateTime, nullable=True)
    carrier_id = Column(String(100), nullable=False, index=True)
    supplier_id = Column(String(100), nullable=False, index=True)
    weather_condition = Column(String(100), nullable=False)
    traffic_index = Column(Float, nullable=False)
    customs_delay_hours = Column(Float, nullable=False)
    ambient_temperature_c = Column(Float, nullable=False)
    recorded_temperature_c = Column(Float, nullable=False)
    target_temperature_min_c = Column(Float, nullable=False)
    target_temperature_max_c = Column(Float, nullable=False)
    temperature_excursion_duration = Column(Float, default=0.0)
    sensor_gap_duration = Column(Float, default=0.0)
    shipment_status = Column(String(50), nullable=False, default="IN_TRANSIT", index=True) # DISPATCHED, IN_TRANSIT, CUSTOMS_HOLD, DELIVERED
    delay_risk_label = Column(Integer, nullable=False, index=True) # 0 or 1
    temperature_quality_risk_label = Column(Integer, nullable=False, index=True) # 0, 1, or 2
    data_provenance = Column(String(50), nullable=False, default="synthetic_simulated", index=True) # real_curated, synthetic_simulated
    source_dataset = Column(String(100), nullable=False)
    organization_id = Column(String(50), ForeignKey("organizations.id"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    organization = relationship("Organization", back_populates="shipments")
    events = relationship("ShipmentEvent", back_populates="shipment", cascade="all, delete-orphan")
    sensor_readings = relationship("SensorReading", back_populates="shipment", cascade="all, delete-orphan")
    predictions = relationship("PredictionRecord", back_populates="shipment", cascade="all, delete-orphan")
    verifications = relationship("VerificationRecord", back_populates="shipment", cascade="all, delete-orphan")

class ShipmentEvent(Base):
    __tablename__ = "shipment_events"

    event_id = Column(String(60), primary_key=True)
    shipment_id = Column(String(50), ForeignKey("shipments.shipment_id"), nullable=False, index=True)
    event_type = Column(String(50), nullable=False) # DISPATCHED, IN_TRANSIT, CUSTOMS_CLEARANCE, COLD_STORAGE_TRANSFER, DELIVERED
    timestamp = Column(DateTime, nullable=False)
    location = Column(String(100), nullable=False)
    description = Column(Text, nullable=False)
    submitter = Column(String(100), nullable=False)
    payload_hash = Column(String(100), nullable=True)
    anchored_on_chain = Column(Boolean, default=False)
    blockchain_tx_hash = Column(String(100), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    shipment = relationship("Shipment", back_populates="events")

class SensorReading(Base):
    __tablename__ = "sensor_readings"

    reading_id = Column(String(60), primary_key=True)
    shipment_id = Column(String(50), ForeignKey("shipments.shipment_id"), nullable=False, index=True)
    timestamp = Column(DateTime, nullable=False, index=True)
    sensor_type = Column(String(50), default="COLD_CHAIN_LOGGER")
    temperature_c = Column(Float, nullable=False)
    ambient_temperature_c = Column(Float, nullable=True)
    humidity_pct = Column(Float, nullable=True)
    battery_pct = Column(Float, nullable=True)
    is_excursion = Column(Boolean, default=False)

    shipment = relationship("Shipment", back_populates="sensor_readings")

class PredictionRecord(Base):
    __tablename__ = "prediction_records"

    id = Column(Integer, primary_key=True, autoincrement=True)
    shipment_id = Column(String(50), ForeignKey("shipments.shipment_id"), nullable=True, index=True)
    prediction_type = Column(String(50), nullable=False) # DELAY_RISK, TEMPERATURE_RISK
    predicted_class = Column(Integer, nullable=False)
    risk_score = Column(Float, nullable=False)
    threshold_used = Column(Float, nullable=False)
    model_version = Column(String(50), nullable=False)
    input_features = Column(JSON, nullable=False)
    contributing_factors = Column(JSON, nullable=True)
    provenance = Column(String(50), default="synthetic_simulated")
    created_at = Column(DateTime, default=datetime.utcnow)

    shipment = relationship("Shipment", back_populates="predictions")

class VerificationRecord(Base):
    __tablename__ = "verification_records"

    id = Column(Integer, primary_key=True, autoincrement=True)
    shipment_id = Column(String(50), ForeignKey("shipments.shipment_id"), nullable=False, index=True)
    event_id = Column(String(60), nullable=False)
    is_valid = Column(Boolean, nullable=False)
    status = Column(String(50), nullable=False) # VERIFIED_AUTHENTIC, TAMPERING_DETECTED
    anchored_hash = Column(String(100), nullable=False)
    computed_hash = Column(String(100), nullable=False)
    tampered_fields = Column(JSON, nullable=True)
    verified_at = Column(DateTime, default=datetime.utcnow)
    verifier_address = Column(String(100), nullable=True)

    shipment = relationship("Shipment", back_populates="verifications")

class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, autoincrement=True)
    action = Column(String(100), nullable=False)
    entity_type = Column(String(50), nullable=False)
    entity_id = Column(String(100), nullable=False)
    actor_id = Column(String(50), nullable=False)
    details = Column(JSON, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
