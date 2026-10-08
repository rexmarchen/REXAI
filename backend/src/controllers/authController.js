import jwt from 'jsonwebtoken'
import mongoose from 'mongoose'
import { OAuth2Client } from 'google-auth-library'
import User from '../models/User.js'
import AppError from '../utils/AppError.js'
import { JWT_SECRET, JWT_EXPIRE, GOOGLE_CLIENT_ID, MONGO_URI } from '../config/env.js'

const signToken = (id) => {
  return jwt.sign({ id }, JWT_SECRET, { expiresIn: JWT_EXPIRE })
}

const googleClient = GOOGLE_CLIENT_ID ? new OAuth2Client(GOOGLE_CLIENT_ID) : null

const ensureDatabaseConnection = async () => {
  if (mongoose.connection.readyState === 1) {
    return null
  }

  const mongoUri =
    MONGO_URI ||
    process.env.MONGO_URI ||
    process.env.MONGODB_URI ||
    process.env.DATABASE_URL ||
    'mongodb+srv://anshuar9065_db_user:Anshu_90-@cluster0.ytzioe4.mongodb.net/rexion?appName=Cluster0'

  if (!mongoUri) {
    return new AppError('Database configuration missing on server.', 500)
  }

  // If disconnected or in error state, trigger connection
  if (mongoose.connection.readyState === 0 || mongoose.connection.readyState === 3) {
    try {
      console.log('[Auth] Attempting on-demand MongoDB connection...')
      await mongoose.connect(mongoUri, {
        serverSelectionTimeoutMS: 15000,
        socketTimeoutMS: 45000
      })
      if (mongoose.connection.readyState === 1) {
        return null
      }
    } catch (err) {
      console.error('[Auth] MongoDB connection error:', err.message)
    }
  }

  // If currently connecting, wait up to 15 seconds for TLS/replica set handshake
  if (mongoose.connection.readyState === 2) {
    for (let i = 0; i < 75; i++) {
      await new Promise((r) => setTimeout(r, 200))
      if (mongoose.connection.readyState === 1) return null
    }
  }

  // Quick check if ready now
  if (mongoose.connection.readyState === 1) {
    return null
  }

  // Final retry if still disconnected
  if (mongoose.connection.readyState === 0 || mongoose.connection.readyState === 3) {
    try {
      await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 10000 })
      if (mongoose.connection.readyState === 1) return null
    } catch (err) {
      console.error('[Auth] Final retry MongoDB connection error:', err.message)
    }
  }

  if (mongoose.connection.readyState === 1) {
    return null
  }

  return new AppError(
    'Authentication service is temporarily unavailable. Please try again shortly.',
    503
  )
}

const buildUserPayload = (user) => ({
  id: String(user._id),
  fullName: user.name,
  email: user.email,
  role: user.role,
  plan: user.role === 'admin' ? 'elite' : (user.plan || 'free')
})

const isVerifiedGoogleEmail = (value) => value === true || value === 'true'

const buildFallbackName = (email) => {
  const localPart = String(email || '').split('@')[0]
  const humanized = localPart.replace(/[._-]+/g, ' ').trim()

  if (!humanized) {
    return 'Google User'
  }

  return humanized.replace(/\b\w/g, (character) => character.toUpperCase())
}

const verifyGoogleCredential = async (credential) => {
  if (!googleClient || !GOOGLE_CLIENT_ID) {
    throw new AppError('Google sign-in is not configured on the server.', 503)
  }

  try {
    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: GOOGLE_CLIENT_ID
    })

    return ticket.getPayload()
  } catch {
    throw new AppError('Invalid or expired Google credential.', 401)
  }
}

const applyGoogleProfile = (user, profile) => {
  user.authProviders = user.authProviders || {}
  user.authProviders.google = {
    sub: profile.sub,
    email: profile.email,
    picture: profile.picture
  }

  if (!user.name && profile.name) {
    user.name = profile.name
  }

  return user
}

