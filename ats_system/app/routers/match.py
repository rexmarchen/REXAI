from __future__ import annotations

from pydantic import BaseModel, Field
from fastapi import APIRouter, Query

from app.services.matcher import match_and_rank


router = APIRouter(tags=["matching"])


class MatchRequest(BaseModel):
    job_description: str = Field(..., min_length=10)
    resume_ids: list[str] | None = None


@router.post("/match")
def match(request: MatchRequest) -> dict:
    results = match_and_rank(
        job_description=request.job_description,
        resume_ids=request.resume_ids,
    )
    return {
        "job_description": request.job_description,
        "total_matched": len(results),
        "results": results,
    }


@router.get("/rank")
def rank(
    job_description: str = Query(..., min_length=10),
    top_k: int = Query(0, ge=0, le=100),
) -> dict:
    results = match_and_rank(job_description=job_description, resume_ids=None)
    ranked = results[:top_k] if top_k > 0 else results

    return {
        "job_description": job_description,
        "total_ranked": len(ranked),
        "results": ranked,
    }

