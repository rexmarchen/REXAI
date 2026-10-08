import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import applyFlowRouter from './routes/applyFlow.js';

// Load environment variables from .env
dotenv.config();
import './telemetry.js';

const app = express();
const PORT = process.env.PORT || 3000;

// Apply production security headers
app.use(helmet());

// Do not expose resume and application endpoints to arbitrary browser origins.
const allowedOrigins = (process.env.ALLOWED_ORIGINS || 'http://localhost:3001,http://localhost:3000')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);
app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
    return callback(new Error('Origin is not allowed by CORS policy'));
  },
  methods: ['GET', 'POST'],
}));

// Configure rate limiter to prevent abuse on AI / Puppeteer endpoints
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per window
  standardHeaders: true, // Return standard rate limit info headers
  legacyHeaders: false, // Disable the X-RateLimit-* headers
  message: {
    success: false,
    error: 'Too Many Requests',
    message: 'Rate limit exceeded. Please try again in a few minutes.'
  }
});

// Apply rate limiter to all API endpoints
app.use('/api', apiLimiter);

// Body parsing middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve a basic homepage / health check
app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Rexion AI Apply-Flow API is up and running.',
    endpoints: {
      health: 'GET /health',
      applyFlow: 'POST /api/apply-flow'
    }
  });
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'UP',
    timestamp: new Date().toISOString()
  });
});

// Mount routes
app.use('/api', applyFlowRouter);

// Global 404 Route handler
app.use((req, res, next) => {
  res.status(404).json({
    success: false,
    error: 'Not Found',
    message: `Cannot ${req.method} ${req.originalUrl}`
  });
});

// Global Error Handler Middleware
app.use((err, req, res, next) => {
  console.error('Unhandled Server Error:', err);
  res.status(500).json({
    success: false,
    error: 'Internal Server Error',
    message: err.message || 'An unexpected error occurred on the server.'
  });
});

// Start listening
app.listen(PORT, () => {
  console.log(`==================================================`);
  console.log(`🚀 Rexion AI Apply-Flow API running on port ${PORT}`);
  console.log(`👉 Health Check: http://localhost:${PORT}/health`);
  console.log(`👉 POST Endpoint: http://localhost:${PORT}/api/apply-flow`);
  console.log(`==================================================`);
});
