"""
zylocover Constants and Configuration
"""
from enum import Enum
from typing import Dict

# ====================== ENUMS ======================


class ZoneRisk(str, Enum):
    """Geographic risk zones"""
    GREEN = "green"
    AMBER = "amber"
    RED = "red"
    CRIMSON = "crimson"


class CoverageTier(str, Enum):
    """Insurance coverage tiers"""
    BASIC = "basic"
    STANDARD = "standard"
    PREMIUM = "premium"


class TriggerType(str, Enum):
    """Parametric trigger types"""
    HEAVY_RAIN = "heavy_rain"
    EXTREME_HEAT = "extreme_heat"
    SEVERE_AQI = "severe_aqi"
    FLOOD_ALERT = "flood_alert"
    CYCLONE_WARNING = "cyclone_warning"
    CIVIL_DISRUPTION = "civil_disruption"


class TriggerSeverity(str, Enum):
    """Event severity level"""
    PARTIAL = "partial"
    FULL = "full"


class ClaimStatus(str, Enum):
    """Claim lifecycle status"""
    TRIGGERED = "triggered"
    FRAUD_CHECK = "fraud_check"
    APPROVED = "approved"
    FLAGGED = "flagged"
    REJECTED = "rejected"
    PAID = "paid"


class PayoutStatus(str, Enum):
    """Payout lifecycle status"""
    PENDING = "pending"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"
    FAILED_FINAL = "failed_final"


class PolicyStatus(str, Enum):
    """Policy lifecycle status"""
    ACTIVE = "active"
    EXPIRED = "expired"
    CANCELLED = "cancelled"


class DeliveryPlatform(str, Enum):
    """Delivery platforms supported"""
    ZOMATO = "zomato"
    SWIGGY = "swiggy"
    ZEPTO = "zepto"
    BLINKIT = "blinkit"
    AMAZON = "amazon"
    FLIPKART = "flipkart"
    DUNZO = "dunzo"


class VehicleType(str, Enum):
    """Vehicle types for delivery"""
    BIKE = "bike"
    BICYCLE = "bicycle"
    EV_BIKE = "ev_bike"
    SCOOTER = "scooter"
    CAR = "car"


# ====================== CITY TO ZONE MAPPING ======================

CITY_ZONE_MAP: Dict[str, ZoneRisk] = {
    # GREEN ZONE
    "bangalore": ZoneRisk.GREEN,
    "bengaluru": ZoneRisk.GREEN,
    "pune": ZoneRisk.GREEN,
    "jaipur": ZoneRisk.GREEN,
    # AMBER ZONE
    "delhi": ZoneRisk.AMBER,
    "noida": ZoneRisk.AMBER,
    "gurugram": ZoneRisk.AMBER,
    "gurgaon": ZoneRisk.AMBER,
    "hyderabad": ZoneRisk.AMBER,
    "lucknow": ZoneRisk.AMBER,
    "ahmedabad": ZoneRisk.AMBER,
    "indore": ZoneRisk.AMBER,
    # RED ZONE
    "mumbai": ZoneRisk.RED,
    "kolkata": ZoneRisk.RED,
    "chennai": ZoneRisk.RED,
    "nagpur": ZoneRisk.RED,
    "patna": ZoneRisk.RED,
    # CRIMSON ZONE
    "bhubaneswar": ZoneRisk.CRIMSON,
    "visakhapatnam": ZoneRisk.CRIMSON,
    "kochi": ZoneRisk.CRIMSON,
    "guwahati": ZoneRisk.CRIMSON,
}

CITY_ALIASES: Dict[str, str] = {
    "bengaluru": "bangalore",
    "gurgaon": "gurugram",
}

# ====================== PRICING CONFIGURATION ======================

# Coverage tier specifications
COVERAGE_TIERS = {
    CoverageTier.BASIC: {
        "irr": 0.60,
        "max_claim_days": 3,
        "premium_multiplier": 1.00,
    },
    CoverageTier.STANDARD: {
        "irr": 0.75,
        "max_claim_days": 5,
        "premium_multiplier": 1.35,
    },
    CoverageTier.PREMIUM: {
        "irr": 0.90,
        "max_claim_days": 7,
        "premium_multiplier": 1.75,
    },
}

# Trigger probability base rates by zone
ZONE_BASE_PROBABILITY = {
    ZoneRisk.GREEN: 0.05,
    ZoneRisk.AMBER: 0.10,
    ZoneRisk.RED: 0.20,
    ZoneRisk.CRIMSON: 0.30,
}

# Seasonal factors (by month 1-12)
SEASONAL_FACTORS = {
    1: 0.70,  # Jan
    2: 0.70,  # Feb
    3: 0.75,  # Mar
    4: 0.85,  # Apr
    5: 0.95,  # May
    6: 1.40,  # Jun (monsoon start)
    7: 1.60,  # Jul (monsoon peak)
    8: 1.55,  # Aug
    9: 1.30,  # Sep
    10: 1.00,  # Oct
    11: 0.80,  # Nov
    12: 0.72,  # Dec
}

# Zone multipliers for pure premium
ZONE_MULTIPLIERS = {
    ZoneRisk.GREEN: 1.0,
    ZoneRisk.AMBER: 1.35,
    ZoneRisk.RED: 1.75,
    ZoneRisk.CRIMSON: 2.20,
}

