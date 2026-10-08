from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Dict, Any
import json
from app.database import get_db
from app.models import User, AnalysisHistory
from app.services.auth import get_current_user

router = APIRouter(prefix="/history", tags=["Analysis History"])

@router.get("")
def get_user_history(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    records = db.query(AnalysisHistory).filter(AnalysisHistory.user_id == current_user.id).order_by(AnalysisHistory.created_at.desc()).all()
    results = []
    for r in records:
        results.append({
            "id": r.id,
            "file_name": r.file_name,
            "job_title": r.job_title,
            "overall_score": r.overall_score,
            "grade": r.grade,
            "category_scores": json.loads(r.category_scores_json),
            "issues": json.loads(r.issues_json),
            "job_match": json.loads(r.job_match_json) if r.job_match_json else {},
            "created_at": r.created_at.isoformat()
        })
    return results

@router.delete("/{history_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_history_item(history_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    record = db.query(AnalysisHistory).filter(AnalysisHistory.id == history_id, AnalysisHistory.user_id == current_user.id).first()
    if not record:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="History record not found")
    db.delete(record)
    db.commit()
    return None
