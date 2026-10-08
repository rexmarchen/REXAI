import crypto from 'crypto'
import { ENCRYPTION_KEY } from '../config/env.js'

const ALGORITHM = 'aes-256-gcm'

function getKey() {
  if (!ENCRYPTION_KEY || ENCRYPTION_KEY.length !== 64) {
    throw new Error(
      'ENCRYPTION_KEY must be a 64-character hex string. Generate one with: node -e "console.log(require(\'crypto\').randomBytes(32).toString(\'hex\'))"'
    )
  }

  return Buffer.from(ENCRYPTION_KEY, 'hex')
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
