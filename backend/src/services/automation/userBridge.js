import db from '../../lib/db.js'
import { ensureAutomationSchema } from './schema.js'

export async function resolveAutomationUser(req) {
  // User identity is derived strictly from the verified JWT session or session.
  // Client-supplied userId in query/body is never trusted.
  if (req.session?.userId) {
    return req.session.userId
  }
  if (req.user?.id) {
    return req.user.id
  }
  if (req.user?._id) {
    return req.user._id.toString()
  }
  return null
}

export function saveSession(req) {
  return new Promise((resolve) => {
    if (req.session && typeof req.session.save === 'function') {
      req.session.save(() => resolve())
    } else {
      resolve()
    }
  })
}
