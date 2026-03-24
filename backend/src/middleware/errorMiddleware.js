import logger from '../utils/logger.js'

export const errorHandler = (err, req, res, next) => {
  if (res.headersSent) {
    return next(err)
  }

  err.statusCode = err.statusCode || 500
  err.message = err.message || 'Internal Server Error'

  console.error(err.message)
  logger.error(`${err.statusCode} - ${err.message} - ${req.originalUrl} - ${req.method} - ${req.ip}`)

  if (err.code === 11000) {
    err.statusCode = 400
    err.message = 'Duplicate field value entered'
  }

  if (err.name === 'ValidationError') {
    err.statusCode = 400
    err.message = Object.values(err.errors).map(val => val.message).join(', ')
  }

  if (err.name === 'JsonWebTokenError') {
    err.statusCode = 401
    err.message = 'Invalid token. Please log in again.'
  }

  if (err.name === 'TokenExpiredError') {
    err.statusCode = 401
    err.message = 'Your token has expired. Please log in again.'
  }

  res.status(err.statusCode).json({
    error: err.message,
    success: false,
    message: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
  })
}
