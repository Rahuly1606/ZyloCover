"""Claims automation routes with AI-powered fraud detection and payout processing"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import and_
from pydantic import BaseModel
from datetime import datetime, timedelta
import uuid
import logging

from app.db.session import get_db
from app.models.claim import Claim, ClaimStatus
from app.models.user import User
from app.models.policy import Policy, PolicyStatus
from app.models.trigger import TriggerEvent
from app.models.payout import Payout, PayoutStatus
from app.core.security import get_current_user
from app.engine.payout import PayoutCalculationEngine
from app.services.ai_client import get_ai_client
from app.api.schemas import (
    ClaimResponse,
    ClaimWithFraudAuditResponse,
    ClaimSubmissionRequest,
    PayoutResponse
)

logger = logging.getLogger(__name__)
ai_client = get_ai_client()

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
    
    # Populate trigger_type from trigger_event if not set
    for claim in claims:
        if not claim.trigger_type and claim.trigger_event_id:
            trigger = db.query(TriggerEvent).filter(
                TriggerEvent.id == claim.trigger_event_id
            ).first()
            if trigger:
                claim.trigger_type = trigger.trigger_type
    
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
    db: Session,
    claim_latitude: float = None,
    claim_longitude: float = None
) -> Claim:
    """
    Process a single claim through the complete pipeline:
    1. Eligibility check
    2. Duplicate detection
    3. Location validation
    4. 5-layer fraud scoring
    5. Payout calculation
    6. UPI gateway processing
    
    Location thresholds (industry standard for parametric insurance):
    - 0-3 km: Nearby (safe)
    - 3-15 km: Moderate (acceptable working area)
    - 15+ km: Far (suspicious)
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
    
    # ─── STEP 3: GET EVENT LOCATION ─────────────────────────────────────────
    # Parse event epicenter coordinates BEFORE location validation
    event_lat = trigger_event.affected_zone.split(',')[0] if ',' in str(trigger_event.affected_zone) else 0.0
    event_lon = trigger_event.affected_zone.split(',')[1] if ',' in str(trigger_event.affected_zone) else 0.0
    
    try:
        event_lat, event_lon = float(event_lat), float(event_lon)
    except:
        event_lat, event_lon = 0.0, 0.0
    
    # ─── STEP 4: LOCATION VALIDATION & FRAUD DETECTION ──────────────────────
    """
    Two scenarios:
    1. MANUAL CLAIM: claim_latitude/claim_longitude provided
       → Compare claimed location with user's stored base location
    2. AUTOMATED CLAIM: claim_latitude/claim_longitude NOT provided
       → Compare user's stored base location with event location
    Both scenarios calculate distance and location risk for fraud detection.
    """
    
    location_distance_km = None
    location_mismatch_flag = None
    claimed_location_lat = None
    claimed_location_lon = None
    
    # SCENARIO 1: Manual claim submission with captured location
    if claim_latitude is not None and claim_longitude is not None:
        claimed_location_lat = claim_latitude
        claimed_location_lon = claim_longitude
        
        if user.base_latitude and user.base_longitude:
            # Calculate distance between stored base location and claimed location
            location_distance_km = PayoutCalculationEngine.haversine(
                user.base_latitude,
                user.base_longitude,
                claim_latitude,
                claim_longitude
            )
            
            # Classify location risk based on distance
            if location_distance_km <= 3:
                location_mismatch_flag = "nearby"  # Safe - user documented being at location
            elif location_distance_km <= 15:
                location_mismatch_flag = "moderate"  # Acceptable working area
            else:
                location_mismatch_flag = "far"  # Suspicious - far from stored location
    
    # SCENARIO 2: Automated claim (no explicit location provided)
    # Use user's stored location and compare with event location
    else:
        if user.base_latitude and user.base_longitude and event_lat != 0.0 and event_lon != 0.0:
            # Calculate distance from user's base location to the EVENT location
            location_distance_km = PayoutCalculationEngine.haversine(
                user.base_latitude,
                user.base_longitude,
                event_lat,
                event_lon
            )
            
            # Classify location risk for fraud detection
            if location_distance_km <= 3:
                location_mismatch_flag = "nearby"  # User at event location
            elif location_distance_km <= 15:
                location_mismatch_flag = "moderate"  # User in acceptable working area
            else:
                location_mismatch_flag = "far"  # User far from event - FRAUD RED FLAG
    
    # ─── STEP 5: FRAUD SCORING WITH AI ────────────────────────────────────
    
    # Get user's claim history
    all_claims_history = db.query(Claim).filter(
        Claim.user_id == user_id
    ).all()
    
    claims_last_7_days = [
        c for c in all_claims_history
        if (now - c.created_at).total_seconds() < 7 * 86400
    ]
    
    account_age_days = (now - user.created_at).total_seconds() / 86400
    
    # Use claimed location if provided (manual), otherwise use stored location (automated) for AI fraud detection
    fraud_check_lat = claim_latitude if claim_latitude else (user.base_latitude or 0.0)
    fraud_check_lon = claim_longitude if claim_longitude else (user.base_longitude or 0.0)
    
    # ──── AI FRAUD DETECTION ────────────────────────────────────────────────
    try:
        fraud_result = await ai_client.predict_fraud(
            policy_age_days=int((now - policy.created_at).total_seconds() / 86400),
            num_claims_6m=len([c for c in claims_last_7_days]),
            user_gps_lat=fraud_check_lat,
            user_gps_lon=fraud_check_lon,
            event_gps_lat=event_lat,
            event_gps_lon=event_lon,
            gps_distance_km=location_distance_km if location_distance_km else (
                PayoutCalculationEngine.haversine(fraud_check_lat, fraud_check_lon, event_lat, event_lon)
                if fraud_check_lat and fraud_check_lon else 0.0
            ),
            account_age_days=int(account_age_days),
            prior_fraud_flags=user.fraud_flag_count,
            all_time_claims=user.all_time_claim_count,
            claim_count_this_week=len(claims_last_7_days),
            user_risk_score=user.user_risk_score or 50,
            trigger_type=trigger_event.trigger_type
        )
        fraud_score = fraud_result['fraud_probability']
        fraud_decision = fraud_result['decision']  # 'approved', 'flagged', or 'rejected'
        fraud_explanation = fraud_result.get('decision_rationale', {})
        ai_fraud_used = True
    except Exception as e:
        logger.error(f"Unexpected error in fraud detection: {e}", exc_info=True)
        raise
    
    # ─── STEP 5: PAYOUT CALCULATION ────────────────────────────────────────
    
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
    
    # ─── STEP 6: CREATE CLAIM RECORD ───────────────────────────────────────
    
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
        # Location data
        claim_latitude=claim_latitude,
        claim_longitude=claim_longitude,
        location_distance_km=location_distance_km,
        location_mismatch_flag=location_mismatch_flag,
        status=ClaimStatus.FRAUD_REVIEW if fraud_decision == "flagged" else ClaimStatus.APPROVED if fraud_decision == "approved" and payout_approved else ClaimStatus.REJECTED,
        fraud_score=fraud_score,
        fraud_flags=fraud_explanation.get("risk_factors", []) if fraud_explanation else [],
        evidence={
            "fraud_detection_method": "ai_xgboost" if ai_fraud_used else "rules_engine",
            "fraud_probability": fraud_score,
            "decision": fraud_decision,
            "decision_rationale": fraud_explanation,
            "location_analysis": {
                "location_source": "user_captured" if claim_latitude is not None else "user_stored",
                "claimed_latitude": claim_latitude,
                "claimed_longitude": claim_longitude,
                "event_latitude": event_lat,
                "event_longitude": event_lon,
                "user_base_latitude": user.base_latitude,
                "user_base_longitude": user.base_longitude,
                "distance_from_base_km": location_distance_km,
                "location_risk_flag": location_mismatch_flag,
                "location_risk_context": {
                    "nearby": "✓ Claim within 3km - User at disaster location or in immediate area. Low fraud risk.",
                    "moderate": "⚠ Claim 3-15km away - Acceptable for gig workers operating in broader work zone. Standard verification.",
                    "far": "✗ Claim 15+km away - User far from disaster location. Higher fraud risk. Manual review recommended."
                }.get(location_mismatch_flag, "Location data not provided for analysis")
            },
            "model_features": {
                "policy_age_days": int((now - policy.created_at).total_seconds() / 86400),
                "num_claims_6m": len(claims_last_7_days),
                "account_age_days": int(account_age_days),
                "prior_fraud_flags": user.fraud_flag_count,
                "all_time_claims": user.all_time_claim_count
            }
        }
    )
    
    db.add(claim)
    db.commit()
    db.refresh(claim)
    
    # Log location-based fraud detection for debugging/auditing
    location_source = 'user_captured' if claim_latitude is not None else 'user_stored'
    distance_str = f"{location_distance_km:.2f}km" if location_distance_km else 'N/A'
    
    logger.info(
        f"Claim {claim.claim_number} created | "
        f"Location source: {location_source} | "
        f"Distance from trigger: {distance_str} | "
        f"Location risk: {location_mismatch_flag or 'unknown'} | "
        f"Fraud score: {fraud_score:.2f} | "
        f"Decision: {fraud_decision}"
    )
    
    # ─── STEP 7: PROCESS PAYOUT ────────────────────────────────────────────
    
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
        # Handle fraud rejection: increment fraud flags and blacklist if >= 3
        user.fraud_flag_count += 1
        if user.fraud_flag_count >= 3:
            user.is_blacklisted = True
            logger.warning(f"User {user_id} blacklisted after {user.fraud_flag_count} fraud flags")
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


