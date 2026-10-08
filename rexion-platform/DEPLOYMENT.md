# REXION Platform Deployment Guide

This app is ready to deploy as a production Next.js service, but only when the core runtime dependencies are configured.

## Recommended stack

- Frontend/app hosting: Vercel
- Database: MongoDB Atlas
- Queue: Upstash Redis or Redis Cloud
- Billing: Stripe
- Email: SendGrid or SMTP

## Required production environment variables

- `NEXTAUTH_SECRET`
- `NEXTAUTH_URL`
- `NEXT_PUBLIC_APP_URL`
- `MONGODB_URI`

## Required for specific features

- Google auth: `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`
- Billing: `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PRO_PRICE_ID`, `STRIPE_ELITE_PRICE_ID`
- Email: `SENDGRID_API_KEY` and `SENDGRID_FROM_EMAIL`, or `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`
- AI features: `OPENAI_API_KEY`
- Queue worker: `REDIS_URL`

## Important production rules

- Leave `REXION_ENABLE_DEMO_MODE` unset or set it to `false` in production.
- Configure `REXION_UNSUBSCRIBE_SECRET` if you want a dedicated secret for unsubscribe links. Otherwise `NEXTAUTH_SECRET` is used.
- Do not rely on mock billing or in-memory users in production.
- Keep `NEXTAUTH_URL` and `NEXT_PUBLIC_APP_URL` pointed at the exact deployed origin.

## Pre-deploy checklist

1. Run `npm.cmd run typecheck`
2. Run `npm.cmd test`
3. Run `npm.cmd run lint`
4. Run `npm.cmd run build`
5. Confirm all production env vars are set in the host
6. Verify Stripe webhook points to `/api/stripe/webhook`
7. Verify the email sender domain is configured and trusted

## Vercel notes

- Framework preset: `Next.js`
- Root directory: `rexion-platform`
- Build command: `npm run build`
- Output directory: leave default
- Install command: `npm install`

## Queue worker notes

If you enable queued outreach delivery, deploy `worker/email-worker.ts` as a separate worker process with the same environment variables as the web app and a valid `REDIS_URL`.
