from typing import List, Optional, Dict, Any
from pydantic import BaseModel
from datetime import datetime


class TelemetryEventItem(BaseModel):
    event_name: str
    step_number: Optional[int] = None
    ats_score_baseline: Optional[int] = None
    ats_score_tailored: Optional[int] = None
    time_spent_ms: Optional[int] = None
    job_domain: Optional[str] = None
    import_method: Optional[str] = None
    metadata: Optional[Dict[str, Any]] = None
    timestamp: Optional[str] = None


class TelemetryEventBatch(BaseModel):
    session_hash: str
    events: List[TelemetryEventItem]


class KPIDashboardResponse(BaseModel):
    active_sessions_24h: int
    total_resumes_parsed: int
    total_jobs_tailored: int
    total_exports: int
    ingestion_success_rate: float
    cuj_conversion_rate: float
    avg_ats_elevation_delta: float
    quantified_metric_elicitation_rate: float
    gap_resolution_efficiency: float
    pre_interview_review_rate: float
    session_pickup_rate: float
    scraper_first_pass_rate: float
    api_error_rate: float
    recent_events_count: int
    top_target_domain: str
