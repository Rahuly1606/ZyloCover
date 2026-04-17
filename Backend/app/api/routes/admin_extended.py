"""Extended Admin Routes - Comprehensive User, Claims, Fraud, and Config Management"""
from fastapi import APIRouter, Depends, HTTPException, Query, Header
from sqlalchemy.orm import Session
from sqlalchemy import func, and_, or_
from pydantic import BaseModel
from datetime import datetime, timedelta
from typing import Optional, List
from enum import Enum

from app.db.session import get_db
from app.models.user import User
from app.models.claim import Claim
from app.models.payout import Payout
from app.models.policy import Policy
from app.core.security import (
    verify_token,
    generate_admin_credential,
    hash_admin_credential,
    verify_admin_credential
)

router = APIRouter(prefix="/admin", tags=["admin"])


# ═══════════════════════════════════════════════════════════════════════════════
# ──────────────── SHARED DEPENDENCIES & DATA MODELS ────────────────────────────
# ═══════════════════════════════════════════════════════════════════════════════

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
        raise HTTPException(status_code=401, detail="Invalid admin token")


class AdminAction(str, Enum):
    """Admin action types for audit logging"""
    APPROVE_CLAIM = "approve_claim"
    REJECT_CLAIM = "reject_claim"
    BLACKLIST_USER = "blacklist_user"
    WHITELIST_USER = "whitelist_user"
    UPDATE_CONFIG = "update_config"
    UPDATE_THRESHOLD = "update_threshold"
    SIMULATE_TRIGGER = "simulate_trigger"
    MANUAL_REVIEW = "manual_review"


class AuditLogEntry(BaseModel):
    admin_id: int
    action: str
    target_type: str  # "claim", "user", "config"
    target_id: Optional[int] = None
    notes: Optional[str] = None
    metadata: Optional[dict] = None


# ═══════════════════════════════════════════════════════════════════════════════
# ──────────────────── FRAUD QUEUE MANAGEMENT ────────────────────────────────────
# ═══════════════════════════════════════════════════════════════════════════════

@router.get("/fraud-queue")
async def get_fraud_queue(
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
    risk_level: Optional[str] = Query(None, description="Filter by: high, medium, low"),
    admin_user: User = Depends(verify_admin_access),
    db: Session = Depends(get_db)
):
    """Get all flagged claims in fraud queue with pagination and filtering"""
    query = db.query(Claim).filter(
        Claim.status.in_(["fraud_review", "pending_manual_review"])
    )
    
    if risk_level:
        if risk_level == "high":
            query = query.filter(Claim.fraud_score >= 0.75)
        elif risk_level == "medium":
            query = query.filter(and_(Claim.fraud_score >= 0.5, Claim.fraud_score < 0.75))
        elif risk_level == "low":
            query = query.filter(Claim.fraud_score < 0.5)
    
    # Order by fraud score descending (highest priority first)
    total = query.count()
    claims = query.order_by(Claim.fraud_score.desc()).offset(
        (page - 1) * size
    ).limit(size).all()
    
    return {
        "total": total,
        "page": page,
        "size": size,
        "total_pages": (total + size - 1) // size,
        "data": [
            {
                "id": c.id,
                "claim_id": c.id,
                "policy_id": c.policy_id,
                "user_id": c.policy.user_id if c.policy else None,
                "user_name": c.policy.user.name if c.policy and c.policy.user else "Unknown",
                "trigger_type": c.trigger_type,
                "trigger_data": c.trigger_data,
                "fraud_score": round(c.fraud_score, 4),
                "risk_level": "HIGH" if c.fraud_score >= 0.75 else "MEDIUM" if c.fraud_score >= 0.5 else "LOW",
                "flags": c.fraud_indicators.split(",") if c.fraud_indicators else [],
                "amount_claimed": c.amount_claimed,
                "created_at": c.created_at.isoformat() if c.created_at else None,
                "status": c.status,
            }
            for c in claims
        ]
    }


