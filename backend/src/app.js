// backend/src/app.js
const express = require('express');
const compression = require('compression');
const dotenv = require('dotenv');

// Charger les variables d'environnement
dotenv.config();

// Importer la configuration de sécurité
const security = require('./config/security');
const logger = require('./utils/logger');

// Importer les routes
const authRoutes = require('./routes/authRoutes');
const walletRoutes = require('./routes/walletRoutes');
const transactionRoutes = require('./routes/transactionRoutes');
const transactionRoutesV3 = require('./routes/transactionRoutes.v3');
const savingsRoutes = require('./routes/savingsRoutes');
const adminRoutes = require('./routes/adminRoutes');
const notificationRoutes = require('./routes/notificationRoutes');

// Créer l'application Express
const app = express();

// ============================================
// MIDDLEWARES DE SÉCURITÉ (en premier)
// ============================================
app.use(security.helmet);           // Headers de sécurité
app.use(security.cors);             // CORS configuré
app.use(security.hpp);              // Protection contre la pollution des paramètres
app.use(security.globalLimiter);    // Rate limiting global

// ============================================
// MIDDLEWARES GLOBAUX
// ============================================
app.use(compression());             // Compression GZIP
app.use(express.json({ limit: '10kb' })); // Limiter la taille des payloads
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// ============================================
// MIDDLEWARE DE LOGGING
// ============================================
app.use((req, res, next) => {
  // Générer un ID unique pour la requête
  req.requestId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  res.setHeader('X-Request-Id', req.requestId);
  
  // Logger la requête
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    const logData = {
      requestId: req.requestId,
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      ip: req.ip || req.headers['x-forwarded-for'],
      userAgent: req.headers['user-agent']
    };
    
    if (res.statusCode >= 400) {
      logger.warn('Request failed', logData);
    } else if (process.env.NODE_ENV === 'development') {
      logger.info('Request completed', logData);
    }
  });
  
  next();
});

// ============================================
// ROUTE DE SANTÉ (Health Check)
// ============================================
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Route de test
app.get('/', (req, res) => {
  res.json({
    message: 'Bienvenue sur l\'API Mobile Money',
    version: '2.0.0',
    documentation: '/api/docs',
    endpoints: {
      auth: '/api/auth',
      wallet: '/api/wallet',
      transactions: '/api/transactions',
      savings: '/api/savings',
      notifications: '/api/notifications',
      admin: '/api/admin'
    }
  });
});

// ============================================
// ROUTES API
// ============================================
app.use('/api/auth', authRoutes);
app.use('/api/wallet', walletRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/v3/transactions', transactionRoutesV3);  // API v3 multi-pays
app.use('/api/savings', savingsRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/admin', adminRoutes);

// ============================================
// ROUTE 404
// ============================================
app.use((req, res) => {
  res.status(404).json({
    message: 'Route non trouvée',
    path: req.path
  });
});

// ============================================
// MIDDLEWARE DE GESTION DES ERREURS GLOBALES
// ============================================
app.use((err, req, res, next) => {
  // Logger l'erreur
  logger.logError(err, {
    requestId: req.requestId,
    method: req.method,
    path: req.path,
    userId: req.user?.id
  });

  // Erreur opérationnelle (gérée)
  if (err.isOperational) {
    return res.status(err.statusCode || 400).json(err.toJSON ? err.toJSON() : {
      success: false,
      error: {
        code: err.code || 'ERROR',
        message: err.message
      }
    });
  }

  // Erreur de validation Mongoose
  if (err.name === 'ValidationError') {
    const errors = Object.values(err.errors).map(e => e.message);
    return res.status(400).json({
      success: false,
      error: {
        code: 6001,
        message: 'Erreur de validation',
        details: errors
      }
    });
  }

  // Erreur de cast Mongoose (ID invalide)
  if (err.name === 'CastError') {
    return res.status(400).json({
      success: false,
      error: {
        code: 6003,
        message: 'Format de données invalide',
        details: `${err.path}: ${err.value}`
      }
    });
  }

  // Erreur de duplication MongoDB
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    return res.status(409).json({
      success: false,
      error: {
        code: 409,
        message: `Ce ${field} existe déjà`
      }
    });
  }

  // Erreur JWT
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      error: {
        code: 1002,
        message: 'Token invalide'
      }
    });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      error: {
        code: 1002,
        message: 'Token expiré'
      }
    });
  }

  // Erreur non gérée (en production, ne pas exposer les détails)
  const isDev = process.env.NODE_ENV === 'development';
  
  res.status(500).json({
    success: false,
    error: {
      code: 9001,
      message: isDev ? err.message : 'Erreur interne du serveur',
      ...(isDev && { stack: err.stack })
    }
  });
});

module.exports = app;