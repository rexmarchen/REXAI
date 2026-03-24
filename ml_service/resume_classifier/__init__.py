"""Production-grade resume classification package."""

from .config import PipelineConfig, TargetConfig, TrainingConfig, ValidationConfig
from .pipeline import PipelineResult, run_pipeline
from .taxonomy import FIXED_TAXONOMY, OTHER_LABEL

__all__ = [
    "FIXED_TAXONOMY",
    "OTHER_LABEL",
    "ValidationConfig",
    "TrainingConfig",
    "TargetConfig",
    "PipelineConfig",
    "PipelineResult",
    "run_pipeline",
]

