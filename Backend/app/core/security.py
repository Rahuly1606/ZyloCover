"""
JWT & Security Utilities
========================
"""

from datetime import datetime, timedelta, timezone
from typing import Optional, Dict, Any
from jose import JWTError, jwt
import bcrypt
import secrets
import string
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer

from app.core.config import get_settings

settings = get_settings()

# HTTP Bearer for JWT
security = HTTPBearer()


def hash_password(password: str) -> str:
    """Hash a password using bcrypt"""
    salt = bcrypt.gensalt(rounds=12)
    hashed = bcrypt.hashpw(password.encode("utf-8"), salt)
    return hashed.decode("utf-8")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a password against its hash"""
    return bcrypt.checkpw(plain_password.encode("utf-8"), hashed_password.encode("utf-8"))


def generate_admin_credential() -> str:
    """
    Generate a secure admin credential key
    Format: ADMIN-XXXXXXXXXX (24 character alphanumeric)
    """
    chars = string.ascii_uppercase + string.digits
    random_part = ''.join(secrets.choice(chars) for _ in range(20))
    return f"ADMIN-{random_part}"


def hash_admin_credential(credential: str) -> str:
    """Hash admin credential using bcrypt"""
    salt = bcrypt.gensalt(rounds=12)
    hashed = bcrypt.hashpw(credential.encode("utf-8"), salt)
    return hashed.decode("utf-8")


def verify_admin_credential(plain_credential: str, hashed_credential: str) -> bool:
    """Verify admin credential against its hash"""
    return bcrypt.checkpw(plain_credential.encode("utf-8"), hashed_credential.encode("utf-8"))


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """Create a JWT access token"""
    to_encode = data.copy()
    
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(
            minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES
        )
    
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(
        to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM
    )
    return encoded_jwt


def verify_token(token: str) -> Optional[Dict[str, Any]]:
    """Verify and decode a JWT token"""
    try:
        payload = jwt.decode(
            token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM]
        )
        return payload
    except JWTError:
        return None


async def get_current_user(credentials = Depends(security)):
    """Dependency to get current authenticated user"""
    token = credentials.credentials
    payload = verify_token(token)
    
    if payload is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    user_id: int = payload.get("user_id")
    if user_id is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    return user_id
