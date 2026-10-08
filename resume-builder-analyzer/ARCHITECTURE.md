# Architecture & System Design Document

## 1. System Overview

**ResumeForge & ATS Analyzer** is a production-grade, full-stack application designed to build pixel-perfect, ATS-compliant resumes and provide deterministic, explainable resume evaluations against industry standards and job descriptions.

```
┌────────────────────────────────────────────────────────┐
│               Frontend: React + Vite + TS              │
│  - Live Form Editor (Drag-and-Drop / Reordering)       │
│  - 24 CSS-Driven Templates (Single HTML Structure)     │
│  - Pixel-Accurate A4 Preview (794 x 1123 px)           │
│  - Live Debounced (800ms) Quality Score Dial           │
│  - Upload & Diagnostic Audit Dashboard                 │
└───────────────────────────┬────────────────────────────┘
                            │ REST API (JSON / Multipart)
┌───────────────────────────▼────────────────────────────┐
│              Backend: FastAPI + Python 3.11+           │
│  - Auth: Argon2 Password Hashing + JWT Access/Refresh  │
│  - Storage: SQLAlchemy + Alembic (SQLite / PostgreSQL) │
│  - Exports: Exact @page A4 Print PDF & Native DOCX     │
└───────────────────────────┬────────────────────────────┘
                            │ Pipeline Execution
┌───────────────────────────▼────────────────────────────┐
│              Deterministic Analyzer Engine             │
│  1. Parser: pdfplumber, python-docx, text extraction   │
│  2. Structural & Layout Diagnostics                    │
│  3. Date Gap & Reverse-Chronological Validation        │
│  4. Action Verbs, Metrics, & Content Scoring           │
│  5. 500+ Skills Taxonomy & Cosine Similarity Match     │
│  6. Explainable Issue Deduction Generator              │
│  7. Optional Claude AI Layer (PII-Scrubbed & Isolated) │
└────────────────────────────────────────────────────────┘
```

---

## 2. Deterministic Scoring Engine & Weight Renormalization

The scoring engine guarantees **100% determinism**: identical inputs will always generate identical mathematical scores and issue lists. Every point lost maps directly to an explainable issue containing concrete guidance and source evidence.

### Category Weights

| Category | Base Weight (With JD) | Renormalized Weight (Without JD) | Checks Performed |
|---|---|---|---|
| **ATS Compatibility** | **20%** | **26.67%** | Scanned file detection, multi-column layouts, tables, images, standard section headings (`experience`, `education`, `skills`). |
| **Content Quality** | **25%** | **33.33%** | Action verbs (target ≥ 80%), quantifiable metrics (%, $, counts), weak/passive phrasing ("responsible for", "worked on"), excessively long bullets (> 38 words). |
| **Job Match** | **25%** | **0% (Excluded)** | Taxonomy-backed skill coverage (70% weight) + Term frequency cosine similarity (30% weight). |
| **Structure** | **10%** | **13.33%** | Email, phone number, LinkedIn presence, executive summary, date gaps (> 6 months), reverse-chronological order. |
| **Language** | **10%** | **13.33%** | First-person pronouns ("I", "me", "my"), overused corporate clichés/buzzwords ("synergy", "rockstar"), repetitive bullet starters. |
| **Format** | **10%** | **13.33%** | Word count bounds (350–800 ideal, penalties for < 120 or > 1,100), page count compliance (max 2 pages). |

### Grade Scale
- **A+**: 90.0 – 100.0
- **A**: 80.0 – 89.9
- **B**: 70.0 – 79.9
- **C**: 60.0 – 69.9
- **D**: 50.0 – 59.9
- **F**: < 50.0

---

## 3. Skills Taxonomy & Synonym Resolution

The taxonomy (`app/data/skills_taxonomy.json`) contains **500+ categorized skills** across Tech, Data/AI, Design, Marketing, Finance, Sales, Healthcare, and Operations.

- **Synonym Normalization**:
  - `JS`, `ES6`, `ECMAScript` → `JavaScript`
  - `K8s` → `Kubernetes`
  - `TS` → `TypeScript`
  - `AWS` → `Amazon Web Services`
- **Matching Technique**:
  - Boundary-safe matching (`(?<![a-zA-Z0-9])token(?![a-zA-Z0-9])`) preventing substring collisions.
  - Longest-token precedence matching (e.g., "Machine Learning" takes precedence over "Learning").

---

## 4. 24 CSS-Driven Templates Architecture

All 24 templates share a single HTML document structure (`ResumeDocument.tsx`) and vary exclusively through layout flexbox/grid containers and CSS styling variables:

1. **Layouts (5)**:
   - `left-sidebar`
   - `right-sidebar`
   - `banner-left-sidebar`
   - `banner-right-sidebar`
   - `single-column`
2. **Heading Styles (6)**:
   - `underline` (accent bottom border)
   - `filled-bar` (accent background fill with white text)
   - `left-border` (thick vertical accent line)
   - `spaced-caps` (tracking-widest uppercase styling)
   - `serif-sentence` (editorial italic serif)
   - `dot-marker` (circular accent dot indicator)
3. **Dedicated Plain ATS Templates**:
   - `ats-classic` & `ats-minimal`: 100% monochrome, single-column, zero graphic decorators or icons, perfect OCR readability.

---

## 5. Security, Privacy & Fairness Principles

1. **Ephemeral Processing**: Nothing from uploaded files is stored on disk or in the database. Files are read in-memory and immediately garbage-collected.
2. **Strict Validation**: Content signature verification (preventing disguised `.exe` binaries), file extension verification, and 5 MB file size limit enforcement (returning HTTP 413, 415, 422).
3. **PII Sanitization**: All contact information, emails, phone numbers, and web links are scrubbed before invoking the optional AI critique.
4. **Prompt-Injection Defense**: The AI prompt explicitly instructs the LLM that the resume text is **untrusted data** and system instructions within it must be ignored.
5. **No Pass Guarantees**: Scores are presented purely as advisory guidance to assist job seekers without deceptive pass claims.
6. **Account Deletion**: Full GDPR/CCPA compliance allowing users to permanently delete their account and associated resumes in one click (`DELETE /api/auth/account`).
