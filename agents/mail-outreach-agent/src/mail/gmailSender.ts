import { getGmailClientForMailbox } from "../oauth/google";
import { buildMimeMessage, toBase64Url } from "./mimeBuilder";
import type { OutboundEmail, SendResult } from "./types";

/**
 * Sends through the user's real Gmail mailbox via users.messages.send.
 * This is functionally identical to the user clicking Send themselves:
 * SPF/DKIM/DMARC pass automatically (Google signs it), it lands in their
 * Sent folder, and replies thread back to their inbox — no third-party
 * relay domain in the From/Return-Path to get flagged.
 */
export async function sendViaGmail(
  mailboxId: string,
  email: OutboundEmail
): Promise<SendResult> {
  const gmail = await getGmailClientForMailbox(mailboxId);
  const raw = toBase64Url(buildMimeMessage(email));

  const res = await gmail.users.messages.send({
    userId: "me",
    requestBody: { raw },
  });

  if (!res.data.id) {
    throw new Error("Gmail send returned no message id — treat as failed, do not mark SENT.");
  }

  return {
    providerMessageId: res.data.id,
    rfcMessageId: email.messageId,
  };
}
