"""
TrustTrace AI - Model A: Shipment Delay Prediction Pipeline
Compares:
1. Logistic Regression (Baseline)
2. Random Forest Classifier
3. HistGradientBoosting Classifier
Includes:
- Zero data leakage guarantee (only pre-dispatch & in-transit environmental inputs)
- Scikit-learn Pipeline with ColumnTransformer (OneHotEncoder + StandardScaler)
- Validation threshold tuning
- Test set evaluation (Accuracy, Precision, Recall, F1, ROC-AUC, PR-AUC, Confusion Matrix)
- Feature importance extraction for Explainable AI
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
    roc_auc_score, average_precision_score, confusion_matrix
)
from sklearn.inspection import permutation_importance

SEED = 42

NUMERIC_FEATURES = [
    "distance_km",
    "planned_duration_hours",
    "traffic_index",
    "customs_delay_hours"
]

CATEGORICAL_FEATURES = [
    "transport_mode",
    "weather_condition",
    "carrier_id",
    "supplier_id",
    "product_category"
]

def engineer_features(df: pd.DataFrame) -> pd.DataFrame:
    df = df.copy()
    # Calculate planned transit duration in hours
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

def evaluate_binary(y_true, y_prob, threshold=0.5):
    y_pred = (y_prob >= threshold).astype(int)
    cm = confusion_matrix(y_true, y_pred)
    tn, fp, fn, tp = cm.ravel()
    
    fpr = float(fp / (fp + tn)) if (fp + tn) > 0 else 0.0
    fnr = float(fn / (fn + tp)) if (fn + tp) > 0 else 0.0
    
    return {
        "accuracy": round(float(accuracy_score(y_true, y_pred)), 4),
        "precision": round(float(precision_score(y_true, y_pred, zero_division=0)), 4),
        "recall": round(float(recall_score(y_true, y_pred, zero_division=0)), 4),
        "f1": round(float(f1_score(y_true, y_pred, zero_division=0)), 4),
        "roc_auc": round(float(roc_auc_score(y_true, y_prob)), 4),
        "pr_auc": round(float(average_precision_score(y_true, y_prob)), 4),
        "confusion_matrix": {
            "tn": int(tn), "fp": int(fp), "fn": int(fn), "tp": int(tp)
        },
        "false_positive_rate": round(fpr, 4),
        "false_negative_rate": round(fnr, 4),
        "threshold": round(threshold, 2)
    }

def train_and_evaluate():
    print("Loading datasets for Model A (Delay Prediction)...")
    train_df = pd.read_csv("data/processed/train.csv")
    val_df = pd.read_csv("data/processed/val.csv")
    test_df = pd.read_csv("data/processed/test.csv")
    
    train_df = engineer_features(train_df)
    val_df = engineer_features(val_df)
    test_df = engineer_features(test_df)
    
    features = NUMERIC_FEATURES + CATEGORICAL_FEATURES
    X_train = train_df[features]
    y_train = train_df["delay_risk_label"]
    
    X_val = val_df[features]
    y_val = val_df["delay_risk_label"]
    
    X_test = test_df[features]
    y_test = test_df["delay_risk_label"]
    
    print(f"Delay target rate: Train={y_train.mean():.3f}, Val={y_val.mean():.3f}, Test={y_test.mean():.3f}")
    
    models = {
        "logistic_regression": LogisticRegression(max_iter=1000, random_state=SEED),
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
        
        y_val_prob = pipeline.predict_proba(X_val)[:, 1]
        metrics = evaluate_binary(y_val, y_val_prob, threshold=0.5)
        val_results[name] = metrics
        print(f"  {name} Val ROC-AUC: {metrics['roc_auc']}, F1: {metrics['f1']}")
        
    # Best model selection by Validation ROC-AUC
    best_model_name = max(val_results.keys(), key=lambda k: val_results[k]["roc_auc"])
    best_pipeline = fitted_pipelines[best_model_name]
    print(f"\nSelected Best Model: {best_model_name}")
    
    # Validation threshold tuning using balanced accuracy
    y_val_prob = best_pipeline.predict_proba(X_val)[:, 1]
    best_thresh = 0.5
    best_score = 0.0
    for thresh in np.arange(0.40, 0.65, 0.05):
        m = evaluate_binary(y_val, y_val_prob, threshold=thresh)
        # Balanced accuracy = (TPR + TNR) / 2 = (recall + (1 - false_positive_rate)) / 2
        bal_acc = (m["recall"] + (1.0 - m["false_positive_rate"])) / 2.0
        if bal_acc > best_score:
            best_score = bal_acc
            best_thresh = float(round(thresh, 2))
            
    print(f"Optimal Validation Threshold: {best_thresh:.2f} (Balanced Accuracy: {best_score:.4f})")
    
    # Final evaluation on held-out test set
    y_test_prob = best_pipeline.predict_proba(X_test)[:, 1]
    final_test_metrics = evaluate_binary(y_test, y_test_prob, threshold=best_thresh)
    print("\n--- Model A Final Test Evaluation ---")
    for k, v in final_test_metrics.items():
        print(f"  {k}: {v}")
        
    # Feature importances extraction
    print("\nComputing feature importances for explainability...")
    perm = permutation_importance(best_pipeline, X_val, y_val, n_repeats=5, random_state=SEED, n_jobs=-1)
    feature_importances = {}
    for i, col in enumerate(features):
        feature_importances[col] = round(float(perm.importances_mean[i]), 5)
        
    # Sort descending
    sorted_importances = dict(sorted(feature_importances.items(), key=lambda item: item[1], reverse=True))
    
    os.makedirs("models", exist_ok=True)
    joblib.dump(best_pipeline, "models/delay_model.joblib")
    
    model_artifact_summary = {
        "model_name": "delay_prediction_pipeline",
        "algorithm": best_model_name,
        "features": features,
        "numeric_features": NUMERIC_FEATURES,
        "categorical_features": CATEGORICAL_FEATURES,
        "optimal_threshold": best_thresh,
        "feature_importances": sorted_importances,
        "validation_comparison": val_results,
        "test_metrics": final_test_metrics,
        "trained_at": datetime.now().isoformat(),
        "training_samples": len(X_train),
        "test_samples": len(X_test),
        "pipeline_file": "models/delay_model.joblib"
    }
    
    return model_artifact_summary

if __name__ == "__main__":
    train_and_evaluate()
