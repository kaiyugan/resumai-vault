from datetime import datetime
from typing import List, Optional
from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.domain import TargetJob, Profile, MasterAchievement, MasterExperience
from app.schemas.job import (
    TargetJobCreate,
    TargetJobURLCreate,
    TargetJobResponse,
    GapAnalysisResponse,
    JobStateUpdate
)
from app.services.match_engine import MatchEngine
from app.services.job_scraper import JobScraperEngine

router = APIRouter()


def _serialize_job(j: TargetJob) -> dict:
    return {
        "id": j.id,
        "profile_id": j.profile_id,
        "title": j.title,
        "company": j.company or "Target Company",
        "location": j.location or "Remote",
        "raw_description": j.raw_description,
        "parsed_hard_skills": j.parsed_hard_skills or [],
        "parsed_soft_skills": j.parsed_soft_skills or [],
        "parsed_responsibilities": j.parsed_responsibilities or [],
        "parsed_metrics": j.parsed_metrics or [],
        "company_intelligence": j.company_intelligence or {},
        "current_step": j.current_step if j.current_step is not None else 2,
        "status": j.status or "DRAFT",
        "last_accessed_at": j.last_accessed_at or datetime.utcnow(),
        "tailored_resume_payload": j.tailored_resume_payload or {},
        "selected_theme": j.selected_theme or "classic",
        "ats_score": j.ats_score if j.ats_score is not None else 85,
        "created_at": j.created_at or datetime.utcnow()
    }


@router.get("/", response_model=List[TargetJobResponse])
def list_jobs(status_filter: Optional[str] = None, db: Session = Depends(get_db)):
    query = db.query(TargetJob)
    if status_filter and status_filter.upper() != "ALL":
        query = query.filter(TargetJob.status == status_filter.upper())
    
    jobs = query.order_by(TargetJob.last_accessed_at.desc()).all()
    return [_serialize_job(j) for j in jobs]


@router.post("/deconstruct", response_model=TargetJobResponse)
def deconstruct_job(job_in: TargetJobCreate, db: Session = Depends(get_db)):
    prof = db.query(Profile).filter(Profile.id == job_in.profile_id).first()
    if not prof:
        prof = Profile(id=job_in.profile_id, email="candidate@example.com", full_name="Candidate")
        db.add(prof)
        db.commit()

    parsed = MatchEngine.deconstruct_job_description(job_in.raw_description)
    
    company_intel = {
        "mission_statement": f"Empowering enterprise customers through high-throughput technology and modern products.",
        "core_values": ["Innovation & Speed", "Customer Success", "Technical Rigor"],
        "culture_insights": "Fast-paced environment emphasizing technical ownership and data-driven decisions.",
        "first_impression_hooks": [
            "Emphasize quantified performance impact and system scalability in your intro.",
            "Reference commitment to high-quality technical standards and test automation.",
            "Ask how the team approaches architectural evolution as product scale doubles."
        ]
    }

    db_job = TargetJob(
        profile_id=job_in.profile_id,
        title=job_in.title,
        company=job_in.company or "Target Company",
        location=job_in.location or "Remote",
        raw_description=job_in.raw_description,
        parsed_hard_skills=parsed["parsed_hard_skills"],
        parsed_soft_skills=parsed["parsed_soft_skills"],
        parsed_responsibilities=parsed["parsed_responsibilities"],
        parsed_metrics=parsed["parsed_metrics"],
        company_intelligence=company_intel,
        current_step=2,
        status="DRAFT",
        last_accessed_at=datetime.utcnow()
    )
    db.add(db_job)
    db.commit()
    db.refresh(db_job)

    return _serialize_job(db_job)


@router.post("/deconstruct-url", response_model=TargetJobResponse)
def deconstruct_job_url(req: TargetJobURLCreate, db: Session = Depends(get_db)):
    try:
        prof = db.query(Profile).filter(Profile.id == req.profile_id).first()
        if not prof:
            prof = Profile(id=req.profile_id, email="candidate@example.com", full_name="Candidate")
            db.add(prof)
            db.commit()

        scraped_data = JobScraperEngine.deconstruct_job_url(req.url)
        
        db_job = TargetJob(
            profile_id=req.profile_id,
            title=scraped_data["title"],
            company=scraped_data["company"],
            location=scraped_data["location"],
            raw_description=scraped_data["raw_description"],
            parsed_hard_skills=scraped_data["parsed_hard_skills"],
            parsed_soft_skills=scraped_data["parsed_soft_skills"],
            parsed_responsibilities=scraped_data["parsed_responsibilities"],
            parsed_metrics=scraped_data["parsed_metrics"],
            company_intelligence=scraped_data["company_intelligence"],
            current_step=2,
            status="DRAFT",
            last_accessed_at=datetime.utcnow()
        )
        db.add(db_job)
        db.commit()
        db.refresh(db_job)

        return _serialize_job(db_job)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to scrape & deconstruct job URL: {str(e)}")


@router.patch("/{job_id}/state", response_model=TargetJobResponse)
def update_job_state(job_id: str, state_in: JobStateUpdate, db: Session = Depends(get_db)):
    """
    Updates candidate application session progress (current_step, status, tailored_payload, theme).
    Enables debounced session auto-saving and pick-up where left off functionality.
    """
    job = db.query(TargetJob).filter(TargetJob.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Target job not found")

    if state_in.current_step is not None:
        job.current_step = state_in.current_step
    if state_in.status is not None:
        job.status = state_in.status.upper()
    if state_in.selected_theme is not None:
        job.selected_theme = state_in.selected_theme
    if state_in.ats_score is not None:
        job.ats_score = state_in.ats_score
    if state_in.tailored_resume_payload is not None:
        job.tailored_resume_payload = state_in.tailored_resume_payload

    job.last_accessed_at = datetime.utcnow()
    db.commit()
    db.refresh(job)

    return _serialize_job(job)


@router.get("/analyze-gaps/{job_id}", response_model=GapAnalysisResponse)
def analyze_gaps(job_id: str, db: Session = Depends(get_db)):
    job = db.query(TargetJob).filter(TargetJob.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Target job not found in database")

    achievements = db.query(MasterAchievement).join(MasterExperience).filter(
        MasterExperience.profile_id == job.profile_id
    ).all()

    ach_dicts = [
        {
            "id": a.id,
            "raw_bullet": a.raw_bullet,
            "quantified_metric": a.quantified_metric or {},
            "action_verb": a.action_verb
        }
        for a in achievements
    ]

    analysis = MatchEngine.analyze_gaps(
        jd_requirements=job.parsed_responsibilities or [],
        achievements=ach_dicts
    )

    # Persist computed ATS score to target job
    job.ats_score = analysis["overall_ats_compatibility"]
    db.commit()

    return GapAnalysisResponse(
        target_job_id=job.id,
        job_title=job.title,
        company=job.company or "Target Company",
        full_matches=analysis["full_matches"],
        unquantified_matches=analysis["unquantified_matches"],
        potential_gaps=analysis["potential_gaps"],
        overall_ats_compatibility=analysis["overall_ats_compatibility"]
    )
