# models/fraud_model.py

import pandas as pd
import numpy as np
import xgboost as xgb
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report, roc_auc_score
from sklearn.preprocessing import StandardScaler
import joblib
import shap  # for explainability
from pathlib import Path

def train_fraud_model():
    data_path = Path(__file__).resolve().parent.parent / 'ai' / 'data' / 'claims_history.csv'
    df = pd.read_csv(data_path)
    
    feature_cols = [
        'policy_age_hours', 'claims_7d', 'claims_30d',
        'gps_distance_km', 'account_age_days', 'city_match',
        'prior_fraud_flags', 'claim_velocity_zscore',
        'hour_of_day', 'day_of_week', 'income_anomaly_score',
        'simultaneous_claims_city'
    ]
    
    X = df[feature_cols]
    y = df['is_fraud']
    
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )
    
    # XGBoost handles class imbalance with scale_pos_weight
    fraud_ratio = (len(y) - y.sum()) / y.sum()
    
    model = xgb.XGBClassifier(
        n_estimators=100,
        max_depth=4,
        learning_rate=0.1,
        scale_pos_weight=fraud_ratio,  # handles 15% fraud rate
        use_label_encoder=False,
        eval_metric='auc',
        random_state=42
    )
    
    model.fit(
        X_train, y_train,
        eval_set=[(X_test, y_test)],
        verbose=False
    )
    
    y_pred_proba = model.predict_proba(X_test)[:, 1]
    auc = roc_auc_score(y_test, y_pred_proba)
    print(f"Fraud Model AUC: {auc:.4f}")
    print(classification_report(y_test, model.predict(X_test)))
    
    # SHAP explainer — critical for insurance explainability
    explainer = shap.TreeExplainer(model)
    
    model_output = Path(__file__).resolve().parent / 'fraud_model.pkl'
    joblib.dump({
        'model': model,
        'explainer': explainer,
        'feature_cols': feature_cols,
        'threshold_flag': 0.40,
        'threshold_reject': 0.70,
        'auc': auc,
        'trained_at': pd.Timestamp.now().isoformat(),
    }, model_output)
    
    print("Fraud model saved.")
    return model


def predict_fraud(features: dict) -> dict:
    """
    Call this from FastAPI.
    features: dict with all feature_cols keys
    """
    model_path = Path(__file__).resolve().parent / 'fraud_model.pkl'
    artifact = joblib.load(model_path)
    model = artifact['model']
    explainer = artifact['explainer']
    feature_cols = artifact['feature_cols']
    
    X = pd.DataFrame([features])[feature_cols]
    fraud_proba = float(model.predict_proba(X)[0][1])
    
    # SHAP explanation
    shap_values = explainer.shap_values(X)
    top_features = sorted(
        zip(feature_cols, shap_values[0]),
        key=lambda x: abs(x[1]),
        reverse=True
    )[:3]
    
    if fraud_proba >= artifact['threshold_reject']:
        decision = 'rejected'
    elif fraud_proba >= artifact['threshold_flag']:
        decision = 'flagged'
    else:
        decision = 'approved'
    
    return {
        'fraud_probability': round(fraud_proba, 4),
        'decision': decision,
        'top_risk_factors': [
            {'feature': f, 'impact': round(float(v), 4)}
            for f, v in top_features
        ],
        'model_version': artifact['trained_at'][:10],
    }


if __name__ == "__main__":
    train_fraud_model()