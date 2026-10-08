import { Worker, Queue } from "bullmq";
import { redisConnection } from "../lib/redis";
import { prisma } from "../lib/prisma";
import { logger } from "../lib/logger";
import { pollGmailBounces, pollGmailReplies } from "./bounceDetector";

const QUEUE_NAME = "mailbox-poll-sweep";

export const pollQueue = new Queue(QUEUE_NAME, { connection: redisConnection });

export async function schedulePollSweep() {
  await pollQueue.add(
    "sweep",
    {},
    { repeat: { every: 5 * 60 * 1000 }, jobId: "recurring-poll-sweep" } // every 5 min
  );
}

export const pollWorker = new Worker(
  QUEUE_NAME,
  async () => {
    const mailboxes = await prisma.mailbox.findMany({
      where: { status: { in: ["ACTIVE", "WARMING_UP"] }, provider: "GOOGLE" },
    });

    for (const mailbox of mailboxes) {
      try {
        await pollGmailBounces(mailbox.id);
        await pollGmailReplies(mailbox.id);
      } catch (err) {
        logger.error({ err, mailboxId: mailbox.id }, "Poll sweep failed for mailbox");
      }
    }

    // NOTE: Outlook/Graph bounce+reply polling follows the same pattern —
    // list messages in the inbox via /me/mailFolders/inbox/messages with a
    // $search or $filter for mailer-daemon/DSN senders, and match
    // internetMessageId back to Send.rfcMessageId. Implement
    // pollOutlookBounces/pollOutlookReplies in bounceDetector.ts analogously
    // if you enable Microsoft mailboxes.
  },
  { connection: redisConnection }
);

logger.info("Poll worker started");
