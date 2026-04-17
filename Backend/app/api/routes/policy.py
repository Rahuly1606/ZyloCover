"""Policy management routes with AI-powered pricing and risk scoring"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from datetime import datetime, timedelta
import uuid
import logging

from app.db.session import get_db
from app.models.policy import Policy, PolicyStatus
from app.models.user import User
from app.core.security import get_current_user
from app.engine.actuarial import ActuarialEngine, COVERAGE_TIERS
from app.api.schemas import PolicyResponse, PolicyCreationRequest
from app.services.ai_client import get_ai_client

logger = logging.getLogger(__name__)
ai_client = get_ai_client()

router = APIRouter(prefix="/policy", tags=["policy"])


@router.post("/create", response_model=PolicyResponse)
async def create_policy(
    req: PolicyCreationRequest,
    user_id: int = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Create a new weekly insurance policy with AI-powered pricing and risk assessment.
    
    AI Integration:
    1. Dynamic price using trained GradientBoosting model
    2. Risk score using trained classifier (0-100)
    3. SHAP explainability for pricing breakdown
    4. Fallback to formula if AI service unavailable
    """
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Check if user is blacklisted
    if user.is_blacklisted:
        raise HTTPException(
            status_code=400,
            detail="User blacklisted due to fraud history - contact support"
        )
    
    # Check for cooling period violation
    now = datetime.utcnow()
    last_expired_policy = db.query(Policy).filter(
        Policy.user_id == user_id,
        Policy.status.in_([PolicyStatus.EXPIRED, PolicyStatus.CANCELLED])
    ).order_by(Policy.end_date.desc()).first()
    
    if last_expired_policy and last_expired_policy.cooling_period_ends_at:
        if now < last_expired_policy.cooling_period_ends_at:
            raise HTTPException(
                status_code=400,
                detail=f"Cooling period active - next policy eligible after {last_expired_policy.cooling_period_ends_at.isoformat()}"
            )
    
    # Cancel any existing active policy
    existing_active = db.query(Policy).filter(
        Policy.user_id == user_id,
        Policy.status == PolicyStatus.ACTIVE
    ).first()
    if existing_active:
        existing_active.status = PolicyStatus.EXPIRED
    
    # ─── AI STEP 1: Get Dynamic Premium from Trained Model ───────────────────
    try:
        ai_premium_data = await ai_client.predict_premium(
            zone=user.work_zone,
            vehicle_type=req.vehicle_type if hasattr(req, 'vehicle_type') else "bike",
            income_per_day=user.avg_daily_income,
            account_age_days=(now - user.created_at).days,
            premium_tier=req.coverage_tier,
            num_claims_6m=len([c for c in db.query(Claim).filter(
                Claim.user_id == user_id,
                Claim.created_at >= now - timedelta(days=180)
            ).all()]),
            season=ActuarialEngine.get_current_season(user.city),
            city=user.city
        )
        ai_final_premium = ai_premium_data['final_premium']
        ai_premium_breakdown = ai_premium_data
        ai_premium_used = True
    except Exception as e:
        logger.warning(f"AI premium prediction failed: {e}. Using formula fallback.")
        # Fallback to actuarial engine
        premium_calc = ActuarialEngine.calculate_final_premium(
            daily_income=user.avg_daily_income,
            city=user.city,
            zone=user.work_zone,
            platform=user.platform,
            coverage_tier=req.coverage_tier,
            claim_count_all_time=user.all_time_claim_count,
            fraud_flags=user.fraud_flag_count
        )
        ai_final_premium = premium_calc["final_premium"]
        ai_premium_breakdown = premium_calc["breakdown"]
        ai_premium_used = False
    
    # ─── AI STEP 2: Get Risk Score from Trained Model ──────────────────────
    try:
        ai_risk_data = await ai_client.predict_risk_score(
            zone=user.work_zone,
            vehicle_type=req.vehicle_type if hasattr(req, 'vehicle_type') else "bike",
            income_per_day=user.avg_daily_income,
            account_age_days=(now - user.created_at).days,
            num_policies=len(db.query(Policy).filter(Policy.user_id == user_id).all()),
            claims_history=len(db.query(Claim).filter(Claim.user_id == user_id).all()),
            platform=user.platform
        )
        risk_score = ai_risk_data['risk_score']
        risk_tier = ai_risk_data['risk_tier']
        ai_risk_used = True
    except Exception as e:
        logger.warning(f"AI risk prediction failed: {e}. Using default.")
        risk_score = 50  # Default neutral risk
        risk_tier = "medium"
        ai_risk_used = False
    
    final_premium = ai_final_premium
    
    # Get coverage tier details
    tier_data = COVERAGE_TIERS[req.coverage_tier]
    irr = tier_data["irr"]
    max_days_per_week = tier_data["max_days_per_week"]
    
    # Calculate coverage amounts
    daily_coverage = user.avg_daily_income * irr
    max_weekly_payout = daily_coverage * max_days_per_week
    
    # Create policy number
    policy_number = f"RK-POL-{datetime.utcnow().strftime('%y%m%d')}-{uuid.uuid4().hex[:6].upper()}"
    
    # Create policy with AI data
    policy = Policy(
        policy_number=policy_number,
        user_id=user_id,
        coverage_tier=req.coverage_tier,
        weekly_premium=final_premium,
        income_replacement_ratio=irr,
        daily_income_insured=user.avg_daily_income,
        max_weekly_payout=max_weekly_payout,
        coverage_hours_per_day=user.avg_daily_hours * max_days_per_week,
        start_date=datetime.utcnow(),
        end_date=datetime.utcnow() + timedelta(days=7),
        status=PolicyStatus.ACTIVE,
        pricing_breakdown=ai_premium_breakdown,
        risk_snapshot={
            "city": user.city,
            "zone": user.work_zone,
            "platform": user.platform,
            "season": ActuarialEngine.get_current_season(user.city),
            "ai_risk_score": risk_score,
            "ai_risk_tier": risk_tier,
            "ai_pricing_used": ai_premium_used,
            "ai_risk_used": ai_risk_used
        },
        cooling_period_ends_at=None,
        total_claimed_this_week=0.0,
        claim_count_this_week=0
    )
    
    db.add(policy)
    db.commit()
    db.refresh(policy)
    
    return policy
    return policy


@router.get("/active", response_model=list[PolicyResponse])
async def get_active_policies(
    user_id: int = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get active policies for user"""
    policies = db.query(Policy).filter(
        Policy.user_id == user_id,
        Policy.status == PolicyStatus.ACTIVE
    ).all()
    return policies


@router.get("/{policy_id}", response_model=PolicyResponse)
async def get_policy(
    policy_id: int,
    user_id: int = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get policy details"""
    policy = db.query(Policy).filter(
        Policy.id == policy_id,
        Policy.user_id == user_id
    ).first()
    
    if not policy:
        raise HTTPException(status_code=404, detail="Policy not found")
    
    return policy


@router.get("/list/all", response_model=list[PolicyResponse])
async def get_all_policies(
    user_id: int = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all policies (active and expired) for user"""
    policies = db.query(Policy).filter(Policy.user_id == user_id).order_by(
        Policy.created_at.desc()
    ).all()
    return policies
