import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";

const csv = <T extends z.ZodTypeAny>(s: T) =>
  z.string().optional().transform((v) => (v ? v.split(",").filter(Boolean) : [])).pipe(z.array(s));

const Query = z.object({
  domain: csv(z.enum(["WEB_DEV", "DATA", "MARKETING", "DESIGN", "OTHER"])),
  mode: csv(z.enum(["REMOTE", "ONSITE", "HYBRID"])),
  level: csv(z.enum(["FRESHER", "FIRST_SECOND_YEAR"])),
  location: z.string().max(60).optional(),
  minStipend: z.coerce.number().int().min(0).optional(),
  paidOnly: z.enum(["true", "false"]).optional(),
  minWeeks: z.coerce.number().int().min(1).optional(),
  maxWeeks: z.coerce.number().int().max(104).optional(),
  hideRisky: z.enum(["true", "false"]).optional(),        // hides trustScore < 50
  sort: z.enum(["fresh", "trust", "stipend"]).default("fresh"),
  page: z.coerce.number().int().min(1).default(1),
});

export async function GET(req: NextRequest) {
  const parsed = Query.safeParse(Object.fromEntries(req.nextUrl.searchParams));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  const q = parsed.data, pageSize = 20;

  const where: Prisma.InternshipWhereInput = {
    status: "ACTIVE",
    OR: [{ deadline: null }, { deadline: { gte: new Date() } }],
    ...(q.domain.length && { domain: { in: q.domain } }),
    ...(q.mode.length && { workMode: { in: q.mode } }),
    // "fresher / 1st-2nd year" also matches listings open to ANY level
    ...(q.level.length && { level: { in: [...q.level, "ANY"] } }),
    ...(q.location && { location: { contains: q.location, mode: "insensitive" } }),
    ...(q.paidOnly === "true" && { isUnpaid: false, stipendMax: { not: null } }),
    ...(q.minStipend && { stipendMax: { gte: q.minStipend } }),
    ...((q.minWeeks || q.maxWeeks) && { durationWeeks: { gte: q.minWeeks, lte: q.maxWeeks } }),
    ...(q.hideRisky === "true" && { trustScore: { gte: 50 } }),
  };
  const orderBy: Prisma.InternshipOrderByWithRelationInput =
    q.sort === "trust" ? { trustScore: "desc" } : q.sort === "stipend" ? { stipendMax: { sort: "desc", nulls: "last" } } : { lastVerifiedAt: "desc" };

  const [items, total] = await Promise.all([
    prisma.internship.findMany({
      where, orderBy, skip: (q.page - 1) * pageSize, take: pageSize,
      select: { id: true, title: true, company: true, domain: true, workMode: true, location: true, stipendMin: true, stipendMax: true,
        isUnpaid: true, durationWeeks: true, level: true, skills: true, deadline: true, applyUrl: true, lastVerifiedAt: true, trustScore: true, trustFlags: true },
    }),
    prisma.internship.count({ where }),
  ]);
  return NextResponse.json({ items, total, page: q.page, pages: Math.ceil(total / pageSize) },
    { headers: { "Cache-Control": "s-maxage=60, stale-while-revalidate=300" } });
}
