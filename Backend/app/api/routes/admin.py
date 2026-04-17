"""Admin monitoring and control routes with comprehensive financial analytics"""
from fastapi import APIRouter, Depends, HTTPException, Header
from sqlalchemy.orm import Session
from sqlalchemy import func, and_
from pydantic import BaseModel
from datetime import datetime, timedelta
from typing import Optional, Dict, List

from app.db.session import get_db
from app.models.user import User
from app.models.claim import Claim
from app.models.payout import Payout
from app.models.policy import Policy
from app.models.trigger import TriggerEvent
from app.core.config import get_settings
from app.core.security import verify_token
from app.engine.actuarial import ActuarialEngine
from app.api.schemas import (
    FinancialMetrics,
    OperationalMetrics,
    AdminDashboardResponse
)

router = APIRouter(prefix="/admin", tags=["admin"])
settings = get_settings()


class DashboardStats(BaseModel):
    total_users: int
    active_policies: int
    total_claims: int
    claims_approved: int
    claims_rejected: int
    total_payouts: float
    fraud_flags: int
    avg_claim_amount: float


def verify_admin_access(x_admin_token: str = Header(None), db: Session = Depends(get_db)):
    """Verify admin authentication"""
    if not x_admin_token:
        raise HTTPException(status_code=401, detail="Admin token required")
    
    try:
        payload = verify_token(x_admin_token)
        if not payload or not payload.get("is_admin"):
            raise HTTPException(status_code=403, detail="Admin authentication failed")
        
        user_id = payload.get("user_id")
        user = db.query(User).filter(User.id == user_id).first()
        
        if not user or not user.is_admin or not user.is_active:
            raise HTTPException(status_code=403, detail="Admin access required")
        
        return user
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=401, detail=f"Invalid admin token")


@router.get("/dashboard", response_model=DashboardStats)
async def get_dashboard_legacy(
    admin_user: User = Depends(verify_admin_access),
    db: Session = Depends(get_db)
):
    """
    Legacy dashboard endpoint - kept for backward compatibility.
    Use /admin/analytics for comprehensive financial dashboard.
    """
    total_users = db.query(User).count()
    active_policies = db.query(Policy).filter(Policy.status == "active").count()
    total_claims = db.query(Claim).count()
    claims_approved = db.query(Claim).filter(Claim.status == "approved").count()
    claims_rejected = db.query(Claim).filter(Claim.status == "rejected").count()
    
    total_payouts = db.query(Payout).filter(
        Payout.status == "success"
    ).with_entities(func.sum(Payout.amount_inr)).scalar() or 0.0
    
    fraud_flags = db.query(Claim).filter(Claim.fraud_score > 0.65).count()
    
    avg_claim_amount = db.query(Payout).filter(
        Payout.status == "success"
    ).with_entities(func.avg(Payout.amount_inr)).scalar() or 0.0
    
    return {
        "total_users": total_users,
        "active_policies": active_policies,
        "total_claims": total_claims,
        "claims_approved": claims_approved,
        "claims_rejected": claims_rejected,
        "total_payouts": total_payouts,
        "fraud_flags": fraud_flags,
        "avg_claim_amount": avg_claim_amount
    }


