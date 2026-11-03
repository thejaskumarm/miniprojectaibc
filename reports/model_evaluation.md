# TrustTrace AI — Machine Learning Model Evaluation Report

**Generated:** 2026-11-03 13:05:40  
**Target Volume:** 16,000 Usable Records (70% Train: 11,200 | 15% Validation: 2,400 | 15% Test: 2,400)  
**Strict Data Leakage Controls:** Pre-dispatch & in-transit telemetry features only; zero exposure to arrival outcomes.

---

## 1. Model A: Shipment Delay Prediction

### Objective
Predict the conditional probability that a consignment will experience delayed delivery exceeding planned tolerance.

### Algorithmic Comparison (Validation Set)
| Algorithm | Accuracy | Precision | Recall | F1-Score | ROC-AUC | PR-AUC |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Logistic Regression (Baseline)** | 0.6125 | 0.6392 | 0.6770 | 0.6576 | 0.6575 | 0.7098 |
| **Random Forest Classifier** | 0.6112 | 0.6337 | 0.6937 | 0.6623 | 0.6507 | 0.7012 |
| **HistGradientBoosting Classifier** | 0.5938 | 0.6215 | 0.6672 | 0.6435 | 0.6393 | 0.6962 |

**Selected Model:** `logistic_regression`  
**Optimal Decision Threshold:** `0.5`

### Final Held-Out Test Set Performance
- **Accuracy:** `0.6071`
- **Precision:** `0.6336`
- **Recall:** `0.6848`
- **F1 Score:** `0.6582`
- **ROC-AUC:** `0.6478`
- **PR-AUC:** `0.7055`
- **False Positive Rate:** `0.4888`
- **False Negative Rate:** `0.3152`

**Confusion Matrix (Test):**
```
TN: 549 | FP: 525
FN: 418 | TP: 908
```

### Feature Importance (Explainable AI Attribution)
- **`weather_condition`**: +0.0467
- **`customs_delay_hours`**: +0.0248
- **`traffic_index`**: +0.0211
- **`carrier_id`**: +0.0133
- **`transport_mode`**: +0.0022
- **`distance_km`**: -0.0013
- **`planned_duration_hours`**: -0.0019
- **`supplier_id`**: -0.0019
- **`product_category`**: -0.0036

---

## 2. Model B: Cold-Chain Temperature & Quality Risk

### Objective
Predict cold-chain integrity breaches and categorize into Safe (0), Moderate Excursion Warning (1), or Critical Quality Breach (2).

### Algorithmic Comparison (Validation Set)
| Algorithm | Accuracy | Macro Precision | Macro Recall | Macro F1 | Weighted F1 |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Multinomial Logistic Regression** | 0.9529 | 0.9114 | 0.9240 | 0.9176 | 0.9531 |
| **Random Forest Classifier** | 0.9929 | 0.9852 | 0.9801 | 0.9822 | 0.9928 |
| **HistGradientBoosting Classifier** | 0.9933 | 0.9802 | 0.9863 | 0.9831 | 0.9933 |

**Selected Model:** `hist_gradient_boosting`

### Final Held-Out Test Set Performance
- **Accuracy:** `0.99`
- **Macro Precision:** `0.9827`
- **Macro Recall:** `0.9789`
- **Macro F1 Score:** `0.9807`
- **Weighted F1 Score:** `0.9899`

**Confusion Matrix (Test Classes: [0: Compliant, 1: Moderate Excursion, 2: Critical]):**
```
[[2010, 6, 0], [16, 281, 2], [0, 0, 85]]
```

### Feature Importance (Explainable AI Attribution)
- **`target_temperature_min_c`**: +0.1682
- **`recorded_temperature_c`**: +0.1247
- **`temperature_excursion_duration`**: +0.0621
- **`weather_condition`**: +0.0151
- **`ambient_temperature_c`**: +0.0044
- **`planned_duration_hours`**: +0.0013
- **`sensor_gap_duration`**: +0.0008
- **`product_category`**: +0.0003
- **`target_temperature_max_c`**: -0.0002
- **`transport_mode`**: -0.0002

---

## 3. Methodological Notes & Known Limitations
1. **Calibration**: Probabilities are raw model outputs and evaluated against empirical test distributions. In high-consequence biopharma shipments, human SOP overrides should be triggered for any probability > 0.40.
2. **Synthetic Data Disclosure**: 62.5% of records are synthetic physics-simulated. These scores represent high-fidelity stress tests rather than multi-year historical telemetry from a single enterprise.
3. **Sensor Disconnection**: Missing sensor telemetry is penalized via the `sensor_gap_duration` feature; long sensor blackouts automatically raise uncertainty flags.
