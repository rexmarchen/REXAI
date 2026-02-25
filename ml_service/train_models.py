"""
Train career prediction model from CSV resume dataset.

Usage:
  python train_models.py
  python train_models.py --dataset ../students_resume_dataset.csv
"""
from __future__ import annotations

import argparse
import csv
import json
import re
from collections import Counter
from datetime import datetime, timezone
from pathlib import Path
from typing import Iterable

import joblib
import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import accuracy_score, classification_report, f1_score
from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline


ROLE_LABEL_COLUMNS = (
    "career_path",
    "career",
    "job_role",
    "role",
    "target_role",
    "label",
    "predicted_role",
)

MIN_CLASS_SAMPLES = 30

ROLE_NORMALIZATION = {
    "data scientist": "Data Scientist",
    "ml engineer": "Data Scientist",
    "machine learning engineer": "Data Scientist",
    "backend": "Backend Developer",
    "backend developer": "Backend Developer",
    "frontend": "Frontend Developer",
    "frontend developer": "Frontend Developer",
    "full stack": "Full Stack Developer",
    "full stack developer": "Full Stack Developer",
    "devops": "DevOps Engineer",
    "devops engineer": "DevOps Engineer",
    "cloud architect": "Cloud Architect",
    "software engineer": "Software Engineer",
    "software developer": "Software Engineer",
}

ROLE_KEYWORDS = {
    "Data Scientist": {
        "skills": {
            "python": 2.0,
            "machine learning": 3.0,
            "tensorflow": 3.0,
            "numpy": 3.0,
            "pandas": 3.0,
            "data analysis": 2.5,
            "tableau": 2.0,
            "power bi": 2.0,
        },
        "projects": {
            "ai chatbot": 1.8,
            "face recognition system": 2.0,
            "sales prediction model": 2.2,
            "weather forecast app": 1.6,
        },
        "certifications": {
            "tensorflow developer certificate": 3.0,
            "google data analytics certificate": 2.4,
        },
    },
    "Backend Developer": {
        "skills": {
            "django": 3.0,
            "flask": 2.8,
            "node.js": 3.0,
            "java": 2.4,
            "sql": 2.0,
            "git": 1.0,
        },
        "projects": {
            "banking system": 1.8,
            "student management system": 1.7,
            "online exam system": 1.6,
        },
        "certifications": {
            "oracle java certification": 2.6,
        },
    },
    "Frontend Developer": {
        "skills": {
            "react": 3.0,
            "html": 2.5,
            "css": 2.5,
            "git": 1.0,
        },
        "projects": {
            "portfolio website": 2.0,
            "chat application": 1.4,
        },
        "certifications": {},
    },
    "DevOps Engineer": {
        "skills": {
            "docker": 3.0,
            "kubernetes": 3.0,
            "aws": 2.3,
            "azure": 2.3,
            "git": 1.6,
        },
        "projects": {
            "deployment": 1.0,
        },
        "certifications": {
            "certified kubernetes associate": 3.0,
            "red hat certified engineer": 3.0,
            "cisco networking certification": 2.0,
        },
    },
    "Cloud Architect": {
        "skills": {
            "aws": 3.2,
            "azure": 3.2,
            "docker": 1.7,
            "kubernetes": 1.7,
        },
        "projects": {},
        "certifications": {
            "aws certified cloud practitioner": 3.2,
            "microsoft azure fundamentals": 3.2,
        },
    },
    "Software Engineer": {
        "skills": {
            "c++": 2.0,
            "java": 1.7,
            "sql": 1.5,
            "git": 1.0,
        },
        "projects": {},
        "certifications": {},
    },
}


def _safe_text(value: object) -> str:
    return str(value or "").strip()


def _tokenize_csv_list(value: str) -> list[str]:
    return [item.strip().lower() for item in re.split(r"[,/;|]+", _safe_text(value)) if item.strip()]


def _normalize_role(role_text: str) -> str | None:
    raw = _safe_text(role_text)
    text = raw.lower()
    if not text:
        return None
    if text in ROLE_NORMALIZATION:
        return ROLE_NORMALIZATION[text]
    for key, value in ROLE_NORMALIZATION.items():
        if key in text:
            return value
    # Keep unseen labels for fully supervised datasets instead of dropping them.
    return " ".join(raw.split())


def infer_role_weakly(skills_text: str, projects_text: str, certification_text: str) -> str:
    skills = _tokenize_csv_list(skills_text)
    projects = _tokenize_csv_list(projects_text)
    cert = _safe_text(certification_text).lower()

    scores = {role: 0.0 for role in ROLE_KEYWORDS}
    for role, mapping in ROLE_KEYWORDS.items():
        for token in skills:
            scores[role] += mapping["skills"].get(token, 0.0)
        for token in projects:
            scores[role] += mapping["projects"].get(token, 0.0)
        scores[role] += mapping["certifications"].get(cert, 0.0)

    frontend_score = scores["Frontend Developer"]
    backend_score = scores["Backend Developer"]
    if frontend_score >= 4.0 and backend_score >= 4.0:
        scores["Full Stack Developer"] = 4.0 + (frontend_score + backend_score) * 0.35
    else:
        scores["Full Stack Developer"] = (frontend_score + backend_score) * 0.35

    role, best_score = max(scores.items(), key=lambda item: item[1])
    if best_score < 2.2:
        return "Software Engineer"
    return role


