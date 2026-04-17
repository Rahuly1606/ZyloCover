"""
Claim Model
===========
Automated insurance claims
"""

from sqlalchemy import Column, Integer, String, Float, ForeignKey, DateTime, Enum as SQLEnum, JSON
from sqlalchemy.sql import func
from datetime import datetime
import enum

from app.db.session import Base


class ClaimStatus(str, enum.Enum):
    """Claim processing states"""
    CREATED = "created"
    ELIGIBLE = "eligible"
    FRAUD_REVIEW = "fraud_review"
    APPROVED = "approved"
    REJECTED = "rejected"
    PAID = "paid"


class Claim(Base):
    """Automated claim record"""
    __tablename__ = "claims"

    id = Column(Integer, primary_key=True, autoincrement=True)
    claim_number = Column(String(30), nullable=False, unique=True, index=True)
    
    # References
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    policy_id = Column(Integer, ForeignKey("policies.id"), nullable=False)
    trigger_event_id = Column(Integer, ForeignKey("trigger_events.id"), nullable=False)
    
    # Claim Details
    hours_lost = Column(Float, nullable=False)
    expected_hourly_income = Column(Float, nullable=False)
    gross_payout_inr = Column(Float, nullable=False)
    payout_multiplier = Column(Float, nullable=False, server_default="1.0")
    net_payout_inr = Column(Float, nullable=False)
    
    # Trigger Severity
    severity_band = Column(String(50), nullable=False, server_default="partial")  # partial/full
    severity_multiplier = Column(Float, nullable=False, server_default="0.5")  # 0.5 or 1.0
    trigger_measured_value = Column(Float, nullable=True)  # mm/h, °C, AQI, etc.
    trigger_type = Column(String(50), nullable=True)  # heavy_rain, extreme_heat, etc.
    
    # Location Data (for location-based fraud detection)
    claim_latitude = Column(Float, nullable=True)  # User's location at claim submission
    claim_longitude = Column(Float, nullable=True)  # User's location at claim submission
    location_distance_km = Column(Float, nullable=True)  # Distance from stored location
    location_mismatch_flag = Column(String(50), nullable=True)  # 'nearby' (0-3km), 'moderate' (3-15km), 'far' (15km+), or None
    
    # Fraud Analysis
    status = Column(SQLEnum(ClaimStatus), nullable=False, server_default="created")
    fraud_score = Column(Float, nullable=False, default=0.0)  # 0.0 to 1.0
    fraud_flags = Column(JSON, nullable=True)  # List of triggered flags
    
    # Audit Trail
    evidence = Column(JSON, nullable=True)
    
    # Timeline
    created_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    def __repr__(self):
        return f"<Claim {self.claim_number}>"
