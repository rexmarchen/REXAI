from pydantic_settings import BaseSettings
from pydantic import Field

class Settings(BaseSettings):
    app_name: str = "Rexion ML Service"
    debug: bool = False
    model_path: str = "data/models/career_model.pkl"
    vectorizer_path: str = "data/models/tfidf_vectorizer.pkl"
    
    # JSearch / RapidAPI settings
    rapidapi_key: str = Field(default="", env="RAPIDAPI_KEY")
    rapidapi_host: str = Field(default="jsearch.p.rapidapi.com", env="RAPIDAPI_HOST")
    
    log_level: str = "INFO"

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"

settings = Settings()