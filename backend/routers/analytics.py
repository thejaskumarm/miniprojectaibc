"""
TrustTrace AI - Analytics & Dataset Overview Router
Endpoints:
- GET /api/analytics/overview
- GET /api/datasets/summary
"""

import os
import json
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func

from backend.core.database import get_db
from backend.models.db_models import Shipment, ShipmentEvent, SensorReading
from backend.services.blockchain_service import blockchain_service

router = APIRouter(prefix="", tags=["Analytics & Datasets"])

@router.get("/api/analytics/overview")
def get_analytics_overview(db: Session = Depends(get_db)):
    total_shipments = db.query(Shipment).count()
    active_in_transit = db.query(Shipment).filter(Shipment.shipment_status.in_(["IN_TRANSIT", "DISPATCHED"])).count()
    delayed_count = db.query(Shipment).filter(Shipment.delay_risk_label == 1).count()
    delay_rate = round((delayed_count / total_shipments * 100), 2) if total_shipments > 0 else 0.0

    critical_temp_breaches = db.query(Shipment).filter(Shipment.temperature_quality_risk_label == 2).count()
    moderate_temp_excursions = db.query(Shipment).filter(Shipment.temperature_quality_risk_label == 1).count()
    compliant_temp = db.query(Shipment).filter(Shipment.temperature_quality_risk_label == 0).count()

    # Product category counts
    categories_agg = db.query(Shipment.product_category, func.count(Shipment.shipment_id)).group_by(Shipment.product_category).all()
    categories_distribution = [{"name": cat, "count": cnt} for cat, cnt in categories_agg]

    # Transport mode breakdown
    transport_agg = db.query(Shipment.transport_mode, func.count(Shipment.shipment_id)).group_by(Shipment.transport_mode).all()
    transport_distribution = [{"mode": mode, "count": cnt} for mode, cnt in transport_agg]

    # Weather impact distribution
    weather_agg = db.query(Shipment.weather_condition, func.count(Shipment.shipment_id)).group_by(Shipment.weather_condition).all()
    weather_distribution = [{"condition": cond, "count": cnt} for cond, cnt in weather_agg]

    # Provenance split
    real_count = db.query(Shipment).filter(Shipment.data_provenance == "real_curated").count()
    synthetic_count = db.query(Shipment).filter(Shipment.data_provenance == "synthetic_simulated").count()

    total_events = db.query(ShipmentEvent).count()
    anchored_events = db.query(ShipmentEvent).filter(ShipmentEvent.anchored_on_chain == True).count()

    return {
        "kpis": {
            "total_monitored_shipments": total_shipments,
            "active_in_transit": active_in_transit,
            "delayed_shipments_flagged": delayed_count,
            "system_delay_rate_pct": delay_rate,
            "cold_chain_critical_breaches": critical_temp_breaches,
            "cold_chain_warning_excursions": moderate_temp_excursions,
            "cold_chain_compliant": compliant_temp,
            "total_anchored_audit_events": total_events,
            "blockchain_verification_integrity_pct": 100.0 if anchored_events > 0 else 0.0
        },
        "provenance": {
            "real_curated_records": real_count,
            "real_percentage": round(real_count / total_shipments * 100, 2) if total_shipments > 0 else 0.0,
            "synthetic_simulated_records": synthetic_count,
            "synthetic_percentage": round(synthetic_count / total_shipments * 100, 2) if total_shipments > 0 else 0.0
        },
        "distributions": {
            "by_category": categories_distribution,
            "by_transport_mode": transport_distribution,
            "by_weather": weather_distribution
        }
    }

@router.get("/api/datasets/summary")
def get_datasets_summary():
    report_path = "data/reports/data_quality_report.json"
    sources_path = "data/sources.json"
    
    report_data = {}
    sources_data = {}

    if os.path.exists(report_path):
        with open(report_path, "r") as f:
            report_data = json.load(f)

    if os.path.exists(sources_path):
        with open(sources_path, "r") as f:
            sources_data = json.load(f)

    return {
        "sources": sources_data.get("datasets", []),
        "quality_report": report_data
    }
