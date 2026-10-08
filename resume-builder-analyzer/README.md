# ResumeForge & ATS Analyzer

A production-quality **Resume Builder & Deterministic ATS Resume Analyzer** built with Python 3.11+ (FastAPI), React + TypeScript + Vite, Tailwind CSS, PostgreSQL / SQLite via SQLAlchemy + Alembic, and Argon2/JWT authentication.

---

## Features

### 1. Resume Builder (Frontend)
- **Interactive Multi-Section Form**: Contact details, executive summary, work experience (with multiple roles and dynamic bullet points), key projects, education, skills (with 0–100 proficiency level), languages, and certifications. Add, delete, and drag/reorder items.
- **24 Professional Templates**: All templates share the same semantic HTML structure and differ only by CSS variables and layout classes:
  - **Layouts**: Left Sidebar, Right Sidebar, Banner + Left Sidebar, Banner + Right Sidebar, Single Column.
  - **Heading Styles**: Underline, Filled Bar, Left Border, Spaced Caps, Serif Sentence Case, Dot Marker.
  - **Features**: Skill bars, skill pills, timeline nodes, and initials avatar.
  - **2 Dedicated ATS-Friendly Templates**: `ats-classic` & `ats-minimal` (single-column, monochrome, zero icons, pure text hierarchy).
- **Template Picker Gallery**: Live thumbnails, accent color palette switcher, and Google Fonts typography switcher (Inter, Outfit, Merriweather, Playfair, JetBrains Mono).
- **Live A4 Preview**: Rendered at standard A4 dimensions (`794 x 1123 px`) updating in real-time as you type, complete with zoom controls (50% – 120%).
- **Live ATS Score Panel**: Re-scores your resume on a **debounced 800 ms** interval as you edit.
- **Export Options**:
  - **PDF Export**: Print stylesheet with `@page A4`, margin 0, and exact background colors preserved (`-webkit-print-color-adjust: exact`).
  - **DOCX Export**: Generates and downloads native, well-styled Microsoft Word (`.docx`) files.
- **Autosave & Multi-Resume Management**: Automatic cloud/local saving, resume cloning, and deletion.

### 2. Resume Analyzer Engine (Backend)
- **Endpoint**: `POST /api/analyze` (multipart file upload up to 5 MB for PDF, DOCX, TXT; optional target job description; optional AI toggle).
- **Builder JSON Endpoint**: `POST /api/analyze/json` allows scoring directly from builder state.
- **Parsing Pipeline**:
  - PDF text, tables, images, multi-column word distributions, and scanned image detection via `pdfplumber`.
  - DOCX paragraphs, runs, and tables via `python-docx`.
  - Heading detection for `summary`, `experience`, `education`, `skills`, `projects`, `certifications`.
  - Date range parser detecting employment gaps over 6 months and verifying strict reverse-chronological ordering.
- **6 Deterministic Scoring Categories**:
  - **ATS Compatibility (20%)**: Flags scanned files, multi-columns, tables, images, missing headings.
  - **Content Quality (25%)**: Action verbs (target ≥ 80%), quantifiable metrics (%, $, counts), weak phrases, overly long bullets.
  - **Job Match (25%)**: Skill coverage via 500+ skills taxonomy with synonyms, plus term cosine similarity. (Renormalized across the other 5 categories if no JD is provided).
  - **Structure (10%)**: Email, phone, LinkedIn, summary, chronological order, employment gaps.
  - **Language (10%)**: Pronouns ("I", "me"), corporate buzzwords ("synergy"), repetitive bullet starters.
  - **Format (10%)**: Word count (350–800 ideal) and page bounds (max 2 pages).
- **Explainability**: Every deducted point generates a structured issue with `severity` (high, medium, low), message, concrete fix, and exact evidence text from the resume.
- **Optional Anthropic Claude AI Layer**: Provides strengths, weaknesses, and up to 5 bullet rewrites with placeholders like `[X%]`. Includes automatic PII scrubbing and prompt-injection defense. Never alters the deterministic rule-based score.

---

## Quickstart

### Option A: One-Command Docker Compose (Recommended)

From the project root:
```bash
docker compose up --build
```

- **Frontend**: http://localhost:3000
- **Backend API & Swagger Docs**: http://localhost:8000/docs
- **PostgreSQL Database**: Port 5432

### Option B: Local Development

#### 1. Backend Setup
```bash
cd resume-builder-analyzer/backend

# Create virtual environment
python -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Run migrations
alembic upgrade head

# Start API server
uvicorn app.main:app --reload --port 8000
```

#### 2. Frontend Setup
```bash
cd resume-builder-analyzer/frontend

# Install dependencies
npm install

# Start Vite dev server
npm run dev
```
Open http://localhost:5173.

---

## Testing & Quality Assurance

### Run Backend Tests (Pytest)
```bash
cd resume-builder-analyzer/backend
.\.venv\Scripts\python.exe -m pytest -v
```
Output:
```
============================= test session starts =============================
collected 20 items

tests/test_api.py ......                                                 [ 30%]
tests/test_engine.py ..........                                          [ 80%]
tests/test_parser.py ....                                                [100%]

============================= 20 passed in 2.22s ==============================
```

### Run Frontend State & Conformance Tests
```bash
cd resume-builder-analyzer/frontend
npm test
```
Output:
```
✔ Resume Templates: exactly 24 templates defined (68ms)
ℹ pass 1
ℹ fail 0
```

---

## Current Scope & Limitations
- **Language**: English language resumes and job descriptions are currently supported.
- **OCR Engine**: Pure image scans are flagged as unreadable/scanned ATS issues rather than running heavy Tesseract/OCR libraries.
- **ATS Advisory**: Scoring is strictly advisory based on industry recruiting benchmarks; no "100% guarantee" is claimed.

## Next Improvements & Roadmap
1. Multi-language support (Spanish, French, German) with localized action verb dictionaries.
2. Direct integration with LinkedIn profile import.
3. PDF text-layer vector search for semantic matching using locally-cached ONNX sentence embeddings.
