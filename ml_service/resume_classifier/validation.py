"""Dataset validation and preparation for resume classification."""

from __future__ import annotations

import hashlib
import re
from dataclasses import dataclass
from pathlib import Path

import pandas as pd
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.model_selection import StratifiedKFold, cross_val_score

from .config import ValidationConfig
from .taxonomy import FIXED_TAXONOMY, OTHER_LABEL, normalize_role


class DatasetValidationError(ValueError):
    """Raised when dataset violates strict requirements."""


class WeakLabelingDetectedError(DatasetValidationError):
    """Raised when weak labeling pattern is detected."""


@dataclass
class ValidationReport:
    rows_input: int
    rows_after_cleaning: int
    duplicates_removed: int
    short_text_rows_removed: int
    unknown_rows_mapped_to_other: int
    unknown_rows_dropped: int
    class_counts: dict[str, int]
    weak_label_signals: dict[str, float]
    weak_label_flag: bool
    weak_label_reason: str


@dataclass
class ValidatedDataset:
    dataframe: pd.DataFrame
    report: ValidationReport


def _normalize_whitespace(text: str) -> str:
    return re.sub(r"\s+", " ", str(text or "").strip())


def _text_hash(text: str) -> str:
    canonical = _normalize_whitespace(text).lower()
    return hashlib.sha256(canonical.encode("utf-8")).hexdigest()


def _check_required_columns(df: pd.DataFrame, config: ValidationConfig) -> None:
    required = list(config.required_columns)
    found = list(df.columns)
    missing = [col for col in required if col not in found]
    if missing:
        raise DatasetValidationError(
            f"Missing required columns: {missing}. Required schema is exactly: {config.required_columns}"
        )
    extras = [col for col in found if col not in required]
    if extras:
        raise DatasetValidationError(
            "Input schema mismatch. CSV must contain only columns "
            f"{config.required_columns}. Unexpected columns: {extras}"
        )


def _check_no_null_values(df: pd.DataFrame, config: ValidationConfig) -> None:
    null_counts = {}
    for column in config.required_columns:
        series = df[column]
        if series.dtype == "O":
            null_mask = series.isna() | series.astype(str).str.strip().eq("")
        else:
            null_mask = series.isna()
        count = int(null_mask.sum())
        if count > 0:
            null_counts[column] = count

    if null_counts:
        raise DatasetValidationError(f"Null/empty values found in required columns: {null_counts}")


def _check_single_label(df: pd.DataFrame) -> None:
    multi_label_mask = df["target_role"].astype(str).str.contains(r"[,;/|]", regex=True)
    if bool(multi_label_mask.any()):
        examples = df.loc[multi_label_mask, "target_role"].head(5).tolist()
        raise DatasetValidationError(
            "Detected multi-label values in target_role. Single-label classification is required. "
            f"Examples: {examples}"
        )


def _detect_weak_labeling(df: pd.DataFrame, config: ValidationConfig) -> tuple[bool, dict[str, float], str]:
    """Heuristic detector for synthetic keyword/template weak labels."""
    texts = df["resume_text"].astype(str).map(_normalize_whitespace).str.lower()
    labels = df["target_role"].astype(str)

    unique_ratio = float(texts.nunique() / max(len(texts), 1))

    template_phrases = (
        "experienced in",
        "worked on",
        "years of experience",
    )
    template_phrase_coverage = float(
        sum(texts.str.contains(re.escape(phrase), regex=True).mean() for phrase in template_phrases)
        / len(template_phrases)
    )

    cv_macro_f1 = 0.0
    can_score = len(df) >= 200 and labels.nunique() >= 2 and labels.value_counts().min() >= 5
    if can_score:
        vectorizer = TfidfVectorizer(max_features=3000, ngram_range=(1, 2), stop_words="english")
        x = vectorizer.fit_transform(texts)
        model = LogisticRegression(max_iter=2000)
        cv = StratifiedKFold(n_splits=3, shuffle=True, random_state=42)
        # Single-process CV avoids Windows sandbox pipe errors during validation.
        scores = cross_val_score(model, x, labels, scoring="f1_macro", cv=cv, n_jobs=1)
        cv_macro_f1 = float(scores.mean())

    signals = {
        "unique_text_ratio": unique_ratio,
        "template_phrase_coverage": template_phrase_coverage,
        "cheap_model_cv_macro_f1": cv_macro_f1,
    }

    weak_flag = (
        unique_ratio < config.weak_unique_ratio_threshold
        and template_phrase_coverage >= config.weak_template_phrase_threshold
        and cv_macro_f1 >= config.weak_cv_f1_threshold
    )

    if weak_flag:
        reason = (
            "Dataset appears weak-labeled/template-generated: low text uniqueness, high template repetition, "
            "and near-perfect shallow-model score."
        )
    else:
        reason = ""

    return weak_flag, signals, reason


