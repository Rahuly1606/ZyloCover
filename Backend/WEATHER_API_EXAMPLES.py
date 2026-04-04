"""
EXAMPLE: Integrate Environmental Service with Pricing Routes
=============================================================
✅ PRODUCTION-READY CODE
"""

# File: app/api/routes/pricing.py (MODIFIED)

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from typing import Optional
import logging

from app.db.session import get_db
from app.models.user import User
from app.core.security import get_current_user
from app.services.pricing_engine import PricingEngine, PricingInput
from app.services.environmental import get_env_service  # ✅ NEW IMPORT
from app.models.claim import Claim  # ✅ MOVED IMPORT
from app.models.fraud import FraudEvent  # ✅ For fraud flags

router = APIRouter(prefix="/pricing", tags=["pricing"])
logger = logging.getLogger("raahpay.pricing")


@router.post("/calculate")
async def calculate_pricing(
    user_id: int = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Calculate weekly premium with REAL environmental data
    
    Flow:
    1. Fetch user profile
    2. ✅ Get real environmental snapshot for user's zone
    3. Run actuarial pricing engine
    4. Return breakdown with data source
    """
    
    # Get user
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Count experience months
    account_age = (datetime.utcnow() - user.created_at).days
    experience_months = max(0, account_age // 30)
    
    # Count past claims (last 12 months)
    twelve_months_ago = datetime.utcnow() - timedelta(days=365)
    past_claims_12m = db.query(Claim).filter(
        Claim.user_id == user_id,
        Claim.created_at >= twelve_months_ago
    ).count()
    
    # Count fraud flags
    past_fraud_flags = db.query(FraudEvent).filter(
        FraudEvent.user_id == user_id
    ).count()
    
    # ✅ STEP 1: Fetch REAL environmental data for user's zone
    env_service = get_env_service()
    snapshot = await env_service.get_snapshot(zone=user.work_zone, city="Hyderabad")
    
    logger.info(f"\n📊 Environmental Data for {user.work_zone}:")
    logger.info(f"   Temperature: {snapshot.temp_c}°C")
    logger.info(f"   Rainfall: {snapshot.rainfall_mm}mm")
    logger.info(f"   AQI: {snapshot.aqi}")
    logger.info(f"   Wind: {snapshot.wind_kmph} km/h")
    logger.info(f"   Active Triggers: {snapshot.triggers_active}")
    logger.info(f"   Data Source: {snapshot.data_source}\n")
    
    # ✅ STEP 2: Create pricing input with REAL environmental data
    pricing_input = PricingInput(
        user_id=user_id,
        work_zone=user.work_zone,
        platform=user.platform,
        avg_daily_income=user.avg_daily_income,
        avg_daily_hours=user.avg_daily_hours,
        experience_months=experience_months,
        # ✅ Use REAL environmental data
        rainfall_7d_forecast_mm=snapshot.rainfall_mm,
        current_aqi=snapshot.aqi,
        current_temp_c=snapshot.temp_c,
        wind_speed_kmph=snapshot.wind_kmph,
        past_claims_12m=past_claims_12m,
        past_fraud_flags=past_fraud_flags,
    )
    
    # ✅ STEP 3: Calculate premium using real data
    engine = PricingEngine()
    output = engine.calculate(pricing_input)
    
    # ✅ STEP 4: Return with data source indicator
    return {
        "weekly_premium": output.weekly_premium,
        "weekly_premium_ex_gst": output.weekly_premium_ex_gst,
        "max_weekly_payout": output.max_weekly_payout,
        "daily_income_insured": output.daily_income_insured,
        "coverage_hours_per_day": output.coverage_hours_per_day,
        "breakdown": output.breakdown,
        "risk_score": output.risk_score,
        "risk_label": output.risk_label,
        # ✅ Include data source so frontend knows if real or mock
        "data_source": snapshot.data_source,
        "environmental_snapshot": {
            "temp_c": snapshot.temp_c,
            "rainfall_mm": snapshot.rainfall_mm,
            "aqi": snapshot.aqi,
            "wind_kmph": snapshot.wind_kmph,
            "active_triggers": snapshot.triggers_active,
        }
    }


# ═══════════════════════════════════════════════════════════════════
# EXAMPLE 2: Integrate with Trigger Routes
# ═══════════════════════════════════════════════════════════════════

# File: app/api/routes/trigger.py (MODIFIED)

from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
import logging

from app.db.session import get_db
from app.models.trigger import TriggerEvent
from app.core.security import get_current_user
from app.services.environmental import get_env_service, ZONE_CENTROIDS
from app.services.claim_pipeline import process_trigger

trigger_router = APIRouter(prefix="/trigger", tags=["trigger"])
trigger_logger = logging.getLogger("raahpay.trigger")


@trigger_router.post("/simulate")
async def simulate_trigger(
    zone: str = Query(..., description="Work zone to simulate"),
    user_id: int = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Simulate trigger detection for a zone
    
    This uses REAL environmental data to check if thresholds are breached.
    If triggers are found, fire them through the claim pipeline.
    """
    
    if zone not in ZONE_CENTROIDS:
        raise HTTPException(status_code=400, detail=f"Invalid zone: {zone}")
    
    # ✅ STEP 1: Fetch REAL environmental data
    env_service = get_env_service()
    snapshot = await env_service.get_snapshot(zone=zone, city="Hyderabad")
    
    trigger_logger.info(f"🌍 Trigger simulation for {zone}")
    trigger_logger.info(f"   Temp: {snapshot.temp_c}°C, Rain: {snapshot.rainfall_mm}mm, "
                        f"AQI: {snapshot.aqi}, Wind: {snapshot.wind_kmph} km/h")
    
    created_triggers = []
    
    # ✅ STEP 2: For each active trigger, create event + fire pipeline
    if snapshot.triggers_active:
        for trigger_type in snapshot.triggers_active:
            # Check for duplicate triggers (same zone + type within 1 hour)
            one_hour_ago = datetime.utcnow() - timedelta(hours=1)
            
            existing = db.query(TriggerEvent).filter(
                TriggerEvent.affected_zone == zone,
                TriggerEvent.trigger_type == trigger_type,
                TriggerEvent.status == "active",
                TriggerEvent.triggered_at >= one_hour_ago
            ).first()
            
            if existing:
                trigger_logger.info(f"   ⏭️  Skipping {trigger_type} - duplicate within 1h")
                continue
            
            # Calculate severity and payout multiplier
            measured, threshold = _get_measured_and_threshold(snapshot, trigger_type)
            
            if measured > 0 and threshold > 0:
                severity_pct = ((measured / threshold) - 1.0) * 100
            else:
                severity_pct = 0
            
            # Graduated payout multiplier: 1.0 + (measured/threshold - 1.0) × 0.5
            multiplier = 1.0 + max(0, (measured / threshold - 1.0) * 0.5)
            multiplier = min(multiplier, 1.5)  # Cap at 1.5x
            
            # Create trigger event
            trigger = TriggerEvent(
                trigger_type=trigger_type,
                affected_zone=zone,
                affected_city="Hyderabad",
                measured_value=measured,
                threshold_value=threshold,
                severity_pct=severity_pct,
                payout_multiplier=multiplier,
                status="active",
                data_source=snapshot.data_source,
                raw_api_response=snapshot.raw_response,
            )
            
            db.add(trigger)
            db.flush()  # Get the trigger ID
            
            trigger_logger.info(f"   ✅ Created {trigger_type} trigger (severity: {severity_pct:.1f}%, "
                               f"multiplier: {multiplier:.2f}x)")
            
            created_triggers.append({
                "trigger_type": trigger_type,
                "severity_pct": round(severity_pct, 2),
                "payout_multiplier": round(multiplier, 2)
            })
            
            # ✅ STEP 3: Fire claim pipeline automatically
            try:
                await process_trigger(trigger, db)
                trigger_logger.info(f"   🚀 Claim pipeline fired for {trigger_type}")
            except Exception as e:
                trigger_logger.error(f"   ❌ Claim pipeline error: {e}")
    
    db.commit()
    
    return {
        "zone": zone,
        "data_source": snapshot.data_source,
        "environmental_conditions": {
            "temp_c": snapshot.temp_c,
            "rainfall_mm": snapshot.rainfall_mm,
            "aqi": snapshot.aqi,
            "wind_kmph": snapshot.wind_kmph,
        },
        "active_triggers": created_triggers if created_triggers else None,
        "message": f"Found {len(created_triggers)} triggers in {zone}"
    }


def _get_measured_and_threshold(snapshot, trigger_type: str) -> tuple:
    """Helper to extract measured value and threshold"""
    from app.core.config import get_settings
    
    settings = get_settings()
    
    mapping = {
        "heavy_rain": (snapshot.rainfall_mm, settings.RAIN_TRIGGER_MM),
        "extreme_heat": (snapshot.temp_c, settings.TEMP_TRIGGER_C),
        "high_aqi": (snapshot.aqi, settings.AQI_TRIGGER),
        "strong_winds": (snapshot.wind_kmph, settings.WIND_TRIGGER_KMPH),
    }
    
    return mapping.get(trigger_type, (0.0, 1.0))
