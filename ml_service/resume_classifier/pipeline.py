"""End-to-end production pipeline for resume classification."""

from __future__ import annotations

import json
from dataclasses import dataclass
from pathlib import Path
from typing import Any

import numpy as np
import pandas as pd

try:
    import matplotlib.pyplot as plt
except Exception:
    plt = None

from .augmentation import ResumeParaphraser, augment_dataframe
from .config import PipelineConfig, TrainingConfig
from .data_split import DatasetSplits, stratified_split
from .taxonomy import FIXED_TAXONOMY
from .training import EvalResult, TrainRunResult, evaluate_model, train_single_run
from .validation import DatasetValidationError, ValidatedDataset, validate_and_prepare_dataset


@dataclass
class PipelineArtifacts:
    model_dir: Path
    metrics_path: Path
    predictions_path: Path
    validation_report_path: Path
    confusion_matrix_path: Path


@dataclass
class PipelineResult:
    config: dict[str, Any]
    validation: dict[str, Any]
    split_sizes: dict[str, int]
    selected_run: dict[str, Any]
    improvement_steps: list[str]
    test_metrics: dict[str, Any]
    weak_classes: list[dict[str, Any]]
    top_misclassified_samples: list[dict[str, Any]]
    achieved_target: bool
    reality_check: str
    artifacts: dict[str, str]


def _extra_clean_training_data(train_df: pd.DataFrame) -> pd.DataFrame:
    cleaned = train_df.copy()
    cleaned["token_count"] = cleaned["resume_text"].astype(str).str.split().str.len()
    cleaned["unique_token_count"] = cleaned["resume_text"].astype(str).apply(
        lambda text: len(set(str(text).lower().split()))
    )
    cleaned["lexical_diversity"] = cleaned["unique_token_count"] / cleaned["token_count"].clip(lower=1)
    cleaned = cleaned.loc[(cleaned["token_count"] >= 10) & (cleaned["lexical_diversity"] >= 0.25)].copy()
    cleaned = cleaned.drop(columns=["token_count", "unique_token_count", "lexical_diversity"])
    return cleaned.reset_index(drop=True)


def _build_role_maps() -> tuple[dict[str, int], dict[int, str]]:
    role_to_id = {role: idx for idx, role in enumerate(FIXED_TAXONOMY)}
    id_to_role = {idx: role for role, idx in role_to_id.items()}
    return role_to_id, id_to_role


def _select_best_run(runs: list[TrainRunResult]) -> TrainRunResult:
    def score(item: TrainRunResult) -> tuple[float, float]:
        return (item.val_result.macro_f1, item.val_result.accuracy)

    return max(runs, key=score)


def _prepare_error_analysis(test_result: EvalResult, limit: int = 30) -> tuple[list[dict[str, Any]], list[dict[str, Any]]]:
    predictions = test_result.predictions_df.copy()
    mistakes = predictions.loc[~predictions["correct"]].copy()
    mistakes = mistakes.sort_values(by="confidence", ascending=False).head(limit)
    top_misclassified = [
        {
            "resume_id": str(row["resume_id"]),
            "target_role": str(row["target_role"]),
            "predicted_role": str(row["predicted_role"]),
            "confidence": float(row["confidence"]),
            "resume_text_preview": str(row["resume_text"])[:280],
        }
        for _, row in mistakes.iterrows()
    ]

    weak_classes = sorted(
        (
            {"role": role, "recall": float(recall)}
            for role, recall in test_result.per_class_recall.items()
        ),
        key=lambda item: item["recall"],
    )
    return top_misclassified, weak_classes


