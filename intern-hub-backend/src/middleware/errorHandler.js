const logger = require('../utils/logger');

/**
 * Global error handler
 */
const errorHandler = (err, req, res, next) => {
  // Log the error
  logger.error(`Error: ${err.message}`, { stack: err.stack });

  // If the error has a status (from our service), use it; otherwise 500
  const status = err.status || 500;
  const message = err.message || 'Internal Server Error';

  res.status(status).json({
    error: message,
    ...(process.env.NODE_ENV === 'development' && { details: err.details }),
  });
};

module.exports = errorHandler;