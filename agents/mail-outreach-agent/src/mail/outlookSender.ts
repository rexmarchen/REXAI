import { getGraphAccessTokenForMailbox } from "../oauth/microsoft";
import { buildMimeMessage } from "./mimeBuilder";
import type { OutboundEmail, SendResult } from "./types";

const GRAPH_BASE = "https://graph.microsoft.com/v1.0";

/**
 * Sends through the user's real Outlook/M365 mailbox.
 *
 * We use the /me/sendMime endpoint (raw MIME upload) rather than the
 * structured /me/sendMail JSON body, specifically so we control the
 * Message-ID and List-Unsubscribe headers ourselves — the JSON endpoint
 * doesn't expose custom header injection.
 */
export async function sendViaOutlook(
  mailboxId: string,
  email: OutboundEmail
): Promise<SendResult> {
  const accessToken = await getGraphAccessTokenForMailbox(mailboxId);
  const mime = buildMimeMessage(email);

  const res = await fetch(`${GRAPH_BASE}/me/sendMail`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "text/plain",
    },
    body: mime,
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Graph sendMail failed (${res.status}): ${text}`);
  }

  // Graph's /sendMail returns 202 with no body and no message id (the sent
  // item id is only discoverable via a subsequent /me/mailFolders/sentitems
  // lookup). We match sent mail back later during polling using the
  // Message-ID header we set ourselves, which Graph preserves on send.
  return {
    providerMessageId: "", // resolved lazily by the poll worker via Message-ID search
    rfcMessageId: email.messageId,
  };
}
