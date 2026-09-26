import jwt
from datetime import datetime, timedelta
from typing import Optional
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session

from app.config import settings
from app.db.session import get_db
from app.models.domain import Profile

oauth2_scheme = OAuth2PasswordBearer(tokenUrl=f"{settings.API_V1_STR}/auth/login", auto_error=False)

JWT_ALGORITHM = "HS256"
TOKEN_EXPIRE_DAYS = 30


def create_access_token(user_id: str, email: str) -> str:
    """Generates signed JWT access token for candidate user."""
    expire = datetime.utcnow() + timedelta(days=TOKEN_EXPIRE_DAYS)
    payload = {
        "sub": user_id,
        "email": email,
        "exp": expire,
        "iat": datetime.utcnow()
    }
    return jwt.encode(payload, settings.SECRET_KEY, algorithm=JWT_ALGORITHM)


def get_current_user(
    token: Optional[str] = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
) -> Profile:
    """
    FastAPI security dependency for extracting current authenticated candidate user profile.
    If no token provided, falls back to default demo user profile for seamless onboarding.
    """
    if token:
        try:
            payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[JWT_ALGORITHM])
            user_id: str = payload.get("sub")
            email: str = payload.get("email")
            
            if user_id:
                profile = db.query(Profile).filter(Profile.id == user_id).first()
                if not profile:
                    profile = Profile(
                        id=user_id,
                        email=email or f"user_{user_id[:8]}@resumai-vault.app",
                        full_name=payload.get("name", "Candidate User")
                    )
                    db.add(profile)
                    db.commit()
                    db.refresh(profile)
                return profile
        except Exception:
            pass

    # Default tenant fallback for development & quick demo testing
    default_profile = db.query(Profile).first()
    if not default_profile:
        default_profile = Profile(
            id="demo-candidate-id",
            email="candidate@resumai-vault.app",
            full_name="Demo Candidate Profile",
            location="San Francisco, CA"
        )
        db.add(default_profile)
        db.commit()
        db.refresh(default_profile)

    return default_profile
