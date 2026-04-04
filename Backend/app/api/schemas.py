"""
Comprehensive Pydantic Schemas
===============================
Request/response models for all insurance system endpoints.
"""

from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from enum import Enum
from datetime import datetime


# ─── ENUMS ──────────────────────────────────────────────────────────────────

class CoverageLevel(str, Enum):
    BASIC = "basic"
    STANDARD = "standard"
    PREMIUM = "premium"


class SeverityBand(str, Enum):
    PARTIAL = "partial"
    FULL = "full"


# ─── PREMIUM CALCULATION ────────────────────────────────────────────────────

class PremiumCalculationRequest(BaseModel):
    """Request for premium calculation preview"""
    daily_income: float = Field(..., gt=0, description="Daily income in ₹")
    city: str = Field(..., description="City of operation")
    zone: str = Field(..., description="Work zone")
    platform: str = Field(..., description="Delivery platform")
    coverage_tier: str = Field(..., description="Insurance coverage level (basic/standard/premium)")
    
    class Config:
        json_schema_extra = {
            "example": {
                "daily_income": 700,
                "city": "mumbai",
                "zone": "zone_a_flood_prone",
                "platform": "swiggy",
                "coverage_tier": "standard"
            }
        }


class PurePremiumBreakdown(BaseModel):
    """Pure premium calculation details"""
    trigger_probability: float
    expected_severity: float
    expected_daily_loss: float
    expected_weekly_loss: float
    zone_multiplier: float
    platform_multiplier: float
    pure_premium: float


class GrossPremiumBreakdown(BaseModel):
    """Gross premium with regulatory loading"""
    pure_premium: float
    loading_amount: float
    gross_premium: float
    expense_ratio: float
    profit_loading: float


class ExperienceRatingBreakdown(BaseModel):
    """Experience rating based on claim history"""
    experience_rating: float
    rating_reason: str
    fraud_penalty: float
    experience_rated_premium: float


class PremiumCalculationResponse(BaseModel):
    """Full premium calculation response"""
    final_premium: float = Field(description="Final weekly premium in ₹")
    min_premium: float
    max_premium: float
    breakdown: Dict[str, Any] = Field(description="Complete calculation breakdown")


# ─── POLICY CREATION ────────────────────────────────────────────────────────

class PolicyCreationRequest(BaseModel):
    """Request to create a new insurance policy"""
    coverage_tier: CoverageLevel
    
    class Config:
        json_schema_extra = {
            "example": {
                "coverage_tier": "standard"
            }
        }


class PolicyResponse(BaseModel):
    """Policy details response"""
    id: int
    policy_number: str
    user_id: int
    coverage_tier: str
    weekly_premium: float
    income_replacement_ratio: float
    daily_income_insured: float
    max_weekly_payout: float
    start_date: datetime
    end_date: datetime
    status: str
    total_claimed_this_week: float
    claim_count_this_week: int
    created_at: datetime
    
    class Config:
        from_attributes = True


# ─── CLAIM PROCESSING ───────────────────────────────────────────────────────

class ClaimResponse(BaseModel):
    """Claim details with fraud scoring"""
    id: int
    claim_number: str
    user_id: int
    policy_id: int
    trigger_event_id: int
    status: str
    hours_lost: float
    gross_payout_inr: float
    net_payout_inr: float
    fraud_score: float
    fraud_flags: Optional[List[str]]
    severity_band: str
    severity_multiplier: float
    created_at: datetime
    
    class Config:
        from_attributes = True


class ClaimWithFraudAuditResponse(BaseModel):
    """Claim with detailed fraud audit trail"""
    id: int
    claim_number: str
    status: str
    fraud_score: float
    fraud_decision: str
    fraud_layers: List[Dict[str, Any]]
    gross_payout_inr: float
    net_payout_inr: float
    audit_trail: Dict[str, Any]


# ─── PAYOUT PROCESSING ──────────────────────────────────────────────────────

