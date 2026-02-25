from __future__ import annotations

from typing import Any

import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

from ..service.skill_extractor import extract_skills


class ATSScorer:
    """Score resume for ATS compatibility against a job description."""

    def __init__(self, vectorizer: TfidfVectorizer | None = None):
        self.vectorizer = vectorizer

    def _safe_similarity(self, resume_text: str, job_description: str) -> float:
        if not resume_text.strip() or not job_description.strip():
            return 0.0

        try:
            if self.vectorizer is not None and hasattr(self.vectorizer, "vocabulary_"):
                vectors = self.vectorizer.transform([resume_text, job_description])
                return float(cosine_similarity(vectors[0], vectors[1])[0][0])
        except Exception:
            pass

        transient_vectorizer = TfidfVectorizer(
            lowercase=True,
            stop_words="english",
            ngram_range=(1, 2),
            max_features=3000,
        )
        vectors = transient_vectorizer.fit_transform([resume_text, job_description])
        return float(cosine_similarity(vectors[0], vectors[1])[0][0])

    def _skill_coverage(self, resume_text: str, job_description: str) -> float:
        jd_skills = extract_skills(job_description)
        if not jd_skills:
            return 0.5

        resume_skill_set = set(item.lower() for item in extract_skills(resume_text))
        matched = sum(1 for skill in jd_skills if skill.lower() in resume_skill_set)
        return matched / len(jd_skills)

    def _structure_quality(self, resume_text: str) -> float:
        text_lower = resume_text.lower()
        score = 0.55

        if "experience" in text_lower:
            score += 0.12
        if "skills" in text_lower:
            score += 0.10
        if "education" in text_lower:
            score += 0.08
        if "project" in text_lower:
            score += 0.06

        if resume_text.count("|") > 6:
            score -= 0.08
        if resume_text.count("*") > 10:
            score -= 0.06
        if len(resume_text.split()) < 120:
            score -= 0.10

        return float(np.clip(score, 0.0, 1.0))

    def score(
        self,
        text: str,
        job_description: str,
        return_details: bool = False,
    ) -> float | dict[str, Any]:
        tfidf_similarity = self._safe_similarity(text, job_description)
        skill_coverage = self._skill_coverage(text, job_description)
        structure_quality = self._structure_quality(text)

        # Weighted score:
        # - semantic relevance (50%)
        # - skill coverage (35%)
        # - resume structure quality (15%)
        weighted = (
            (0.50 * tfidf_similarity)
            + (0.35 * skill_coverage)
            + (0.15 * structure_quality)
        ) * 100.0
        ats_score = float(np.clip(weighted, 0.0, 100.0))

        if not return_details:
            return round(ats_score, 2)

        return {
            "ats_score": round(ats_score, 2),
            "tfidf_similarity": round(tfidf_similarity * 100.0, 2),
            "skill_coverage": round(skill_coverage * 100.0, 2),
            "structure_quality": round(structure_quality * 100.0, 2),
        }
