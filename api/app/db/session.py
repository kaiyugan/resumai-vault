"""
Database Session & Engine Initialization
Provides connection management for PostgreSQL 16 + pgvector with local SQLite fallback.
"""

import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session
from app.config import settings
from app.models.domain import Base

raw_db_url = getattr(settings, "DATABASE_URL", None) or os.getenv(
    "DATABASE_URL", "sqlite:///./resume_platform.db"
)

# Attempt connecting to specified DATABASE_URL, with fallback to SQLite if driver/DB is unavailable
try:
    if raw_db_url.startswith("postgresql"):
        # Check if psycopg2 or asyncpg driver is available
        try:
            import psycopg2
            engine_url = raw_db_url
        except ImportError:
            # Driver fallback to sqlite if postgresql driver not installed locally
            engine_url = "sqlite:///./resume_platform.db"
    else:
        engine_url = raw_db_url
except Exception:
    engine_url = "sqlite:///./resume_platform.db"

connect_args = {}
if engine_url.startswith("sqlite"):
    connect_args["check_same_thread"] = False

engine = create_engine(
    engine_url,
    connect_args=connect_args,
    pool_pre_ping=True
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def init_db():
    """Initializes database tables and auto-repairs missing columns for SQLite on application startup."""
    Base.metadata.create_all(bind=engine)
    
    if engine_url.startswith("sqlite"):
        try:
            with engine.connect() as conn:
                from sqlalchemy import text
                # Check existing columns in target_jobs
                result = conn.execute(text("PRAGMA table_info(target_jobs);"))
                columns = [row[1] for row in result.fetchall()]
                
                missing_columns = {
                    "current_step": "INTEGER DEFAULT 1",
                    "status": "VARCHAR(50) DEFAULT 'DRAFT'",
                    "last_accessed_at": "TIMESTAMP",
                    "tailored_resume_payload": "JSON",
                    "selected_theme": "VARCHAR(50) DEFAULT 'classic'",
                    "ats_score": "INTEGER DEFAULT 85"
                }
                
                for col_name, col_type in missing_columns.items():
                    if col_name not in columns:
                        conn.execute(text(f"ALTER TABLE target_jobs ADD COLUMN {col_name} {col_type};"))
                
                conn.commit()
        except Exception as e:
            print(f"[init_db] SQLite column migration notice: {e}")


def get_db():
    """FastAPI Dependency for database session injection."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

