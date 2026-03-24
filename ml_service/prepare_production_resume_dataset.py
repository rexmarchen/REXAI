"""Build a balanced production training dataset from the repo's resume CSVs."""

from __future__ import annotations

import argparse
import json
import re
from dataclasses import dataclass
from hashlib import sha256
from pathlib import Path
from typing import Any

import pandas as pd

ROLE_ORDER = (
    "Software Engineer",
    "Data Scientist",
    "Web Developer",
    "DevOps Engineer",
)
SOURCE_PRIORITY = {
    "resume_dataset": 0,
    "resume_dataset_10k": 1,
    "students_resume_dataset": 2,
}

SKILL_WEIGHTS: dict[str, dict[str, float]] = {
    "Software Engineer": {
        "java": 2.4,
        "c++": 2.6,
        "c": 1.5,
        "django": 1.9,
        "flask": 1.8,
        "node.js": 1.7,
        "node": 1.5,
        "sql": 1.5,
        "mongodb": 1.2,
        "firebase": 1.1,
        "git": 0.8,
        "linux": 0.9,
    },
    "Data Scientist": {
        "python": 1.8,
        "machine learning": 3.2,
        "deep learning": 3.2,
        "tensorflow": 3.0,
        "pytorch": 3.0,
        "numpy": 2.4,
        "pandas": 2.4,
        "nlp": 3.0,
        "tableau": 1.8,
        "power bi": 1.8,
        "excel": 1.0,
        "sql": 1.0,
    },
    "Web Developer": {
        "react": 3.0,
        "javascript": 2.8,
        "html": 2.5,
        "css": 2.5,
        "typescript": 2.4,
        "node.js": 1.4,
        "firebase": 1.3,
        "django": 0.8,
        "flask": 0.6,
    },
    "DevOps Engineer": {
        "docker": 3.0,
        "kubernetes": 3.0,
        "aws": 2.7,
        "azure": 2.7,
        "linux": 1.7,
        "ci/cd": 3.0,
        "terraform": 3.0,
        "jenkins": 2.8,
        "ansible": 2.8,
        "git": 1.0,
    },
}

INTEREST_WEIGHTS: dict[str, dict[str, float]] = {
    "Software Engineer": {
        "backend development": 2.2,
        "software development": 2.0,
        "cyber security": 1.2,
    },
    "Data Scientist": {
        "artificial intelligence": 2.8,
        "data analysis": 2.6,
    },
    "Web Developer": {
        "frontend development": 2.8,
        "web development": 2.8,
        "ui ux": 2.0,
    },
    "DevOps Engineer": {
        "cloud computing": 2.8,
        "automation": 2.5,
        "devops": 3.0,
    },
}

PROJECT_WEIGHTS: dict[str, dict[str, float]] = {
    "Software Engineer": {
        "banking system": 1.6,
        "student management system": 1.6,
        "online exam system": 1.5,
    },
    "Data Scientist": {
        "machine learning prediction system": 2.4,
        "face recognition system": 2.4,
        "sales prediction model": 2.5,
        "weather forecast app": 1.3,
        "nlp pipeline": 2.4,
    },
    "Web Developer": {
        "portfolio website": 2.2,
        "chat application": 1.8,
        "responsive web dashboard": 2.4,
        "e-commerce website": 1.4,
        "web app": 1.8,
    },
    "DevOps Engineer": {
        "ci/cd pipeline": 2.8,
        "cloud deployment": 2.8,
        "containerized app": 2.6,
        "deployment": 1.2,
    },
}

CERTIFICATION_WEIGHTS: dict[str, dict[str, float]] = {
    "Software Engineer": {
        "oracle java certification": 1.8,
    },
    "Data Scientist": {
        "tensorflow developer certificate": 3.0,
        "google data analytics certificate": 2.5,
    },
    "Web Developer": {},
    "DevOps Engineer": {
        "aws certified developer": 2.4,
        "microsoft azure fundamentals": 2.4,
        "docker certified associate": 2.6,
        "cisco networking certification": 1.8,
    },
}

EDUCATION_WEIGHTS: dict[str, dict[str, float]] = {
    "Software Engineer": {
        "computer science": 1.0,
        "software engineering": 1.2,
        "it": 0.7,
    },
    "Data Scientist": {
        "ai": 1.5,
        "data science": 1.5,
        "machine learning": 1.5,
    },
    "Web Developer": {},
    "DevOps Engineer": {
        "cloud": 1.0,
    },
}

TEMPLATE_PATTERN = re.compile(
    r"^\s*Experienced in (?P<skills>.+?)\.\s*Worked on (?P<project>.+?)\.\s*(?P<years>[0-9]+(?:\.[0-9]+)?) years of experience\.?\s*$",
    re.IGNORECASE,
)


