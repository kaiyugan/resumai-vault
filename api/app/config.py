import os
from typing import List, Optional
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    PROJECT_NAME: str = "Tailored Resume Intelligence Platform API"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"
    
    SECRET_KEY: str = os.getenv("SECRET_KEY", "super-secret-dev-key-change-in-production")
    CORS_ORIGINS: List[str] = [
        "http://localhost:5173",
        "http://localhost:3000",
        "http://127.0.0.1:5173"
    ]
    
    # Database Settings (PostgreSQL + pgvector)
    DATABASE_URL: str = os.getenv(
        "DATABASE_URL", 
        "postgresql://postgres:postgres@localhost:5432/resume_db"
    )
    
    # AI & Embeddings Settings
    OPENAI_API_KEY: Optional[str] = os.getenv("OPENAI_API_KEY", None)
    GEMINI_API_KEY: Optional[str] = os.getenv("GEMINI_API_KEY", None)
    ANTHROPIC_API_KEY: Optional[str] = os.getenv("ANTHROPIC_API_KEY", None)
    
    EMBEDDING_MODEL: str = "text-embedding-3-small"
    PRIMARY_LLM_MODEL: str = "gemini-1.5-flash"
    SECONDARY_LLM_MODEL: str = "claude-3-5-sonnet-20241022"
    FALLBACK_LLM_MODEL: str = "gpt-4o"
    DEFAULT_LLM_MODEL: str = "gpt-4o"
    
    # Supabase Credentials (optional)
    SUPABASE_URL: Optional[str] = os.getenv("SUPABASE_URL", None)
    SUPABASE_KEY: Optional[str] = os.getenv("SUPABASE_KEY", None)

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore"
    )

settings = Settings()
