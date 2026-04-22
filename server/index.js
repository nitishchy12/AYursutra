const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const postRoutes = require('./routes/posts');
const herbRoutes = require('./routes/herbs');

const app = express();

// CORS — allow frontend origin
app.use(cors({
  origin: process.env.FRONTEND_URL || '*', 
  credentials: true,
}));

// Body parser
app.use(express.json({ limit: '10kb' }));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/herbs', herbRoutes);

// Middleware to check database connection status
app.use((req, res, next) => {
  if (mongoose.connection.readyState !== 1 && req.path.startsWith('/api')) {
    console.log(`⚠️ Request to ${req.path} blocked: Database state is ${mongoose.connection.readyState}`);
    return res.status(503).json({ 
      message: 'Database connection not established. Please check your MongoDB Atlas IP whitelist or connection string.' 
    });
  }
  next();
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 404 handler for unknown API routes
app.use('/api', (req, res) => {
  res.status(404).json({ message: `Route ${req.originalUrl} not found` });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(err.status || 500).json({
    message: err.message || 'Internal server error',
  });
});

// Connect to MongoDB
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/ayursutra';

mongoose.connect(MONGO_URI)
  .then(() => {
    console.log('✅ Connected to MongoDB');
  })
  .catch((err) => {
    console.error('❌ MongoDB connection error:', err.message);
    console.warn('⚠️ Server is running but features requiring database will fail.');
  });

// Start server independently of DB connection to avoid "Failed to fetch"
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📡 API endpoints at http://localhost:${PORT}/api`);
  console.log('💡 TIP: If you see "Failed to fetch" in the frontend, ensure this terminal stays open!');
  console.log('🔌 Health check: http://localhost:5000/api/health');
});