def _save_confusion_matrix_png(confusion: list[list[int]], output_path: Path) -> None:
    if plt is None:
        output_path.write_text(json.dumps({"confusion_matrix": confusion}, indent=2), encoding="utf-8")
        return

    labels = list(FIXED_TAXONOMY)
    matrix = np.array(confusion, dtype=np.int64)
    fig, ax = plt.subplots(figsize=(7, 6))
    image = ax.imshow(matrix, cmap="Blues")
    ax.figure.colorbar(image, ax=ax, fraction=0.046, pad=0.04)
    ax.set(
        xticks=np.arange(len(labels)),
        yticks=np.arange(len(labels)),
        xticklabels=labels,
        yticklabels=labels,
        ylabel="True Label",
        xlabel="Predicted Label",
        title="Confusion Matrix (Test Set)",
    )
    plt.setp(ax.get_xticklabels(), rotation=30, ha="right", rotation_mode="anchor")
    for i in range(matrix.shape[0]):
        for j in range(matrix.shape[1]):
            value = int(matrix[i, j])
            ax.text(j, i, str(value), ha="center", va="center", color="black")
    fig.tight_layout()
    fig.savefig(output_path, dpi=160)
    plt.close(fig)


def _save_artifacts(
    *,
    selected: TrainRunResult,
    test_result: EvalResult,
    validation: ValidatedDataset,
    result: PipelineResult,
    output_dir: Path,
) -> PipelineArtifacts:
    output_dir.mkdir(parents=True, exist_ok=True)
    model_dir = output_dir
    metrics_path = output_dir / "metrics.json"
    predictions_path = output_dir / "predictions.csv"
    validation_report_path = output_dir / "validation_report.json"
    confusion_matrix_path = output_dir / ("confusion_matrix.png" if plt is not None else "confusion_matrix.json")

    result.artifacts = {
        "model_dir": str(model_dir),
        "metrics_json": str(metrics_path),
        "predictions_csv": str(predictions_path),
        "validation_report_json": str(validation_report_path),
        "confusion_matrix_png": str(confusion_matrix_path),
    }

    selected.model.save_pretrained(model_dir)
    selected.tokenizer.save_pretrained(model_dir)

    test_result.predictions_df.to_csv(predictions_path, index=False)
    _save_confusion_matrix_png(test_result.confusion_matrix, confusion_matrix_path)

    metrics_path.write_text(json.dumps(result.__dict__, indent=2), encoding="utf-8")

    validation_report_path.write_text(json.dumps(validation.report.__dict__, indent=2), encoding="utf-8")

    return PipelineArtifacts(
        model_dir=model_dir,
        metrics_path=metrics_path,
        predictions_path=predictions_path,
        validation_report_path=validation_report_path,
        confusion_matrix_path=confusion_matrix_path,
    )


def _train_with_config(
    *,
    train_df: pd.DataFrame,
    val_df: pd.DataFrame,
    training_config: TrainingConfig,
    role_to_id: dict[str, int],
    device: str,
) -> TrainRunResult:
    return train_single_run(
        train_df=train_df,
        val_df=val_df,
        role_to_id=role_to_id,
        config=training_config,
        device=device,
    )


