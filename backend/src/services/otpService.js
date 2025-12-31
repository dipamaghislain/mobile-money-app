// backend/src/services/otpService.js
// Service de gestion des codes OTP

const crypto = require('crypto');
const { OTP_CONFIG } = require('../config/constants');
const ApiError = require('../utils/ApiError');
const logger = require('../utils/logger');

// Stockage temporaire des OTP (en production, utiliser Redis)
const otpStore = new Map();

class OTPService {
  /**
   * Générer un code OTP
   */
  static generateCode(length = OTP_CONFIG.LENGTH) {
    // Générer un code numérique sécurisé
    const min = Math.pow(10, length - 1);
    const max = Math.pow(10, length) - 1;
    const randomBuffer = crypto.randomBytes(4);
    const randomNumber = randomBuffer.readUInt32BE(0);
    const code = (randomNumber % (max - min + 1)) + min;
    return code.toString();
  }

  /**
   * Créer et stocker un OTP pour un utilisateur
   */
  static async createOTP(userId, purpose, channel = 'SMS') {
    const key = `${userId}:${purpose}`;
    
    // Vérifier le cooldown
    const existing = otpStore.get(key);
    if (existing) {
      const timeSinceCreation = Date.now() - existing.createdAt;
      const cooldownMs = OTP_CONFIG.COOLDOWN_MINUTES * 60 * 1000;
      
      if (timeSinceCreation < cooldownMs) {
        const remainingSeconds = Math.ceil((cooldownMs - timeSinceCreation) / 1000);
        throw ApiError.badRequest(
          `Veuillez attendre ${remainingSeconds} secondes avant de demander un nouveau code`
        );
      }
    }

    const code = this.generateCode();
    const expiresAt = Date.now() + (OTP_CONFIG.EXPIRY_MINUTES * 60 * 1000);

    // Stocker l'OTP
    otpStore.set(key, {
      code,
      attempts: 0,
      createdAt: Date.now(),
      expiresAt,
      channel,
      purpose
    });

    logger.logOTP('CREATED', userId, {
      channel,
      purpose,
      success: true
    });

    // En production, envoyer via SMS ou Email
    // Pour le moment, on retourne le code (dev only)
    return {
      sent: true,
      channel,
      expiresIn: OTP_CONFIG.EXPIRY_MINUTES * 60,
      // Ne pas retourner le code en production !
      ...(process.env.NODE_ENV === 'development' && { code })
    };
  }

  /**
   * Vérifier un code OTP
   */
  static async verifyOTP(userId, purpose, code) {
    const key = `${userId}:${purpose}`;
    const stored = otpStore.get(key);

    if (!stored) {
      logger.logOTP('VERIFY_FAILED', userId, {
        purpose,
        reason: 'NOT_FOUND',
        success: false
      });
      throw ApiError.invalidOTP();
    }

    // Vérifier l'expiration
    if (Date.now() > stored.expiresAt) {
      otpStore.delete(key);
      logger.logOTP('VERIFY_FAILED', userId, {
        purpose,
        reason: 'EXPIRED',
        success: false
      });
      throw ApiError.expiredOTP();
    }

    // Vérifier le nombre de tentatives
    if (stored.attempts >= OTP_CONFIG.MAX_ATTEMPTS) {
      otpStore.delete(key);
      logger.logOTP('VERIFY_FAILED', userId, {
        purpose,
        reason: 'MAX_ATTEMPTS',
        success: false
      });
      throw new ApiError(
        { code: 7003, message: 'Nombre maximum de tentatives atteint' },
        'Trop de tentatives. Demandez un nouveau code.',
        400
      );
    }

    // Vérifier le code
    if (stored.code !== code) {
      stored.attempts += 1;
      logger.logOTP('VERIFY_FAILED', userId, {
        purpose,
        reason: 'INVALID_CODE',
        attempts: stored.attempts,
        success: false
      });
      
      const remainingAttempts = OTP_CONFIG.MAX_ATTEMPTS - stored.attempts;
      throw ApiError.badRequest(
        `Code incorrect. ${remainingAttempts} tentative(s) restante(s).`,
        { remainingAttempts }
      );
    }

    // Code valide - supprimer de la store
    otpStore.delete(key);

    logger.logOTP('VERIFIED', userId, {
      purpose,
      success: true
    });

    return { verified: true };
  }

  /**
   * Invalider tous les OTP d'un utilisateur
   */
  static invalidateAll(userId) {
    const keysToDelete = [];
    for (const key of otpStore.keys()) {
      if (key.startsWith(`${userId}:`)) {
        keysToDelete.push(key);
      }
    }
    keysToDelete.forEach(key => otpStore.delete(key));
    return keysToDelete.length;
  }

  /**
   * Nettoyer les OTP expirés (à appeler périodiquement)
   */
  static cleanup() {
    const now = Date.now();
    let cleaned = 0;
    for (const [key, value] of otpStore.entries()) {
      if (now > value.expiresAt) {
        otpStore.delete(key);
        cleaned++;
      }
    }
    return cleaned;
  }
}

// Nettoyer les OTP expirés toutes les 5 minutes
setInterval(() => {
  const cleaned = OTPService.cleanup();
  if (cleaned > 0) {
    logger.info(`OTP cleanup: ${cleaned} expired codes removed`);
  }
}, 5 * 60 * 1000);

module.exports = OTPService;