@router.post("/submit-with-location", response_model=ClaimResponse)
async def submit_claim_with_location(
    request: ClaimSubmissionRequest,
    user_id: int = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    User endpoint to manually submit a claim with their current location.
    Includes location-based fraud detection.
    
    Request body:
    {
        "trigger_id": 123,
        "claim_latitude": 19.0760,
        "claim_longitude": 72.8777
    }
    """
    try:
        # Get the trigger event
        trigger = db.query(TriggerEvent).filter(
            TriggerEvent.id == request.trigger_id
        ).first()
        
        if not trigger:
            raise HTTPException(
                status_code=404,
                detail=f"Trigger event not found"
            )
        
        # Get user to check if they exist
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            raise HTTPException(
                status_code=404,
                detail="User not found"
            )
        
        # Check if user is blacklisted
        if user.is_blacklisted:
            raise HTTPException(
                status_code=403,
                detail="Your account has been flagged for suspected fraud. Contact support."
            )
        
        # Check for active policy
        now = datetime.utcnow()
        policy = db.query(Policy).filter(
            and_(
                Policy.user_id == user_id,
                Policy.status == PolicyStatus.ACTIVE,
                Policy.end_date > now
            )
        ).first()
        
        if not policy:
            raise HTTPException(
                status_code=400,
                detail="No active insurance policy found. Please purchase a policy first."
            )
        
        # Check for duplicate claim
        existing_claims = db.query(Claim).filter(
            and_(
                Claim.user_id == user_id,
                Claim.trigger_event_id == request.trigger_id
            )
        ).all()
        
        if existing_claims:
            raise HTTPException(
                status_code=409,
                detail="You have already filed a claim for this event. Duplicate claims are not allowed."
            )
        
        # Process the claim with location data
        claim = await process_single_claim(
            user_id=user_id,
            trigger_event=trigger,
            db=db,
            claim_latitude=request.claim_latitude,
            claim_longitude=request.claim_longitude
        )
        
        logger.info(
            f"Claim {claim.claim_number} submitted by user {user_id} "
            f"at location ({request.claim_latitude}, {request.claim_longitude})"
        )
        
        return claim
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error submitting claim: {e}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail="An error occurred while processing your claim. Please try again later."
        )

