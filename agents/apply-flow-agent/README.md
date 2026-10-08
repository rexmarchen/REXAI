# Advanced Resume Auto-Apply Pipeline (5 Stages)

## One-click dashboard workflow

`POST /api/one-click-discovery` accepts a resume plus optional candidate details and runs upload, parsing, profile extraction, analysis, and job matching as one server request. It returns only Greenhouse/Lever jobs dated within the last 48 hours. The dashboard then lets the candidate select jobs and explicitly invoke `POST /api/auto-apply/:resumeId`.

This separation is intentional: discovery can be one click, while a real external submission remains a deliberate, auditable user action.

## Production requirements

- Set `ALLOWED_ORIGINS` to the deployed dashboard origin(s); never use a wildcard for a resume-processing API.
- Supply `ADZUNA_APP_ID`, `ADZUNA_APP_KEY`, `GROQ_API_KEY`, `RESEND_API_KEY`, and `LIVE_SUBMIT=false` initially.
- Replace `tempStore.js` with encrypted, per-user persistent storage (Redis plus object storage) before horizontally scaling. Its in-memory state is development-only.
- Run browser workers in an isolated queue, persist application audit events/results, and protect every route with authenticated user identity instead of trusting browser-provided contact fields.
- Keep CAPTCHA, screening questions, work authorization, and demographic fields as `NEEDS_USER_INPUT`; do not attempt to bypass them.

An Express API that implements an end-to-end job matching, rephrasing, and Puppeteer form-filling automation pipeline.

---

## 🛠️ The 5-Stage Architecture

### **STAGE 1 — Resume Upload & Parsing**
* **Endpoint**: `POST /api/upload-resume`
* **Upload**: Multipart form-data with the `resume` field (PDF or DOCX).
* **Process**: Extracts raw text using `pdf-parse` or `mammoth`.
* **Output**: Generates a UUID `resumeId` and caches the document details in an in-memory database store.

### **STAGE 2 — AI Resume Rephrasing**
* **Endpoint**: `POST /api/rephrase-resume/:resumeId`
* **Process**: Calls Groq API (`llama-3.3-70b-versatile`) with JSON format enabled. It rewrites each resume bullet point for action verbs and quantified impact, and extracts a structured candidate profile `{ skills, yearsExperience, targetRole, summary }`.
* **Output**: Saves the rephrased resume text and candidate profile to the cache.

### **STAGE 3 — Job Matching**
* **Endpoint**: `GET /api/matched-jobs/:resumeId`
* **Process**: Queries the live Adzuna jobs API using the extracted target role and skills. Scores matches based on a custom weighted algorithm (70% skill overlap + 30% experience ratio).
* **Output**: Returns the top 15 matching jobs sorted by score. It automatically labels the `applyType` as `"easy_apply"` (Greenhouse/Lever) or `"external_ats"` (other platforms).

### **STAGE 4 — Stateful Puppeteer Auto-Apply**
* **Endpoint**: `POST /api/auto-apply/:resumeId`
* **Body**: `{ jobIds: string[], email: string, phone?: string, fullName?: string }`
* **Process**: Launches a stateful Puppeteer session with a persistent user data directory (`./session-data`). For each selected job:
  1. Navigates to the posting URL.
  2. Resolves fields dynamically using external CSS selector configs ([`siteSelectors.js`](file:///c:/Users/anshupal/OneDrive/Desktop/rexionAI/apply-flow-service/services/siteSelectors.js)).
  3. Fills out contact details, uploads the resume file, and inputs the rephrased summary into textareas.
  4. Applies randomized delays (3 to 8 seconds) to mimic human pacing.
  5. Submits or dry-runs depending on `LIVE_SUBMIT` configuration.
  6. Logs steps to console and a local file (`logs/apply-run-<date>.log`).
* **Output**: Records outcomes per job (`"applied"`, `"ready_to_submit"`, `"failed"`, or `"skipped"`).

### **STAGE 5 — Confirmation Email**
* **Trigger**: Automatically runs at the end of Stage 4.
* **Process**: Sends a styled email report using Resend to the candidate summarizing the batch outcomes.

---

## 🚀 Environment Toggles

### **LIVE_SUBMIT**
Set in your `.env` file:
* `LIVE_SUBMIT=false` **(Recommended for Testing)**: Puppeteer will navigate, fill in forms, and upload resumes, but will halt at the final screen and record status `"ready_to_submit"`. This allows you to verify that Puppeteer's selectors are locating elements correctly without submitting real applications.
* `LIVE_SUBMIT=true` **(Production)**: Puppeteer will click the real submit button on the ATS page, submitting your application to the recruiter.

---

## 🔑 Stateful Login Setup (First-Time Verification)

To bypass bot verification gates, email verification, or SSO logins, this app uses a persistent browser data directory: `./session-data`.

### **How to do your FIRST login manually:**
1. Temporarily configure Puppeteer to run in headed mode by setting `headless: false` in [`services/autoApply.js`](file:///c:/Users/anshupal/OneDrive/Desktop/rexionAI/apply-flow-service/services/autoApply.js#L40):
   ```javascript
   const browser = await puppeteer.launch({
     headless: false,
     userDataDir: './session-data',
     // ...
   });
   ```
2. Start the server and run a test application, or launch a chromium instance pointing to this directory.
3. When the browser opens, manually solve any Captchas, log in to your Greenhouse/Lever candidate accounts, or complete email verification once.
4. Close the browser. Puppeteer will save the cookies and sessions inside `./session-data`.
5. Change the config back to `headless: true`. Future automated runs will reuse this logged-in state without needing manual input.

---

## 🛠️ Setup & Run Instructions

1. Install dependencies:
   ```bash
   cd apply-flow-service
   npm install
   ```
2. Copy `.env.example` to `.env` and fill in credentials.
3. Start development server:
   ```bash
   npm run dev
   ```
