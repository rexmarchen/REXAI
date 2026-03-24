"""
Train career prediction model from CSV resume dataset.

Usage:
  python train_models.py
  python train_models.py --dataset data/datasets/students_resume_dataset.csv
"""
from __future__ import annotations

import argparse
import csv
import json
import re
from collections import Counter
from datetime import datetime, timezone
from pathlib import Path
from typing import Iterable, Sequence

import joblib
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import accuracy_score, classification_report, f1_score
from sklearn.model_selection import GridSearchCV, StratifiedKFold, train_test_split
from sklearn.pipeline import Pipeline


ROLE_LABEL_COLUMNS = (
    "career_path",
    "career",
    "job_role",
    "role",
    "target_role",
    "target_job_role",
    "target role",
    "label",
    "predicted_role",
    "category",
)

MIN_CLASS_SAMPLES = 30
DEFAULT_MIN_TEST_ACCURACY = 0.90
RANDOM_STATE = 42

ROLE_NORMALIZATION = {
    "data scientist": "Data Scientist",
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
    "web developer": "Web Developer",
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

IGNORED_EXTRA_TEXT_COLUMNS = {
    "id",
    "studentid",
    "userid",
    "resumeid",
    "pincode",
    "dataversion",
    "targetrole",
    "targetjobrole",
    "careerpath",
    "career",
    "jobrole",
    "label",
    "predictedrole",
    "category",
}


def _safe_text(value: object) -> str:
    return str(value or "").strip()


def _normalize_column_key(value: str) -> str:
    return re.sub(r"[^a-z0-9]+", "", _safe_text(value).lower())


def _tokenize_csv_list(value: str) -> list[str]:
    return [item.strip().lower() for item in re.split(r"[,/;|]+", _safe_text(value)) if item.strip()]


def _build_row_index(row: dict[str, str]) -> dict[str, str]:
    indexed: dict[str, str] = {}
    for key, value in row.items():
        normalized = _normalize_column_key(str(key))
        if not normalized:
            continue
        text = _safe_text(value)
        if text and normalized not in indexed:
            indexed[normalized] = text
    return indexed


def _first_row_value(row_index: dict[str, str], aliases: Sequence[str]) -> str:
    for alias in aliases:
        value = row_index.get(_normalize_column_key(alias), "")
        if value:
            return value
    return ""


def _normalize_role(role_text: str, *, prefer_mapping: bool) -> str | None:
    raw = _safe_text(role_text)
    text = raw.lower()
    if not text:
        return None

    # For supervised datasets, keep the original label semantics and only clean whitespace.
    if not prefer_mapping:
        return " ".join(raw.split())

    if text in ROLE_NORMALIZATION:
        return ROLE_NORMALIZATION[text]
    for key, value in ROLE_NORMALIZATION.items():
        if key in text:
            return value
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


def build_resume_text(row: dict[str, str], label_column: str | None) -> str:
    row_index = _build_row_index(row)
    lines: list[str] = []
    used_keys: set[str] = set()

    canonical_fields: list[tuple[str, tuple[str, ...]]] = [
        ("Resume", ("resume_text", "resume", "profile_summary", "summary")),
        ("Name", ("name", "full_name", "candidate_name")),
        ("Education", ("education", "education_level", "degree")),
        ("Major", ("major", "specialization")),
        ("Institution", ("institution", "college", "university")),
        ("Skills", ("skills", "skill_set", "technical_skills")),
        ("Projects", ("projects", "project")),
        ("Experience Years", ("work_experience_years", "experience_years", "years_experience", "years_of_experience")),
        ("Experience Level", ("experience_level", "seniority")),
        ("Certifications", ("certifications", "certification")),
        ("Interests", ("interests", "interest")),
        ("Hobbies", ("hobbies", "hobby")),
        ("Preferred Locations", ("preferred_locations", "city", "state", "location")),
    ]

    for title, aliases in canonical_fields:
        value = _first_row_value(row_index, aliases)
        if not value:
            continue
        lines.append(f"{title}: {value}")
        used_keys.update(_normalize_column_key(alias) for alias in aliases)

    ignored = set(IGNORED_EXTRA_TEXT_COLUMNS)
    ignored.update(used_keys)
    if label_column:
        ignored.add(_normalize_column_key(label_column))

    for key, value in row.items():
        text = _safe_text(value)
        if not text:
            continue
        normalized = _normalize_column_key(str(key))
        if normalized in ignored:
            continue
        if len(text) > 3000:
            text = text[:3000]
        pretty_key = " ".join(str(key).replace("_", " ").split()).title()
        lines.append(f"{pretty_key}: {text}")

    return "\n".join(lines)


def detect_label_column(fieldnames: Iterable[str]) -> str | None:
    normalized_to_original = {_normalize_column_key(str(name)): str(name) for name in fieldnames}
    for candidate in ROLE_LABEL_COLUMNS:
        normalized = _normalize_column_key(candidate)
        if normalized in normalized_to_original:
            return normalized_to_original[normalized]
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
            text = build_resume_text(row, label_column=label_column)
            if len(text) < 20:
                continue

            if label_column:
                label = _normalize_role(_safe_text(row.get(label_column)), prefer_mapping=False)
                if not label:
                    continue
            else:
                row_index = _build_row_index(row)
                label = infer_role_weakly(
                    skills_text=_first_row_value(row_index, ("skills", "skill_set", "technical_skills")),
                    projects_text=_first_row_value(row_index, ("projects", "project")),
                    certification_text=_first_row_value(row_index, ("certification", "certifications")),
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


def _build_search_space() -> tuple[Pipeline, dict[str, list]]:
    base_pipeline = Pipeline(
        steps=[
            (
                "vectorizer",
                TfidfVectorizer(
                    lowercase=True,
                    strip_accents="unicode",
                    stop_words="english",
                    max_df=0.97,
                    sublinear_tf=True,
                ),
            ),
            (
                "classifier",
                LogisticRegression(
                    max_iter=3500,
                    class_weight="balanced",
                    random_state=RANDOM_STATE,
                    solver="lbfgs",
                ),
            ),
        ]
    )

    param_grid = {
        "vectorizer__ngram_range": [(1, 2), (1, 3)],
        "vectorizer__min_df": [1, 2],
        "vectorizer__max_features": [15000, 25000],
        "classifier__C": [1.0, 2.5, 5.0],
    }
    return base_pipeline, param_grid


def choose_best_pipeline(
    x_trainval: list[str],
    y_trainval: list[str],
) -> tuple[str, Pipeline, dict[str, float], list[dict[str, float]], dict]:
    base_pipeline, param_grid = _build_search_space()
    cv = StratifiedKFold(n_splits=3, shuffle=True, random_state=RANDOM_STATE)
    search = GridSearchCV(
        estimator=base_pipeline,
        param_grid=param_grid,
        scoring="f1_macro",
        cv=cv,
        refit=True,
        n_jobs=1,
        verbose=1,
        return_train_score=False,
    )
    search.fit(x_trainval, y_trainval)

    results = search.cv_results_
    best_index = int(search.best_index_)
    candidate_scores: list[dict[str, float]] = []
    for idx, params in enumerate(results["params"]):
        candidate_scores.append(
            {
                "rank": int(results["rank_test_score"][idx]),
                "mean_macro_f1": float(results["mean_test_score"][idx]),
                "std_macro_f1": float(results["std_test_score"][idx]),
                "params": params,
            }
        )
    candidate_scores.sort(key=lambda row: row["rank"])
    top_candidates = candidate_scores[:5]

    metrics = {
        "macro_f1_mean": float(search.best_score_),
        "macro_f1_std": float(results["std_test_score"][best_index]),
        "cv_folds": float(cv.get_n_splits()),
        "candidates_evaluated": float(len(results["params"])),
    }

    best_pipeline: Pipeline = search.best_estimator_
    best_name = "logreg_gridsearch_cv"
    best_params = search.best_params_
    return best_name, best_pipeline, metrics, top_candidates, best_params


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


def train(dataset_path: Path, min_test_accuracy: float = 0.0) -> dict:
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
        random_state=RANDOM_STATE,
        stratify=labels,
    )

    best_name, best_pipeline, cv_metrics, top_candidates, best_params = choose_best_pipeline(
        x_trainval=x_trainval,
        y_trainval=y_trainval,
    )

    test_preds = best_pipeline.predict(x_test)
    test_metrics = {
        "accuracy": float(accuracy_score(y_test, test_preds)),
        "macro_f1": float(f1_score(y_test, test_preds, average="macro", zero_division=0)),
        "weighted_f1": float(f1_score(y_test, test_preds, average="weighted", zero_division=0)),
    }
    report = classification_report(y_test, test_preds, output_dict=True, zero_division=0)

    if min_test_accuracy > 0 and test_metrics["accuracy"] < min_test_accuracy:
        raise RuntimeError(
            f"Test accuracy {test_metrics['accuracy']:.4f} is below required threshold "
            f"{min_test_accuracy:.4f}."
        )

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
            "trainval": len(x_trainval),
            "test": len(x_test),
        },
        "selected_model": best_name,
        "selected_params": best_params,
        "cv_metrics": cv_metrics,
        "top_cv_candidates": top_candidates,
        "minimum_required_test_accuracy": float(min_test_accuracy),
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
        "selected_params": best_params,
        "cv_metrics": cv_metrics,
        "test_metrics": test_metrics,
    }


