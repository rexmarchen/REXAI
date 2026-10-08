# Rexion: smarter internships + skill-gap analysis

Stack assumed: Next.js 14 (App Router), TypeScript, PostgreSQL, Prisma, Zod, Tailwind.

## Setup
```bash
npm i @prisma/client zod && npm i -D prisma
# .env
DATABASE_URL=postgresql://...
REPORT_SALT=<random 32+ chars>
CRON_SECRET=<random 32+ chars>
npx prisma migrate dev --name init
```
Copy `lib/`, `components/`, `app/`, `prisma/` into your project (the `@/` alias must point at the project root).

## Cron (vercel.json), re-verifies the stalest 100 listings every 3 hours
```json
{ "crons": [{ "path": "/api/cron/verify", "schedule": "0 */3 * * *" }] }
```
Vercel sends `Authorization: Bearer $CRON_SECRET` automatically.

## Wire your scraper
```ts
import { ingest } from "@/lib/ingest";
await ingest({ source: "x", sourceUrl, applyUrl, title, company, description, stipendText, durationText, location });
```

## How each feature is "real"
- Filters: scraped text is parsed into structured columns (`lib/normalize.ts`) and queried by indexed SQL.
- "Verified Xh ago": `lastVerifiedAt` moves only when the apply link returns a live page. Unreachable links are NOT marked verified; closed or past-deadline ones are expired.
- Trust flags: explainable rules in `lib/trust.ts` (fee requests, WhatsApp-only apply, free-mail contact, domain mismatch, stipend outlier vs the domain median, student reports, staleness).
- Report button: one report per person per listing (hashed IP+UA), 10/day cap, auto-pulls a listing from search at 3 reports (2 for money/fake-company reports).
- Skill gap: role requirements are computed from live listings' extracted skills (demand %), not hardcoded. Refuses to answer if under 15 listings match.

## Before launch
1. Seed `SkillResource` with real free courses per skill (the gap list shows "No resource added" otherwise).
2. Add real rate limiting (Upstash/Redis) on `/api/skill-gap` and `/api/internships/*/report`.
3. Review `UNDER_REVIEW` listings in an admin view. Auto-hide is a safeguard, not a verdict.
4. Check each source site's terms before scraping, and link to the original apply URL (already done).
5. Tune regexes in `lib/trust.ts` against real scraped data and add tests; expect false positives early.
