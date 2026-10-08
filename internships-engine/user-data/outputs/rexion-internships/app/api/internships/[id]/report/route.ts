import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createHash } from "crypto";
import { prisma } from "@/lib/db";

const Body = z.object({
  reason: z.enum(["FAKE_COMPANY", "ASKS_FOR_MONEY", "NO_LONGER_OPEN", "WRONG_DETAILS", "SPAM", "OTHER"]),
  note: z.string().max(500).optional(),
});
const AUTO_REVIEW_AT = 3;   // distinct reporters before a listing is pulled from search

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const body = Body.safeParse(await req.json().catch(() => null));
  if (!body.success) return NextResponse.json({ error: "Invalid report" }, { status: 400 });

  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const reporterHash = createHash("sha256").update(ip + (req.headers.get("user-agent") ?? "") + process.env.REPORT_SALT).digest("hex");

  // Cap spam: max 10 reports per reporter per day, across all listings
  const today = await prisma.report.count({ where: { reporterHash, createdAt: { gte: new Date(Date.now() - 864e5) } } });
  if (today >= 10) return NextResponse.json({ error: "Daily report limit reached" }, { status: 429 });

  const listing = await prisma.internship.findUnique({ where: { id: params.id }, select: { id: true } });
  if (!listing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  try {
    await prisma.report.create({ data: { internshipId: params.id, reporterHash, ...body.data } });
  } catch (e: any) {
    if (e.code === "P2002") return NextResponse.json({ ok: true, duplicate: true });  // already reported
    throw e;
  }
  const count = await prisma.report.count({ where: { internshipId: params.id } });
  // "Asks for money" is the strongest scam signal, so it lowers the threshold
  const severe = body.data.reason === "ASKS_FOR_MONEY" || body.data.reason === "FAKE_COMPANY";
  if (count >= AUTO_REVIEW_AT || (severe && count >= 2))
    await prisma.internship.update({ where: { id: params.id }, data: { status: "UNDER_REVIEW" } });
  return NextResponse.json({ ok: true });
}
