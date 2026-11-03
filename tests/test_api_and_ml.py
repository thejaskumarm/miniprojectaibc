"""
TrustTrace AI - Test Suite
Tests:
1. Health check endpoint
2. Analytics overview endpoint
3. Shipments list and detail endpoints
4. Machine Learning prediction endpoints (Delay & Temperature Risk)
5. Blockchain verification and tampering detection
6. Chatbot grounded response
7. Dataset provenance validation
"""

import pytest
from fastapi.testclient import TestClient
from backend.main import app

client = TestClient(app)

def test_health_check():
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "HEALTHY"
    assert data["ml_models"]["delay_model"] == "READY"
    assert data["ml_models"]["temperature_risk_model"] == "READY"

def test_analytics_overview():
    response = client.get("/api/analytics/overview")
    assert response.status_code == 200
    data = response.json()
    assert data["kpis"]["total_monitored_shipments"] >= 10000
    assert "real_curated_records" in data["provenance"]
    assert "synthetic_simulated_records" in data["provenance"]

def test_datasets_summary():
    response = client.get("/api/datasets/summary")
    assert response.status_code == 200
    data = response.json()
    assert len(data["sources"]) >= 3
    assert data["quality_report"]["summary"]["total_cleaned_records"] >= 10000

def test_list_shipments():
    response = client.get("/api/shipments?page=1&page_size=10")
    assert response.status_code == 200
    data = response.json()
    assert data["total"] >= 10000
    assert len(data["items"]) == 10
    item = data["items"][0]
    assert "shipment_id" in item
    assert "data_provenance" in item

def test_shipment_detail():
    response = client.get("/api/shipments/TT-000001")
    assert response.status_code == 200
    data = response.json()
    assert data["shipment"]["shipment_id"] == "TT-000001"
    assert "events" in data
    assert "telemetry" in data
    assert "blockchain_verification" in data

def test_delay_prediction():
    payload = {
        "distance_km": 4500.0,
        "planned_duration_hours": 36.0,
        "traffic_index": 0.85,
        "customs_delay_hours": 14.0,
        "transport_mode": "Air Freight",
        "weather_condition": "Severe Snowstorm",
        "carrier_id": "CARRIER_DHL",
        "supplier_id": "SUPPLIER_GLOBAL_TECH",
        "product_category": "Industrial & Electronics"
    }
    response = client.post("/api/predict/delay", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert "delay_probability" in data
    assert "risk_level" in data
    assert "contributing_factors" in data
    assert len(data["contributing_factors"]) > 0

def test_temperature_prediction():
    payload = {
        "product_category": "Vaccines & Biologics",
        "target_temperature_min_c": 2.0,
        "target_temperature_max_c": 8.0,
        "recorded_temperature_c": 14.5,
        "ambient_temperature_c": 36.0,
        "temperature_excursion_duration": 5.0,
        "sensor_gap_duration": 1.2
    }
    response = client.post("/api/predict/temperature-risk", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["predicted_risk_class"] in [1, 2]
    assert "contributing_factors" in data
    assert "recommended_actions" in data

def test_blockchain_verification_and_tampering():
    # Verify genuine event
    response = client.get("/api/shipments/TT-000001/verification")
    assert response.status_code == 200
    data = response.json()
    assert data["overall_status"] == "VERIFIED_AUTHENTIC"
    assert data["is_valid"] is True

    # Test tampering simulation: tamper the temperature on TT-000001
    tamper_payload = {
        "event_id": "EVT-TT-000001-00",
        "tamper_temperature": 99.9, # Fraudulent modification
        "tamper_location": "Unauthorized Diversion Hub"
    }
    tamper_res = client.post("/api/shipments/TT-000001/verify-tamper", json=tamper_payload)
    assert tamper_res.status_code == 200
    tamper_data = tamper_res.json()
    assert tamper_data["is_valid"] is False
    assert tamper_data["verification_status"] == "TAMPERING_DETECTED"
    assert len(tamper_data["tampered_fields"]) > 0

def test_chatbot_grounded_response():
    # Query specific shipment
    req = {"query": "Why is shipment TT-000001 marked with risk and what is its status?"}
    response = client.post("/api/chat", json=req)
    assert response.status_code == 200
    data = response.json()
    assert "TT-000001" in data["response"]
    assert "disclaimer" in data
    assert len(data["citations"]) > 0
