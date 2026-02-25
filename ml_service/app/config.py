from __future__ import annotations

import os
from dataclasses import dataclass
from pathlib import Path

from dotenv import load_dotenv


# Resolve project root as <repo>/ml_service
APP_DIR = Path(__file__).resolve().parent
PROJECT_ROOT = APP_DIR.parent
DATA_DIR = PROJECT_ROOT / "data"
MODELS_DIR = DATA_DIR / "models"
UPLOADS_DIR = PROJECT_ROOT / "uploads"

load_dotenv(PROJECT_ROOT / ".env")


def _as_bool(value: str | None, default: bool) -> bool:
    if value is None:
        return default
    return value.strip().lower() in {"1", "true", "yes", "on"}


@dataclass(frozen=True)
class Settings:
    model_dir: Path = MODELS_DIR
    career_model_path: Path = MODELS_DIR / "career_model.pkl"
    tfidf_vectorizer_path: Path = MODELS_DIR / "tfidf_vectorizer.pkl"

    ats_vectorizer_path: Path = MODELS_DIR / "ats_vectorizer.pkl"
    ats_classifier_path: Path = MODELS_DIR / "ats_classifier.pkl"
    ats_training_dataset_path: Path = (
        PROJECT_ROOT.parent / "ats_system" / "data" / "sample_resumes" / "labeled_resumes.csv"
    )
    ats_skills_path: Path = DATA_DIR / "skills.json"

    jsearch_api_key: str | None = (
        os.getenv("JSEARCH_API_KEY") or os.getenv("RAPIDAPI_KEY") or None
    )
    jsearch_api_host: str = os.getenv("JSEARCH_API_HOST") or os.getenv(
        "RAPIDAPI_HOST", "jsearch.p.rapidapi.com"
    )
    jsearch_default_remote: bool = _as_bool(os.getenv("JSEARCH_DEFAULT_REMOTE"), True)
    jsearch_default_location: str | None = os.getenv("JSEARCH_DEFAULT_LOCATION") or None

    cors_origins: tuple[str, ...] = (
        "http://localhost:3000",
        "http://localhost:5173",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:5173",
        "*",
    )


settings = Settings()

# Ensure runtime directories exist.
settings.model_dir.mkdir(parents=True, exist_ok=True)
DATA_DIR.mkdir(parents=True, exist_ok=True)
UPLOADS_DIR.mkdir(parents=True, exist_ok=True)
