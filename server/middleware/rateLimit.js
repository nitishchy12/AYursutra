const rateLimit = require('express-rate-limit');

const isProduction = process.env.NODE_ENV === 'production';

module.exports = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: Number(process.env.RATE_LIMIT_MAX || (isProduction ? 600 : 1000)),
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => req.method === 'OPTIONS' || req.path === '/health',
  message: { success: false, message: 'Too many requests. Please try again later.', code: 429, data: null },
});
