import "dotenv/config";
import { z } from "zod";

const EnvSchema = z.object({
  PORT: z.coerce.number().default(3000),
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  APP_BASE_URL: z.string().url(),
  ENCRYPTION_KEY: z.string().length(64, "ENCRYPTION_KEY must be a 32-byte hex string (64 chars)"),

  DATABASE_URL: z.string().min(1),
  REDIS_URL: z.string().min(1),

  GOOGLE_CLIENT_ID: z.string().min(1),
  GOOGLE_CLIENT_SECRET: z.string().min(1),
  GOOGLE_REDIRECT_URI: z.string().url(),

  MS_CLIENT_ID: z.string().min(1),
  MS_CLIENT_SECRET: z.string().min(1),
  MS_TENANT_ID: z.string().default("common"),
  MS_REDIRECT_URI: z.string().url(),

  DEFAULT_DAILY_CAP_NEW_MAILBOX: z.coerce.number().default(20),
  DEFAULT_DAILY_CAP_WARMED_MAILBOX: z.coerce.number().default(150),
  WARMUP_RAMP_DAYS: z.coerce.number().default(21),
  MIN_SEND_INTERVAL_MS: z.coerce.number().default(45000),
  MAX_SEND_JITTER_MS: z.coerce.number().default(90000),

  BOUNCE_RATE_PAUSE_THRESHOLD: z.coerce.number().default(0.05),
  COMPLAINT_RATE_PAUSE_THRESHOLD: z.coerce.number().default(0.001),

  EMAIL_VERIFICATION_API_KEY: z.string().optional(),
  EMAIL_VERIFICATION_API_URL: z.string().optional(),
});

const parsed = EnvSchema.safeParse(process.env);

if (!parsed.success) {
  // Fail fast and loud — a misconfigured mail agent is worse than a crashed one.
  console.error("Invalid environment configuration:", parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = parsed.data;
