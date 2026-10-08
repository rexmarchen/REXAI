import { google } from "googleapis";
import { env } from "../config/env";
import { prisma } from "../lib/prisma";
import { encrypt, decrypt } from "../lib/crypto";
import { logger } from "../lib/logger";

// Send-only scope, plus readonly so the polling worker can look for bounces
// and replies. Never request full mailbox modify/delete scopes — minimal
// scope both reduces blast radius on a token leak and eases Google's OAuth
// verification review.
export const GOOGLE_SCOPES = [
  "https://www.googleapis.com/auth/gmail.send",
  "https://www.googleapis.com/auth/gmail.readonly",
  "https://www.googleapis.com/auth/userinfo.email",
];

function baseOAuthClient() {
  return new google.auth.OAuth2(
    env.GOOGLE_CLIENT_ID,
    env.GOOGLE_CLIENT_SECRET,
    env.GOOGLE_REDIRECT_URI
  );
}

export function getGoogleConsentUrl(state: string): string {
  const client = baseOAuthClient();
  return client.generateAuthUrl({
    access_type: "offline", // required to receive a refresh_token
    prompt: "consent", // force refresh_token on re-auth too, not just first connect
    scope: GOOGLE_SCOPES,
    state,
  });
}

export async function exchangeGoogleCode(code: string) {
  const client = baseOAuthClient();
  const { tokens } = await client.getToken(code);
  if (!tokens.refresh_token) {
    // Happens if the user previously connected and Google didn't re-issue one.
    // The caller should surface "please disconnect and reconnect" in this case.
    throw new Error(
      "No refresh_token returned by Google. User may need to revoke prior access at https://myaccount.google.com/permissions and reconnect."
    );
  }
  client.setCredentials(tokens);
  const oauth2 = google.oauth2({ auth: client, version: "v2" });
  const { data: profile } = await oauth2.userinfo.get();
  return { tokens, email: profile.email! };
}

/**
 * Returns an authenticated Gmail client for a given mailbox row, refreshing
 * and persisting the access token if it's expired or near expiry. Every
 * caller (send worker, poll worker) should go through this function rather
 * than reading the stored access token directly.
 */
export async function getGmailClientForMailbox(mailboxId: string) {
  const mailbox = await prisma.mailbox.findUniqueOrThrow({ where: { id: mailboxId } });

  const client = baseOAuthClient();
  client.setCredentials({
    access_token: decrypt(mailbox.accessTokenEnc),
    refresh_token: decrypt(mailbox.refreshTokenEnc),
    expiry_date: mailbox.tokenExpiresAt.getTime(),
  });

  // googleapis auto-refreshes on demand, but we hook the event to persist the
  // new access token so we don't force a refresh on every single API call.
  client.on("tokens", async (tokens) => {
    try {
      await prisma.mailbox.update({
        where: { id: mailboxId },
        data: {
          accessTokenEnc: encrypt(tokens.access_token!),
          tokenExpiresAt: new Date(tokens.expiry_date ?? Date.now() + 55 * 60 * 1000),
          // Google only sends a new refresh_token occasionally; keep the old one otherwise.
          ...(tokens.refresh_token ? { refreshTokenEnc: encrypt(tokens.refresh_token) } : {}),
        },
      });
    } catch (err) {
      logger.error({ err, mailboxId }, "Failed to persist refreshed Google token");
    }
  });

  try {
    // Force a check now so callers get a definitively fresh token / a clear error.
    await client.getAccessToken();
  } catch (err: any) {
    if (err?.response?.data?.error === "invalid_grant") {
      await prisma.mailbox.update({
        where: { id: mailboxId },
        data: { status: "DISCONNECTED" },
      });
      throw new Error(`Mailbox ${mailboxId} token revoked — marked DISCONNECTED, needs reauth.`);
    }
    throw err;
  }

  return google.gmail({ version: "v1", auth: client });
}
