"""Local end-to-end smoke test for the ML service FastAPI app."""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

from fastapi.testclient import TestClient

REPO_ROOT = Path(__file__).resolve().parent.parent
if str(REPO_ROOT) not in sys.path:
    sys.path.insert(0, str(REPO_ROOT))

from ml_service.app.main import app


def _default_resume_path() -> Path:
    candidate_dirs = [
        REPO_ROOT / "uploads",
        REPO_ROOT / "ml_service" / "uploads",
    ]
    for directory in candidate_dirs:
        if not directory.exists():
            continue
        pdfs = sorted(directory.glob("*.pdf"))
        if pdfs:
            return pdfs[0]
    return REPO_ROOT / "backend" / "data" / "test_resume.pdf"


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Smoke-test the ML service API without starting uvicorn.")
    parser.add_argument(
        "--resume",
        type=Path,
        default=_default_resume_path(),
        help="Path to a sample resume file for /predict.",
    )
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    resume_path = args.resume.resolve()
    if not resume_path.exists():
        raise FileNotFoundError(f"Resume file not found: {resume_path}")

    with TestClient(app) as client:
        health = client.get("/health")
        with resume_path.open("rb") as handle:
            predict = client.post(
                "/predict",
                files={"file": (resume_path.name, handle, "application/pdf")},
            )

    payload = {
        "health_status": health.status_code,
        "health_body": health.json(),
        "predict_status": predict.status_code,
    }
    if predict.headers.get("content-type", "").startswith("application/json"):
        body = predict.json()
        payload["predict_body"] = {
            "career_path": body.get("career_path"),
            "confidence": body.get("confidence"),
            "ats_score": body.get("ats_score"),
            "predicted_category": body.get("predicted_category"),
            "jobs_count": len(body.get("jobs") or []),
        }
    else:
        payload["predict_body"] = predict.text

    print(json.dumps(payload, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
