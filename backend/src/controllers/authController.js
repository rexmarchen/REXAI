import jwt from 'jsonwebtoken'
import mongoose from 'mongoose'
import User from '../models/User.js'
import AppError from '../utils/AppError.js'
import { JWT_SECRET, JWT_EXPIRE } from '../config/env.js'

const signToken = (id) => {
  return jwt.sign({ id }, JWT_SECRET, { expiresIn: JWT_EXPIRE })
}

const getDatabaseConnectionError = () => {
  if (mongoose.connection.readyState === 1) {
    return null
  }

  return new AppError(
    'MongoDB is not connected. If you need the Atlas-backed auth server, check Atlas Network Access, cluster status, outbound TCP 27017, and DB credentials. Otherwise use the default SQLite backend with npm run dev.',
    503
  )
}

const buildUserPayload = (user) => ({
  id: String(user._id),
  fullName: user.name,
  email: user.email,
  role: user.role
})

export const register = async (req, res, next) => {
  try {
    const databaseError = getDatabaseConnectionError()
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
    const databaseError = getDatabaseConnectionError()
    if (databaseError) {
      return next(databaseError)
    }

    const email = String(req.body.email || '').trim().toLowerCase()
    const password = String(req.body.password || '')

    const user = await User.findOne({ email }).select('+password')
    if (!user || !(await user.comparePassword(password))) {
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

export const getMe = async (req, res, next) => {
  try {
    const databaseError = getDatabaseConnectionError()
    if (databaseError) {
      return next(databaseError)
    }

    const user = await User.findById(req.user.id)

    return res.status(200).json({
      success: true,
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
