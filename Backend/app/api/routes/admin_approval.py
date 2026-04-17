"""Admin User Approval System - Review profiles, images, and location data"""
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

from app.db.session import get_db
from app.models.user import User
from app.models.policy import Policy
from app.models.claim import Claim
from app.api.routes.admin_extended import verify_admin_access

router = APIRouter(prefix="/admin", tags=["admin-approval"])


@router.get("/pending-approvals")
async def get_pending_approvals(
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
    admin_user: User = Depends(verify_admin_access),
    db: Session = Depends(get_db)
):
    """Get all users pending approval with job verification"""
    query = db.query(User).filter(
        User.job_verification_status == "pending"
    )
    
    total = query.count()
    users = query.order_by(User.created_at.desc()).offset(
        (page - 1) * size
    ).limit(size).all()
    
    return {
        "total": total,
        "page": page,
        "size": size,
        "total_pages": (total + size - 1) // size,
        "data": [
            {
                "id": u.id,
                "name": u.name,
                "email": u.email,
                "phone": u.phone,
                "employee_id": u.employee_id,
                "platform": u.platform,
                "city": u.city,
                "work_zone": u.work_zone,
                "avg_daily_income": u.avg_daily_income,
                "experience_months": u.experience_months,
                "job_proof_image": u.job_proof_image,
                "job_verification_status": u.job_verification_status,
                "registered_latitude": u.registered_latitude,
                "registered_longitude": u.registered_longitude,
                "registered_address": u.registered_address,
                "created_at": u.created_at.isoformat() if u.created_at else None,
            }
            for u in users
        ]
    }


@router.get("/users/{user_id}/full-profile")
async def get_user_full_profile(
    user_id: int,
    admin_user: User = Depends(verify_admin_access),
    db: Session = Depends(get_db)
):
    """Get complete user profile with all details for admin review"""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Get user's policies
    policies = db.query(Policy).filter(Policy.user_id == user_id).all()
    
    # Get user's claims with full details
    claims = db.query(Claim).join(Policy).filter(Policy.user_id == user_id).all()
    
    return {
        # Basic Info
        "id": user.id,
        "name": user.name,
        "email": user.email,
        "phone": user.phone,
        "employee_id": user.employee_id,
        
        # Work Info
        "platform": user.platform,
        "work_zone": user.work_zone,
        "city": user.city,
        "avg_daily_income": user.avg_daily_income,
        "avg_daily_hours": user.avg_daily_hours,
        "experience_months": user.experience_months,
        
        # Verification
        "job_proof_image": user.job_proof_image,
        "job_verification_status": user.job_verification_status,
        
        # Location Data
        "registered_latitude": user.registered_latitude,
        "registered_longitude": user.registered_longitude,
        "registered_address": user.registered_address,
        "base_latitude": user.base_latitude,
        "base_longitude": user.base_longitude,
        "base_address": user.base_address,
        
        # Risk & Fraud
        "fraud_flag_count": user.fraud_flag_count,
        "is_blacklisted": user.is_blacklisted,
        "is_fraud_flagged": user.is_fraud_flagged,
        "fraud_flag_reason": user.fraud_flag_reason,
        "user_risk_score": user.user_risk_score,
        "all_time_claim_count": user.all_time_claim_count,
        
        # Status
        "is_active": user.is_active,
        "is_admin": user.is_admin,
        "created_at": user.created_at.isoformat() if user.created_at else None,
        "updated_at": user.updated_at.isoformat() if user.updated_at else None,
        
        # Policies
        "policies": [
            {
                "id": p.id,
                "policy_number": p.policy_number,
                "coverage_tier": p.coverage_tier,
                "weekly_premium": p.weekly_premium,
                "daily_income_insured": p.daily_income_insured,
                "max_weekly_payout": p.max_weekly_payout,
                "status": p.status,
                "start_date": p.start_date.isoformat() if p.start_date else None,
                "end_date": p.end_date.isoformat() if p.end_date else None,
                "work_zone": p.work_zone,
                "created_at": p.created_at.isoformat() if p.created_at else None,
            }
            for p in policies
        ],
        
        # Claims with full details
        "claims": [
            {
                "id": c.id,
                "policy_id": c.policy_id,
                "trigger_type": c.trigger_type,
                "trigger_data": c.trigger_data,
                "amount_claimed": c.amount_claimed,
                "fraud_score": round(c.fraud_score, 4),
                "fraud_indicators": c.fraud_indicators,
                "status": c.status,
                "admin_notes": c.admin_notes,
                "created_at": c.created_at.isoformat() if c.created_at else None,
                "updated_at": c.updated_at.isoformat() if c.updated_at else None,
            }
            for c in claims
        ],
        
        # Summary Stats
        "summary": {
            "total_policies": len(policies),
            "active_policies": len([p for p in policies if p.status == "active"]),
            "total_claims": len(claims),
            "approved_claims": len([c for c in claims if c.status == "approved"]),
            "rejected_claims": len([c for c in claims if c.status == "rejected"]),
            "pending_claims": len([c for c in claims if c.status in ["pending", "fraud_review"]]),
            "total_claimed_amount": sum(c.amount_claimed for c in claims),
        }
    }


