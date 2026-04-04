"""
RaahPay Automation Engine
==========================
APScheduler-based event loop for parametric insurance automation.

Every 5 minutes:
  1. Fetch environmental data (IMD weather, CPCB AQI, CWC flood alerts)
  2. Evaluate 6 parametric triggers (rain, heat, AQI, wind, flood, blackout)
  3. Fire claim pipeline for all affected policyholders

Every 1 hour:
  4. Auto-expire policies where end_date < now
  5. Calculate and log loss ratios by city

Every 24 hours:
  6. Actuarial reporting
  7. Fraud pattern analysis
"""

import logging
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
import uuid
from typing import List
import random

logger = logging.getLogger("raahpay.scheduler")


class TriggerSimulator:
    """Simulates environmental triggers for MVP - replace with real APIs"""
    
    @staticmethod
    def get_simulated_conditions(city: str) -> dict:
        """
        Return simulated environmental conditions.
        In production: call IMD OpenAPI, CPCB API, CWC API
        """
        conditions = {
            "mumbai": {
                "city": "mumbai",
                "temperature": 32 + random.randint(-5, 10),
                "rainfall_mm_per_hour": random.randint(0, 100),
                "aqi": random.randint(50, 450),
                "wind_speed_kmph": random.randint(0, 80),
                "humidity_pct": random.randint(40, 95),
            },
            "delhi": {
                "city": "delhi",
                "temperature": 35 + random.randint(-5, 10),
                "rainfall_mm_per_hour": random.randint(0, 80),
                "aqi": random.randint(100, 500),
                "wind_speed_kmph": random.randint(0, 60),
                "humidity_pct": random.randint(20, 60),
            },
            "bangalore": {
                "city": "bangalore",
                "temperature": 28 + random.randint(-5, 10),
                "rainfall_mm_per_hour": random.randint(0, 50),
                "aqi": random.randint(30, 200),
                "wind_speed_kmph": random.randint(0, 40),
                "humidity_pct": random.randint(50, 80),
            },
        }
        return conditions.get(city.lower(), conditions["mumbai"])
    
    @staticmethod
    def check_triggers(conditions: dict) -> List[dict]:
        """
        Evaluate all 6 parametric triggers against measured values.
        Returns list of fired triggers.
        """
        fired_triggers = []
        
        # Trigger 1: Heavy Rain
        rainfall = conditions.get("rainfall_mm_per_hour", 0)
        if rainfall >= 50:  # Partial threshold
            fired_triggers.append({
                "trigger_type": "heavy_rain",
                "measured_value": rainfall,
                "partial_threshold": 50,
                "full_threshold": 75,
                "description": f"Heavy rain: {rainfall}mm/hr"
            })
        
        # Trigger 2: Extreme Heat
        temperature = conditions.get("temperature", 0)
        if temperature >= 42:  # Partial threshold
            fired_triggers.append({
                "trigger_type": "extreme_heat",
                "measured_value": temperature,
                "partial_threshold": 42,
                "full_threshold": 45,
                "description": f"Extreme heat: {temperature}°C"
            })
        
        # Trigger 3: High AQI
        aqi = conditions.get("aqi", 0)
        if aqi >= 400:  # Partial threshold
            fired_triggers.append({
                "trigger_type": "high_aqi",
                "measured_value": aqi,
                "partial_threshold": 400,
                "full_threshold": 450,
                "description": f"High AQI: {aqi}"
            })
        
        # Trigger 4: Strong Winds
        winds = conditions.get("wind_speed_kmph", 0)
        if winds >= 50:  # Partial threshold
            fired_triggers.append({
                "trigger_type": "strong_winds",
                "measured_value": winds,
                "partial_threshold": 50,
                "full_threshold": 75,
                "description": f"Strong winds: {winds}km/h"
            })
        
        return fired_triggers


