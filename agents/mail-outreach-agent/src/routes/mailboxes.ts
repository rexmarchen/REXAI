import { Router } from "express";
import { prisma } from "../lib/prisma";

export const mailboxesRouter = Router();

mailboxesRouter.get("/mailboxes", async (req, res) => {
  const mailboxes = await prisma.mailbox.findMany({
    where: { userId: req.userId! },
    select: {
      id: true,
      provider: true,
      email: true,
      status: true,
      dailyCap: true,
      sentToday: true,
      bounceCount: true,
      complaintCount: true,
      sentTotal: true,
      connectedAt: true,
    },
  });
  res.json({ mailboxes });
});

mailboxesRouter.post("/mailboxes/:id/reactivate", async (req, res) => {
  // Call after a PAUSED mailbox's issue is understood/resolved by the user.
  // Does not clear bounce/complaint counters — those are lifetime signals.
  const mailbox = await prisma.mailbox.updateMany({
    where: { id: req.params.id, userId: req.userId!, status: "PAUSED" },
    data: { status: "ACTIVE" },
  });
  if (mailbox.count === 0) return res.status(404).json({ error: "Mailbox not found or not paused" });
  res.json({ ok: true });
});

mailboxesRouter.delete("/mailboxes/:id", async (req, res) => {
  await prisma.mailbox.deleteMany({ where: { id: req.params.id, userId: req.userId! } });
  res.status(204).send();
});
