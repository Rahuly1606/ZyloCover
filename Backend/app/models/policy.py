"""
Policy Model
============
Insurance contracts for workers
"""

from sqlalchemy import Column, Integer, String, Float, ForeignKey, DateTime, Enum as SQLEnum, JSON
from sqlalchemy.sql import func
from datetime import datetime
import enum

from app.db.session import Base


class PolicyStatus(str, enum.Enum):
    """Policy lifecycle states"""
    ACTIVE = "active"
    EXPIRED = "expired"
    CANCELLED = "cancelled"
    SUSPENDED = "suspended"


class Policy(Base):
    """Weekly insurance policy"""
    __tablename__ = "policies"

    id = Column(Integer, primary_key=True, autoincrement=True)
    policy_number = Column(String(20), nullable=False, unique=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    
    # Premium & Coverage
    weekly_premium = Column(Float, nullable=False)
    coverage_tier = Column(String(50), nullable=False, server_default="standard")  # basic/standard/premium
    income_replacement_ratio = Column(Float, nullable=False)  # 0.60/0.75/0.90
    daily_income_insured = Column(Float, nullable=False)
    max_weekly_payout = Column(Float, nullable=False)
    coverage_hours_per_day = Column(Float, nullable=False)
    
    # Coverage Period
    start_date = Column(DateTime(timezone=True), nullable=False)
    end_date = Column(DateTime(timezone=True), nullable=False)
    status = Column(SQLEnum(PolicyStatus), nullable=False, server_default="active")
    
    # Audit Trail - Full pricing breakdown for transparency
    pricing_breakdown = Column(JSON, nullable=True)  # Full calculation details
    risk_snapshot = Column(JSON, nullable=True)  # Environmental conditions at issue
    
    # Weekly Tracking
    total_claimed_this_week = Column(Float, default=0.0)
    claim_count_this_week = Column(Integer, default=0)
    cooling_period_ends_at = Column(DateTime(timezone=True), nullable=True)  # 2-hour cooling before renewal
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    def __repr__(self):
        return f"<Policy {self.policy_number}>"
