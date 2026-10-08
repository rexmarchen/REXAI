import type { OutboundEmail } from "./types";

function encodeHeaderWord(text: string): string {
  // Minimal RFC 2047 encoding for non-ASCII display names/subjects.
  if (/^[\x00-\x7F]*$/.test(text)) return text;
  return `=?UTF-8?B?${Buffer.from(text, "utf8").toString("base64")}?=`;
}

/**
 * Builds a raw RFC5322 MIME message. Includes List-Unsubscribe headers
 * (RFC 8058 one-click) which is what CAN-SPAM/GDPR compliance and inbox
 * providers' spam filters both expect on any bulk/marketing-style mail.
 */
export function buildMimeMessage(email: OutboundEmail): string {
  const from = email.fromName
    ? `${encodeHeaderWord(email.fromName)} <${email.fromEmail}>`
    : email.fromEmail;
  const to = email.toName ? `${encodeHeaderWord(email.toName)} <${email.toEmail}>` : email.toEmail;

  const headers = [
    `From: ${from}`,
    `To: ${to}`,
    `Subject: ${encodeHeaderWord(email.subject)}`,
    `Message-ID: <${email.messageId}>`,
    `MIME-Version: 1.0`,
    `Content-Type: text/html; charset="UTF-8"`,
    `Content-Transfer-Encoding: 7bit`,
    // One-click unsubscribe (RFC 8058) — strongly reduces spam-complaint rate
    // because clients like Gmail render a native "Unsubscribe" button instead
    // of the user hitting the spam-report button.
    `List-Unsubscribe: <${email.unsubscribeUrl}>`,
    `List-Unsubscribe-Post: List-Unsubscribe=One-Click`,
  ].join("\r\n");

  const footer = `
    <hr style="border:none;border-top:1px solid #e5e5e5;margin:24px 0 8px" />
    <p style="font-size:12px;color:#888">
      <a href="${email.unsubscribeUrl}">Unsubscribe</a> from future emails.
    </p>`;

  const body = `${email.htmlBody}${footer}`;

  return `${headers}\r\n\r\n${body}`;
}

export function toBase64Url(raw: string): string {
  return Buffer.from(raw, "utf8")
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}