class ApprovalDecision(BaseModel):
    decision: str  # "approve" or "reject"
    notes: Optional[str] = None


@router.put("/users/{user_id}/approve-verification")
async def approve_user_verification(
    user_id: int,
    decision: ApprovalDecision,
    admin_user: User = Depends(verify_admin_access),
    db: Session = Depends(get_db)
):
    """Approve or reject user job verification"""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    if decision.decision == "approve":
        user.job_verification_status = "approved"
        user.is_active = True
        message = "User verification approved"
    elif decision.decision == "reject":
        user.job_verification_status = "rejected"
        user.is_active = False
        message = "User verification rejected"
    else:
        raise HTTPException(status_code=400, detail="Invalid decision")
    
    user.updated_at = datetime.utcnow()
    db.commit()
    
    return {
        "message": message,
        "user_id": user_id,
        "status": user.job_verification_status,
        "notes": decision.notes
    }


@router.get("/claims/{claim_id}/full-details")
async def get_claim_full_details(
    claim_id: int,
    admin_user: User = Depends(verify_admin_access),
    db: Session = Depends(get_db)
):
    """Get complete claim details including user location and trigger data"""
    claim = db.query(Claim).filter(Claim.id == claim_id).first()
    if not claim:
        raise HTTPException(status_code=404, detail="Claim not found")
    
    user = claim.policy.user if claim.policy else None
    
    return {
        # Claim Details
        "id": claim.id,
        "policy_id": claim.policy_id,
        "trigger_type": claim.trigger_type,
        "trigger_data": claim.trigger_data,
        "amount_claimed": claim.amount_claimed,
        "fraud_score": round(claim.fraud_score, 4),
        "fraud_indicators": claim.fraud_indicators,
        "status": claim.status,
        "admin_notes": claim.admin_notes,
        "created_at": claim.created_at.isoformat() if claim.created_at else None,
        "updated_at": claim.updated_at.isoformat() if claim.updated_at else None,
        
        # User Details
        "user": {
            "id": user.id if user else None,
            "name": user.name if user else "Unknown",
            "email": user.email if user else None,
            "phone": user.phone if user else None,
            "platform": user.platform if user else None,
            "city": user.city if user else None,
            "work_zone": user.work_zone if user else None,
            
            # Location at time of claim
            "registered_latitude": user.registered_latitude if user else None,
            "registered_longitude": user.registered_longitude if user else None,
            "registered_address": user.registered_address if user else None,
            
            # Risk profile
            "fraud_flag_count": user.fraud_flag_count if user else 0,
            "user_risk_score": user.user_risk_score if user else 0,
            "all_time_claim_count": user.all_time_claim_count if user else 0,
            "is_blacklisted": user.is_blacklisted if user else False,
        } if user else None,
        
        # Policy Details
        "policy": {
            "id": claim.policy.id if claim.policy else None,
            "policy_number": claim.policy.policy_number if claim.policy else None,
            "coverage_tier": claim.policy.coverage_tier if claim.policy else None,
            "status": claim.policy.status if claim.policy else None,
        } if claim.policy else None,
    }
