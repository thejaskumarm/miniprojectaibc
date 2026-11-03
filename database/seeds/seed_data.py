"""
TrustTrace AI - Database Seeder
Loads:
- Organizations & default RBAC profiles
- Master shipments (16,000 records)
- Sensor telemetry time-series (2,400 records)
- Shipment audit events (1,500 records)
- Anchors events to the cryptographic blockchain ledger
"""

import os
import pandas as pd
from datetime import datetime
from backend.core.database import SessionLocal, init_db, engine
from backend.models.db_models import (
    Base, Organization, UserProfile, Shipment, ShipmentEvent,
    SensorReading, PredictionRecord, VerificationRecord
)
from backend.core.auth import get_password_hash
from backend.services.blockchain_service import blockchain_service

def seed_database():
    print("Initializing TrustTrace database schema...")
    init_db()
    db = SessionLocal()

    try:
        # Check if already seeded
        existing_count = db.query(Shipment).count()
        if existing_count >= 16000:
            print(f"Database already seeded with {existing_count} shipments.")
            return

        print("Seeding Organizations and Profiles...")
        orgs = [
            Organization(id="ORG_GLOBAL_LOGISTICS", name="Global Intermodal Logistics Inc.", org_type="CARRIER"),
            Organization(id="ORG_PHARMA_SUPPLY", name="BioPharma Global Distribution", org_type="SUPPLIER"),
            Organization(id="ORG_AUDIT_VERIFY", name="International Supply Integrity Audit", org_type="AUDITOR")
        ]
        for org in orgs:
            if not db.query(Organization).filter_by(id=org.id).first():
                db.add(org)

        users = [
            UserProfile(
                id="USR_ADMIN",
                email="admin@trusttrace.ai",
                hashed_password=get_password_hash("AdminPass123!"),
                full_name="Sarah Chen (System Admin)",
                role="Admin",
                organization_id="ORG_AUDIT_VERIFY"
            ),
            UserProfile(
                id="USR_CARRIER",
                email="carrier@dhl.com",
                hashed_password=get_password_hash("CarrierPass123!"),
                full_name="Marcus Vance (Fleet Coordinator)",
                role="Carrier",
                organization_id="ORG_GLOBAL_LOGISTICS"
            ),
            UserProfile(
                id="USR_SUPPLIER",
                email="supplier@pfizer.com",
                hashed_password=get_password_hash("SupplierPass123!"),
                full_name="Dr. Elena Rostova (Cold Chain QA)",
                role="Supplier",
                organization_id="ORG_PHARMA_SUPPLY"
            ),
            UserProfile(
                id="USR_VIEWER",
                email="viewer@audit.org",
                hashed_password=get_password_hash("ViewerPass123!"),
                full_name="Alex Rivera (Compliance Auditor)",
                role="Viewer",
                organization_id="ORG_AUDIT_VERIFY"
            )
        ]
        for u in users:
            if not db.query(UserProfile).filter_by(email=u.email).first():
                db.add(u)
        db.commit()

        # Ingest 16,000 master shipments
        print("Ingesting 16,000 processed shipment records into database...")
        df_shipments = pd.read_csv("data/processed/shipments_master.csv")
        
        # Batch insert for high performance
        batch_size = 2000
        total_records = len(df_shipments)
        
        for i in range(0, total_records, batch_size):
            batch = df_shipments.iloc[i : i + batch_size].to_dict(orient="records")
            shipment_objs = []
            for r in batch:
                shipment_objs.append(Shipment(
                    shipment_id=r["shipment_id"],
                    product_category=r["product_category"],
                    transport_mode=r["transport_mode"],
                    origin=r["origin"],
                    destination=r["destination"],
                    distance_km=float(r["distance_km"]),
                    planned_dispatch_time=datetime.fromisoformat(r["planned_dispatch_time"]),
                    planned_delivery_time=datetime.fromisoformat(r["planned_delivery_time"]),
                    actual_delivery_time=datetime.fromisoformat(r["actual_delivery_time"]) if pd.notna(r["actual_delivery_time"]) else None,
                    carrier_id=r["carrier_id"],
                    supplier_id=r["supplier_id"],
                    weather_condition=r["weather_condition"],
                    traffic_index=float(r["traffic_index"]),
                    customs_delay_hours=float(r["customs_delay_hours"]),
                    ambient_temperature_c=float(r["ambient_temperature_c"]),
                    recorded_temperature_c=float(r["recorded_temperature_c"]),
                    target_temperature_min_c=float(r["target_temperature_min_c"]),
                    target_temperature_max_c=float(r["target_temperature_max_c"]),
                    temperature_excursion_duration=float(r["temperature_excursion_duration"]),
                    sensor_gap_duration=float(r["sensor_gap_duration"]),
                    shipment_status=r["shipment_status"],
                    delay_risk_label=int(r["delay_risk_label"]),
                    temperature_quality_risk_label=int(r["temperature_quality_risk_label"]),
                    data_provenance=r["data_provenance"],
                    source_dataset=r["source_dataset"],
                    organization_id="ORG_GLOBAL_LOGISTICS",
                    created_at=datetime.fromisoformat(r["created_at"]) if pd.notna(r["created_at"]) else datetime.utcnow(),
                    updated_at=datetime.fromisoformat(r["updated_at"]) if pd.notna(r["updated_at"]) else datetime.utcnow()
                ))
            db.bulk_save_objects(shipment_objs)
            db.commit()
            print(f"  Inserted {min(i + batch_size, total_records)} / {total_records} shipments...")

        # Ingest Telemetry
        print("Ingesting sensor telemetry logs...")
        df_telemetry = pd.read_csv("data/processed/sensor_telemetry.csv")
        telemetry_objs = []
        for r in df_telemetry.to_dict(orient="records"):
            telemetry_objs.append(SensorReading(
                reading_id=r["reading_id"],
                shipment_id=r["shipment_id"],
                timestamp=datetime.fromisoformat(r["timestamp"]),
                sensor_type=r["sensor_type"],
                temperature_c=float(r["temperature_c"]),
                ambient_temperature_c=float(r["ambient_temperature_c"]) if pd.notna(r["ambient_temperature_c"]) else None,
                humidity_pct=float(r["humidity_pct"]) if pd.notna(r["humidity_pct"]) else None,
                battery_pct=float(r["battery_pct"]) if pd.notna(r["battery_pct"]) else None,
                is_excursion=bool(r["is_excursion"])
            ))
        db.bulk_save_objects(telemetry_objs)
        db.commit()
        print(f"Inserted {len(telemetry_objs)} sensor telemetry logs.")

        # Ingest and Anchor Events
        print("Ingesting shipment audit events and anchoring to blockchain ledger...")
        df_events = pd.read_csv("data/processed/shipment_events.csv")
        event_records = df_events.to_dict(orient="records")
        event_objs = []
        
        for r in event_records:
            shipment_id = r["shipment_id"]
            event_id = r["event_id"]
            event_type = r["event_type"]
            location = r["location"]
            description = r["description"]
            submitter = r["submitter"]
            ts = r["timestamp"]

            payload = {
                "eventId": event_id,
                "shipmentId": shipment_id,
                "eventType": event_type,
                "location": location,
                "description": description,
                "submitter": submitter,
                "timestamp": ts
            }

            # Anchor in blockchain service
            anchor_res = blockchain_service.anchor_event(
                shipment_id=shipment_id,
                event_id=event_id,
                event_type=event_type,
                payload=payload,
                submitter=submitter,
                timestamp=ts
            )

            event_objs.append(ShipmentEvent(
                event_id=event_id,
                shipment_id=shipment_id,
                event_type=event_type,
                timestamp=datetime.fromisoformat(ts),
                location=location,
                description=description,
                submitter=submitter,
                payload_hash=anchor_res["keccak256_hash"],
                anchored_on_chain=True,
                blockchain_tx_hash=anchor_res["transaction_hash"]
            ))

        db.bulk_save_objects(event_objs)
        db.commit()
        print(f"Successfully anchored and stored {len(event_objs)} shipment audit events.")

        print("Database seeding completed successfully.")

    except Exception as e:
        db.rollback()
        print(f"Error during seeding: {e}")
        raise e
    finally:
        db.close()

if __name__ == "__main__":
    seed_database()
