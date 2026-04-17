"""
User Model
==========
Represents insurance buyers (gig workers)
"""

from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, Enum as SQLEnum
from sqlalchemy.sql import func
from datetime import datetime
import enum

from app.db.session import Base


class DeliveryPlatform(str, enum.Enum):
    """Supported delivery platforms"""
    ZOMATO = "zomato"
    SWIGGY = "swiggy"
    BLINKIT = "blinkit"
    ZEPTO = "zepto"
    AMAZON = "amazon"
    FLIPKART = "flipkart"
    OTHER = "other"


class WorkZone(str, enum.Enum):
    """Hyderabad work zones with risk profiles"""
    ZONE_A_FLOOD = "zone_a_flood_prone"
    ZONE_B_TRAFFIC = "zone_b_high_traffic"
    ZONE_C_INDUSTRIAL = "zone_c_industrial"
    ZONE_D_RESIDENTIAL = "zone_d_residential"
    ZONE_E_OUTER = "zone_e_outer_ring"


class User(Base):
    """Worker profile"""
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(100), nullable=False)
    email = Column(String(150), nullable=False, unique=True, index=True)
    hashed_password = Column(String(255), nullable=False)
    phone = Column(String(15), nullable=True)
    
    # Platform & Work Details
    platform = Column(SQLEnum(DeliveryPlatform), nullable=False)
    work_zone = Column(SQLEnum(WorkZone), nullable=False)
    city = Column(String(100), nullable=False, server_default="Hyderabad")
    
    # Employee & Job Verification
    employee_id = Column(String(50), nullable=False, unique=True, index=True)
    job_proof_image = Column(String(500), nullable=True)  # URL to uploaded proof image
    job_verification_status = Column(String(20), default="pending")  # pending/approved/rejected
    job_verified_at = Column(DateTime(timezone=True), nullable=True)
    
    # Income Profile
    avg_daily_income = Column(Float, nullable=False)  # ₹
    avg_daily_hours = Column(Float, nullable=False)
    experience_months = Column(Integer, nullable=False, server_default="0")
    
    # Location - Base/Current Location
    base_latitude = Column(Float, nullable=True)
    base_longitude = Column(Float, nullable=True)
    base_address = Column(String(255), nullable=True)
    last_gps_update = Column(DateTime(timezone=True), nullable=True)
    
    # Location - Registered Location (at signup)
    registered_latitude = Column(Float, nullable=True)  # Initial signup location
    registered_longitude = Column(Float, nullable=True)  # Initial signup location
    registered_address = Column(String(255), nullable=True)  # Initial signup location
    registered_at = Column(DateTime(timezone=True), nullable=True)  # When location was registered
    
    # Risk & Fraud Scoring
    all_time_claim_count = Column(Integer, default=0)
    fraud_flag_count = Column(Integer, default=0)  # Increments on rejected claims
    is_blacklisted = Column(Boolean, default=False)  # After 3+ fraud flags
    user_risk_score = Column(Float, default=0.0)  # 0-100, updated by fraud engine
    
    # Admin Credentials
    is_admin = Column(Boolean, nullable=False, server_default="0")
    admin_credential = Column(String(255), nullable=True)  # Unique admin credential/secret key
    
    # Flags
    is_active = Column(Boolean, nullable=False, server_default="1")
    is_fraud_flagged = Column(Boolean, nullable=False, server_default="0")
    fraud_flag_reason = Column(String(500), nullable=True)
    
    # Tracking
    created_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    def __repr__(self):
        return f"<User {self.email}>"
