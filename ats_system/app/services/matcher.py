from __future__ import annotations

import threading
from dataclasses import dataclass
from pathlib import Path
from typing import Iterable
from uuid import uuid4

import numpy as np
from fastapi import HTTPException
from sklearn.metrics.pairwise import cosine_similarity

from app.services.skill_extractor import extract_skills, missing_skills
from ml.classifier import load_classifier
from ml.embedder import load_vectorizer
from ml.train import train_and_save_models


ATS_ROOT = Path(__file__).resolve().parents[2]
MODELS_DIR = ATS_ROOT / "models"
VECTORIZER_PATH = MODELS_DIR / "vectorizer.pkl"
CLASSIFIER_PATH = MODELS_DIR / "classifier.pkl"

_MODEL_LOCK = threading.Lock()


@dataclass
class ResumeRecord:
    resume_id: str
    filename: str
    text: str


_RESUME_STORE: dict[str, ResumeRecord] = {}


def ensure_models_ready() -> None:
    with _MODEL_LOCK:
        if VECTORIZER_PATH.exists() and CLASSIFIER_PATH.exists():
            return
        train_and_save_models(
            dataset_path=ATS_ROOT / "data" / "sample_resumes" / "labeled_resumes.csv",
            vectorizer_path=VECTORIZER_PATH,
            classifier_path=CLASSIFIER_PATH,
        )


def _get_models():
    ensure_models_ready()
    vectorizer = load_vectorizer(VECTORIZER_PATH)
    classifier = load_classifier(CLASSIFIER_PATH)
    return vectorizer, classifier


def add_resume(filename: str, text: str) -> str:
    resume_id = str(uuid4())
    _RESUME_STORE[resume_id] = ResumeRecord(resume_id=resume_id, filename=filename, text=text)
    return resume_id


def get_resumes(resume_ids: Iterable[str] | None = None) -> list[ResumeRecord]:
    if resume_ids is None:
        return list(_RESUME_STORE.values())

    records: list[ResumeRecord] = []
    for resume_id in resume_ids:
        if resume_id in _RESUME_STORE:
            records.append(_RESUME_STORE[resume_id])
    return records


def get_store_size() -> int:
    return len(_RESUME_STORE)


def _predict_category(vectorizer, classifier, resume_text: str) -> str:
    features = vectorizer.transform([resume_text])
    return str(classifier.predict(features)[0])


def _compute_ats_score(vectorizer, resume_text: str, job_description: str) -> float:
    vectors = vectorizer.transform([resume_text, job_description])
    score = cosine_similarity(vectors[0], vectors[1])[0][0]
    return float(np.clip(score * 100.0, 0.0, 100.0))


def analyze_resume_against_job(resume: ResumeRecord, job_description: str) -> dict:
    vectorizer, classifier = _get_models()
    ats_score = round(_compute_ats_score(vectorizer, resume.text, job_description), 2)
    category = _predict_category(vectorizer, classifier, resume.text)
    extracted = extract_skills(resume.text)
    missing = missing_skills(resume.text, job_description)

    return {
        "resume_id": resume.resume_id,
        "filename": resume.filename,
        "ats_score": ats_score,
        "predicted_category": category,
        "extracted_skills": extracted,
        "missing_skills": missing,
    }


def match_and_rank(job_description: str, resume_ids: list[str] | None = None) -> list[dict]:
    if not job_description or not str(job_description).strip():
        raise HTTPException(status_code=400, detail="job_description is required.")

    resumes = get_resumes(resume_ids)
    if not resumes:
        raise HTTPException(
            status_code=400,
            detail="No resumes available. Upload resumes first via /upload-resumes.",
        )

    results = [analyze_resume_against_job(resume, job_description) for resume in resumes]
    results.sort(key=lambda item: item["ats_score"], reverse=True)

    for index, item in enumerate(results, start=1):
        item["rank"] = index

    return results

