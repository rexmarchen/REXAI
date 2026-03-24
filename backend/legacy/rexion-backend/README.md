# REXION AI - Full Model Guide

Rexion AI is a multi-service platform with:
- React frontend (`frontend`)
- Node.js backend API gateway (`backend`)
- Python FastAPI ML + ATS service (`ml_service`)
- Optional external providers (OpenRouter/DeepSeek for AI generation, JSearch for live jobs)

This README explains the full model flow and setup step by step.

## 1. System Overview

Core capabilities:
- Resume parsing and profile extraction (name, skills, education, projects, experience)
- Career path prediction with confidence
- ATS scoring with missing skill detection
- Multi-resume ATS ranking
- Live international remote jobs
- AI answer generation and AI website generation
- Voice assistant on resume results (browser speech synthesis)
- Intern Hunt UI section with particle-ring animation

## 2. Architecture

Request flow:
1. Frontend calls Node backend (`http://127.0.0.1:5000/api/...`).
2. Node backend proxies ML routes to FastAPI (`http://127.0.0.1:8000/...`).
3. FastAPI ML service runs prediction, ATS, and job fetch.
4. AI generation routes on Node call OpenRouter or DeepSeek directly (based on env).

Storage:
- Node SQLite: `backend/data/rexion.sqlite`
- ML SQLite: `ml_service/data/predictions.db`
- Local resume-analysis store: `llm-models/resume-analysis-store.json`
- Uploaded files: `backend/uploads`, `ml_service/uploads`

## 3. Active Services and Ports

- Frontend (Vite): `http://127.0.0.1:5173`
- Backend (Node): `http://127.0.0.1:5000`
- ML service (FastAPI): `http://127.0.0.1:8000`

## 4. Project Structure

- `frontend/`: React UI (Home, Intern Hunt, Resume Predictor, Rexcode, Workspace)
- `backend/`: Main API server (`server.js`), auth, AI generation, ML proxy
- `ml_service/`: FastAPI service for prediction, ATS, jobs, prediction history
- `ats_system/`: ATS training/support assets
- `scripts/dev-runner.cjs`: Starts ML + backend + frontend together

Note: `rexion-backend/app/*` is currently empty and not the active runtime path.

## 5. Prerequisites

- Node.js 18+
- npm 9+
- Python 3.10+
- pip

## 6. Step-by-Step Setup

### Step 1 - Install dependencies

From repo root:

```powershell
npm install
npm install --prefix backend
npm install --prefix frontend
```

Python dependencies:

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r ml_service/requirements.txt
```

### Step 2 - Configure environment variables

Create/update `backend/.env`:

```env
NODE_ENV=development
PORT=5000
JWT_SECRET=replace_with_strong_secret
ML_SERVICE_URL=http://127.0.0.1:8000
ML_SERVICE_AUTOSTART=true
CORS_ORIGINS=http://localhost:5173,http://127.0.0.1:5173

# Rexcode AI provider
REXCODE_PROVIDER=openrouter
REXCODE_MODEL=openrouter/auto
OPENROUTER_API_KEY=sk-or-v1-xxxxxxxx

# Optional DeepSeek direct provider
DEEPSEEK_API_KEY=sk-xxxxxxxx
DEEPSEEK_BASE_URL=https://api.deepseek.com

# Live jobs
JSEARCH_API_KEY=your_rapidapi_jsearch_key
JSEARCH_API_HOST=jsearch.p.rapidapi.com
JSEARCH_ENABLE_FALLBACK=true
JSEARCH_TIMEOUT_SECONDS=35
JSEARCH_CACHE_TTL_SECONDS=300

# Optional resume-analysis LLM enhancement
LLM_PROVIDER=local
OPENAI_API_KEY=
OPENAI_MODEL=gpt-4o-mini
```

Create/update `frontend/.env`:

```env
VITE_API_BASE_URL=http://localhost:5000/api
VITE_ATS_API_BASE_URL=http://127.0.0.1:8000
VITE_ML_SERVICE_BASE_URL=http://127.0.0.1:8000
```

Important:
- Do not commit real keys.
- If keys were shared publicly, rotate them immediately.

### Step 3 - Start all services

Option A (recommended):

```powershell
npm run dev
```

This runs:
- ML service (`uvicorn ml_service.app.main:app`)
- backend (`backend/server.js`)
- frontend (`vite` on port 5173)

Option B (manual terminals):

Terminal 1:

```powershell
python -m uvicorn ml_service.app.main:app --host 127.0.0.1 --port 8000
```

Terminal 2:

```powershell
npm run dev --prefix backend
```

Terminal 3:

```powershell
npm run dev --prefix frontend -- --host 127.0.0.1 --port 5173 --strictPort
```

### Step 4 - Verify health

```powershell
Invoke-RestMethod http://127.0.0.1:5000/api/health
Invoke-RestMethod http://127.0.0.1:5000/api/ml/health
Invoke-RestMethod http://127.0.0.1:8000/health
```

### Step 5 - Use the app

1. Open `http://127.0.0.1:5173`.
2. Go to Resume Predictor.
3. Upload `.pdf/.doc/.docx` resume.
4. Check predicted role, confidence, ATS score, missing skills.
5. Run ATS Match (optional custom JD or auto-generated JD).
6. Review International Remote Picks.
7. Use Home Ask box for AI answers.
8. Use Rexcode page for AI site generation.

