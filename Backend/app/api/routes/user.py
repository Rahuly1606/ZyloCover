"""User profile and stats routes"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from pydantic import BaseModel
from datetime import datetime

from app.db.session import get_db
from app.models.user import User
from app.models.policy import Policy
from app.models.claim import Claim
from app.core.security import get_current_user

router = APIRouter(prefix="/user", tags=["user"])


class UserProfile(BaseModel):
    id: int
    name: str
    email: str
    phone: str
    platform: str
    work_zone: str
    avg_daily_income: float
    avg_daily_hours: float
    experience_months: int
    is_fraud_flagged: bool
    is_active: bool
    latitude: float | None = None
    longitude: float | None = None
    address: str | None = None
    created_at: datetime

    class Config:
        from_attributes = True
        fields = {
            'latitude': {'alias': 'base_latitude'},
            'longitude': {'alias': 'base_longitude'},
            'address': {'alias': 'base_address'},
        }


class UserStats(BaseModel):
    user_id: int
    active_policies: int
    total_claims: int
    total_payouts: float
    fraud_flags: int
    last_claim_date: datetime | None


class UserUpdateRequest(BaseModel):
    """Request model for updating user profile"""
    name: str | None = None
    avg_daily_income: float | None = None
    avg_daily_hours: float | None = None
    experience_months: int | None = None
    latitude: float | None = None
    longitude: float | None = None
    address: str | None = None


@router.get("/profile", response_model=UserProfile)
async def get_profile(user_id: int = Depends(get_current_user), db: Session = Depends(get_db)):
    """Get user profile"""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user


@router.put("/profile", response_model=UserProfile)
async def update_profile(
    req: UserUpdateRequest,
    user_id: int = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update user profile including location"""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Update fields if provided
    if req.name is not None:
        user.name = req.name
    if req.avg_daily_income is not None:
        user.avg_daily_income = req.avg_daily_income
    if req.avg_daily_hours is not None:
        user.avg_daily_hours = req.avg_daily_hours
    if req.experience_months is not None:
        user.experience_months = req.experience_months
    if req.latitude is not None:
        user.base_latitude = req.latitude
    if req.longitude is not None:
        user.base_longitude = req.longitude
    if req.address is not None:
        user.base_address = req.address
    
    db.commit()
    db.refresh(user)
    return user


@router.get("/stats", response_model=UserStats)
async def get_stats(user_id: int = Depends(get_current_user), db: Session = Depends(get_db)):
    """Get user statistics"""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Count active policies
    from app.models.policy import PolicyStatus
    active_policies = db.query(Policy).filter(
        Policy.user_id == user_id,
        Policy.status == PolicyStatus.ACTIVE
    ).count()
    
    # Count claims
    total_claims = db.query(Claim).filter(Claim.user_id == user_id).count()
    
    # Sum payouts
    from app.models.payout import Payout
    total_payouts = db.query(Payout).filter(
        Payout.user_id == user_id,
        Payout.status == "success"
    ).with_entities(func.sum(Payout.amount_inr)).scalar() or 0.0
    
    # Count fraud flags
    fraud_flags = db.query(Claim).filter(
        Claim.user_id == user_id,
        Claim.fraud_score > 0.65
    ).count()
    
    # Last claim date
    last_claim = db.query(Claim).filter(
        Claim.user_id == user_id
    ).order_by(Claim.created_at.desc()).first()
    
    return {
        "user_id": user_id,
        "active_policies": active_policies,
        "total_claims": total_claims,
        "total_payouts": total_payouts,
        "fraud_flags": fraud_flags,
        "last_claim_date": last_claim.created_at if last_claim else None
    }
