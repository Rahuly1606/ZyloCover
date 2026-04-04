"""Policy management routes with actuarial calculation"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from datetime import datetime, timedelta
import uuid

from app.db.session import get_db
from app.models.policy import Policy, PolicyStatus
from app.models.user import User
from app.core.security import get_current_user
from app.engine.actuarial import ActuarialEngine, COVERAGE_TIERS
from app.api.schemas import PolicyResponse, PolicyCreationRequest

router = APIRouter(prefix="/policy", tags=["policy"])


@router.post("/create", response_model=PolicyResponse)
async def create_policy(
    req: PolicyCreationRequest,
    user_id: int = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Create a new weekly insurance policy.
    
    Business rules:
    1. Only one active policy per user - cancels any existing active
    2. 2-hour cooling period after policy expiry before new one can start
    3. Premium calculated with full actuarial model (pure + gross + experience rating)
    4. Policy locked to 7-day term
    5. Full pricing breakdown stored for audit trail
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
    
    # Calculate premium
    premium_calc = ActuarialEngine.calculate_final_premium(
        daily_income=user.avg_daily_income,
        city=user.city,
        zone=user.work_zone,
        platform=user.platform,
        coverage_tier=req.coverage_tier,
        claim_count_all_time=user.all_time_claim_count,
        fraud_flags=user.fraud_flag_count
    )
    
    final_premium = premium_calc["final_premium"]
    
    # Get coverage tier details
    tier_data = COVERAGE_TIERS[req.coverage_tier]
    irr = tier_data["irr"]
    max_days_per_week = tier_data["max_days_per_week"]
    
    # Calculate coverage amounts
    daily_coverage = user.avg_daily_income * irr
    max_weekly_payout = daily_coverage * max_days_per_week
    
    # Create policy number
    policy_number = f"RK-POL-{datetime.utcnow().strftime('%y%m%d')}-{uuid.uuid4().hex[:6].upper()}"
    
    # Create policy
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
        pricing_breakdown=premium_calc["breakdown"],
        risk_snapshot={
            "city": user.city,
            "zone": user.work_zone,
            "platform": user.platform,
            "season": ActuarialEngine.get_current_season(user.city),
        },
        cooling_period_ends_at=None,  # Will be set on expiry
        total_claimed_this_week=0.0,
        claim_count_this_week=0
    )
    
    db.add(policy)
    db.commit()
    db.refresh(policy)
    
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
