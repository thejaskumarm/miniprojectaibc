"""
TrustTrace AI - Shipments Router
Endpoints:
- GET /api/shipments (search, filters, pagination)
- GET /api/shipments/{shipment_id}
- GET /api/shipments/{shipment_id}/events
- GET /api/shipments/{shipment_id}/telemetry
- GET /api/shipments/{shipment_id}/verification
- POST /api/shipments/{shipment_id}/verify-tamper
"""

from typing import Optional, List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session
from sqlalchemy import or_, desc

from backend.core.database import get_db
from backend.core.auth import get_current_user, require_role
from backend.models.db_models import Shipment, ShipmentEvent, SensorReading, VerificationRecord
from backend.services.blockchain_service import blockchain_service

router = APIRouter(prefix="/api/shipments", tags=["Shipments"])

class ShipmentResponse(BaseModel):
    shipment_id: str
    product_category: str
    transport_mode: str
    origin: str
    destination: str
    distance_km: float
    planned_dispatch_time: str
    planned_delivery_time: str
    actual_delivery_time: Optional[str] = None
    carrier_id: str
    supplier_id: str
    weather_condition: str
    traffic_index: float
    customs_delay_hours: float
    ambient_temperature_c: float
    recorded_temperature_c: float
    target_temperature_min_c: float
    target_temperature_max_c: float
    temperature_excursion_duration: float
    sensor_gap_duration: float
    shipment_status: str
    delay_risk_label: int
    temperature_quality_risk_label: int
    data_provenance: str
    source_dataset: str
    created_at: Optional[str] = None

class PaginatedShipments(BaseModel):
    total: int
    page: int
    page_size: int
    total_pages: int
    items: List[Dict[str, Any]]

class TamperTestRequest(BaseModel):
    event_id: str
    tamper_temperature: Optional[float] = None
    tamper_location: Optional[str] = None
    tamper_description: Optional[str] = None

@router.get("", response_model=PaginatedShipments)
def list_shipments(
    page: int = Query(1, ge=1),
    page_size: int = Query(25, ge=1, le=100),
    search: Optional[str] = None,
    status: Optional[str] = None,
    product_category: Optional[str] = None,
    delay_risk: Optional[int] = None,
    temp_risk: Optional[int] = None,
    provenance: Optional[str] = None,
    db: Session = Depends(get_db),
    user: Dict[str, Any] = Depends(get_current_user)
):
    query = db.query(Shipment)

    # Search filter
    if search:
        search_fmt = f"%{search}%"
        query = query.filter(
            or_(
                Shipment.shipment_id.ilike(search_fmt),
                Shipment.origin.ilike(search_fmt),
                Shipment.destination.ilike(search_fmt),
                Shipment.carrier_id.ilike(search_fmt),
                Shipment.supplier_id.ilike(search_fmt)
            )
        )

    if status:
        query = query.filter(Shipment.shipment_status == status)
    if product_category:
        query = query.filter(Shipment.product_category == product_category)
    if delay_risk is not None:
        query = query.filter(Shipment.delay_risk_label == delay_risk)
    if temp_risk is not None:
        query = query.filter(Shipment.temperature_quality_risk_label == temp_risk)
    if provenance:
        query = query.filter(Shipment.data_provenance == provenance)

    total = query.count()
    offset = (page - 1) * page_size
    shipments = query.order_by(Shipment.shipment_id.asc()).offset(offset).limit(page_size).all()

    items = []
    for s in shipments:
        items.append({
            "shipment_id": s.shipment_id,
            "product_category": s.product_category,
            "transport_mode": s.transport_mode,
            "origin": s.origin,
            "destination": s.destination,
            "distance_km": s.distance_km,
            "planned_dispatch_time": s.planned_dispatch_time.isoformat() if s.planned_dispatch_time else "",
            "planned_delivery_time": s.planned_delivery_time.isoformat() if s.planned_delivery_time else "",
            "actual_delivery_time": s.actual_delivery_time.isoformat() if s.actual_delivery_time else None,
            "carrier_id": s.carrier_id,
            "supplier_id": s.supplier_id,
            "weather_condition": s.weather_condition,
            "traffic_index": s.traffic_index,
            "customs_delay_hours": s.customs_delay_hours,
            "ambient_temperature_c": s.ambient_temperature_c,
            "recorded_temperature_c": s.recorded_temperature_c,
            "target_temperature_min_c": s.target_temperature_min_c,
            "target_temperature_max_c": s.target_temperature_max_c,
            "temperature_excursion_duration": s.temperature_excursion_duration,
            "sensor_gap_duration": s.sensor_gap_duration,
            "shipment_status": s.shipment_status,
            "delay_risk_label": s.delay_risk_label,
            "temperature_quality_risk_label": s.temperature_quality_risk_label,
            "data_provenance": s.data_provenance,
            "source_dataset": s.source_dataset,
            "created_at": s.created_at.isoformat() if s.created_at else ""
        })

    total_pages = (total + page_size - 1) // page_size

    return {
        "total": total,
        "page": page,
        "page_size": page_size,
        "total_pages": total_pages,
        "items": items
    }

