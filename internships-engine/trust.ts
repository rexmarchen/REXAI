// Rule-based trust scoring. Every flag is explainable to the student, nothing is a black box.
export type Flag = { code: string; severity: "high" | "medium" | "low"; message: string };
const FREE_MAIL = /@(gmail|yahoo|outlook|hotmail|rediffmail|proton)\./i;
const MONEY_ASK = /(registration|security|training|joining|kit|refundable|processing)\s*(fee|fees|deposit|charge|amount)|pay\s+(rs|inr|₹)|₹\s?\d+\s*(to|for)\s*(join|register|apply)/i;
const OFF_PLATFORM = /(whatsapp|telegram)\s*(only|us|me|to apply)|apply\s*(on|via|through)\s*(whatsapp|telegram)/i;
const URGENCY = /(limited seats|hurry|last (few )?seats|guaranteed (job|placement))/i;

export type TrustInput = {
  title: string; description: string; company: string; applyUrl: string;
  companyWebsite?: string | null; contactEmail?: string | null;
  stipendMax?: number | null; isUnpaid: boolean;
  domainMedianStipend?: number | null;   // computed from DB per domain
  openReports: number; hoursSinceVerified: number;
};

export function scoreListing(i: TrustInput): { score: number; flags: Flag[] } {
  const flags: Flag[] = [];
  let score = 70;
  const text = `${i.title} ${i.description}`;
  const add = (f: Flag, delta: number) => { flags.push(f); score += delta; };

  if (MONEY_ASK.test(text)) add({ code: "ASKS_MONEY", severity: "high", message: "Asks you to pay a fee. Real internships never charge." }, -45);
  if (OFF_PLATFORM.test(text)) add({ code: "OFF_PLATFORM", severity: "high", message: "Pushes you to apply on WhatsApp or Telegram only." }, -30);
  if (URGENCY.test(text)) add({ code: "PRESSURE", severity: "medium", message: "Uses pressure language like 'limited seats' or 'guaranteed job'." }, -15);
  if (i.contactEmail && FREE_MAIL.test(i.contactEmail)) add({ code: "FREE_EMAIL", severity: "medium", message: "Contact uses a free email (Gmail/Yahoo), not a company domain." }, -12);

  try {
    const applyHost = new URL(i.applyUrl).hostname.replace(/^www\./, "");
    const siteHost = i.companyWebsite ? new URL(i.companyWebsite).hostname.replace(/^www\./, "") : null;
    if (!siteHost) add({ code: "NO_WEBSITE", severity: "medium", message: "No company website found." }, -10);
    else if (siteHost === applyHost || applyHost.endsWith("." + siteHost)) score += 8; // apply link on company's own domain
  } catch { add({ code: "BAD_LINK", severity: "high", message: "Apply link is malformed." }, -30); }

  if (i.isUnpaid) add({ code: "UNPAID", severity: "low", message: "Unpaid internship." }, -5);
  if (i.stipendMax && i.domainMedianStipend && i.stipendMax > i.domainMedianStipend * 4)
    add({ code: "STIPEND_OUTLIER", severity: "medium", message: "Stipend is far above what similar internships pay." }, -15);

  if (i.openReports >= 1) add({ code: "REPORTED", severity: i.openReports >= 3 ? "high" : "medium", message: `${i.openReports} student report(s) under review.` }, -10 * Math.min(i.openReports, 4));
  if (i.hoursSinceVerified > 72) add({ code: "STALE", severity: "low", message: "Not re-checked in over 3 days." }, -8);

  return { score: Math.max(0, Math.min(100, score)), flags };
}

export const trustLabel = (s: number) => (s >= 75 ? "Verified" : s >= 50 ? "Check carefully" : "High risk");
