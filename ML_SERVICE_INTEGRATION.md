# ML Service Frontend Integration Guide

## Overview
The frontend is now integrated with the ML Service running on `http://localhost:8000`. The integration allows for:

1. **Resume Upload & Career Path Prediction**
2. **ATS Scoring** 
3. **Job Matching & Search**

## Setup

### Environment Variables
The frontend is configured with the ML service URL in `.env`:
```
VITE_ML_SERVICE_BASE_URL=http://127.0.0.1:8000
```

### API Services
The `mlServiceApi.js` provides two main functions:

#### 1. Predict Career Path
```javascript
import { predictCareerPath } from '@/services/mlServiceApi'

// Upload resume and get prediction
const response = await predictCareerPath(file)
// Returns: {
//   career_path: string,
//   confidence: number,
//   ats_score: number,
//   jobs: JobListing[]
// }
```

#### 2. Search Jobs
```javascript
import { searchJobs } from '@/services/mlServiceApi'

// Search for jobs
const jobs = await searchJobs('Software Engineer', {
  location: 'San Francisco',
  remote: true,
  page: 1
})
// Returns: { jobs: JobListing[] }
```

## Integration Points

### ResumePredictor Component
- **Location**: `frontend/src/pages/ResumePredictor/ResumePredictor.jsx`
- **Integration**: The `handleAnalyze` function now:
  1. Tries the ML Service first (`predictCareerPath`)
  2. Falls back to the backend if ML service fails
  3. Normalizes both response formats for UI rendering

### Response Handling
The `normalizePrediction` function handles both:
- **ML Service format**: `career_path`, `confidence`, `ats_score`, `jobs`
- **Backend format**: `predicted_role`, `skills`, `education`, etc.

## Running the System

### Terminal 1: ML Service
```powershell
cd C:\Users\anshupal\OneDrive\Desktop\rexionAI
python -m uvicorn ml_service.app.main:app --reload
```
**Runs on**: `http://localhost:8000`

### Terminal 2: Frontend
```powershell
cd C:\Users\anshupal\OneDrive\Desktop\rexionAI\frontend
npm run dev
```
**Runs on**: `http://localhost:5173`

### Terminal 3: Backend (Optional)
```powershell
cd C:\Users\anshupal\OneDrive\Desktop\rexionAI\backend
npm run dev
```
**Runs on**: `http://localhost:5000`

## API Endpoints

### ML Service Endpoints

#### POST `/predict`
- **Purpose**: Upload resume and get career prediction
- **Request**: `multipart/form-data` with `file` field
- **Response**: 
```json
{
  "career_path": "Software Engineer",
  "confidence": 0.85,
  "ats_score": 85.0,
  "jobs": [
    {
      "title": "Senior Software Engineer",
      "company": "Tech Corp",
      "location": "San Francisco, CA",
      "description": "...",
      "is_remote": true,
      "required_skills": ["Python", "FastAPI"],
      ...
    }
  ]
}
```

#### GET `/jobs/search`
- **Purpose**: Search for jobs
- **Query Parameters**:
  - `query` (required): Job title or keywords
  - `location` (optional): Location filter
  - `remote` (optional): Remote jobs only
  - `page` (optional): Page number
- **Response**:
```json
{
  "jobs": [...]
}
```

## CORS Configuration
The ML Service is configured with CORS middleware to allow requests from:
- `http://localhost:3000`
- `http://localhost:5173`
- `http://127.0.0.1:3000`
- `http://127.0.0.1:5173`
- `*` (all origins for development)

## Testing the Integration

### 1. Test Resume Upload
1. Start the ML Service
2. Start the Frontend
3. Navigate to **Resume Predictor** page
4. Upload a sample resume
5. Verify career path prediction, ATS score, and job matches are displayed

### 2. Test Job Search
Use the NetworkTab in browser DevTools to inspect requests to `/jobs/search`

### 3. Debugging
- Check browser console for API errors
- Check ML Service terminal for request logs
- Verify `.env` file has correct URLs

## Troubleshooting

### "Connection Refused" Error
- Ensure ML Service is running on port 8000
- Check `VITE_ML_SERVICE_BASE_URL` in frontend `.env`

### CORS Errors
- ML Service has CORS middleware configured
- Clear browser cache and restart

### Resume Upload Fails
- Check file size (max 10MB)
- Verify file format (PDF, DOC, DOCX)
- Check ML Service logs for parsing errors

## Next Steps
- Improve resume parser to handle more formats
- Train actual ML models for better predictions
- Connect real RapidAPI job data (add API key)
- Add more filtering options for job search
