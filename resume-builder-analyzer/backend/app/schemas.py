from pydantic import BaseModel, EmailStr, Field, ConfigDict
from typing import List, Optional, Dict, Literal
from datetime import datetime

# --- Auth Schemas ---
class UserCreate(BaseModel):
    email: EmailStr
    password: str = Field(min_length=6)

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    
    id: int
    email: EmailStr
    created_at: datetime

class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    user: UserOut

class TokenRefresh(BaseModel):
    refresh_token: str

# --- Resume Builder Schemas ---
class ContactInfo(BaseModel):
    full_name: str = ""
    job_title: str = ""
    email: str = ""
    phone: str = ""
    location: str = ""
    linkedin: str = ""
    github: str = ""
    website: str = ""

class ExperienceItem(BaseModel):
    id: str = ""
    company: str = ""
    title: str = ""
    location: str = ""
    start_date: str = ""
    end_date: str = ""
    current: bool = False
    bullets: List[str] = []

class ProjectItem(BaseModel):
    id: str = ""
    title: str = ""
    description: str = ""
    technologies: List[str] = []
    link: str = ""

class EducationItem(BaseModel):
    id: str = ""
    institution: str = ""
    degree: str = ""
    field_of_study: str = ""
    location: str = ""
    start_date: str = ""
    end_date: str = ""
    gpa: str = ""

class SkillItem(BaseModel):
    id: str = ""
    name: str = ""
    level: int = Field(default=80, ge=0, le=100)
    category: str = "Technical"

class LanguageItem(BaseModel):
    id: str = ""
    name: str = ""
    proficiency: str = "Fluent"

class CertificationItem(BaseModel):
    id: str = ""
    name: str = ""
    issuer: str = ""
    issue_date: str = ""
    url: str = ""

class ResumeData(BaseModel):
    contact: ContactInfo = Field(default_factory=ContactInfo)
    summary: str = ""
    experience: List[ExperienceItem] = []
    projects: List[ProjectItem] = []
    education: List[EducationItem] = []
    skills: List[SkillItem] = []
    languages: List[LanguageItem] = []
    certifications: List[CertificationItem] = []

class ResumeCreate(BaseModel):
    title: str = "Untitled Resume"
    template_id: str = "classic-single"
    accent_color: str = "#2563eb"
    font_family: str = "Inter"
    data: ResumeData

class ResumeUpdate(BaseModel):
    title: Optional[str] = None
    template_id: Optional[str] = None
    accent_color: Optional[str] = None
    font_family: Optional[str] = None
    data: Optional[ResumeData] = None

class ResumeOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    
    id: int
    user_id: Optional[int]
    title: str
    template_id: str
    accent_color: str
    font_family: str
    data: ResumeData
    created_at: datetime
    updated_at: datetime

# --- Resume Analyzer Schemas ---
class Issue(BaseModel):
    category: str # "ATS Compatibility", "Content Quality", "Job Match", "Structure", "Language", "Format"
    severity: Literal["high", "medium", "low"]
    message: str
    concrete_fix: str
    evidence: str
    penalty: float = 0.0

class CategoryScore(BaseModel):
    score: float # 0 - 100
    weight: float # e.g. 0.20
    status: str # "Excellent", "Good", "Needs Improvement", "Critical"
    issues_count: int

class JobMatchDetails(BaseModel):
    matched_skills: List[str] = []
    missing_skills: List[str] = []
    coverage: float = 0.0 # 0 - 100%
    similarity: float = 0.0 # 0 - 100%

class AIRewrite(BaseModel):
    original: str
    rewrite: str
    reason: str

class AIAnalysis(BaseModel):
    strengths: List[str] = []
    weaknesses: List[str] = []
    rewrites: List[AIRewrite] = []

class AnalysisResult(BaseModel):
    overall_score: float # 0 - 100
    grade: str # A+, A, B, C, D, F
    category_scores: Dict[str, CategoryScore]
    issues: List[Issue]
    job_match: JobMatchDetails
    pages: int
    word_count: int
    sections_found: List[str]
    ai_analysis: Optional[AIAnalysis] = None

class AnalyzeJSONRequest(BaseModel):
    resume_data: ResumeData
    job_description: Optional[str] = None
    use_ai: bool = False
