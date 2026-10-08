// Call this from your scraper for each scraped listing. Upserts by sourceUrl so re-scrapes don't duplicate.
import { prisma } from "./db";
import { detectDomain, detectLevel, detectWorkMode, parseDurationWeeks, parseStipend } from "./normalize";
import { extractSkills } from "./skills";
import { domainMedianStipend, checkLink } from "./verify";
import { scoreListing } from "./trust";

export type Scraped = {
  source: string; sourceUrl: string; applyUrl: string; title: string; company: string;
  description: string; location?: string; stipendText?: string; durationText?: string;
  companyWebsite?: string; contactEmail?: string; deadline?: Date;
};

export async function ingest(s: Scraped) {
  const blob = `${s.title} ${s.description} ${s.location ?? ""}`;
  const stipend = parseStipend(s.stipendText ?? s.description);
  const domain = detectDomain(s.title, s.description);
  const link = await checkLink(s.applyUrl);
  if (link === "closed") return null;                            // never store dead listings
  const now = new Date();
  const verifiedAt = link === "live" ? now : new Date(0);
  const { score, flags } = scoreListing({
    ...s, stipendMax: stipend.max, isUnpaid: stipend.isUnpaid,
    domainMedianStipend: await domainMedianStipend(domain), openReports: 0,
    hoursSinceVerified: link === "live" ? 0 : 999,
  });
  const data = {
    ...s, domain, workMode: detectWorkMode(blob), level: detectLevel(blob),
    stipendMin: stipend.min, stipendMax: stipend.max, isUnpaid: stipend.isUnpaid,
    durationWeeks: parseDurationWeeks(s.durationText ?? s.description), skills: extractSkills(blob),
    scrapedAt: now, lastVerifiedAt: verifiedAt, trustScore: score, trustFlags: flags as any,
    stipendText: undefined, durationText: undefined,
  };
  delete (data as any).stipendText; delete (data as any).durationText;
  return prisma.internship.upsert({ where: { sourceUrl: s.sourceUrl }, create: data, update: { ...data, status: undefined } });
}
