import { ConfidentialClientApplication } from "@azure/msal-node";
import { env } from "../config/env";
import { prisma } from "../lib/prisma";
import { encrypt, decrypt } from "../lib/crypto";
import { logger } from "../lib/logger";

// Mail.Send only — do not request Mail.ReadWrite. Mail.Read (readonly) is
// added separately for the polling worker's bounce/reply detection.
export const MS_SCOPES = ["Mail.Send", "Mail.Read", "User.Read", "offline_access"];

function msalClient() {
  return new ConfidentialClientApplication({
    auth: {
      clientId: env.MS_CLIENT_ID,
      clientSecret: env.MS_CLIENT_SECRET,
      authority: `https://login.microsoftonline.com/${env.MS_TENANT_ID}`,
    },
  });
}

export async function getMicrosoftConsentUrl(state: string): Promise<string> {
  const client = msalClient();
  return client.getAuthCodeUrl({
    scopes: MS_SCOPES,
    redirectUri: env.MS_REDIRECT_URI,
    state,
    prompt: "consent",
  });
}

export async function exchangeMicrosoftCode(code: string) {
  const client = msalClient();
  const result = await client.acquireTokenByCode({
    code,
    scopes: MS_SCOPES,
    redirectUri: env.MS_REDIRECT_URI,
  });
  if (!result?.account?.username) {
    throw new Error("Microsoft token exchange did not return an account/email.");
  }
  // MSAL's ConfidentialClientApplication manages its own token cache internally,
  // but we still need a portable refresh token to persist ourselves since this
  // process may not be the one that later sends the mail (see below).
  const tokenCache = client.getTokenCache().serialize();
  return {
    email: result.account.username,
    accessToken: result.accessToken,
    expiresOn: result.expiresOn ?? new Date(Date.now() + 55 * 60 * 1000),
    serializedTokenCache: tokenCache, // store this instead of a bare refresh token
  };
}

/**
 * Returns a valid Graph access token for a mailbox, silently refreshing via
 * MSAL's token cache if needed. We persist MSAL's serialized cache (not a
 * raw refresh token string) because MSAL owns rotation/versioning of it.
 */
export async function getGraphAccessTokenForMailbox(mailboxId: string): Promise<string> {
  const mailbox = await prisma.mailbox.findUniqueOrThrow({ where: { id: mailboxId } });
  const client = msalClient();

  // refreshTokenEnc column holds the serialized MSAL cache for Microsoft mailboxes.
  client.getTokenCache().deserialize(decrypt(mailbox.refreshTokenEnc));

  const accounts = await client.getTokenCache().getAllAccounts();
  const account = accounts.find((a) => a.username === mailbox.email);
  if (!account) {
    await prisma.mailbox.update({ where: { id: mailboxId }, data: { status: "DISCONNECTED" } });
    throw new Error(`No cached MSAL account for mailbox ${mailboxId} — needs reauth.`);
  }

  try {
    const result = await client.acquireTokenSilent({ account, scopes: MS_SCOPES });
    if (!result) throw new Error("acquireTokenSilent returned null");

    await prisma.mailbox.update({
      where: { id: mailboxId },
      data: {
        accessTokenEnc: encrypt(result.accessToken),
        tokenExpiresAt: result.expiresOn ?? new Date(Date.now() + 55 * 60 * 1000),
        refreshTokenEnc: encrypt(client.getTokenCache().serialize()),
      },
    });

    return result.accessToken;
  } catch (err) {
    logger.error({ err, mailboxId }, "Silent Microsoft token acquisition failed");
    await prisma.mailbox.update({ where: { id: mailboxId }, data: { status: "DISCONNECTED" } });
    throw new Error(`Mailbox ${mailboxId} token invalid — marked DISCONNECTED, needs reauth.`);
  }
}
