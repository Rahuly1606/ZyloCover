# models/risk_model.py
"""
Risk scoring model - GradientBoostingClassifier for predicting user risk profiles.
Replaced static risk_score=50.0 with learned model.
"""

import pandas as pd
import numpy as np
from sklearn.ensemble import GradientBoostingClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report, roc_auc_score
import joblib
from pathlib import Path

def train_risk_model():
    """Train risk scoring classifier."""
    data_path = Path(__file__).resolve().parent.parent / 'ai' / 'data' / 'user_profiles.csv'
    df = pd.read_csv(data_path)
    
    feature_cols = [
        'zone_encoded', 'vehicle_encoded', 'platform_encoded',
        'avg_daily_income', 'month', 'account_age_days',
        'income_percentile', 'seasonal_index'
    ]
    
    X = df[feature_cols]
    y = df['is_high_risk']  # binary: 1 if true_loss_prob > 0.20
    
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )
    
    model = GradientBoostingClassifier(
        n_estimators=150,
        max_depth=4,
        learning_rate=0.08,
        subsample=0.8,
        random_state=42
    )
    
    model.fit(X_train, y_train)
    
    y_pred_proba = model.predict_proba(X_test)[:, 1]
    auc = roc_auc_score(y_test, y_pred_proba)
    print(f"Risk Model AUC: {auc:.4f}")
    print(classification_report(y_test, model.predict(X_test)))
    
    # Feature importance
    importance = dict(zip(feature_cols, model.feature_importances_))
    
    model_output = Path(__file__).resolve().parent / 'risk_model.pkl'
    joblib.dump({
        'model': model,
        'feature_cols': feature_cols,
        'feature_importance': importance,
        'auc': auc,
        'trained_at': pd.Timestamp.now().isoformat(),
    }, model_output)
    
    print("Risk model saved.")
    return model


def predict_risk_score(user_features: dict) -> dict:
    """
    Predict risk score (0-100) for a user.
    Returns continuous score instead of static 50.0.
    """
    model_path = Path(__file__).resolve().parent / 'risk_model.pkl'
    artifact = joblib.load(model_path)
    model = artifact['model']
    
    X = pd.DataFrame([user_features])[artifact['feature_cols']]
    risk_probability = float(model.predict_proba(X)[0, 1])  # P(high_risk)
    risk_score = int(risk_probability * 100)  # 0-100 scale
    
    # Top contributing factors
    importance = artifact['feature_importance']
    top_factors = sorted(importance.items(), key=lambda x: -x[1])[:3]
    
    risk_tier = (
        'high' if risk_score > 70
        else 'medium' if risk_score > 40
        else 'low'
    )
    
    return {
        'risk_score': risk_score,
        'risk_tier': risk_tier,
        'risk_probability': round(risk_probability, 4),
        'top_risk_factors': [
            {'factor': f, 'importance': round(v, 4)}
            for f, v in top_factors
        ],
        'model_version': artifact['trained_at'][:10],
    }


if __name__ == "__main__":
    train_risk_model()
