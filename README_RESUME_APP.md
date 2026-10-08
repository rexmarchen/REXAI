# ResumeForge & ATS Analyzer (Quick Reference)

The complete production-quality Resume Builder and ATS Analyzer application is located in `resume-builder-analyzer/`.

## One-Command Startup
```bash
docker compose up --build
```
- Frontend UI: http://localhost:3000
- Backend Swagger Docs: http://localhost:8000/docs

## Running Tests
- **Backend Tests**:
  ```bash
  cd resume-builder-analyzer/backend
  .\.venv\Scripts\python.exe -m pytest -v
  ```
- **Frontend Tests**:
  ```bash
  cd resume-builder-analyzer/frontend
  npm test
  ```

For full architecture details, see [resume-builder-analyzer/ARCHITECTURE.md](resume-builder-analyzer/ARCHITECTURE.md).
