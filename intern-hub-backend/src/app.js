
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const config = require('./config');
const rateLimiter = require('./config/rateLimit');
const internshipsRouter = require('./routes/internships');
const notFound = require('./middleware/notFound');
const errorHandler = require('./middleware/errorHandler');

const app = express();

// Security middleware
app.use(helmet());
app.use(cors({ origin: config.corsOrigin }));
app.use(express.json());

// Rate limiting
app.use(rateLimiter);

// Health check
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', timestamp: new Date().toISOString() });
});

// API routes
app.use('/api/internships', internshipsRouter);

// 404 handler
app.use(notFound);

// Global error handler
app.use(errorHandler);

module.exports = app;