@router.get("/{shipment_id}")
def get_shipment_detail(
    shipment_id: str,
    db: Session = Depends(get_db),
    user: Dict[str, Any] = Depends(get_current_user)
):
    s = db.query(Shipment).filter(Shipment.shipment_id == shipment_id).first()
    if not s:
        raise HTTPException(status_code=404, detail=f"Shipment {shipment_id} not found")

    events = db.query(ShipmentEvent).filter(ShipmentEvent.shipment_id == shipment_id).order_by(ShipmentEvent.timestamp.asc()).all()
    readings = db.query(SensorReading).filter(SensorReading.shipment_id == shipment_id).order_by(SensorReading.timestamp.asc()).all()
    chain = blockchain_service.get_shipment_chain(shipment_id)

    return {
        "shipment": {
            "shipment_id": s.shipment_id,
            "product_category": s.product_category,
            "transport_mode": s.transport_mode,
            "origin": s.origin,
            "destination": s.destination,
            "distance_km": s.distance_km,
            "planned_dispatch_time": s.planned_dispatch_time.isoformat() if s.planned_dispatch_time else "",
            "planned_delivery_time": s.planned_delivery_time.isoformat() if s.planned_delivery_time else "",
            "actual_delivery_time": s.actual_delivery_time.isoformat() if s.actual_delivery_time else None,
            "carrier_id": s.carrier_id,
            "supplier_id": s.supplier_id,
            "weather_condition": s.weather_condition,
            "traffic_index": s.traffic_index,
            "customs_delay_hours": s.customs_delay_hours,
            "ambient_temperature_c": s.ambient_temperature_c,
            "recorded_temperature_c": s.recorded_temperature_c,
            "target_temperature_min_c": s.target_temperature_min_c,
            "target_temperature_max_c": s.target_temperature_max_c,
            "temperature_excursion_duration": s.temperature_excursion_duration,
            "sensor_gap_duration": s.sensor_gap_duration,
            "shipment_status": s.shipment_status,
            "delay_risk_label": s.delay_risk_label,
            "temperature_quality_risk_label": s.temperature_quality_risk_label,
            "data_provenance": s.data_provenance,
            "source_dataset": s.source_dataset,
            "created_at": s.created_at.isoformat() if s.created_at else ""
        },
        "events": [
            {
                "event_id": e.event_id,
                "event_type": e.event_type,
                "timestamp": e.timestamp.isoformat(),
                "location": e.location,
                "description": e.description,
                "submitter": e.submitter,
                "payload_hash": e.payload_hash,
                "anchored_on_chain": e.anchored_on_chain,
                "blockchain_tx_hash": e.blockchain_tx_hash
            } for e in events
        ],
        "telemetry": [
            {
                "reading_id": r.reading_id,
                "timestamp": r.timestamp.isoformat(),
                "temperature_c": r.temperature_c,
                "ambient_temperature_c": r.ambient_temperature_c,
                "humidity_pct": r.humidity_pct,
                "battery_pct": r.battery_pct,
                "is_excursion": r.is_excursion
            } for r in readings
        ],
        "blockchain_verification": {
            "is_anchored": len(chain) > 0,
            "events_anchored_count": len(chain),
            "proof_chain": chain
        }
    }

