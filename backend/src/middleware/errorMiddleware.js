import logger from '../utils/logger.js'

export const errorHandler = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500
  err.message = err.message || 'Internal Server Error'

  // Log error
  logger.error(`${err.statusCode} - ${err.message} - ${req.originalUrl} - ${req.method} - ${req.ip}`)

  // Mongoose duplicate key error
  if (err.code === 11000) {
    err.statusCode = 400
    err.message = 'Duplicate field value entered'
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    err.statusCode = 400
    err.message = Object.values(err.errors).map(val => val.message).join(', ')
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    err.statusCode = 401
    err.message = 'Invalid token. Please log in again.'
  }

  if (err.name === 'TokenExpiredError') {
    err.statusCode = 401
    err.message = 'Your token has expired. Please log in again.'
  }

  res.status(err.statusCode).json({
    success: false,
    message: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
  })
}