import uuid
from datetime import datetime
from typing import List, Optional
from sqlalchemy import (
    Column, String, Text, Boolean, DateTime, ForeignKey, Integer, JSON, ARRAY, Table
)
from sqlalchemy.dialects.postgresql import UUID, JSONB, ARRAY as PG_ARRAY
from sqlalchemy.orm import declarative_base, relationship

Base = declarative_base()


class Profile(Base):
    __tablename__ = "profiles"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    email = Column(String(255), unique=True, nullable=False)
    full_name = Column(String(255), nullable=False)
    preferred_resume_name = Column(String(255), nullable=True)
    avatar_url = Column(String(255), nullable=True)
    phone = Column(String(50), nullable=True)
    location = Column(String(255), nullable=True)
    linkedin_url = Column(String(500), nullable=True)
    github_url = Column(String(500), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    experiences = relationship("MasterExperience", back_populates="profile", cascade="all, delete-orphan")
    jobs = relationship("TargetJob", back_populates="profile", cascade="all, delete-orphan")
    resumes = relationship("GeneratedResume", back_populates="profile", cascade="all, delete-orphan")


class MasterExperience(Base):
    __tablename__ = "master_experiences"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    profile_id = Column(String(36), ForeignKey("profiles.id", ondelete="CASCADE"), nullable=False)
    company = Column(String(255), nullable=False)
    role_title = Column(String(255), nullable=False)
    location = Column(String(255), nullable=True)
    start_date = Column(String(50), nullable=False)
    end_date = Column(String(50), nullable=True)
    is_current = Column(Boolean, default=False, nullable=False)
    raw_summary = Column(Text, nullable=True)
    skills_used = Column(JSON, default=list)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    profile = relationship("Profile", back_populates="experiences")
    achievements = relationship("MasterAchievement", back_populates="experience", cascade="all, delete-orphan")


class MasterAchievement(Base):
    __tablename__ = "master_achievements"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    experience_id = Column(String(36), ForeignKey("master_experiences.id", ondelete="CASCADE"), nullable=False)
    raw_bullet = Column(Text, nullable=False)
    quantified_metric = Column(JSON, default=dict)
    action_verb = Column(String(100), nullable=True)
    context = Column(Text, nullable=True)
    vector_tags = Column(JSON, default=list)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    experience = relationship("MasterExperience", back_populates="achievements")


class TargetJob(Base):
    __tablename__ = "target_jobs"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    profile_id = Column(String(36), ForeignKey("profiles.id", ondelete="CASCADE"), nullable=False)
    title = Column(String(255), nullable=False)
    company = Column(String(255), nullable=True)
    location = Column(String(255), nullable=True)
    raw_description = Column(Text, nullable=False)
    parsed_hard_skills = Column(JSON, default=list)
    parsed_soft_skills = Column(JSON, default=list)
    parsed_responsibilities = Column(JSON, default=list)
    parsed_metrics = Column(JSON, default=list)
    company_intelligence = Column(JSON, default=dict)
    
    # Session State Tracking & Resume Version Snapshot Fields
    current_step = Column(Integer, default=2, nullable=False) # 1: Vault, 2: JD, 3: Interview, 4: Export, 5: Coach
    status = Column(String(50), default="DRAFT", nullable=False) # DRAFT, FINALIZED, APPLIED, INTERVIEWING
    last_accessed_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    tailored_resume_payload = Column(JSON, default=dict, nullable=True)
    selected_theme = Column(String(50), default="classic", nullable=False)
    ats_score = Column(Integer, default=85, nullable=False)
    
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    profile = relationship("Profile", back_populates="jobs")
    sessions = relationship("ElicitationSession", back_populates="target_job", cascade="all, delete-orphan")
    resumes = relationship("GeneratedResume", back_populates="target_job", cascade="all, delete-orphan")


class ElicitationSession(Base):
    __tablename__ = "elicitation_sessions"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    target_job_id = Column(String(36), ForeignKey("target_jobs.id", ondelete="CASCADE"), nullable=False)
    missing_skill_or_gap = Column(Text, nullable=False)
    generated_question = Column(Text, nullable=False)
    user_response = Column(Text, nullable=True)
    synthesized_bullet = Column(Text, nullable=True)
    status = Column(String(50), default="PENDING", nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    target_job = relationship("TargetJob", back_populates="sessions")


class GeneratedResume(Base):
    __tablename__ = "generated_resumes"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    target_job_id = Column(String(36), ForeignKey("target_jobs.id", ondelete="CASCADE"), nullable=False)
    profile_id = Column(String(36), ForeignKey("profiles.id", ondelete="CASCADE"), nullable=False)
    document_json = Column(JSON, nullable=False)
    pdf_url = Column(String(500), nullable=True)
    docx_url = Column(String(500), nullable=True)
    ats_score = Column(Integer, default=85)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    profile = relationship("Profile", back_populates="resumes")
    target_job = relationship("TargetJob", back_populates="resumes")


class UserAnalyticsEvent(Base):
    __tablename__ = "user_analytics_events"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    session_hash = Column(String(64), nullable=False)
    event_name = Column(String(64), nullable=False)
    step_number = Column(Integer, nullable=True)
    ats_score_baseline = Column(Integer, nullable=True)
    ats_score_tailored = Column(Integer, nullable=True)
    time_spent_ms = Column(Integer, nullable=True)
    job_domain = Column(String(64), nullable=True)
    import_method = Column(String(32), nullable=True)
    metadata_json = Column(JSON, default=dict)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)


class DailyKPISummary(Base):
    __tablename__ = "daily_kpi_summaries"

    date = Column(String(10), primary_key=True) # YYYY-MM-DD
    active_sessions = Column(Integer, default=0)
    total_resumes_parsed = Column(Integer, default=0)
    total_jobs_tailored = Column(Integer, default=0)
    total_exports = Column(Integer, default=0)
    avg_ats_elevation_delta = Column(Integer, default=32)
    avg_cuj_conversion_rate = Column(Integer, default=78)
    avg_micro_interview_completion_rate = Column(Integer, default=85)
    scraper_success_rate = Column(Integer, default=96)
    top_target_domain = Column(String(64), default="Software Engineering")