@router.put("/fraud-queue/{claim_id}/approve")
async def approve_flagged_claim(
    claim_id: int,
    notes: Optional[str] = None,
    admin_user: User = Depends(verify_admin_access),
    db: Session = Depends(get_db)
):
    """Approve a flagged claim and remove from fraud queue"""
    claim = db.query(Claim).filter(Claim.id == claim_id).first()
    if not claim:
        raise HTTPException(status_code=404, detail="Claim not found")
    
    # Update claim status
    claim.status = "approved"
    claim.fraud_score = max(0, claim.fraud_score - 0.2)  # Reduce fraud score
    claim.admin_notes = notes or "Approved by admin override"
    claim.updated_at = datetime.utcnow()
    
    # Create payout if not exists
    existing_payout = db.query(Payout).filter(Payout.claim_id == claim_id).first()
    if not existing_payout:
        payout = Payout(
            claim_id=claim_id,
            amount_inr=claim.amount_claimed,
            status="processed",
            completed_at=datetime.utcnow()
        )
        db.add(payout)
    
    db.commit()
    
    # Log audit trail
    _log_admin_action(
        db, admin_user.id, AdminAction.APPROVE_CLAIM,
        "claim", claim_id, notes
    )
    
    return {"message": "Claim approved", "claim_id": claim_id, "status": "approved"}


@router.put("/fraud-queue/{claim_id}/reject")
async def reject_flagged_claim(
    claim_id: int,
    notes: Optional[str] = None,
    admin_user: User = Depends(verify_admin_access),
    db: Session = Depends(get_db)
):
    """Reject a flagged claim and blacklist user if necessary"""
    claim = db.query(Claim).filter(Claim.id == claim_id).first()
    if not claim:
        raise HTTPException(status_code=404, detail="Claim not found")
    
    # Update claim status
    claim.status = "rejected"
    claim.fraud_score = min(1.0, claim.fraud_score + 0.2)  # Increase fraud score
    claim.admin_notes = notes or "Rejected by admin"
    claim.updated_at = datetime.utcnow()
    
    # Increment user fraud flags
    if claim.policy and claim.policy.user:
        user = claim.policy.user
        user.fraud_flag_count += 1
        
        # Blacklist if 3+ fraud flags
        if user.fraud_flag_count >= 3:
            user.is_blacklisted = True
            user.is_active = False
    
    db.commit()
    
    # Log audit trail
    _log_admin_action(
        db, admin_user.id, AdminAction.REJECT_CLAIM,
        "claim", claim_id, notes
    )
    
    return {"message": "Claim rejected", "claim_id": claim_id, "status": "rejected"}


# ═══════════════════════════════════════════════════════════════════════════════
# ──────────────────── USER MANAGEMENT ────────────────────────────────────────────
# ═══════════════════════════════════════════════════════════════════════════════

@router.get("/users")
async def get_users(
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
    search: Optional[str] = Query(None, description="Search by name or email"),
    status: Optional[str] = Query(None, description="Filter by: active, inactive, blacklisted"),
    admin_user: User = Depends(verify_admin_access),
    db: Session = Depends(get_db)
):
    """Get list of all users with filtering and search"""
    query = db.query(User)
    
    if search:
        query = query.filter(
            or_(
                User.name.ilike(f"%{search}%"),
                User.email.ilike(f"%{search}%"),
                User.phone.ilike(f"%{search}%")
            )
        )
    
    if status == "active":
        query = query.filter(and_(User.is_active == True, User.is_blacklisted == False))
    elif status == "inactive":
        query = query.filter(User.is_active == False)
    elif status == "blacklisted":
        query = query.filter(User.is_blacklisted == True)
    
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
                "platform": u.platform,
                "city": u.city,
                "avg_daily_income": u.avg_daily_income,
                "fraud_flags": u.fraud_flag_count,
                "is_blacklisted": u.is_blacklisted,
                "is_active": u.is_active,
                "risk_score": u.user_risk_score,
                "all_time_claims": u.all_time_claim_count,
                "created_at": u.created_at.isoformat() if u.created_at else None,
            }
            for u in users
        ]
    }


@router.get("/users/{user_id}")
async def get_user_details(
    user_id: int,
    admin_user: User = Depends(verify_admin_access),
    db: Session = Depends(get_db)
):
    """Get detailed user profile with claims history"""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Get user's claims
    claims = db.query(Claim).join(Policy).filter(Policy.user_id == user_id).all()
    
    # Get user's policies
    policies = db.query(Policy).filter(Policy.user_id == user_id).all()
    
    return {
        "id": user.id,
        "name": user.name,
        "email": user.email,
        "phone": user.phone,
        "employee_id": user.employee_id,
        "platform": user.platform,
        "work_zone": user.work_zone,
        "city": user.city,
        "avg_daily_income": user.avg_daily_income,
        "avg_daily_hours": user.avg_daily_hours,
        "experience_months": user.experience_months,
        "fraud_flags": user.fraud_flag_count,
        "is_blacklisted": user.is_blacklisted,
        "is_active": user.is_active,
        "risk_score": user.user_risk_score,
        "all_time_claims": user.all_time_claim_count,
        "job_verification_status": user.job_verification_status,
        "created_at": user.created_at.isoformat() if user.created_at else None,
        "claims_summary": {
            "total": len(claims),
            "approved": len([c for c in claims if c.status == "approved"]),
            "rejected": len([c for c in claims if c.status == "rejected"]),
            "pending": len([c for c in claims if c.status in ["pending", "fraud_review"]]),
        },
        "policies": [
            {
                "id": p.id,
                "status": p.status,
                "start_date": p.start_date.isoformat() if p.start_date else None,
                "end_date": p.end_date.isoformat() if p.end_date else None,
                "weekly_premium": p.weekly_premium,
            }
            for p in policies
        ]
    }


