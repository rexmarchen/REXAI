import jwt from 'jsonwebtoken'
import User from '../models/User.js'
import { catchAsync } from '../utils/catchAsync.js'
import AppError from '../utils/AppError.js'
import { JWT_SECRET, JWT_EXPIRE } from '../config/env.js'

const signToken = (id) => {
  return jwt.sign({ id }, JWT_SECRET, { expiresIn: JWT_EXPIRE })
}

export const register = catchAsync(async (req, res, next) => {
  const { name, email, password } = req.body

  const existingUser = await User.findOne({ email })
  if (existingUser) {
    return next(new AppError('User already exists', 400))
  }

  const user = await User.create({ name, email, password })

  const token = signToken(user._id)

  res.status(201).json({
    success: true,
    token,
    data: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role
    }
  })
})

export const login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body

  const user = await User.findOne({ email }).select('+password')
  if (!user || !(await user.comparePassword(password))) {
    return next(new AppError('Invalid email or password', 401))
  }

  const token = signToken(user._id)

  res.status(200).json({
    success: true,
    token,
    data: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role
    }
  })
})

export const getMe = catchAsync(async (req, res, next) => {
  const user = await User.findById(req.user.id)
  res.status(200).json({
    success: true,
    data: user
  })
})