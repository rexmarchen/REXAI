# ATS Resume Prediction System (Python + FastAPI)

Production-ready ATS system that supports:

- Multiple resume upload (`PDF`/`DOCX`)
- Resume category prediction
- ATS score vs job description
- Skill extraction and missing-skills analysis
- Resume ranking by ATS score

## Project Structure

```text
ats_system/
 ├── app/
 │   ├── main.py
 │   ├── routers/
 │   │   ├── upload.py
 │   │   ├── match.py
 │   ├── services/
 │   │   ├── parser.py
 │   │   ├── matcher.py
 │   │   ├── skill_extractor.py
 ├── ml/
 │   ├── embedder.py
 │   ├── classifier.py
 │   ├── train.py
 ├── data/
 │   ├── sample_resumes/
 │   │   ├── labeled_resumes.csv
 │   │   ├── resume_ai_sample.txt
 │   │   ├── resume_web_sample.txt
 │   ├── example_job_description.txt
 │   ├── skills.json
 ├── models/
 │   ├── vectorizer.pkl
 │   ├── classifier.pkl
 ├── scripts/
 │   ├── train_model.py
 ├── requirements.txt
```

## Setup

1. Create and activate virtual environment:

```bash
cd ats_system
python -m venv .venv
.venv\Scripts\activate
```

2. Install dependencies:

```bash
pip install -r requirements.txt
```

3. Train model:

```bash
python scripts/train_model.py
```

4. Run API:

```bash
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

5. Open docs:

```text
http://127.0.0.1:8000/docs
```

## Example Job Description

See: `data/example_job_description.txt`

## Example Match Request Body

See: `data/example_match_request.json`

## Example API Requests

### 1) Upload multiple resumes

`POST /upload-resumes` with multipart form data key `resumes`:

```bash
curl -X POST "http://127.0.0.1:8000/upload-resumes" ^
  -F "resumes=@C:/path/to/resume1.pdf" ^
  -F "resumes=@C:/path/to/resume2.docx"
```

### 2) Match resumes against JD

`POST /match`

```json
{
  "job_description": "Looking for a machine learning engineer with Python, TensorFlow, MLOps and AWS.",
  "resume_ids": [
    "8b2f5ca1-a520-4cf8-b5ef-7c19f5aa1fa0",
    "ca3275d6-fcbf-4d37-8d0e-4a0937e5fc77"
  ]
}
```

### 3) Rank all uploaded resumes

`GET /rank?job_description=Need%20React%20Node.js%20developer`
