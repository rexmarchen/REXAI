from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import List
import os

class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="allow")
    
    PROJECT_NAME: str = "Resume Builder & Analyzer"
    VERSION: str = "1.0.0"
    API_V1_PREFIX: str = "/api"
    
    # Database
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./resume_app.db")
    
    # Auth
    SECRET_KEY: str = os.getenv("SECRET_KEY", "rexion-super-secret-jwt-key-2026-production-grade-123456")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 # 24 hours
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    
    # Optional AI
    ANTHROPIC_API_KEY: str = os.getenv("ANTHROPIC_API_KEY", "")
    
    # Security & Limits
    MAX_FILE_SIZE_BYTES: int = 5 * 1024 * 1024  # 5 MB
    ALLOWED_EXTENSIONS: List[str] = [".pdf", ".docx", ".txt"]
    CORS_ORIGINS: List[str] = ["*"]

settings = Settings()
