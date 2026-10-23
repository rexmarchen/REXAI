# ARCHIVE NOTICE — rexion-platform (Experimental Prototype)

> **Notice Date:** October 19, 2026  
> **Status:** ARCHIVED / ISOLATED EXPERIMENT  
> **Canonical Application Stack:** `frontend/` (React 18 + Vite) & `backend/` (Express + MongoDB Atlas)

---

### Context
`rexion-platform/` was created as an experimental Next.js 14 (App Router) prototype with Prisma ORM.

### Production Guidance
1. **Active Core Services:** The production architecture of REXION AI is powered by:
   - Client Portal: `frontend/` (Port 5173 / Production Rollup bundle)
   - API Backend: `backend/` (Port 5000 / Express with Mongoose)
   - Intern Hub: `intern-hub-backend/` (Port 5051)
   - Autonomous Apply Flow: `agents/apply-flow-agent/` (Port 3000)
2. **Do Not Deploy:** Do NOT deploy or run `rexion-platform` as the primary user interface. It is disconnected from active MongoDB models and session stores.
3. **Reference Only:** Files in this directory are preserved strictly for UI design reference and future migration studies.
