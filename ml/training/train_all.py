"""
TrustTrace AI - Master ML Training Orchestrator
Executes training for:
- Model A: Shipment Delay Prediction
- Model B: Cold-Chain Temperature & Quality Risk
Generates:
- models/delay_model.joblib
- models/temperature_risk_model.joblib
- models/model_metadata.json
- reports/model_evaluation.json
- reports/model_evaluation.md
"""

import os
import json
from datetime import datetime
from ml.training.train_delay_model import train_and_evaluate as train_delay
from ml.training.train_temperature_model import train_and_evaluate as train_temp

def main():
    print("=" * 60)
    print("Starting TrustTrace AI Machine Learning Pipeline Training")
    print("=" * 60)
    
    os.makedirs("models", exist_ok=True)
    os.makedirs("reports", exist_ok=True)
    
    # Train Model A
    print("\n--- PIPELINE A: SHIPMENT DELAY PREDICTION ---")
    summary_delay = train_delay()
    
    # Train Model B
    print("\n--- PIPELINE B: COLD-CHAIN TEMPERATURE & QUALITY RISK ---")
    summary_temp = train_temp()
    
    # Master metadata
    master_metadata = {
        "generated_at": datetime.now().isoformat(),
        "model_a_delay": summary_delay,
        "model_b_temperature": summary_temp,
        "environment": {
            "python_version": "3.12",
            "framework": "scikit-learn",
            "random_seed": 42
        }
    }
    
    with open("models/model_metadata.json", "w") as f:
        json.dump(master_metadata, f, indent=2)
        
    with open("reports/model_evaluation.json", "w") as f:
        json.dump(master_metadata, f, indent=2)
        
    # Generate reports/model_evaluation.md
    md_content = f"""# TrustTrace AI — Machine Learning Model Evaluation Report

**Generated:** {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}  
**Target Volume:** 16,000 Usable Records (70% Train: 11,200 | 15% Validation: 2,400 | 15% Test: 2,400)  
**Strict Data Leakage Controls:** Pre-dispatch & in-transit telemetry features only; zero exposure to arrival outcomes.

---

## 1. Model A: Shipment Delay Prediction

### Objective
Predict the conditional probability that a consignment will experience delayed delivery exceeding planned tolerance.

### Algorithmic Comparison (Validation Set)
| Algorithm | Accuracy | Precision | Recall | F1-Score | ROC-AUC | PR-AUC |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Logistic Regression (Baseline)** | {summary_delay['validation_comparison']['logistic_regression']['accuracy']:.4f} | {summary_delay['validation_comparison']['logistic_regression']['precision']:.4f} | {summary_delay['validation_comparison']['logistic_regression']['recall']:.4f} | {summary_delay['validation_comparison']['logistic_regression']['f1']:.4f} | {summary_delay['validation_comparison']['logistic_regression']['roc_auc']:.4f} | {summary_delay['validation_comparison']['logistic_regression']['pr_auc']:.4f} |
| **Random Forest Classifier** | {summary_delay['validation_comparison']['random_forest']['accuracy']:.4f} | {summary_delay['validation_comparison']['random_forest']['precision']:.4f} | {summary_delay['validation_comparison']['random_forest']['recall']:.4f} | {summary_delay['validation_comparison']['random_forest']['f1']:.4f} | {summary_delay['validation_comparison']['random_forest']['roc_auc']:.4f} | {summary_delay['validation_comparison']['random_forest']['pr_auc']:.4f} |
| **HistGradientBoosting Classifier** | {summary_delay['validation_comparison']['hist_gradient_boosting']['accuracy']:.4f} | {summary_delay['validation_comparison']['hist_gradient_boosting']['precision']:.4f} | {summary_delay['validation_comparison']['hist_gradient_boosting']['recall']:.4f} | {summary_delay['validation_comparison']['hist_gradient_boosting']['f1']:.4f} | {summary_delay['validation_comparison']['hist_gradient_boosting']['roc_auc']:.4f} | {summary_delay['validation_comparison']['hist_gradient_boosting']['pr_auc']:.4f} |

**Selected Model:** `{summary_delay['algorithm']}`  
**Optimal Decision Threshold:** `{summary_delay['optimal_threshold']}`

### Final Held-Out Test Set Performance
- **Accuracy:** `{summary_delay['test_metrics']['accuracy']}`
- **Precision:** `{summary_delay['test_metrics']['precision']}`
- **Recall:** `{summary_delay['test_metrics']['recall']}`
- **F1 Score:** `{summary_delay['test_metrics']['f1']}`
- **ROC-AUC:** `{summary_delay['test_metrics']['roc_auc']}`
- **PR-AUC:** `{summary_delay['test_metrics']['pr_auc']}`
- **False Positive Rate:** `{summary_delay['test_metrics']['false_positive_rate']}`
- **False Negative Rate:** `{summary_delay['test_metrics']['false_negative_rate']}`

**Confusion Matrix (Test):**
```
TN: {summary_delay['test_metrics']['confusion_matrix']['tn']} | FP: {summary_delay['test_metrics']['confusion_matrix']['fp']}
FN: {summary_delay['test_metrics']['confusion_matrix']['fn']} | TP: {summary_delay['test_metrics']['confusion_matrix']['tp']}
```

### Feature Importance (Explainable AI Attribution)
"""
    for feat, imp in summary_delay['feature_importances'].items():
        md_content += f"- **`{feat}`**: {imp:+.4f}\n"

    md_content += f"""
---

## 2. Model B: Cold-Chain Temperature & Quality Risk

### Objective
Predict cold-chain integrity breaches and categorize into Safe (0), Moderate Excursion Warning (1), or Critical Quality Breach (2).

### Algorithmic Comparison (Validation Set)
| Algorithm | Accuracy | Macro Precision | Macro Recall | Macro F1 | Weighted F1 |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Multinomial Logistic Regression** | {summary_temp['validation_comparison']['multinomial_logistic_regression']['accuracy']:.4f} | {summary_temp['validation_comparison']['multinomial_logistic_regression']['macro_precision']:.4f} | {summary_temp['validation_comparison']['multinomial_logistic_regression']['macro_recall']:.4f} | {summary_temp['validation_comparison']['multinomial_logistic_regression']['macro_f1']:.4f} | {summary_temp['validation_comparison']['multinomial_logistic_regression']['weighted_f1']:.4f} |
| **Random Forest Classifier** | {summary_temp['validation_comparison']['random_forest']['accuracy']:.4f} | {summary_temp['validation_comparison']['random_forest']['macro_precision']:.4f} | {summary_temp['validation_comparison']['random_forest']['macro_recall']:.4f} | {summary_temp['validation_comparison']['random_forest']['macro_f1']:.4f} | {summary_temp['validation_comparison']['random_forest']['weighted_f1']:.4f} |
| **HistGradientBoosting Classifier** | {summary_temp['validation_comparison']['hist_gradient_boosting']['accuracy']:.4f} | {summary_temp['validation_comparison']['hist_gradient_boosting']['macro_precision']:.4f} | {summary_temp['validation_comparison']['hist_gradient_boosting']['macro_recall']:.4f} | {summary_temp['validation_comparison']['hist_gradient_boosting']['macro_f1']:.4f} | {summary_temp['validation_comparison']['hist_gradient_boosting']['weighted_f1']:.4f} |

**Selected Model:** `{summary_temp['algorithm']}`

### Final Held-Out Test Set Performance
- **Accuracy:** `{summary_temp['test_metrics']['accuracy']}`
- **Macro Precision:** `{summary_temp['test_metrics']['macro_precision']}`
- **Macro Recall:** `{summary_temp['test_metrics']['macro_recall']}`
- **Macro F1 Score:** `{summary_temp['test_metrics']['macro_f1']}`
- **Weighted F1 Score:** `{summary_temp['test_metrics']['weighted_f1']}`

**Confusion Matrix (Test Classes: [0: Compliant, 1: Moderate Excursion, 2: Critical]):**
```
{summary_temp['test_metrics']['confusion_matrix']}
```

### Feature Importance (Explainable AI Attribution)
"""
    for feat, imp in summary_temp['feature_importances'].items():
        md_content += f"- **`{feat}`**: {imp:+.4f}\n"

    md_content += """
---

## 3. Methodological Notes & Known Limitations
1. **Calibration**: Probabilities are raw model outputs and evaluated against empirical test distributions. In high-consequence biopharma shipments, human SOP overrides should be triggered for any probability > 0.40.
2. **Synthetic Data Disclosure**: 62.5% of records are synthetic physics-simulated. These scores represent high-fidelity stress tests rather than multi-year historical telemetry from a single enterprise.
3. **Sensor Disconnection**: Missing sensor telemetry is penalized via the `sensor_gap_duration` feature; long sensor blackouts automatically raise uncertainty flags.
"""

    with open("reports/model_evaluation.md", "w") as f:
        f.write(md_content)
        
    print("\nTraining and evaluation reports successfully written:")
    print("  - models/model_metadata.json")
    print("  - reports/model_evaluation.json")
    print("  - reports/model_evaluation.md")

if __name__ == "__main__":
    main()
