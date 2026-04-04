"""
WEATHER API INTEGRATION GUIDE
==============================

This document explains how to integrate real-time weather APIs into RaahPay.

ARCHITECTURE OVERVIEW
=====================

┌──────────────────────────────────────────────────────────┐
│         Environmental Data Service                        │
│  (openweathermap + waqi + fallback mock)                 │
└───────────────────┬──────────────────────────────────────┘
                    │
        ┌───────────┼───────────┐
        │           │           │
        ▼           ▼           ▼
   Trigger    Pricing      Claim
   Routes     Routes       Pipeline
        │           │           │
        └───────────┼───────────┘
                    │
            ┌───────▼────────┐
            │   Scheduler    │
            │  (every 5min)  │
            └────────────────┘


STEP-BY-STEP INTEGRATION
========================

1️⃣ ENVIRONMENT VARIABLES (.env)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

# Get free API key from: https://openweathermap.org/api
OPENWEATHER_API_KEY=your_api_key_here

# Get from: https://aqicn.org/data-platform/
WAQI_API_KEY=your_token_here

# Toggle between real and mock data
USE_MOCK_ENV_DATA=False  # Set to False for real APIs

# API call timeout
WEATHER_API_TIMEOUT=5


2️⃣ CONFIGURATION UPDATE (app/core/config.py)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✅ Already Updated in this session
- Added OPENWEATHER_API_KEY
- Added WAQI_API_KEY  
- Added WEATHER_API_TIMEOUT


3️⃣ ENVIRONMENTAL SERVICE (app/services/environmental.py)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✅ Already Updated with:
- Async HTTP calls using httpx
- Parallel API requests (weather + AQI)
- Graceful fallback to mock data
- Full audit logging
- Trigger detection logic


4️⃣ INTEGRATION WITH SCHEDULER (app/engine/scheduler.py)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

CURRENT CODE:
    Uses TriggerSimulator with mock data
    
UPDATE TO:
    1. Import environmental service
    2. Replace TriggerSimulator with real API calls
    
CODE CHANGE:

Replace this:
    @staticmethod
    def get_simulated_conditions(city: str) -> dict:
        # ...returns mock data

With this:
    async def fetch_zone_conditions(zone: str) -> EnvironmentalSnapshot:
        env_service = get_env_service()
        snapshot = await env_service.get_snapshot(zone)
        return snapshot


5️⃣ INTEGRATION WITH PRICING ENGINE (POST /pricing/calculate)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

CURRENT: Uses static mock environmental inputs
UPDATE: Fetch REAL data for the user's zone

Example modification:

    @router.post("/calculate")
    async def calculate_pricing(
        req: PricingInput,
        user_id: int = Depends(get_current_user),
        db: Session = Depends(get_db)
    ):
        user = db.query(User).filter(User.id == user_id).first()
        
        # ✅ Fetch REAL environmental data
        env_service = get_env_service()
        snapshot = await env_service.get_snapshot(user.work_zone)
        
        # Use real data for pricing calculation
        pricing_input = PricingInput(
            user_id=user.id,
            work_zone=user.work_zone,
            platform=user.platform,
            avg_daily_income=user.avg_daily_income,
            avg_daily_hours=user.avg_daily_hours,
            experience_months=experience_months,
            rainfall_7d_forecast_mm=snapshot.rainfall_mm,  # ✅ Real data
            current_aqi=snapshot.aqi,                       # ✅ Real data
            current_temp_c=snapshot.temp_c,                 # ✅ Real data
            wind_speed_kmph=snapshot.wind_kmph,             # ✅ Real data
        )
        
        # Calculate premium
        engine = PricingEngine()
        output = engine.calculate(pricing_input)
        
        return output


6️⃣ INTEGRATION WITH TRIGGER DETECTION (POST /trigger/simulate)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

CURRENT: Uses TriggerSimulator.get_simulated_conditions()
UPDATE: Use real environmental data

Example:
    
    @router.post("/simulate")
    async def simulate_trigger(zone: str, db: Session = Depends(get_db)):
        # Fetch real environmental data
        env_service = get_env_service()
        snapshot = await env_service.get_snapshot(zone)
        
        # Check active triggers
        if snapshot.triggers_active:
            for trigger_type in snapshot.triggers_active:
                # Create trigger event in database
                trigger = TriggerEvent(
                    trigger_type=trigger_type,
                    affected_zone=zone,
                    measured_value=get_measured_value(snapshot, trigger_type),
                    threshold_value=get_threshold(trigger_type),
                    severity_pct=calculate_severity(snapshot, trigger_type),
                )
                db.add(trigger)
        
        db.commit()
        return {"zone": zone, "triggers": snapshot.triggers_active}


7️⃣ INTEGRATION WITH SCHEDULER MONITORING CYCLE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

UPDATE app/engine/scheduler.py:

    async def monitoring_cycle():
        \"\"\"Every 5 minutes: fetch weather + fire triggers\"\"\"
        env_service = get_env_service()
        
        for zone in ZONE_CENTROIDS.keys():
            # Fetch REAL environmental data
            snapshot = await env_service.get_snapshot(zone)
            
            logger.info(f"📊 {zone}: {snapshot.temp_c}°C, AQI={snapshot.aqi}")
            
            # Check for triggers
            if snapshot.triggers_active:
                for trigger_type in snapshot.triggers_active:
                    # Create trigger event
                    trigger = await create_trigger_event(
                        trigger_type=trigger_type,
                        zone=zone,
                        snapshot=snapshot
                    )
                    
                    # Fire claim pipeline
                    await process_trigger(trigger)
            
            # Check for duplicates within 1 hour
            await check_duplicate_triggers(zone)


FEATURE FLAGS
=============

USE_MOCK_ENV_DATA = True:  All zones use statistical mock data
USE_MOCK_ENV_DATA = False: Real APIs (OpenWeatherMap + WAQI)

If an API call fails, automatically falls back to mock data.


TESTING
=======

1. Test individual zone data fetch:
   cd Backend
   python -m pytest test_weather_api.py

2. Test all zones in parallel:
   python test_weather_api.py

3. Test with real API keys:
   1. Add your API keys to .env
   2. Set USE_MOCK_ENV_DATA=False
   3. Run trigger simulation: POST /trigger/simulate?zone=zone_d_residential

4. Monitor logs:
   grep "✅\|❌" your_logs.txt


PRODUCTION CHECKLIST
====================

□ Add API keys to environment (don't commit to git!)
□ Set USE_MOCK_ENV_DATA=False in production .env
□ Set WEATHER_API_TIMEOUT to 3-5 seconds
□ Test all 5 zones load successfully
□ Verify fallback behavior when APIs are down
□ Monitor API response times
□ Set up alerts for API failures
□ Cache API responses (optional: Redis)


DATAFLOW EXAMPLE
================

User visits /pricing/calculate endpoint:

1. Frontend sends POST with user data
2. Backend fetches user record
3. ✅ Backend calls get_snapshot(user.work_zone)
4. ✅ Environmental Service tries OpenWeatherMap API
5. ✅ Environmental Service tries WAQI API
6. ✅ If both succeed: Parse + return real snapshot
7. ✅ If either fails: Log + return mock snapshot
8. Backend passes snapshot to pricing engine
9. Pricing engine uses real environmental factors
10. Premium calculated actuarially
11. Response includes data_source: "openweathermap+waqi" or "mock"


NEXT STEPS
==========

1. Get API keys (free tier available):
   - OpenWeatherMap: https://openweathermap.org/api
   - WAQI: https://aqicn.org/data-platform/

2. Add to .env:
   OPENWEATHER_API_KEY=your_key
   WAQI_API_KEY=your_token

3. Set USE_MOCK_ENV_DATA=False

4. Restart backend and test!


DEBUGGING TIPS
==============

If APIs not working:
1. Check logs for "Real API fetch failed"
2. Verify API keys in .env
3. Test API directly: curl https://api.openweathermap.org/data/2.5/weather?lat=17.4&lon=78.4&appid=KEY
4. Check API rate limits
5. Fall back is automatic - mock data will be used instead

To force mock data during testing:
- Set USE_MOCK_ENV_DATA=True in .env
- Data will be consistent statistical data per zone
"""
