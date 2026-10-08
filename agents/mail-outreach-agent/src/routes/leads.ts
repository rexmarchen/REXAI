import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";

export const leadsRouter = Router();

const LeadInput = z.object({
  email: z.string().email(),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  company: z.string().optional(),
  title: z.string().optional(),
  source: z.string().optional(),
});

// Bulk import — used for both "paste/upload a CSV" and "pull from a data
// provider API" flows; both ultimately post an array of lead objects here.
leadsRouter.post("/leads/import", async (req, res) => {
  const parsed = z.array(LeadInput).safeParse(req.body.leads);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const results = await Promise.allSettled(
    parsed.data.map((lead) =>
      prisma.lead.upsert({
        where: { userId_email: { userId: req.userId!, email: lead.email.toLowerCase() } },
        create: { ...lead, email: lead.email.toLowerCase(), userId: req.userId! },
        update: { ...lead, email: lead.email.toLowerCase() },
      })
    )
  );

  const imported = results.filter((r) => r.status === "fulfilled").length;
  res.json({ imported, failed: results.length - imported });
});

// Import contacts directly from Apollo.io using the ApolloLeadService
leadsRouter.post("/leads/apollo/import", async (req, res) => {
  const { ApolloLeadService } = await import("../leads/apolloService");
  const apiKey = (req.body.apiKey as string) || process.env.APOLLO_API_KEY;
  const apollo = new ApolloLeadService(apiKey);

  try {
    const rawContacts = await apollo.searchContacts({
      query: req.body.query,
      page: req.body.page,
      perPage: req.body.perPage,
    });

    const normalized = rawContacts
      .map((c) => apollo.normalizeContact(c))
      .filter((c): c is NonNullable<typeof c> => Boolean(c));

    if (normalized.length === 0) {
      return res.json({ imported: 0, failed: 0, totalFetched: rawContacts.length, message: "No valid email contacts found" });
    }

    const results = await Promise.allSettled(
      normalized.map((lead) =>
        prisma.lead.upsert({
          where: { userId_email: { userId: req.userId!, email: lead.email } },
          create: { ...lead, userId: req.userId! },
          update: { ...lead },
        })
      )
    );

    const imported = results.filter((r) => r.status === "fulfilled").length;
    res.json({
      imported,
      failed: results.length - imported,
      totalFetched: rawContacts.length,
    });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || "Apollo import failed" });
  }
});

// Backs the search/filter/select UI described in the product conversation.
leadsRouter.get("/leads", async (req, res) => {
  const { company, title, verifyStatus, q } = req.query as Record<string, string | undefined>;

  const leads = await prisma.lead.findMany({
    where: {
      userId: req.userId!,
      ...(company ? { company: { contains: company, mode: "insensitive" } } : {}),
      ...(title ? { title: { contains: title, mode: "insensitive" } } : {}),
      ...(verifyStatus ? { verifyStatus } : {}),
      ...(q
        ? {
            OR: [
              { email: { contains: q, mode: "insensitive" } },
              { firstName: { contains: q, mode: "insensitive" } },
              { lastName: { contains: q, mode: "insensitive" } },
            ],
          }
        : {}),
    },
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  res.json({ leads });
});
