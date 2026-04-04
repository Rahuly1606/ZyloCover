"""
Actuarial Engine
================
Premium calculation using CA-level financial modeling.
Implements loss ratio, expense ratio, combined ratio, and experience rating.
"""

from datetime import datetime, timedelta
from enum import Enum
import math


class CoverageLevel(str, Enum):
    """Income replacement ratio tiers"""
    BASIC = "basic"      # 60% IRR
    STANDARD = "standard"  # 75% IRR
    PREMIUM = "premium"   # 90% IRR


class CityRiskZone(str, Enum):
    """Geographic risk zones for India"""
    GREEN = "green"      # Low risk (Bangalore)
    AMBER = "amber"      # Medium risk (Delhi, Hyderabad)
    RED = "red"         # High risk (Mumbai, Chennai)
    CRIMSON = "crimson" # Very high risk (Kochi, Vizag)


# ─── ACTUARIAL TABLES (Core underwriting data) ─────────────────────────────

# P(trigger fires in 7 days) by zone and season
SEASONAL_RISK_FACTORS = {
    "mumbai": {
        "off_season": 0.20,
        "monsoon": 0.28,
        "heat": 0.18
    },
    "delhi": {
        "off_season": 0.10,
        "monsoon": 0.14,
        "heat": 0.13
    },
    "bangalore": {
        "off_season": 0.05,
        "monsoon": 0.07,
        "heat": 0.06
    },
    "hyderabad": {
        "off_season": 0.10,
        "monsoon": 0.14,
        "heat": 0.13
    },
    "chennai": {
        "off_season": 0.20,
        "monsoon": 0.25,
        "heat": 0.18
    },
    "kochi": {
        "off_season": 0.30,
        "monsoon": 0.42,
        "heat": 0.22
    },
}

# Zone to city mapping
ZONE_TO_CITY = {
    "zone_a_flood_prone": "mumbai",
    "zone_b_high_traffic": "delhi",
    "zone_c_industrial": "bangalore",
    "zone_d_residential": "hyderabad",
    "zone_e_outer_ring": "bangalore"
}

# Zone risk multipliers
ZONE_MULTIPLIERS = {
    "zone_a_flood_prone": 1.75,      # High risk
    "zone_b_high_traffic": 1.40,     # Medium risk
    "zone_c_industrial": 1.20,       # Medium-low
    "zone_d_residential": 1.00,      # Base
    "zone_e_outer_ring": 0.85,       # Low risk
}

# Delivery platform risk multipliers
PLATFORM_MULTIPLIERS = {
    "zomato": 1.00,
    "swiggy": 1.00,
    "blinkit": 1.05,
    "zepto": 1.05,
    "amazon": 0.95,
    "flipkart": 0.95,
    "other": 1.10
}

# IRR (Income Replacement Ratio) by coverage tier
COVERAGE_TIERS = {
    "basic": {
        "irr": 0.60,
        "max_days_per_week": 3,
        "multiplier": 1.00
    },
    "standard": {
        "irr": 0.75,
        "max_days_per_week": 5,
        "multiplier": 1.35
    },
    "premium": {
        "irr": 0.90,
        "max_days_per_week": 7,
        "multiplier": 1.75
    }
}

# Expected severity distribution
# 60% of triggers are partial (50% loss), 40% are full (100% loss)
EXPECTED_SEVERITY = 0.70  # E(severity) = 0.6*0.5 + 0.4*1.0