@dataclass
class PreparedRow:
    resume_id: str
    resume_text: str
    target_role: str
    years_experience: float
    seniority: str
    source_name: str
    source_priority: int
    label_strength: int
    label_confidence: float
    label_margin: float
    text_hash: str


def parse_args() -> argparse.Namespace:
    service_root = Path(__file__).resolve().parent
    data_dir = service_root / "data"
    datasets_dir = data_dir / "datasets"
    parser = argparse.ArgumentParser(description="Prepare a balanced production resume dataset from repo CSVs.")
    parser.add_argument("--resume-dataset", type=Path, default=datasets_dir / "resume_dataset.csv")
    parser.add_argument("--resume-dataset-10k", type=Path, default=datasets_dir / "resume_dataset_10k.csv")
    parser.add_argument("--students-dataset", type=Path, default=datasets_dir / "students_resume_dataset.csv")
    parser.add_argument("--output", type=Path, default=data_dir / "production_resume_dataset.csv")
    parser.add_argument("--report", type=Path, default=data_dir / "production_resume_dataset_report.json")
    parser.add_argument("--target-per-class", type=int, default=2000)
    parser.add_argument("--min-score", type=float, default=3.5)
    parser.add_argument("--min-margin", type=float, default=0.7)
    parser.add_argument("--min-required-per-class", type=int, default=1000)
    return parser.parse_args()


def _safe_text(value: object) -> str:
    return str(value or "").strip()


def _normalize_text(text: str) -> str:
    return re.sub(r"\s+", " ", str(text or "").strip())


def _text_hash(text: str) -> str:
    canonical = _normalize_text(text).lower()
    return sha256(canonical.encode("utf-8")).hexdigest()


def _safe_float(value: object, default: float = 0.0) -> float:
    try:
        return float(str(value).strip())
    except Exception:
        return default


def _seniority_from_years(years: float) -> str:
    if years <= 1.5:
        return "Junior"
    if years <= 4.0:
        return "Mid"
    return "Senior"


def _split_values(text: str) -> list[str]:
    return [item.strip().lower() for item in re.split(r"[,;|/]+", _safe_text(text)) if item.strip()]


def _add_phrase_scores(scores: dict[str, float], text: str, weights: dict[str, dict[str, float]]) -> None:
    haystack = _safe_text(text).lower()
    for role, mapping in weights.items():
        for phrase, weight in mapping.items():
            if phrase in haystack:
                scores[role] += float(weight)


def _infer_role(
    *,
    education: str,
    skills: str,
    projects: str,
    certification: str,
    interest: str,
) -> tuple[str, float, float, dict[str, float]]:
    scores = {role: 0.0 for role in ROLE_ORDER}

    for token in _split_values(skills):
        for role, mapping in SKILL_WEIGHTS.items():
            scores[role] += float(mapping.get(token, 0.0))

    _add_phrase_scores(scores, projects, PROJECT_WEIGHTS)
    _add_phrase_scores(scores, certification, CERTIFICATION_WEIGHTS)
    _add_phrase_scores(scores, interest, INTEREST_WEIGHTS)
    _add_phrase_scores(scores, education, EDUCATION_WEIGHTS)

    ordered = sorted(scores.items(), key=lambda item: item[1], reverse=True)
    best_role, best_score = ordered[0]
    second_score = ordered[1][1]
    return best_role, float(best_score), float(best_score - second_score), scores


def _canonical_resume_text(
    *,
    name: str = "",
    education: str = "",
    skills: str = "",
    interests: str = "",
    hobbies: str = "",
    projects: str = "",
    certification: str = "",
    years_experience: float = 0.0,
    seniority: str = "",
) -> str:
    lines = []
    if _safe_text(name):
        lines.append(f"Name: {_safe_text(name)}")
    if _safe_text(education):
        lines.append(f"Education: {_safe_text(education)}")
    if _safe_text(skills):
        lines.append(f"Skills: {_safe_text(skills)}")
    if _safe_text(interests):
        lines.append(f"Interests: {_safe_text(interests)}")
    if _safe_text(hobbies):
        lines.append(f"Hobbies: {_safe_text(hobbies)}")
    if _safe_text(projects):
        lines.append(f"Projects: {_safe_text(projects)}")
    if _safe_text(certification):
        lines.append(f"Certification: {_safe_text(certification)}")
    lines.append(f"Experience Years: {years_experience:.1f}")
    lines.append(f"Seniority: {seniority}")
    return "\n".join(lines)


def _rewrite_seed_resume_text(resume_text: str, years_experience: float, seniority: str) -> str:
    match = TEMPLATE_PATTERN.match(_safe_text(resume_text))
    if not match:
        return _canonical_resume_text(
            skills="",
            projects=resume_text,
            years_experience=years_experience,
            seniority=seniority,
        )

    return _canonical_resume_text(
        skills=match.group("skills"),
        projects=match.group("project"),
        years_experience=years_experience,
        seniority=seniority,
    )


