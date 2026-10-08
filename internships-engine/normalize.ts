// Turns messy scraped text into structured, filterable fields.
import { Domain, Level, WorkMode } from "@prisma/client";

export function parseStipend(text: string): { min: number | null; max: number | null; isUnpaid: boolean } {
  const t = text.toLowerCase().replace(/,/g, "");
  if (/\b(unpaid|no stipend|volunteer)\b/.test(t)) return { min: null, max: null, isUnpaid: true };
  const nums = [...t.matchAll(/(\d+(?:\.\d+)?)\s*(k|lakh|lpa)?/g)]
    .map(([, n, u]) => {
      let v = parseFloat(n);
      if (u === "k") v *= 1000;
      if (u === "lakh" || u === "lpa") v *= 100000;
      return v;
    })
    .filter((v) => v >= 500); // ignore stray small numbers like "2 months"
  if (!nums.length) return { min: null, max: null, isUnpaid: false };
  let [min, max] = [Math.min(...nums), Math.max(...nums)];
  if (/\b(week|weekly)\b/.test(t)) { min *= 4; max *= 4; }       // normalise to per month
  if (/\b(year|annum|lpa)\b/.test(t)) { min /= 12; max /= 12; }
  return { min: Math.round(min), max: Math.round(max), isUnpaid: false };
}

export function parseDurationWeeks(text: string): number | null {
  const m = text.toLowerCase().match(/(\d+)\s*(month|months|week|weeks)/);
  if (!m) return null;
  return m[2].startsWith("month") ? +m[1] * 4 : +m[1];
}

export function detectWorkMode(text: string): WorkMode {
  const t = text.toLowerCase();
  if (/\bhybrid\b/.test(t)) return "HYBRID";
  if (/\b(remote|work from home|wfh)\b/.test(t)) return "REMOTE";
  return "ONSITE";
}

export function detectLevel(text: string): Level {
  const t = text.toLowerCase();
  if (/\b(fresher|freshers|no experience|entry[- ]level)\b/.test(t)) return "FRESHER";
  if (/\b(1st|2nd|first|second)[- ]year\b|\bpre[- ]final\b/.test(t)) return "FIRST_SECOND_YEAR";
  return "ANY";
}

const DOMAIN_RULES: [Domain, RegExp][] = [
  ["WEB_DEV", /\b(web|frontend|front-end|backend|full ?stack|react|node|django|flask|software|app developer)\b/i],
  ["DATA", /\b(data|analyst|analytics|machine learning|ml|ai|power bi|tableau)\b/i],
  ["MARKETING", /\b(marketing|seo|social media|content|growth|brand|sales)\b/i],
  ["DESIGN", /\b(design|ui\/?ux|figma|graphic|video edit|motion)\b/i],
];
export function detectDomain(title: string, description = ""): Domain {
  for (const [d, re] of DOMAIN_RULES) if (re.test(title)) return d;          // title wins
  for (const [d, re] of DOMAIN_RULES) if (re.test(description.slice(0, 600))) return d;
  return "OTHER";
}
