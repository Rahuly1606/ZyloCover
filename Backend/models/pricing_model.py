# models/pricing_model.py

import pandas as pd
from sklearn.ensemble import GradientBoostingRegressor
from sklearn.model_selection import train_test_split, cross_val_score
from sklearn.metrics import mean_absolute_error
import joblib
from pathlib import Path

def train_pricing_model():
    data_path = Path(__file__).resolve().parent.parent / 'ai' / 'data' / 'user_profiles.csv'
    df = pd.read_csv(data_path)
    
    feature_cols = [
        'zone_encoded', 'vehicle_encoded', 'platform_encoded',
        'avg_daily_income', 'month', 'account_age_days',
        'income_percentile', 'seasonal_index'
    ]
    
    X = df[feature_cols]
    y = df['fair_weekly_premium']
    
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42
    )
    
    model = GradientBoostingRegressor(
        n_estimators=200,
        max_depth=4,
        learning_rate=0.05,
        subsample=0.8,
        random_state=42
    )
    
    model.fit(X_train, y_train)
    
    mae = mean_absolute_error(y_test, model.predict(X_test))
    print(f"Pricing Model MAE: ₹{mae:.2f}")
    
    cv_scores = cross_val_score(model, X, y, cv=5, scoring='neg_mean_absolute_error')
    print(f"CV MAE: ₹{-cv_scores.mean():.2f} ± ₹{cv_scores.std():.2f}")
    
    # Feature importance for explainability
    importance = dict(zip(feature_cols, model.feature_importances_))
    
    model_output = Path(__file__).resolve().parent / 'pricing_model.pkl'
    joblib.dump({
        'model': model,
        'feature_cols': feature_cols,
        'feature_importance': importance,
        'mae': mae,
        'trained_at': pd.Timestamp.now().isoformat(),
    }, model_output)
    print("Pricing model saved.")
    return model


def predict_premium(user_features: dict, coverage_tier: str) -> dict:
    """Generate premium with explainability."""
    model_path = Path(__file__).resolve().parent / 'pricing_model.pkl'
    artifact = joblib.load(model_path)
    model = artifact['model']
    
    tier_multipliers = {'basic': 1.0, 'standard': 1.35, 'premium': 1.75}
    multiplier = tier_multipliers.get(coverage_tier, 1.0)
    
    X = pd.DataFrame([user_features])[artifact['feature_cols']]
    base_premium = float(model.predict(X)[0])
    final_premium = max(15.0, min(120.0, base_premium * multiplier))
    
    # Top contributing factors
    importance = artifact['feature_importance']
    top_factors = sorted(importance.items(), key=lambda x: -x[1])[:3]
    
    return {
        'base_premium': round(base_premium, 2),
        'tier_multiplier': multiplier,
        'final_premium': round(final_premium, 2),
        'top_pricing_factors': [
            {'factor': f, 'importance': round(v, 4)}
            for f, v in top_factors
        ],
        'model_mae': f"±₹{artifact['mae']:.2f}",
        'model_version': artifact['trained_at'][:10],
    }


if __name__ == "__main__":
    train_pricing_model()