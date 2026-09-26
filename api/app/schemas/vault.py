from datetime import date, datetime
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, EmailStr, Field

class ProfileBase(BaseModel):
    email: EmailStr
    full_name: str
    phone: Optional[str] = None
    location: Optional[str] = None
    linkedin_url: Optional[str] = None
    github_url: Optional[str] = None

class ProfileCreate(ProfileBase):
    pass

class ProfileResponse(ProfileBase):
    id: str
    created_at: datetime

    class Config:
        from_attributes = True

class QuantifiedMetricSchema(BaseModel):
    value: Optional[str] = None
    type: Optional[str] = None
    label: Optional[str] = None

class MasterAchievementBase(BaseModel):
    raw_bullet: str
    quantified_metric: Optional[QuantifiedMetricSchema] = Field(default_factory=QuantifiedMetricSchema)
    action_verb: Optional[str] = None
    context: Optional[str] = None
    vector_tags: List[str] = Field(default_factory=list)

class MasterAchievementCreate(MasterAchievementBase):
    experience_id: str

class MasterAchievementResponse(MasterAchievementBase):
    id: str
    experience_id: str
    created_at: datetime

    class Config:
        from_attributes = True

class MasterExperienceBase(BaseModel):
    company: str
    role_title: str
    location: Optional[str] = None
    start_date: date
    end_date: Optional[date] = None
    is_current: bool = False
    raw_summary: Optional[str] = None
    skills_used: List[str] = Field(default_factory=list)

class MasterExperienceCreate(MasterExperienceBase):
    profile_id: str

class MasterExperienceResponse(MasterExperienceBase):
    id: str
    profile_id: str
    achievements: List[MasterAchievementResponse] = Field(default_factory=list)
    created_at: datetime

    class Config:
        from_attributes = True

class IngestionRequest(BaseModel):
    profile_id: str
    raw_text: str

class IngestionResponse(BaseModel):
    success: bool
    experiences_created: int
    achievements_created: int
    message: str
    parsed_data: Optional[Dict[str, Any]] = None