class PayoutResponse(BaseModel):
    """Payout record response"""
    id: int
    payout_reference: str
    claim_id: int
    user_id: int
    amount_inr: float
    status: str
    transaction_id: Optional[str]
    created_at: datetime
    completed_at: Optional[datetime]
    
    class Config:
        from_attributes = True


# ─── FRAUD DETECTION ────────────────────────────────────────────────────────

class FraudScoringLayer(BaseModel):
    """Single layer of fraud scoring"""
    layer: str
    score: float
    flag: Optional[str]
    impact: str


class FraudScoringResponse(BaseModel):
    """Complete fraud scoring result"""
    fraud_score: float
    fraud_score_pct: float
    decision: str  # approved, flagged, rejected
    recommendation: str
    layers: List[Dict[str, Any]]
    audit_trail: Dict[str, Any]


# ─── TRIGGER EVENTS ─────────────────────────────────────────────────────────

class TriggerEventResponse(BaseModel):
    """Trigger event details"""
    id: int
    trigger_type: str
    affected_zone: str
    affected_city: str
    measured_value: float
    threshold_value: float
    severity_pct: float
    payout_multiplier: float
    status: str
    triggered_at: datetime
    
    class Config:
        from_attributes = True


# ─── ADMIN DASHBOARD ─────────────────────────────────────────────────────────

class FinancialMetrics(BaseModel):
    """Financial KPIs for admin dashboard"""
    gross_written_premium_week: float = Field(description="Total premiums collected this week")
    total_claims_paid_week: float = Field(description="Total payouts this week")
    loss_ratio: float = Field(description="Claims paid / Premiums (target 72%)")
    loss_ratio_pct: float
    loss_status: str
    expense_ratio: float = Field(description="Operating expense ratio (25%)")
    combined_ratio: float = Field(description="Loss + Expense ratio (must be < 100%)")
    combined_ratio_pct: float


class OperationalMetrics(BaseModel):
    """Operational KPIs"""
    active_policies: int
    policies_expiring_today: int
    claims_triggered_today: int
    claims_auto_approved: int
    claims_flagged: int
    claims_rejected: int
    average_payout_amount: float
    average_trigger_to_payout_minutes: float


class AdminDashboardResponse(BaseModel):
    """Complete admin dashboard data"""
    financial_metrics: FinancialMetrics
    operational_metrics: OperationalMetrics
    loss_ratio_by_city: Dict[str, float]
    loss_ratio_by_trigger_type: Dict[str, float]
    fraud_rate_by_zone: Dict[str, float]
    top_risk_users: List[Dict[str, Any]]


# ─── USER PROFILE UPDATE ─────────────────────────────────────────────────────

class UserProfileResponse(BaseModel):
    """User profile with all details"""
    id: int
    name: str
    email: str
    phone: Optional[str]
    platform: str
    work_zone: str
    city: str
    avg_daily_income: float
    avg_daily_hours: float
    experience_months: int
    latitude: Optional[float]
    longitude: Optional[float]
    address: Optional[str]
    all_time_claim_count: int
    fraud_flag_count: int
    is_blacklisted: bool
    user_risk_score: float
    created_at: datetime
    
    class Config:
        from_attributes = True


# ─── REPORTS & ANALYSIS ─────────────────────────────────────────────────────

class ClaimHistoryResponse(BaseModel):
    """Claim history for user"""
    id: int
    claim_number: str
    trigger_type: str
    trigger_measured_value: float
    severity_band: str
    gross_payout_inr: float
    net_payout_inr: float
    fraud_score: float
    status: str
    created_at: datetime


class WeeklyReportResponse(BaseModel):
    """Weekly actuarial report"""
    week_start: datetime
    week_end: datetime
    policies_active: int
    claims_triggered: int
    claims_approved: int
    claims_rejected: int
    total_premiums: float
    total_payouts: float
    loss_ratio: float
    combined_ratio: float
    top_trigger_type: str
    top_affected_city: str