def run_pipeline(config: PipelineConfig) -> PipelineResult:
    validated = validate_and_prepare_dataset(
        csv_path=config.dataset_path,
        config=config.validation,
        allow_weak_labels=config.allow_weak_labels,
    )
    splits: DatasetSplits = stratified_split(validated.dataframe, random_state=config.training.random_seed)

    role_to_id, _ = _build_role_maps()
    runs: list[TrainRunResult] = []
    improvements: list[str] = []

    # Baseline run.
    baseline = _train_with_config(
        train_df=splits.train,
        val_df=splits.val,
        training_config=config.training,
        role_to_id=role_to_id,
        device=config.device,
    )
    runs.append(baseline)

    # Trigger improvement path if validation under target proxy.
    baseline_under_target = (
        baseline.val_result.accuracy < config.target.min_test_accuracy
        or baseline.val_result.macro_f1 < config.target.min_test_macro_f1
    )
    if baseline_under_target and config.training.enable_improvement_loop:
        # (a) Data cleaning
        cleaned_train = _extra_clean_training_data(splits.train)
        improvements.append("data_cleaning")

        # (b) Hard example mining
        val_pred = baseline.val_result.predictions_df
        hard_examples = val_pred.loc[~val_pred["correct"], ["resume_id"]]
        hard_df = splits.val.merge(hard_examples, on="resume_id", how="inner")
        mined_train = pd.concat([cleaned_train, hard_df], ignore_index=True)
        improvements.append("hard_example_mining")

        # (c) Augmentation (<=2x)
        paraphraser = ResumeParaphraser(random_seed=config.training.random_seed)
        aug_result = augment_dataframe(
            mined_train,
            paraphraser=paraphraser,
            max_multiplier=config.training.max_augmentation_multiplier,
        )
        augmented_train = aug_result.augmented_df
        improvements.append(f"augmentation:{aug_result.method}:{aug_result.generated_rows}")

        # (d) Hyperparameter tuning loop
        tuning_runs: list[TrainRunResult] = []
        for lr in config.training.improvement_learning_rates:
            for batch in config.training.improvement_batch_sizes:
                for epochs in config.training.improvement_epochs:
                    trial_cfg = TrainingConfig(**config.training.__dict__)
                    trial_cfg.learning_rate = float(lr)
                    trial_cfg.batch_size = int(batch)
                    trial_cfg.epochs = int(epochs)
                    run = _train_with_config(
                        train_df=augmented_train,
                        val_df=splits.val,
                        training_config=trial_cfg,
                        role_to_id=role_to_id,
                        device=config.device,
                    )
                    tuning_runs.append(run)

        if tuning_runs:
            runs.extend(tuning_runs)
            improvements.append("hyperparameter_tuning")

    selected = _select_best_run(runs)
    test_result = evaluate_model(
        model=selected.model,
        tokenizer=selected.tokenizer,
        dataframe=splits.test,
        role_to_id=role_to_id,
        batch_size=selected.config_snapshot["batch_size"],
        max_length=selected.config_snapshot["max_length"],
        device=selected.config_snapshot["device"],
    )

    top_misclassified, weak_classes = _prepare_error_analysis(test_result)
    achieved_target = (
        test_result.accuracy >= config.target.min_test_accuracy
        and test_result.macro_f1 >= config.target.min_test_macro_f1
    )
    if achieved_target:
        reality_check = "Target met on test set without metric fabrication."
    else:
        reality_check = (
            "Target not met on test set. This is a real measurement; likely limited by data quality, "
            "label noise, or class overlap. Next actions: increase high-quality labeled data, "
            "audit labels, and try model upgrades such as roberta-base or bert-large-uncased."
        )

    result = PipelineResult(
        config=config.as_dict(),
        validation=validated.report.__dict__,
        split_sizes={
            "train": int(len(splits.train)),
            "validation": int(len(splits.val)),
            "test": int(len(splits.test)),
        },
        selected_run=selected.config_snapshot,
        improvement_steps=improvements,
        test_metrics={
            "accuracy": float(test_result.accuracy),
            "macro_f1": float(test_result.macro_f1),
            "per_class_recall": test_result.per_class_recall,
            "confusion_matrix": test_result.confusion_matrix,
            "classification_report": test_result.classification_report,
        },
        weak_classes=weak_classes,
        top_misclassified_samples=top_misclassified,
        achieved_target=achieved_target,
        reality_check=reality_check,
        artifacts={},
    )

    artifacts = _save_artifacts(
        selected=selected,
        test_result=test_result,
        validation=validated,
        result=result,
        output_dir=config.output_dir,
    )
    result.artifacts = {
        "model_dir": str(artifacts.model_dir),
        "metrics_json": str(artifacts.metrics_path),
        "predictions_csv": str(artifacts.predictions_path),
        "validation_report_json": str(artifacts.validation_report_path),
        "confusion_matrix_png": str(artifacts.confusion_matrix_path),
    }
    return result


def save_result_json(result: PipelineResult, output_path: Path) -> None:
    output_path.write_text(json.dumps(result.__dict__, indent=2), encoding="utf-8")
