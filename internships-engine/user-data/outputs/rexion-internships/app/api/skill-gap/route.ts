import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { ROLES } from "@/lib/roles";
import { canonicalSkill } from "@/lib/skills";

const Body = z.object({ role: z.string(), skills: z.array(z.string().max(40)).max(40) });
const MIN_SAMPLE = 15;     // refuse to "analyse" from too little data
const CORE = 0.25;         // skill is "core" if >=25% of listings ask for it

export async function POST(req: Request) {
  const body = Body.safeParse(await req.json().catch(() => null));
  if (!body.success || !ROLES[body.data.role]) return NextResponse.json({ error: "Invalid role or skills" }, { status: 400 });
  const role = ROLES[body.data.role];
  const mine = new Set(body.data.skills.map(canonicalSkill).filter(Boolean) as string[]);

  const kw = role.titleKeywords ?? [];
  const listings = await prisma.internship.findMany({
    where: { status: "ACTIVE", domain: role.domain, ...(kw.length && { OR: kw.map((k) => ({ title: { contains: k, mode: "insensitive" as const } })) }) },
    select: { skills: true }, take: 1000, orderBy: { lastVerifiedAt: "desc" },
  });
  if (listings.length < MIN_SAMPLE)
    return NextResponse.json({ role: role.name, sampleSize: listings.length, insufficientData: true });

  const freq = new Map<string, number>();
  for (const l of listings) for (const s of new Set(l.skills)) freq.set(s, (freq.get(s) ?? 0) + 1);
  const demand = [...freq.entries()].map(([skill, n]) => ({ skill, demand: n / listings.length })).sort((a, b) => b.demand - a.demand);

  const top = demand.slice(0, 12);                                   // the skills that matter most
  const total = top.reduce((s, d) => s + d.demand, 0);
  const have = top.filter((d) => mine.has(d.skill));
  const readiness = Math.round((have.reduce((s, d) => s + d.demand, 0) / total) * 100);

  const missing = demand.filter((d) => d.demand >= 0.1 && !mine.has(d.skill));
  const resources = await prisma.skillResource.findMany({ where: { skill: { in: missing.map((m) => m.skill) } } });

  // Listings the student could already apply to: they cover most of the posting's skills
  const reachable = listings.filter((l) => l.skills.length && l.skills.filter((s) => mine.has(s)).length / l.skills.length >= 0.6).length;

  return NextResponse.json({
    role: role.name, sampleSize: listings.length, readiness, reachableListings: reachable,
    matched: have.map((d) => ({ skill: d.skill, demand: Math.round(d.demand * 100) })),
    gaps: missing.slice(0, 8).map((m) => ({
      skill: m.skill, demand: Math.round(m.demand * 100), priority: m.demand >= CORE ? "core" : "bonus",
      resources: resources.filter((r) => r.skill === m.skill).map(({ title, url, free }) => ({ title, url, free })),
    })),
    extra: [...mine].filter((s) => !freq.has(s)),        // skills the student has that this role rarely asks for
  });
}