@router.get("/analytics", response_model=AdminDashboardResponse)
async def get_analytics_dashboard(
    admin_user: User = Depends(verify_admin_access),
    db: Session = Depends(get_db)
):
    """
    Comprehensive admin dashboard with financial KPIs, operational metrics, and analytics.
    Shows loss ratio, combined ratio, claims trends, fraud patterns, and risk analysis.
    
    This is the main dashboard for insurer operations.
    """
    # Week start/end for rolling calculations
    now = datetime.utcnow()
    week_start = now - timedelta(days=7)
    
    # ─── FINANCIAL METRICS ──────────────────────────────────────────────────
    
    # Total premiums this week
    total_premiums_week = db.query(Policy).filter(
        Policy.created_at >= week_start
    ).with_entities(func.sum(Policy.weekly_premium)).scalar() or 0.0
    
    # Total payouts this week
    total_payouts_week = db.query(Payout).filter(
        and_(Payout.status == "success", Payout.completed_at >= week_start)
    ).with_entities(func.sum(Payout.amount_inr)).scalar() or 0.0
    
    # Calculate loss and combined ratios
    ratio_metrics = ActuarialEngine.calculate_loss_and_combined_ratios(
        total_payouts_week, total_premiums_week
    )
    
    financial_metrics = FinancialMetrics(
        gross_written_premium_week=total_premiums_week,
        total_claims_paid_week=total_payouts_week,
        loss_ratio=ratio_metrics["loss_ratio"],
        loss_ratio_pct=ratio_metrics["loss_ratio_pct"],
        loss_status=ratio_metrics["loss_status"],
        expense_ratio=ratio_metrics["expense_ratio"],
        combined_ratio=ratio_metrics["combined_ratio"],
        combined_ratio_pct=ratio_metrics["combined_ratio_pct"],
    )
    
    # ─── OPERATIONAL METRICS ────────────────────────────────────────────────
    
    active_policies = db.query(Policy).filter(Policy.status == "active").count()
    policies_expiring_today = db.query(Policy).filter(
        and_(
            Policy.status == "active",
            Policy.end_date >= now,
            Policy.end_date < now + timedelta(days=1)
        )
    ).count()
    
    claims_today = db.query(Claim).filter(
        Claim.created_at >= now - timedelta(days=1)
    ).count()
    
    claims_approved = db.query(Claim).filter(Claim.status == "approved").count()
    claims_flagged = db.query(Claim).filter(Claim.status == "fraud_review").count()
    claims_rejected = db.query(Claim).filter(Claim.status == "rejected").count()
    
    avg_payout = db.query(Payout).filter(
        Payout.status == "success"
    ).with_entities(func.avg(Payout.amount_inr)).scalar() or 0.0
    
    # Average time from trigger to payout (in minutes)
    recent_claims = db.query(Claim).filter(
        Claim.created_at >= week_start
    ).all()
    
    if recent_claims:
        trigger_to_payout_times = []
        for claim in recent_claims:
            if claim.updated_at:
                delta = (claim.updated_at - claim.created_at).total_seconds() / 60
                trigger_to_payout_times.append(delta)
        avg_time_minutes = sum(trigger_to_payout_times) / len(trigger_to_payout_times) if trigger_to_payout_times else 0
    else:
        avg_time_minutes = 0
    
    operational_metrics = OperationalMetrics(
        active_policies=active_policies,
        policies_expiring_today=policies_expiring_today,
        claims_triggered_today=claims_today,
        claims_auto_approved=db.query(Claim).filter(
            and_(Claim.status == "approved", Claim.fraud_score < 40)
        ).count(),
        claims_flagged=claims_flagged,
        claims_rejected=claims_rejected,
        average_payout_amount=avg_payout,
        average_trigger_to_payout_minutes=avg_time_minutes,
    )
    
    # ─── LOSS RATIO BY CITY ──────────────────────────────────────────────────
    
    loss_ratio_by_city = {}
    cities = db.query(User.city).distinct().all()
    for (city,) in cities:
        if not city:
            continue
        city_premiums = db.query(Policy).join(User).filter(
            and_(User.city == city, Policy.created_at >= week_start)
        ).with_entities(func.sum(Policy.weekly_premium)).scalar() or 0.0
        
        city_claims = db.query(Claim).join(Policy).join(User).filter(
            and_(User.city == city, Claim.created_at >= week_start)
        )
        city_payouts = db.query(Payout).join(Claim, Payout.claim_id == Claim.id).filter(
            and_(Claim.created_at >= week_start, Payout.status == "success")
        ).with_entities(func.sum(Payout.amount_inr)).scalar() or 0.0
        
        if city_premiums > 0:
            loss_ratio_by_city[city] = round(city_payouts / city_premiums, 4)
    
    # ─── LOSS RATIO BY TRIGGER TYPE ──────────────────────────────────────────
    
    loss_ratio_by_trigger = {}
    triggers = db.query(Claim.trigger_type).distinct().all()
    for (trigger_type,) in triggers:
        if not trigger_type:
            continue
        trigger_payouts = db.query(Payout).join(Claim).filter(
            and_(Claim.trigger_type == trigger_type, Claim.created_at >= week_start,
                 Payout.status == "success")
        ).with_entities(func.sum(Payout.amount_inr)).scalar() or 0.0
        
        trigger_claims = db.query(Claim).filter(
            and_(Claim.trigger_type == trigger_type, Claim.created_at >= week_start)
        ).count()
        
        if trigger_claims > 0:
            # Average payout per trigger type
            avg_payout_trigger = trigger_payouts / trigger_claims if trigger_claims > 0 else 0
            loss_ratio_by_trigger[trigger_type] = round(avg_payout_trigger, 2)
    
    # ─── FRAUD RATE BY ZONE ─────────────────────────────────────────────────
    
    fraud_rate_by_zone = {}
    zones = db.query(User.work_zone).distinct().all()
    for (zone,) in zones:
        if not zone:
            continue
        zone_claims = db.query(Claim).join(Policy).join(User).filter(
            and_(User.work_zone == zone, Claim.created_at >= week_start)
        ).count()
        
        zone_rejected = db.query(Claim).join(Policy).join(User).filter(
            and_(User.work_zone == zone, Claim.status == "rejected",
                 Claim.created_at >= week_start)
        ).count()
        
        if zone_claims > 0:
            fraud_rate_by_zone[zone] = round(zone_rejected / zone_claims, 4)
    
    # ─── TOP RISK USERS ────────────────────────────────────────────────────
    
    riskiest_users = db.query(User).order_by(User.user_risk_score.desc()).limit(10).all()
    top_risk_users = [
        {
            "user_id": u.id,
            "name": u.name,
            "email": u.email,
            "risk_score": u.user_risk_score,
            "fraud_flags": u.fraud_flag_count,
            "is_blacklisted": u.is_blacklisted,
            "all_time_claims": u.all_time_claim_count,
        }
        for u in riskiest_users
    ]
    
    return AdminDashboardResponse(
        financial_metrics=financial_metrics,
        operational_metrics=operational_metrics,
        loss_ratio_by_city=loss_ratio_by_city,
        loss_ratio_by_trigger_type=loss_ratio_by_trigger,
        fraud_rate_by_zone=fraud_rate_by_zone,
        top_risk_users=top_risk_users,
    )


