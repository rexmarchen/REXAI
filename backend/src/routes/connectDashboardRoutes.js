import express from 'express'
import db from '../lib/db.js'
import { requireAuth } from './connectAuthRoutes.js'

const router = express.Router()

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;')
}

router.get('/dashboard', requireAuth, async (req, res) => {
  const result = await db.query(
    'SELECT person_urn, connected_at, expires_at FROM linkedin_accounts WHERE user_id = $1',
    [req.session.userId]
  )

  const connected = result.rows[0]

  res.send(`
    <h1>Dashboard</h1>
    ${
      connected
        ? `<p>LinkedIn connected: ${escapeHtml(connected.person_urn)}</p>
           <p>Connected at: ${escapeHtml(connected.connected_at)}</p>
           <p>Token expires: ${escapeHtml(connected.expires_at)}</p>`
        : `<p>LinkedIn not connected yet.</p>
           <a href="/connect/auth/linkedin/connect"><button>Connect LinkedIn</button></a>`
    }
    <form method="POST" action="/connect/logout" style="margin-top: 20px;">
      <button type="submit">Log out</button>
    </form>
  `)
})

export default router
