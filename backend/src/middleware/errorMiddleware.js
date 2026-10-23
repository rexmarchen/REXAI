import logger from '../utils/logger.js'

export const errorHandler = (err, req, res, next) => {
  if (res.headersSent) {
    return next(err)
  }

  const isProduction = process.env.NODE_ENV === 'production'
  err.statusCode = err.statusCode || 500

  // Log error internally with stack trace and request correlation ID
  const reqId = req.id || req.headers['x-request-id'] || 'no-req-id'
  logger.error(
    `[${reqId}] ${err.statusCode} - ${err.message} - ${req.originalUrl} - ${req.method} - ${req.ip}${
      err.stack ? `\n${err.stack}` : ''
    }`
  )

  let safeMessage = err.message || 'Internal Server Error'

  if (err.code === 11000) {
    err.statusCode = 400
    safeMessage = 'A resource with this identifier already exists.'
  } else if (err.name === 'ValidationError') {
    err.statusCode = 400
    safeMessage = Object.values(err.errors || {}).map((val) => val.message).join(', ') || 'Validation error'
  } else if (err.name === 'JsonWebTokenError') {
    err.statusCode = 401
    safeMessage = 'Invalid authentication token. Please log in again.'
  } else if (err.name === 'TokenExpiredError') {
    err.statusCode = 401
    safeMessage = 'Your session has expired. Please log in again.'
  } else if (err.statusCode === 500 && isProduction) {
    // Conceal sensitive internal server / database errors in production
    safeMessage = 'An internal server error occurred. Please try again later.'
  }

  res.status(err.statusCode).json({
    success: false,
    requestId: reqId !== 'no-req-id' ? reqId : undefined,
    error: safeMessage,
    message: safeMessage,
    details: !isProduction && err.details ? err.details : undefined,
    stack: !isProduction ? err.stack : undefined
  })
}

export default errorHandler
