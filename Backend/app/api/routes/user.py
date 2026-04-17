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
    employee_id: str | None = None
    job_verification_status: str | None = None
    latitude: float | None = None
    longitude: float | None = None
    address: str | None = None
    registered_latitude: float | None = None
    registered_longitude: float | None = None
    registered_address: str | None = None
    created_at: datetime

    class Config:
        from_attributes = True


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
    
    # Map base_* fields to regular fields for frontend compatibility
    return {
        "id": user.id,
        "name": user.name,
        "email": user.email,
        "phone": user.phone,
        "platform": user.platform,
        "work_zone": user.work_zone,
        "avg_daily_income": user.avg_daily_income,
        "avg_daily_hours": user.avg_daily_hours,
        "experience_months": user.experience_months,
        "is_fraud_flagged": user.is_fraud_flagged,
        "is_active": user.is_active,
        "employee_id": user.employee_id,
        "job_verification_status": user.job_verification_status,
        "latitude": user.base_latitude,
        "longitude": user.base_longitude,
        "address": user.base_address,
        "registered_latitude": user.registered_latitude,
        "registered_longitude": user.registered_longitude,
        "registered_address": user.registered_address,
        "created_at": user.created_at,
    }


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
    
    # Return mapped response like get_profile
    return {
        "id": user.id,
        "name": user.name,
        "email": user.email,
        "phone": user.phone,
        "platform": user.platform,
        "work_zone": user.work_zone,
        "avg_daily_income": user.avg_daily_income,
        "avg_daily_hours": user.avg_daily_hours,
        "experience_months": user.experience_months,
        "is_fraud_flagged": user.is_fraud_flagged,
        "is_active": user.is_active,
        "employee_id": user.employee_id,
        "job_verification_status": user.job_verification_status,
        "latitude": user.base_latitude,
        "longitude": user.base_longitude,
        "address": user.base_address,
        "registered_latitude": user.registered_latitude,
        "registered_longitude": user.registered_longitude,
        "registered_address": user.registered_address,
        "created_at": user.created_at,
    }


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
