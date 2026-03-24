from __future__ import annotations

from pathlib import Path
from typing import Iterable

import joblib
from sklearn.feature_extraction.text import TfidfVectorizer


def build_vectorizer(max_features: int = 5000) -> TfidfVectorizer:
    return TfidfVectorizer(
        lowercase=True,
        stop_words="english",
        ngram_range=(1, 2),
        max_features=max_features,
    )


def fit_vectorizer(texts: Iterable[str]) -> TfidfVectorizer:
    vectorizer = build_vectorizer()
    vectorizer.fit(list(texts))
    return vectorizer


def save_vectorizer(vectorizer: TfidfVectorizer, path: str | Path) -> None:
    path = Path(path)
    path.parent.mkdir(parents=True, exist_ok=True)
    joblib.dump(vectorizer, path)


def load_vectorizer(path: str | Path) -> TfidfVectorizer:
    return joblib.load(Path(path))

