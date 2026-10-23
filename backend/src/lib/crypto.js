import crypto from 'crypto'
import { ENCRYPTION_KEY } from '../config/env.js'

const ALGORITHM = 'aes-256-gcm'

function getKey() {
  if (ENCRYPTION_KEY && ENCRYPTION_KEY.length === 64) {
    try {
      return Buffer.from(ENCRYPTION_KEY, 'hex')
    } catch {}
  }
  const fallbackSeed = process.env.SESSION_SECRET || process.env.JWT_SECRET || 'rexion-enterprise-aes-256-encryption-seed'
  return crypto.createHash('sha256').update(fallbackSeed).digest()
}

export function encrypt(plainText) {
  const iv = crypto.randomBytes(12)
  const cipher = crypto.createCipheriv(ALGORITHM, getKey(), iv)
  const encrypted = Buffer.concat([cipher.update(plainText, 'utf8'), cipher.final()])
  const authTag = cipher.getAuthTag()

  return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted.toString('hex')}`
}

export function decrypt(encryptedString) {
  const [ivHex, authTagHex, dataHex] = encryptedString.split(':')
  const decipher = crypto.createDecipheriv(ALGORITHM, getKey(), Buffer.from(ivHex, 'hex'))
  decipher.setAuthTag(Buffer.from(authTagHex, 'hex'))

  const decrypted = Buffer.concat([
    decipher.update(Buffer.from(dataHex, 'hex')),
    decipher.final()
  ])

  return decrypted.toString('utf8')
}
