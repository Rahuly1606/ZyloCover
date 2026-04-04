"""Authentication routes"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import timedelta
from pydantic import BaseModel
from typing import Optional

from app.db.session import get_db
from app.models.user import User
from app.core.security import hash_password, verify_password, create_access_token
from app.core.config import get_settings

router = APIRouter(prefix="/auth", tags=["auth"])
settings = get_settings()


class SignupRequest(BaseModel):
    email: str
    password: str
    name: str
    phone: str
    city: Optional[str] = "Hyderabad"
    zone_risk: Optional[str] = "zone_d_residential"
    delivery_platform: str
    avg_daily_income: float


class LoginRequest(BaseModel):
    email: str
    password: str


class UserResponse(BaseModel):
    id: int
    name: str
    email: str
    phone: str
    city: str
    zone_risk: Optional[str]
    avg_daily_income: float
    is_blacklisted: bool
    risk_score: float
    fraud_flags: int

    class Config:
        from_attributes = True


class AuthResponse(BaseModel):
    access_token: str
    token_type: str
    user: UserResponse


@router.post("/signup", response_model=AuthResponse)
async def signup(req: SignupRequest, db: Session = Depends(get_db)):
    """Register a new user"""
    # Check if user exists
    existing = db.query(User).filter(User.email == req.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Create user - map frontend fields to backend model
    user = User(
        email=req.email,
        hashed_password=hash_password(req.password),
        name=req.name,
        phone=req.phone,
        platform=req.delivery_platform,
        work_zone=req.zone_risk,
        city=req.city,
        avg_daily_income=req.avg_daily_income,
        avg_daily_hours=8.0,  # Default 8 hours
        is_active=True
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    
    # Create token
    token = create_access_token(
        data={"user_id": user.id},
        expires_delta=timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "name": user.name,
            "email": user.email,
            "phone": user.phone,
            "city": user.city,
            "zone_risk": user.work_zone,
            "avg_daily_income": user.avg_daily_income,
            "is_blacklisted": user.is_blacklisted,
            "risk_score": user.user_risk_score,
            "fraud_flags": user.fraud_flag_count
        }
    }


@router.post("/login", response_model=AuthResponse)
async def login(req: LoginRequest, db: Session = Depends(get_db)):
    """Login user"""
    user = db.query(User).filter(User.email == req.email).first()
    
    if not user or not verify_password(req.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    if not user.is_active:
        raise HTTPException(status_code=400, detail="User account disabled")
    
    token = create_access_token(
        data={"user_id": user.id},
        expires_delta=timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "name": user.name,
            "email": user.email,
            "phone": user.phone,
            "city": user.city,
            "zone_risk": user.work_zone,
            "avg_daily_income": user.avg_daily_income,
            "is_blacklisted": user.is_blacklisted,
            "risk_score": user.user_risk_score,
            "fraud_flags": user.fraud_flag_count
        }
    }


class AdminTokenResponse(BaseModel):
    admin_token: str


@router.post("/admin-login", response_model=AdminTokenResponse)
async def admin_login(req: LoginRequest, db: Session = Depends(get_db)):
    """Login as admin"""
    user = db.query(User).filter(User.email == req.email).first()
    
    if not user or not verify_password(req.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid admin credentials")
    
    if not user.is_admin:
        raise HTTPException(status_code=403, detail="Admin access required")
    
    if not user.is_active:
        raise HTTPException(status_code=400, detail="Admin account disabled")
    
    # Create admin token with special claims
    token = create_access_token(
        data={"user_id": user.id, "is_admin": True},
        expires_delta=timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    
    return {
        "admin_token": token
    }
