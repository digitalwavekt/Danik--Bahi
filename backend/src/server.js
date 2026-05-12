import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import path from 'path';
import routes from './routes/index.js';
import { connectDB } from './config/db.js';

dotenv.config();
console.log('JWT loaded:', !!process.env.JWT_SECRET);

const app = express();
const PORT = process.env.PORT || 4000;

app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.set('trust proxy', 1);

const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',').map((o) => o.trim()).filter(Boolean) || [];
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
    return callback(new Error(`CORS blocked: ${origin}`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(compression());
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

app.use(rateLimit({
  windowMs: Number(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
  max: Number(process.env.RATE_LIMIT_MAX) || 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later' },
}));

const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: Number(process.env.AUTH_RATE_LIMIT_MAX) || 10, message: { error: 'Too many login attempts, please try again in 15 minutes' } });
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/refresh', authLimiter);

app.use('/api', routes);
app.get('/health', (req, res) => res.json({ status: 'ok', db: 'mongodb', timestamp: new Date().toISOString() }));
app.use((req, res) => res.status(404).json({ error: 'Route not found' }));
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  if (err.message?.startsWith('CORS blocked')) return res.status(403).json({ error: 'CORS not allowed' });
  if (err.message?.includes('Only images and PDFs')) return res.status(400).json({ error: err.message });
  if (err.code === 'LIMIT_FILE_SIZE') return res.status(400).json({ error: 'File too large. Maximum 5MB allowed.' });
  if (err.name === 'CastError') return res.status(400).json({ error: 'Invalid ID format' });
  if (err.code === 11000) return res.status(409).json({ error: 'Duplicate record' });
  return res.status(500).json({ error: 'Internal server error' });
});

connectDB()
  .then(() => app.listen(PORT, () => {
    console.log(`🚀 Dainik Bahi API running on port ${PORT}`);
    console.log(`   Environment: ${process.env.NODE_ENV}`);
  }))
  .catch((err) => {
    console.error('❌ Failed to start server:', err.message);
    process.exit(1);
  });

export default app;
