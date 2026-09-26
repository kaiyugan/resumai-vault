import uuid
from typing import Dict, Any, Optional
from pydantic import BaseModel, EmailStr
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.domain import Profile
from app.api.deps import create_access_token, get_current_user

router = APIRouter()


class RegisterRequest(BaseModel):
    email: EmailStr
    full_name: str
    password: Optional[str] = None


class LoginRequest(BaseModel):
    email: EmailStr
    password: Optional[str] = None


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: Dict[str, Any]


@router.post("/register", response_model=TokenResponse)
def register_candidate_account(
    req: RegisterRequest,
    db: Session = Depends(get_db)
):
    """Registers a new candidate user account and returns signed JWT access token."""
    existing = db.query(Profile).filter(Profile.email == req.email).first()
    if existing:
        token = create_access_token(existing.id, existing.email)
        return TokenResponse(
            access_token=token,
            user={
                "id": existing.id,
                "email": existing.email,
                "full_name": existing.full_name
            }
        )

    user_id = f"usr_{uuid.uuid4().hex[:12]}"
    new_profile = Profile(
        id=user_id,
        email=req.email,
        full_name=req.full_name
    )
    db.add(new_profile)
    db.commit()
    db.refresh(new_profile)

    token = create_access_token(new_profile.id, new_profile.email)
    return TokenResponse(
        access_token=token,
        user={
            "id": new_profile.id,
            "email": new_profile.email,
            "full_name": new_profile.full_name
        }
    )


@router.post("/login", response_model=TokenResponse)
def login_candidate_account(
    req: LoginRequest,
    db: Session = Depends(get_db)
):
    """Logs in an existing candidate user account and returns signed JWT access token."""
    profile = db.query(Profile).filter(Profile.email == req.email).first()
    if not profile:
        # Auto-provision on first sign-in for seamless candidate onboarding
        user_id = f"usr_{uuid.uuid4().hex[:12]}"
        name = req.email.split("@")[0].capitalize()
        profile = Profile(id=user_id, email=req.email, full_name=name)
        db.add(profile)
        db.commit()
        db.refresh(profile)

    token = create_access_token(profile.id, profile.email)
    return TokenResponse(
        access_token=token,
        user={
            "id": profile.id,
            "email": profile.email,
            "full_name": profile.full_name
        }
    )


@router.get("/me")
def get_current_candidate_profile(
    current_user: Profile = Depends(get_current_user)
):
    """Returns profile info for currently authenticated candidate user."""
    return {
        "id": current_user.id,
        "email": current_user.email,
        "full_name": current_user.full_name,
        "location": current_user.location,
        "linkedin_url": current_user.linkedin_url
    }
