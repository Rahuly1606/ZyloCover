"""
Fraud Detection Engine
======================
5-layer fraud scoring system with explainable decision matrix.
Scores 0-100, with thresholds for approval/flag/rejection workflow.
"""

from datetime import datetime, timedelta
from typing import Optional
from enum import Enum
import math


class FraudDecision(str, Enum):
    """Final fraud decision"""
    APPROVED = "approved"          # Score < 40
    FLAGGED = "flagged"            # Score 40-69, admin review
    REJECTED = "rejected"          # Score >= 70


class FraudLayer(str, Enum):
    """Fraud detection layers"""
    DUPLICATE_CLAIM = "duplicate_claim"
    POLICY_AGE = "policy_age"
    GPS_ZONE = "gps_zone"
    CLAIM_FREQUENCY = "claim_frequency"
    ANOMALY = "anomaly"


class FraudDetectionEngine:
    """5-layer fraud scoring system"""

    # ─── LAYER 1: DUPLICATE CLAIM (Hard block, no score) ─────────────────────

    @staticmethod
    def check_duplicate_claim(
        user_id: int,
        trigger_event_id: int,
        existing_claims: list
    ) -> dict:
        """
        Layer 1: Same user + same trigger_event_id = immediate reject
        
        This is a binary check - either duplicate or not.
        If duplicate, entire fraud score becomes 100 (automatic reject).
        """
        is_duplicate = any(
            claim["user_id"] == user_id and 
            claim["trigger_event_id"] == trigger_event_id
            for claim in existing_claims
        )
        
        return {
            "layer": FraudLayer.DUPLICATE_CLAIM,
            "is_duplicate": is_duplicate,
            "score": 100 if is_duplicate else 0,
            "flag": "DUPLICATE_CLAIM" if is_duplicate else None,
            "impact": "Hard block - claim rejected"
        }

    # ─── LAYER 2: POLICY AGE CHECK ──────────────────────────────────────────

    @staticmethod
    def check_policy_age(
        policy_created_at: datetime,
        current_time: datetime
    ) -> dict:
        """
        Layer 2: Policy must be at least 1 hour old before first claim
        
        Rationale: Prevents workers from buying insurance AFTER seeing rain forecast
        
        Returns:
            score: 0 if policy > 1 hour old, +50 if too new
            flag: "POLICY_TOO_NEW" if triggered
        """
        policy_age_minutes = (current_time - policy_created_at).total_seconds() / 60
        min_age_minutes = 60
        
        is_too_new = policy_age_minutes < min_age_minutes
        score = 50 if is_too_new else 0
        
        return {
            "layer": FraudLayer.POLICY_AGE,
            "policy_age_minutes": round(policy_age_minutes, 2),
            "min_required_minutes": min_age_minutes,
            "is_policy_too_new": is_too_new,
            "score": score,
            "flag": "POLICY_TOO_NEW" if is_too_new else None,
            "impact": f"{score} points - Adverse selection prevention"
        }

    # ─── LAYER 3: GPS ZONE CONSISTENCY ──────────────────────────────────────

    @staticmethod
    def check_gps_zone_consistency(
        user_latitude: Optional[float],
        user_longitude: Optional[float],
        user_city: str,
        event_city: str,
        event_epicenter_lat: float,
        event_epicenter_lon: float,
        last_gps_update_time: Optional[datetime],
        current_time: datetime,
        max_distance_km: float = 15.0
    ) -> dict:
        """
        Layer 3: GPS zone consistency check
        
        Rule 1: User's city must match affected city
        Rule 2: If GPS available and recent (< 4 hours), check distance < 15km
        Rule 3: If GPS missing or stale, use city-only check
        """
        flags = []
        score = 0
        
        # Check 1: City mismatch
        city_mismatch = user_city.lower() != event_city.lower()
        if city_mismatch:
            flags.append("CITY_MISMATCH")
            score += 35
        
        # Check 2: GPS distance (if available and recent)
        has_valid_gps = (
            user_latitude is not None and 
            user_longitude is not None and 
            last_gps_update_time is not None
        )
        
        gps_is_stale = False
        gps_distance_km = None
        gps_issue = None
        
        if has_valid_gps:
            gps_age_hours = (current_time - last_gps_update_time).total_seconds() / 3600
            gps_is_stale = gps_age_hours > 4.0
            
            if not gps_is_stale:
                # Calculate Haversine distance
                gps_distance_km = FraudDetectionEngine._haversine_distance(
                    user_latitude, user_longitude,
                    event_epicenter_lat, event_epicenter_lon
                )
                
                if gps_distance_km > max_distance_km:
                    flags.append("GPS_TOO_FAR")
                    score += 35
                    gps_issue = f"User GPS {gps_distance_km:.1f}km from event"
            else:
                gps_issue = f"GPS stale ({gps_age_hours:.1f}h old), fell back to city check"
        else:
            gps_issue = "GPS not available, using city-only check"
        
        return {
            "layer": FraudLayer.GPS_ZONE,
            "city_match": not city_mismatch,
            "user_city": user_city,
            "event_city": event_city,
            "has_valid_gps": has_valid_gps,
            "gps_distance_km": gps_distance_km,
            "gps_is_stale": gps_is_stale,
            "gps_issue": gps_issue,
            "flags": flags,
            "score": score,
            "impact": f"{score} points - Geographic consistency"
        }

    @staticmethod
    def _haversine_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
        """Calculate distance between two lat/lon points in kilometers"""
        R = 6371  # Earth radius in km
        
        dlat = math.radians(lat2 - lat1)
        dlon = math.radians(lon2 - lon1)
        
        a = (math.sin(dlat/2)**2 + 
             math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * 
             math.sin(dlon/2)**2)
        c = 2 * math.asin(math.sqrt(a))
        
        return R * c

    # ─── LAYER 4: CLAIM FREQUENCY CHECK ────────────────────────────────────

    @staticmethod
    def check_claim_frequency(
        claim_count_last_7_days: int,
        max_claims_per_week: int = 5
    ) -> dict:
        """
        Layer 4: Maximum claims per rolling 7-day window
        
        Rationale: A city cannot have > 5 trigger-level events per week statistically.
        If user exceeds this, it's suspicious behavior (likely duplicate attempts).
        """
        is_exceeded = claim_count_last_7_days >= max_claims_per_week
        score = 40 if is_exceeded else 0
        
        return {
            "layer": FraudLayer.CLAIM_FREQUENCY,
            "claims_last_7_days": claim_count_last_7_days,
            "max_allowed_per_week": max_claims_per_week,
            "is_frequency_exceeded": is_exceeded,
            "score": score,
            "flag": "CLAIM_FREQUENCY_EXCEEDED" if is_exceeded else None,
            "impact": f"{score} points - Statistical anomaly detection"
        }

    # ─── LAYER 5: ANOMALY COMPOSITE SCORE ──────────────────────────────────

    @staticmethod
    def check_anomaly_composite(
        prior_fraud_flags: int,
        claims_this_week: int,
        user_risk_score: float,
        account_age_days: int,
        all_time_claims: int
    ) -> dict:
        """
        Layer 5: Composite anomaly scoring
        
        Signals:
        - Prior fraud flags: +15 per flag (cap +45)
        - 4+ claims this week: +20
        - 2-3 claims this week: +5
        - User risk_score > 75: +15
        - New account (< 7 days): +10
        - High claim frequency (10+): +20
        """
        score = 0
        reasons = []
        
        # Prior fraud flags
        fraud_flag_contribution = min(15 * prior_fraud_flags, 45)
        if prior_fraud_flags > 0:
            score += fraud_flag_contribution
            reasons.append(f"Prior fraud flags: {prior_fraud_flags} → +{fraud_flag_contribution}")
        
        # Claims this week
        if claims_this_week >= 4:
            score += 20
            reasons.append(f"High claims this week: {claims_this_week} → +20")
        elif 2 <= claims_this_week <= 3:
            score += 5
            reasons.append(f"Multiple claims this week: {claims_this_week} → +5")
        
        # User risk score
        if user_risk_score > 75:
            score += 15
            reasons.append(f"High user risk score: {user_risk_score} → +15")
        
        # Account age
        if account_age_days < 7:
            score += 10
            reasons.append(f"New account: {account_age_days} days → +10")
        
        # All-time claim frequency
        if all_time_claims >= 10:
            score += 20
            reasons.append(f"High lifetime claims: {all_time_claims} → +20")
        
        return {
            "layer": FraudLayer.ANOMALY,
            "prior_fraud_flags": prior_fraud_flags,
            "claims_this_week": claims_this_week,
            "user_risk_score": user_risk_score,
            "account_age_days": account_age_days,
            "all_time_claims": all_time_claims,
            "score": min(score, 100),  # Cap at 100
            "contributing_factors": reasons,
            "impact": f"{min(score, 100)} points - Behavioral anomalies"
        }

    # ─── FINAL DECISION ─────────────────────────────────────────────────────

    @staticmethod
    def calculate_fraud_score(
        # Layer 1: Duplicate
        user_id: int,
        trigger_event_id: int,
        existing_claims: list,
        
        # Layer 2: Policy age
        policy_created_at: datetime,
        
        # Layer 3: GPS zone
        user_latitude: Optional[float],
        user_longitude: Optional[float],
        user_city: str,
        event_city: str,
        event_epicenter_lat: float,
        event_epicenter_lon: float,
        last_gps_update_time: Optional[datetime],
        
        # Layer 4: Claim frequency
        claim_count_last_7_days: int,
        
        # Layer 5: Anomaly
        prior_fraud_flags: int,
        claims_this_week: int,
        user_risk_score: float,
        account_age_days: int,
        all_time_claims: int,
    ) -> dict:
        """
        Run all 5 layers and produce final fraud decision.
        """
        current_time = datetime.utcnow()
        
        # Layer 1: Duplicate check (hard block)
        layer1 = FraudDetectionEngine.check_duplicate_claim(
            user_id, trigger_event_id, existing_claims
        )
        if layer1["is_duplicate"]:
            return {
                "fraud_score": 100,
                "decision": FraudDecision.REJECTED,
                "reason": "Duplicate claim detected - hard block",
                "layers": [layer1],
                "recommendation": "IMMEDIATE REJECT - Same user + trigger event already claimed"
            }
        
        # Layer 2: Policy age check
        layer2 = FraudDetectionEngine.check_policy_age(policy_created_at, current_time)
        
        # Layer 3: GPS zone consistency
        layer3 = FraudDetectionEngine.check_gps_zone_consistency(
            user_latitude, user_longitude, user_city, event_city,
            event_epicenter_lat, event_epicenter_lon, last_gps_update_time, current_time
        )
        
        # Layer 4: Claim frequency
        layer4 = FraudDetectionEngine.check_claim_frequency(claim_count_last_7_days)
        
        # Layer 5: Anomaly composite
        layer5 = FraudDetectionEngine.check_anomaly_composite(
            prior_fraud_flags, claims_this_week, user_risk_score,
            account_age_days, all_time_claims
        )
        
        # Calculate total score
        total_score = sum([
            layer2["score"],
            layer3["score"],
            layer4["score"],
            layer5["score"]
        ])
        total_score = min(total_score, 100)  # Cap at 100
        
        # Determine decision
        if total_score < 40:
            decision = FraudDecision.APPROVED
            recommendation = "✅ APPROVE - Score below threshold"
        elif total_score < 70:
            decision = FraudDecision.FLAGGED
            recommendation = "⚠️  FLAG FOR REVIEW - Score in caution zone"
        else:
            decision = FraudDecision.REJECTED
            recommendation = "❌ REJECT - Score indicates high fraud risk"
        
        return {
            "fraud_score": total_score,
            "fraud_score_pct": total_score,
            "decision": decision.value,
            "recommendation": recommendation,
            "layers": [layer2, layer3, layer4, layer5],
            "audit_trail": {
                "layer_2_policy_age": layer2,
                "layer_3_gps_zone": layer3,
                "layer_4_frequency": layer4,
                "layer_5_anomaly": layer5,
            },
            "summary": {
                "total_layers_evaluated": 5,
                "layers_triggered": len([l for l in [layer2, layer3, layer4, layer5] if l["score"] > 0]),
                "highest_contributing_layer": max([layer2, layer3, layer4, layer5], key=lambda x: x["score"])["layer"]
            }
        }

    # ─── FRAUD RESPONSE HANDLING ────────────────────────────────────────────

    @staticmethod
    def update_fraud_status(
        decision: str,
        current_fraud_flags: int
    ) -> dict:
        """
        Handle consequences of fraud decision.
        
        - REJECTED claims increment fraud flags
        - 3 flags → auto-blacklist user
        """
        new_fraud_flags = current_fraud_flags
        new_is_blacklisted = False
        action = None
        
        if decision == FraudDecision.REJECTED.value:
            new_fraud_flags += 1
            action = f"Fraud flag incremented to {new_fraud_flags}"
            
            if new_fraud_flags >= 3:
                new_is_blacklisted = True
                action += " → USER BLACKLISTED (3+ flags)"
        
        return {
            "previous_flags": current_fraud_flags,
            "new_flags": new_fraud_flags,
            "flags_incremented": new_fraud_flags > current_fraud_flags,
            "is_now_blacklisted": new_is_blacklisted,
            "action_taken": action
        }