@router.get("/{shipment_id}/events")
def get_shipment_events(
    shipment_id: str,
    db: Session = Depends(get_db)
):
    events = db.query(ShipmentEvent).filter(ShipmentEvent.shipment_id == shipment_id).order_by(ShipmentEvent.timestamp.asc()).all()
    return [
        {
            "event_id": e.event_id,
            "event_type": e.event_type,
            "timestamp": e.timestamp.isoformat(),
            "location": e.location,
            "description": e.description,
            "submitter": e.submitter,
            "payload_hash": e.payload_hash,
            "anchored_on_chain": e.anchored_on_chain,
            "blockchain_tx_hash": e.blockchain_tx_hash
        } for e in events
    ]

@router.get("/{shipment_id}/verification")
def get_shipment_verification(
    shipment_id: str,
    db: Session = Depends(get_db)
):
    chain = blockchain_service.get_shipment_chain(shipment_id)
    if not chain:
        return {
            "shipment_id": shipment_id,
            "status": "UNANCHORED",
            "is_valid": False,
            "message": "No cryptographic anchors exist on the blockchain ledger for this shipment."
        }

    # Verify each event in the chain against its canonical payload
    results = []
    all_valid = True
    for ev in chain:
        candidate_payload = ev["original_payload_snapshot"]
        v = blockchain_service.verify_event(shipment_id, ev["event_id"], candidate_payload)
        results.append(v)
        if not v["is_valid"]:
            all_valid = False

    return {
        "shipment_id": shipment_id,
        "overall_status": "VERIFIED_AUTHENTIC" if all_valid else "TAMPERING_DETECTED",
        "is_valid": all_valid,
        "anchored_events_count": len(chain),
        "events_verification": results,
        "network": chain[0]["network"] if chain else "TrustTrace EVM Local Devnet"
    }

@router.post("/{shipment_id}/verify-tamper")
def test_payload_tamper_verification(
    shipment_id: str,
    tamper_req: TamperTestRequest,
    db: Session = Depends(get_db)
):
    """
    Simulates or verifies a potentially tampered event payload.
    Demonstrates instant tamper detection when any attribute is changed.
    """
    event = db.query(ShipmentEvent).filter(
        ShipmentEvent.shipment_id == shipment_id,
        ShipmentEvent.event_id == tamper_req.event_id
    ).first()

    if not event:
        raise HTTPException(status_code=404, detail="Event not found")

    # Construct the candidate payload
    payload = {
        "eventId": event.event_id,
        "shipmentId": shipment_id,
        "eventType": event.event_type,
        "location": tamper_req.tamper_location or event.location,
        "description": tamper_req.tamper_description or event.description,
        "submitter": event.submitter,
        "timestamp": event.timestamp.isoformat()
    }

    if tamper_req.tamper_temperature is not None:
        payload["temperature_c"] = tamper_req.tamper_temperature

    # Run cryptographic verification
    verif = blockchain_service.verify_event(shipment_id, event.event_id, payload)
    
    # Record verification in audit database
    rec = VerificationRecord(
        shipment_id=shipment_id,
        event_id=event.event_id,
        is_valid=verif["is_valid"],
        status=verif["verification_status"],
        anchored_hash=verif.get("anchored_hash", ""),
        computed_hash=verif.get("computed_hash", ""),
        tampered_fields=verif.get("tampered_fields", []),
        verifier_address="0xAuditorVerifier719"
    )
    db.add(rec)
    db.commit()

    return verif