# Vehicle type multipliers
VEHICLE_MULTIPLIERS = {
    VehicleType.BIKE: 1.20,
    VehicleType.BICYCLE: 1.35,
    VehicleType.EV_BIKE: 1.15,
    VehicleType.SCOOTER: 1.20,
    VehicleType.CAR: 0.85,
}

# Platform multipliers
PLATFORM_MULTIPLIERS = {
    DeliveryPlatform.ZEPTO: 1.10,
    DeliveryPlatform.BLINKIT: 1.10,
    DeliveryPlatform.DUNZO: 1.05,
    DeliveryPlatform.AMAZON: 0.95,
    DeliveryPlatform.FLIPKART: 0.95,
}

# Expected severity distribution
EXPECTED_SEVERITY = 0.70  # 60% partial (0.5) + 40% full (1.0)

# Premium calculation constants
PROFIT_MARGIN = 0.25  # 25%
LOADING_FACTOR = 0.08  # 8%
MIN_PREMIUM = 15.0
MAX_PREMIUM = 120.0

# Payout calculation constants
MIN_PAYOUT = 50.0
MAX_PAYOUT = 1500.0

# ====================== TRIGGER THRESHOLDS ======================

TRIGGER_THRESHOLDS = {
    TriggerType.HEAVY_RAIN: {
        "parameter": "rainfall_mm_per_hour",
        "partial": {"min": 50, "max": 75},
        "full": {"min": 75},
    },
    TriggerType.EXTREME_HEAT: {
        "parameter": "temperature_celsius",
        "partial": {"min": 42, "max": 45},
        "full": {"min": 45},
    },
    TriggerType.SEVERE_AQI: {
        "parameter": "aqi",
        "partial": {"min": 400, "max": 450},
        "full": {"min": 450},
    },
    TriggerType.FLOOD_ALERT: {
        "parameter": "flood_level",
        "partial": {"level": 1},
        "full": {"level": "2+"},
    },
    TriggerType.CYCLONE_WARNING: {
        "parameter": "cyclone_category",
        "partial": {"level": 1},
        "full": {"level": "2+"},
    },
    TriggerType.CIVIL_DISRUPTION: {
        "parameter": "disruption_score",
        "partial": {"min": 7, "max": 8},
        "full": {"min": 8},
    },
}

# Severity multipliers for payouts
SEVERITY_MULTIPLIERS = {
    TriggerSeverity.PARTIAL: 0.50,
    TriggerSeverity.FULL: 1.00,
}

# ====================== FRAUD DETECTION ======================

# Fraud score thresholds
FRAUD_SCORE_APPROVED = 40
FRAUD_SCORE_FLAGGED = 70

# Fraud layer weights and scores
FRAUD_LAYER_SCORES = {
    "policy_too_new": 50,
    "gps_zone_mismatch": 35,
    "claim_frequency_exceeded": 40,
    "prior_fraud_flags": {"per_flag": 15, "max": 45},
    "claim_velocity_4plus": 20,
    "claim_velocity_2to3": 5,
    "high_risk_profile": 15,
    "new_account": 10,
}

# Maximum claims per week before flagging
MAX_CLAIMS_PER_WEEK = 5

# GPS distance threshold (km)
GPS_DISTANCE_THRESHOLD = 15.0

# GPS data freshness threshold (hours)
GPS_FRESHNESS_HOURS = 4

# Policy age minimum (hours)
POLICY_AGE_MINIMUM_HOURS = 1

# ====================== POLICY RULES ======================

# Policy cooling period (hours)
POLICY_COOLING_PERIOD_HOURS = 2

# Policy duration (days)
POLICY_DURATION_DAYS = 7

# Income bounds (₹)
MIN_DAILY_INCOME = 100.0
MAX_DAILY_INCOME = 5000.0

# ====================== SCHEDULER ======================

# Monitored cities for trigger detection
MONITORED_CITIES = [
    "mumbai",
    "delhi",
    "bangalore",
    "hyderabad",
    "pune",
    "chennai",
    "kolkata",
    "ahmedabad",
    "jaipur",
    "lucknow",
    "noida",
    "gurugram",
    "nagpur",
    "kochi",
    "guwahati",
]

# Loss ratio alert threshold
LOSS_RATIO_ALERT_THRESHOLD = 0.85

# ====================== GATEWAY & PAYMENT ======================

# UPI gateway success rate (0-1 probability)
RAZORPAY_SUCCESS_RATE = 0.97

# Payout retry timeout (seconds)
PAYOUT_RETRY_TIMEOUT = 1800  # 30 minutes

# ====================== JWT ======================

ALGORITHM = "HS256"
DEFAULT_ACCESS_TOKEN_EXPIRE_HOURS = 24

# ====================== HELPERS ======================


def normalize_city(city: str) -> str:
    """Normalize city name for consistent mapping"""
    city_lower = city.lower().strip()
    return CITY_ALIASES.get(city_lower, city_lower)


def get_zone_risk(city: str) -> ZoneRisk:
    """Get zone risk for a given city"""
    normalized = normalize_city(city)
    return CITY_ZONE_MAP.get(normalized, ZoneRisk.AMBER)  # Default to AMBER
