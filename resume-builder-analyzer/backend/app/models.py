from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Float
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
from app.database import Base

def utcnow():
    return datetime.now(timezone.utc)

class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    created_at = Column(DateTime, default=utcnow, nullable=False)
    updated_at = Column(DateTime, default=utcnow, onupdate=utcnow, nullable=False)
    
    resumes = relationship("Resume", back_populates="user", cascade="all, delete-orphan")
    history = relationship("AnalysisHistory", back_populates="user", cascade="all, delete-orphan")

class Resume(Base):
    __tablename__ = "resumes"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True) # Nullable for guest/local autosave if needed
    title = Column(String(255), default="Untitled Resume", nullable=False)
    template_id = Column(String(64), default="classic-single", nullable=False)
    accent_color = Column(String(32), default="#2563eb", nullable=False)
    font_family = Column(String(64), default="Inter", nullable=False)
    data_json = Column(Text, nullable=False) # JSON string of all resume sections
    created_at = Column(DateTime, default=utcnow, nullable=False)
    updated_at = Column(DateTime, default=utcnow, onupdate=utcnow, nullable=False)
    
    user = relationship("User", back_populates="resumes")

class AnalysisHistory(Base):
    __tablename__ = "analysis_history"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    file_name = Column(String(255), default="uploaded_resume", nullable=False)
    job_title = Column(String(255), default="", nullable=False)
    overall_score = Column(Float, nullable=False)
    grade = Column(String(10), nullable=False)
    category_scores_json = Column(Text, nullable=False) # JSON dict of per-category scores
    issues_json = Column(Text, nullable=False) # JSON list of issues
    job_match_json = Column(Text, default="{}", nullable=False)
    created_at = Column(DateTime, default=utcnow, nullable=False)
    
    user = relationship("User", back_populates="history")
