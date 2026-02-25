from __future__ import annotations

import csv
import threading
from dataclasses import dataclass
from pathlib import Path
from typing import Iterable
from uuid import uuid4

import joblib
from fastapi import HTTPException
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression

from ..config import settings
from ..models.ats_scorer import ATSScorer
from .skill_extractor import extract_skills, missing_skills


@dataclass
class ResumeRecord:
    resume_id: str
    filename: str
    text: str


_MODEL_LOCK = threading.Lock()
_RESUME_STORE: dict[str, ResumeRecord] = {}
_ATS_SAMPLE_DATA = [
    (
        "Built machine learning pipelines in Python with TensorFlow and scikit-learn on AWS.",
        "AI",
    ),
    ("Built backend APIs with Node.js, Express.js, MongoDB and REST APIs.", "Backend Development"),
    (
        "Developed responsive React and TypeScript web applications with REST API integration.",
        "Web Development",
    ),
    ("Automated deployments using Docker, Kubernetes, CI/CD and Terraform on AWS.", "DevOps"),
    ("Built Flutter and React Native mobile apps with Firebase integrations.", "Mobile Development"),
    ("Performed data analysis with SQL, Pandas, NumPy and dashboards in Tableau.", "Data Science"),
]


def _build_vectorizer(max_features: int = 5000) -> TfidfVectorizer:
    return TfidfVectorizer(
        lowercase=True,
        stop_words="english",
        ngram_range=(1, 2),
        max_features=max_features,
    )


def _build_classifier() -> LogisticRegression:
    return LogisticRegression(
        max_iter=3000,
        random_state=42,
        class_weight="balanced",
    )


def _load_training_data(dataset_path: Path) -> tuple[list[str], list[str]]:
    if dataset_path.exists():
        texts: list[str] = []
        labels: list[str] = []
        with dataset_path.open("r", encoding="utf-8", newline="") as file:
            reader = csv.DictReader(file)
            for row in reader:
                text = str(row.get("text", "")).strip()
                label = str(row.get("category", "")).strip()
                if text and label:
                    texts.append(text)
                    labels.append(label)
        if len(texts) >= 6 and len(set(labels)) >= 2:
            return texts, labels

    texts = [item[0] for item in _ATS_SAMPLE_DATA]
    labels = [item[1] for item in _ATS_SAMPLE_DATA]
    return texts, labels


def _train_and_save_models() -> None:
    texts, labels = _load_training_data(settings.ats_training_dataset_path)
    vectorizer = _build_vectorizer()
    classifier = _build_classifier()

    x_train = vectorizer.fit_transform(texts)
    classifier.fit(x_train, labels)

    settings.ats_vectorizer_path.parent.mkdir(parents=True, exist_ok=True)
    joblib.dump(vectorizer, settings.ats_vectorizer_path)
    joblib.dump(classifier, settings.ats_classifier_path)


def ensure_models_ready() -> None:
    with _MODEL_LOCK:
        if settings.ats_vectorizer_path.exists() and settings.ats_classifier_path.exists():
            return
        _train_and_save_models()


def get_models() -> tuple[TfidfVectorizer, LogisticRegression]:
    ensure_models_ready()
    vectorizer: TfidfVectorizer = joblib.load(settings.ats_vectorizer_path)
    classifier: LogisticRegression = joblib.load(settings.ats_classifier_path)
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


def predict_category(text: str) -> str:
    vectorizer, classifier = get_models()
    features = vectorizer.transform([text])
    return str(classifier.predict(features)[0])


def analyze_resume_against_job(resume: ResumeRecord, job_description: str) -> dict:
    vectorizer, _ = get_models()
    scorer = ATSScorer(vectorizer=vectorizer)

    score_details = scorer.score(resume.text, job_description=job_description, return_details=True)
    extracted = extract_skills(resume.text)
    missing = missing_skills(resume.text, job_description)
    category = predict_category(resume.text)

    return {
        "resume_id": resume.resume_id,
        "filename": resume.filename,
        "ats_score": score_details["ats_score"],
        "predicted_category": category,
        "extracted_skills": extracted,
        "missing_skills": missing,
        "score_breakdown": {
            "tfidf_similarity": score_details["tfidf_similarity"],
            "skill_coverage": score_details["skill_coverage"],
            "structure_quality": score_details["structure_quality"],
        },
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

    for index, result in enumerate(results, start=1):
        result["rank"] = index
    return results

