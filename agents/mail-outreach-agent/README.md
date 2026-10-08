# Mail Outreach Agent

Sends cold email through a user's own connected Gmail or Outlook mailbox
(OAuth), with a job queue, per-mailbox rate limiting/warm-up, bounce and
reply detection, and a suppression list. Built to inherit the user's real
sender reputation instead of relying on a shared sending domain.

## Why this architecture

- **Sends via the user's real mailbox**, not a relay — SPF/DKIM/DMARC pass
  automatically because Google/Microsoft sign the message themselves.
- **Enqueue, don't send synchronously** — a "send to 500 leads" click creates
  DB rows + queue jobs instantly; a background worker paces the actual sends.
- **Idempotent by construction** — `Send` has a unique `(campaignId, leadId)`
  constraint and the BullMQ job uses that row's id as its `jobId`, so retries
  or duplicate clicks can never double-send.
- **Per-mailbox rate limiting and warm-up ramp** — new mailboxes start at a
  low daily cap and ramp up over `WARMUP_RAMP_DAYS`; every send also has
  random jitter so the pattern doesn't look automated.
- **Auto-pause on bad signals** — if a mailbox's bounce or complaint rate
  crosses the configured threshold, it's paused automatically to protect the
  domain's long-term reputation.
- **Bounces/replies detected by polling**, not webhooks — because sends go
  through the user's real inbox, delivery-status notifications and replies
  land there too, so a scheduled worker scans for them and matches back via
  the `Message-ID` header we generate ourselves.

## Project layout

```
prisma/schema.prisma       Mailbox, Lead, Campaign, Send, Suppression models
src/config/env.ts          Validated environment config (fails fast if misconfigured)
src/lib/                   crypto (token encryption), prisma, redis, logger
src/oauth/                 Google and Microsoft OAuth + token refresh
src/mail/                  MIME builder + per-provider senders (Gmail API, Graph API)
src/suppression/           Suppression list gate, checked before every send
src/queue/
  sendQueue.ts              Enqueue campaign sends (idempotent)
  sendWorker.ts             The actual send loop: rate limit -> send -> classify errors
  rateLimiter.ts            Daily caps, warm-up ramp, jitter, health-based auto-pause
  tokenRefreshWorker.ts     Proactive token refresh sweep every 15 min
src/polling/
  bounceDetector.ts         Gmail bounce/reply detection
  pollWorker.ts             Scheduled sweep every 5 min
src/routes/                 Express routes: auth callbacks, mailboxes, campaigns, leads, unsubscribe
src/server.ts               API entrypoint
scripts/seed.ts              Registers recurring queue sweeps (run once after deploy)
```

## Setup

```bash
cp .env.example .env
# Fill in GOOGLE_*, MS_*, and generate ENCRYPTION_KEY:
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

docker compose up -d          # Postgres + Redis
npm install
npm run prisma:migrate
npm run seed                  # registers recurring token-refresh/poll sweeps
```

### OAuth app setup (required before this works)

- **Google**: Create a project in Google Cloud Console, enable the Gmail
  API, create an OAuth 2.0 Client ID (Web application), add
  `GOOGLE_REDIRECT_URI` to authorized redirect URIs. Requesting
  `gmail.send`/`gmail.readonly` in production requires Google's OAuth
  verification review — start that early, it can take days to weeks.
- **Microsoft**: Register an app in Azure AD / Entra ID, add `Mail.Send` and
  `Mail.Read` delegated permissions, add `MS_REDIRECT_URI` as a redirect URI.

## Running in production

Run these as **separate processes** (separate containers/dynos), not
threads in the API process — this is what makes the system reliable under
load and lets you scale sending independently of API traffic:

```bash
npm run build

node dist/server.js                    # API — handles OAuth callbacks, campaign CRUD, /send trigger
node dist/queue/sendWorker.js          # Sends queued emails, rate-limited
node dist/queue/tokenRefreshWorker.js  # Keeps OAuth tokens fresh proactively
node dist/polling/pollWorker.js        # Detects bounces/replies
```

Scale `sendWorker` horizontally if needed — the per-mailbox rate limiter
uses an atomic DB update (`updateMany` guarded by the cap), so multiple
worker instances racing on the same mailbox still can't exceed its daily cap.

## Known gaps to close before real production traffic

- **CSRF state validation** on the OAuth `state` param (`routes/auth.ts` has
  a `// TODO` — persist `state -> userId` in Redis with a short TTL and
  verify it in the callback).
- **Outlook bounce/reply polling** — `pollWorker.ts` only wires up Gmail;
  the Graph equivalent follows the same pattern (search
  `/me/mailFolders/inbox/messages`, match on `internetMessageId`) and is
  noted inline where to add it.
- **Email verification integration** — `Lead.verifyStatus` exists in the
  schema but nothing populates it yet; wire in NeverBounce/ZeroBounce/similar
  before enqueueing, and only enqueue `verifyStatus: "valid"` leads once
  that's live (`sendQueue.ts` currently also allows `"unknown"`, which you
  should tighten once verification is wired in).
- **User notification on auto-pause/disconnect** — currently just flips a DB
  status; add an email/webhook/in-app alert so the user notices before
  wondering why sends stopped.
- **Multi-step sequences** — schema supports one `Campaign` -> many `Send`;
  extend with a `SequenceStep` model if you want multi-touch drip sequences
  with reply-based branching.
