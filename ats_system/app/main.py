from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routers.match import router as match_router
from app.routers.upload import router as upload_router


app = FastAPI(
    title="ATS Resume Prediction API",
    version="1.0.0",
    description=(
        "Production-ready ATS system for parsing resumes, category prediction, "
        "ATS scoring, skill extraction, missing-skills analysis, and ranking."
    ),
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173", "*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(upload_router)
app.include_router(match_router)


@app.get("/health", tags=["system"])
def health() -> dict:
    return {"status": "ok", "service": "ats_resume_prediction"}


@app.get("/", tags=["system"])
def root() -> dict:
    return {
        "message": "ATS Resume Prediction API is running.",
        "docs": "/docs",
        "endpoints": ["/upload-resumes", "/match", "/rank"],
    }

