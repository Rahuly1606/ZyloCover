# models/forecast_model.py
# pip install prophet

from prophet import Prophet
import pandas as pd
import joblib
import os
from pathlib import Path

def train_city_forecast(city: str):
    data_path = Path(__file__).resolve().parent.parent / 'ai' / 'data' / 'weather_history.csv'
    df = pd.read_csv(data_path)
    city_df = df[df['city'] == city][['date', 'rainfall_mm', 'trigger_fired']].copy()
    
    # Prophet needs 'ds' and 'y' columns
    city_df = city_df.rename(columns={'date': 'ds', 'trigger_fired': 'y'})
    city_df['ds'] = pd.to_datetime(city_df['ds'])
    
    model = Prophet(
        yearly_seasonality=True,
        weekly_seasonality=True,
        daily_seasonality=False,
        seasonality_mode='multiplicative',
        interval_width=0.80
    )
    
    # Add rainfall as regressor
    model.add_regressor('rainfall_mm')
    city_df['rainfall_mm'] = city_df['rainfall_mm'].fillna(0)
    
    model.fit(city_df)
    
    os.makedirs(f'models/forecast', exist_ok=True)
    joblib.dump(model, f'models/forecast/{city}_prophet.pkl')
    print(f"Forecast model trained for {city}")


def forecast_city_risk(city: str, days: int = 7) -> list:
    model_path = f'models/forecast/{city}_prophet.pkl'
    if not os.path.exists(model_path):
        return []
    
    model = joblib.load(model_path)
    
    future = model.make_future_dataframe(periods=days, freq='D')
    
    # Fill rainfall with seasonal average (we don't know future rain)
    future['rainfall_mm'] = 15.0  # baseline
    
    forecast = model.predict(future)
    
    results = []
    for _, row in forecast.tail(days).iterrows():
        risk_prob = max(0, min(1, row['yhat']))
        results.append({
            'date': row['ds'].strftime('%Y-%m-%d'),
            'trigger_probability': round(risk_prob, 3),
            'lower_bound': round(max(0, row['yhat_lower']), 3),
            'upper_bound': round(min(1, row['yhat_upper']), 3),
            'risk_level': (
                'high' if risk_prob > 0.3
                else 'medium' if risk_prob > 0.15
                else 'low'
            )
        })
    
    return results