def validate_and_prepare_dataset(
    csv_path: Path,
    config: ValidationConfig,
    *,
    allow_weak_labels: bool = False,
) -> ValidatedDataset:
    df = pd.read_csv(csv_path)
    rows_input = int(len(df))

    _check_required_columns(df, config)
    _check_no_null_values(df, config)
    _check_single_label(df)

    required = list(config.required_columns)
    df = df[required].copy()
    df["resume_id"] = df["resume_id"].astype(str).str.strip()
    df["resume_text"] = df["resume_text"].astype(str).map(_normalize_whitespace)
    df["target_role_raw"] = df["target_role"].astype(str).str.strip()
    df["target_role"] = df["target_role_raw"].map(normalize_role)
    df["seniority"] = df["seniority"].astype(str).str.strip()
    df["years_experience"] = pd.to_numeric(df["years_experience"], errors="raise")

    # Detect weak/template labeling on the raw cleaned rows (before dedupe),
    # otherwise unique-ratio signals are artificially hidden.
    weak_flag, weak_signals, weak_reason = _detect_weak_labeling(df, config)
    if config.reject_weak_labels and not allow_weak_labels and weak_flag:
        raise WeakLabelingDetectedError(
            f"{weak_reason} Signals={weak_signals}. Use stronger manual labels or pass allow_weak_labels=True explicitly."
        )

    # Remove duplicate resume texts based on deterministic content hash.
    df["text_hash"] = df["resume_text"].map(_text_hash)
    before_dedup = len(df)
    df = df.drop_duplicates(subset=["text_hash"], keep="first").reset_index(drop=True)
    duplicates_removed = int(before_dedup - len(df))
    if config.reject_duplicates and duplicates_removed > 0:
        raise DatasetValidationError(
            f"Duplicate resume_text detected ({duplicates_removed} duplicates). "
            "Dataset rejected by strict deduplication policy."
        )

    # Remove too-short resume bodies.
    short_mask = df["resume_text"].str.len() < int(config.min_text_chars)
    short_removed = int(short_mask.sum())
    df = df.loc[~short_mask].reset_index(drop=True)

    unknown_rows_mapped = int((df["target_role"] == OTHER_LABEL).sum())
    if config.reject_unknown_labels and unknown_rows_mapped > 0:
        examples = (
            df.loc[df["target_role"] == OTHER_LABEL, "target_role_raw"]
            .dropna()
            .astype(str)
            .head(10)
            .tolist()
        )
        raise DatasetValidationError(
            "Found labels outside allowed taxonomy "
            f"{FIXED_TAXONOMY}. Offending examples: {examples}"
        )
    df = df.loc[df["target_role"] != OTHER_LABEL].reset_index(drop=True)
    unknown_rows_dropped = unknown_rows_mapped

    class_counts = df["target_role"].value_counts().to_dict()
    missing_roles = [role for role in FIXED_TAXONOMY if role not in class_counts]
    if missing_roles:
        raise DatasetValidationError(
            f"Missing taxonomy roles after mapping/cleaning: {missing_roles}. Required roles: {FIXED_TAXONOMY}"
        )

    insufficient = {label: count for label, count in class_counts.items() if count < config.min_samples_per_class}
    if insufficient:
        raise DatasetValidationError(
            f"Each class must have >= {config.min_samples_per_class} samples. Violations: {insufficient}"
        )

    max_count = max(class_counts.values())
    min_allowed = max_count * config.min_balance_ratio
    under_balanced = {label: count for label, count in class_counts.items() if count < min_allowed}
    if under_balanced:
        raise DatasetValidationError(
            f"Class balance violation: no class can be < {config.min_balance_ratio:.2f} of max class "
            f"({min_allowed:.1f} samples). Violations: {under_balanced}"
        )

    report = ValidationReport(
        rows_input=rows_input,
        rows_after_cleaning=int(len(df)),
        duplicates_removed=duplicates_removed,
        short_text_rows_removed=short_removed,
        unknown_rows_mapped_to_other=unknown_rows_mapped,
        unknown_rows_dropped=unknown_rows_dropped,
        class_counts={k: int(v) for k, v in class_counts.items()},
        weak_label_signals=weak_signals,
        weak_label_flag=weak_flag,
        weak_label_reason=weak_reason,
    )
    return ValidatedDataset(dataframe=df, report=report)
