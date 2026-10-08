import pino from "pino";
import { env } from "../config/env";

export const logger = pino({
  level: env.NODE_ENV === "production" ? "info" : "debug",
  transport:
    env.NODE_ENV === "production"
      ? undefined
      : { target: "pino-pretty", options: { colorize: true } },
  // Never log token fields even if accidentally passed in — defense in depth.
  redact: ["*.accessTokenEnc", "*.refreshTokenEnc", "*.accessToken", "*.refreshToken"],
});
