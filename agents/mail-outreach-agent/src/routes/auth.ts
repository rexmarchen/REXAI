import { Router } from "express";
import { randomUUID } from "node:crypto";
import { prisma } from "../lib/prisma";
import { encrypt } from "../lib/crypto";
import { env } from "../config/env";
import { logger } from "../lib/logger";
import { getGoogleConsentUrl, exchangeGoogleCode } from "../oauth/google";
import { getMicrosoftConsentUrl, exchangeMicrosoftCode } from "../oauth/microsoft";

export const authRouter = Router();

// In production, replace this with your real session/auth middleware —
// this file assumes req.userId is already set by upstream auth.
declare module "express-serve-static-core" {
  interface Request {
    userId?: string;
  }
}

authRouter.get("/auth/google", (req, res) => {
  const state = randomUUID();
  // Persist state -> userId mapping (Redis/DB) in production to prevent CSRF;
  // omitted here for brevity but required before shipping.
  const url = getGoogleConsentUrl(state);
  res.redirect(url);
});

authRouter.get("/auth/google/callback", async (req, res) => {
  try {
    const code = req.query.code as string;
    const { tokens, email } = await exchangeGoogleCode(code);

    await prisma.mailbox.upsert({
      where: { userId_email: { userId: req.userId!, email } },
      create: {
        userId: req.userId!,
        provider: "GOOGLE",
        email,
        accessTokenEnc: encrypt(tokens.access_token!),
        refreshTokenEnc: encrypt(tokens.refresh_token!),
        tokenExpiresAt: new Date(tokens.expiry_date ?? Date.now() + 55 * 60 * 1000),
        dailyCap: env.DEFAULT_DAILY_CAP_NEW_MAILBOX,
        status: "WARMING_UP",
      },
      update: {
        accessTokenEnc: encrypt(tokens.access_token!),
        refreshTokenEnc: encrypt(tokens.refresh_token!),
        tokenExpiresAt: new Date(tokens.expiry_date ?? Date.now() + 55 * 60 * 1000),
        status: "ACTIVE", // reconnecting a previously-disconnected mailbox
      },
    });

    res.redirect(`${env.APP_BASE_URL}/mailboxes?connected=${encodeURIComponent(email)}`);
  } catch (err) {
    logger.error({ err }, "Google OAuth callback failed");
    res.redirect(`${env.APP_BASE_URL}/mailboxes?error=google_oauth_failed`);
  }
});

authRouter.get("/auth/microsoft", async (req, res) => {
  const state = randomUUID();
  const url = await getMicrosoftConsentUrl(state);
  res.redirect(url);
});

authRouter.get("/auth/microsoft/callback", async (req, res) => {
  try {
    const code = req.query.code as string;
    const result = await exchangeMicrosoftCode(code);

    await prisma.mailbox.upsert({
      where: { userId_email: { userId: req.userId!, email: result.email } },
      create: {
        userId: req.userId!,
        provider: "MICROSOFT",
        email: result.email,
        accessTokenEnc: encrypt(result.accessToken),
        refreshTokenEnc: encrypt(result.serializedTokenCache),
        tokenExpiresAt: result.expiresOn,
        dailyCap: env.DEFAULT_DAILY_CAP_NEW_MAILBOX,
        status: "WARMING_UP",
      },
      update: {
        accessTokenEnc: encrypt(result.accessToken),
        refreshTokenEnc: encrypt(result.serializedTokenCache),
        tokenExpiresAt: result.expiresOn,
        status: "ACTIVE",
      },
    });

    res.redirect(`${env.APP_BASE_URL}/mailboxes?connected=${encodeURIComponent(result.email)}`);
  } catch (err) {
    logger.error({ err }, "Microsoft OAuth callback failed");
    res.redirect(`${env.APP_BASE_URL}/mailboxes?error=microsoft_oauth_failed`);
  }
});
