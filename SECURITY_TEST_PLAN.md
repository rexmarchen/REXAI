# REXION AI — Security Test Plan & Verification Procedures

**Target:** REXION AI Application  
**Audience:** QA Engineers, Security Engineers, DevOps  
**Version:** 1.0.0  
**Scope:** Automated & Manual Verification of Production Security Controls  

---

## 1. Quick Local Execution Commands

Run the full automated security regression test suite locally:

```bash
# In backend directory
cd backend
npm run test:security
```

Run all unit, integration, and security tests:

```bash
cd backend
npm test
```

Run dependency vulnerability scans:

```bash
cd backend
npm audit --omit=dev --audit-level=high
```

Scan for tracked secrets in Git repository:

```bash
# In project root
git ls-files | grep -E '^(\.env|backend/\.env|frontend/\.env|ml_service/\.env)$'
```

---

## 2. Automated Regression Test Suite Specification

The automated regression test suite is implemented in [`backend/tests/security-regression.test.mjs`](file:///c:/Users/anshupal/OneDrive/Desktop/rexionAI/backend/tests/security-regression.test.mjs).

| Test # | Target Domain | Scenario / Vector | Expected Result | Pass Criteria |
| :--- | :--- | :--- | :--- | :--- |
| **Test 1** | Code Sandbox (Python) | `import os; os.system("whoami")` | Sandbox validation error | Output contains `Disallowed operation` |
| **Test 2** | Code Sandbox (JS) | `const { execSync } = require('child_process')` | Sandbox validation error | Output contains `Disallowed operation` |
| **Test 3** | Code Sandbox | Legitimate algorithm (`def two_sum(...)`) | Code permitted | Output confirms allowed execution |
| **Test 4** | Code Sandbox (DoS) | Code snippet > 50KB in length | Payload size rejection | Output contains `Code payload exceeds maximum size` |
| **Test 5** | NoSQL Injection | Payload with `{"$gt": "", "$ne": null}` | Stripped clean of operators | Key names starting with `$` are removed |
| **Test 6** | Stored XSS | `<img src=x onerror=alert(1)>`, `<script>` | Neutralized attributes/tags | Event handlers and scripts stripped |
| **Test 7** | BOLA / IDOR | Header `x-user-id: victim123` | Server ignores header | Context resolves to verified JWT identity |
| **Test 8** | Mass Assignment | Update `{ role: "admin", verified: true }` | Protected fields removed | Resulting document retains original role |
| **Test 9** | Information Disclosure | `GET /api/quizzes/:id` | Answers redacted | `correctIndex` and `explanation` are undefined |
| **Test 10** | Path Traversal | Filename `../../../../etc/passwd` | Directory traversal stripped | Sanitized to simple base filename |
| **Test 11** | Upload Extensions | Extension `.exe`, `.sh`, `.php` | File rejected | Validation blocks unlisted file types |
| **Test 12** | Multi-Tenant Isolation | Unauthenticated `/discover` call | No other candidate profile used | Fallback does not cross tenant boundary |
| **Test 13** | BOLA Defense (Email) | User A fetches User B email file | Access denied | Non-recipients cannot access emails |
| **Test 14** | BOLA Defense (Evidence) | User A fetches unowned evidence | Access denied | Unowned application evidence rejected |
| **Test 15** | Secret Hardening | Controller inspection | No hardcoded API keys | Controller has no embedded credentials |
| **Test 16** | Session Hardening | Production session initialization | Fatal error if secret unset | Enforces strong entropy in production |

---

## 3. Staging HTTP Manual Verification Test Cases (cURL)

Set your staging base URL:
```bash
export API_URL="http://localhost:5000"
# or your staging domain
# export API_URL="https://staging-api.rexion.ai"
```

### Case 1: Unauthorized Resume Download (VULN-01)
- **Goal:** Verify that sensitive documents cannot be downloaded without valid authentication.
- **Request:**
  ```bash
  curl -i "$API_URL/uploads/sample-resume.pdf"
  ```
- **Expected Outcome:** `HTTP/1.1 401 Unauthorized` or `403 Forbidden` with `{ "error": "Authentication required to access documents" }`.

### Case 2: Public Asset Download (Non-Sensitive)
- **Goal:** Verify that legitimate UI images and media assets continue to serve normally.
- **Request:**
  ```bash
  curl -i "$API_URL/uploads/default-avatar.png"
  ```
- **Expected Outcome:** `HTTP/1.1 200 OK` with appropriate `Content-Type: image/png`.

### Case 3: BOLA Spoofing via `x-user-id` Header (VULN-02)
- **Goal:** Verify that supplying an arbitrary `x-user-id` header does not impersonate another user.
- **Request:**
  ```bash
  curl -i -X GET "$API_URL/api/skill-gap" \
    -H "Authorization: Bearer <VALID_USER_A_TOKEN>" \
    -H "x-user-id: 651111111111111111111111"
  ```
- **Expected Outcome:** The returned skill gap analysis corresponds strictly to User A, not the spoofed ID `651111111111111111111111`.

### Case 4: Pre-Submission Quiz Answer Disclosure (VULN-03)
- **Goal:** Verify that answers are not leaked when fetching active quiz questions.
- **Request:**
  ```bash
  curl -i -X GET "$API_URL/api/quizzes/active-quiz-id" \
    -H "Authorization: Bearer <VALID_TOKEN>"
  ```
- **Expected Outcome:** Response JSON questions array does NOT contain `correctIndex`, `correct`, or `explanation` properties.

### Case 5: AI Tutor Cross-User Session Snooping (VULN-04)
- **Goal:** Verify that User B cannot view User A's tutoring session.
- **Request:**
  ```bash
  curl -i -X GET "$API_URL/api/tutor/sessions/<USER_A_SESSION_ID>" \
    -H "Authorization: Bearer <USER_B_TOKEN>"
  ```
- **Expected Outcome:** `HTTP/1.1 404 Not Found` or `403 Forbidden`.

### Case 6: Malicious Code Execution (RCE Sandbox Check)
- **Goal:** Verify that attempts to execute arbitrary subprocesses in Python or Node.js are rejected.
- **Request:**
  ```bash
  curl -i -X POST "$API_URL/api/code-arena/run" \
    -H "Authorization: Bearer <VALID_TOKEN>" \
    -H "Content-Type: application/json" \
    -d '{
      "language": "python",
      "code": "open(\"/etc/passwd\", \"r\").read()"
    }'
  ```
- **Expected Outcome:** `HTTP/1.1 400 Bad Request` with error detailing disallowed file access pattern.

### Case 7: Unquoted Attribute Stored XSS Injection (VULN-07)
- **Goal:** Verify that unquoted event handlers in user profile updates are stripped.
- **Request:**
  ```bash
  curl -i -X PUT "$API_URL/api/profile" \
    -H "Authorization: Bearer <VALID_TOKEN>" \
    -H "Content-Type: application/json" \
    -d '{
      "bio": "<img src=x onerror=alert(1)> Software Engineer"
    }'
  ```
- **Expected Outcome:** Profile bio is stored with the `onerror` attribute stripped out: `<img src=x> Software Engineer`.

---

## 4. Continuous Integration (CI) Security Pipeline

A GitHub Actions workflow is established at [`.github/workflows/security-ci.yml`](file:///c:/Users/anshupal/OneDrive/Desktop/rexionAI/.github/workflows/security-ci.yml).

The pipeline automatically runs on every `push` and `pull_request` to enforce:
1. **Security Regression Tests:** `npm run test:security` (blocks build on failure).
2. **Core Unit & Integration Tests:** `npm test` (ensures zero functionality regression).
3. **High-Severity Dependency Audits:** `npm audit --omit=dev --audit-level=high`.
4. **Git Tracked Secret Verification:** Validates that no `.env` files are tracked in the Git repository.
5. **Gitleaks Secret Scanning:** Scans commits for accidental secret additions.

---

## 5. Security Sign-off & Verification Criteria

| Verification Gate | Required Threshold | Current Status |
| :--- | :--- | :--- |
| Automated Security Regression Suite | 100% Pass (16/16 tests) | **PASSED** |
| Existing Core Test Suite | 100% Pass | **PASSED** |
| High/Critical Vulnerabilities in Code | 0 Unresolved | **PASSED** |
| Document Exposure via Static Uploads | Authenticated & Ownership Enforced | **VERIFIED** |
| Untrusted Client User ID Trust | 0 Endpoints Accepting Spoofed IDs | **VERIFIED** |
| Tracked Production Credentials | 0 In Git Index | **VERIFIED** |
