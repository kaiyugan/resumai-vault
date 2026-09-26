from fastapi import APIRouter, HTTPException, UploadFile, File, Form, Depends, status
from typing import List, Optional
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.domain import Profile, MasterExperience, MasterAchievement
from app.schemas.vault import (
    ProfileResponse,
    MasterExperienceResponse,
    MasterAchievementResponse,
    MasterAchievementCreate,
    IngestionRequest,
    IngestionResponse
)
from app.services.ingestion_engine import IngestionEngine

router = APIRouter()


@router.get("/profile/{profile_id}", response_model=ProfileResponse)
def get_profile(profile_id: str, db: Session = Depends(get_db)):
    profile = db.query(Profile).filter(Profile.id == profile_id).first()
    if not profile:
        # Fallback profile creation for smooth client demo
        profile = Profile(
            id=profile_id,
            email="candidate@example.com",
            full_name="Senior Professional Candidate"
        )
        db.add(profile)
        db.commit()
        db.refresh(profile)
    return profile


@router.get("/experiences/{profile_id}", response_model=List[MasterExperienceResponse])
def get_experiences(profile_id: str, db: Session = Depends(get_db)):
    exps = db.query(MasterExperience).filter(MasterExperience.profile_id == profile_id).all()
    results = []
    for e in exps:
        achievements = db.query(MasterAchievement).filter(MasterAchievement.experience_id == e.id).all()
        results.append({
            "id": e.id,
            "profile_id": e.profile_id,
            "company": e.company,
            "role_title": e.role_title,
            "location": e.location or "Remote",
            "start_date": e.start_date,
            "end_date": e.end_date or "Present",
            "is_current": e.is_current,
            "raw_summary": e.raw_summary or "",
            "skills_used": e.skills_used or [],
            "created_at": e.created_at.isoformat() if e.created_at else "2026-02-01T10:00:00Z",
            "achievements": [
                {
                    "id": a.id,
                    "experience_id": a.experience_id,
                    "raw_bullet": a.raw_bullet,
                    "quantified_metric": a.quantified_metric or {},
                    "action_verb": a.action_verb or "Led",
                    "context": a.context or "Master Vault Record",
                    "vector_tags": a.vector_tags or ["Parsed"],
                    "created_at": a.created_at.isoformat() if a.created_at else "2026-02-01T10:00:00Z"
                }
                for a in achievements
            ]
        })
    return results


@router.post("/achievements", response_model=MasterAchievementResponse, status_code=status.HTTP_201_CREATED)
def create_achievement(ach: MasterAchievementCreate, db: Session = Depends(get_db)):
    new_ach = MasterAchievement(
        experience_id=ach.experience_id,
        raw_bullet=ach.raw_bullet,
        quantified_metric=ach.quantified_metric.model_dump() if ach.quantified_metric else {},
        action_verb=ach.action_verb or ach.raw_bullet.split(" ")[0],
        context=ach.context or "Master Vault record",
        vector_tags=ach.vector_tags or ["Manual Input"]
    )
    db.add(new_ach)
    db.commit()
    db.refresh(new_ach)

    return {
        "id": new_ach.id,
        "experience_id": new_ach.experience_id,
        "raw_bullet": new_ach.raw_bullet,
        "quantified_metric": new_ach.quantified_metric or {},
        "action_verb": new_ach.action_verb,
        "context": new_ach.context,
        "vector_tags": new_ach.vector_tags,
        "created_at": new_ach.created_at.isoformat() if new_ach.created_at else "2026-02-01T10:00:00Z"
    }


@router.post("/ingest/text", response_model=IngestionResponse)
def ingest_text(req: IngestionRequest, db: Session = Depends(get_db)):
    parsed = IngestionEngine.parse_entities_with_llm(req.raw_text)
    
    # Ensure profile exists
    prof = db.query(Profile).filter(Profile.id == req.profile_id).first()
    if not prof:
        prof = Profile(id=req.profile_id, email="candidate@example.com", full_name="Candidate")
        db.add(prof)
        db.commit()

    created_exps = 0
    created_achs = 0

    for exp in parsed.get("experiences", []):
        db_exp = MasterExperience(
            profile_id=req.profile_id,
            company=exp.get("company", "Target Company"),
            role_title=exp.get("role_title", "Target Role"),
            location=exp.get("location", "Remote"),
            start_date=exp.get("start_date", "2022-01-01"),
            end_date=exp.get("end_date", "Present"),
            is_current=exp.get("is_current", True),
            raw_summary=exp.get("raw_summary", ""),
            skills_used=exp.get("skills_used", [])
        )
        db.add(db_exp)
        db.commit()
        db.refresh(db_exp)
        created_exps += 1

        for ach in parsed.get("achievements", []):
            db_ach = MasterAchievement(
                experience_id=db_exp.id,
                raw_bullet=ach.get("raw_bullet", ""),
                quantified_metric=ach.get("quantified_metric", {}),
                action_verb=ach.get("action_verb", "Led"),
                context=ach.get("context", "Parsed Experience"),
                vector_tags=ach.get("vector_tags", [])
            )
            db.add(db_ach)
            created_achs += 1

    db.commit()

    return IngestionResponse(
        success=True,
        experiences_created=created_exps,
        achievements_created=created_achs,
        message="Raw career text parsed and persisted into Master Vault database.",
        parsed_data=parsed.get("parsed_data")
    )


@router.post("/ingest/file", response_model=IngestionResponse)
async def ingest_file(profile_id: str = Form(...), file: UploadFile = File(...), db: Session = Depends(get_db)):
    content = await file.read()
    filename = file.filename.lower()

    if filename.endswith(".pdf"):
        text = IngestionEngine.extract_text_from_pdf(content)
    elif filename.endswith(".docx"):
        text = IngestionEngine.extract_text_from_docx(content)
    else:
        text = content.decode("utf-8", errors="ignore")

    parsed = IngestionEngine.parse_entities_with_llm(text)
    
    prof = db.query(Profile).filter(Profile.id == profile_id).first()
    if not prof:
        prof = Profile(id=profile_id, email="candidate@example.com", full_name="Candidate")
        db.add(prof)
        db.commit()

    created_exps = 0
    created_achs = 0

    for exp in parsed.get("experiences", []):
        db_exp = MasterExperience(
            profile_id=profile_id,
            company=exp.get("company", "Target Company"),
            role_title=exp.get("role_title", "Target Role"),
            location=exp.get("location", "Remote"),
            start_date=exp.get("start_date", "2022-01-01"),
            end_date=exp.get("end_date", "Present"),
            is_current=exp.get("is_current", True),
            raw_summary=exp.get("raw_summary", ""),
            skills_used=exp.get("skills_used", [])
        )
        db.add(db_exp)
        db.commit()
        db.refresh(db_exp)
        created_exps += 1

        for ach in parsed.get("achievements", []):
            db_ach = MasterAchievement(
                experience_id=db_exp.id,
                raw_bullet=ach.get("raw_bullet", ""),
                quantified_metric=ach.get("quantified_metric", {}),
                action_verb=ach.get("action_verb", "Led"),
                context=ach.get("context", "Parsed File"),
                vector_tags=ach.get("vector_tags", [])
            )
            db.add(db_ach)
            created_achs += 1

    db.commit()

    return IngestionResponse(
        success=True,
        experiences_created=created_exps,
        achievements_created=created_achs,
        message=f"Uploaded file {file.filename} parsed and persisted into Master Vault database.",
        parsed_data=parsed.get("parsed_data")
    )
