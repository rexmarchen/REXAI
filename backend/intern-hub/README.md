# Intern Hub Backend

Small standalone backend for the `/intern-hunt` page.

## What it does

- Exposes `GET /api/internships/search`
- Exposes `GET /api/ml/jobs/search` as a compatibility alias
- Fetches live internship search results from the Adzuna jobs API
- Adds CORS, in-memory cache, and simple rate limiting

## Run

```bash
cd backend/intern-hub
npm start
```

Default URL: `http://127.0.0.1:5051`

## Frontend connection

Set the frontend env value to:

```env
VITE_INTERN_HUB_API_BASE_URL=http://127.0.0.1:5051/api
```

Add these backend env values before starting:

```env
ADZUNA_APP_ID=your_app_id
ADZUNA_APP_KEY=your_app_key
```

Intern Hunt can use this service directly, or the main backend can proxy the same functionality.
