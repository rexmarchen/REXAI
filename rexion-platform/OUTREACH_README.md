# RexionAI Outreach Feature Setup Guide

This guide details the steps to set up, configure, and run the Outreach module in the RexionAI platform.

## 🛠️ Step 1: Install Dependencies
Prisma and BullMQ packages must be installed in the `rexion-platform` directory.
If not already installed, run:
```bash
npm install prisma@5.18.0 @prisma/client@5.18.0 bullmq ioredis nodemailer --legacy-peer-deps --package-lock=false
```

---

## 🗄️ Step 2: Configure Environment Variables
Ensure the following variables are defined in your local `.env` file (never hardcode these keys in code or client components):

```env
# Database Connections (MongoDB is utilized via Prisma)
MONGODB_URI=mongodb+srv://anshuar9065_db_user:Anshu_90-@cluster0.ytzioe4.mongodb.net/rexion?appName=Cluster0
DATABASE_URL=mongodb+srv://anshuar9065_db_user:Anshu_90-@cluster0.ytzioe4.mongodb.net/rexion?appName=Cluster0

# Redis connection for BullMQ
REDIS_URL=redis://localhost:6379

# External APIs
APOLLO_API_KEY=yS27VqGUh9G_cB212Hl96A
ANTHROPIC_API_KEY=your_anthropic_claude_api_key
RESEND_API_KEY=your_resend_api_key

# Public App Url for tracking opens/unsubscribes
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

---

## 🔄 Step 3: Database Client Generation
MongoDB schemas do not require SQL migrations. Deploy the schema indexes and generate the client directly by running:
```bash
npx prisma db push
npx prisma generate
```

---

## 🏃 Step 4: Run the Throttled Queue Worker
BullMQ enqueues outreach messages with a built-in throttle constraint (1 send every 4 seconds to maintain domain reputation). 
The worker process must run as a separate background process. Start it using:
```bash
npm run worker
# or directly:
npx tsx worker/email-worker.ts
```

---

## 🔔 Step 5: Configure Resend Webhook for Bounces & Spam
To register bounces and complaints automatically:
1. Go to your **Resend Dashboard** -> **Webhooks** section.
2. Register a new webhook pointing to your public domain:
   `https://<your-domain>/api/outreach/webhook/resend`
3. Select the following event triggers:
   - `email.bounced`
   - `email.complained`
4. When triggered, the system automatically adds the address to `SuppressionEntry` and flags the delivery record as `bounced`.

---

## ✉️ Step 6: Custom SMTP Setup (CAN-SPAM Compliance)
In accordance with user preferences, candidates can send emails through their own mail accounts. 
On the **Send Confirmation** screen of the Outreach portal:
- Candidates can input their custom **SMTP credentials** (SMTP Host, Port, Username, Password, and From Email) or input their own **Resend API Key**.
- A valid **Physical Mailing Address** must be provided to fulfill CAN-SPAM requirements (which is appended to the email footer along with an opt-out unsubscribe link).
