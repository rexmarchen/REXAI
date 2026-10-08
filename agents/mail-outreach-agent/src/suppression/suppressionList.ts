import { prisma } from "../lib/prisma";

/**
 * Must be called immediately before every send, not just at enqueue time —
 * a lead can unsubscribe or bounce in the window between queueing and the
 * worker actually picking the job up.
 */
export async function isSuppressed(userId: string, email: string): Promise<boolean> {
  const domain = email.split("@")[1];
  const hit = await prisma.suppression.findFirst({
    where: {
      userId,
      OR: [{ value: email.toLowerCase() }, { value: `@${domain?.toLowerCase()}` }],
    },
    select: { id: true },
  });
  return hit !== null;
}

export async function addSuppression(
  userId: string,
  value: string,
  reason: "unsubscribed" | "hard_bounce" | "complaint" | "manual"
): Promise<void> {
  await prisma.suppression.upsert({
    where: { userId_value: { userId, value: value.toLowerCase() } },
    create: { userId, value: value.toLowerCase(), reason },
    update: { reason },
  });
}
