from fastapi import APIRouter, HTTPException, Depends
from typing import List, Dict, Any, Optional
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.domain import Profile, TargetJob, MasterAchievement
from app.services.cover_letter_service import CoverLetterService

router = APIRouter()


class CoverLetterRequest(BaseModel):
    job_id: Optional[str] = None
    tone: Optional[str] = "Technical Architect"
    custom_achievements: Optional[List[str]] = None


@router.post("/generate", response_model=Dict[str, Any])
def generate_cover_letter(req: CoverLetterRequest, db: Session = Depends(get_db)):
    profile = db.query(Profile).first()
    prof_name = profile.full_name if (profile and profile.full_name) else ""
    prof_title = "Senior Staff Software Engineer"

    job = None
    if req.job_id:
        job = db.query(TargetJob).filter(TargetJob.id == req.job_id).first()
    if not job:
        job = db.query(TargetJob).order_by(TargetJob.created_at.desc()).first()

    company_name = job.company if job and job.company else "Target Company"
    job_title = job.title if job and job.title else "Staff AI Engineer"

    if req.custom_achievements:
        achievements = req.custom_achievements
    else:
        db_achs = db.query(MasterAchievement).all()
        achievements = [a.raw_bullet for a in db_achs] if db_achs else [
            "Architected distributed cloud systems reducing execution latency by 45%.",
            "Led cross-functional engineering team delivering enterprise platform scale."
        ]

    result = CoverLetterService.generate_cover_letter(
        profile_name=prof_name,
        profile_title=prof_title,
        company_name=company_name,
        job_title=job_title,
        top_achievements=achievements,
        tone=req.tone or "Technical Architect"
    )

    return result
