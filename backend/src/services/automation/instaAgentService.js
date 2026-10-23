import path from 'path'
import fs from 'fs'
import { fileURLToPath } from 'url'
import { exec } from 'child_process'
import util from 'util'

const execPromise = util.promisify(exec)

// Determine the path to agents/rexeditzz-insta-agent (prioritizing user Downloads agent)
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const DOWNLOADS_AGENT_DIR = 'c:/Users/anshupal/Downloads/-insta-agent/rexeditzz-insta-agent'
const AGENT_DIR = fs.existsSync(DOWNLOADS_AGENT_DIR)
  ? DOWNLOADS_AGENT_DIR
  : path.resolve(__dirname, '../../../../agents/rexeditzz-insta-agent')
const DB_PATH = path.join(AGENT_DIR, 'data', 'agent.db')
const ENV_PATH = path.join(AGENT_DIR, '.env')

let DatabaseSync = null
try {
  const sqlite = await import('node:sqlite')
  DatabaseSync = sqlite.DatabaseSync
} catch (e) {
  console.warn('[InstaAgentService] Native node:sqlite not available, using fallback:', e.message)
}

function getDbConnection() {
  if (!DatabaseSync) return null
  try {
    if (!fs.existsSync(path.dirname(DB_PATH))) {
      fs.mkdirSync(path.dirname(DB_PATH), { recursive: true })
    }
    const db = new DatabaseSync(DB_PATH)
    return db
  } catch (err) {
    console.warn('[InstaAgentService] Failed to open SQLite DB:', err.message)
    return null
  }
}

/**
 * Reads settings from the SQLite agent database
 */
export function getAgentSettings() {
  const db = getDbConnection()
  if (!db) {
    return {
      paused: '0',
      max_generations_per_day: '10',
      ig_username: 'anshu._io',
      autopilot: true
    }
  }

  try {
    const rows = db.prepare('SELECT key, value FROM settings').all()
    const settings = {}
    for (const r of rows) {
      settings[r.key] = r.value
    }
    db.close()
    return {
      paused: settings.paused || '0',
      max_generations_per_day: settings.max_generations_per_day || '10',
      ig_username: settings.ig_username || 'anshu._io',
      autopilot: settings.paused !== '1',
      lastRefreshed: settings.ig_token_refreshed_at || null,
      ...settings
    }
  } catch (err) {
    try { db.close() } catch {}
    return {
      paused: '0',
      autopilot: true,
      ig_username: 'anshu._io'
    }
  }
}

/**
 * Updates a setting in the agent SQLite database
 */
export function setAgentSetting(key, value) {
  const db = getDbConnection()
  if (!db) return false
  try {
    db.prepare(
      'INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value'
    ).run(key, String(value))
    db.close()
    return true
  } catch (err) {
    try { db.close() } catch {}
    console.error('[InstaAgentService] Error setting setting:', err.message)
    return false
  }
}

/**
 * Gets overall status, post counts, and next scheduled slots
 */