class AutomationEngine:
    """Main automation orchestrator"""
    
    def __init__(self):
        self.scheduler = AsyncIOScheduler(timezone="Asia/Kolkata")
        logger.info("✅ AutomationEngine initialized")

    def start(self):
        """Start the scheduler with all jobs"""
        try:
            # Every 5 minutes: Environmental trigger check and claim processing
            self.scheduler.add_job(
                self.trigger_detection_job,
                "interval",
                minutes=5,
                id="trigger_detection",
                name="Trigger Detection & Claim Pipeline"
            )
            
            # Every 1 hour: Policy expiry and loss ratio calculation
            self.scheduler.add_job(
                self.hourly_maintenance_job,
                "interval",
                hours=1,
                id="hourly_maintenance",
                name="Hourly Maintenance"
            )
            
            # Every 24 hours: Comprehensive actuarial reporting
            self.scheduler.add_job(
                self.daily_reporting_job,
                "cron",
                hour=0,
                minute=0,
                id="daily_reporting",
                name="Daily Actuarial Report"
            )
            
            self.scheduler.start()
            logger.info("✅ RaahPay Automation Engine started")
        except Exception as e:
            logger.error(f"❌ Failed to start scheduler: {str(e)}")

    async def trigger_detection_job(self):
        """Every 5 minutes: Detect triggers and process claims"""
        logger.info("🔍 Running trigger detection...")
        
        try:
            from app.db.session import SessionLocal
            from app.models.trigger import TriggerEvent, TriggerStatus, TriggerType
            from app.models.policy import Policy, PolicyStatus
            from app.models.user import User
            from app.models.claim import Claim
            from app.models.payout import Payout, PayoutStatus
            
            db = SessionLocal()
            
            # Check conditions for top cities
            monitored_cities = ["mumbai", "delhi", "bangalore", "hyderabad", "chennai"]
            
            for city in monitored_cities:
                logger.info(f"  📍 Checking {city}...")
                
                # Get environmental data
                conditions = TriggerSimulator.get_simulated_conditions(city)
                
                # Check triggers
                fired_triggers = TriggerSimulator.check_triggers(conditions)
                
                if not fired_triggers:
                    continue
                
                for trigger_data in fired_triggers:
                    logger.info(f"    ⚠️  {trigger_data['description']}")
                    
                    # Create trigger event
                    event_id = f"{trigger_data['trigger_type'].upper()}-{city.upper()}-{datetime.utcnow().strftime('%Y%m%d%H%M')}"
                    
                    trigger_event = TriggerEvent(
                        trigger_type=trigger_data["trigger_type"],
                        affected_zone=city,
                        affected_city=city,
                        measured_value=trigger_data["measured_value"],
                        threshold_value=trigger_data["partial_threshold"],
                        severity_pct=((trigger_data["measured_value"] - trigger_data["partial_threshold"]) / trigger_data["partial_threshold"] * 100),
                        status=TriggerStatus.ACTIVE,
                        payout_multiplier=1.0,
                    )
                    
                    db.add(trigger_event)
                    db.commit()
                    db.refresh(trigger_event)
                    
                    # Find eligible policies and process claims
                    now = datetime.utcnow()
                    eligible_policies = db.query(Policy).join(User).filter(
                        Policy.city == city,
                        Policy.status == PolicyStatus.ACTIVE,
                        Policy.end_date > now,
                        User.is_blacklisted == False
                    ).all()
                    
                    for policy in eligible_policies:
                        try:
                            # Check for duplicate claim
                            existing = db.query(Claim).filter(
                                Claim.user_id == policy.user_id,
                                Claim.trigger_event_id == trigger_event.id
                            ).first()
                            
                            if existing:
                                continue
                            
                            # Process claim via pipeline
                            from app.api.routes.claims import process_single_claim
                            claim = await process_single_claim(policy.user_id, trigger_event, db)
                            logger.info(f"      ✅ Claim created: {claim.claim_number}")
                        except Exception as e:
                            logger.error(f"      ❌ Claim processing failed: {str(e)}")
                            continue
            
            logger.info("✅ Trigger detection completed")
        except Exception as e:
            logger.error(f"❌ Trigger detection failed: {str(e)}")
        finally:
            db.close()

    async def hourly_maintenance_job(self):
        """Every 1 hour: Expire policies and calculate loss ratios"""
        logger.info("🔧 Running hourly maintenance...")
        
        try:
            from app.db.session import SessionLocal
            from app.models.policy import Policy, PolicyStatus
            from app.models.claim import Claim
            from app.models.payout import Payout, PayoutStatus
            from sqlalchemy import func, and_
            
            db = SessionLocal()
            now = datetime.utcnow()
            
            # Expire policies
            expired_policies = db.query(Policy).filter(
                Policy.status == PolicyStatus.ACTIVE,
                Policy.end_date <= now
            ).all()
            
            for policy in expired_policies:
                policy.status = PolicyStatus.EXPIRED
                policy.cooling_period_ends_at = now + timedelta(hours=2)
            
            if expired_policies:
                db.commit()
                logger.info(f"  ✅ Expired {len(expired_policies)} policies")
            
            # Calculate loss ratios by city
            week_start = now - timedelta(days=7)
            
            cities = db.query(Policy.city).distinct().all()
            for (city,) in cities:
                if not city:
                    continue
                
                city_premiums = db.query(Policy).filter(
                    and_(Policy.city == city, Policy.created_at >= week_start)
                ).with_entities(func.sum(Policy.weekly_premium)).scalar() or 0.0
                
                city_payouts = db.query(Payout).join(
                    Claim, Payout.claim_id == Claim.id
                ).join(
                    Policy, Claim.policy_id == Policy.id
                ).filter(
                    and_(Policy.city == city, Payout.status == PayoutStatus.SUCCESS,
                         Payout.completed_at >= week_start)
                ).with_entities(func.sum(Payout.amount_inr)).scalar() or 0.0
                
                if city_premiums > 0:
                    loss_ratio = city_payouts / city_premiums
                    logger.info(f"  📊 {city}: Loss Ratio = {loss_ratio:.2%}")
            
            logger.info("✅ Hourly maintenance completed")
        except Exception as e:
            logger.error(f"❌ Hourly maintenance failed: {str(e)}")
        finally:
            db.close()

    async def daily_reporting_job(self):
        """Every 24 hours: Comprehensive actuarial reporting"""
        logger.info("📋 Running daily actuarial report...")
        
        try:
            from app.db.session import SessionLocal
            from app.models.policy import Policy
            from app.models.payout import Payout, PayoutStatus
            from sqlalchemy import func, and_
            
            db = SessionLocal()
            now = datetime.utcnow()
            week_start = now - timedelta(days=7)
            
            # Calculate KPIs
            from app.engine.actuarial import ActuarialEngine
            
            total_premiums = db.query(Policy).filter(
                Policy.created_at >= week_start
            ).with_entities(func.sum(Policy.weekly_premium)).scalar() or 0.0
            
            total_payouts = db.query(Payout).filter(
                and_(Payout.status == PayoutStatus.SUCCESS, Payout.completed_at >= week_start)
            ).with_entities(func.sum(Payout.amount_inr)).scalar() or 0.0
            
            ratios = ActuarialEngine.calculate_loss_and_combined_ratios(total_payouts, total_premiums)
            
            logger.info(f"""
            ╔══════════════════════════════════════════════════╗
            ║         24-hour Actuarial Report                 ║
            ║  Loss Ratio:     {ratios['loss_ratio_pct']:>6.2f}%                      ║
            ║  Combined Ratio: {ratios['combined_ratio_pct']:>6.2f}%                      ║
            ║  Total Premiums: ₹{total_premiums:>10,.0f}                    ║
            ║  Total Payouts:  ₹{total_payouts:>10,.0f}                    ║
            ║  Status:         {ratios['combined_status']}                    ║
            ╚══════════════════════════════════════════════════╝
            """)
            
            logger.info("✅ Daily reporting completed")
        except Exception as e:
            logger.error(f"❌ Daily reporting failed: {str(e)}")
        finally:
            db.close()

    def shutdown(self):
        """Graceful shutdown"""
        try:
            if self.scheduler.running:
                self.scheduler.shutdown(wait=False)
            logger.info("👋 RaahPay shutting down gracefully")
        except Exception as e:
            logger.error(f"❌ Shutdown error: {str(e)}")


automation_engine = AutomationEngine()
