from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import Field

class Settings(BaseSettings):
    # OpenRouter
    openrouter_api_key: str = Field(..., alias="OPENROUTER_API_KEY")
    openrouter_model: str = Field("deepseek/deepseek-chat-v3-0324:free", alias="OPENROUTER_MODEL")
    
    # Alternative: Gemini
    gemini_api_key: str | None = Field(None, alias="GEMINI_API_KEY")
    gemini_model: str | None = Field(None, alias="GEMINI_MODEL")

    # General
    env: str = Field("development", alias="ENV")
    log_level: str = Field("INFO", alias="LOG_LEVEL")
    
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

settings = Settings()