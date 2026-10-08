import { Worker, Queue } from "bullmq";
import { redisConnection } from "../lib/redis";
import { prisma } from "../lib/prisma";
import { logger } from "../lib/logger";
import { getGmailClientForMailbox } from "../oauth/google";
import { getGraphAccessTokenForMailbox } from "../oauth/microsoft";

const QUEUE_NAME = "token-refresh-sweep";

export const tokenRefreshQueue = new Queue(QUEUE_NAME, { connection: redisConnection });

// Runs every 15 minutes, refreshing any mailbox whose token expires within
// the next 30 minutes. This keeps the send worker's hot path from ever
// waiting on a token refresh, and surfaces DISCONNECTED mailboxes proactively
// (via the reused refresh logic) rather than only discovering it mid-send.
export async function scheduleTokenRefreshSweep() {
  await tokenRefreshQueue.add(
    "sweep",
    {},
    { repeat: { every: 15 * 60 * 1000 }, jobId: "recurring-sweep" }
  );
}

export const tokenRefreshWorker = new Worker(
  QUEUE_NAME,
  async () => {
    const soon = new Date(Date.now() + 30 * 60 * 1000);
    const mailboxes = await prisma.mailbox.findMany({
      where: { status: { in: ["ACTIVE", "WARMING_UP"] }, tokenExpiresAt: { lt: soon } },
    });

    for (const mailbox of mailboxes) {
      try {
        if (mailbox.provider === "GOOGLE") {
          await getGmailClientForMailbox(mailbox.id); // triggers refresh + persist internally
        } else {
          await getGraphAccessTokenForMailbox(mailbox.id);
        }
        logger.info({ mailboxId: mailbox.id }, "Proactively refreshed token");
      } catch (err) {
        logger.warn({ err, mailboxId: mailbox.id }, "Proactive refresh failed, mailbox may need reauth");
      }
    }
  },
  { connection: redisConnection }
);

logger.info("Token refresh worker started");