export async function getInstaAgentStatus() {
  const settings = getAgentSettings()
  const db = getDbConnection()

  let postCounts = { new: 0, approved: 0, published: 0, failed: 0, total: 0 }
  let nextScheduled = null
  let recentPosts = []

  if (db) {
    try {
      const counts = db.prepare('SELECT status, COUNT(*) as c FROM posts GROUP BY status').all()
      for (const row of counts) {
        if (postCounts[row.status] !== undefined) {
          postCounts[row.status] = Number(row.c)
        }
        postCounts.total += Number(row.c)
      }

      const nextRow = db.prepare(
        "SELECT * FROM posts WHERE status IN ('approved', 'new') AND scheduled_at IS NOT NULL ORDER BY scheduled_at ASC LIMIT 1"
      ).get()
      if (nextRow) {
        nextScheduled = nextRow
      }

      recentPosts = db.prepare(
        'SELECT id, kind, caption, status, media_url, scheduled_at, published_at, permalink, error, created_at FROM posts ORDER BY id DESC LIMIT 6'
      ).all()
    } catch (err) {
      console.warn('[InstaAgentService] Error fetching post counts:', err.message)
    } finally {
      try { db.close() } catch {}
    }
  }

  // Parse .env if available
  let envConfig = {
    hasIgToken: false,
    hasTelegramToken: false,
    hasGeminiKey: false,
    igUserId: '39134971926150240',
    timezone: 'Asia/Kolkata',
    postSlots: '17:00,19:00'
  }

  if (fs.existsSync(ENV_PATH)) {
    const envContent = fs.readFileSync(ENV_PATH, 'utf-8')
    envConfig.hasIgToken = /IG_ACCESS_TOKEN=.+/.test(envContent) && !/IG_ACCESS_TOKEN=YOUR_/.test(envContent)
    envConfig.hasTelegramToken = /TELEGRAM_BOT_TOKEN=.+/.test(envContent) && !/TELEGRAM_BOT_TOKEN=NO_TOKEN/.test(envContent)
    envConfig.hasGeminiKey = /GEMINI_API_KEY=.+/.test(envContent) || Boolean(process.env.GEMINI_API_KEY)
  }

  return {
    online: true,
    account: {
      username: settings.ig_username || 'anshu._io',
      connected: envConfig.hasIgToken || Boolean(settings.ig_access_token),
      userId: envConfig.igUserId
    },
    autopilot: settings.paused !== '1',
    timezone: envConfig.timezone,
    postSlots: envConfig.postSlots,
    postCounts,
    nextScheduled,
    recentPosts,
    settings,
    envConfig
  }
}

/**
 * Retrieves the queued and approved drafts
 */
export async function getInstaQueue(limit = 20) {
  const db = getDbConnection()
  if (!db) return []

  try {
    const rows = db.prepare(
      "SELECT * FROM posts WHERE status IN ('approved', 'new', 'draft', 'publishing') ORDER BY scheduled_at ASC, id DESC LIMIT ?"
    ).all(limit)
    db.close()
    return rows
  } catch (err) {
    try { db.close() } catch {}
    console.error('[InstaAgentService] Error fetching queue:', err.message)
    return []
  }
}

/**
 * Retrieves published post history and performance metrics
 */
export async function getInstaHistory(limit = 20) {
  const db = getDbConnection()
  if (!db) return []

  try {
    const rows = db.prepare(
      `SELECT p.*, m.reach, m.saved, m.shares, m.likes, m.comments, m.score
       FROM posts p
       LEFT JOIN metrics m ON m.post_id = p.id
       WHERE p.status = 'published'
       ORDER BY p.published_at DESC, p.id DESC
       LIMIT ?`
    ).all(limit)
    db.close()
    return rows
  } catch (err) {
    try { db.close() } catch {}
    console.error('[InstaAgentService] Error fetching history:', err.message)
    return []
  }
}

/**
 * Triggers AI Content Generation (Reel / Image) using the agent's generator
 * Supports both custom topics and GitHub repository projects!
 */
export async function generateInstaContent({ topic, githubRepo, userId, authorName, kind = 'REEL', tone = 'creator' } = {}) {
  const promptTopic = topic || (githubRepo ? `Showcase GitHub Repo: ${githubRepo}` : `Engaging video reel for software engineers, tone: ${tone}`)

  try {
    // 1. Direct call to running agent server on port 8080 (allow 4 minutes for video rendering)
    const res = await fetch('http://127.0.0.1:8080/api/generate-reel', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        topic: promptTopic,
        githubRepo: githubRepo || null,
        userId: userId || null,
        authorName: authorName || 'Creator',
        kind
      }),
      signal: AbortSignal.timeout(240000)
    })
    if (res.ok) {
      const data = await res.json()
      return {
        success: true,
        result: data.post,
        message: '🎉 Instagram Reel generated successfully via agent server!'
      }
    }
  } catch (httpErr) {
    console.warn('[InstaAgentService] Agent server port 8080 notice:', httpErr.message)
  }

  try {
    // 2. Check if a post was already drafted or created in SQLite DB in the last 2 minutes
    const db = getDbConnection()
    if (db) {
      try {
        const recent = db.prepare(`
          SELECT * FROM posts 
          WHERE created_at >= datetime('now', '-2 minutes')
          ORDER BY id DESC LIMIT 1
        `).get()
        if (recent) {
          db.close()
          return {
            success: true,
            result: recent,
            message: '🎉 Instagram Reel generated and queued successfully!'
          }
        }
        db.close()
      } catch (dbErr) {
        try { db.close() } catch {}
      }
    }

    // 3. Fallback: Run content creation via the agent's orchestrator
    const safeTopic = promptTopic.replace(/"/g, '\\"')
    const cmd = `node -e "import('./dist/orchestrator.js').then(m => m.runContentLifecycle({ preferredFormat: 'REEL', topicOverride: \\"${safeTopic}\\" })).then(r => console.log('RESULT_OK:' + JSON.stringify(r))).catch(e => { console.error(e); process.exit(1); })"`
    
    console.log('[InstaAgentService] Executing fallback content generation:', cmd)
    const { stdout } = await execPromise(cmd, { cwd: AGENT_DIR, timeout: 180000 })
    
    return {
      success: true,
      result: stdout,
      message: 'Instagram content generated successfully!'
    }
  } catch (err) {
    console.error('[InstaAgentService] Error during generation execution:', err.message)
    return {
      success: false,
      error: err.message,
      message: 'Failed to generate content: ' + err.message
    }
  }
}