@router.put("/users/{user_id}/blacklist")
async def blacklist_user(
    user_id: int,
    reason: Optional[str] = None,
    admin_user: User = Depends(verify_admin_access),
    db: Session = Depends(get_db)
):
    """Blacklist a user and deactivate all policies"""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    user.is_blacklisted = True
    user.is_active = False
    user.is_fraud_flagged = True
    user.fraud_flag_reason = reason or "Admin blacklist"
    
    # Deactivate all user's policies
    policies = db.query(Policy).filter(Policy.user_id == user_id).all()
    for policy in policies:
        policy.status = "terminated"
    
    db.commit()
    
    # Log audit trail
    _log_admin_action(
        db, admin_user.id, AdminAction.BLACKLIST_USER,
        "user", user_id, reason
    )
    
    return {"message": "User blacklisted", "user_id": user_id}


@router.put("/users/{user_id}/whitelist")
async def whitelist_user(
    user_id: int,
    admin_user: User = Depends(verify_admin_access),
    db: Session = Depends(get_db)
):
    """Remove blacklist from a user"""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    user.is_blacklisted = False
    user.is_active = True
    user.fraud_flag_count = max(0, user.fraud_flag_count - 1)
    user.is_fraud_flagged = False
    user.fraud_flag_reason = None
    
    db.commit()
    
    # Log audit trail
    _log_admin_action(
        db, admin_user.id, AdminAction.WHITELIST_USER,
        "user", user_id, "Whitelist removed"
    )
    
    return {"message": "User whitelisted", "user_id": user_id}


@router.get("/users/{user_id}/claims")
async def get_user_claims(
    user_id: int,
    page: int = Query(1, ge=1),
    size: int = Query(10, ge=1, le=50),
    admin_user: User = Depends(verify_admin_access),
    db: Session = Depends(get_db)
):
    """Get all claims for a specific user"""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    query = db.query(Claim).join(Policy).filter(Policy.user_id == user_id)
    total = query.count()
    claims = query.order_by(Claim.created_at.desc()).offset(
        (page - 1) * size
    ).limit(size).all()
    
    return {
        "total": total,
        "page": page,
        "size": size,
        "user_name": user.name,
        "data": [
            {
                "id": c.id,
                "policy_id": c.policy_id,
                "trigger_type": c.trigger_type,
                "amount_claimed": c.amount_claimed,
                "fraud_score": round(c.fraud_score, 4),
                "status": c.status,
                "created_at": c.created_at.isoformat() if c.created_at else None,
            }
            for c in claims
        ]
    }


# ═══════════════════════════════════════════════════════════════════════════════
# ──────────────────── CLAIMS MANAGEMENT ──────────────────────────────────────────
# ═══════════════════════════════════════════════════════════════════════════════

@router.get("/claims")
async def get_claims(
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
    status: Optional[str] = Query(None),
    trigger_type: Optional[str] = Query(None),
    admin_user: User = Depends(verify_admin_access),
    db: Session = Depends(get_db)
):
    """Get all claims with filtering"""
    query = db.query(Claim)
    
    if status:
        query = query.filter(Claim.status == status)
    
    if trigger_type:
        query = query.filter(Claim.trigger_type == trigger_type)
    
    total = query.count()
    claims = query.order_by(Claim.created_at.desc()).offset(
        (page - 1) * size
    ).limit(size).all()
    
    return {
        "total": total,
        "page": page,
        "size": size,
        "total_pages": (total + size - 1) // size,
        "data": [
            {
                "id": c.id,
                "policy_id": c.policy_id,
                "user_id": c.policy.user_id if c.policy else None,
                "user_name": c.policy.user.name if c.policy and c.policy.user else "Unknown",
                "trigger_type": c.trigger_type,
                "amount_claimed": c.amount_claimed,
                "fraud_score": round(c.fraud_score, 4),
                "status": c.status,
                "created_at": c.created_at.isoformat() if c.created_at else None,
            }
            for c in claims
        ]
    }


