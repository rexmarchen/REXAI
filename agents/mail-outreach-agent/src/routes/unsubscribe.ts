import { Router } from "express";
import { prisma } from "../lib/prisma";
import { addSuppression } from "../suppression/suppressionList";

export const unsubscribeRouter = Router();

// Intentionally unauthenticated — the recipient clicking this link has no
// account. RFC 8058 also requires this to respond to a POST (one-click,
// no confirmation page) when triggered via the List-Unsubscribe-Post header,
// so both GET (manual click) and POST (client one-click) are supported.
async function handleUnsubscribe(sendId: string, res: any) {
  const send = await prisma.send.findUnique({
    where: { id: sendId },
    include: { lead: true, campaign: true },
  });
  if (!send) return res.status(404).send("Not found");

  await addSuppression(send.campaign.userId, send.lead.email, "unsubscribed");
  res.status(200).send("You have been unsubscribed and will not receive further emails.");
}

unsubscribeRouter.get("/u/:sendId", (req, res) => handleUnsubscribe(req.params.sendId, res));
unsubscribeRouter.post("/u/:sendId", (req, res) => handleUnsubscribe(req.params.sendId, res));
