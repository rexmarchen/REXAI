"""FastAPI inference API for trained resume classifier."""

from __future__ import annotations

import os
from pathlib import Path

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field

try:
    from ml_service.resume_classifier.inference import InferenceBundle, load_bundle, predict_resume_text
except ModuleNotFoundError:
    from resume_classifier.inference import InferenceBundle, load_bundle, predict_resume_text


class PredictRequest(BaseModel):
    resume_text: str = Field(..., min_length=20)


class PredictResponse(BaseModel):
    predicted_role: str
    confidence: float
    probabilities: dict[str, float]


def _default_model_dir() -> Path:
    current_dir = Path(__file__).resolve().parent
    return current_dir / "model"


MODEL_DIR = Path(os.getenv("MODEL_DIR", str(_default_model_dir()))).resolve()
DEVICE = os.getenv("MODEL_DEVICE", "auto")

app = FastAPI(title="Resume Classifier Inference API", version="1.0.0")
bundle: InferenceBundle | None = None


@app.on_event("startup")
def startup() -> None:
    global bundle
    if not MODEL_DIR.exists():
        bundle = None
        return
    bundle = load_bundle(MODEL_DIR, device=DEVICE)


@app.get("/health")
def health() -> dict[str, str]:
    if bundle is None:
        return {"status": "degraded", "reason": f"Model not loaded from {MODEL_DIR}"}
    return {"status": "ok"}


@app.post("/predict", response_model=PredictResponse)
def predict(payload: PredictRequest) -> PredictResponse:
    if bundle is None:
        raise HTTPException(status_code=503, detail=f"Model is not loaded. Expected at {MODEL_DIR}")

    result = predict_resume_text(bundle, payload.resume_text)
    return PredictResponse(
        predicted_role=result.predicted_role,
        confidence=result.confidence,
        probabilities=result.probabilities,
    )