class ActuarialEngine:
    """Calculates premiums with full actuarial transparency"""

    @staticmethod
    def get_current_season(city: str) -> str:
        """Determine current season for risk factor lookup"""
        month = datetime.now().month
        
        # Monsoon: June-Sept
        if 6 <= month <= 9:
            return "monsoon"
        # Heat: Mar-May
        elif 3 <= month <= 5:
            return "heat"
        # Off-season: Oct-Feb
        else:
            return "off_season"

    @staticmethod
    def calculate_seasonal_risk(city: str) -> float:
        """Get P(trigger fires in 7 days) for city and season"""
        season = ActuarialEngine.get_current_season(city)
        city_lower = city.lower()
        
        if city_lower not in SEASONAL_RISK_FACTORS:
            # Default fallback
            return 0.10
        
        return SEASONAL_RISK_FACTORS[city_lower].get(season, 0.10)

    @staticmethod
    def calculate_pure_premium(
        daily_income: float,
        city: str,
        zone: str,
        platform: str,
        coverage_tier: str
    ) -> dict:
        """
        Calculate pure premium (expected loss) before loading.
        
        Pure Premium = P(trigger) × E(severity) × daily_income × IRR × working_days × risk_multipliers
        """
        # Step 1: Get trigger probability for season
        trigger_probability = ActuarialEngine.calculate_seasonal_risk(city)
        
        # Step 2: Get IRR from coverage tier
        irr = COVERAGE_TIERS[coverage_tier]["irr"]
        
        # Step 3: Calculate expected daily loss
        working_days_per_week = 6
        expected_daily_loss = daily_income * irr * EXPECTED_SEVERITY
        
        # Step 4: Calculate weekly loss
        expected_weekly_loss = trigger_probability * expected_daily_loss * working_days_per_week
        
        # Step 5: Apply risk multipliers
        zone_multiplier = ZONE_MULTIPLIERS.get(zone, 1.00)
        platform_multiplier = PLATFORM_MULTIPLIERS.get(platform, 1.00)
        
        pure_premium = expected_weekly_loss * zone_multiplier * platform_multiplier
        
        return {
            "trigger_probability": round(trigger_probability, 4),
            "expected_severity": EXPECTED_SEVERITY,
            "expected_daily_loss": round(expected_daily_loss, 2),
            "expected_weekly_loss": round(expected_weekly_loss, 2),
            "zone_multiplier": zone_multiplier,
            "platform_multiplier": platform_multiplier,
            "pure_premium": round(pure_premium, 2),
        }

    @staticmethod
    def apply_gross_premium_loading(pure_premium: float) -> dict:
        """
        Apply actuarial loading for expenses and profit.
        
        Gross Premium = Pure Premium ÷ (1 - Expense Ratio - Profit Loading)
        Where Expense Ratio = 25%, Profit Loading = 8%
        """
        expense_ratio = 0.25
        profit_loading = 0.08
        loading_factor = 1 - expense_ratio - profit_loading  # 0.67
        
        gross_premium = pure_premium / loading_factor
        loading_amount = gross_premium - pure_premium
        
        return {
            "pure_premium": round(pure_premium, 2),
            "loading_amount": round(loading_amount, 2),
            "gross_premium": round(gross_premium, 2),
            "expense_ratio": expense_ratio,
            "profit_loading": profit_loading,
        }

    @staticmethod
    def apply_experience_rating(
        gross_premium: float,
        claim_count_all_time: int,
        fraud_flags: int,
        is_new_account: bool
    ) -> dict:
        """
        Adjust premium based on user's claim history and fraud profile.
        
        - 0 claims ever → 0.90× (10% discount)
        - 1-5 claims, no fraud → 1.00× (neutral)
        - 6-10 claims → 1.15× (15% surcharge)
        - Each fraud flag → +15%, capped at 1.50×
        """
        # Base rating
        if claim_count_all_time == 0:
            rating = 0.90
            reason = "No-claims discount (10%)"
        elif claim_count_all_time <= 5:
            rating = 1.00
            reason = f"Standard rating ({claim_count_all_time} claims)"
        elif claim_count_all_time <= 10:
            rating = 1.15
            reason = f"Claims surcharge (15%)"
        else:
            rating = 1.25
            reason = f"High-frequency surcharge (25%)"
        
        # Add fraud penalties
        fraud_penalty = min(0.15 * fraud_flags, 0.50)  # +15% per flag, max +50%
        rating = min(rating + fraud_penalty, 1.50)  # Cap at 150%
        
        if fraud_flags > 0:
            reason += f" + fraud penalties ({fraud_flags} flags)"
        
        experience_rated_premium = gross_premium * rating
        
        return {
            "experience_rating": round(rating, 3),
            "rating_reason": reason,
            "fraud_penalty": round(fraud_penalty, 2),
            "experience_rated_premium": round(experience_rated_premium, 2),
        }

    @staticmethod
    def calculate_final_premium(
        daily_income: float,
        city: str,
        zone: str,
        platform: str,
        coverage_tier: str,
        claim_count_all_time: int = 0,
        fraud_flags: int = 0
    ) -> dict:
        """
        Full premium calculation with complete breakdown.
        
        Returns: {
            "final_premium": float,  # Bounded premium
            "breakdown": {
                "pure_premium": dict,
                "gross_premium": dict,
                "experience_rating": dict,
            }
        }
        """
        # Step 1: Pure premium
        pure_premium_breakdown = ActuarialEngine.calculate_pure_premium(
            daily_income, city, zone, platform, coverage_tier
        )
        pure_premium = pure_premium_breakdown["pure_premium"]
        
        # Step 2: Gross premium (regulatory loading)
        gross_premium_breakdown = ActuarialEngine.apply_gross_premium_loading(pure_premium)
        gross_premium = gross_premium_breakdown["gross_premium"]
        
        # Step 3: Apply coverage tier multiplier
        tier_multiplier = COVERAGE_TIERS[coverage_tier]["multiplier"]
        gross_with_tier = gross_premium * tier_multiplier
        
        # Step 4: Experience rating
        experience_breakdown = ActuarialEngine.apply_experience_rating(
            gross_with_tier, claim_count_all_time, fraud_flags, False
        )
        final_premium_unbound = experience_breakdown["experience_rated_premium"]
        
        # Step 5: Regulatory bounds
        min_premium = 15.0
        max_premium = 120.0
        final_premium = max(min_premium, min(max_premium, final_premium_unbound))
        
        return {
            "final_premium": round(final_premium, 2),
            "min_premium": min_premium,
            "max_premium": max_premium,
            "breakdown": {
                "pure_premium": pure_premium_breakdown,
                "gross_premium": gross_premium_breakdown,
                "tier_multiplier": tier_multiplier,
                "experience_rating": experience_breakdown,
            }
        }

    @staticmethod
    def calculate_loss_and_combined_ratios(
        total_payouts: float,
        total_premiums: float
    ) -> dict:
        """
        Calculate key financial ratios from an insurer perspective.
        
        Loss Ratio = Payouts / Premiums (regulatory minimum 70%, target 72%)
        Expense Ratio = Operating costs / Premiums (budgeted 25%)
        Combined Ratio = Loss Ratio + Expense Ratio (must be < 100%)
        """
        if total_premiums == 0:
            return {
                "loss_ratio": 0.0,
                "expense_ratio": 0.25,
                "combined_ratio": 0.25,
                "status": "HEALTHY"
            }
        
        loss_ratio = total_payouts / total_premiums
        expense_ratio = 0.25  # Fixed 25% operational cost
        combined_ratio = loss_ratio + expense_ratio
        
        # Status
        if loss_ratio < 0.70:
            loss_status = "❌ BELOW REGULATORY MINIMUM"
        elif loss_ratio < 0.72:
            loss_status = "⚠️  BELOW TARGET"
        elif loss_ratio > 0.85:
            loss_status = "🔴 UNSUSTAINABLE"
        else:
            loss_status = "✅ OPTIMAL"
        
        if combined_ratio > 1.00:
            combined_status = "🔴 UNPROFITABLE"
        else:
            combined_status = "✅ PROFITABLE"
        
        return {
            "loss_ratio": round(loss_ratio, 4),
            "loss_ratio_pct": round(loss_ratio * 100, 2),
            "loss_status": loss_status,
            "expense_ratio": expense_ratio,
            "combined_ratio": round(combined_ratio, 4),
            "combined_ratio_pct": round(combined_ratio * 100, 2),
            "combined_status": combined_status,
            "total_payouts": round(total_payouts, 2),
            "total_premiums": round(total_premiums, 2),
        }
