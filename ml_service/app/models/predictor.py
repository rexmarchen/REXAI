from __future__ import annotations

import re
import warnings
from pathlib import Path
from typing import List, Tuple

import joblib
import numpy as np
from sklearn.linear_model import LogisticRegression


class CareerPredictor:
    def __init__(self, model_path: str | Path | None = None):
        self.model = None
        self.classes_ = None
        if model_path:
            try:
                loaded_model = joblib.load(Path(model_path))
                self._apply_model_compatibility(loaded_model)
                self.model = loaded_model
                self.classes_ = self.model.classes_ if hasattr(self.model, "classes_") else None
            except Exception:
                self.model = None
                self.classes_ = None

    def _apply_model_compatibility(self, model) -> None:
        """
        Patch known sklearn model attribute gaps that can happen when
        loading artifacts trained with a different sklearn version.
        """
        if isinstance(model, LogisticRegression):
            if not hasattr(model, "multi_class"):
                model.multi_class = "auto"
            if not hasattr(model, "n_features_in_") and hasattr(model, "coef_"):
                model.n_features_in_ = model.coef_.shape[1]

    # Skill to career mapping for intelligent guessing when no model is trained.
    SKILL_CAREER_MAP = {
        "python": "Data Scientist",
        "django": "Backend Developer",
        "fastapi": "Backend Developer",
        "nodejs": "Backend Developer",
        "node": "Backend Developer",
        "react": "Frontend Developer",
        "vue": "Frontend Developer",
        "angular": "Frontend Developer",
        "typescript": "Frontend Developer",
        "javascript": "Frontend Developer",
        "aws": "DevOps Engineer",
        "kubernetes": "DevOps Engineer",
        "docker": "DevOps Engineer",
        "terraform": "DevOps Engineer",
        "sql": "Database Administrator",
        "mongodb": "Backend Developer",
        "postgresql": "Backend Developer",
        "machine learning": "Data Scientist",
        "tensorflow": "Data Scientist",
        "pytorch": "Data Scientist",
        "deep learning": "Data Scientist",
        "nlp": "Data Scientist",
        "java": "Backend Developer",
        "c++": "Software Engineer",
        "golang": "Backend Developer",
        "rust": "Systems Engineer",
        "product": "Product Manager",
        "leadership": "Product Manager",
        "management": "Project Manager",
        "agile": "Project Manager",
    }

    CAREER_PATHS = [
        "Software Engineer",
        "Frontend Developer",
        "Backend Developer",
        "Full Stack Developer",
        "Data Scientist",
        "Data Engineer",
        "DevOps Engineer",
        "Cloud Architect",
        "Product Manager",
        "Project Manager",
        "Systems Engineer",
        "Database Administrator",
        "Mobile Developer",
        "QA Engineer",
    ]

    def train(self, X, y):
        self.model = LogisticRegression(max_iter=1000, class_weight="balanced")
        self.model.fit(X, y)
        self.classes_ = self.model.classes_
        return self

    def _heuristic_predict(self, text: str) -> Tuple[str, float]:
        """
        Predict career path based on skills found in resume text
        when no trained model is available.
        """
        cleaned_text = re.sub(r"[^a-zA-Z0-9\s]", " ", text.lower())
        skill_scores: dict[str, int] = {}

        for skill, career in self.SKILL_CAREER_MAP.items():
            count = cleaned_text.count(skill)
            if count > 0:
                skill_scores[career] = skill_scores.get(career, 0) + count

        if skill_scores:
            best_career = max(skill_scores.items(), key=lambda item: item[1])
            confidence = min(0.95, 0.5 + (best_career[1] / max(1, len(text) / 100)))
            return best_career[0], confidence
        return "Software Engineer", 0.45

    def predict(self, X) -> Tuple[List[str], List[float]]:
        """
        Predict career paths from feature vectors.
        Falls back to a deterministic low-confidence default if model inference fails.
        """
        if self.model is not None:
            try:
                preds = self.model.predict(X)
                if hasattr(self.model, "predict_proba"):
                    probs = self.model.predict_proba(X).max(axis=1)
                else:
                    probs = np.full(shape=len(preds), fill_value=0.55, dtype=float)
                return preds, probs
            except Exception as error:
                warnings.warn(
                    f"Career model inference failed ({error}). Falling back to default predictions."
                )

        default_career = "Software Engineer"
        if self.classes_ is not None and len(self.classes_) > 0 and default_career not in self.classes_:
            default_career = str(self.classes_[0])
        row_count = int(getattr(X, "shape", [1])[0])
        predictions = [default_career] * row_count
        probabilities = [0.35] * row_count
        return predictions, probabilities

    def save(self, path):
        joblib.dump(self.model, path)
