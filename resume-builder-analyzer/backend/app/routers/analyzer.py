from fastapi import APIRouter, UploadFile, File, Form, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import Optional
import json
from app.config import settings
from app.database import get_db
from app.models import User, AnalysisHistory
from app.schemas import AnalysisResult, AnalyzeJSONRequest
from app.services.parser import ResumeParser, ParsedResume
from app.services.engine import AnalyzerEngine
from app.services.ai import AIService
from app.services.auth import get_optional_current_user

router = APIRouter(prefix="", tags=["Resume Analyzer"])
engine = AnalyzerEngine()

def validate_uploaded_file(file: UploadFile, contents: bytes):
    # 1. Size check
    if len(contents) > settings.MAX_FILE_SIZE_BYTES:
        raise HTTPException(
            status_code=413,
            detail=f"File exceeds maximum allowed size of {settings.MAX_FILE_SIZE_BYTES // (1024 * 1024)} MB"
        )
        
    if len(contents) == 0:
        raise HTTPException(
            status_code=422,
            detail="Uploaded file is empty"
        )
        
    # 2. Extension check
    filename = (file.filename or "").lower()
    if not any(filename.endswith(ext) for ext in settings.ALLOWED_EXTENSIONS):
        raise HTTPException(
            status_code=415,
            detail=f"Unsupported file format. Allowed formats: {', '.join(settings.ALLOWED_EXTENSIONS)}"
        )
        
    # 3. Content signature check
    if filename.endswith(".pdf") and not contents.startswith(b"%PDF"):
        raise HTTPException(
            status_code=415,
            detail="Invalid PDF file signature"
        )
    if filename.endswith(".docx") and not contents.startswith(b"PK\x03\x04"):
        raise HTTPException(
            status_code=415,
            detail="Invalid DOCX file signature"
        )

@router.post("/analyze", response_model=AnalysisResult)
async def analyze_file(
    file: UploadFile = File(...),
    job_description: Optional[str] = Form(None),
    use_ai: Optional[bool] = Form(False),
    current_user: Optional[User] = Depends(get_optional_current_user),
    db: Session = Depends(get_db)
):
    contents = await file.read()
    validate_uploaded_file(file, contents)
    
    filename = (file.filename or "").lower()
    parsed: ParsedResume
    
    try:
        if filename.endswith(".pdf"):
            parsed = ResumeParser.parse_pdf(contents)
        elif filename.endswith(".docx"):
            parsed = ResumeParser.parse_docx(contents)
        else:
            text = contents.decode("utf-8", errors="replace")
            parsed = ResumeParser.parse_txt(text)
    except Exception as e:
        raise HTTPException(
            status_code=422,
            detail=f"Failed to parse resume document: {str(e)}"
        )
        
    # Run deterministic scoring
    result = engine.analyze(parsed, job_description)
    
    # Optional AI enhancement
    if use_ai:
        ai_res = AIService.analyze_resume(parsed.raw_text, parsed.bullet_points)
        if ai_res:
            result.ai_analysis = ai_res
            
    # Save to history if user is logged in
    if current_user:
        history_entry = AnalysisHistory(
            user_id=current_user.id,
            file_name=file.filename or "uploaded_resume",
            job_title=job_description[:60] if job_description else "General Analysis",
            overall_score=result.overall_score,
            grade=result.grade,
            category_scores_json=json.dumps({k: v.model_dump() for k, v in result.category_scores.items()}),
            issues_json=json.dumps([i.model_dump() for i in result.issues]),
            job_match_json=json.dumps(result.job_match.model_dump())
        )
        db.add(history_entry)
        db.commit()
        
    return result

@router.post("/analyze/json", response_model=AnalysisResult)
def analyze_from_json(
    req: AnalyzeJSONRequest,
    current_user: Optional[User] = Depends(get_optional_current_user),
    db: Session = Depends(get_db)
):
    parsed = ResumeParser.from_resume_data(req.resume_data)
    result = engine.analyze(parsed, req.job_description)
    
    if req.use_ai:
        ai_res = AIService.analyze_resume(parsed.raw_text, parsed.bullet_points)
        if ai_res:
            result.ai_analysis = ai_res
            
    if current_user:
        history_entry = AnalysisHistory(
            user_id=current_user.id,
            file_name=req.resume_data.contact.full_name or "Builder Resume",
            job_title=req.job_description[:60] if req.job_description else "Live Builder Audit",
            overall_score=result.overall_score,
            grade=result.grade,
            category_scores_json=json.dumps({k: v.model_dump() for k, v in result.category_scores.items()}),
            issues_json=json.dumps([i.model_dump() for i in result.issues]),
            job_match_json=json.dumps(result.job_match.model_dump())
        )
        db.add(history_entry)
        db.commit()
        
    return result
