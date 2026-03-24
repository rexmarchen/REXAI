"""Configuration dataclasses for training and inference."""

from __future__ import annotations

from dataclasses import asdict, dataclass, field
from pathlib import Path


@dataclass
class ValidationConfig:
    required_columns: tuple[str, ...] = (
        "resume_id",
        "resume_text",
        "target_role",
        "years_experience",
        "seniority",
    )
    min_samples_per_class: int = 1000
    min_balance_ratio: float = 0.5
    reject_duplicates: bool = True
    reject_unknown_labels: bool = True
    reject_weak_labels: bool = True
    min_text_chars: int = 40
    weak_unique_ratio_threshold: float = 0.75
    weak_cv_f1_threshold: float = 0.995
    weak_template_phrase_threshold: float = 0.95


@dataclass
class TrainingConfig:
    model_name: str = "bert-base-uncased"
    max_length: int = 512
    learning_rate: float = 2.0e-5
    batch_size: int = 16
    epochs: int = 5
    weight_decay: float = 0.01
    dropout: float = 0.3
    gradient_clip_norm: float = 1.0
    patience: int = 2
    warmup_ratio: float = 0.1
    random_seed: int = 42
    num_workers: int = 0
    use_class_weights: bool = True
    enable_improvement_loop: bool = True
    improvement_learning_rates: tuple[float, ...] = (2.0e-5, 2.5e-5, 3.0e-5)
    improvement_batch_sizes: tuple[int, ...] = (16, 32)
    improvement_epochs: tuple[int, ...] = (4, 5, 6)
    hard_example_top_k: int = 400
    max_augmentation_multiplier: float = 2.0


@dataclass
class TargetConfig:
    min_test_accuracy: float = 0.95
    min_test_macro_f1: float = 0.93


@dataclass
class PipelineConfig:
    dataset_path: Path
    output_dir: Path
    validation: ValidationConfig = field(default_factory=ValidationConfig)
    training: TrainingConfig = field(default_factory=TrainingConfig)
    target: TargetConfig = field(default_factory=TargetConfig)
    device: str = "auto"
    allow_weak_labels: bool = False

    def as_dict(self) -> dict:
        payload = asdict(self)
        payload["dataset_path"] = str(self.dataset_path)
        payload["output_dir"] = str(self.output_dir)
        return payload
