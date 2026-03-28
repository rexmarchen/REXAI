# REXION Platform

REXION Platform is the canonical Next.js app for the rebuild in this repo.

It includes:

- SaaS landing page in `src/app/page.tsx`
- Auth flow with NextAuth v5-style config
- Dashboard shell with plan-aware navigation
- Outreach Automation module
- Micro-Internship Arena module
- Stripe billing routes with local fallback behavior
- Hybrid storage model: MongoDB when configured, in-memory fallback for local development

## Stack

- Next.js 14 App Router
- TypeScript
- Framer Motion
- CSS Modules + global design tokens
- NextAuth
- Mongoose
- BullMQ + Redis
- Stripe
- OpenAI
- React Query
- Zustand

## Canonical App Structure

The active app lives under:

- `src/app`
- `src/components`
- `src/lib`
- `src/models`
- `src/hooks`
- `src/styles`
- `worker`

Legacy services at the repo root still exist for transition work:

- `../frontend`
- `../backend`
- `../ml_service`

## Environment

Copy `.env.example` to `.env.local` and fill in what you have:

```powershell
Copy-Item .env.example .env.local
```

Minimum local setup:

- `NEXTAUTH_SECRET`
- `NEXTAUTH_URL=http://localhost:3000`

Optional but supported:

- `MONGODB_URI`
- `REDIS_URL`
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `STRIPE_PRO_PRICE_ID`
- `STRIPE_ELITE_PRICE_ID`
- `SENDGRID_API_KEY`
- `SENDGRID_FROM_EMAIL`
- `SMTP_HOST`
- `SMTP_PORT`
- `SMTP_USER`
- `SMTP_PASS`
- `APOLLO_API_KEY`
- `HUNTER_API_KEY`
- `CLEARBIT_API_KEY`
- `OPENAI_API_KEY`
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `NEXT_PUBLIC_APP_URL=http://localhost:3000`

If Mongo, Redis, Stripe, or provider keys are missing, the app falls back to local/demo behavior where possible so the UI still runs.

## Install

From `rexion-platform/`:

```powershell
npm install
```

## Run

Start the app:

```powershell
npm run dev
```

Open:

- Landing page: `http://localhost:3000`
- Login: `http://localhost:3000/login`
- Signup: `http://localhost:3000/signup`
- Dashboard: `http://localhost:3000/dashboard`
- Outreach: `http://localhost:3000/dashboard/outreach`
- Outreach history: `http://localhost:3000/dashboard/outreach/history`
- Micro-Internships: `http://localhost:3000/dashboard/micro-internships`
- Leaderboard: `http://localhost:3000/dashboard/micro-internships/leaderboard`
- Post a gig: `http://localhost:3000/dashboard/micro-internships/post`

Optional worker when `REDIS_URL` is configured:

```powershell
npm run worker
```

## Demo Credentials

The local in-memory store seeds a demo user:

- Email: `demo@rexion.ai`
- Password: `password123`

This is only for local fallback mode when MongoDB is not configured.

## Verification Commands

Typecheck:

```powershell
npm run typecheck
```

Tests:

```powershell
npm test
```

Production build:

```powershell
npm run build
```

## Manual Verification Checklist

Landing and auth:

- Open `/` and confirm the landing sections render in the green/black/white theme.
- Confirm `/login` and `/signup` load correctly and submit without layout issues.
- Confirm unauthenticated access to `/dashboard` redirects to `/login`.

Dashboard shell:

- Verify sidebar collapse works.
- Verify gated items show plan badges.
- Verify the billing page opens a Stripe portal URL or local fallback URL.

Outreach:

- Search a company and select it.
- Confirm contacts load and filters work.
- Generate an email draft and preview substitutions.
- Send a campaign and confirm the progress state updates.
- Open `/dashboard/outreach/history` and expand a campaign row.

Micro-Internships:

- Switch between matched and browse views.
- Open a gig detail page.
- Open the apply modal and submit an application as a Pro/Elite user.
- Confirm free users see the upgrade gate when they try to apply.
- Open the leaderboard page and verify filtering works.
- Open the post-gig page with a company/admin role and submit a gig.

Billing and account:

- Start Pro/Elite checkout from pricing.
- Confirm local fallback checkout upgrades the plan when Stripe keys are missing.
- Verify `/api/user/export` returns account data when authenticated.
- Verify account deletion route responds successfully.

## Notes

- Build currently succeeds. Next may still emit `jose` edge-runtime warnings from `next-auth/jwt` in middleware; these are warnings, not build blockers.
- Redis-backed campaign status progression is implemented through `worker/email-worker.ts`. Without Redis, outreach sends inline and updates immediately.
- Mongo-backed persistence is used when `MONGODB_URI` is present; otherwise the app uses in-memory records for local development.