def _make_prepared_row(
    *,
    resume_id: str,
    resume_text: str,
    target_role: str,
    years_experience: float,
    seniority: str,
    source_name: str,
    label_strength: int,
    label_confidence: float,
    label_margin: float,
) -> PreparedRow:
    clean_text = _normalize_text(resume_text)
    return PreparedRow(
        resume_id=resume_id,
        resume_text=clean_text,
        target_role=target_role,
        years_experience=float(years_experience),
        seniority=seniority,
        source_name=source_name,
        source_priority=SOURCE_PRIORITY[source_name],
        label_strength=int(label_strength),
        label_confidence=float(label_confidence),
        label_margin=float(label_margin),
        text_hash=_text_hash(clean_text),
    )


def _load_seed_rows(path: Path) -> list[PreparedRow]:
    df = pd.read_csv(path)
    rows: list[PreparedRow] = []
    for index, row in df.iterrows():
        target_role = _safe_text(row.get("target_role"))
        if target_role not in ROLE_ORDER:
            continue

        years_experience = _safe_float(row.get("years_experience"), default=0.0)
        seniority = _safe_text(row.get("seniority")) or _seniority_from_years(years_experience)
        resume_text = _rewrite_seed_resume_text(
            _safe_text(row.get("resume_text")),
            years_experience=years_experience,
            seniority=seniority,
        )
        rows.append(
            _make_prepared_row(
                resume_id=f"seed-{index + 1}",
                resume_text=resume_text,
                target_role=target_role,
                years_experience=years_experience,
                seniority=seniority,
                source_name="resume_dataset",
                label_strength=2,
                label_confidence=1000.0,
                label_margin=1000.0,
            )
        )
    return rows


def _load_resume_10k_rows(path: Path, min_score: float, min_margin: float) -> list[PreparedRow]:
    df = pd.read_csv(path)
    rows: list[PreparedRow] = []
    for index, row in df.iterrows():
        years_experience = _safe_float(row.get("experience_years"), default=0.0)
        seniority = _seniority_from_years(years_experience)
        role, score, margin, _ = _infer_role(
            education=_safe_text(row.get("education")),
            skills=_safe_text(row.get("skills")),
            projects=_safe_text(row.get("projects")),
            certification=_safe_text(row.get("certification")),
            interest=_safe_text(row.get("interest")),
        )
        if score < min_score or margin < min_margin:
            continue

        resume_text = _canonical_resume_text(
            name=_safe_text(row.get("name")),
            education=_safe_text(row.get("education")),
            skills=_safe_text(row.get("skills")),
            interests=_safe_text(row.get("interest")),
            hobbies=_safe_text(row.get("hobby")),
            projects=_safe_text(row.get("projects")),
            certification=_safe_text(row.get("certification")),
            years_experience=years_experience,
            seniority=seniority,
        )
        rows.append(
            _make_prepared_row(
                resume_id=f"r10k-{index + 1}",
                resume_text=resume_text,
                target_role=role,
                years_experience=years_experience,
                seniority=seniority,
                source_name="resume_dataset_10k",
                label_strength=1,
                label_confidence=score,
                label_margin=margin,
            )
        )
    return rows


def _load_students_rows(path: Path, min_score: float, min_margin: float) -> list[PreparedRow]:
    df = pd.read_csv(path)
    rows: list[PreparedRow] = []
    for index, row in df.iterrows():
        years_experience = _safe_float(row.get("Experience Years"), default=0.0)
        seniority = _seniority_from_years(years_experience)
        role, score, margin, _ = _infer_role(
            education=_safe_text(row.get("Education")),
            skills=_safe_text(row.get("Skills")),
            projects=_safe_text(row.get("Projects")),
            certification=_safe_text(row.get("Certification")),
            interest="",
        )
        if score < min_score or margin < min_margin:
            continue

        resume_text = _canonical_resume_text(
            name=_safe_text(row.get("Name")),
            education=_safe_text(row.get("Education")),
            skills=_safe_text(row.get("Skills")),
            projects=_safe_text(row.get("Projects")),
            certification=_safe_text(row.get("Certification")),
            years_experience=years_experience,
            seniority=seniority,
        )
        rows.append(
            _make_prepared_row(
                resume_id=f"students-{index + 1}",
                resume_text=resume_text,
                target_role=role,
                years_experience=years_experience,
                seniority=seniority,
                source_name="students_resume_dataset",
                label_strength=1,
                label_confidence=score,
                label_margin=margin,
            )
        )
    return rows


