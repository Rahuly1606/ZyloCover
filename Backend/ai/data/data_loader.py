# data_loader.py — run once, generate all training data

import numpy as np
import pandas as pd
from datetime import datetime, timedelta
from pathlib import Path

np.random.seed(42)

# ── Weather History (for anomaly detection + trigger model) ──
def generate_weather_history(n_cities=15, n_days=365*3):
    """
    3 years of daily weather per city.
    Seasonal patterns + realistic noise.
    """
    cities = ['mumbai','delhi','bangalore','hyderabad','pune',
              'chennai','kolkata','ahmedabad','jaipur','lucknow',
              'noida','gurugram','nagpur','kochi','guwahati']
    
    records = []
    base_date = datetime(2023, 1, 1)
    
    for city in cities:
        # City-specific baselines
        coastal = city in ['mumbai','chennai','kochi','kolkata','guwahati']
        arid = city in ['jaipur','ahmedabad']
        northern = city in ['delhi','noida','gurugram','lucknow']
        
        for day in range(n_days):
            date = base_date + timedelta(days=day)
            month = date.month
            
            # Rainfall (seasonal pattern)
            monsoon_factor = {6:3,7:4,8:3.5,9:2}.get(month, 0.3)
            coastal_factor = 1.8 if coastal else 1.0
            rain_base = 5 * monsoon_factor * coastal_factor
            rainfall = max(0, np.random.gamma(2, rain_base/2))
            
            # Temperature
            summer_factor = {4:1.2,5:1.35,6:1.2}.get(month, 1.0)
            winter_factor = {12:0.7,1:0.65,2:0.72}.get(month, 1.0)
            temp_base = 38 if arid else 32
            temp = temp_base * summer_factor * winter_factor + np.random.normal(0, 2)
            
            # AQI
            winter_smog = {10:1.5,11:2.0,12:2.5,1:2.8}.get(month, 1.0)
            aqi_base = 280 if northern else 90
            aqi = aqi_base * winter_smog + np.random.normal(0, 30)
            aqi = max(20, aqi)
            
            # Was a trigger actually fired? (label for trigger model)
            trigger_fired = (
                rainfall > 50 or temp > 42 or aqi > 400 or
                # Some false negatives: threshold breached but no trigger
                # (data quality issues in real world)
                (rainfall > 40 and np.random.random() < 0.1)
            )
            
            records.append({
                'city': city, 'date': date.date(),
                'month': month, 'rainfall_mm': round(rainfall, 2),
                'temp_celsius': round(temp, 2), 'aqi': round(aqi, 1),
                'trigger_fired': int(trigger_fired)
            })
    
    return pd.DataFrame(records)


# ── User + Claim History (for fraud model) ──
def generate_claim_history(n_users=500, n_claims=2000):
    """
    Synthetic claims with known fraud/legitimate labels.
    Fraud rate: ~15% (realistic for parametric insurance)
    """
    records = []
    
    for i in range(n_claims):
        is_fraud = np.random.random() < 0.15
        
        if is_fraud:
            # Fraud pattern: new account, bad GPS, high frequency
            policy_age_hours = np.random.uniform(0.1, 2.0)
            claims_7d = np.random.randint(4, 8)
            gps_distance_km = np.random.uniform(20, 150)
            account_age_days = np.random.randint(0, 14)
            city_match = np.random.random() < 0.3
            prior_flags = np.random.randint(1, 5)
            claim_velocity_zscore = np.random.uniform(2.5, 6.0)
        else:
            # Legitimate: older account, correct GPS, low frequency
            policy_age_hours = np.random.uniform(2, 168)
            claims_7d = np.random.randint(0, 3)
            gps_distance_km = np.random.uniform(0, 10)
            account_age_days = np.random.randint(7, 365)
            city_match = np.random.random() < 0.95
            prior_flags = np.random.randint(0, 1)
            claim_velocity_zscore = np.random.uniform(-1, 1.5)
        
        records.append({
            'policy_age_hours': round(policy_age_hours, 2),
            'claims_7d': claims_7d,
            'claims_30d': claims_7d + np.random.randint(0, 5),
            'gps_distance_km': round(gps_distance_km, 2),
            'account_age_days': account_age_days,
            'city_match': int(city_match),
            'prior_fraud_flags': prior_flags,
            'claim_velocity_zscore': round(claim_velocity_zscore, 3),
            'hour_of_day': np.random.randint(6, 22),
            'day_of_week': np.random.randint(0, 7),
            'income_anomaly_score': round(np.random.uniform(0,1) if is_fraud else np.random.uniform(0, 0.3), 3),
            'simultaneous_claims_city': np.random.randint(0, 3) if not is_fraud else np.random.randint(0, 1),
            'is_fraud': int(is_fraud)
        })
    
    return pd.DataFrame(records)


# ── User Risk Profiles (for risk + pricing models) ──
def generate_user_profiles(n_users=1000):
    zones = ['green','amber','red','crimson']
    vehicles = ['bike','bicycle','ev_bike','scooter']
    platforms = ['swiggy','zomato','zepto','blinkit','amazon']
    
    records = []
    for i in range(n_users):
        zone = np.random.choice(zones, p=[0.2,0.4,0.3,0.1])
        vehicle = np.random.choice(vehicles, p=[0.5,0.1,0.15,0.25])
        platform = np.random.choice(platforms)
        income = np.random.normal(650, 200)
        income = max(200, min(2000, income))
        month = np.random.randint(1, 13)
        
        # True risk (what we want the model to learn)
        zone_risk = {'green':0.05,'amber':0.12,'red':0.22,'crimson':0.32}[zone]
        vehicle_risk = {'bike':1.2,'bicycle':1.35,'ev_bike':1.15,'scooter':1.2}[vehicle]
        seasonal = {6:1.4,7:1.6,8:1.55,9:1.3,4:0.85,5:0.95}.get(month, 0.8)
        
        true_loss_prob = min(zone_risk * vehicle_risk * seasonal, 0.85)
        
        # Label: did this user actually file claims?
        actual_claims_month = np.random.binomial(4, true_loss_prob)
        
        # Premium label: what should they actually pay?
        fair_premium = max(15, min(120,
            income * 0.75 * true_loss_prob * 6 / 0.67
        ))
        
        records.append({
            'zone_encoded': ['green','amber','red','crimson'].index(zone),
            'vehicle_encoded': ['bike','bicycle','ev_bike','scooter'].index(vehicle),
            'platform_encoded': ['swiggy','zomato','zepto','blinkit','amazon'].index(platform),
            'avg_daily_income': round(income, 2),
            'month': month,
            'account_age_days': np.random.randint(1, 730),
            'income_percentile': round(np.random.uniform(0, 1), 3),
            'seasonal_index': round(seasonal, 3),
            'actual_claims_month': actual_claims_month,
            'fair_weekly_premium': round(fair_premium, 2),
            'is_high_risk': int(true_loss_prob > 0.20),
        })
    
    return pd.DataFrame(records)


if __name__ == "__main__":
    weather_df = generate_weather_history()
    claims_df = generate_claim_history()
    users_df = generate_user_profiles()

    output_dir = Path(__file__).resolve().parent
    output_dir.mkdir(parents=True, exist_ok=True)
    
    weather_df.to_csv(output_dir / 'weather_history.csv', index=False)
    claims_df.to_csv(output_dir / 'claims_history.csv', index=False)
    users_df.to_csv(output_dir / 'user_profiles.csv', index=False)
    
    print(f"Generated: {len(weather_df)} weather records, "
          f"{len(claims_df)} claims, {len(users_df)} user profiles")
