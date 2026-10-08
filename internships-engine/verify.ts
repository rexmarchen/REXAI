// Honest "verified" signal: lastVerifiedAt only moves when the apply link is actually live.
import { prisma } from "./db";
import { scoreListing } from "./trust";

const CLOSED = /(no longer (accepting|available)|applications? (are )?closed|position (has been )?filled|expired|page not found)/i;

export async function checkLink(url: string): Promise<"live" | "closed" | "unreachable"> {
  try {
    const res = await fetch(url, { redirect: "follow", signal: AbortSignal.timeout(8000), headers: { "User-Agent": "RexionVerifier/1.0" } });
    if (res.status === 404 || res.status === 410) return "closed";
    if (!res.ok) return "unreachable";
    const html = (await res.text()).slice(0, 60_000);
    return CLOSED.test(html) ? "closed" : "live";
  } catch { return "unreachable"; }
}

export async function domainMedianStipend(domain: string): Promise<number | null> {
  const rows = await prisma.internship.findMany({
    where: { domain: domain as any, status: "ACTIVE", stipendMax: { not: null } },
    select: { stipendMax: true }, take: 500,
  });
  const v = rows.map((r) => r.stipendMax!).sort((a, b) => a - b);
  return v.length >= 10 ? v[Math.floor(v.length / 2)] : null;
}

// Re-verify the stalest listings first. Run from a cron every 2-3 hours.
export async function verifyBatch(limit = 100) {
  const stale = await prisma.internship.findMany({
    where: { status: { in: ["ACTIVE", "UNDER_REVIEW"] } },
    orderBy: { lastVerifiedAt: "asc" }, take: limit,
    include: { reports: { select: { id: true } } },
  });
  let live = 0, closed = 0;
  for (const l of stale) {
    const result = await checkLink(l.applyUrl);
    const expired = l.deadline && l.deadline < new Date();
    if (result === "closed" || expired) {
      await prisma.internship.update({ where: { id: l.id }, data: { status: "EXPIRED" } });
      closed++; continue;
    }
    const now = new Date();
    const verifiedAt = result === "live" ? now : l.lastVerifiedAt;     // unreachable != verified
    const { score, flags } = scoreListing({
      ...l, hoursSinceVerified: (now.getTime() - verifiedAt.getTime()) / 36e5,
      domainMedianStipend: await domainMedianStipend(l.domain), openReports: l.reports.length,
    });
    await prisma.internship.update({ where: { id: l.id }, data: { lastVerifiedAt: verifiedAt, trustScore: score, trustFlags: flags as any } });
    if (result === "live") live++;
  }
  return { checked: stale.length, live, closed };
}
