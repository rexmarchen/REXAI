from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from .core.config import settings
from .core.logging import setup_logging
from .routers import chat

# Setup logging on startup
setup_logging()

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: can initialize connections, etc.
    print(f"Starting REXION backend in {settings.env} mode")
    yield
    # Shutdown: clean up
    print("Shutting down...")

app = FastAPI(
    title="REXION Chat API",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS – adjust origins for your frontend domain
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "https://yourdomain.com"],  # Add your frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(chat.router)

@app.get("/")
async def root():
    return {"message": "REXION API is running", "env": settings.env}

@app.get("/health")
async def health():
    return {"status": "ok"}