def _rows_to_dataframe(rows: list[PreparedRow]) -> pd.DataFrame:
    return pd.DataFrame(
        [
            {
                "resume_id": row.resume_id,
                "resume_text": row.resume_text,
                "target_role": row.target_role,
                "years_experience": row.years_experience,
                "seniority": row.seniority,
                "source_name": row.source_name,
                "source_priority": row.source_priority,
                "label_strength": row.label_strength,
                "label_confidence": row.label_confidence,
                "label_margin": row.label_margin,
                "text_hash": row.text_hash,
            }
            for row in rows
        ]
    )


def _class_counts(df: pd.DataFrame) -> dict[str, int]:
    counts = df["target_role"].value_counts().to_dict()
    return {role: int(counts.get(role, 0)) for role in ROLE_ORDER}


def _source_counts(df: pd.DataFrame) -> dict[str, dict[str, int]]:
    result: dict[str, dict[str, int]] = {}
    for source_name, group in df.groupby("source_name"):
        result[str(source_name)] = _class_counts(group)
    return result


def build_dataset(
    *,
    resume_dataset_path: Path,
    resume_dataset_10k_path: Path,
    students_dataset_path: Path,
    target_per_class: int,
    min_score: float,
    min_margin: float,
    min_required_per_class: int,
) -> tuple[pd.DataFrame, dict[str, Any]]:
    seed_rows = _load_seed_rows(resume_dataset_path)
    resume_10k_rows = _load_resume_10k_rows(resume_dataset_10k_path, min_score=min_score, min_margin=min_margin)
    students_rows = _load_students_rows(students_dataset_path, min_score=min_score, min_margin=min_margin)

    combined = _rows_to_dataframe(seed_rows + resume_10k_rows + students_rows)
    raw_rows = int(len(combined))

    combined = combined.sort_values(
        by=["label_strength", "label_confidence", "label_margin", "source_priority", "resume_id"],
        ascending=[False, False, False, True, True],
    ).reset_index(drop=True)

    deduped = combined.drop_duplicates(subset=["text_hash"], keep="first").reset_index(drop=True)
    deduped_rows = int(len(deduped))

    available_counts = _class_counts(deduped)
    effective_target = min(int(target_per_class), min(available_counts.values()))
    if effective_target < int(min_required_per_class):
        raise ValueError(
            f"Not enough balanced samples per class after preparation. "
            f"Available counts={available_counts}, effective_target={effective_target}."
        )

    selected_parts = []
    for role in ROLE_ORDER:
        role_df = deduped.loc[deduped["target_role"] == role].copy()
        role_df = role_df.sort_values(
            by=["label_strength", "label_confidence", "label_margin", "source_priority", "resume_id"],
            ascending=[False, False, False, True, True],
        )
        selected_parts.append(role_df.head(effective_target))

    final_df = pd.concat(selected_parts, ignore_index=True)
    final_df = final_df.sort_values(by=["target_role", "source_priority", "resume_id"]).reset_index(drop=True)

    report = {
        "source_paths": {
            "resume_dataset": str(resume_dataset_path.resolve()),
            "resume_dataset_10k": str(resume_dataset_10k_path.resolve()),
            "students_resume_dataset": str(students_dataset_path.resolve()),
        },
        "thresholds": {
            "min_score": float(min_score),
            "min_margin": float(min_margin),
            "requested_target_per_class": int(target_per_class),
            "selected_target_per_class": int(effective_target),
            "min_required_per_class": int(min_required_per_class),
        },
        "rows": {
            "combined_before_dedupe": raw_rows,
            "after_dedupe": deduped_rows,
            "final_balanced": int(len(final_df)),
        },
        "counts_before_dedupe": _class_counts(combined),
        "counts_after_dedupe": available_counts,
        "counts_final": _class_counts(final_df),
        "source_breakdown_before_dedupe": _source_counts(combined),
        "source_breakdown_after_dedupe": _source_counts(deduped),
        "source_breakdown_final": _source_counts(final_df),
    }

    final_output = final_df[["resume_id", "resume_text", "target_role", "years_experience", "seniority"]].copy()
    return final_output, report


def main() -> int:
    args = parse_args()
    dataset_df, report = build_dataset(
        resume_dataset_path=args.resume_dataset.resolve(),
        resume_dataset_10k_path=args.resume_dataset_10k.resolve(),
        students_dataset_path=args.students_dataset.resolve(),
        target_per_class=int(args.target_per_class),
        min_score=float(args.min_score),
        min_margin=float(args.min_margin),
        min_required_per_class=int(args.min_required_per_class),
    )

    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.report.parent.mkdir(parents=True, exist_ok=True)
    dataset_df.to_csv(args.output, index=False)
    args.report.write_text(json.dumps(report, indent=2), encoding="utf-8")

    print(
        json.dumps(
            {
                "status": "ok",
                "output_dataset": str(args.output.resolve()),
                "report_path": str(args.report.resolve()),
                "final_rows": int(len(dataset_df)),
                "final_class_counts": report["counts_final"],
            },
            indent=2,
        )
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
