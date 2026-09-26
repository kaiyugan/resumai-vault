from fastapi import APIRouter, HTTPException, Depends, status
from typing import List
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.domain import ElicitationSession, MasterAchievement, TargetJob
from app.schemas.interview import (
    ElicitationStartRequest,
    ElicitationSessionResponse,
    UserAnswerRequest,
    CommitXYZBulletRequest
)
from app.services.xyz_synthesizer import XYZSynthesizer

router = APIRouter()


@router.post("/start", response_model=ElicitationSessionResponse)
def start_elicitation_session(req: ElicitationStartRequest, db: Session = Depends(get_db)):
    question = XYZSynthesizer.generate_interview_question(
        gap_requirement=req.gap_requirement,
        matched_bullet=req.matched_bullet
    )

    db_session = ElicitationSession(
        target_job_id=req.target_job_id,
        missing_skill_or_gap=req.gap_requirement,
        generated_question=question,
        status="PENDING"
    )
    db.add(db_session)
    db.commit()
    db.refresh(db_session)

    return {
        "id": db_session.id,
        "target_job_id": db_session.target_job_id,
        "gap_title": db_session.missing_skill_or_gap,
        "generated_question": db_session.generated_question,
        "messages": [
            {
                "id": "msg-1",
                "sender": "assistant",
                "text": question,
                "timestamp": "12:00 PM",
                "isProposal": False,
                "proposedXYZBullet": None
            }
        ],
        "synthesized_bullet": None,
        "status": db_session.status,
        "created_at": db_session.created_at.isoformat() if db_session.created_at else "2026-02-01T10:00:00Z"
    }


@router.post("/answer", response_model=ElicitationSessionResponse)
def submit_answer(req: UserAnswerRequest, db: Session = Depends(get_db)):
    session = db.query(ElicitationSession).filter(ElicitationSession.id == req.session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Elicitation session not found")

    session.user_response = req.user_response

    # Synthesize Google XYZ bullet
    synthesis = XYZSynthesizer.synthesize_google_xyz(
        gap_title=session.missing_skill_or_gap,
        user_answer=req.user_response
    )

    session.synthesized_bullet = synthesis["xyz_bullet"]
    db.commit()
    db.refresh(session)

    messages = [
        {
            "id": "msg-1",
            "sender": "assistant",
            "text": session.generated_question,
            "timestamp": "12:00 PM",
            "isProposal": False,
            "proposedXYZBullet": None
        },
        {
            "id": "msg-user-2",
            "sender": "user",
            "text": req.user_response,
            "timestamp": "12:01 PM",
            "isProposal": False,
            "proposedXYZBullet": None
        },
        {
            "id": "msg-assistant-3",
            "sender": "assistant",
            "text": "Based on your response, I have synthesized a high-impact **Google XYZ bullet point**:",
            "timestamp": "12:02 PM",
            "isProposal": True,
            "proposedXYZBullet": session.synthesized_bullet
        }
    ]

    return {
        "id": session.id,
        "target_job_id": session.target_job_id,
        "gap_title": session.missing_skill_or_gap,
        "generated_question": session.generated_question,
        "messages": messages,
        "synthesized_bullet": session.synthesized_bullet,
        "status": session.status,
        "created_at": session.created_at.isoformat() if session.created_at else "2026-02-01T10:00:00Z"
    }


@router.post("/commit", status_code=status.HTTP_200_OK)
def commit_xyz_bullet(req: CommitXYZBulletRequest, db: Session = Depends(get_db)):
    session = db.query(ElicitationSession).filter(ElicitationSession.id == req.session_id).first()
    if not session or not session.synthesized_bullet:
        raise HTTPException(status_code=400, detail="Invalid session or missing synthesized bullet")

    bullet = session.synthesized_bullet
    exp_id = req.experience_id or "exp-1"

    new_ach = MasterAchievement(
        experience_id=exp_id,
        raw_bullet=bullet,
        quantified_metric={"value": "Verified Metric"},
        action_verb=bullet.split(" ")[0],
        context=session.missing_skill_or_gap,
        vector_tags=["Google XYZ Synthesized", session.missing_skill_or_gap]
    )

    db.add(new_ach)
    session.status = "ANSWERED"
    db.commit()
    db.refresh(new_ach)

    return {
        "success": True,
        "achievement_id": new_ach.id,
        "committed_bullet": bullet,
        "message": "Synthesized Google XYZ bullet point committed to Master Vault successfully!"
    }
