import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import rateLimit from 'express-rate-limit'
import mongoose from 'mongoose'
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
import connectAuthRoutes from './routes/connectAuthRoutes.js'
import connectLinkedInOAuthRoutes from './routes/connectLinkedInOAuthRoutes.js'
import connectDashboardRoutes from './routes/connectDashboardRoutes.js'
import applicationRoutes from './routes/applicationRoutes.js'
import internshipRoutes, { adminInternshipRouter } from './routes/internshipRoutes.js'
import skillGapRoutes from './routes/skillGapRoutes.js'
import quizRoutes from './routes/quizRoutes.js'
import codeArenaRoutes from './routes/codeArenaRoutes.js'
import challengesRoutes from './routes/challengesRoutes.js'
import tutorRoutes from './routes/tutorRoutes.js'
import { loadProblemsFromDisk, syncProblemsToDatabase } from './services/problemService.js'
import { initInternshipQueue } from './services/internships/internshipQueue.js'
import { errorHandler } from './middleware/errorMiddleware.js'
import { linkedinSessionMiddleware } from './middleware/sessionMiddleware.js'
import { NODE_ENV } from './config/env.js'
import { startAutomationScheduler } from './services/automation/scheduler.js'
import { runMultiUserSocialScheduler } from './services/automation/multiUserSocialAutomationService.js'

const app = express()
const localOriginRegex = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i
const allowedOrigins = new Set([
  'http://localhost:3000',
  'http://localhost:5173',
  'http://127.0.0.1:3000',
  'http://127.0.0.1:5173'
])

// Security middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' }
}))
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

    return callback(new Error('Not allowed by CORS'))
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Cache-Control', 'Pragma', 'Expires', 'X-Requested-With', 'Accept', 'Origin']
}))
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true }))
app.use(linkedinSessionMiddleware())

// Global API rate limiter — generous limit for development/internal use
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,   // 15-minute window
  max: 500,                    // 500 requests per window per IP
  standardHeaders: true,       // Return rate limit info in `RateLimit-*` headers
  legacyHeaders: false,
  message: { error: 'Too many requests. Please wait a moment and try again.' },
  skip: (req) => req.ip === '127.0.0.1' || req.ip === '::1' || req.ip === '::ffff:127.0.0.1'
})
app.use('/api', limiter)

// Stricter limiter on auth routes only — prevents brute-force attacks
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,   // 15-minute window
  max: 30,                     // 30 login attempts per 15 min per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many login attempts. Please wait 15 minutes before trying again.' },
  skip: (req) => req.ip === '127.0.0.1' || req.ip === '::1' || req.ip === '::ffff:127.0.0.1'
})

// Routes
app.use('/api/auth', authLimiter, authRoutes)
app.use('/api/profile', profileRoutes)
app.use('/api/domination', dominationRoutes)
app.use('/api/resume', resumeRoutes)
app.use('/api/ml', mlRoutes)
app.use('/api/rexcode', rexcodeRoutes)
app.use('/api/jobs', greenhouseRoutes)
app.use('/api/outreach', outreachRoutes)
app.use('/api/linkedin', linkedinRoutes)
app.use('/api/linkedin-automation', linkedinAutomationRoutes)
app.use('/api/insta-automation', instaAutomationRoutes)
app.use('/api/applications', applicationRoutes)
app.use('/api/internships', internshipRoutes)
app.use('/api/skill-gap', skillGapRoutes)
app.use('/api/quizzes', quizRoutes)
app.use('/api/code-arena', codeArenaRoutes)
app.use('/api/challenges', challengesRoutes)
app.use('/api/tutor', tutorRoutes)
app.use('/api/admin/internships', adminInternshipRouter)
app.use('/api/intern-hub/internships', internshipRoutes)
app.use('/api/intern-hub', internshipRoutes)
app.use('/connect', authLimiter, connectAuthRoutes)
app.use('/connect', connectLinkedInOAuthRoutes)
app.use('/connect', connectDashboardRoutes)

startAutomationScheduler()
initInternshipQueue()
setInterval(() => {
  runMultiUserSocialScheduler().catch((e) => console.warn('[MultiUserSocialScheduler] Loop notice:', e.message))
}, 60 * 1000)

// Initialize Code Arena problems
loadProblemsFromDisk()
syncProblemsToDatabase().catch((e) => console.warn('[CodeArena] Initial sync notice:', e.message))

// Ensure upload directories exist
import fs from 'fs'
import path from 'path'
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

app.use('/uploads', express.static(uploadsDir, {
  setHeaders: (res) => {
    res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin')
    res.setHeader('Access-Control-Allow-Origin', '*')
  }
}))
app.use('/screenshots', express.static(screenshotsDir, {
  setHeaders: (res) => {
    res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin')
    res.setHeader('Access-Control-Allow-Origin', '*')
  }
}))

// Health check endpoints
const handleHealthCheck = (req, res) => {
  const connectionStates = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting'
  }

  res.status(200).json({
    status: 'ok',
    environment: NODE_ENV,
    database: connectionStates[mongoose.connection.readyState] || 'unknown'
  })
}

app.get('/health', handleHealthCheck)
app.get('/api/health', handleHealthCheck)

// 404 handler
app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' })
})

// Error handling middleware (must be last)
app.use(errorHandler)

export default app