export const register = async (req, res, next) => {
  try {
    const databaseError = await ensureDatabaseConnection()
    if (databaseError) {
      return next(databaseError)
    }

    const name = String(req.body.fullName || req.body.name || '').trim()
    const email = String(req.body.email || '').trim().toLowerCase()
    const password = String(req.body.password || '')

    if (!name || !email || !password) {
      return next(new AppError('fullName, email and password are required.', 400))
    }

    const existingUser = await User.findOne({ email })
    if (existingUser) {
      return next(new AppError('An account with this email already exists.', 409))
    }

    const user = await User.create({ name, email, password })
    const token = signToken(user._id)

    return res.status(201).json({
      message: 'Account created successfully.',
      token,
      user: buildUserPayload(user)
    })
  } catch (error) {
    return next(error)
  }
}

export const login = async (req, res, next) => {
  try {
    const databaseError = await ensureDatabaseConnection()
    if (databaseError) {
      return next(databaseError)
    }

    const email = String(req.body.email || '').trim().toLowerCase()
    const password = String(req.body.password || '')

    if (!email || !password) {
      return next(new AppError('Please provide both email and password.', 400))
    }

    const user = await User.findOne({ email }).select('+password')
    if (!user) {
      return next(new AppError('Invalid email or password.', 401))
    }

    if (!user.password && user.authProviders?.google?.sub) {
      return next(new AppError('This account uses Google sign-in. Continue with Google.', 401))
    }

    if (!user.password) {
      return next(new AppError('Invalid email or password.', 401))
    }

    const isMatch = await user.comparePassword(password)
    if (!isMatch) {
      return next(new AppError('Invalid email or password.', 401))
    }

    const token = signToken(user._id)

    return res.status(200).json({
      message: 'Login successful.',
      token,
      user: buildUserPayload(user)
    })
  } catch (error) {
    return next(error)
  }
}

export const googleAuth = async (req, res, next) => {
  try {
    const databaseError = await ensureDatabaseConnection()
    if (databaseError) {
      return next(databaseError)
    }

    const credential = String(req.body.credential || '').trim()
    const payload = await verifyGoogleCredential(credential)
    const email = String(payload?.email || '').trim().toLowerCase()
    const sub = String(payload?.sub || '').trim()

    if (!sub || !email) {
      return next(new AppError('Google sign-in did not return a valid account.', 401))
    }

    if (!isVerifiedGoogleEmail(payload?.email_verified)) {
      return next(new AppError('Google account email must be verified to continue.', 401))
    }

    const googleProfile = {
      sub,
      email,
      name: String(payload?.name || '').trim() || buildFallbackName(email),
      picture: String(payload?.picture || '').trim()
    }

    let user = await User.findOne({ 'authProviders.google.sub': googleProfile.sub })
    let message = 'Google sign-in successful.'
    let statusCode = 200

    if (!user) {
      user = await User.findOne({ email: googleProfile.email })

      if (user) {
        message = 'Google account linked. Login successful.'
      } else {
        user = new User({
          name: googleProfile.name,
          email: googleProfile.email
        })
        message = 'Account created successfully with Google.'
        statusCode = 201
      }
    }

    applyGoogleProfile(user, googleProfile)
    await user.save()

    const token = signToken(user._id)

    return res.status(statusCode).json({
      message,
      token,
      user: buildUserPayload(user)
    })
  } catch (error) {
    return next(error)
  }
}

export const getMe = async (req, res, next) => {
  try {
    const databaseError = await ensureDatabaseConnection()
    if (databaseError) {
      return next(databaseError)
    }

    const user = await User.findById(req.user.id)

    return res.status(200).json({
      success: true,
      user: user
        ? {
            ...buildUserPayload(user),
            createdAt: user.createdAt,
            updatedAt: user.updatedAt
          }
        : null,
      data: user
        ? {
            ...buildUserPayload(user),
            createdAt: user.createdAt,
            updatedAt: user.updatedAt
          }
        : null
    })
  } catch (error) {
    return next(error)
  }
}