def parse_args() -> argparse.Namespace:
    default_dataset = Path(__file__).resolve().parent / "data" / "datasets" / "students_resume_dataset.csv"
    parser = argparse.ArgumentParser(description="Train career prediction model from CSV dataset.")
    parser.add_argument(
        "--dataset",
        type=Path,
        default=default_dataset,
        help="Path to dataset CSV file.",
    )
    parser.add_argument(
        "--min-test-accuracy",
        type=float,
        default=DEFAULT_MIN_TEST_ACCURACY,
        help="Minimum holdout test accuracy required for successful training.",
    )
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    result = train(args.dataset, min_test_accuracy=args.min_test_accuracy)
    print("Training complete")
    print(f"  label_source: {result['label_source']}")
    print(f"  dataset_rows: {result['dataset_rows']}")
    print(f"  num_classes: {result['num_classes']}")
    print(f"  selected_model: {result['selected_model']}")
    print(f"  selected_params: {result['selected_params']}")
    print(f"  cv_macro_f1_mean: {result['cv_metrics']['macro_f1_mean']:.4f}")
    print(f"  test_accuracy: {result['test_metrics']['accuracy']:.4f}")
    print(f"  test_macro_f1: {result['test_metrics']['macro_f1']:.4f}")
    print(f"  model: {result['model_path']}")
    print(f"  vectorizer: {result['vectorizer_path']}")
    print(f"  metadata: {result['metadata_path']}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
