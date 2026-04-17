"""Trigger event routes with AI anomaly detection"""
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from pydantic import BaseModel
from datetime import datetime
from typing import Optional
import logging

from app.db.session import get_db
from app.models.trigger import TriggerEvent, TriggerType, TriggerStatus
from app.core.security import get_current_user
from app.services.ai_client import get_ai_client

logger = logging.getLogger(__name__)
ai_client = get_ai_client()

router = APIRouter(prefix="/trigger", tags=["trigger"])


class TriggerResponse(BaseModel):
    id: int
    trigger_type: str
    affected_zone: str
    measured_value: float
    threshold_value: float
    severity_pct: float
    payout_multiplier: float
    status: str
    triggered_at: datetime
    anomaly_score: Optional[float] = None  # AI anomaly detection score (0.0-1.0)
    anomaly_label: Optional[str] = None  # "normal" or "anomaly"
    ai_confidence: Optional[float] = None  # Model confidence (0.0-1.0)
    
    class Config:
        from_attributes = True


@router.get("/active", response_model=list[TriggerResponse])
async def get_active(user_id: int = Depends(get_current_user), db: Session = Depends(get_db)):
    """Get active trigger events affecting user's zone with AI anomaly detection"""
    from app.models.user import User
    
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        return []
    
    # Get triggers for user's work zone
    triggers = db.query(TriggerEvent).filter(
        TriggerEvent.affected_zone == user.work_zone,
        TriggerEvent.status == TriggerStatus.ACTIVE
    ).order_by(TriggerEvent.triggered_at.desc()).all()
    
    # Enrich each trigger with AI anomaly scores
    results = []
    for trigger in triggers:
        trigger_response = TriggerResponse.from_orm(trigger)
        
        # Try to get AI anomaly score
        try:
            anomaly_result = await ai_client.detect_weather_anomaly(
                rainfall_mm=trigger.measured_value if trigger.trigger_type == "RAINFALL" else 0.0,
                temperature_c=trigger.measured_value if trigger.trigger_type == "TEMPERATURE" else 0.0,
                humidity_pct=trigger.measured_value if trigger.trigger_type == "HUMIDITY" else 0.0,
                wind_speed_kmph=trigger.measured_value if trigger.trigger_type == "WIND" else 0.0,
                zone=user.work_zone,
                city=user.city,
                hour_of_day=trigger.triggered_at.hour,
                day_of_week=trigger.triggered_at.weekday()
            )
            trigger_response.anomaly_score = anomaly_result.get("anomaly_score", 0.5)
            trigger_response.anomaly_label = anomaly_result.get("anomaly_label", "normal")
            trigger_response.ai_confidence = anomaly_result.get("confidence", 0.0)
        except Exception as e:
            logger.warning(f"AI anomaly detection failed for trigger {trigger.id}: {e}")
            # Leave AI fields as None - not critical for functionality
        
        results.append(trigger_response)
    
    return results
