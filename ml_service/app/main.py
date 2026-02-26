from __future__ import annotations

from contextlib import asynccontextmanager
from datetime import datetime
from typing import Optional
import uuid

from fastapi import FastAPI, File, Form, HTTPException, Query, UploadFile
from fastapi.middleware.cors import CORSMiddleware

from .config import settings
from .models.ats_scorer import ATSScorer
from .models.feature_extractor import FeatureExtractor
from .models.predictor import CareerPredictor
from .models.resume_parser import ResumeParser
from .schemas.resume import MatchRequest, PredictionResponse
from .service.ats_matcher import (
    add_resume,
    get_models,
    get_store_size,
    match_and_rank,
    predict_category,
)
from .service.job_fetcher import JobFetcher
from .service.parser import parse_upload_file
from .service.resume_profile_extractor import extract_resume_profile
from .service.skill_extractor import extract_skills, missing_skills
from .utils.database import db


parser = ResumeParser()
feature_extractor: FeatureExtractor | None = None
predictor: CareerPredictor | None = None
scorer: ATSScorer | None = None
job_fetcher: JobFetcher | None = None


def _parse_remote_flag(remote: Optional[str]) -> bool:
    if remote is None:
        return settings.jsearch_default_remote
    return str(remote).strip().lower() in {"1", "true", "yes", "on"}


def _build_auto_job_description(career_path: str, skills: list[str]) -> str:
    top_skills = skills[:12]
    skills_text = ", ".join(top_skills) if top_skills else "software development, APIs, teamwork"
    return " ".join(
        [
            f"Hiring for a {career_path}.",
            f"Required skills: {skills_text}.",
            "Candidate should build production-ready systems, collaborate with teams,",
            "and deliver measurable engineering impact.",
        ]
    )


def _merge_unique(values: list[str], limit: int = 30) -> list[str]:
    ordered: dict[str, str] = {}
    for value in values:
        clean = str(value or "").strip()
        if not clean:
            continue
        key = clean.lower()
        if key not in ordered:
            ordered[key] = clean
        if len(ordered) >= limit:
            break
    return list(ordered.values())


def _name_from_filename(filename: str | None) -> str:
    raw = str(filename or "").strip()
    if not raw:
        return ""
    stem = raw.rsplit(".", 1)[0]
    stem = stem.replace("_", " ").replace("-", " ")
    stem = " ".join(part for part in stem.split() if part)
    if len(stem) < 4:
        return ""
    return stem[:80]


@asynccontextmanager
async def lifespan(app: FastAPI):
    global feature_extractor, predictor, scorer, job_fetcher

    feature_extractor = FeatureExtractor(settings.tfidf_vectorizer_path)
    predictor = CareerPredictor(settings.career_model_path)
    scorer = ATSScorer(feature_extractor.vectorizer)
    job_fetcher = JobFetcher()
    get_models()  # Warm ATS category models.
    yield


