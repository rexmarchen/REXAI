import express from "express";
import { env } from "./config/env";
import { logger } from "./lib/logger";
import { authRouter } from "./routes/auth";
import { mailboxesRouter } from "./routes/mailboxes";
import { campaignsRouter } from "./routes/campaigns";
import { leadsRouter } from "./routes/leads";
import { unsubscribeRouter } from "./routes/unsubscribe";

const app = express();
app.use(express.json());

// --- Placeholder auth middleware ---
// Replace with your real session/JWT auth. Every route handler in this
// project reads req.userId, so this must run before them in production.
app.use((req, _res, next) => {
  req.userId = (req.headers["x-user-id"] as string) || "demo-user";
  next();
});

app.use(authRouter);
app.use(mailboxesRouter);
app.use(campaignsRouter);
app.use(leadsRouter);
app.use(unsubscribeRouter); // unauthenticated by design, see routes/unsubscribe.ts

app.get("/health", (_req, res) => res.json({ ok: true }));

app.listen(env.PORT, () => {
  logger.info(`API server listening on :${env.PORT}`);
});

/**
 * This process only serves HTTP. Run the following as SEPARATE processes
 * (separate containers/dynos in production) so a slow API request never
 * blocks mail sending, and so each can be scaled independently:
 *   npm run worker:send
 *   npm run worker:token-refresh
 *   npm run worker:polling
 * See README.md for the full production deployment layout.
 */
