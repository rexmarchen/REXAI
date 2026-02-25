# Production-Level ML Service Integration

## Architecture Overview

```
Frontend (React)
    ↓
Backend (Node.js/Express)
    ↓
ML Service (FastAPI/Python)
    ↓
Database (SQLite in ML Service)
```

## What Changed

### 1. ML Service Database Layer ✅
- **Location**: `ml_service/app/utils/database.py`
- **Technology**: SQLite for persistent storage
- **Tables**:
  - `predictions` - Stores resume predictions with metadata
  - `prediction_jobs` - Stores related job listings for each prediction
- **Features**: Create, read, update, delete operations for predictions

### 2. ML Service Endpoints ✅

#### Prediction Endpoints
- `POST /predict` - Upload resume and get prediction
  - **Parameters**: `file` (multipart), `user_id` (optional)
  - **Response**: Career path, confidence, ATS score, jobs
  - **Storage**: Automatically saves to database
  
- `GET /predictions/{prediction_id}` - Retrieve specific prediction
- `GET /predictions/user/{user_id}` - Get all predictions for a user
- `GET /predictions` - List all predictions (with pagination)
- `DELETE /predictions/{prediction_id}` - Delete a prediction

#### Job Search
- `GET /jobs/search` - Search jobs by query, location, remote status

### 3. Backend Integration ✅

#### New Service: `mlServiceClient.js`
- **Location**: `backend/src/services/mlServiceClient.js`
- **Functions**:
  - `predictCareerPathViaMlService()` - Call ML service for predictions
  - `getPredictionFromMlService()` - Retrieve predictions
  - `getUserPredictionsFromMlService()` - Get user's predictions
  - `deletePredictionFromMlService()` - Delete predictions from ML service
  - `searchJobsViaMlService()` - Search jobs

#### Updated Controller: `resumeController.js`
- Now calls ML Service instead of local analysis
- Falls back to local analysis if ML service is unavailable (optional)
- Stores reference to ML Service prediction ID in MongoDB

#### Updated Model: `Prediction.js`
- Added `mlServicePredictionId` field to reference ML service predictions