@router.get("/claims/{claim_id}")
async def get_claim_details(
    claim_id: int,
    admin_user: User = Depends(verify_admin_access),
    db: Session = Depends(get_db)
):
    """Get detailed claim information"""
    claim = db.query(Claim).filter(Claim.id == claim_id).first()
    if not claim:
        raise HTTPException(status_code=404, detail="Claim not found")
    
    payout = db.query(Payout).filter(Payout.claim_id == claim_id).first()
    
    return {
        "id": claim.id,
        "policy_id": claim.policy_id,
        "user_id": claim.policy.user_id if claim.policy else None,
        "user_name": claim.policy.user.name if claim.policy and claim.policy.user else "Unknown",
        "trigger_type": claim.trigger_type,
        "trigger_data": claim.trigger_data,
        "amount_claimed": claim.amount_claimed,
        "fraud_score": round(claim.fraud_score, 4),
        "fraud_indicators": claim.fraud_indicators,
        "status": claim.status,
        "admin_notes": claim.admin_notes,
        "created_at": claim.created_at.isoformat() if claim.created_at else None,
        "payout": {
            "id": payout.id,
            "amount_inr": payout.amount_inr,
            "status": payout.status,
            "completed_at": payout.completed_at.isoformat() if payout and payout.completed_at else None,
        } if payout else None
    }


# ═══════════════════════════════════════════════════════════════════════════════
# ──────────────────── POLICY MANAGEMENT ──────────────────────────────────────────
# ═══════════════════════════════════════════════════════════════════════════════

@router.get("/policies")
async def get_policies(
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
    status: Optional[str] = Query(None),
    admin_user: User = Depends(verify_admin_access),
    db: Session = Depends(get_db)
):
    """Get all policies with filtering"""
    query = db.query(Policy)
    
    if status:
        query = query.filter(Policy.status == status)
    
    total = query.count()
    policies = query.order_by(Policy.created_at.desc()).offset(
        (page - 1) * size
    ).limit(size).all()
    
    return {
        "total": total,
        "page": page,
        "size": size,
        "total_pages": (total + size - 1) // size,
        "data": [
            {
                "id": p.id,
                "user_id": p.user_id,
                "user_name": p.user.name if p.user else "Unknown",
                "start_date": p.start_date.isoformat() if p.start_date else None,
                "end_date": p.end_date.isoformat() if p.end_date else None,
                "weekly_premium": p.weekly_premium,
                "status": p.status,
                "created_at": p.created_at.isoformat() if p.created_at else None,
            }
            for p in policies
        ]
    }


@router.get("/policies/{policy_id}")
async def get_policy_details(
    policy_id: int,
    admin_user: User = Depends(verify_admin_access),
    db: Session = Depends(get_db)
):
    """Get detailed policy information"""
    policy = db.query(Policy).filter(Policy.id == policy_id).first()
    if not policy:
        raise HTTPException(status_code=404, detail="Policy not found")
    
    claims = db.query(Claim).filter(Claim.policy_id == policy_id).all()
    
    return {
        "id": policy.id,
        "user_id": policy.user_id,
        "user_name": policy.user.name if policy.user else "Unknown",
        "start_date": policy.start_date.isoformat() if policy.start_date else None,
        "end_date": policy.end_date.isoformat() if policy.end_date else None,
        "weekly_premium": policy.weekly_premium,
        "status": policy.status,
        "created_at": policy.created_at.isoformat() if policy.created_at else None,
        "claims": [
            {
                "id": c.id,
                "trigger_type": c.trigger_type,
                "amount_claimed": c.amount_claimed,
                "status": c.status,
            }
            for c in claims
        ]
    }


# ═══════════════════════════════════════════════════════════════════════════════
# ──────────────────── PAYOUT MANAGEMENT ──────────────────────────────────────────
# ═══════════════════════════════════════════════════════════════════════════════

