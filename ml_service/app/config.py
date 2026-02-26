from __future__ import annotations

import os
from dataclasses import dataclass
from pathlib import Path

from dotenv import load_dotenv


# Resolve project root as <repo>/ml_service
APP_DIR = Path(__file__).resolve().parent
PROJECT_ROOT = APP_DIR.parent
REPO_ROOT = PROJECT_ROOT.parent
DATA_DIR = PROJECT_ROOT / "data"
MODELS_DIR = DATA_DIR / "models"
UPLOADS_DIR = PROJECT_ROOT / "uploads"

# Load env in precedence order, lowest -> highest priority.
load_dotenv(REPO_ROOT / ".env", override=False)
load_dotenv(REPO_ROOT / "rexion-backend" / ".env", override=False)
load_dotenv(REPO_ROOT / "backend" / ".env", override=False)
load_dotenv(PROJECT_ROOT / ".env", override=True)


def _get_env(*keys: str) -> str | None:
    for key in keys:
        value = os.getenv(key)
        if value and value.strip():
            return value.strip()
    return None


def _as_bool(value: str | None, default: bool) -> bool:
    if value is None:
        return default
    return value.strip().lower() in {"1", "true", "yes", "on"}


def _as_float(value: str | None, default: float) -> float:
    if value is None:
        return default
    try:
        numeric = float(value.strip())
    except Exception:
        return default
    return numeric if numeric > 0 else default


def _as_int(value: str | None, default: int) -> int:
    if value is None:
        return default
    try:
        numeric = int(str(value).strip())
    except Exception:
        return default
    return numeric if numeric > 0 else default


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

    jsearch_api_key: str | None = _get_env(
        "JSEARCH_API_KEY",
        "RAPIDAPI_KEY",
        "RAPID_API_KEY",
        "X_RAPIDAPI_KEY",
    )
    jsearch_api_host: str = _get_env(
        "JSEARCH_API_HOST",
        "RAPIDAPI_HOST",
        "RAPID_API_HOST",
    ) or "jsearch.p.rapidapi.com"
    jsearch_default_remote: bool = _as_bool(os.getenv("JSEARCH_DEFAULT_REMOTE"), True)
    jsearch_default_location: str | None = os.getenv("JSEARCH_DEFAULT_LOCATION") or None
    jsearch_enable_fallback: bool = _as_bool(os.getenv("JSEARCH_ENABLE_FALLBACK"), False)
    jsearch_timeout_seconds: float = _as_float(os.getenv("JSEARCH_TIMEOUT_SECONDS"), 35.0)
    jsearch_cache_ttl_seconds: int = _as_int(os.getenv("JSEARCH_CACHE_TTL_SECONDS"), 300)

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
