"""Trigger event routes"""
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from pydantic import BaseModel
from datetime import datetime
from typing import Optional

from app.db.session import get_db
from app.models.trigger import TriggerEvent, TriggerType, TriggerStatus
from app.core.security import get_current_user

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
    
    class Config:
        from_attributes = True


@router.get("/active", response_model=list[TriggerResponse])
async def get_active(user_id: int = Depends(get_current_user), db: Session = Depends(get_db)):
    """Get active trigger events affecting user's zone"""
    from app.models.user import User
    
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        return []
    
    # Get triggers for user's work zone
    triggers = db.query(TriggerEvent).filter(
        TriggerEvent.affected_zone == user.work_zone,
        TriggerEvent.status == TriggerStatus.ACTIVE
    ).order_by(TriggerEvent.triggered_at.desc()).all()
    
    return triggers