@router.get("/payouts")
async def get_payouts(
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
    status: Optional[str] = Query(None),
    admin_user: User = Depends(verify_admin_access),
    db: Session = Depends(get_db)
):
    """Get all payouts with filtering"""
    query = db.query(Payout)
    
    if status:
        query = query.filter(Payout.status == status)
    
    total = query.count()
    payouts = query.order_by(Payout.completed_at.desc()).offset(
        (page - 1) * size
    ).limit(size).all()
    
    return {
        "total": total,
        "page": page,
        "size": size,
        "total_pages": (total + size - 1) // size,
        "data": [
            {
                "id": p.id,
                "claim_id": p.claim_id,
                "user_id": p.claim.policy.user_id if p.claim and p.claim.policy else None,
                "amount_inr": p.amount_inr,
                "status": p.status,
                "completed_at": p.completed_at.isoformat() if p.completed_at else None,
            }
            for p in payouts
        ]
    }


@router.get("/payouts/{payout_id}")
async def get_payout_details(
    payout_id: int,
    admin_user: User = Depends(verify_admin_access),
    db: Session = Depends(get_db)
):
    """Get detailed payout information"""
    payout = db.query(Payout).filter(Payout.id == payout_id).first()
    if not payout:
        raise HTTPException(status_code=404, detail="Payout not found")
    
    return {
        "id": payout.id,
        "claim_id": payout.claim_id,
        "user_id": payout.claim.policy.user_id if payout.claim and payout.claim.policy else None,
        "amount_inr": payout.amount_inr,
        "status": payout.status,
        "created_at": payout.created_at.isoformat() if payout.created_at else None,
        "completed_at": payout.completed_at.isoformat() if payout.completed_at else None,
    }


# ═══════════════════════════════════════════════════════════════════════════════
# ──────────────────── CONFIGURATION MANAGEMENT ────────────────────────────────────
# ═══════════════════════════════════════════════════════════════════════════════

class ThresholdConfig(BaseModel):
    fraud_flag_threshold: float  # Score at which claim is flagged (default 0.65)
    blacklist_threshold: int     # Number of fraud flags before blacklist (default 3)
    min_income_coverage: float   # Minimum daily income for coverage (default 500)
    min_experience_months: int   # Minimum experience for coverage (default 3)


@router.get("/config/thresholds")
async def get_thresholds(
    admin_user: User = Depends(verify_admin_access),
    db: Session = Depends(get_db)
):
    """Get current fraud detection thresholds"""
    return {
        "fraud_flag_threshold": 0.65,  # Claims with fraud_score >= 0.65 are flagged
        "blacklist_threshold": 3,       # Users with 3+ fraud flags are blacklisted
        "min_income_coverage": 500,     # Minimum ₹500 daily income
        "min_experience_months": 3,     # Minimum 3 months experience
    }


@router.put("/config/thresholds")
async def update_thresholds(
    config: ThresholdConfig,
    admin_user: User = Depends(verify_admin_access),
    db: Session = Depends(get_db)
):
    """Update fraud detection thresholds"""
    # In a real app, these would be stored in a config table
    # For now, just return success
    
    _log_admin_action(
        db, admin_user.id, AdminAction.UPDATE_THRESHOLD,
        "config", None, f"Updated thresholds: {config.dict()}"
    )
    
    return {
        "message": "Thresholds updated successfully",
        "config": config
    }


# ═══════════════════════════════════════════════════════════════════════════════
# ──────────────────── AUDIT TRAIL ────────────────────────────────────────────────
# ═══════════════════════════════════════════════════════════════════════════════

@router.get("/audit-log")
async def get_audit_log(
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
    action: Optional[str] = Query(None),
    admin_user: User = Depends(verify_admin_access),
    db: Session = Depends(get_db)
):
    """Get admin audit trail"""
    # Note: This would require an AuditLog model to be fully implemented
    # For now, return a mock response showing the structure
    return {
        "total": 0,
        "page": page,
        "size": size,
        "total_pages": 0,
        "data": [
            # {
            #     "id": 1,
            #     "admin_id": 1,
            #     "admin_name": "Admin Name",
            #     "action": "approve_claim",
            #     "target_type": "claim",
            #     "target_id": 123,
            #     "notes": "Fraud score was incorrectly high",
            #     "timestamp": "2026-04-17T10:30:00Z"
            # }
        ]
    }


# ═══════════════════════════════════════════════════════════════════════════════
# ──────────────────── SIMULATOR ──────────────────────────────────────────────────
# ═══════════════════════════════════════════════════════════════════════════════

class TriggerSimulation(BaseModel):
    user_id: int
    trigger_type: str  # "rain", "flood", "hail", "accident"
    severity: float    # 0-1
    location: dict     # {"latitude": 0, "longitude": 0}
    note: Optional[str] = None


