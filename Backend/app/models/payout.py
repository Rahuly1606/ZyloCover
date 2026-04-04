"""
Payout & Fraud Event Models
============================
Payouts and fraud tracking
"""

from sqlalchemy import Column, Integer, String, Float, ForeignKey, DateTime, Enum as SQLEnum, JSON
from sqlalchemy.sql import func
from datetime import datetime
import enum

from app.db.session import Base


class PayoutStatus(str, enum.Enum):
    """Payout states"""
    CREATED = "created"
    INITIATED = "initiated"
    SUCCESS = "success"
    FAILED = "failed"
    DISPUTED = "disputed"


class Payout(Base):
    """Claim payout record"""
    __tablename__ = "payouts"

    id = Column(Integer, primary_key=True, autoincrement=True)
    payout_reference = Column(String(30), nullable=False, unique=True, index=True)
    
    # References
    claim_id = Column(Integer, ForeignKey("claims.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    
    # Amount
    amount_inr = Column(Float, nullable=False)
    status = Column(SQLEnum(PayoutStatus), nullable=False, server_default="created")
    
    # Payment Details
    payment_method = Column(String(50), nullable=True)
    upi_id = Column(String(100), nullable=True)
    transaction_id = Column(String(100), nullable=True)
    
    # Response
    razorpay_response = Column(JSON, nullable=True)
    
    # Timeline
    created_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now())
    sent_at = Column(DateTime(timezone=True), nullable=True)
    completed_at = Column(DateTime(timezone=True), nullable=True)

    def __repr__(self):
        return f"<Payout {self.payout_reference}>"


class FraudEvent(Base):
    """Fraud flag logging"""
    __tablename__ = "fraud_events"

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    claim_id = Column(Integer, ForeignKey("claims.id"), nullable=True)
    
    # Flag Details
    flag_type = Column(String(100), nullable=False)
    severity = Column(String(20), nullable=False)  # low, medium, high
    description = Column(String(500), nullable=True)
    
    # Evidence
    evidence = Column(JSON, nullable=True)
    
    # Resolution
    resolved = Column(String(20), nullable=False, server_default="pending")  # pending, false_positive, confirmed
    
    # Timeline
    created_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now())

    def __repr__(self):
        return f"<FraudEvent {self.flag_type} for user {self.user_id}>"
