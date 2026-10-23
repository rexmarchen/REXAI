// AES-256-GCM encryption for LinkedIn tokens at rest.
// Generate a key once: node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
import crypto from 'node:crypto';

function key() {
  const k = Buffer.from(process.env.TOKEN_ENC_KEY || '', 'base64');
  if (k.length !== 32) throw new Error('TOKEN_ENC_KEY must be 32 bytes, base64 encoded');
  return k;
}

function encrypt(plain) {
  const iv = crypto.randomBytes(12);
  const c = crypto.createCipheriv('aes-256-gcm', key(), iv);
  const enc = Buffer.concat([c.update(plain, 'utf8'), c.final()]);
  return [iv, c.getAuthTag(), enc].map((b) => b.toString('base64')).join('.');
}

function decrypt(payload) {
  const [iv, tag, enc] = payload.split('.').map((s) => Buffer.from(s, 'base64'));
  const d = crypto.createDecipheriv('aes-256-gcm', key(), iv);
  d.setAuthTag(tag);
  return Buffer.concat([d.update(enc), d.final()]).toString('utf8');
}

export { encrypt, decrypt };
