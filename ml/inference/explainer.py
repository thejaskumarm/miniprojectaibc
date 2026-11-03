"""
TrustTrace AI - Explainable AI (XAI) & Real-time Inference Engine
Provides:
1. Single and batch inference for Model A (Delay Risk)
2. Single and batch inference for Model B (Cold-Chain Temperature Risk)
3. Factor contribution breakdown for explainable predictions
4. Human operator actionable recommendations
5. Scientific uncertainty and calibration caveats
"""

import os
import json
import joblib
import pandas as pd
import numpy as np
from datetime import datetime
from typing import Dict, Any, List

class TrustTraceInferenceEngine:
    def __init__(self, models_dir: str = "models"):
        self.models_dir = models_dir
        self.delay_pipeline = None
        self.temp_pipeline = None
        self.metadata = {}
        self._load_artifacts()

    def _load_artifacts(self):
        metadata_path = os.path.join(self.models_dir, "model_metadata.json")
        if os.path.exists(metadata_path):
            with open(metadata_path, "r") as f:
                self.metadata = json.load(f)

        delay_path = os.path.join(self.models_dir, "delay_model.joblib")
        if os.path.exists(delay_path):
            self.delay_pipeline = joblib.load(delay_path)

        temp_path = os.path.join(self.models_dir, "temperature_risk_model.joblib")
        if os.path.exists(temp_path):
            self.temp_pipeline = joblib.load(temp_path)

    def predict_delay(self, input_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Runs Model A: Shipment Delay Prediction
        """
        if not self.delay_pipeline:
            raise RuntimeError("Delay model artifact not loaded. Run train_all.py first.")

        df = pd.DataFrame([input_data])
        
        # Calculate planned duration in hours if dates provided
        if "planned_duration_hours" not in df.columns or pd.isna(df["planned_duration_hours"].iloc[0]):
            if "planned_dispatch_time" in df.columns and "planned_delivery_time" in df.columns:
                t_disp = pd.to_datetime(df["planned_dispatch_time"])
                t_deliv = pd.to_datetime(df["planned_delivery_time"])
                df["planned_duration_hours"] = (t_deliv - t_disp).dt.total_seconds() / 3600.0
            else:
                df["planned_duration_hours"] = 48.0 # default fallback

        # Fill any missing required columns with safe defaults
        defaults = {
            "distance_km": 2500.0,
            "planned_duration_hours": 48.0,
            "traffic_index": 0.5,
            "customs_delay_hours": 0.0,
            "transport_mode": "Air Freight",
            "weather_condition": "Clear",
            "carrier_id": "CARRIER_DHL",
            "supplier_id": "SUPPLIER_GLOBAL_TECH",
            "product_category": "Industrial & Electronics"
        }
        for k, v in defaults.items():
            if k not in df.columns or pd.isna(df[k].iloc[0]):
                df[k] = v

        prob = float(self.delay_pipeline.predict_proba(df)[0, 1])
        optimal_thresh = self.metadata.get("model_a_delay", {}).get("optimal_threshold", 0.50)
        is_delayed = int(prob >= optimal_thresh)
        risk_level = "HIGH" if prob >= 0.70 else ("MODERATE" if prob >= optimal_thresh else "LOW")

        # Explainability: compute relative factor impacts
        factors = []
        weather = str(df["weather_condition"].iloc[0])
        if weather in ["Severe Snowstorm", "Tropical Storm", "High Heatwave", "Fog"]:
            factors.append({
                "factor": "Adverse Weather",
                "impact": "HIGH_POSITIVE",
                "detail": f"Severe conditions ({weather}) elevate transit delay risk."
            })
        
        customs = float(df["customs_delay_hours"].iloc[0])
        if customs > 12.0:
            factors.append({
                "factor": "Customs Clearance Bottleneck",
                "impact": "HIGH_POSITIVE",
                "detail": f"Border inspection clearance queue exceeds {customs:.1f} hours."
            })
        elif customs > 4.0:
            factors.append({
                "factor": "Moderate Customs Inspection",
                "impact": "MEDIUM_POSITIVE",
                "detail": f"Cross-border clearance delay noted ({customs:.1f}h)."
            })

        traffic = float(df["traffic_index"].iloc[0])
        if traffic > 0.75:
            factors.append({
                "factor": "Intermodal Congestion",
                "impact": "MEDIUM_POSITIVE",
                "detail": f"High corridor congestion index ({traffic:.2f})."
            })

        distance = float(df["distance_km"].iloc[0])
        if distance > 6000:
            factors.append({
                "factor": "Long-Haul Transcontinental Route",
                "impact": "MEDIUM_POSITIVE",
                "detail": f"Route spans {distance:.0f} km across multiple international transfer hubs."
            })

        carrier = str(df["carrier_id"].iloc[0])
        factors.append({
            "factor": f"Carrier Performance History ({carrier})",
            "impact": "NEUTRAL",
            "detail": "Historical carrier on-time baseline incorporated into prior probability."
        })

        # Recommendations
        recommendations = []
        if risk_level == "HIGH":
            recommendations.append("Proactively notify consignee and customs broker.")
            recommendations.append("Evaluate alternate routing or expedited ramp handling.")
        elif risk_level == "MODERATE":
            recommendations.append("Monitor next intermodal transfer checkpoint scan closely.")
        else:
            recommendations.append("Standard automated tracking; consignment proceeding on schedule.")

        return {
            "prediction_type": "SHIPMENT_DELAY_RISK",
            "predicted_risk_class": is_delayed,
            "risk_label": "DELAY_LIKELY" if is_delayed == 1 else "ON_TIME",
            "risk_level": risk_level,
            "delay_probability": round(prob, 4),
            "threshold_used": optimal_thresh,
            "contributing_factors": factors,
            "recommended_actions": recommendations,
            "model_metadata": {
                "algorithm": self.metadata.get("model_a_delay", {}).get("algorithm", "logistic_regression"),
                "trained_at": self.metadata.get("model_a_delay", {}).get("trained_at"),
                "test_accuracy": self.metadata.get("model_a_delay", {}).get("test_metrics", {}).get("accuracy")
            },
            "scientific_disclaimer": "The model estimates risk based on historical operational covariates; it does not confirm that the shipment will arrive late or guarantee delivery outcomes."
        }

    def predict_temperature_risk(self, input_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Runs Model B: Cold-Chain Temperature & Quality Risk
        """
        if not self.temp_pipeline:
            raise RuntimeError("Temperature risk model artifact not loaded. Run train_all.py first.")

        df = pd.DataFrame([input_data])
        
        # Calculate planned duration
        if "planned_duration_hours" not in df.columns or pd.isna(df["planned_duration_hours"].iloc[0]):
            if "planned_dispatch_time" in df.columns and "planned_delivery_time" in df.columns:
                t_disp = pd.to_datetime(df["planned_dispatch_time"])
                t_deliv = pd.to_datetime(df["planned_delivery_time"])
                df["planned_duration_hours"] = (t_deliv - t_disp).dt.total_seconds() / 3600.0
            else:
                df["planned_duration_hours"] = 48.0

        defaults = {
            "target_temperature_min_c": 2.0,
            "target_temperature_max_c": 8.0,
            "ambient_temperature_c": 22.0,
            "recorded_temperature_c": 4.5,
            "temperature_excursion_duration": 0.0,
            "sensor_gap_duration": 0.0,
            "planned_duration_hours": 48.0,
            "product_category": "Vaccines & Biologics",
            "transport_mode": "Air Freight",
            "weather_condition": "Clear"
        }
        for k, v in defaults.items():
            if k not in df.columns or pd.isna(df[k].iloc[0]):
                df[k] = v

        pred_class = int(self.temp_pipeline.predict(df)[0])
        pred_probs = self.temp_pipeline.predict_proba(df)[0]
        
        class_map = {
            0: {"label": "COMPLIANT_SAFE", "severity": "NORMAL", "description": "Temperature strictly within regulatory tolerance."},
            1: {"label": "MODERATE_EXCURSION", "severity": "WARNING", "description": "Thermal breach detected without immediate permanent degradation."},
            2: {"label": "CRITICAL_QUALITY_BREACH", "severity": "CRITICAL", "description": "Severe thermal excursion violating product stability limit."}
        }
        
        selected_info = class_map[pred_class]
        
        # Explanations
        factors = []
        rec_temp = float(df["recorded_temperature_c"].iloc[0])
        t_min = float(df["target_temperature_min_c"].iloc[0])
        t_max = float(df["target_temperature_max_c"].iloc[0])
        amb_temp = float(df["ambient_temperature_c"].iloc[0])
        excursion_hrs = float(df["temperature_excursion_duration"].iloc[0])
        sensor_gap = float(df["sensor_gap_duration"].iloc[0])
        cat = str(df["product_category"].iloc[0])

        if rec_temp > t_max:
            factors.append({
                "factor": "Upper Temperature Excursion",
                "impact": "CRITICAL",
                "detail": f"Recorded sensor reading ({rec_temp}°C) exceeds category threshold limit of {t_max}°C."
            })
        elif rec_temp < t_min:
            factors.append({
                "factor": "Sub-Freezing Chill Excursion",
                "impact": "CRITICAL",
                "detail": f"Recorded reading ({rec_temp}°C) dropped below minimum stability threshold of {t_min}°C."
            })

        if excursion_hrs > 0:
            factors.append({
                "factor": "Cumulative Thermal Exposure",
                "impact": "HIGH",
                "detail": f"Product exposed to excursion conditions for {excursion_hrs:.1f} hours."
            })

        if sensor_gap > 2.0:
            factors.append({
                "factor": "IoT Telemetry Blackout",
                "impact": "MEDIUM",
                "detail": f"Sensor gap of {sensor_gap:.1f} hours raises data completeness uncertainty."
            })

        if amb_temp > 35.0 or amb_temp < -10.0:
            factors.append({
                "factor": "Extreme Environmental Ambient",
                "impact": "MEDIUM",
                "detail": f"External ambient temperature ({amb_temp}°C) stresses thermal packaging insulation."
            })

        # Actions
        actions = []
        if pred_class == 2:
            actions.append("FLAG FOR IMMEDIATE QUARANTINE: Do not release into clinic or retail inventory.")
            actions.append("Initiate QA lab assay inspection and stability chamber potency verification.")
            actions.append("Capture blockchain event anchor for regulatory audit documentation.")
        elif pred_class == 1:
            actions.append("Inspect thermal data logger and calculate mean kinetic temperature (MKT).")
            actions.append("Notify recipient receiving dock to expedite immediate re-cooling.")
        else:
            actions.append("Cold-chain verified compliant; standard reception clearance permitted.")

        return {
            "prediction_type": "COLD_CHAIN_TEMPERATURE_RISK",
            "predicted_risk_class": pred_class,
            "risk_label": selected_info["label"],
            "severity": selected_info["severity"],
            "description": selected_info["description"],
            "class_probabilities": {
                "compliant_0": round(float(pred_probs[0]), 4),
                "moderate_excursion_1": round(float(pred_probs[1]), 4),
                "critical_breach_2": round(float(pred_probs[2]), 4)
            },
            "temperature_metrics": {
                "recorded_c": rec_temp,
                "target_min_c": t_min,
                "target_max_c": t_max,
                "ambient_c": amb_temp,
                "excursion_duration_hours": excursion_hrs
            },
            "contributing_factors": factors,
            "recommended_actions": actions,
            "model_metadata": {
                "algorithm": self.metadata.get("model_b_temperature", {}).get("algorithm", "hist_gradient_boosting"),
                "trained_at": self.metadata.get("model_b_temperature", {}).get("trained_at"),
                "test_accuracy": self.metadata.get("model_b_temperature", {}).get("test_metrics", {}).get("accuracy")
            },
            "scientific_disclaimer": "Temperature excursion prediction flags thermal exposure risk; confirmed biological damage requires destructive laboratory assay and QA validation."
        }
