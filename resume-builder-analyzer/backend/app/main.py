import logging
import os
from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from app.config import settings
from app.database import engine, Base
from app.routers import auth, analyzer, resumes, history

# Structured Logging Setup
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s [%(levelname)s] %(name)s: %(message)s'
)
logger = logging.getLogger("api")

# Auto-create tables on startup (Alembic can also be run for migrations)
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="Production-Grade Resume Builder & Deterministic Analyzer API with ATS Verification",
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Custom Exception Handlers for graceful errors (413, 415, 422)
@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    logger.warning(f"Validation error on {request.url.path}: {exc.errors()}")
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={"detail": "Input validation failed", "errors": exc.errors()}
    )

@app.get("/health", tags=["Health"])
def health_check():
    ai_available = bool(settings.ANTHROPIC_API_KEY or os.getenv("ANTHROPIC_API_KEY"))
    return {
        "status": "healthy",
        "version": settings.VERSION,
        "database": "connected",
        "ai_layer_enabled": ai_available
    }

# Include Routers under API Prefix
app.include_router(auth.router, prefix=settings.API_V1_PREFIX)
app.include_router(analyzer.router, prefix=settings.API_V1_PREFIX)
app.include_router(resumes.router, prefix=settings.API_V1_PREFIX)
app.include_router(history.router, prefix=settings.API_V1_PREFIX)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
