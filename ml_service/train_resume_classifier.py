"""CLI entrypoint for production BERT resume classification pipeline."""

from __future__ import annotations

import argparse
import json
from pathlib import Path

try:
    from ml_service.resume_classifier.config import PipelineConfig, TargetConfig, TrainingConfig, ValidationConfig
    from ml_service.resume_classifier.pipeline import run_pipeline
    from ml_service.resume_classifier.validation import DatasetValidationError, WeakLabelingDetectedError
except ModuleNotFoundError:
    from resume_classifier.config import PipelineConfig, TargetConfig, TrainingConfig, ValidationConfig
    from resume_classifier.pipeline import run_pipeline
    from resume_classifier.validation import DatasetValidationError, WeakLabelingDetectedError


PROFILE_DEFAULTS = {
    "production": {
        "device": "auto",
        "model_name": "bert-base-uncased",
        "max_length": 256,
        "batch_size": 16,
        "epochs": 4,
        "learning_rate": 2.0e-5,
        "min_test_accuracy": 0.95,
        "min_test_macro_f1": 0.93,
        "improvement_loop": "on",
    },
    "cpu-fast": {
        "device": "cpu",
        "model_name": "bert-base-uncased",
        "max_length": 128,
        "batch_size": 8,
        "epochs": 2,
        "learning_rate": 3.0e-5,
        "min_test_accuracy": 0.0,
        "min_test_macro_f1": 0.0,
        "improvement_loop": "off",
    },
    "gpu-ready": {
        "device": "cuda",
        "model_name": "bert-base-uncased",
        "max_length": 256,
        "batch_size": 16,
        "epochs": 4,
        "learning_rate": 2.0e-5,
        "min_test_accuracy": 0.95,
        "min_test_macro_f1": 0.93,
        "improvement_loop": "on",
    },
}


def _resolved_arg(args: argparse.Namespace, name: str):
    profile_defaults = PROFILE_DEFAULTS[args.profile]
    value = getattr(args, name)
    if value is not None:
        return value
    return profile_defaults[name]


def parse_args() -> argparse.Namespace:
    current_dir = Path(__file__).resolve().parent
    default_dataset = current_dir / "data" / "production_resume_dataset.csv"
    default_output = current_dir / "model"

    parser = argparse.ArgumentParser(description="Train production resume classifier (BERT).")
    parser.add_argument(
        "--profile",
        choices=tuple(PROFILE_DEFAULTS.keys()),
        default="production",
        help="Training preset: production | cpu-fast | gpu-ready",
    )
    parser.add_argument("--dataset", type=Path, default=default_dataset, help="Path to dataset CSV.")
    parser.add_argument("--output-dir", type=Path, default=default_output, help="Directory to save model artifacts.")
    parser.add_argument("--device", type=str, default=None, help="auto | cpu | cuda")
    parser.add_argument("--model-name", type=str, default=None, help="Transformer checkpoint name or local path.")
    parser.add_argument("--max-length", type=int, default=None, help="Tokenizer max sequence length.")
    parser.add_argument("--batch-size", type=int, default=None, help="Batch size.")
    parser.add_argument("--epochs", type=int, default=None, help="Epoch count.")
    parser.add_argument("--learning-rate", type=float, default=None, help="AdamW learning rate.")
    parser.add_argument("--min-test-accuracy", type=float, default=None, help="Target test accuracy for promotion.")
    parser.add_argument("--min-test-macro-f1", type=float, default=None, help="Target test macro-F1 for promotion.")
    parser.add_argument(
        "--improvement-loop",
        choices=("on", "off"),
        default=None,
        help="Enable or disable the post-baseline improvement loop.",
    )
    parser.add_argument("--allow-weak-labels", action="store_true", help="Override weak-label rejection.")
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    resolved_device = _resolved_arg(args, "device")
    resolved_model_name = _resolved_arg(args, "model_name")
    resolved_max_length = int(_resolved_arg(args, "max_length"))
    resolved_batch_size = int(_resolved_arg(args, "batch_size"))
    resolved_epochs = int(_resolved_arg(args, "epochs"))
    resolved_learning_rate = float(_resolved_arg(args, "learning_rate"))
    resolved_min_test_accuracy = float(_resolved_arg(args, "min_test_accuracy"))
    resolved_min_test_macro_f1 = float(_resolved_arg(args, "min_test_macro_f1"))
    resolved_improvement_loop = str(_resolved_arg(args, "improvement_loop")) == "on"

    validation_cfg = ValidationConfig()
    training_cfg = TrainingConfig(
        model_name=resolved_model_name,
        max_length=resolved_max_length,
        batch_size=resolved_batch_size,
        epochs=resolved_epochs,
        learning_rate=resolved_learning_rate,
        enable_improvement_loop=resolved_improvement_loop,
    )
    target_cfg = TargetConfig(
        min_test_accuracy=resolved_min_test_accuracy,
        min_test_macro_f1=resolved_min_test_macro_f1,
    )
    pipeline_cfg = PipelineConfig(
        dataset_path=args.dataset.resolve(),
        output_dir=args.output_dir.resolve(),
        validation=validation_cfg,
        training=training_cfg,
        target=target_cfg,
        device=resolved_device,
        allow_weak_labels=args.allow_weak_labels,
    )

    try:
        result = run_pipeline(pipeline_cfg)
    except WeakLabelingDetectedError as exc:
        payload = {
            "status": "rejected",
            "reason": str(exc),
            "hint": "Dataset was rejected by weak-label detector. Collect stronger manual labels before training.",
        }
        print(json.dumps(payload, indent=2))
        return 2
    except DatasetValidationError as exc:
        payload = {"status": "validation_failed", "reason": str(exc)}
        print(json.dumps(payload, indent=2))
        return 3

    summary = {
        "status": "ok",
        "profile": args.profile,
        "achieved_target": result.achieved_target,
        "test_accuracy": result.test_metrics["accuracy"],
        "test_macro_f1": result.test_metrics["macro_f1"],
        "per_class_recall": result.test_metrics["per_class_recall"],
        "classification_report": result.test_metrics["classification_report"],
        "weak_classes": result.weak_classes,
        "top_misclassified_samples": result.top_misclassified_samples[:10],
        "artifacts": result.artifacts,
        "reality_check": result.reality_check,
        "resolved_training_config": {
            "device": resolved_device,
            "model_name": resolved_model_name,
            "max_length": resolved_max_length,
            "batch_size": resolved_batch_size,
            "epochs": resolved_epochs,
            "learning_rate": resolved_learning_rate,
            "improvement_loop": resolved_improvement_loop,
            "min_test_accuracy": resolved_min_test_accuracy,
            "min_test_macro_f1": resolved_min_test_macro_f1,
        },
    }
    print(json.dumps(summary, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
