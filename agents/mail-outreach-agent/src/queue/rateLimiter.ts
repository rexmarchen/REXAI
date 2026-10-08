import { prisma } from "../lib/prisma";
import { env } from "../config/env";
import type { Mailbox } from "@prisma/client";

/**
 * Computes the daily cap for a mailbox based on how long it's been warming
 * up. Linear ramp from DEFAULT_DAILY_CAP_NEW_MAILBOX to
 * DEFAULT_DAILY_CAP_WARMED_MAILBOX over WARMUP_RAMP_DAYS. A mailbox with an
 * explicit dailyCap override (set by the user/admin) always wins.
 */
export function computeDailyCap(mailbox: Mailbox): number {
  if (mailbox.status !== "WARMING_UP") return mailbox.dailyCap;

  const daysConnected = Math.floor(
    (Date.now() - mailbox.connectedAt.getTime()) / (24 * 3600 * 1000)
  );
  const ramp = Math.min(daysConnected / env.WARMUP_RAMP_DAYS, 1);
  const cap = Math.round(
    env.DEFAULT_DAILY_CAP_NEW_MAILBOX +
      ramp * (env.DEFAULT_DAILY_CAP_WARMED_MAILBOX - env.DEFAULT_DAILY_CAP_NEW_MAILBOX)
  );
  return Math.min(cap, mailbox.dailyCap || env.DEFAULT_DAILY_CAP_WARMED_MAILBOX);
}

/**
 * Resets sentToday if the mailbox's local "day" has rolled over, and
 * returns whether this mailbox may send one more email right now. Uses a
 * DB-level conditional update as a lightweight lock so two worker processes
 * racing on the same mailbox can't both pass the check for the last slot.
 */
export async function tryConsumeSendSlot(mailboxId: string): Promise<boolean> {
  const mailbox = await prisma.mailbox.findUniqueOrThrow({ where: { id: mailboxId } });

  const hoursSinceReset = (Date.now() - mailbox.sentTodayResetAt.getTime()) / 3_600_000;
  if (hoursSinceReset >= 24) {
    await prisma.mailbox.update({
      where: { id: mailboxId },
      data: { sentToday: 0, sentTodayResetAt: new Date() },
    });
    mailbox.sentToday = 0;
  }

  if (mailbox.status === "PAUSED" || mailbox.status === "DISCONNECTED") return false;

  const cap = computeDailyCap(mailbox);
  if (mailbox.sentToday >= cap) return false;

  // Atomic increment guarded by the cap, so concurrent workers can't both
  // squeeze through on the boundary (e.g. sentToday === cap - 1 for both).
  const result = await prisma.mailbox.updateMany({
    where: { id: mailboxId, sentToday: { lt: cap } },
    data: { sentToday: { increment: 1 } },
  });

  return result.count === 1;
}

/** Random delay between MIN_SEND_INTERVAL_MS and MAX. Sending at a
 * perfectly even cadence is itself a bot signal — jitter mimics a human
 * clicking send between other tasks. */
export function nextSendDelayMs(): number {
  const { MIN_SEND_INTERVAL_MS, MAX_SEND_JITTER_MS } = env;
  return MIN_SEND_INTERVAL_MS + Math.floor(Math.random() * MAX_SEND_JITTER_MS);
}

/**
 * Called after every completed send attempt to update mailbox health and
 * auto-pause it if bounce/complaint rates cross the configured threshold.
 * This is the guardrail that protects long-term domain reputation.
 */
export async function recordOutcomeAndCheckHealth(
  mailboxId: string,
  outcome: "sent" | "bounced_hard" | "bounced_soft" | "complained"
): Promise<void> {
  const data: Record<string, unknown> = {};
  if (outcome === "sent") data.sentTotal = { increment: 1 };
  if (outcome === "bounced_hard") data.bounceCount = { increment: 1 };
  if (outcome === "complained") data.complaintCount = { increment: 1 };

  const mailbox = await prisma.mailbox.update({ where: { id: mailboxId }, data });

  if (mailbox.sentTotal < 20) return; // too few sends for the rate to be meaningful

  const bounceRate = mailbox.bounceCount / mailbox.sentTotal;
  const complaintRate = mailbox.complaintCount / mailbox.sentTotal;

  if (
    bounceRate > env.BOUNCE_RATE_PAUSE_THRESHOLD ||
    complaintRate > env.COMPLAINT_RATE_PAUSE_THRESHOLD
  ) {
    await prisma.mailbox.update({ where: { id: mailboxId }, data: { status: "PAUSED" } });
    // TODO: notify the user (email/webhook/in-app) that their mailbox was
    // auto-paused and why — silent pausing just looks like a broken feature.
  }
}
