import express from 'express'
import bcrypt from 'bcrypt'
import db from '../lib/db.js'

const router = express.Router()

const loginPath = '/connect/login'
const signupPath = '/connect/signup'
const dashboardPath = '/connect/dashboard'

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;')
}

function requireAuth(req, res, next) {
  if (!req.session?.userId) {
    return res.redirect(loginPath)
  }

  return next()
}

function saveSession(req) {
  return new Promise((resolve, reject) => {
    req.session.save((err) => {
      if (err) reject(err)
      else resolve()
    })
  })
}

router.get('/signup', (req, res) => {
  res.send(`
    <h1>Sign up</h1>
    <form method="POST" action="${signupPath}">
      <input name="email" type="email" placeholder="Email" required><br>
      <input name="password" type="password" placeholder="Password" required minlength="8"><br>
      <button type="submit">Sign up</button>
    </form>
    <p><a href="${loginPath}">Already have an account? Log in</a></p>
  `)
})

router.post('/signup', async (req, res) => {
  const email = String(req.body.email || '').toLowerCase().trim()
  const password = String(req.body.password || '')

  if (!email || password.length < 8) {
    return res.status(400).send('Email and a password with at least 8 characters are required.')
  }

  try {
    const passwordHash = await bcrypt.hash(password, 12)
    const result = await db.query(
      'INSERT INTO users (email, password_hash) VALUES ($1, $2) RETURNING id',
      [email, passwordHash]
    )

    req.session.userId = result.rows[0].id
    await saveSession(req)
    return res.redirect(dashboardPath)
  } catch (err) {
    if (err.code === '23505') {
      return res.status(400).send('An account with that email already exists.')
    }

    console.error('Connect signup error:', err)
    return res.status(500).send(`Something went wrong creating your account: ${escapeHtml(err.message)}`)
  }
})

router.get('/login', (req, res) => {
  res.send(`
    <h1>Log in</h1>
    <form method="POST" action="${loginPath}">
      <input name="email" type="email" placeholder="Email" required><br>
      <input name="password" type="password" placeholder="Password" required><br>
      <button type="submit">Log in</button>
    </form>
    <p><a href="${signupPath}">Need an account? Sign up</a></p>
  `)
})

router.post('/login', async (req, res) => {
  const email = String(req.body.email || '').toLowerCase().trim()
  const password = String(req.body.password || '')

  const result = await db.query('SELECT id, password_hash FROM users WHERE email = $1', [email])

  if (result.rows.length === 0) {
    return res.status(401).send('Invalid email or password.')
  }

  const user = result.rows[0]
  const passwordMatches = await bcrypt.compare(password, user.password_hash)

  if (!passwordMatches) {
    return res.status(401).send('Invalid email or password.')
  }

  req.session.userId = user.id
  await saveSession(req)
  return res.redirect(dashboardPath)
})

router.post('/logout', (req, res) => {
  req.session.destroy(() => res.redirect(loginPath))
})

export { requireAuth }
export default router