def build_resume_text(row: dict[str, str]) -> str:
    def first(*keys: str) -> str:
        for key in keys:
            value = _safe_text(row.get(key))
            if value:
                return value
        return ""

    return "\n".join(
        [
            f"Education: {first('education_level', 'Education')}",
            f"Major: {first('major', 'Major')}",
            f"Institution: {first('institution', 'Institution')}",
            f"Institution Tier: {first('institution_tier', 'Institution Tier')}",
            f"GPA: {first('gpa', 'GPA')}",
            f"Skills: {first('skills', 'Skills')}",
            f"Projects: {first('projects', 'Projects')}",
            f"Internships Count: {first('internships_count', 'Internships Count')}",
            f"Internship Companies: {first('internship_companies', 'Internship Companies')}",
            f"Experience Years: {first('work_experience_years', 'Experience Years')}",
            f"Experience Level: {first('experience_level', 'Experience Level')}",
            f"Certifications: {first('certifications', 'Certification')}",
            f"Preferred Locations: {first('preferred_locations', 'Preferred Locations')}",
        ]
    )


def detect_label_column(fieldnames: Iterable[str]) -> str | None:
    normalized = {str(name).strip().lower(): name for name in fieldnames}
    for candidate in ROLE_LABEL_COLUMNS:
        if candidate in normalized:
            return str(normalized[candidate])
    return None


def load_training_samples(dataset_path: Path) -> tuple[list[str], list[str], str]:
    if not dataset_path.exists():
        raise FileNotFoundError(f"Dataset not found: {dataset_path}")

    texts: list[str] = []
    labels: list[str] = []
    dedupe_keys: set[tuple[str, str]] = set()

    with dataset_path.open("r", encoding="utf-8", newline="") as file:
        reader = csv.DictReader(file)
        if not reader.fieldnames:
            raise ValueError("CSV has no headers.")

        label_column = detect_label_column(reader.fieldnames)
        label_source = f"column:{label_column}" if label_column else "weak-labeling"

        for row in reader:
            text = build_resume_text(row)
            if len(text) < 20:
                continue

            if label_column:
                label = _normalize_role(_safe_text(row.get(label_column)))
                if not label:
                    continue
            else:
                label = infer_role_weakly(
                    skills_text=_safe_text(row.get("Skills")),
                    projects_text=_safe_text(row.get("Projects")),
                    certification_text=_safe_text(row.get("Certification")),
                )

            key = (text, label)
            if key in dedupe_keys:
                continue
            dedupe_keys.add(key)
            texts.append(text)
            labels.append(label)

    if len(texts) < 200:
        raise ValueError(
            "Not enough training data after cleaning. Need at least 200 labeled samples."
        )
    return texts, labels, label_source


def build_candidate_pipelines() -> list[tuple[str, Pipeline]]:
    configs = [
        ("lr_c1", 1.0, (1, 2), 12000),
        ("lr_c2", 2.0, (1, 2), 18000),
        ("lr_c3", 3.0, (1, 3), 24000),
    ]

    candidates: list[tuple[str, Pipeline]] = []
    for name, c_value, ngram_range, max_features in configs:
        pipeline = Pipeline(
            steps=[
                (
                    "vectorizer",
                    TfidfVectorizer(
                        lowercase=True,
                        strip_accents="unicode",
                        stop_words="english",
                        ngram_range=ngram_range,
                        min_df=2,
                        max_df=0.97,
                        max_features=max_features,
                        sublinear_tf=True,
                    ),
                ),
                (
                    "classifier",
                    LogisticRegression(
                        C=c_value,
                        max_iter=3500,
                        class_weight="balanced",
                        random_state=42,
                        solver="lbfgs",
                    ),
                ),
            ]
        )
        candidates.append((name, pipeline))
    return candidates


def choose_best_pipeline(
    x_train: list[str],
    y_train: list[str],
    x_val: list[str],
    y_val: list[str],
) -> tuple[str, Pipeline, dict[str, float]]:
    best_name = ""
    best_pipeline: Pipeline | None = None
    best_metrics: dict[str, float] = {}
    best_score = -1.0

    for name, pipeline in build_candidate_pipelines():
        pipeline.fit(x_train, y_train)
        preds = pipeline.predict(x_val)
        macro_f1 = f1_score(y_val, preds, average="macro", zero_division=0)
        weighted_f1 = f1_score(y_val, preds, average="weighted", zero_division=0)
        accuracy = accuracy_score(y_val, preds)
        metrics = {
            "macro_f1": float(macro_f1),
            "weighted_f1": float(weighted_f1),
            "accuracy": float(accuracy),
        }

        if macro_f1 > best_score:
            best_score = macro_f1
            best_name = name
            best_pipeline = pipeline
            best_metrics = metrics

    if best_pipeline is None:
        raise RuntimeError("Could not select a model candidate.")
    return best_name, best_pipeline, best_metrics


