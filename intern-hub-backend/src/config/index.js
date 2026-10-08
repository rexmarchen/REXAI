require('dotenv').config();

module.exports = {
  // Server
  port: process.env.PORT || 5000,
  corsOrigin: process.env.CORS_ORIGIN || '*',

  // Adzuna API
  adzuna: {
    appId: process.env.ADZUNA_APP_ID,
    apiKey: process.env.ADZUNA_API_KEY,
    baseUrl: 'https://api.adzuna.com/v1/api/jobs',
    country: process.env.ADZUNA_COUNTRY || 'gb',
  },

  // Cache
  cache: {
    ttl: parseInt(process.env.CACHE_TTL, 10) || 3600,
  },

  // Rate limiting
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS, 10) || 15 * 60 * 1000,
    max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS, 10) || 100,
  },

  // Logging
  logLevel: process.env.LOG_LEVEL || 'info',
};