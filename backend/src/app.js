import 'dotenv/config'
import crypto from 'crypto'
import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import rateLimit from 'express-rate-limit'
import mongoose from 'mongoose'
import fs from 'fs'
import path from 'path'
import compression from 'compression'
import cacheManager from './utils/cacheManager.js'
import { apiLimiter, authLimiter, userApiLimiter } from './lib/rateLimiter.js'
import { startLeaderElection, leaderOnly } from './lib/leader.js'
import { createRouter as createLinkedInAgentRouter } from './linkedin-agent/routes.js'
import { protect } from './middleware/authMiddleware.js'

import authRoutes from './routes/authRoutes.js'
import dominationRoutes from './routes/dominationRoutes.js'
import resumeRoutes from './routes/resumeRoutes.js'
import mlRoutes from './routes/mlRoutes.js'
import rexcodeRoutes from './routes/rexcodeRoutes.js'
import greenhouseRoutes from './routes/greenhouseRoutes.js'
import profileRoutes from './routes/profileRoutes.js'
import outreachRoutes from './routes/outreachRoutes.js'
import linkedinRoutes from './routes/linkedinRoutes.js'
import linkedinAutomationRoutes from './routes/linkedinAutomationRoutes.js'
import instaAutomationRoutes from './routes/instaAutomationRoutes.js'
import socialConnectionsRoutes from './routes/socialConnectionsRoutes.js'
import agentWebhookRoutes from './routes/agentWebhookRoutes.js'
import connectAuthRoutes from './routes/connectAuthRoutes.js'
import connectLinkedInOAuthRoutes from './routes/connectLinkedInOAuthRoutes.js'
import connectDashboardRoutes from './routes/connectDashboardRoutes.js'
import applicationRoutes from './routes/applicationRoutes.js'
import internshipRoutes, { adminInternshipRouter } from './routes/internshipRoutes.js'
import skillGapRoutes from './routes/skillGapRoutes.js'
import quizRoutes from './routes/quizRoutes.js'
import facultyRoutes from './routes/facultyRoutes.js'
import adminFacultyRoutes from './routes/adminFacultyRoutes.js'
import developerRoutes from './routes/developerRoutes.js'
import adminDeveloperRoutes from './routes/adminDeveloperRoutes.js'
import adminRoutes from './routes/adminRoutes.js'
import codeArenaRoutes from './routes/codeArenaRoutes.js'
import challengesRoutes from './routes/challengesRoutes.js'
import tutorRoutes from './routes/tutorRoutes.js'
import billingRoutes from './routes/billingRoutes.js'
import activityRoutes from './routes/activityRoutes.js'
import { loadProblemsFromDisk, syncProblemsToDatabase } from './services/problemService.js'
import { initInternshipQueue } from './services/internships/internshipQueue.js'
import { reconcileAllSubscriptions } from './services/expiryCleanupService.js'
import { errorHandler } from './middleware/errorMiddleware.js'
import { linkedinSessionMiddleware } from './middleware/sessionMiddleware.js'
import { sanitizeInputs } from './middleware/sanitizationMiddleware.js'
import { createSecureUploadsHandler, createSecureScreenshotsHandler } from './middleware/secureUploadMiddleware.js'
import { NODE_ENV, FRONTEND_URL } from './config/env.js'
import { startAutomationScheduler } from './services/automation/scheduler.js'
import { runMultiUserSocialScheduler } from './services/automation/multiUserSocialAutomationService.js'

const app = express()
app.set('trust proxy', 1)

// Disable X-Powered-By header to hinder fingerprinting
app.disable('x-powered-by')

// Request correlation ID tracking
app.use((req, res, next) => {
  req.id = req.headers['x-request-id'] || crypto.randomUUID()
  res.setHeader('X-Request-Id', req.id)
  next()
})

const localOriginRegex = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i
const allowedOrigins = new Set([
  'http://localhost:3000',
  'http://localhost:5173',
  'http://127.0.0.1:3000',
  'http://127.0.0.1:5173'
])

