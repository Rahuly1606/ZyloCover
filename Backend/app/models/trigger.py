"""
Trigger Event Model
===================
Parametric insurance trigger events
"""

from sqlalchemy import Column, Integer, String, Float, DateTime, Enum as SQLEnum, JSON
from sqlalchemy.sql import func
from datetime import datetime
import enum

from app.db.session import Base


class TriggerType(str, enum.Enum):
    """Parametric trigger types"""
    HEAVY_RAIN = "heavy_rain"
    EXTREME_HEAT = "extreme_heat"
    HIGH_AQI = "high_aqi"
    STRONG_WINDS = "strong_winds"
    CURFEW = "curfew"
    PLATFORM_OUTAGE = "platform_outage"
    FLASH_FLOOD = "flash_flood"


class TriggerStatus(str, enum.Enum):
    """Trigger lifecycle"""
    ACTIVE = "active"
    RESOLVED = "resolved"
    INVALIDATED = "invalidated"


class TriggerEvent(Base):
    """External event that triggers claims"""
    __tablename__ = "trigger_events"

    id = Column(Integer, primary_key=True, autoincrement=True)
    trigger_type = Column(SQLEnum(TriggerType), nullable=False)
    status = Column(SQLEnum(TriggerStatus), nullable=False, server_default="active")
    
    # Geographic & Severity
    affected_zone = Column(String(50), nullable=False)
    affected_city = Column(String(100), nullable=False, server_default="Hyderabad")
    measured_value = Column(Float, nullable=False)
    threshold_value = Column(Float, nullable=False)
    severity_pct = Column(Float, nullable=False)  # % above threshold
    
    # Payout
    payout_multiplier = Column(Float, nullable=False, server_default="1.0")
    
    # Data Source
    data_source = Column(String(100), nullable=True)
    raw_api_response = Column(JSON, nullable=True)
    
    # Timeline
    triggered_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now())
    resolved_at = Column(DateTime(timezone=True), nullable=True)

    def __repr__(self):
        return f"<TriggerEvent {self.trigger_type} in {self.affected_zone}>"
