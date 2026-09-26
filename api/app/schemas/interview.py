from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, Field

class ElicitationStartRequest(BaseModel):
    target_job_id: str
    gap_requirement: str
    matched_bullet: Optional[str] = None

class MessageSchema(BaseModel):
    id: str
    sender: str  # 'system' | 'user' | 'assistant'
    text: str
    timestamp: str
    isProposal: bool = False
    proposedXYZBullet: Optional[str] = None

class ElicitationSessionResponse(BaseModel):
    id: str
    target_job_id: str
    gap_title: str
    generated_question: str
    messages: List[MessageSchema] = Field(default_factory=list)
    synthesized_bullet: Optional[str] = None
    status: str  # 'PENDING' | 'ANSWERED' | 'SKIPPED'
    created_at: datetime

    class Config:
        from_attributes = True

class UserAnswerRequest(BaseModel):
    session_id: str
    user_response: str

class CommitXYZBulletRequest(BaseModel):
    session_id: str
    experience_id: Optional[str] = None
