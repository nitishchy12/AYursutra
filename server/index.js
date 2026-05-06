const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const mongoSanitize = require('express-mongo-sanitize');
require('dotenv').config();

const rateLimiter = require('./middleware/rateLimit');
const { errorHandler } = require('./middleware/errorHandler');
const { startNotificationJobs } = require('./services/cronService');

const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const postRoutes = require('./routes/postRoutes');
const herbRoutes = require('./routes/herbRoutes');
const centerRoutes = require('./routes/centerRoutes');
const appointmentRoutes = require('./routes/appointmentRoutes');
const patientRoutes = require('./routes/patients');
const therapyRoutes = require('./routes/therapies');
const notificationRoutes = require('./routes/notifications');
const mlRoutes = require('./routes/ml');
const feedbackRoutes = require('./routes/feedback');
const advisorRoutes = require('./routes/advisor');
const adminRoutes = require('./routes/admin');
const { autoSeed } = require('./scripts/seedAll');
const { configureMongoDns } = require('./config/mongoDns');

const app = express();
app.set('trust proxy', 1);

const allowedOrigins = (process.env.CLIENT_URL || process.env.FRONTEND_URL || 'http://localhost:5173')
  .split(',')
  .map((origin) => origin.trim());

function sanitizeMongoInput(req, res, next) {
  if (req.body) mongoSanitize.sanitize(req.body);
  if (req.params) mongoSanitize.sanitize(req.params);
  if (req.headers) mongoSanitize.sanitize(req.headers);

  const sanitizedQuery = mongoSanitize.sanitize({ ...req.query });
  Object.defineProperty(req, 'query', {
    value: sanitizedQuery,
    configurable: true,
    enumerable: true,
    writable: true,
  });

  next();
}

app.use(helmet());
app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.includes(origin) || allowedOrigins.includes('*')) return callback(null, true);
    return callback(new Error('CORS origin not allowed'));
  },
  credentials: true,
}));
app.use(express.json({ limit: '1mb' }));
app.use(cookieParser());
app.use(sanitizeMongoInput);
app.use('/api', rateLimiter);

app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'AyurSutra API healthy', data: { status: 'ok', timestamp: new Date().toISOString() } });
});

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/herbs', herbRoutes);
app.use('/api/centers', centerRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/patients', patientRoutes);
app.use('/api/therapies', therapyRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/ml', mlRoutes);
app.use('/api/feedback', feedbackRoutes);
app.use('/api/advisor', advisorRoutes);
app.use('/api/admin', adminRoutes);

app.use('/api', (req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.originalUrl} not found`, code: 404, data: null });
});
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI || process.env.MONGO_URI || 'mongodb://localhost:27017/ayursutra';

configureMongoDns(MONGODB_URI);
mongoose.connect(MONGODB_URI)
  .then(async () => {
    console.log('Connected to MongoDB');
    await autoSeed();
    startNotificationJobs();
  })
  .catch((err) => {
    console.error('MongoDB connection error:', err.message);
    console.warn('Server is running, but database-backed features require MongoDB.');
  });

app.listen(PORT, '0.0.0.0', () => {
  console.log(`AyurSutra API running on http://localhost:${PORT}`);
});
