from datetime import datetime
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field


class TargetJobBase(BaseModel):
    title: str
    company: Optional[str] = None
    location: Optional[str] = None
    raw_description: str


class TargetJobCreate(TargetJobBase):
    profile_id: str


class TargetJobURLCreate(BaseModel):
    profile_id: str
    url: str


class JobStateUpdate(BaseModel):
    current_step: Optional[int] = None
    status: Optional[str] = None
    selected_theme: Optional[str] = None
    ats_score: Optional[int] = None
    tailored_resume_payload: Optional[Dict[str, Any]] = None


class CompanyIntelligence(BaseModel):
    mission_statement: Optional[str] = ""
    core_values: List[str] = Field(default_factory=list)
    culture_insights: Optional[str] = ""
    first_impression_hooks: List[str] = Field(default_factory=list)


class TargetJobResponse(TargetJobBase):
    id: str
    profile_id: str
    parsed_hard_skills: List[str] = Field(default_factory=list)
    parsed_soft_skills: List[str] = Field(default_factory=list)
    parsed_responsibilities: List[str] = Field(default_factory=list)
    parsed_metrics: List[str] = Field(default_factory=list)
    company_intelligence: Optional[CompanyIntelligence] = None
    
    current_step: int = 2
    status: str = "DRAFT"
    last_accessed_at: datetime
    tailored_resume_payload: Optional[Dict[str, Any]] = None
    selected_theme: str = "classic"
    ats_score: int = 85
    created_at: datetime

    class Config:
        from_attributes = True


class MatchResultItem(BaseModel):
    id: str
    jd_requirement: str
    category: str  # FULL_MATCH, UNQUANTIFIED_MATCH, POTENTIAL_GAP
    similarity_score: float
    matched_achievement_id: Optional[str] = None
    matched_achievement_bullet: Optional[str] = None
    reason: str
    metric_missing: bool = False


class GapAnalysisResponse(BaseModel):
    target_job_id: str
    job_title: str
    company: str
    full_matches: List[MatchResultItem]
    unquantified_matches: List[MatchResultItem]
    potential_gaps: List[MatchResultItem]
    overall_ats_compatibility: int
