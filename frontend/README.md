# REXION Frontend Guide

This frontend is built with React + Vite and connects to the Node backend and ML service.

## Stack

- React 18
- Vite
- React Router
- Axios
- Three.js (particle/visual effects)

## Run Frontend

From project root:

```powershell
npm install --prefix frontend
npm run dev --prefix frontend -- --host 127.0.0.1 --port 5173 --strictPort
```

App URL:
- `http://127.0.0.1:5173`

## Environment

Create/update `frontend/.env`:

```env
VITE_API_BASE_URL=http://localhost:5000/api
VITE_ATS_API_BASE_URL=http://127.0.0.1:8000
VITE_ML_SERVICE_BASE_URL=http://127.0.0.1:8000
```

## Main Routes

Defined in `frontend/src/routes.jsx`:

- `/` - Home (AI Ask + Workspace section)
- `/intern-hunt` - Intern Hunt page with particle-ring background
- `/resume-predictor` - Resume prediction + ATS + live international jobs + voice assistant
- `/rexcode` - AI website generation page
- `/login` - Login
- `/register` - Register

## API Integration

### Backend API client
- File: `frontend/src/services/apiClient.js`
- Base URL: `VITE_API_BASE_URL`
- Adds auth token automatically from local/session storage

### Resume + ML
- File: `frontend/src/services/mlServiceApi.js`
- Primary path: backend proxy (`/ml/...`)
- Fallback path: direct ML service (`VITE_ML_SERVICE_BASE_URL`) when proxy is unavailable

### ATS
- File: `frontend/src/services/atsApi.js`
- Endpoints used:
  - `POST /ml/upload-resumes`
  - `POST /ml/match`
  - `GET /ml/rank`

### Rexcode AI
- File: `frontend/src/services/rexcodeApi.js`
- Endpoint:
  - `POST /rexcode/generate`

## Key Feature Pages

### Resume Predictor
- File: `frontend/src/pages/ResumePredictor/ResumePredictor.jsx`
- Features:
  - Upload `.pdf/.doc/.docx`
  - Shows name, education, experience, predicted role, ATS score
  - Auto/manual JD support
  - Missing skills display
  - ATS ranking for multiple resumes
  - Voice assistant using browser speech synthesis
  - International remote job cards

### Intern Hunt
- File: `frontend/src/pages/InternHunt/InternHunt.jsx`
- Features:
  - Cursor-reactive ring particle animation on canvas
  - Internship cards with filters and search
  - "Coming Soon" placeholders for resume-match extensions

### Home Ask AI
- File: `frontend/src/pages/Home/Home.jsx`
- Uses `useRexcode` hook in `mode: 'answer'` for Q&A output.

## Build for Production

```powershell
npm run build --prefix frontend
npm run preview --prefix frontend
```

## Troubleshooting

### Blank UI / API errors
- Confirm backend is running at `http://127.0.0.1:5000`.
- Confirm `VITE_API_BASE_URL` is correct.

### ML/ATS network errors
- Confirm ML service is running at `http://127.0.0.1:8000`.
- Confirm `VITE_ML_SERVICE_BASE_URL` is correct.

### Voice assistant not speaking
- Use a browser with `speechSynthesis` support (Chrome/Edge recommended).
- Check system/browser audio permissions.

### Live jobs not showing
- Ensure backend has valid `JSEARCH_API_KEY`.
- If rate-limited or unavailable, fallback behavior may show limited results.
