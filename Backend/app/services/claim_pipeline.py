"""
RaahPay Zero-Touch Claim Pipeline
====================================
Enforced execution order:
  TriggerDetected → EligibilityCheck → FraudAssessment → ClaimCreation → PayoutInitiation

No human touchpoint in the happy path.
"""

import uuid
import logging
from datetime import datetime, timedelta
from typing import List, Optional
from sqlalchemy.orm import Session

from app.models.user import User
from app.models.policy import Policy, PolicyStatus
from app.models.trigger import TriggerEvent, TriggerStatus
from app.models.claim import Claim, ClaimStatus
from app.models.payout import Payout, PayoutStatus
from app.services.fraud_engine import fraud_engine, FraudCheckInput
from app.services.environmental import ZONE_CENTROIDS
from app.core.config import get_settings

settings = get_settings()
logger = logging.getLogger("raahpay.pipeline")


def generate_claim_number() -> str:
    """Generate unique claim number"""
    return f"RP-CLM-{datetime.now().strftime('%Y%m%d')}-{uuid.uuid4().hex[:6].upper()}"


def generate_payout_reference() -> str:
    """Generate unique payout reference"""
    return f"RZPY-{uuid.uuid4().hex[:12].upper()}"


class ClaimPipeline:
    """Orchestrates the full automated claim flow"""
    
    async def process_trigger(self, trigger: TriggerEvent, db: Session) -> List[Claim]:
        """
        Entry point: given a trigger, find all eligible users and process claims.
        Returns list of created claims.
        """
        created_claims = []
        logger.info(f"Processing trigger: {trigger.trigger_type} in {trigger.affected_zone}")
        
        # Find eligible policies in affected zone
        eligible_policies = (
            db.query(Policy)
            .join(User)
            .filter(
                User.work_zone == trigger.affected_zone,
                Policy.status == PolicyStatus.ACTIVE,
                Policy.end_date > datetime.utcnow(),
            )
            .all()
        )
        
        logger.info(f"Found {len(eligible_policies)} eligible policies")
        
        for policy in eligible_policies:
            try:
                claim = await self._process_single_claim(policy, trigger, db)
                if claim:
                    created_claims.append(claim)
            except Exception as e:
                logger.error(f"Error processing claim for policy {policy.id}: {e}")
        
        return created_claims
    
    async def _process_single_claim(
        self, policy: Policy, trigger: TriggerEvent, db: Session
    ) -> Optional[Claim]:
        """Process claim for a single policy"""
        
        user = db.query(User).filter(User.id == policy.user_id).first()
        
        # ── Stage 1: Eligibility Check ────────────────────────────────
        if policy.status != PolicyStatus.ACTIVE:
            logger.info(f"Policy {policy.policy_number} not active")
            return None
        
        if policy.total_claimed_this_week > policy.max_weekly_payout:
            logger.info(f"Policy {policy.policy_number} reached weekly cap")
            return None
        
        # ── Stage 2: Fraud Assessment ────────────────────────────────
        fraud_input = FraudCheckInput(
            user_id=user.id,
            policy_id=policy.id,
            trigger_event_id=trigger.id,
            work_zone=user.work_zone,
            user_latitude=user.base_latitude,
            user_longitude=user.base_longitude,
            trigger_latitude=ZONE_CENTROIDS[user.work_zone][0],
            trigger_longitude=ZONE_CENTROIDS[user.work_zone][1],
            account_age_days=(datetime.utcnow() - user.created_at).days,
        )
        
        fraud_score, fraud_flags = fraud_engine.assess(fraud_input)
        
        # Determine initial status based on fraud score
        if fraud_score > 0.65:
            claim_status = ClaimStatus.REJECTED
        elif fraud_score > 0.40:
            claim_status = ClaimStatus.FRAUD_REVIEW
        else:
            claim_status = ClaimStatus.APPROVED
        
        # ── Stage 3: Calculate Payout ────────────────────────────────
        hours_lost = 8.0  # Assume 8 hours lost per day trigger
        hourly_income = user.avg_daily_income / user.avg_daily_hours
        gross_payout = hours_lost * hourly_income * trigger.payout_multiplier
        
        # Cap to remaining weekly amount
        remaining_cap = policy.max_weekly_payout - policy.total_claimed_this_week
        net_payout = min(gross_payout, remaining_cap)
        
        # ── Stage 4: Create Claim ────────────────────────────────
        claim = Claim(
            claim_number=generate_claim_number(),
            user_id=user.id,
            policy_id=policy.id,
            trigger_event_id=trigger.id,
            hours_lost=hours_lost,
            expected_hourly_income=hourly_income,
            gross_payout_inr=gross_payout,
            payout_multiplier=trigger.payout_multiplier,
            net_payout_inr=net_payout,
            status=claim_status,
            fraud_score=fraud_score,
            fraud_flags=fraud_flags,
        )
        
        db.add(claim)
        db.commit()
        
        logger.info(f"Created claim {claim.claim_number} with status {claim_status}")
        
        # ── Stage 5: Auto-Payout if Approved ────────────────────────
        if claim_status == ClaimStatus.APPROVED:
            await self._execute_payout(claim, user, db)
        
        return claim
    
    async def _execute_payout(self, claim: Claim, user: User, db: Session):
        """Execute immediate payout for approved claims"""
        
        payout = Payout(
            payout_reference=generate_payout_reference(),
            claim_id=claim.id,
            user_id=user.id,
            amount_inr=claim.net_payout_inr,
            status=PayoutStatus.SUCCESS,
            upi_id=f"mock-upi-{user.id}@raahpay",
            transaction_id=f"MOCK-TXN-{uuid.uuid4().hex[:10].upper()}",
        )
        
        db.add(payout)
        claim.status = ClaimStatus.PAID
        
        db.commit()
        logger.info(f"Payout executed: ₹{claim.net_payout_inr} to user {user.email}")


claim_pipeline = ClaimPipeline()
