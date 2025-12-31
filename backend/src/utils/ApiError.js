// backend/src/utils/ApiError.js
// Classe d'erreur personnalisée pour une gestion standardisée des erreurs

const { ERROR_CODES } = require('../config/constants');

class ApiError extends Error {
  constructor(errorCodeOrStatus, customMessage = null, statusCode = null, details = null) {
    // Supporter l'usage simple: new ApiError(statusCode, message)
    if (typeof errorCodeOrStatus === 'number' && errorCodeOrStatus >= 100 && errorCodeOrStatus < 600 && typeof customMessage === 'string') {
      super(customMessage);
      this.statusCode = errorCodeOrStatus;
      this.code = null;
      this.details = statusCode; // 3ème argument devient details dans ce cas
    }
    // Si errorCode est un objet du type ERROR_CODES
    else if (typeof errorCodeOrStatus === 'object' && errorCodeOrStatus.code) {
      super(customMessage || errorCodeOrStatus.message);
      this.code = errorCodeOrStatus.code;
      this.statusCode = statusCode || 400;
      this.details = details;
    } else {
      // Si c'est juste un code d'erreur
      super(customMessage || 'Une erreur est survenue');
      this.code = errorCodeOrStatus;
      this.statusCode = statusCode || 400;
      this.details = details;
    }

    this.isOperational = true;
    this.timestamp = new Date().toISOString();

    Error.captureStackTrace(this, this.constructor);
  }

  // Méthodes statiques pour créer des erreurs courantes
  static badRequest(message, details = null) {
    return new ApiError(
      ERROR_CODES.VALIDATION_FAILED,
      message,
      400,
      details
    );
  }

  static unauthorized(message = 'Non autorisé') {
    return new ApiError(
      ERROR_CODES.AUTH_TOKEN_INVALID,
      message,
      401
    );
  }

  static forbidden(message = 'Accès refusé') {
    return new ApiError(
      ERROR_CODES.AUTH_ACCOUNT_BLOCKED,
      message,
      403
    );
  }

  static notFound(message = 'Ressource non trouvée') {
    return new ApiError(
      { code: 404, message },
      message,
      404
    );
  }

  static conflict(message, details = null) {
    return new ApiError(
      { code: 409, message },
      message,
      409,
      details
    );
  }

  static tooManyRequests(message = 'Trop de requêtes') {
    return new ApiError(
      ERROR_CODES.RATE_LIMIT_EXCEEDED,
      message,
      429
    );
  }

  static internal(message = 'Erreur interne du serveur') {
    return new ApiError(
      ERROR_CODES.INTERNAL_ERROR,
      message,
      500
    );
  }

  // Erreurs métier spécifiques
  static insufficientBalance(available, required) {
    return new ApiError(
      ERROR_CODES.WALLET_INSUFFICIENT_BALANCE,
      `Solde insuffisant. Disponible: ${available}, Requis: ${required}`,
      400,
      { available, required }
    );
  }

  static invalidPin() {
    return new ApiError(
      ERROR_CODES.WALLET_PIN_INVALID,
      null,
      401
    );
  }

  static pinBlocked(remainingTime) {
    return new ApiError(
      ERROR_CODES.WALLET_PIN_BLOCKED,
      `PIN bloqué. Réessayez dans ${remainingTime} minutes.`,
      403,
      { remainingTime }
    );
  }

  static dailyLimitExceeded(limit, used) {
    return new ApiError(
      ERROR_CODES.WALLET_DAILY_LIMIT_EXCEEDED,
      `Limite journalière dépassée. Limite: ${limit}, Utilisé: ${used}`,
      400,
      { limit, used }
    );
  }

  static monthlyLimitExceeded(limit, used) {
    return new ApiError(
      ERROR_CODES.WALLET_MONTHLY_LIMIT_EXCEEDED,
      `Limite mensuelle dépassée. Limite: ${limit}, Utilisé: ${used}`,
      400,
      { limit, used }
    );
  }

  static kycRequired(requiredLevel) {
    return new ApiError(
      ERROR_CODES.KYC_LEVEL_INSUFFICIENT,
      `Niveau de vérification ${requiredLevel} requis pour cette opération`,
      403,
      { requiredLevel }
    );
  }

  static invalidOTP() {
    return new ApiError(
      ERROR_CODES.OTP_INVALID,
      null,
      400
    );
  }

  static expiredOTP() {
    return new ApiError(
      ERROR_CODES.OTP_EXPIRED,
      null,
      400
    );
  }

  // Formater la réponse d'erreur
  toJSON() {
    return {
      success: false,
      error: {
        code: this.code,
        message: this.message,
        details: this.details,
        timestamp: this.timestamp
      }
    };
  }
}

module.exports = ApiError;
