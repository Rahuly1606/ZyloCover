"""Authentication routes"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import timedelta, datetime
from pydantic import BaseModel
from typing import Optional
import base64
import io

import cloudinary
import cloudinary.uploader

from app.db.session import get_db
from app.models.user import User
from app.core.security import (
    hash_password, 
    verify_password, 
    create_access_token,
    generate_admin_credential,
    hash_admin_credential,
    verify_admin_credential
)
from app.core.config import get_settings

router = APIRouter(prefix="/auth", tags=["auth"])
settings = get_settings()

# Configure Cloudinary
cloudinary.config(
    cloud_name=settings.CLOUDINARY_CLOUD_NAME,
    api_key=settings.CLOUDINARY_API_KEY,
    api_secret=settings.CLOUDINARY_API_SECRET
)


def upload_job_proof_to_cloudinary(image_data: str, employee_id: str) -> str:
    """
    Upload base64 encoded job proof image to Cloudinary
    Returns the Cloudinary image URL
    """
    try:
        # Remove data URI scheme if present
        if image_data.startswith('data:image'):
            image_data = image_data.split(',')[1]
        
        # Decode base64 to bytes
        image_bytes = base64.b64decode(image_data)
        
        # Upload to Cloudinary
        result = cloudinary.uploader.upload(
            io.BytesIO(image_bytes),
            folder='zylocover/job_proofs',
            public_id=f'job_proof_{employee_id}_{int(datetime.now().timestamp())}',
            resource_type='auto',
            overwrite=False
        )
        
        # Return the Cloudinary URL
        return result['secure_url']
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to upload image to Cloudinary: {str(e)}")


class SignupRequest(BaseModel):
    email: str
    password: str
    name: str
    phone: str
    employee_id: str
    job_proof_image: Optional[str] = None  # Base64 encoded image
    city: Optional[str] = "Hyderabad"
    zone_risk: Optional[str] = "zone_d_residential"
    delivery_platform: str
    avg_daily_income: float
    avg_daily_hours: Optional[float] = 8.0
    experience_months: int = 0  # Months of delivery experience
    # Registration location
    registered_latitude: Optional[float] = None
    registered_longitude: Optional[float] = None
    registered_address: Optional[str] = None


class LoginRequest(BaseModel):
    email: str
    password: str


class UserResponse(BaseModel):
    id: int
    name: str
    email: str
    phone: str
    employee_id: Optional[str]
    job_verification_status: str
    city: Optional[str]
    zone_risk: Optional[str]
    avg_daily_income: float
    is_blacklisted: bool
    risk_score: float
    fraud_flags: int
    registered_latitude: Optional[float]
    registered_longitude: Optional[float]
    registered_address: Optional[str]

    class Config:
        from_attributes = True


class AuthResponse(BaseModel):
    access_token: str
    token_type: str
    user: UserResponse


@router.post("/signup", response_model=AuthResponse)
async def signup(req: SignupRequest, db: Session = Depends(get_db)):
    """Register a new user with job verification and location"""
    # Check if email exists
    existing_email = db.query(User).filter(User.email == req.email).first()
    if existing_email:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Check if employee_id exists
    existing_employee = db.query(User).filter(User.employee_id == req.employee_id).first()
    if existing_employee:
        raise HTTPException(status_code=400, detail="Employee ID already registered")
    
    # Upload job proof image to Cloudinary if provided
    job_proof_image = None
    if req.job_proof_image:
        job_proof_image = upload_job_proof_to_cloudinary(req.job_proof_image, req.employee_id)
    
    # Create user with all verification fields
    user = User(
        email=req.email,
        hashed_password=hash_password(req.password),
        name=req.name,
        phone=req.phone,
        employee_id=req.employee_id,
        job_proof_image=job_proof_image,
        job_verification_status="pending",
        platform=req.delivery_platform,
        work_zone=req.zone_risk,
        city=req.city,
        avg_daily_income=req.avg_daily_income,
        avg_daily_hours=req.avg_daily_hours,
        experience_months=req.experience_months,
        # Store registered location
        registered_latitude=req.registered_latitude,
        registered_longitude=req.registered_longitude,
        registered_address=req.registered_address,
        registered_at=datetime.utcnow() if req.registered_latitude else None,
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
            "employee_id": user.employee_id,
            "job_verification_status": user.job_verification_status,
            "city": user.city,
            "zone_risk": user.work_zone,
            "avg_daily_income": user.avg_daily_income,
            "is_blacklisted": user.is_blacklisted,
            "risk_score": user.user_risk_score,
            "fraud_flags": user.fraud_flag_count,
            "registered_latitude": user.registered_latitude,
            "registered_longitude": user.registered_longitude,
            "registered_address": user.registered_address,
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
            "employee_id": user.employee_id,
            "job_verification_status": user.job_verification_status,
            "city": user.city,
            "zone_risk": user.work_zone,
            "avg_daily_income": user.avg_daily_income,
            "is_blacklisted": user.is_blacklisted,
            "risk_score": user.user_risk_score,
            "fraud_flags": user.fraud_flag_count,
            "registered_latitude": user.registered_latitude,
            "registered_longitude": user.registered_longitude,
            "registered_address": user.registered_address,
        }
    }


class AdminTokenResponse(BaseModel):
    admin_token: str


class AdminCredentialRequest(BaseModel):
    email: str
    password: str
    credential: str


@router.post("/admin-login", response_model=AdminTokenResponse)
async def admin_login(req: LoginRequest, db: Session = Depends(get_db)):
    """Login as admin with email and password only"""
    user = db.query(User).filter(User.email == req.email).first()
    
    if not user or not verify_password(req.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    
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
