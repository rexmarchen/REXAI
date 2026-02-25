from typing import List, Optional

from pydantic import BaseModel, Field


class JobListing(BaseModel):
    """Job listing schema"""
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
    required_skills: Optional[List[str]] = None
    required_experience: Optional[str] = None
    required_education: Optional[str] = None


class PredictionResponse(BaseModel):
    """Resume prediction response schema"""
    prediction_id: str
    career_path: str
    confidence: float
    ats_score: float
    predicted_category: str
    job_description_used: str
    extracted_skills: List[str] = Field(default_factory=list)
    missing_skills: List[str] = Field(default_factory=list)
    jobs: List[JobListing] = Field(default_factory=list)


class MatchRequest(BaseModel):
    job_description: str = Field(..., min_length=10)
    resume_ids: Optional[List[str]] = None
