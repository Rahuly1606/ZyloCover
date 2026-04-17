# models/anomaly_model.py

import pandas as pd
import numpy as np
from sklearn.ensemble import IsolationForest
from sklearn.preprocessing import StandardScaler
import joblib
from pathlib import Path

def train_anomaly_model():
    data_path = Path(__file__).resolve().parent.parent / 'ai' / 'data' / 'weather_history.csv'
    df = pd.read_csv(data_path)
    
    # Engineer rolling features
    df = df.sort_values(['city', 'date'])
    df['rain_7d_mean'] = df.groupby('city')['rainfall_mm'].transform(
        lambda x: x.rolling(7, min_periods=1).mean()
    )
    df['rain_7d_std'] = df.groupby('city')['rainfall_mm'].transform(
        lambda x: x.rolling(7, min_periods=1).std().fillna(1)
    )
    df['rain_zscore'] = (df['rainfall_mm'] - df['rain_7d_mean']) / df['rain_7d_std'].clip(lower=0.1)
    df['temp_30d_mean'] = df.groupby('city')['temp_celsius'].transform(
        lambda x: x.rolling(30, min_periods=1).mean()
    )
    df['temp_deviation'] = df['temp_celsius'] - df['temp_30d_mean']
    df['aqi_30d_mean'] = df.groupby('city')['aqi'].transform(
        lambda x: x.rolling(30, min_periods=1).mean()
    )
    df['aqi_deviation'] = df['aqi'] - df['aqi_30d_mean']
    
    feature_cols = [
        'rainfall_mm', 'temp_celsius', 'aqi',
        'rain_zscore', 'temp_deviation', 'aqi_deviation',
        'month'
    ]
    
    X = df[feature_cols].fillna(0)
    
    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(X)
    
    # contamination = expected % of anomaly days (days with trigger-level events)
    model = IsolationForest(
        n_estimators=100,
        contamination=0.08,  # ~8% of days have extreme weather
        random_state=42
    )
    model.fit(X_scaled)
    
    # Validate: anomaly scores should correlate with trigger_fired label
    df['anomaly_score'] = -model.score_samples(X_scaled)  # higher = more anomalous
    correlation = df['anomaly_score'].corr(df['trigger_fired'])
    print(f"Anomaly score ↔ trigger_fired correlation: {correlation:.4f}")
    
    model_output = Path(__file__).resolve().parent / 'anomaly_model.pkl'
    joblib.dump({
        'model': model,
        'scaler': scaler,
        'feature_cols': feature_cols,
        'correlation': correlation,
        'trained_at': pd.Timestamp.now().isoformat(),
    }, model_output)
    print("Anomaly model saved.")
    return model


def detect_anomaly(weather_reading: dict, city_stats: dict) -> dict:
    """Detect weather anomalies using IsolationForest."""
    model_path = Path(__file__).resolve().parent / 'anomaly_model.pkl'
    artifact = joblib.load(model_path)
    model = artifact['model']
    scaler = artifact['scaler']
    
    rainfall = weather_reading.get('rainfall_mm', 0)
    temp = weather_reading.get('temp_celsius', 30)
    aqi = weather_reading.get('aqi', 100)
    month = weather_reading.get('month', 6)
    
    # Compute deviations using city's rolling stats
    rain_mean = city_stats.get('rain_7d_mean', 10)
    rain_std = max(city_stats.get('rain_7d_std', 5), 0.1)
    rain_zscore = (rainfall - rain_mean) / rain_std
    
    features = [[
        rainfall, temp, aqi,
        rain_zscore,
        temp - city_stats.get('temp_30d_mean', 30),
        aqi - city_stats.get('aqi_30d_mean', 100),
        month
    ]]
    
    features_scaled = scaler.transform(features)
    anomaly_score = float(-model.score_samples(features_scaled)[0])
    is_anomaly = model.predict(features_scaled)[0] == -1
    
    return {
        'anomaly_score': round(anomaly_score, 4),
        'is_anomaly': bool(is_anomaly),
        'rain_zscore': round(rain_zscore, 3),
        'interpretation': (
            f"Rainfall is {abs(rain_zscore):.1f} standard deviations "
            f"{'above' if rain_zscore > 0 else 'below'} the 7-day average"
        )
    }


if __name__ == "__main__":
    train_anomaly_model()