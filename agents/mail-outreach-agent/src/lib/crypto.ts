import crypto from "node:crypto";
import { env } from "../config/env";

// OAuth refresh tokens are the keys to a user's real mailbox — they are
// encrypted at rest with AES-256-GCM. ENCRYPTION_KEY must be a 32-byte hex
// string, generated once via: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
const KEY = Buffer.from(env.ENCRYPTION_KEY, "hex");
const ALGO = "aes-256-gcm";

export function encrypt(plaintext: string): string {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(ALGO, KEY, iv);
  const encrypted = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const authTag = cipher.getAuthTag();
  // Store iv + authTag + ciphertext together, base64, so it's one column value.
  return Buffer.concat([iv, authTag, encrypted]).toString("base64");
}

export function decrypt(payload: string): string {
  const buf = Buffer.from(payload, "base64");
  const iv = buf.subarray(0, 12);
  const authTag = buf.subarray(12, 28);
  const encrypted = buf.subarray(28);
  const decipher = crypto.createDecipheriv(ALGO, KEY, iv);
  decipher.setAuthTag(authTag);
  return Buffer.concat([decipher.update(encrypted), decipher.final()]).toString("utf8");
}