def save_artifacts(
    model_dir: Path,
    pipeline: Pipeline,
    metadata: dict,
) -> tuple[Path, Path, Path]:
    model_dir.mkdir(parents=True, exist_ok=True)

    vectorizer = pipeline.named_steps["vectorizer"]
    classifier = pipeline.named_steps["classifier"]

    vectorizer_path = model_dir / "tfidf_vectorizer.pkl"
    model_path = model_dir / "career_model.pkl"
    metadata_path = model_dir / "career_model_metadata.json"

    joblib.dump(vectorizer, vectorizer_path)
    joblib.dump(classifier, model_path)
    metadata_path.write_text(json.dumps(metadata, indent=2), encoding="utf-8")
    return model_path, vectorizer_path, metadata_path


def train(dataset_path: Path) -> dict:
    texts, labels, label_source = load_training_samples(dataset_path)
    initial_distribution = Counter(labels)

    filtered_texts: list[str] = []
    filtered_labels: list[str] = []
    dropped_rows = 0
    for text, label in zip(texts, labels):
        if initial_distribution[label] < MIN_CLASS_SAMPLES:
            dropped_rows += 1
            continue
        filtered_texts.append(text)
        filtered_labels.append(label)

    texts = filtered_texts
    labels = filtered_labels
    label_distribution = Counter(labels)
    if len(label_distribution) < 2:
        raise ValueError("Dataset needs at least 2 classes for classification.")

    x_trainval, x_test, y_trainval, y_test = train_test_split(
        texts,
        labels,
        test_size=0.15,
        random_state=42,
        stratify=labels,
    )
    x_train, x_val, y_train, y_val = train_test_split(
        x_trainval,
        y_trainval,
        test_size=0.1765,  # 15% of full dataset
        random_state=42,
        stratify=y_trainval,
    )

    best_name, best_pipeline, val_metrics = choose_best_pipeline(
        x_train=x_train,
        y_train=y_train,
        x_val=x_val,
        y_val=y_val,
    )

    # Retrain selected configuration on train+val for final model.
    best_pipeline.fit(x_trainval, y_trainval)
    test_preds = best_pipeline.predict(x_test)

    test_metrics = {
        "accuracy": float(accuracy_score(y_test, test_preds)),
        "macro_f1": float(f1_score(y_test, test_preds, average="macro", zero_division=0)),
        "weighted_f1": float(f1_score(y_test, test_preds, average="weighted", zero_division=0)),
    }
    report = classification_report(y_test, test_preds, output_dict=True, zero_division=0)

    model_dir = Path(__file__).resolve().parent / "data" / "models"
    metadata = {
        "trained_at_utc": datetime.now(timezone.utc).isoformat(),
        "dataset_path": str(dataset_path.resolve()),
        "label_source": label_source,
        "dataset_rows": len(texts),
        "dropped_rows_rare_classes": dropped_rows,
        "num_classes": len(label_distribution),
        "initial_label_distribution": dict(initial_distribution),
        "label_distribution": dict(label_distribution),
        "split_sizes": {
            "train": len(x_train),
            "val": len(x_val),
            "test": len(x_test),
            "trainval": len(x_trainval),
        },
        "selected_model": best_name,
        "validation_metrics": val_metrics,
        "test_metrics": test_metrics,
        "classification_report": report,
    }
    model_path, vectorizer_path, metadata_path = save_artifacts(
        model_dir=model_dir,
        pipeline=best_pipeline,
        metadata=metadata,
    )

    return {
        "model_path": model_path,
        "vectorizer_path": vectorizer_path,
        "metadata_path": metadata_path,
        "label_source": label_source,
        "dataset_rows": len(texts),
        "dropped_rows_rare_classes": dropped_rows,
        "num_classes": len(label_distribution),
        "selected_model": best_name,
        "validation_metrics": val_metrics,
        "test_metrics": test_metrics,
    }


def parse_args() -> argparse.Namespace:
    default_dataset = Path(__file__).resolve().parent.parent / "students_resume_dataset.csv"
    parser = argparse.ArgumentParser(description="Train career prediction model from CSV dataset.")
    parser.add_argument(
        "--dataset",
        type=Path,
        default=default_dataset,
        help="Path to dataset CSV file.",
    )
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    result = train(args.dataset)
    print("Training complete")
    print(f"  label_source: {result['label_source']}")
    print(f"  dataset_rows: {result['dataset_rows']}")
    print(f"  num_classes: {result['num_classes']}")
    print(f"  selected_model: {result['selected_model']}")
    print(f"  validation_macro_f1: {result['validation_metrics']['macro_f1']:.4f}")
    print(f"  test_macro_f1: {result['test_metrics']['macro_f1']:.4f}")
    print(f"  model: {result['model_path']}")
    print(f"  vectorizer: {result['vectorizer_path']}")
    print(f"  metadata: {result['metadata_path']}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
