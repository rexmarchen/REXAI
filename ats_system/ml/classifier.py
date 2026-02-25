from __future__ import annotations

from pathlib import Path

import joblib
from sklearn.linear_model import LogisticRegression


def build_classifier() -> LogisticRegression:
    return LogisticRegression(
        max_iter=3000,
        random_state=42,
        class_weight="balanced",
    )


def save_classifier(classifier: LogisticRegression, path: str | Path) -> None:
    path = Path(path)
    path.parent.mkdir(parents=True, exist_ok=True)
    joblib.dump(classifier, path)


def load_classifier(path: str | Path) -> LogisticRegression:
    return joblib.load(Path(path))

