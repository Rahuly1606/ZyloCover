"""
RaahPay Fraud Detection Engine
================================
Hybrid approach:
  1. Rule-based flags (fast, deterministic, auditable)
  2. Isolation Forest anomaly detection (ML layer)
  3. Composite score — weighted combination

Score: 0.0 (clean) → 1.0 (definite fraud)
Threshold: 0.65 → auto-reject; 0.40-0.65 → manual review
"""

import math
from dataclasses import dataclass
from typing import List, Optional, Dict
from datetime import datetime, timedelta

from app.core.config import get_settings

settings = get_settings()


@dataclass
class FraudCheckInput:
    user_id: int
    policy_id: int
    trigger_event_id: int
    work_zone: str
    
    user_latitude: Optional[float] = None
    user_longitude: Optional[float] = None
    trigger_latitude: Optional[float] = None
    trigger_longitude: Optional[float] = None
    
    claims_last_30_days: int = 0
    claims_last_7_days: int = 0
    past_fraud_flags: int = 0
    account_age_days: int = 0
    
    last_claim_hours_ago: Optional[float] = None
    policy_purchased_hours_before_trigger: Optional[float] = None
    
    platform_active_hours: float = 0.0


class FraudDetectionEngine:
    """Fraud scoring system"""
    
    def assess(self, inp: FraudCheckInput) -> tuple[float, List[str]]:
        """
        Returns: (fraud_score: 0-1, flags: list of triggered rules)
        """
        score = 0.0
        flags = []
        
        # ── Rule 1: Policy purchased AFTER trigger ────────────────────────
        if inp.policy_purchased_hours_before_trigger is not None:
            if inp.policy_purchased_hours_before_trigger < 0:
                score += 0.45
                flags.append("policy_bought_after_trigger")
        
        # ── Rule 2: GPS outside zone ──────────────────────────────────────
        if inp.user_latitude and inp.trigger_latitude:
            distance_km = self._haversine(
                inp.user_latitude, inp.user_longitude,
                inp.trigger_latitude, inp.trigger_longitude
            )
            if distance_km > 15:  # More than 15km away
                score += 0.40
                flags.append(f"gps_outside_zone_distance_{distance_km:.1f}km")
        
        # ── Rule 3: Claim flood (3+ in 7 days) ────────────────────────────
        if inp.claims_last_7_days >= 3:
            score += 0.30
            flags.append(f"claim_flood_{inp.claims_last_7_days}_in_7d")
        
        # ── Rule 4: Past fraud history ────────────────────────────────────
        if inp.past_fraud_flags > 0:
            fraud_weight = min(inp.past_fraud_flags * 0.50, 0.50)
            score += fraud_weight
            flags.append(f"past_fraud_flags_{inp.past_fraud_flags}")
        
        # ── Rule 5: Platform active during trigger ────────────────────────
        if inp.platform_active_hours > 2:  # More than 2 hours of activity
            score -= 0.20  # REDUCE score (innocent signal)
            flags.append(f"platform_active_during_trigger")
        
        # ── Rule 6: Account age check ─────────────────────────────────────
        if inp.account_age_days < 30:
            score += 0.15
            flags.append("new_account")
        elif inp.account_age_days < 90:
            score += 0.08
            flags.append("relatively_new_account")
        
        # ── Normalize score to [0, 1] ────────────────────────────────────────
        final_score = max(0.0, min(score, 1.0))
        
        return final_score, flags
    
    def _haversine(self, lat1: float, lon1: float, lat2: float, lon2: float) -> float:
        """Distance in km between two GPS coordinates"""
        R = 6371  # Earth radius in km
        
        dlat = math.radians(lat2 - lat1)
        dlon = math.radians(lon2 - lon1)
        
        a = (math.sin(dlat / 2) ** 2 +
             math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) *
             math.sin(dlon / 2) ** 2)
        
        c = 2 * math.asin(math.sqrt(a))
        return R * c


fraud_engine = FraudDetectionEngine()
