#!/usr/bin/env python
# Backend/train_all_models.py
"""
Complete model training pipeline for ZyloCover AI upgrade.
Run this once to train all 5 models using synthetic data.
"""

import sys
from pathlib import Path
import pandas as pd

# Add models to path
models_path = Path(__file__).resolve().parent / 'models'
sys.path.insert(0, str(models_path))

print("\n" + "="*70)
print("ZyloCover AI Model Training Pipeline v2.0")
print("="*70 + "\n")

# Step 1: Generate synthetic training data
print("[1/6] Generating synthetic training data...")
from ai.data.data_loader import generate_weather_history, generate_claim_history, generate_user_profiles

weather_df = generate_weather_history(n_cities=15, n_days=365*3)
claims_df = generate_claim_history(n_users=500, n_claims=2000)
users_df = generate_user_profiles(n_users=1000)

data_dir = Path(__file__).resolve().parent / 'ai' / 'data'
weather_df.to_csv(data_dir / 'weather_history.csv', index=False)
claims_df.to_csv(data_dir / 'claims_history.csv', index=False)
users_df.to_csv(data_dir / 'user_profiles.csv', index=False)

print(f"   ✓ Generated {len(weather_df)} weather records")
print(f"   ✓ Generated {len(claims_df)} claim records")
print(f"   ✓ Generated {len(users_df)} user profiles\n")

# Step 2: Train Fraud Detection Model
print("[2/6] Training Fraud Detection Model (XGBoost)...")
from models.fraud_model import train_fraud_model

train_fraud_model()
print("   ✓ Fraud model trained and saved\n")

# Step 3: Train Pricing Model
print("[3/6] Training Dynamic Pricing Model (GradientBoosting)...")
from models.pricing_model import train_pricing_model

train_pricing_model()
print("   ✓ Pricing model trained and saved\n")

# Step 4: Train Anomaly Detection Model
print("[4/6] Training Weather Anomaly Model (IsolationForest)...")
from models.anomaly_model import train_anomaly_model

train_anomaly_model()
print("   ✓ Anomaly model trained and saved\n")

# Step 5: Train Risk Scoring Model
print("[5/6] Training Risk Scoring Model (GradientBoosting)...")
from models.risk_model import train_risk_model

train_risk_model()
print("   ✓ Risk model trained and saved\n")

# Step 6: Train Forecast Models
print("[6/6] Training 7-Day Forecast Models (Prophet)...")
from models.forecast_model import train_city_forecast

cities = ['mumbai', 'delhi', 'bangalore', 'hyderabad', 'pune',
          'chennai', 'kolkata', 'ahmedabad', 'jaipur', 'lucknow',
          'noida', 'gurugram', 'nagpur', 'kochi', 'guwahati']

trained_count = 0
for city in cities:
    try:
        train_city_forecast(city)
        trained_count += 1
    except Exception as e:
        print(f"   ⚠ Failed to train forecast for {city}: {e}")

print(f"   ✓ Trained forecast models for {trained_count}/{len(cities)} cities\n")

print("="*70)
print("✓ ALL MODELS TRAINED SUCCESSFULLY")
print("="*70)
print(f"\nModel locations:")
print(f"  • fraud_model.pkl")
print(f"  • pricing_model.pkl")
print(f"  • anomaly_model.pkl")
print(f"  • risk_model.pkl")
print(f"  • forecast/*.pkl (one per city)")
print(f"\nNext: Start the AI service with:")
print(f"  python -m uvicorn app.ai.service:app --host 0.0.0.0 --port 8001")
print()