app = FastAPI(
    title="Rexion ML + ATS Service",
    version="2.0.0",
    description="Unified resume prediction, ATS scoring, and job vacancy service.",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=list(settings.cors_origins),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health", tags=["system"])
async def health():
    return {"status": "ok", "service": "rexion_ml_ats"}


@app.post("/predict", response_model=PredictionResponse, tags=["prediction"])
async def predict(
    file: UploadFile = File(...),
    job_description: Optional[str] = Form(default=None),
    location: Optional[str] = Form(default=None),
    remote: Optional[str] = Form(default=None),
    user_id: Optional[str] = Form(default=None),
):
    if not feature_extractor or not predictor or not scorer or not job_fetcher:
        raise HTTPException(status_code=503, detail="Models are still loading.")

    file_bytes = await file.read()
    try:
        text = parser.extract(file_bytes, file.filename or "resume")
    except HTTPException:
        raise
    except Exception as error:
        raise HTTPException(status_code=400, detail=f"Could not parse resume: {error}") from error

    features = feature_extractor.transform([text])
    predictions, probabilities = predictor.predict(features)
    career_path = str(predictions[0])
    confidence = float(probabilities[0])

    profile = extract_resume_profile(text)
    resolved_name = profile.name or _name_from_filename(file.filename)
    extracted = _merge_unique([*extract_skills(text), *profile.skills], limit=30)
    jd_used = (
        str(job_description).strip()
        if job_description and str(job_description).strip()
        else _build_auto_job_description(career_path, extracted)
    )
    remote_jobs_only = _parse_remote_flag(remote)

    score_details = scorer.score(text, job_description=jd_used, return_details=True)
    ats_score = float(score_details["ats_score"])
    predicted_category = predict_category(text)
    missing = missing_skills(text, jd_used)

    jobs = await job_fetcher.search_jobs(
        query=career_path,
        location=location,
        remote_jobs_only=remote_jobs_only,
        num_pages=1,
    )
    jobs_limited = jobs[:20]

    prediction_id = str(uuid.uuid4())
    prediction_data = {
        "career_path": career_path,
        "confidence": confidence,
        "name": resolved_name,
        "education": profile.education,
        "experience_years": profile.experience_years,
        "certifications": profile.certifications,
        "projects": profile.projects,
        "ats_score": ats_score,
        "predicted_category": predicted_category,
        "job_description_used": jd_used,
        "extracted_skills": extracted,
        "missing_skills": missing,
        "jobs_query_meta": {
            "query": career_path,
            "location": location,
            "remote": remote_jobs_only,
        },
        "score_breakdown": {
            "tfidf_similarity": score_details["tfidf_similarity"],
            "skill_coverage": score_details["skill_coverage"],
            "structure_quality": score_details["structure_quality"],
        },
        "resume_filename": file.filename,
        "created_at": datetime.utcnow().isoformat(),
        "user_id": user_id,
    }

    db.create_prediction(
        prediction_id=prediction_id,
        resume_filename=file.filename or "resume",
        resume_content=text,
        career_path=career_path,
        confidence=confidence,
        ats_score=ats_score,
        prediction_data=prediction_data,
        user_id=user_id,
        jobs=jobs_limited,
    )

    return PredictionResponse(
        prediction_id=prediction_id,
        name=resolved_name,
        education=profile.education,
        certifications=profile.certifications,
        projects=profile.projects,
        experience_years=profile.experience_years,
        career_path=career_path,
        confidence=confidence,
        ats_score=ats_score,
        predicted_category=predicted_category,
        job_description_used=jd_used,
        extracted_skills=extracted,
        missing_skills=missing,
        jobs=jobs_limited,
    )


@app.get("/jobs/search", tags=["jobs"])
async def search_jobs(
    query: str = Query(..., min_length=2),
    location: Optional[str] = Query(default=None),
    remote: Optional[bool] = Query(default=None),
):
    if not job_fetcher:
        raise HTTPException(status_code=503, detail="Job fetcher is still loading.")

    jobs = await job_fetcher.search_jobs(
        query=query,
        location=location,
        remote_jobs_only=remote,
        num_pages=1,
    )
    return {"jobs": jobs[:20], "meta": job_fetcher.status_meta()}


@app.post("/upload-resumes", tags=["ats"])
async def upload_resumes(resumes: list[UploadFile] = File(...)):
    if not resumes:
        return {"uploaded": 0, "resumes": [], "total_resumes_in_store": get_store_size()}

    uploaded: list[dict] = []
    for file in resumes:
        parsed = await parse_upload_file(file)
        resume_id = add_resume(parsed.filename, parsed.text)
        uploaded.append(
            {
                "resume_id": resume_id,
                "filename": parsed.filename,
                "extension": parsed.extension,
                "text_length": len(parsed.text),
                "skills": extract_skills(parsed.text),
            }
        )

    return {
        "uploaded": len(uploaded),
        "resumes": uploaded,
        "total_resumes_in_store": get_store_size(),
    }


@app.post("/match", tags=["ats"])
async def match(request: MatchRequest):
    results = match_and_rank(
        job_description=request.job_description,
        resume_ids=request.resume_ids,
    )
    return {
        "job_description": request.job_description,
        "total_matched": len(results),
        "results": results,
    }


@app.get("/rank", tags=["ats"])
async def rank(
    job_description: str = Query(..., min_length=10),
    top_k: int = Query(0, ge=0, le=100),
):
    results = match_and_rank(job_description=job_description, resume_ids=None)
    ranked = results[:top_k] if top_k > 0 else results
    return {
        "job_description": job_description,
        "total_ranked": len(ranked),
        "results": ranked,
    }


@app.get("/predictions/{prediction_id}", tags=["history"])
async def get_prediction_by_id(prediction_id: str):
    prediction = db.get_prediction(prediction_id)
    if not prediction:
        raise HTTPException(status_code=404, detail=f"Prediction {prediction_id} not found")
    return prediction


@app.get("/predictions/user/{user_id}", tags=["history"])
async def get_user_predictions(user_id: str, limit: int = 50):
    predictions = db.get_user_predictions(user_id, limit)
    return {"user_id": user_id, "total": len(predictions), "predictions": predictions}


@app.get("/predictions", tags=["history"])
async def list_all_predictions(limit: int = 100, offset: int = 0):
    predictions = db.list_predictions(limit, offset)
    return {"total": len(predictions), "limit": limit, "offset": offset, "predictions": predictions}


@app.delete("/predictions/{prediction_id}", tags=["history"])
async def delete_prediction(prediction_id: str):
    prediction = db.get_prediction(prediction_id)
    if not prediction:
        raise HTTPException(status_code=404, detail=f"Prediction {prediction_id} not found")
    db.delete_prediction(prediction_id)
    return {"success": True, "message": f"Prediction {prediction_id} deleted"}
