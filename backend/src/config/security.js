// backend/src/config/security.js
// Configuration de sécurité simplifiée

const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const hpp = require('hpp');
const cors = require('cors');

const isTest = process.env.NODE_ENV === 'test';

// ============================================
// CONFIGURATION CORS
// ============================================
const corsOptions = {
  origin: process.env.CORS_ORIGINS 
    ? process.env.CORS_ORIGINS.split(',') 
    : ['http://localhost:4200', 'http://localhost:3000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  maxAge: 86400
};

// ============================================
// RATE LIMITERS (désactivés en test)
// ============================================

// Middleware passthrough pour les tests
const noOpLimiter = (req, res, next) => next();

// Rate limiter global
const globalLimiter = isTest ? noOpLimiter : rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { message: 'Trop de requêtes. Réessayez plus tard.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Rate limiter authentification
const authLimiter = isTest ? noOpLimiter : rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { message: 'Trop de tentatives de connexion.' },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,
});

// Rate limiter transactions
const transactionLimiter = isTest ? noOpLimiter : rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 30,
  message: { message: 'Limite de transactions atteinte.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Rate limiter PIN
const pinLimiter = isTest ? noOpLimiter : rateLimit({
  windowMs: 30 * 60 * 1000,
  max: 5,
  message: { message: 'Trop de tentatives PIN.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Rate limiter OTP
const otpLimiter = isTest ? noOpLimiter : rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 3,
  message: { message: 'Limite OTP atteinte.' },
});

// ============================================
// CONFIGURATION HELMET
// ============================================
const helmetConfig = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", 'data:', 'https:'],
      connectSrc: ["'self'"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"]
    }
  },
  crossOriginEmbedderPolicy: false,
  crossOriginResourcePolicy: { policy: "cross-origin" }
});

// ============================================
// EXPORTS
// ============================================
module.exports = {
  corsOptions,
  cors: cors(corsOptions),
  helmet: helmetConfig,
  hpp: hpp(),
  globalLimiter,
  authLimiter,
  transactionLimiter,
  pinLimiter,
  otpLimiter
};