if (FRONTEND_URL) {
  try {
    allowedOrigins.add(new URL(FRONTEND_URL).origin)
  } catch {
    allowedOrigins.add(FRONTEND_URL)
  }
}

// 1. Comprehensive Security Headers with Helmet
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
      fontSrc: ["'self'", 'https://fonts.gstatic.com', 'data:'],
      imgSrc: ["'self'", 'data:', 'blob:', 'https:'],
      connectSrc: ["'self'", 'https:', 'http://127.0.0.1:*', 'http://localhost:*']
    }
  },
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  frameguard: { action: 'deny' },
  hidePoweredBy: true,
  hsts: { maxAge: 31536000, includeSubDomains: true },
  noSniff: true,
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' }
}))

// 2. Strict CORS Configuration
app.use(cors({
  origin: (origin, callback) => {
    if (!origin) {
      return callback(null, true)
    }

    if (allowedOrigins.has(origin)) {
      return callback(null, true)
    }

    if (NODE_ENV !== 'production' && localOriginRegex.test(origin)) {
      return callback(null, true)
    }

    return callback(new Error('Blocked by CORS policy'))
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Cache-Control', 'Pragma', 'Expires', 'X-Requested-With', 'Accept', 'Origin']
}))

// Async streaming compression middleware — never blocks the event loop
app.use(compression({
  threshold: 1024,
  filter: (req, res) => {
    if (req.headers['x-no-compression']) return false
    return compression.filter(req, res)
  }
}))

// 3. Request parsing with body size limits (preserves rawBody for webhook signature verification)
app.use(express.json({
  limit: '10mb',
  verify: (req, res, buf) => {
    req.rawBody = buf
  }
}))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

// 4. XSS & NoSQL Injection Sanitization
app.use(sanitizeInputs)

app.use(linkedinSessionMiddleware())

// Helper for dev rate-limit skipping
const isDevLoopback = (req) =>
  NODE_ENV === 'development' &&
  (req.ip === '127.0.0.1' || req.ip === '::1' || req.ip === '::ffff:127.0.0.1')

// 5. Rate limiters (Redis-backed across cluster workers with in-memory fallback)
// Per-user limit takes precedence; falls back to IP for unauthenticated requests.
app.use('/api', userApiLimiter)

// AI & LLM operations limiter — prevents token quota exhaustion attacks
const aiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 25,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'AI generation rate limit reached. Please wait a few minutes before trying again.' },
  skip: isDevLoopback
})

// Code execution sandbox limiter
const codeExecutionLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 15,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Code execution limit reached. Please wait a minute.' },
  skip: isDevLoopback
})

// Routes
app.use('/api/auth', authLimiter, authRoutes)
app.use('/api/profile', profileRoutes)
app.use('/api/domination', dominationRoutes)
app.use('/api/resume', resumeRoutes)
app.use('/api/ml', mlRoutes)
app.use('/api/rexcode', aiLimiter, rexcodeRoutes)
app.use('/api/jobs', greenhouseRoutes)
app.use('/api/outreach', outreachRoutes)
app.use('/api/linkedin', linkedinRoutes)
app.use('/api/linkedin-automation', linkedinAutomationRoutes)
app.use('/api/insta-automation', instaAutomationRoutes)
app.use('/api/social-connections', socialConnectionsRoutes)
app.use('/api/connections', socialConnectionsRoutes)
app.use('/api/agents', agentWebhookRoutes)
app.use('/api/applications', applicationRoutes)
app.use('/api/internships', internshipRoutes)
app.use('/api/skill-gap', skillGapRoutes)
app.use('/api/quizzes', quizRoutes)
app.use('/api/faculty', facultyRoutes)
app.use('/api/admin/faculty', adminFacultyRoutes)
app.use('/api/developer', developerRoutes)
app.use('/api/admin/developers', adminDeveloperRoutes)
app.use('/api/admin', adminRoutes)
app.use('/api/code-arena', codeExecutionLimiter, codeArenaRoutes)
app.use('/api/challenges', challengesRoutes)
app.use('/api/tutor', aiLimiter, tutorRoutes)
app.use('/api/activities', activityRoutes)
app.use('/api/admin/internships', adminInternshipRouter)
app.use('/api/intern-hub/internships', internshipRoutes)
app.use('/api/intern-hub', internshipRoutes)
app.use('/api/billing', billingRoutes)
app.use('/api/webhooks/billing', billingRoutes)
app.use('/connect', authLimiter, connectAuthRoutes)
app.use('/connect', connectLinkedInOAuthRoutes)
app.use('/connect', connectDashboardRoutes)

