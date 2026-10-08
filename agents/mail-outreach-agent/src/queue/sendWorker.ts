import { Worker, UnrecoverableError } from "bullmq";
import { randomUUID } from "node:crypto";
import { redisConnection } from "../lib/redis";
import { prisma } from "../lib/prisma";
import { logger } from "../lib/logger";
import { isSuppressed } from "../suppression/suppressionList";
import { tryConsumeSendSlot, nextSendDelayMs, recordOutcomeAndCheckHealth } from "./rateLimiter";
import { sendViaGmail } from "../mail/gmailSender";
import { sendViaOutlook } from "../mail/outlookSender";
import { renderCampaignContent } from "../mail/templateEngine";
import { env } from "../config/env";
import type { SendJobData } from "./sendQueue";

/**
 * Classifies an error from a provider API into retry vs permanent-fail.
 * Getting this wrong in either direction is what makes an outreach agent
 * unreliable: retrying a permanent failure wastes the mailbox's daily cap
 * forever; permanently failing a transient error drops a send that would
 * have succeeded on attempt 2.
 */
function classifyError(err: any): "retryable" | "permanent" {
  const status = err?.response?.status ?? err?.status;
  if (status === 429) return "retryable"; // rate limited by provider
  if (status >= 500) return "retryable"; // provider-side outage
  if (status === 401 || status === 403) return "permanent"; // bad/revoked auth — retrying won't help
  if (status === 400) return "permanent"; // malformed request, e.g. bad address
  return "retryable"; // unknown/network errors default to retryable
}

export const sendWorker = new Worker<SendJobData>(
  "mail-send",
  async (job) => {
    const send = await prisma.send.findUniqueOrThrow({
      where: { id: job.data.sendId },
      include: { lead: true, campaign: true, mailbox: true },
    });

    // Terminal states mean a previous attempt already resolved this job —
    // BullMQ shouldn't normally redeliver a completed job, but this guard
    // makes the worker idempotent even if it does (e.g. a stalled-job requeue).
    if (["SENT", "DELIVERED", "CANCELED", "BOUNCED_HARD"].includes(send.status)) {
      logger.warn({ sendId: send.id, status: send.status }, "Skipping already-resolved send");
      return;
    }

    if (await isSuppressed(send.campaign.userId, send.lead.email)) {
      await prisma.send.update({ where: { id: send.id }, data: { status: "CANCELED" } });
      return;
    }

    const gotSlot = await tryConsumeSendSlot(send.mailboxId);
    if (!gotSlot) {
      // No slots left today (or mailbox paused/disconnected) — reschedule
      // for tomorrow rather than burning a retry attempt on a non-error.
      throw new UnrecoverableError("NO_SLOT"); // caught below to reschedule cleanly
    }

    const messageId = `${randomUUID()}@outreach-agent.local`;
    const unsubscribeUrl = `${env.APP_BASE_URL}/u/${send.id}`;

    const { subject, bodyHtml, warnings } = renderCampaignContent(
      send.campaign.subject,
      send.campaign.bodyHtml,
      {
        first_name: send.lead.firstName,
        last_name: send.lead.lastName,
        full_name: [send.lead.firstName, send.lead.lastName].filter(Boolean).join(" ") || null,
        company: send.lead.company,
        current_title: send.lead.title,
      }
    );

    if (warnings.unknownTags.length > 0) {
      const errorMsg = `Unknown merge tags in campaign: ${warnings.unknownTags.join(", ")}`;
      logger.error({ sendId: send.id, unknownTags: warnings.unknownTags }, errorMsg);
      await prisma.send.update({
        where: { id: send.id },
        data: {
          status: "FAILED",
          lastError: errorMsg,
        },
      });
      return;
    }

    const emailPayload = {
      fromEmail: send.mailbox.email,
      toEmail: send.lead.email,
      toName: [send.lead.firstName, send.lead.lastName].filter(Boolean).join(" ") || undefined,
      subject,
      htmlBody: bodyHtml,
      messageId,
      unsubscribeUrl,
    };

    try {
      const result =
        send.mailbox.provider === "GOOGLE"
          ? await sendViaGmail(send.mailboxId, emailPayload)
          : await sendViaOutlook(send.mailboxId, emailPayload);

      await prisma.send.update({
        where: { id: send.id },
        data: {
          status: "SENT",
          sentAt: new Date(),
          attempts: { increment: 1 },
          providerMessageId: result.providerMessageId || null,
          rfcMessageId: result.rfcMessageId,
        },
      });
      await recordOutcomeAndCheckHealth(send.mailboxId, "sent");
    } catch (err: any) {
      const classification = classifyError(err);
      logger.error({ err: err?.message, sendId: send.id, classification }, "Send attempt failed");

      await prisma.send.update({
        where: { id: send.id },
        data: { attempts: { increment: 1 }, lastError: String(err?.message ?? err).slice(0, 500) },
      });

      if (classification === "permanent") {
        await prisma.send.update({ where: { id: send.id }, data: { status: "FAILED" } });
        if (err?.response?.status === 401 || err?.response?.status === 403) {
          await prisma.mailbox.update({
            where: { id: send.mailboxId },
            data: { status: "DISCONNECTED" },
          });
        }
        // Do not throw — throwing would trigger a BullMQ retry, which we
        // explicitly don't want for a permanent failure.
        return;
      }

      throw err; // retryable — let BullMQ's backoff handle re-attempting
    }
  },
  {
    connection: redisConnection,
    concurrency: 5, // parallel jobs across all mailboxes; per-mailbox pacing is enforced separately
    limiter: { max: 1, duration: 1000 }, // hard global ceiling: never more than 1 attempt/sec across the whole worker
  }
);

sendWorker.on("failed", async (job, err) => {
  if (err instanceof UnrecoverableError && err.message === "NO_SLOT" && job) {
    // Re-add for a later attempt tomorrow instead of exhausting retry attempts today.
    await job.queue.add(job.name, job.data, { delay: 6 * 3600 * 1000 });
    return;
  }
  logger.error({ err, jobId: job?.id }, "Send job failed permanently after all retries");
});

// Add jitter between individual sends via a rate limiter is a queue-level
// concern (per-mailbox), not global — see docs/DELIVERABILITY.md for how to
// wire nextSendDelayMs() into a per-mailbox flow/queue if you need stricter
// per-mailbox pacing than the global limiter above provides.
void nextSendDelayMs;

logger.info("Send worker started");
