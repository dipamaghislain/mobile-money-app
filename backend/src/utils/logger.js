// backend/src/utils/logger.js
// Système de logging professionnel avec Winston

const winston = require('winston');
const path = require('path');

// Format personnalisé pour les logs
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSS' }),
  winston.format.errors({ stack: true }),
  winston.format.printf(({ level, message, timestamp, ...metadata }) => {
    let metaString = '';
    if (Object.keys(metadata).length > 0) {
      metaString = JSON.stringify(metadata);
    }
    return `[${timestamp}] ${level.toUpperCase()}: ${message} ${metaString}`;
  })
);

// Format JSON pour la production
const jsonFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

// Créer le logger
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: process.env.NODE_ENV === 'production' ? jsonFormat : logFormat,
  defaultMeta: { service: 'mobile-money-api' },
  transports: [
    // Logs d'erreur dans un fichier séparé
    new winston.transports.File({
      filename: path.join(__dirname, '../../logs/error.log'),
      level: 'error',
      maxsize: 10485760, // 10MB
      maxFiles: 5
    }),
    // Tous les logs
    new winston.transports.File({
      filename: path.join(__dirname, '../../logs/combined.log'),
      maxsize: 10485760, // 10MB
      maxFiles: 10
    }),
    // Logs d'audit pour les transactions
    new winston.transports.File({
      filename: path.join(__dirname, '../../logs/audit.log'),
      level: 'info',
      maxsize: 52428800, // 50MB
      maxFiles: 30
    })
  ]
});

// Ajouter la console en développement
if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize(),
      logFormat
    )
  }));
}

// ============================================
// FONCTIONS D'AUDIT SPÉCIALISÉES
// ============================================

/**
 * Log une opération d'authentification
 */
logger.logAuth = (action, userId, data = {}) => {
  logger.info(`AUTH: ${action}`, {
    category: 'AUTH',
    action,
    userId,
    ip: data.ip,
    userAgent: data.userAgent,
    success: data.success !== false,
    ...data
  });
};

/**
 * Log une transaction financière
 */
logger.logTransaction = (type, transactionId, data = {}) => {
  logger.info(`TRANSACTION: ${type}`, {
    category: 'TRANSACTION',
    type,
    transactionId,
    userId: data.userId,
    amount: data.amount,
    currency: data.currency,
    status: data.status,
    reference: data.reference,
    recipientId: data.recipientId,
    merchantId: data.merchantId,
    fees: data.fees,
    balanceBefore: data.balanceBefore,
    balanceAfter: data.balanceAfter,
    ip: data.ip
  });
};

/**
 * Log une action administrative
 */
logger.logAdmin = (action, adminId, data = {}) => {
  logger.info(`ADMIN: ${action}`, {
    category: 'ADMIN',
    action,
    adminId,
    targetUserId: data.targetUserId,
    changes: data.changes,
    reason: data.reason,
    ip: data.ip
  });
};

/**
 * Log une tentative de sécurité
 */
logger.logSecurity = (event, data = {}) => {
  logger.warn(`SECURITY: ${event}`, {
    category: 'SECURITY',
    event,
    userId: data.userId,
    ip: data.ip,
    userAgent: data.userAgent,
    details: data.details
  });
};

/**
 * Log une erreur avec contexte
 */
logger.logError = (error, context = {}) => {
  logger.error(error.message, {
    category: 'ERROR',
    stack: error.stack,
    code: error.code,
    ...context
  });
};

/**
 * Log un événement KYC
 */
logger.logKYC = (action, userId, data = {}) => {
  logger.info(`KYC: ${action}`, {
    category: 'KYC',
    action,
    userId,
    level: data.level,
    previousLevel: data.previousLevel,
    documents: data.documents,
    verifiedBy: data.verifiedBy,
    reason: data.reason
  });
};

/**
 * Log l'envoi d'OTP
 */
logger.logOTP = (action, userId, data = {}) => {
  logger.info(`OTP: ${action}`, {
    category: 'OTP',
    action,
    userId,
    channel: data.channel, // SMS, EMAIL
    purpose: data.purpose, // LOGIN, TRANSACTION, PASSWORD_RESET
    success: data.success,
    ip: data.ip
  });
};

module.exports = logger;