## 7. API Endpoints

Backend routes (`/api`):
- `GET /health`
- `POST /auth/register`
- `POST /auth/login`
- `POST /resume/predict`
- `GET /resume/result/:id`
- `POST /rexcode/generate`
- `GET /rexcode/site/:id`
- `GET /ml/health`
- `POST /ml/predict`
- `POST /ml/upload-resumes`
- `POST /ml/match`
- `GET /ml/rank`
- `GET /ml/jobs/search`

ML service routes:
- `GET /health`
- `POST /predict`
- `GET /jobs/search`
- `POST /upload-resumes`
- `POST /match`
- `GET /rank`
- `GET /predictions/{prediction_id}`
- `GET /predictions/user/{user_id}`
- `GET /predictions`
- `DELETE /predictions/{prediction_id}`

## 8. Model Details

Career prediction:
- Uses `ml_service/data/models/career_model.pkl` + `tfidf_vectorizer.pkl`
- If model artifacts are unavailable or incompatible, service falls back to deterministic heuristics

ATS scoring:
- Weighted score from semantic similarity, skill coverage, and structure quality
- ATS classifier artifacts: `ats_vectorizer.pkl`, `ats_classifier.pkl`
- If missing, ATS models are auto-trained from `ats_system/data/sample_resumes/labeled_resumes.csv` or internal sample data

Job fetching:
- Primary: JSearch (RapidAPI)
- Fallback (if enabled): Arbeitnow
- Caching supported via `JSEARCH_CACHE_TTL_SECONDS`

Rexcode AI generation:
- Provider controlled by `REXCODE_PROVIDER` (`openrouter`, `deepseek`, `auto`)
- Model controlled by `REXCODE_MODEL`

## 9. Retraining the Career Model

Run from root:

```powershell
python ml_service/train_models.py --dataset students_resume_dataset.csv
```

Artifacts are updated in `ml_service/data/models/`:
- `career_model.pkl`
- `tfidf_vectorizer.pkl`
- `career_model_metadata.json`

## 10. Troubleshooting

### ML service unavailable at `http://127.0.0.1:8000`
- Ensure Python environment is active.
- Run `uvicorn ml_service.app.main:app --host 127.0.0.1 --port 8000`.
- Confirm `ML_SERVICE_URL` points to `http://127.0.0.1:8000`.

### OpenRouter authentication failed (401)
- Use a valid `OPENROUTER_API_KEY`.
- Set `REXCODE_PROVIDER=openrouter`.
- Restart backend after env changes.

### DeepSeek quota/billing issue (402)
- Key is valid but account has no quota/balance.
- Add DeepSeek credits or switch provider to OpenRouter.

### JSearch API key missing
- Add `JSEARCH_API_KEY` in `backend/.env`.
- Restart services.
- If needed, keep `JSEARCH_ENABLE_FALLBACK=true` for fallback job data.

### Name not detected or garbled text from resume
- Use text-based PDF/DOCX (not scanned image-only files).
- Avoid corrupted or encrypted files.
- DOCX parsing is generally more reliable than legacy DOC.

### ATS score remains very low
- Add role-specific skills to resume.
- Use a specific job description instead of generic text.
- Ensure resume has clear sections: Skills, Experience, Education, Projects.

## 11. Security and Production Notes

- Never hardcode API keys in source files.
- Use separate keys for dev and production.
- Rotate keys if exposed.
- Restrict CORS in production.
- Replace SQLite with managed DB for scale.
- Add auth between backend and ML service for production deployment.

---

If you want, the next step can be creating a `README-DEPLOYMENT.md` with Docker + PM2 + Nginx for production rollout.
