import jwt from 'jsonwebtoken'
import User from '../models/User.js'
import AppError from '../utils/AppError.js'
import { catchAsync } from '../utils/catchAsync.js'
import { JWT_SECRET } from '../config/env.js'

export const protect = catchAsync(async (req, res, next) => {
  let token

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1]
  }

  if (!token) {
    return next(new AppError('You are not logged in. Please log in to access this resource.', 401))
  }

  const decoded = jwt.verify(token, JWT_SECRET)
  const user = await User.findById(decoded.id)

  if (!user) {
    return next(new AppError('The user belonging to this token no longer exists.', 401))
  }

  req.user = user
  next()
})

export const optionalProtect = catchAsync(async (req, res, next) => {
  let token

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1]
  }

  if (!token) {
    return next()
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET)
    const user = await User.findById(decoded.id)
    if (user) {
      req.user = user
    }
  } catch {
    // Ignore invalid/expired optional token and continue as guest.
  }

  next()
})