// LinkedIn Agent dedicated autonomous scheduler & routes
app.use('/api/li-agent', createLinkedInAgentRouter({ requireAuth: protect }))

// Leader election: ensures schedulers execute on only ONE worker in PM2 cluster
startLeaderElection()
startAutomationScheduler()
initInternshipQueue()
setInterval(leaderOnly(() => {
  runMultiUserSocialScheduler().catch((e) => console.warn('[MultiUserSocialScheduler] Loop notice:', e.message))
}), 60 * 1000)

setInterval(leaderOnly(() => {
  reconcileAllSubscriptions().catch((e) => console.warn('[SubscriptionReconciliation] Loop notice:', e.message))
}), 10 * 60 * 1000)

// Initialize Code Arena problems
loadProblemsFromDisk()
syncProblemsToDatabase().catch((e) => console.warn('[CodeArena] Initial sync notice:', e.message))

// Ensure upload directories exist
const uploadsDir = fs.existsSync(path.resolve('uploads'))
  ? path.resolve('uploads')
  : path.resolve('..', 'uploads')
const emailsDir = path.join(uploadsDir, 'emails')
const candidateScreenshotDirs = [
  path.resolve('..', 'agents', 'apply-flow-agent', 'screenshots'),
  path.resolve('agents', 'apply-flow-agent', 'screenshots')
]
const screenshotsDir = candidateScreenshotDirs.find((d) => fs.existsSync(d) && fs.readdirSync(d).length > 0) || candidateScreenshotDirs[0]

fs.mkdirSync(uploadsDir, { recursive: true })
fs.mkdirSync(emailsDir, { recursive: true })
fs.mkdirSync(screenshotsDir, { recursive: true })

// Secure file upload delivery: images served safely, sensitive resumes require authenticated ownership
app.use('/uploads', createSecureUploadsHandler(uploadsDir))
app.use('/screenshots', createSecureScreenshotsHandler(screenshotsDir))

// Health & Reliability Monitoring endpoints
const connectionStates = {
  0: 'disconnected',
  1: 'connected',
  2: 'connecting',
  3: 'disconnecting'
}

// Liveness probe (checks process responsiveness)
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    uptimeSeconds: Math.round(process.uptime()),
    timestamp: new Date().toISOString()
  })
})

// Readiness probe (verifies database connectivity and metrics)
const handleReadinessCheck = async (req, res) => {
  const isDbConnected = mongoose.connection.readyState === 1
  let dbLatencyMs = null

  if (isDbConnected && mongoose.connection.db) {
    try {
      const start = Date.now()
      await mongoose.connection.db.admin().ping()
      dbLatencyMs = Date.now() - start
    } catch (_) {
      dbLatencyMs = -1
    }
  }

  const mem = process.memoryUsage()
  const memUsageMb = {
    rss: (mem.rss / 1024 / 1024).toFixed(1),
    heapUsed: (mem.heapUsed / 1024 / 1024).toFixed(1),
    heapTotal: (mem.heapTotal / 1024 / 1024).toFixed(1)
  }

  const statusCode = isDbConnected ? 200 : 503
  res.status(statusCode).json({
    status: isDbConnected ? 'ready' : 'degraded',
    environment: NODE_ENV,
    uptimeSeconds: Math.round(process.uptime()),
    database: {
      state: connectionStates[mongoose.connection.readyState] || 'unknown',
      pingMs: dbLatencyMs
    },
    memoryMb: memUsageMb,
    cache: cacheManager.getStats()
  })
}

app.get('/ready', handleReadinessCheck)
app.get('/api/health', handleReadinessCheck)

// 404 handler
app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' })
})

// Error handling middleware (must be last)
app.use(errorHandler)

export default app
