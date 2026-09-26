from fastapi import APIRouter, HTTPException, Depends
from typing import List, Dict, Any, Optional
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.domain import MasterAchievement
from app.services.star_coach_service import STARCoachService

router = APIRouter()


class PracticeAnswerRequest(BaseModel):
    question: str
    user_answer: str
    story_id: Optional[str] = None


class GenerateSessionRequest(BaseModel):
    job_title: Optional[str] = "Senior Engineer"
    company: Optional[str] = "Target Company"
    responsibilities: Optional[List[str]] = None


class SimulatedAnswerRequest(BaseModel):
    question: str
    candidate_answer: str
    target_job_title: Optional[str] = "Target Role"


@router.get("/stories", response_model=List[Dict[str, Any]])
def get_star_stories(db: Session = Depends(get_db)):
    achievements = db.query(MasterAchievement).all()
    ach_dicts = [
        {
            "id": a.id,
            "raw_bullet": a.raw_bullet,
            "quantified_metric": a.quantified_metric or {},
            "action_verb": a.action_verb
        }
        for a in achievements
    ]
    stories = STARCoachService.generate_star_stories(ach_dicts)
    return stories


@router.post("/evaluate", response_model=Dict[str, Any])
def evaluate_practice_answer(req: PracticeAnswerRequest):
    if not req.user_answer.strip():
        raise HTTPException(status_code=400, detail="Practice answer cannot be empty")

    result = STARCoachService.evaluate_practice_answer(
        question=req.question,
        user_answer=req.user_answer
    )
    return result


@router.post("/generate-session", response_model=List[Dict[str, Any]])
def generate_mock_interview_session(req: GenerateSessionRequest, db: Session = Depends(get_db)):
    achievements = db.query(MasterAchievement).all()
    ach_dicts = [{"id": a.id, "raw_bullet": a.raw_bullet} for a in achievements]

    questions = STARCoachService.generate_mock_interview_session(
        job_title=req.job_title,
        company=req.company,
        responsibilities=req.responsibilities,
        achievements=ach_dicts
    )
    return questions


@router.post("/evaluate-simulated-answer", response_model=Dict[str, Any])
def evaluate_simulated_answer(req: SimulatedAnswerRequest):
    if not req.candidate_answer.strip():
        raise HTTPException(status_code=400, detail="Candidate answer cannot be empty")

    result = STARCoachService.evaluate_simulated_answer(
        question=req.question,
        user_answer=req.candidate_answer,
        target_job_title=req.target_job_title
    )
    return result

