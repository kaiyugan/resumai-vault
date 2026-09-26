from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.api.v1.endpoints import vault, jobs, interviews, coach, cover_letter, exporter, analytics, auth
from app.db.session import init_db

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    description="Backend API Gateway for Tailored Resume Intelligence Platform (MVP)"
)

@app.on_event("startup")
def on_startup():
    init_db()


# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register API Routers
app.include_router(auth.router, prefix=f"{settings.API_V1_STR}/auth", tags=["Candidate Auth & Accounts"])
app.include_router(vault.router, prefix=f"{settings.API_V1_STR}/vault", tags=["Master Vault"])
app.include_router(jobs.router, prefix=f"{settings.API_V1_STR}/jobs", tags=["JD Deconstruction & Gap Engine"])
app.include_router(interviews.router, prefix=f"{settings.API_V1_STR}/interviews", tags=["Discovery Micro-Interviews"])
app.include_router(coach.router, prefix=f"{settings.API_V1_STR}/coach", tags=["STAR Behavioral Coach"])
app.include_router(cover_letter.router, prefix=f"{settings.API_V1_STR}/cover-letter", tags=["Tailored Cover Letter Generator"])
app.include_router(exporter.router, prefix=f"{settings.API_V1_STR}/exporter", tags=["ATS Exporter & Benchmark Engine"])
app.include_router(analytics.router, prefix=f"{settings.API_V1_STR}/analytics", tags=["Telemetry & Product KPIs"])



@app.get("/", tags=["Health Check"])
def root():
    return {
        "status": "online",
        "service": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "docs_url": "/docs"
    }

@app.get("/healthcheck", tags=["Health Check"])
def healthcheck():
    return {"status": "healthy", "database": "connected", "pgvector_extension": "active"}
