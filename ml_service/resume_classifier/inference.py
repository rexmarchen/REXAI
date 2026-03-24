"""Inference helpers for saved BERT resume classifier."""

from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path
from typing import Any

from .taxonomy import FIXED_TAXONOMY


def _lazy_import_runtime() -> dict[str, Any]:
    try:
        import torch
        from transformers import AutoModelForSequenceClassification, AutoTokenizer

        return {
            "torch": torch,
            "AutoModelForSequenceClassification": AutoModelForSequenceClassification,
            "AutoTokenizer": AutoTokenizer,
        }
    except Exception as exc:
        raise RuntimeError("Inference requires torch + transformers installed.") from exc


@dataclass
class InferenceBundle:
    model: Any
    tokenizer: Any
    device: str


@dataclass
class PredictionResult:
    predicted_role: str
    confidence: float
    probabilities: dict[str, float]


def _pick_device(device: str) -> str:
    modules = _lazy_import_runtime()
    torch = modules["torch"]
    if device != "auto":
        return device
    if torch.cuda.is_available():
        return "cuda"
    return "cpu"


def load_bundle(model_dir: Path, device: str = "auto") -> InferenceBundle:
    modules = _lazy_import_runtime()
    AutoModelForSequenceClassification = modules["AutoModelForSequenceClassification"]
    AutoTokenizer = modules["AutoTokenizer"]

    resolved_device = _pick_device(device)
    tokenizer = AutoTokenizer.from_pretrained(model_dir)
    model = AutoModelForSequenceClassification.from_pretrained(model_dir)
    model.to(resolved_device)
    model.eval()
    return InferenceBundle(model=model, tokenizer=tokenizer, device=resolved_device)


def predict_resume_text(bundle: InferenceBundle, resume_text: str, max_length: int = 512) -> PredictionResult:
    modules = _lazy_import_runtime()
    torch = modules["torch"]
    encoded = bundle.tokenizer(
        str(resume_text),
        truncation=True,
        padding="max_length",
        max_length=max_length,
        return_tensors="pt",
    )
    input_ids = encoded["input_ids"].to(bundle.device)
    attention_mask = encoded["attention_mask"].to(bundle.device)
    with torch.no_grad():
        logits = bundle.model(input_ids=input_ids, attention_mask=attention_mask).logits
        probs = torch.softmax(logits, dim=1).squeeze(0).cpu().numpy()

    role_probs = {FIXED_TAXONOMY[idx]: float(prob) for idx, prob in enumerate(probs)}
    best_idx = int(probs.argmax())
    return PredictionResult(
        predicted_role=FIXED_TAXONOMY[best_idx],
        confidence=float(probs[best_idx]),
        probabilities=role_probs,
    )
