"""
TrustTrace AI - Model B: Temperature and Cold-Chain Risk Prediction Pipeline
Compares:
1. Multinomial Logistic Regression (Baseline)
2. Random Forest Classifier
3. HistGradientBoosting Classifier
Features:
- Configurable product category boundaries (Vaccines, Fresh Produce, Frozen, Electronics)
- Strict prediction-time feature integrity (no future post-arrival data leakage)
- Multiclass evaluation: 0 = Normal, 1 = Moderate Excursion, 2 = Critical Breach
- Metrics: Accuracy, Precision (Macro/Weighted), Recall, F1, Confusion Matrix
- Feature importance extraction for explainability
"""

import os
import json
import joblib
import numpy as np
import pandas as pd
from datetime import datetime

from sklearn.compose import ColumnTransformer
from sklearn.preprocessing import OneHotEncoder, StandardScaler
from sklearn.pipeline import Pipeline
from sklearn.linear_model import LogisticRegression
from sklearn.ensemble import RandomForestClassifier, HistGradientBoostingClassifier
from sklearn.metrics import (
    accuracy_score, precision_score, recall_score, f1_score,
    confusion_matrix, classification_report
)
from sklearn.inspection import permutation_importance

SEED = 42

NUMERIC_FEATURES = [
    "target_temperature_min_c",
    "target_temperature_max_c",
    "ambient_temperature_c",
    "recorded_temperature_c",
    "temperature_excursion_duration",
    "sensor_gap_duration",
    "planned_duration_hours"
]

CATEGORICAL_FEATURES = [
    "product_category",
    "transport_mode",
    "weather_condition"
]

def engineer_features(df: pd.DataFrame) -> pd.DataFrame:
    df = df.copy()
    t_disp = pd.to_datetime(df["planned_dispatch_time"])
    t_deliv = pd.to_datetime(df["planned_delivery_time"])
    df["planned_duration_hours"] = (t_deliv - t_disp).dt.total_seconds() / 3600.0
    return df

def build_preprocessor():
    numeric_transformer = Pipeline(steps=[
        ("scaler", StandardScaler())
    ])
    categorical_transformer = Pipeline(steps=[
        ("onehot", OneHotEncoder(handle_unknown="ignore", sparse_output=False))
    ])
    preprocessor = ColumnTransformer(
        transformers=[
            ("num", numeric_transformer, NUMERIC_FEATURES),
            ("cat", categorical_transformer, CATEGORICAL_FEATURES)
        ]
    )
    return preprocessor

def evaluate_multiclass(y_true, y_pred, y_prob=None):
    cm = confusion_matrix(y_true, y_pred).tolist()
    
    return {
        "accuracy": round(float(accuracy_score(y_true, y_pred)), 4),
        "macro_precision": round(float(precision_score(y_true, y_pred, average="macro", zero_division=0)), 4),
        "macro_recall": round(float(recall_score(y_true, y_pred, average="macro", zero_division=0)), 4),
        "macro_f1": round(float(f1_score(y_true, y_pred, average="macro", zero_division=0)), 4),
        "weighted_f1": round(float(f1_score(y_true, y_pred, average="weighted", zero_division=0)), 4),
        "confusion_matrix": cm,
        "class_report": classification_report(y_true, y_pred, output_dict=True, zero_division=0)
    }

def train_and_evaluate():
    print("Loading datasets for Model B (Temperature & Quality Risk)...")
    train_df = pd.read_csv("data/processed/train.csv")
    val_df = pd.read_csv("data/processed/val.csv")
    test_df = pd.read_csv("data/processed/test.csv")
    
    train_df = engineer_features(train_df)
    val_df = engineer_features(val_df)
    test_df = engineer_features(test_df)
    
    features = NUMERIC_FEATURES + CATEGORICAL_FEATURES
    X_train = train_df[features]
    y_train = train_df["temperature_quality_risk_label"]
    
    X_val = val_df[features]
    y_val = val_df["temperature_quality_risk_label"]
    
    X_test = test_df[features]
    y_test = test_df["temperature_quality_risk_label"]
    
    print(f"Temperature class distribution (Train): {y_train.value_counts().to_dict()}")
    
    models = {
        "multinomial_logistic_regression": LogisticRegression(max_iter=1000, random_state=SEED),
        "random_forest": RandomForestClassifier(n_estimators=120, max_depth=12, random_state=SEED, n_jobs=-1),
        "hist_gradient_boosting": HistGradientBoostingClassifier(max_iter=150, max_depth=8, random_state=SEED)
    }
    
    val_results = {}
    fitted_pipelines = {}
    
    for name, clf in models.items():
        print(f"Training {name}...")
        preprocessor = build_preprocessor()
        pipeline = Pipeline(steps=[
            ("preprocessor", preprocessor),
            ("classifier", clf)
        ])
        
        pipeline.fit(X_train, y_train)
        fitted_pipelines[name] = pipeline
        
        y_val_pred = pipeline.predict(X_val)
        metrics = evaluate_multiclass(y_val, y_val_pred)
        val_results[name] = metrics
        print(f"  {name} Val Macro-F1: {metrics['macro_f1']}, Accuracy: {metrics['accuracy']}")
        
    best_model_name = max(val_results.keys(), key=lambda k: val_results[k]["macro_f1"])
    best_pipeline = fitted_pipelines[best_model_name]
    print(f"\nSelected Best Model for Model B: {best_model_name}")
    
    y_test_pred = best_pipeline.predict(X_test)
    final_test_metrics = evaluate_multiclass(y_test, y_test_pred)
    print("\n--- Model B Final Test Evaluation ---")
    print(f"  Accuracy: {final_test_metrics['accuracy']}")
    print(f"  Macro F1: {final_test_metrics['macro_f1']}")
    print(f"  Weighted F1: {final_test_metrics['weighted_f1']}")
    print(f"  Confusion Matrix: {final_test_metrics['confusion_matrix']}")
    
    # Feature importances
    print("\nComputing feature importances for explainability...")
    perm = permutation_importance(best_pipeline, X_val, y_val, n_repeats=5, random_state=SEED, n_jobs=-1)
    feature_importances = {}
    for i, col in enumerate(features):
        feature_importances[col] = round(float(perm.importances_mean[i]), 5)
        
    sorted_importances = dict(sorted(feature_importances.items(), key=lambda item: item[1], reverse=True))
    
    os.makedirs("models", exist_ok=True)
    joblib.dump(best_pipeline, "models/temperature_risk_model.joblib")
    
    model_artifact_summary = {
        "model_name": "temperature_risk_pipeline",
        "algorithm": best_model_name,
        "features": features,
        "numeric_features": NUMERIC_FEATURES,
        "categorical_features": CATEGORICAL_FEATURES,
        "classes": [0, 1, 2],
        "class_labels": {
            "0": "Compliant / Safe",
            "1": "Moderate Excursion Warning",
            "2": "Critical Excursion / Quality Breach"
        },
        "feature_importances": sorted_importances,
        "validation_comparison": val_results,
        "test_metrics": final_test_metrics,
        "trained_at": datetime.now().isoformat(),
        "training_samples": len(X_train),
        "test_samples": len(X_test),
        "pipeline_file": "models/temperature_risk_model.joblib"
    }
    
    return model_artifact_summary

if __name__ == "__main__":
    train_and_evaluate()
