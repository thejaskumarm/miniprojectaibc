"""
TrustTrace AI - Real-time ML Prediction & Explainability Router
Endpoints:
- POST /api/predict/delay
- POST /api/predict/temperature-risk
- GET /api/models/metadata
"""

from typing import Dict, Any, Optional
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from backend.core.database import get_db
from backend.models.db_models import PredictionRecord
from ml.inference.explainer import TrustTraceInferenceEngine

router = APIRouter(prefix="", tags=["ML Predictions & Explainability"])
engine = TrustTraceInferenceEngine()

class DelayPredictionInput(BaseModel):
    shipment_id: Optional[str] = None
    distance_km: float = Field(2500.0, ge=1.0, le=40000.0)
    planned_dispatch_time: Optional[str] = None
    planned_delivery_time: Optional[str] = None
    planned_duration_hours: Optional[float] = None
    traffic_index: float = Field(0.5, ge=0.0, le=1.0)
    customs_delay_hours: float = Field(0.0, ge=0.0, le=168.0)
    transport_mode: str = "Air Freight"
    weather_condition: str = "Clear"
    carrier_id: str = "CARRIER_DHL"
    supplier_id: str = "SUPPLIER_GLOBAL_TECH"
    product_category: str = "Industrial & Electronics"

class TemperaturePredictionInput(BaseModel):
    shipment_id: Optional[str] = None
    product_category: str = "Vaccines & Biologics"
    target_temperature_min_c: float = 2.0
    target_temperature_max_c: float = 8.0
    recorded_temperature_c: float = 4.5
    ambient_temperature_c: float = 22.0
    temperature_excursion_duration: float = Field(0.0, ge=0.0)
    sensor_gap_duration: float = Field(0.0, ge=0.0)
    planned_duration_hours: Optional[float] = None
    transport_mode: str = "Air Freight"
    weather_condition: str = "Clear"

@router.post("/api/predict/delay")
def predict_shipment_delay(
    payload: DelayPredictionInput,
    db: Session = Depends(get_db)
):
    try:
        data = payload.model_dump()
        result = engine.predict_delay(data)

        # Log prediction to audit database
        rec = PredictionRecord(
            shipment_id=payload.shipment_id,
            prediction_type="DELAY_RISK",
            predicted_class=result["predicted_risk_class"],
            risk_score=result["delay_probability"],
            threshold_used=result["threshold_used"],
            model_version="delay_model_v1",
            input_features=data,
            contributing_factors=result["contributing_factors"],
            provenance="synthetic_simulated" if not payload.shipment_id else "live_query"
        )
        db.add(rec)
        db.commit()

        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/api/predict/temperature-risk")
def predict_temperature_risk(
    payload: TemperaturePredictionInput,
    db: Session = Depends(get_db)
):
    try:
        data = payload.model_dump()
        result = engine.predict_temperature_risk(data)

        # Log prediction to audit database
        rec = PredictionRecord(
            shipment_id=payload.shipment_id,
            prediction_type="TEMPERATURE_RISK",
            predicted_class=result["predicted_risk_class"],
            risk_score=result["class_probabilities"][f"critical_breach_2"],
            threshold_used=0.50,
            model_version="temperature_risk_model_v1",
            input_features=data,
            contributing_factors=result["contributing_factors"],
            provenance="synthetic_simulated" if not payload.shipment_id else "live_query"
        )
        db.add(rec)
        db.commit()

        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/api/models/metadata")
def get_models_metadata():
    if not engine.metadata:
        raise HTTPException(status_code=404, detail="Model metadata report not found")
    return engine.metadata
