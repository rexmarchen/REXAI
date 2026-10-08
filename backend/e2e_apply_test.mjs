/**
 * End-to-end test: upload resume → find jobs → apply to matched jobs
 * Run: node e2e_apply_test.mjs
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { DatabaseSync } from 'node:sqlite'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const BASE_URL = 'http://localhost:5000'

// ─── helpers ───────────────────────────────────────────────────────────────
const log  = (...a) => console.log('[E2E]', ...a)
const fail = (...a) => { console.error('[E2E ERROR]', ...a); process.exit(1) }

async function apiJSON(method, path, body, token) {
  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    },
    body: body ? JSON.stringify(body) : undefined
  })
  const json = await res.json().catch(() => ({}))
  if (!res.ok) {
    console.error(`  HTTP ${res.status} from ${method} ${path}:`, JSON.stringify(json).slice(0, 300))
    return null
  }
  return json
}

async function uploadResume(token, resumePath) {
  const form = new FormData()
  form.append('resume', new Blob([fs.readFileSync(resumePath)], { type: 'application/pdf' }), 'resume.pdf')

  const res = await fetch(`${BASE_URL}/api/domination/find-jobs`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: form
  })
  const json = await res.json().catch(() => ({}))
  if (!res.ok) {
    console.error(`  HTTP ${res.status} from upload:`, JSON.stringify(json).slice(0, 500))
    return null
  }
  return json
}

async function applyJobs(token, jobs, resumeData, userEmail) {
  const res = await fetch(`${BASE_URL}/api/domination/apply-all`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({ jobs, resumeData, userEmail })
  })
  const json = await res.json().catch(() => ({}))
  if (!res.ok) {
    console.error(`  HTTP ${res.status} from apply-all:`, JSON.stringify(json).slice(0, 500))
    return null
  }
  return json
}

function pollBatchStatus(batchId, maxWaitMs = 90000) {
  const db = new DatabaseSync(path.join(__dirname, 'data', 'rexion.sqlite'))
  const start = Date.now()
  return new Promise((resolve) => {
    const check = () => {
      const batch = db.prepare('SELECT status FROM application_batches WHERE id = ?').get(batchId)
      const apps  = db.prepare(
        'SELECT id, job_title, company, status, error_message, resolved_url FROM applications WHERE batch_id = ?'
      ).all(batchId)

      const done = ['completed','failed','cancelled'].includes(batch?.status) ||
                   apps.every(a => !['queued','applying','processing'].includes(a.status))

      if (done || Date.now() - start > maxWaitMs) {
        resolve({ batch, apps })
      } else {
        process.stdout.write('.')
        setTimeout(check, 3000)
      }
    }
    check()
  })
}

// ─── MAIN ──────────────────────────────────────────────────────────────────
log('=== RexionAI End-to-End Apply Test ===\n')

// 1. Login
log('Step 1: Logging in...')
const loginData = await apiJSON('POST', '/api/auth/login', {
  email: 'anshuar9065@gmail.com',
  password: 'Anshu90#@'
})
if (!loginData?.token) fail('Login failed. Check credentials or server.')
const token = loginData.token
log(`  ✓ Logged in as ${loginData.user?.email}, plan=${loginData.user?.plan}, role=${loginData.user?.role}`)

// 2. Create resume file
log('\nStep 2: Preparing resume...')
const resumeDir  = path.join(__dirname, 'uploads')
const resumePath = path.join(resumeDir, 'e2e-test-resume.pdf')
if (!fs.existsSync(resumeDir)) fs.mkdirSync(resumeDir, { recursive: true })
// Write plain text posing as a PDF (good enough for text extraction in the pipeline)
fs.writeFileSync(resumePath, `John Doe
Software Engineer
john.doe@example.com | +1-555-0100

SKILLS
JavaScript, TypeScript, React, Node.js, Python, REST APIs, MongoDB, PostgreSQL, AWS, Docker

EXPERIENCE
Senior Software Engineer - GitHub (2021-2024)
  Built scalable CI/CD pipelines, React dashboards, Node.js microservices

Software Developer - Stripe (2019-2021)
  Payment integration APIs, TypeScript, PostgreSQL

EDUCATION
B.S. Computer Science - MIT (2019)
`)
log(`  ✓ Resume written to ${resumePath}`)

// 3. Upload resume and find jobs
log('\nStep 3: Uploading resume and finding matching jobs...')
const matchResult = await uploadResume(token, resumePath)
if (!matchResult) fail('findDominationMatches API call failed.')

log(`  ✓ Found ${matchResult.jobs?.length ?? 0} matching jobs`)
if (!matchResult.jobs?.length) fail('No jobs returned from match step.')

// Show found jobs
console.log('\n  ┌─ MATCHED JOBS ─────────────────────────────────────────────────────────')
matchResult.jobs.forEach((j, i) => {
  const atsIcon = j.posting_url?.includes('greenhouse') ? '🌱 GH'
    : j.posting_url?.includes('lever.co') ? '⚙️  LV'
    : '🔗 ?'
  console.log(`  │ #${i+1} [${atsIcon}] "${j.title}" at ${j.company} — score:${j.score} — ${j.source || 'adzuna'}`)
  console.log(`  │     URL: ${j.posting_url}`)
})
console.log('  └───────────────────────────────────────────────────────────────────────\n')

// 4. Trigger apply-all
log('Step 4: Triggering apply-all batch...')
const applyResult = await applyJobs(
  token,
  matchResult.jobs,
  matchResult.resume_data,
  loginData.user?.email
)
if (!applyResult?.batchId) fail('apply-all API call failed or no batchId returned.')
const batchId = applyResult.batchId
log(`  ✓ Batch #${batchId} queued (${applyResult.appliedCount} applications)`)

// 5. Poll until batch completes
log(`\nStep 5: Waiting for Batch #${batchId} to complete (max 90s)`)
process.stdout.write('  ')
const { batch, apps } = await pollBatchStatus(batchId, 90000)
console.log('\n')

// 6. Print results
log('=== BATCH RESULTS ===')
log(`  Batch Status: ${batch?.status?.toUpperCase() ?? 'UNKNOWN'}`)
console.log()

const counts = { applied: 0, failed: 0, manual_required: 0, expired: 0, other: 0 }
apps.forEach(app => {
  const s = app.status
  counts[s in counts ? s : 'other']++
  const icon = s === 'applied' ? '✅' : s === 'manual_required' ? '🟡' : s === 'expired' ? '⚫' : '❌'
  console.log(`  ${icon} [ID ${app.id}] "${app.job_title}" at ${app.company}`)
  console.log(`       Status: ${s}`)
  if (app.resolved_url) console.log(`       Resolved URL: ${app.resolved_url}`)
  if (app.error_message) {
    // Only show the last part of the audit log (the reason)
    const reason = app.error_message.match(/\((.+)\)$/)?.[1] || app.error_message
    console.log(`       Reason: ${reason}`)
  }
  console.log()
})

console.log('  ─── Summary ──────────────────')
console.log(`  ✅ Applied:          ${counts.applied}`)
console.log(`  🟡 Manual Required:  ${counts.manual_required}`)
console.log(`  ⚫ Expired:          ${counts.expired}`)
console.log(`  ❌ Failed:           ${counts.failed}`)
if (counts.other) console.log(`  ⚠️  Other:           ${counts.other}`)
console.log()

if (counts.applied > 0) {
  log('🎉 SUCCESS — at least one job was auto-applied!')
} else if (counts.manual_required === apps.length) {
  log('⚠️  All jobs were manual_required (Adzuna non-ATS redirects). Run again after ATS sourcing is merged.')
} else {
  log('⚠️  No applied jobs yet. Check failure reasons above.')
}

// Cleanup
fs.unlinkSync(resumePath)
