from pathlib import Path
from typing import List
from pydantic_settings import BaseSettings
from pydantic import Field

BASE_DIR = Path(__file__).resolve().parent.parent
DATA_DIR = BASE_DIR / "data"

class Settings(BaseSettings):
    app_name: str = "Rexion ML Service"
    debug: bool = False
    
    # Model and Vectorizer paths
    model_path: str = str(DATA_DIR / "models" / "career_model.pkl")
    vectorizer_path: str = str(DATA_DIR / "models" / "tfidf_vectorizer.pkl")
    career_model_path: str = str(DATA_DIR / "models" / "career_model.pkl")
    tfidf_vectorizer_path: str = str(DATA_DIR / "models" / "tfidf_vectorizer.pkl")
    production_bert_model_dir: Path = BASE_DIR / "model" / "production_bert"
    bert_resume_device: str = "cpu"
    career_prediction_backend: str = "auto"

    ats_training_dataset_path: Path = DATA_DIR / "production_resume_dataset.csv"
    ats_vectorizer_path: Path = DATA_DIR / "models" / "ats_vectorizer.pkl"
    ats_classifier_path: Path = DATA_DIR / "models" / "ats_classifier.pkl"
    
    # CORS
    cors_origins: List[str] = [
        "http://localhost:3000",
        "http://localhost:5173",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:5173"
    ]
    
    # JSearch / RapidAPI settings
    rapidapi_key: str = Field(default="", env="RAPIDAPI_KEY")
    rapidapi_host: str = Field(default="jsearch.p.rapidapi.com", env="RAPIDAPI_HOST")
    jsearch_default_remote: bool = False
    
    log_level: str = "INFO"

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        extra = "ignore"

settings = Settings()