#### Configuration: `env.js`
- Added `ML_SERVICE_URL` setting (default: http://localhost:8000)
- Added `USE_FALLBACK_ANALYSIS` setting for graceful degradation

### 4. Enhanced Response Format
The backend now returns both database ID and ML Service prediction ID:
```json
{
  "success": true,
  "fileName": "resume.pdf",
  "prediction_id": "uuid-from-ml-service",
  "db_prediction_id": "mongodb-id",
  "career_path": "Software Engineer",
  "confidence": 0.85,
  "ats_score": 85.0,
  "jobs": [],
  "source": "ml-service"
}
```

## Data Flow

### 1. Resume Upload
```
Frontend → Backend /resume/predict → ML Service /predict → SQLite DB
                ↓
            MongoDB (reference to ML Service)
```

### 2. Prediction Retrieval
```
Frontend → Backend /resume/result/{id} → MongoDB → ML Service (if needed)
```

### 3. Prediction Storage
```
ML Service automatically saves to SQLite:
- Resume content (truncated to 1000 chars)
- Career path prediction
- Confidence score
- ATS score
- Associated job listings
- Timestamps
```

## Database Schema

### predictions table
```sql
CREATE TABLE predictions (
  id TEXT PRIMARY KEY,                    -- UUID
  user_id TEXT,                           -- User reference
  resume_filename TEXT NOT NULL,
  resume_content TEXT,                    -- First 1000 chars
  career_path TEXT,
  confidence REAL,                        -- 0-1 scale
  ats_score REAL,                         -- 0-100 scale
  prediction_data TEXT,                   -- JSON
  created_at TIMESTAMP,
  updated_at TIMESTAMP
)
```

### prediction_jobs table
```sql
CREATE TABLE prediction_jobs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  prediction_id TEXT NOT NULL,            -- Foreign key
  job_data TEXT NOT NULL,                 -- JSON
  created_at TIMESTAMP
)
```

## Running the System

### Terminal 1: ML Service (Python)
```bash
cd C:\Users\anshupal\OneDrive\Desktop\rexionAI
python -m uvicorn ml_service.app.main:app --reload
# Runs on http://localhost:8000
# Database: ml_service/data/predictions.db
```

### Terminal 2: Backend (Node.js)
```bash
cd C:\Users\anshupal\OneDrive\Desktop\rexionAI\backend
npm install  # If needed
npm run dev
# Runs on http://localhost:5000
# Environment: Uses ML_SERVICE_URL from config
```

### Terminal 3: Frontend (React)
```bash
cd C:\Users\anshupal\OneDrive\Desktop\rexionAI\frontend
npm install  # If needed
npm run dev
# Runs on http://localhost:5173
```

## Environment Variables

### Backend (.env or in deployment)
```
ML_SERVICE_URL=http://localhost:8000
USE_FALLBACK_ANALYSIS=true
MONGO_URI=mongodb://localhost:27017/rexion
```

### ML Service (.env)
```
RAPIDAPI_KEY=your-key
RAPIDAPI_HOST=jsearch.p.rapidapi.com
```

## Production Deployment Considerations

### 1. Database Persistence
- SQLite database file is stored in `ml_service/data/predictions.db`
- Backup this file regularly in production
- Consider migrating to PostgreSQL for high-traffic deployments

### 2. API Security
- Add authentication to ML Service endpoints in production
- Use environment variables for API keys
- Enable rate limiting on all endpoints

### 3. Error Handling
- Backend has built-in fallback to local analysis
- All API errors are logged
- Graceful degradation if ML service is unavailable

### 4. Monitoring
- ML Service logs predictions to console
- Backend logs all API calls
- Database stores full audit trail

### 5. Scaling
For production:
- Use PostgreSQL instead of SQLite
- Add API key authentication between services
- Implement caching layer (Redis)
- Use containerization (Docker)
- Load balance multiple ML Service instances

## Testing the Integration

### 1. Start all services
```bash
# Terminal 1
python -m uvicorn ml_service.app.main:app --reload

# Terminal 2
npm run dev

# Terminal 3
npm run dev
```

### 2. Upload a resume
- Go to Frontend: http://localhost:5173
- Navigate to Resume Predictor
- Upload a resume file
- Verify:
  - Prediction is returned
  - Career path is shown
  - ATS score is displayed
  - Jobs are listed

### 3. Check database
```bash
sqlite3 ml_service/data/predictions.db
SELECT * FROM predictions;
SELECT * FROM prediction_jobs;
```

### 4. Verify data persistence
- Upload resume
- Check database
- Retrieve using `/predictions/{id}`
- Verify all data matches

## API Examples

### Upload and Predict
```bash
curl -X POST http://localhost:5000/api/resume/predict \
  -F "file=@resume.pdf" \
  -H "Authorization: Bearer token"
```

### Retrieve Prediction
```bash
curl http://localhost:8000/predictions/prediction-uuid
```

### Get User Predictions
```bash
curl http://localhost:8000/predictions/user/user-id
```

### Search Jobs
```bash
curl "http://localhost:8000/jobs/search?query=Software%20Engineer&remote=true"
```

## Troubleshooting

### "Cannot connect to ML Service"
1. Check ML service is running on port 8000
2. Verify `ML_SERVICE_URL` in backend env
3. Check firewall settings

### "Database locked" error
1. Ensure only one ML service instance is running
2. Check file permissions on `ml_service/data/` directory
3. Restart ML service

### Predictions not being saved
1. Check `ml_service/data/` directory exists
2. Verify write permissions
3. Check ML service logs for errors

### Frontend not showing results
1. Check browser network tab for API errors
2. Verify backend is running on port 5000
3. Check CORS settings in ML service
4. Verify all three services are running

## Files Changed

### Created
- `ml_service/app/utils/database.py` - Database layer
- `backend/src/services/mlServiceClient.js` - ML service integration
- `ML_SERVICE_INTEGRATION.md` - Integration guide

### Modified
- `ml_service/app/main.py` - Added prediction storage and endpoints
- `backend/src/controllers/resumeController.js` - Calls ML service
- `backend/src/models/Prediction.js` - Added ML service reference
- `backend/src/config/env.js` - Added ML service config
- `frontend/src/services/mlServiceApi.js` - ML service client
- `frontend/.env` - Added ML service URL

## Next Steps

1. **Train actual models** for better predictions
2. **Add authentication** to ML service endpoints
3. **Implement caching** for frequently accessed data
4. **Set up monitoring and logging**
5. **Create backup/restore procedures** for database
6. **Add data validation** on all inputs
7. **Implement data privacy** measures
8. **Add rate limiting** to API endpoints