@router.get("/forecast")
async def get_risk_forecast(
    admin_user: User = Depends(verify_admin_access),
    db: Session = Depends(get_db)
):
    """
    Get 7-day risk forecast using AI Prophet model.
    
    Shows predicted daily probability of high-severity weather events (triggers).
    Helps admin prepare for peak claims periods.
    
    Returns daily forecasts with risk levels: LOW, MEDIUM, HIGH, CRITICAL
    """
    from app.services.ai_client import get_ai_client
    import logging
    
    logger = logging.getLogger(__name__)
    ai_client = get_ai_client()
    
    # Get all unique cities in the system
    cities = db.query(User.city).distinct().all()
    city_list = [city[0] for city in cities if city[0]]
    
    forecast_data = {
        "forecast_date": datetime.utcnow().isoformat(),
        "cities": {}
    }
    
    # Generate forecast for each city
    for city in city_list:
        try:
            forecast_result = await ai_client.forecast_risk(
                city=city,
                days=7
            )
            
            # Convert forecast to risk levels
            forecast_data["cities"][city] = {
                "daily_forecasts": [],
                "summary": {
                    "avg_probability": 0.0,
                    "max_probability": 0.0,
                    "high_risk_days": 0  # Days with probability > 0.6
                }
            }
            
            probabilities = []
            high_risk_count = 0
            
            for day_forecast in forecast_result.get("daily_forecasts", []):
                probability = day_forecast.get("probability", 0.5)
                probabilities.append(probability)
                
                # Determine risk level
                if probability >= 0.8:
                    risk_level = "CRITICAL"
                    high_risk_count += 1
                elif probability >= 0.6:
                    risk_level = "HIGH"
                    high_risk_count += 1
                elif probability >= 0.4:
                    risk_level = "MEDIUM"
                else:
                    risk_level = "LOW"
                
                forecast_data["cities"][city]["daily_forecasts"].append({
                    "date": day_forecast.get("date", (datetime.utcnow() + timedelta(days=len(probabilities))).isoformat()),
                    "probability": round(probability, 3),
                    "risk_level": risk_level,
                    "predicted_triggers": day_forecast.get("trigger_types", []),
                    "confidence": round(day_forecast.get("confidence", 0.0), 3)
                })
            
            # Calculate summary statistics
            if probabilities:
                forecast_data["cities"][city]["summary"] = {
                    "avg_probability": round(sum(probabilities) / len(probabilities), 3),
                    "max_probability": round(max(probabilities), 3),
                    "high_risk_days": high_risk_count
                }
        
        except Exception as e:
            logger.warning(f"Risk forecast failed for city {city}: {e}")
            forecast_data["cities"][city] = {
                "error": str(e),
                "fallback": "Unable to generate forecast - using historical averages"
            }
    
    return forecast_data
