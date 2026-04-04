"""Claims automation routes with full fraud detection and payout processing"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import and_
from pydantic import BaseModel
from datetime import datetime, timedelta
import uuid

from app.db.session import get_db
from app.models.claim import Claim, ClaimStatus
from app.models.user import User
from app.models.policy import Policy, PolicyStatus
from app.models.trigger import TriggerEvent
from app.models.payout import Payout, PayoutStatus
from app.core.security import get_current_user
from app.engine.fraud import FraudDetectionEngine
from app.engine.payout import PayoutCalculationEngine
from app.api.schemas import (
    ClaimResponse,
    ClaimWithFraudAuditResponse,
    PayoutResponse
)

router = APIRouter(prefix="/claims", tags=["claims"])


@router.get("/", response_model=list[ClaimResponse])
async def get_claims(
    user_id: int = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all claims history for user with fraud scores"""
    claims = db.query(Claim).filter(
        Claim.user_id == user_id
    ).order_by(Claim.created_at.desc()).all()
    return claims


@router.get("/{claim_id}/audit", response_model=ClaimWithFraudAuditResponse)
async def get_claim_audit(
    claim_id: int,
    user_id: int = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get detailed fraud audit trail for a specific claim"""
    claim = db.query(Claim).filter(
        Claim.id == claim_id,
        Claim.user_id == user_id
    ).first()
    
    if not claim:
        raise HTTPException(status_code=404, detail="Claim not found")
    
    return {
        "id": claim.id,
        "claim_number": claim.claim_number,
        "status": claim.status,
        "fraud_score": claim.fraud_score,
        "fraud_decision": "approved" if claim.fraud_score < 40 else "flagged" if claim.fraud_score < 70 else "rejected",
        "fraud_layers": claim.fraud_flags or [],
        "gross_payout_inr": claim.gross_payout_inr,
        "net_payout_inr": claim.net_payout_inr,
        "audit_trail": {
            "created_at": claim.created_at.isoformat(),
            "updated_at": claim.updated_at.isoformat() if claim.updated_at else None,
            "evidence": claim.evidence or {}
        }
    }


async def process_single_claim(
    user_id: int,
    trigger_event: TriggerEvent,
    db: Session
) -> Claim:
    """
    Process a single claim through the complete pipeline:
    1. Eligibility check
    2. Duplicate detection
    3. 5-layer fraud scoring
    4. Payout calculation
    5. UPI gateway processing
    """
    now = datetime.utcnow()
    
    # ─── STEP 1: ELIGIBILITY CHECK ──────────────────────────────────────────
    
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    if user.is_blacklisted:
        raise Exception("User is blacklisted - cannot process claims")
    
    # Check for active policy
    policy = db.query(Policy).filter(
        and_(
            Policy.user_id == user_id,
            Policy.status == PolicyStatus.ACTIVE,
            Policy.end_date > now
        )
    ).first()
    
    if not policy:
        raise Exception("No active policy found")
    
    # ─── STEP 2: DUPLICATE CLAIM CHECK ─────────────────────────────────────
    
    existing_claims = db.query(Claim).filter(
        and_(
            Claim.user_id == user_id,
            Claim.trigger_event_id == trigger_event.id
        )
    ).all()
    
    if existing_claims:
        raise Exception(f"Duplicate claim detected for trigger event {trigger_event.id}")
    
    # ─── STEP 3: FRAUD SCORING (5 LAYERS) ──────────────────────────────────
    
    # Get user's claim history
    all_claims_history = db.query(Claim).filter(
        Claim.user_id == user_id
    ).all()
    
    claims_last_7_days = [
        c for c in all_claims_history
        if (now - c.created_at).total_seconds() < 7 * 86400
    ]
    
    account_age_days = (now - user.created_at).total_seconds() / 86400
    
    # Get event epicenter (for GPS check)
    event_lat = trigger_event.affected_zone.split(',')[0] if ',' in str(trigger_event.affected_zone) else 0.0
    event_lon = trigger_event.affected_zone.split(',')[1] if ',' in str(trigger_event.affected_zone) else 0.0
    
    try:
        event_lat, event_lon = float(event_lat), float(event_lon)
    except:
        event_lat, event_lon = 0.0, 0.0
    
    # Run fraud scoring
    fraud_result = FraudDetectionEngine.calculate_fraud_score(
        user_id=user_id,
        trigger_event_id=trigger_event.id,
        existing_claims=[{"user_id": c.user_id, "trigger_event_id": c.trigger_event_id} for c in all_claims_history],
        policy_created_at=policy.created_at,
        user_latitude=user.base_latitude,
        user_longitude=user.base_longitude,
        user_city=user.city,
        event_city=trigger_event.affected_city,
        event_epicenter_lat=event_lat,
        event_epicenter_lon=event_lon,
        last_gps_update_time=user.last_gps_update,
        claim_count_last_7_days=len(claims_last_7_days),
        prior_fraud_flags=user.fraud_flag_count,
        claims_this_week=len(claims_last_7_days),
        user_risk_score=user.user_risk_score,
        account_age_days=int(account_age_days),
        all_time_claims=user.all_time_claim_count,
    )
    
    fraud_score = fraud_result["fraud_score"]
    fraud_decision = fraud_result["decision"]
    
    # ─── STEP 4: PAYOUT CALCULATION ────────────────────────────────────────
    
    # Severity band
    severity_info = PayoutCalculationEngine.determine_severity_band(
        trigger_event.trigger_type,
        trigger_event.measured_value
    )
    
    # Calculate payout
    payout_calc = PayoutCalculationEngine.calculate_final_payout(
        daily_income=user.avg_daily_income,
        income_replacement_ratio=policy.income_replacement_ratio,
        max_weekly_payout=policy.max_weekly_payout,
        already_claimed_this_week=policy.total_claimed_this_week,
        trigger_type=trigger_event.trigger_type,
        measured_value=trigger_event.measured_value
    )
    
    payout_approved = payout_calc["is_approved"]
    payout_amount = payout_calc["final_payout"]
    
    # ─── STEP 5: CREATE CLAIM RECORD ───────────────────────────────────────
    
    claim_number = f"CLM-{datetime.utcnow().strftime('%y%m%d%H%M%S')}-{uuid.uuid4().hex[:6].upper()}"
    
    claim = Claim(
        claim_number=claim_number,
        user_id=user_id,
        policy_id=policy.id,
        trigger_event_id=trigger_event.id,
        hours_lost=0.0,  # Not used in parametric model
        expected_hourly_income=0.0,  # Not used in parametric model
        gross_payout_inr=payout_amount,
        payout_multiplier=1.0,
        net_payout_inr=payout_amount,
        severity_band=severity_info["band"],
        severity_multiplier=severity_info["severity_multiplier"],
        trigger_measured_value=trigger_event.measured_value,
        trigger_type=trigger_event.trigger_type,
        status=ClaimStatus.FRAUD_REVIEW if fraud_decision == "flagged" else ClaimStatus.APPROVED if fraud_decision == "approved" and payout_approved else ClaimStatus.REJECTED,
        fraud_score=fraud_score,
        fraud_flags=fraud_result.get("layers", []),
        evidence=fraud_result
    )
    
    db.add(claim)
    db.commit()
    db.refresh(claim)
    
    # ─── STEP 6: PROCESS PAYOUT ────────────────────────────────────────────
    
    if fraud_decision == "approved" and payout_approved and payout_amount > 0:
        # Create payout record
        payout_ref = f"PAY-{datetime.utcnow().strftime('%y%m%d%H%M%S')}-{uuid.uuid4().hex[:6].upper()}"
        
        payout = Payout(
            payout_reference=payout_ref,
            claim_id=claim.id,
            user_id=user_id,
            amount_inr=payout_amount,
            status=PayoutStatus.CREATED,
            payment_method="upi",
            upi_id=user.email,  # Using email as UPI ID for demo
        )
        
        db.add(payout)
        db.commit()
        db.refresh(payout)
        
        # Simulate UPI gateway call
        gateway_result = PayoutCalculationEngine.simulate_upi_gateway(payout_amount)
        
        if gateway_result["success"]:
            payout.status = PayoutStatus.SUCCESS
            payout.transaction_id = gateway_result["transaction_id"]
            payout.completed_at = datetime.utcnow()
            claim.status = ClaimStatus.PAID
            
            # Update policy tracking
            policy.total_claimed_this_week += payout_amount
            policy.claim_count_this_week += 1
        else:
            payout.status = PayoutStatus.FAILED
            claim.status = ClaimStatus.REJECTED
        
        db.commit()
    elif fraud_decision == "rejected":
        # Handle fraud rejection
        fraud_update = FraudDetectionEngine.update_fraud_status(
            fraud_decision, user.fraud_flag_count
        )
        user.fraud_flag_count = fraud_update["new_flags"]
        user.is_blacklisted = fraud_update["is_now_blacklisted"]
        db.commit()
    
    # Update user stats
    user.all_time_claim_count += 1
    db.commit()
    
    return claim


@router.post("/trigger/{trigger_id}/process")
async def process_claims_for_trigger(
    trigger_id: int,
    admin_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Admin endpoint to manually trigger claim processing for an event.
    Normally called by scheduler every 5 minutes.
    """
    trigger = db.query(TriggerEvent).filter(
        TriggerEvent.id == trigger_id
    ).first()
    
    if not trigger:
        raise HTTPException(status_code=404, detail="Trigger event not found")
    
    # Find all users in affected city with active policies
    now = datetime.utcnow()
    eligible_policies = db.query(Policy).join(User).filter(
        and_(
            User.city == trigger.affected_city,
            Policy.status == PolicyStatus.ACTIVE,
            Policy.end_date > now,
            User.is_blacklisted == False
        )
    ).all()
    
    processed_claims = []
    for policy in eligible_policies:
        try:
            claim = await process_single_claim(policy.user_id, trigger, db)
            processed_claims.append(claim)
        except Exception as e:
            continue
    
    return {
        "trigger_id": trigger_id,
        "policies_processed": len(eligible_policies),
        "claims_created": len(processed_claims),
        "timestamp": datetime.utcnow().isoformat()
    }
