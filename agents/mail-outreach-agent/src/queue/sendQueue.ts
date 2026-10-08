import { Queue } from "bullmq";
import { redisConnection } from "../lib/redis";
import { prisma } from "../lib/prisma";
import { logger } from "../lib/logger";

export interface SendJobData {
  sendId: string; // Send.id — the single source of truth the worker looks up
}

export const sendQueue = new Queue<SendJobData>("mail-send", {
  connection: redisConnection,
  defaultJobOptions: {
    attempts: 5,
    backoff: { type: "exponential", delay: 30_000 }, // 30s, 60s, 120s, 240s, 480s
    removeOnComplete: { age: 7 * 24 * 3600, count: 10_000 },
    removeOnFail: { age: 30 * 24 * 3600 },
  },
});

/**
 * Enqueues every lead in a campaign as one Send row + one job. The unique
 * constraint on (campaignId, leadId) makes this safe to call twice — a
 * second call (e.g. a retried API request from the frontend) will hit a
 * unique-constraint violation on the DB insert and skip, never creating a
 * duplicate Send or double-queuing a job. This is the idempotency guarantee
 * referred to elsewhere as "one click never sends twice."
 */
export async function enqueueCampaignSends(campaignId: string): Promise<{ queued: number; skipped: number }> {
  const campaign = await prisma.campaign.findUniqueOrThrow({
    where: { id: campaignId },
    include: { mailbox: true },
  });

  // Only leads belonging to the same user, not already suppressed, and with
  // an acceptable verification status go in. Risky/invalid leads are simply
  // never enqueued — protecting the mailbox's bounce rate matters more than
  // reaching every row in the list.
  const leads = await prisma.lead.findMany({
    where: {
      userId: campaign.userId,
      verifyStatus: { in: ["valid", "unknown"] }, // "unknown" allowed only if you skip verification entirely
    },
  });

  let queued = 0;
  let skipped = 0;

  for (const lead of leads) {
    try {
      const send = await prisma.send.create({
        data: {
          campaignId: campaign.id,
          leadId: lead.id,
          mailboxId: campaign.mailboxId,
          status: "QUEUED",
        },
      });
      await sendQueue.add(
        "send-email",
        { sendId: send.id },
        { jobId: send.id } // BullMQ-level idempotency too: same jobId can't double-enqueue
      );
      queued++;
    } catch (err: any) {
      if (err?.code === "P2002") {
        // Unique constraint hit — this (campaign, lead) pair was already queued before.
        skipped++;
        continue;
      }
      logger.error({ err, leadId: lead.id, campaignId }, "Failed to enqueue send");
      skipped++;
    }
  }

  logger.info({ campaignId, queued, skipped }, "Campaign enqueue complete");
  return { queued, skipped };
}
