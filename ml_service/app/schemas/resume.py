from pydantic import BaseModel, Field
from typing import List, Optional, Dict


class JobSchema(BaseModel):
    title: Optional[str] = None
    company: Optional[str] = None
    location: Optional[str] = None
    description: Optional[str] = None
    salary: Optional[str] = None
    posted_date: Optional[str] = None
    apply_link: Optional[str] = None
    employment_type: Optional[str] = None
    is_remote: Optional[bool] = None
    source: Optional[str] = None
    company_logo: Optional[str] = None


class PredictionResponse(BaseModel):
    career_path: str
    confidence: float
    ats_score: float
    jobs: List[JobSchema] = Field(default_factory=list)