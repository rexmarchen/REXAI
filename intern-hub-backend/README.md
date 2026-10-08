# Intern Hub Backend

A production‑ready backend that fetches internship listings from the Adzuna API.

## Setup

1. Clone the repository.
2. Copy `.env.example` to `.env` and fill in your Adzuna API credentials.
3. Install dependencies: `npm install`
4. Run in development: `npm run dev`
5. Run in production: `npm start`

## API Endpoints

- `GET /health` – Health check.
- `GET /api/internships` – Get internship listings.
  Query parameters:
  - `what` (default: "internship")
  - `location` (default: "London")
  - `results_per_page` (default: 10, max 50)

## Testing

`npm test`

## Folder Structure
