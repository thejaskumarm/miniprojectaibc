"""
TrustTrace AI - Authentication Router
Endpoints:
- POST /api/auth/token
- GET /api/auth/me
"""

from typing import Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, EmailStr
from sqlalchemy.orm import Session

from backend.core.database import get_db
from backend.models.db_models import UserProfile
from backend.core.auth import verify_password, create_access_token, get_current_user

router = APIRouter(prefix="/api/auth", tags=["Authentication"])

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    role: str
    full_name: str
    email: str

@router.post("/token", response_model=TokenResponse)
def login_for_access_token(
    payload: LoginRequest,
    db: Session = Depends(get_db)
):
    user = db.query(UserProfile).filter(UserProfile.email == payload.email).first()
    if not user or not verify_password(payload.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    access_token = create_access_token(
        data={
            "sub": user.email,
            "role": user.role,
            "full_name": user.full_name,
            "organization_id": user.organization_id
        }
    )

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "role": user.role,
        "full_name": user.full_name,
        "email": user.email
    }

@router.get("/me")
def read_current_user(current_user: Dict[str, Any] = Depends(get_current_user)):
    return current_user
