from __future__ import annotations

from pathlib import Path
from typing import Any, List

import joblib
from sklearn.feature_extraction.text import TfidfVectorizer


FALLBACK_CORPUS = [
    "python machine learning tensorflow pytorch nlp data scientist",
    "react javascript typescript html css frontend web developer",
    "node express api microservices sql mongodb backend developer",
    "docker kubernetes aws terraform ci cd devops engineer cloud",
]


class FeatureExtractor:
    """Extract features from text using a TF-IDF vectorizer."""

    def __init__(self, vectorizer_path: str | Path):
        """
        Initialize feature extractor with a pre-trained vectorizer.

        Args:
            vectorizer_path: Absolute path to the TF-IDF vectorizer joblib/pickle file
        """
        self.vectorizer_path = Path(vectorizer_path)
        self.vectorizer = self._load_or_build_vectorizer()

    def _load_or_build_vectorizer(self) -> TfidfVectorizer:
        try:
            if self.vectorizer_path.exists():
                loaded = joblib.load(self.vectorizer_path)
                if hasattr(loaded, "transform") and hasattr(loaded, "vocabulary_"):
                    return loaded
        except Exception:
            pass

        vectorizer = TfidfVectorizer(
            lowercase=True,
            stop_words="english",
            ngram_range=(1, 2),
            max_features=2000,
        )
        vectorizer.fit(FALLBACK_CORPUS)
        return vectorizer

    def transform(self, texts: List[str]) -> Any:
        """
        Transform texts into feature vectors.

        Args:
            texts: List of text strings

        Returns:
            Feature vectors
        """
        return self.vectorizer.transform(texts)