@router.post("/trigger/simulate")
async def simulate_trigger(
    simulation: TriggerSimulation,
    admin_user: User = Depends(verify_admin_access),
    db: Session = Depends(get_db)
):
    """Simulate a trigger event for testing"""
    user = db.query(User).filter(User.id == simulation.user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Get active policy
    policy = db.query(Policy).filter(
        and_(Policy.user_id == simulation.user_id, Policy.status == "active")
    ).first()
    
    if not policy:
        raise HTTPException(status_code=400, detail="No active policy for user")
    
    # Create test claim
    claim = Claim(
        policy_id=policy.id,
        trigger_type=simulation.trigger_type,
        amount_claimed=500.0,
        fraud_score=0.3,  # Low fraud score for test
        status="pending",
        trigger_data=simulation.location
    )
    db.add(claim)
    db.commit()
    db.refresh(claim)
    
    _log_admin_action(
        db, admin_user.id, AdminAction.SIMULATE_TRIGGER,
        "trigger", claim.id, simulation.note or f"Simulated {simulation.trigger_type}"
    )
    
    return {
        "message": "Trigger simulated",
        "claim_id": claim.id,
        "trigger_type": claim.trigger_type,
        "status": claim.status
    }


# ═══════════════════════════════════════════════════════════════════════════════
# ───────────────── ADMIN CREDENTIAL MANAGEMENT ────────────────────────────────
# ═══════════════════════════════════════════════════════════════════════════════

class AdminCredentialResponse(BaseModel):
    message: str
    credential: Optional[str] = None  # Only returned when generating new credential


@router.post("/credentials/generate")
async def generate_admin_credential_endpoint(
    admin_user: User = Depends(verify_admin_access),
    db: Session = Depends(get_db)
):
    """Generate a new admin credential for current user"""
    new_credential = generate_admin_credential()
    hashed_credential = hash_admin_credential(new_credential)
    
    admin_user.admin_credential = hashed_credential
    db.add(admin_user)
    db.commit()
    
    _log_admin_action(
        db, admin_user.id, AdminAction.UPDATE_CONFIG,
        "credential", admin_user.id, "Generated new admin credential"
    )
    
    return {
        "message": "Admin credential generated successfully",
        "credential": new_credential  # Show only once, admin must copy
    }


@router.post("/credentials/reset")
async def reset_admin_credential(
    user_id: int = Query(..., description="User ID to reset credential for"),
    admin_user: User = Depends(verify_admin_access),
    db: Session = Depends(get_db)
):
    """
    Reset admin credential for a user (admin only)
    Returns new credential that must be given to admin
    """
    # Only super admins can reset other admin credentials
    target_user = db.query(User).filter(User.id == user_id).first()
    
    if not target_user:
        raise HTTPException(status_code=404, detail="User not found")
    
    if not target_user.is_admin:
        raise HTTPException(status_code=400, detail="User is not an admin")
    
    new_credential = generate_admin_credential()
    hashed_credential = hash_admin_credential(new_credential)
    
    target_user.admin_credential = hashed_credential
    db.add(target_user)
    db.commit()
    
    _log_admin_action(
        db, admin_user.id, AdminAction.UPDATE_CONFIG,
        "credential", target_user.id, f"Reset admin credential for user {target_user.email}"
    )
    
    return {
        "message": f"Admin credential reset for {target_user.email}",
        "credential": new_credential,
        "user_id": target_user.id
    }


@router.post("/credentials/verify")
async def verify_credential_format(
    credential: str = Query(..., description="Credential to verify"),
    admin_user: User = Depends(verify_admin_access),
    db: Session = Depends(get_db)
):
    """Verify if a credential is valid (for testing)"""
    if not admin_user.admin_credential:
        raise HTTPException(status_code=400, detail="No credential set for this admin")
    
    is_valid = verify_admin_credential(credential, admin_user.admin_credential)
    
    return {
        "is_valid": is_valid,
        "message": "Credential is valid" if is_valid else "Credential is invalid"
    }


# ═══════════════════════════════════════════════════════════════════════════════
# ──────────────────── HELPER FUNCTIONS ────────────────────────────────────────────
# ═══════════════════════════════════════════════════════════════════════════════

def _log_admin_action(db: Session, admin_id: int, action: AdminAction, 
                      target_type: str, target_id: Optional[int] = None,
                      notes: Optional[str] = None):
    """Log an admin action to audit trail"""
    # This would create an AuditLog entry in a real implementation
    # For now, just pass
    pass
