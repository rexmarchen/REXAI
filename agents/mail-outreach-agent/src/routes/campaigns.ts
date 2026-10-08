import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { enqueueCampaignSends } from "../queue/sendQueue";
import { validateTemplateTags, renderCampaignContent } from "../mail/templateEngine";

export const campaignsRouter = Router();

const CreateCampaignSchema = z.object({
  mailboxId: z.string(),
  name: z.string().min(1),
  subject: z.string().min(1),
  bodyHtml: z.string().min(1),
});

campaignsRouter.post("/campaigns", async (req, res) => {
  const parsed = CreateCampaignSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }

  const subjectValidation = validateTemplateTags(parsed.data.subject);
  const bodyValidation = validateTemplateTags(parsed.data.bodyHtml);
  const unknownTags = Array.from(
    new Set([...subjectValidation.unknownTags, ...bodyValidation.unknownTags])
  );

  if (unknownTags.length > 0) {
    return res.status(400).json({
      error: "Campaign contains unknown merge tags",
      unknownTags,
    });
  }

  const campaign = await prisma.campaign.create({
    data: { ...parsed.data, userId: req.userId!, status: "DRAFT" },
  });

  res.status(201).json({ campaign });
});

// This is the "one click, send to selected leads" endpoint referenced in
// the product conversation. It only enqueues — actual sending happens
// asynchronously in the worker, which is what makes it safe to click once
// for 500 leads without blocking the request or blasting them all at once.
campaignsRouter.post("/campaigns/:id/send", async (req, res) => {
  const campaign = await prisma.campaign.findFirst({
    where: { id: req.params.id, userId: req.userId! },
    include: { mailbox: true },
  });
  if (!campaign) return res.status(404).json({ error: "Campaign not found" });

  if (campaign.mailbox.status === "DISCONNECTED") {
    return res.status(409).json({
      error: "Sending mailbox is disconnected and needs reauthorization before this campaign can send.",
    });
  }

  const subjectValidation = validateTemplateTags(campaign.subject);
  const bodyValidation = validateTemplateTags(campaign.bodyHtml);
  const unknownTags = Array.from(
    new Set([...subjectValidation.unknownTags, ...bodyValidation.unknownTags])
  );

  if (unknownTags.length > 0) {
    return res.status(400).json({
      error: "Campaign contains unknown merge tags",
      unknownTags,
    });
  }

  const { queued, skipped } = await enqueueCampaignSends(campaign.id);
  await prisma.campaign.update({ where: { id: campaign.id }, data: { status: "ACTIVE" } });

  res.json({ queued, skipped });
});

campaignsRouter.get("/campaigns/:id/status", async (req, res) => {
  const counts = await prisma.send.groupBy({
    by: ["status"],
    where: { campaignId: req.params.id },
    _count: true,
  });
  res.json({ counts });
});