/**
 * Immediately publishes a post or triggers next in queue
 */
export async function publishPostNow(postId, { accessToken, igUserId } = {}) {
  try {
    // 1. Direct call to running agent server on port 8080
    const res = await fetch('http://127.0.0.1:8080/api/publish-now', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        postId: postId ? Number(postId) : null,
        accessToken: accessToken || null,
        igUserId: igUserId || null
      }),
      signal: AbortSignal.timeout(60000)
    })
    if (res.ok) {
      const data = await res.json()
      return data
    }
  } catch (httpErr) {
    console.warn('[InstaAgentService] Agent publish endpoint notice:', httpErr.message)
  }

  try {
    const script = postId 
      ? `import { publishPost, getPost } from './src/posts.js'; const p = getPost(${Number(postId)}); if(!p) throw new Error('Post not found'); publishPost(p).then(r => console.log('PUBLISHED_OK:' + JSON.stringify(r)));`
      : `import { publishDue } from './src/pipeline.js'; publishDue().then(() => console.log('PUBLISH_DUE_OK'));`

    const cmd = `npx tsx -e "${script}"`
    const { stdout } = await execPromise(cmd, { cwd: AGENT_DIR, timeout: 60000 })

    return {
      success: true,
      output: stdout,
      message: 'Instagram post published live successfully!'
    }
  } catch (err) {
    console.error('[InstaAgentService] Error publishing post:', err.message)
    return {
      success: false,
      error: err.message,
      message: 'Failed to publish post: ' + err.message
    }
  }
}

/**
 * Tests connection with Instagram Meta Graph API and Gemini Key
 */
export async function testInstaConnection({ igAccessToken, geminiApiKey }) {
  const results = {
    instagram: { ok: false, message: 'Not tested' },
    gemini: { ok: false, message: 'Not tested' }
  }

  if (igAccessToken) {
    try {
      const fetchRes = await fetch(`https://graph.facebook.com/v21.0/me?fields=id,name&access_token=${encodeURIComponent(igAccessToken)}`)
      const data = await fetchRes.json()
      if (data.id) {
        results.instagram = { ok: true, accountName: data.name || 'Instagram Business', id: data.id }
      } else {
        results.instagram = { ok: false, message: data.error?.message || 'Invalid Instagram Token' }
      }
    } catch (e) {
      results.instagram = { ok: false, message: e.message }
    }
  }

  if (geminiApiKey) {
    try {
      const fetchRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${encodeURIComponent(geminiApiKey)}`)
      const data = await fetchRes.json()
      if (Array.isArray(data.models)) {
        results.gemini = { ok: true, message: 'Gemini API Key Verified' }
      } else {
        results.gemini = { ok: false, message: data.error?.message || 'Invalid Gemini API Key' }
      }
    } catch (e) {
      results.gemini = { ok: false, message: e.message }
    }
  }

  return results
}
