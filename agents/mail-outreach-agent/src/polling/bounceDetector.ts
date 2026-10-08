import { simpleParser } from "mailparser";
import { getGmailClientForMailbox } from "../oauth/google";
import { prisma } from "../lib/prisma";
import { logger } from "../lib/logger";
import { addSuppression } from "../suppression/suppressionList";
import { recordOutcomeAndCheckHealth } from "../queue/rateLimiter";

/**
 * Since sends go through the user's real mailbox (not an ESP with bounce
 * webhooks), bounces show up as delivery-status-notification emails from
 * "mailer-daemon@..." in the mailbox's own inbox. We poll for these,
 * extract which original Message-ID they reference, and match back to a
 * Send row. This is the standard approach for OAuth-mailbox sending.
 */
export async function pollGmailBounces(mailboxId: string): Promise<void> {
  const mailbox = await prisma.mailbox.findUniqueOrThrow({ where: { id: mailboxId } });
  const gmail = await getGmailClientForMailbox(mailboxId);

  const { data } = await gmail.users.messages.list({
    userId: "me",
    q: "from:mailer-daemon OR subject:(Undelivered Mail Returned to Sender OR Delivery Status Notification)",
    maxResults: 25,
  });

  for (const msgRef of data.messages ?? []) {
    const { data: full } = await gmail.users.messages.get({
      userId: "me",
      id: msgRef.id!,
      format: "raw",
    });
    if (!full.raw) continue;

    const raw = Buffer.from(full.raw, "base64").toString("utf8");
    const parsed = await simpleParser(raw);

    // The bounced message's original Message-ID is typically embedded in the
    // DSN body or as an In-Reply-To/References header on the bounce.
    const referenced = parsed.references?.[0] || parsed.inReplyTo;
    const bodyText = parsed.text ?? "";
    const embeddedIdMatch = bodyText.match(/Message-ID:\s*<([^>]+)>/i);
    const originalMessageId = (referenced || embeddedIdMatch?.[1])?.replace(/[<>]/g, "");

    if (!originalMessageId) continue;

    const send = await prisma.send.findFirst({ where: { rfcMessageId: originalMessageId } });
    if (!send || send.status === "BOUNCED_HARD") continue;

    // Heuristic hard vs soft classification from the DSN status code, e.g. "5.1.1".
    const isHard = /\b5\.\d\.\d\b/.test(bodyText);
    const isSoft = /\b4\.\d\.\d\b/.test(bodyText);

    if (isHard) {
      await prisma.send.update({
        where: { id: send.id },
        data: { status: "BOUNCED_HARD", bouncedAt: new Date() },
      });
      const lead = await prisma.lead.findUniqueOrThrow({ where: { id: send.leadId } });
      await addSuppression(lead.userId, lead.email, "hard_bounce");
      await prisma.lead.update({ where: { id: lead.id }, data: { verifyStatus: "invalid" } });
      await recordOutcomeAndCheckHealth(mailbox.id, "bounced_hard");
    } else if (isSoft) {
      await prisma.send.update({
        where: { id: send.id },
        data: { status: "BOUNCED_SOFT", bouncedAt: new Date() },
      });
      await recordOutcomeAndCheckHealth(mailbox.id, "bounced_soft");
    }
  }
}

/** Detects replies to a sent message by checking for new inbox threads
 * referencing our rfcMessageId, so a sequence can be auto-stopped on reply. */
export async function pollGmailReplies(mailboxId: string): Promise<void> {
  const gmail = await getGmailClientForMailbox(mailboxId);

  const pendingSends = await prisma.send.findMany({
    where: { mailboxId, status: "SENT", repliedAt: null },
    take: 100,
  });

  for (const send of pendingSends) {
    if (!send.rfcMessageId) continue;
    const { data } = await gmail.users.messages.list({
      userId: "me",
      q: `in:inbox rfc822msgid:${send.rfcMessageId}`,
    });
    if ((data.messages?.length ?? 0) > 0) {
      await prisma.send.update({
        where: { id: send.id },
        data: { status: "REPLIED", repliedAt: new Date() },
      });
      logger.info({ sendId: send.id }, "Reply detected, sequence should be stopped for this lead");
      // TODO: cancel any not-yet-sent follow-up steps queued for this lead.
    }
  }
}
