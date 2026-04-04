"""
Payout Calculation Engine
==========================
Calculates actual payouts based on trigger severity and policy terms.
Implements bounds, severity bands, and coverage limits.
"""

from enum import Enum


class SeverityBand(str, Enum):
    """Trigger severity classification"""
    PARTIAL = "partial"    # 50% loss - 50mm-74mm rain, 400-449 AQI, etc.
    FULL = "full"         # 100% loss - 75mm+ rain, 450+ AQI, etc.


class PayoutCalculationEngine:
    """Calculates and validates payouts"""

    MIN_PAYOUT = 50.0      # Below this, don't process
    MAX_PAYOUT_PER_EVENT = 1500.0  # Anti-gaming cap

    @staticmethod
    def determine_severity_band(
        trigger_type: str,
        measured_value: float
    ) -> dict:
        """
        Determine severity band based on trigger type and measured value.
        
        Returns:
            {
                "band": "partial" | "full",
                "severity_multiplier": 0.5 | 1.0,
                "description": str
            }
        """
        # Severity thresholds by trigger type
        # Partial: 50% loss, Full: 100% loss
        thresholds = {
            "heavy_rain": {
                "partial_threshold": 50.0,  # mm/hour
                "full_threshold": 75.0,
            },
            "extreme_heat": {
                "partial_threshold": 42.0,  # °C
                "full_threshold": 45.0,
            },
            "high_aqi": {
                "partial_threshold": 400,   # AQI points
                "full_threshold": 450,
            },
            "strong_winds": {
                "partial_threshold": 50,    # km/h
                "full_threshold": 75,
            },
            "flash_flood": {
                "partial_threshold": 1.0,   # alert level
                "full_threshold": 2.0,
            },
            "curfew": {
                "partial_threshold": 0.5,   # binary
                "full_threshold": 1.0,
            },
        }
        
        if trigger_type not in thresholds:
            # Default fallback
            return {
                "band": SeverityBand.PARTIAL.value,
                "severity_multiplier": 0.5,
                "description": f"Unknown trigger type {trigger_type} - assumed partial",
                "threshold_info": "Fallback to 50% loss"
            }
        
        thresholds_for_type = thresholds[trigger_type]
        partial_threshold = thresholds_for_type["partial_threshold"]
        full_threshold = thresholds_for_type["full_threshold"]
        
        if measured_value >= full_threshold:
            band = SeverityBand.FULL.value
            multiplier = 1.0
            description = f"Full disruption: {trigger_type} at {measured_value} (≥{full_threshold})"
        elif measured_value >= partial_threshold:
            band = SeverityBand.PARTIAL.value
            multiplier = 0.5
            description = f"Partial disruption: {trigger_type} at {measured_value} ({partial_threshold}-{full_threshold})"
        else:
            band = SeverityBand.PARTIAL.value
            multiplier = 0.5  # Default to partial if just above threshold
            description = f"Minimal disruption: {trigger_type} at {measured_value} (below {partial_threshold})"
        
        return {
            "band": band,
            "severity_multiplier": multiplier,
            "description": description,
            "threshold_info": {
                "trigger_type": trigger_type,
                "measured_value": measured_value,
                "partial_threshold": partial_threshold,
                "full_threshold": full_threshold,
            }
        }

    @staticmethod
    def calculate_payout(
        daily_income: float,
        income_replacement_ratio: float,
        severity_multiplier: float
    ) -> dict:
        """
        Calculate base payout amount.
        
        Payout = daily_income × IRR × severity_multiplier
        
        Common scenarios:
        - Bangalore Swiggy, Basic (60% IRR), partial rain:
          ₹600 × 0.60 × 0.50 = ₹180
        - Mumbai Zepto, Premium (90% IRR), full flood:
          ₹800 × 0.90 × 1.00 = ₹720
        """
        base_payout = daily_income * income_replacement_ratio * severity_multiplier
        
        return {
            "daily_income": round(daily_income, 2),
            "income_replacement_ratio": income_replacement_ratio,
            "irr_percentage": int(income_replacement_ratio * 100),
            "severity_multiplier": severity_multiplier,
            "severity_percentage": int(severity_multiplier * 100),
            "base_payout": round(base_payout, 2),
            "calculation": f"₹{daily_income} × {income_replacement_ratio} × {severity_multiplier}"
        }

    @staticmethod
    def apply_payout_bounds(
        base_payout: float,
        max_weekly_payout: float,
        already_claimed_this_week: float,
        trigger_event_id: int = None
    ) -> dict:
        """
        Apply payout bounds and weekly maximum check.
        
        Rules:
        1. Min payout: ₹50 (below this, don't process)
        2. Max payout per event: ₹1,500 (anti-gaming cap)
        3. Max weekly payout: from policy (e.g., ₹2,625 for Standard tier)
        4. If weekly maximum reached, reject further claims this week
        """
        # Check 1: Minimum payout
        if base_payout < PayoutCalculationEngine.MIN_PAYOUT:
            return {
                "approved": False,
                "reason": f"Below minimum payout (₹{PayoutCalculationEngine.MIN_PAYOUT})",
                "base_payout": round(base_payout, 2),
                "final_payout": 0.0,
                "bounds_applied": ["MIN_PAYOUT_REJECTED"]
            }
        
        # Check 2: Max per event
        bounded_by_event = min(base_payout, PayoutCalculationEngine.MAX_PAYOUT_PER_EVENT)
        if bounded_by_event < base_payout:
            event_cap_applied = True
        else:
            event_cap_applied = False
        
        # Check 3: Weekly maximum
        remaining_weekly_capacity = max(0, max_weekly_payout - already_claimed_this_week)
        bounded_by_weekly = min(bounded_by_event, remaining_weekly_capacity)
        
        if bounded_by_weekly < bounded_by_event:
            weekly_cap_applied = True
        else:
            weekly_cap_applied = False
        
        # Check 4: Weekly cap fully exhausted?
        if remaining_weekly_capacity <= 0:
            return {
                "approved": False,
                "reason": f"Weekly payout maximum exhausted (₹{max_weekly_payout})",
                "base_payout": round(base_payout, 2),
                "final_payout": 0.0,
                "already_claimed_this_week": round(already_claimed_this_week, 2),
                "max_weekly_payout": round(max_weekly_payout, 2),
                "bounds_applied": ["WEEKLY_CAP_EXHAUSTED"]
            }
        
        bounds_applied = []
        if event_cap_applied:
            bounds_applied.append(f"EVENT_CAP_APPLIED_₹{PayoutCalculationEngine.MAX_PAYOUT_PER_EVENT}")
        if weekly_cap_applied:
            bounds_applied.append(f"WEEKLY_CAP_APPLIED")
        
        return {
            "approved": True,
            "reason": "Payout approved within all bounds",
            "base_payout": round(base_payout, 2),
            "after_event_cap": round(bounded_by_event, 2),
            "remaining_weekly_capacity": round(remaining_weekly_capacity, 2),
            "final_payout": round(bounded_by_weekly, 2),
            "already_claimed_this_week": round(already_claimed_this_week, 2),
            "max_weekly_payout": round(max_weekly_payout, 2),
            "event_cap_applied": event_cap_applied,
            "weekly_cap_applied": weekly_cap_applied,
            "bounds_applied": bounds_applied if bounds_applied else ["NO_CAPS_APPLIED"]
        }

    @staticmethod
    def calculate_final_payout(
        # User & Policy
        daily_income: float,
        income_replacement_ratio: float,
        max_weekly_payout: float,
        already_claimed_this_week: float,
        
        # Trigger
        trigger_type: str,
        measured_value: float
    ) -> dict:
        """
        Full payout calculation with complete breakdown.
        
        Returns everything needed for claim processing.
        """
        # Step 1: Determine severity
        severity_info = PayoutCalculationEngine.determine_severity_band(
            trigger_type, measured_value
        )
        
        # Step 2: Calculate base payout
        payout_calc = PayoutCalculationEngine.calculate_payout(
            daily_income,
            income_replacement_ratio,
            severity_info["severity_multiplier"]
        )
        
        # Step 3: Apply bounds
        bounded_payout = PayoutCalculationEngine.apply_payout_bounds(
            payout_calc["base_payout"],
            max_weekly_payout,
            already_claimed_this_week
        )
        
        return {
            "final_payout": bounded_payout["final_payout"] if bounded_payout["approved"] else 0.0,
            "is_approved": bounded_payout["approved"],
            "reason": bounded_payout["reason"],
            "breakdown": {
                "severity": severity_info,
                "calculation": payout_calc,
                "bounds": bounded_payout
            }
        }

    @staticmethod
    def simulate_upi_gateway(amount: float) -> dict:
        """
        Simulate UPI gateway payment with 97% success rate.
        
        Returns:
            {
                "success": bool,
                "transaction_id": str,
                "utr_number": str,
                "timestamp": str,
                "amount": float,
            }
        """
        import random
        from datetime import datetime
        
        success_rate = 0.97
        is_success = random.random() < success_rate
        
        if is_success:
            transaction_id = f"TXN-{datetime.utcnow().strftime('%Y%m%d%H%M%S')}-{random.randint(10000, 99999)}"
            utr = f"UTR{random.randint(1000000000, 9999999999)}"
            
            return {
                "success": True,
                "transaction_id": transaction_id,
                "utr_number": utr,
                "timestamp": datetime.utcnow().isoformat(),
                "amount": amount,
                "status": "COMPLETED",
                "gateway_response": {
                    "status": "success",
                    "message": f"Payment of ₹{amount} initiated successfully"
                }
            }
        else:
            return {
                "success": False,
                "transaction_id": None,
                "utr_number": None,
                "timestamp": datetime.utcnow().isoformat(),
                "amount": amount,
                "status": "FAILED",
                "error": "Gateway timeout - will retry in 30 minutes",
                "retry_after_minutes": 30,
                "gateway_response": {
                    "status": "failure",
                    "message": "Temporary gateway issue - please retry"
                }
            }
