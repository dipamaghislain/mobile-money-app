// backend/src/config/constants.js
// Constantes métier de l'application Mobile Money

module.exports = {
  // ============================================
  // CODES D'ERREUR STANDARDISÉS
  // ============================================
  ERROR_CODES: {
    // Authentification (1xxx)
    AUTH_INVALID_CREDENTIALS: { code: 1001, message: 'Identifiants incorrects' },
    AUTH_TOKEN_INVALID: { code: 1002, message: 'Token invalide ou expiré' },
    AUTH_TOKEN_MISSING: { code: 1003, message: 'Token d\'authentification requis' },
    AUTH_ACCOUNT_BLOCKED: { code: 1004, message: 'Compte bloqué. Contactez le support.' },
    AUTH_ACCOUNT_NOT_VERIFIED: { code: 1005, message: 'Compte non vérifié' },
    AUTH_EMAIL_EXISTS: { code: 1006, message: 'Cet email est déjà utilisé' },
    AUTH_PHONE_EXISTS: { code: 1007, message: 'Ce numéro de téléphone est déjà utilisé' },
    AUTH_WEAK_PASSWORD: { code: 1008, message: 'Mot de passe trop faible' },

    // Portefeuille (2xxx)
    WALLET_NOT_FOUND: { code: 2001, message: 'Portefeuille non trouvé' },
    WALLET_BLOCKED: { code: 2002, message: 'Portefeuille bloqué' },
    WALLET_INSUFFICIENT_BALANCE: { code: 2003, message: 'Solde insuffisant' },
    WALLET_PIN_INVALID: { code: 2004, message: 'Code PIN incorrect' },
    WALLET_PIN_BLOCKED: { code: 2005, message: 'PIN bloqué après trop de tentatives' },
    WALLET_PIN_NOT_SET: { code: 2006, message: 'Code PIN non défini' },
    WALLET_DAILY_LIMIT_EXCEEDED: { code: 2007, message: 'Limite journalière dépassée' },
    WALLET_MONTHLY_LIMIT_EXCEEDED: { code: 2008, message: 'Limite mensuelle dépassée' },
    WALLET_MAX_BALANCE_EXCEEDED: { code: 2009, message: 'Plafond de solde atteint' },

    // Transactions (3xxx)
    TRANSACTION_FAILED: { code: 3001, message: 'Transaction échouée' },
    TRANSACTION_INVALID_AMOUNT: { code: 3002, message: 'Montant invalide' },
    TRANSACTION_MIN_AMOUNT: { code: 3003, message: 'Montant minimum non atteint' },
    TRANSACTION_MAX_AMOUNT: { code: 3004, message: 'Montant maximum dépassé' },
    TRANSACTION_SELF_TRANSFER: { code: 3005, message: 'Transfert vers soi-même interdit' },
    TRANSACTION_RECIPIENT_NOT_FOUND: { code: 3006, message: 'Destinataire non trouvé' },
    TRANSACTION_MERCHANT_NOT_FOUND: { code: 3007, message: 'Marchand non trouvé' },
    TRANSACTION_DUPLICATE: { code: 3008, message: 'Transaction en double détectée' },

    // KYC (4xxx)
    KYC_REQUIRED: { code: 4001, message: 'Vérification d\'identité requise' },
    KYC_PENDING: { code: 4002, message: 'Vérification en cours de traitement' },
    KYC_REJECTED: { code: 4003, message: 'Vérification rejetée' },
    KYC_LEVEL_INSUFFICIENT: { code: 4004, message: 'Niveau de vérification insuffisant' },

    // Épargne (5xxx)
    SAVINGS_NOT_FOUND: { code: 5001, message: 'Tirelire non trouvée' },
    SAVINGS_NOT_EMPTY: { code: 5002, message: 'La tirelire contient encore de l\'argent' },
    SAVINGS_INSUFFICIENT: { code: 5003, message: 'Montant insuffisant dans la tirelire' },

    // Validation (6xxx)
    VALIDATION_FAILED: { code: 6001, message: 'Données invalides' },
    VALIDATION_REQUIRED_FIELD: { code: 6002, message: 'Champ requis manquant' },
    VALIDATION_INVALID_FORMAT: { code: 6003, message: 'Format invalide' },

    // OTP (7xxx)
    OTP_INVALID: { code: 7001, message: 'Code OTP invalide' },
    OTP_EXPIRED: { code: 7002, message: 'Code OTP expiré' },
    OTP_MAX_ATTEMPTS: { code: 7003, message: 'Nombre maximum de tentatives OTP atteint' },

    // Système (9xxx)
    INTERNAL_ERROR: { code: 9001, message: 'Erreur interne du serveur' },
    SERVICE_UNAVAILABLE: { code: 9002, message: 'Service temporairement indisponible' },
    RATE_LIMIT_EXCEEDED: { code: 9003, message: 'Trop de requêtes' }
  },

  // ============================================
  // LIMITES DE TRANSACTION PAR NIVEAU KYC
  // ============================================
  KYC_LEVELS: {
    LEVEL_0: {
      name: 'Non vérifié',
      dailyLimit: 50000,        // 50,000 XOF
      monthlyLimit: 200000,     // 200,000 XOF
      maxBalance: 100000,       // 100,000 XOF
      maxTransactionAmount: 25000,
      canTransfer: true,
      canReceive: true,
      canWithdraw: false,
      canMerchantPayment: true
    },
    LEVEL_1: {
      name: 'Basique',
      dailyLimit: 500000,       // 500,000 XOF
      monthlyLimit: 2000000,    // 2,000,000 XOF
      maxBalance: 1000000,      // 1,000,000 XOF
      maxTransactionAmount: 200000,
      canTransfer: true,
      canReceive: true,
      canWithdraw: true,
      canMerchantPayment: true
    },
    LEVEL_2: {
      name: 'Vérifié',
      dailyLimit: 2000000,      // 2,000,000 XOF
      monthlyLimit: 10000000,   // 10,000,000 XOF
      maxBalance: 5000000,      // 5,000,000 XOF
      maxTransactionAmount: 1000000,
      canTransfer: true,
      canReceive: true,
      canWithdraw: true,
      canMerchantPayment: true
    },
    LEVEL_3: {
      name: 'Premium',
      dailyLimit: 10000000,     // 10,000,000 XOF
      monthlyLimit: 50000000,   // 50,000,000 XOF
      maxBalance: 20000000,     // 20,000,000 XOF
      maxTransactionAmount: 5000000,
      canTransfer: true,
      canReceive: true,
      canWithdraw: true,
      canMerchantPayment: true
    }
  },

  // ============================================
  // FRAIS DE TRANSACTION
  // ============================================
  TRANSACTION_FEES: {
    DEPOSIT: {
      percentage: 0,           // Gratuit
      fixedFee: 0,
      minFee: 0,
      maxFee: 0
    },
    WITHDRAW: {
      percentage: 1.5,         // 1.5%
      fixedFee: 100,           // 100 XOF minimum
      minFee: 100,
      maxFee: 5000             // 5,000 XOF maximum
    },
    TRANSFER: {
      percentage: 1,           // 1%
      fixedFee: 50,            // 50 XOF minimum
      minFee: 50,
      maxFee: 3000             // 3,000 XOF maximum
    },
    MERCHANT_PAYMENT: {
      percentage: 0,           // Gratuit pour le client
      fixedFee: 0,
      minFee: 0,
      maxFee: 0,
      merchantFeePercentage: 1.5  // 1.5% pour le marchand
    }
  },

  // ============================================
  // LIMITES GÉNÉRALES
  // ============================================
  TRANSACTION_LIMITS: {
    MIN_AMOUNT: 100,           // 100 XOF minimum
    MAX_DEPOSIT: 5000000,      // 5,000,000 XOF par dépôt
    MAX_WITHDRAW: 2000000,     // 2,000,000 XOF par retrait
    MAX_TRANSFER: 1000000,     // 1,000,000 XOF par transfert
    MAX_MERCHANT_PAYMENT: 5000000  // 5,000,000 XOF par paiement
  },

  // ============================================
  // CONFIGURATION PIN
  // ============================================
  PIN_CONFIG: {
    MIN_LENGTH: 4,
    MAX_LENGTH: 6,
    MAX_ATTEMPTS: 3,
    LOCK_DURATION_MINUTES: 30,
    REQUIRE_CHANGE_DAYS: 90    // Recommander changement tous les 90 jours
  },

  // ============================================
  // CONFIGURATION OTP
  // ============================================
  OTP_CONFIG: {
    LENGTH: 6,
    EXPIRY_MINUTES: 5,
    MAX_ATTEMPTS: 3,
    COOLDOWN_MINUTES: 1        // Attendre 1 min entre les envois
  },

  // ============================================
  // TYPES DE TRANSACTIONS
  // ============================================
  TRANSACTION_TYPES: {
    DEPOSIT: 'DEPOSIT',
    WITHDRAW: 'WITHDRAW',
    TRANSFER: 'TRANSFER',
    MERCHANT_PAYMENT: 'MERCHANT_PAYMENT',
    EPARGNE_IN: 'EPARGNE_IN',
    EPARGNE_OUT: 'EPARGNE_OUT',
    FEE: 'FEE',
    REFUND: 'REFUND'
  },

  // ============================================
  // STATUTS
  // ============================================
  TRANSACTION_STATUS: {
    PENDING: 'EN_ATTENTE',
    SUCCESS: 'SUCCES',
    FAILED: 'ECHEC',
    CANCELLED: 'ANNULE',
    REFUNDED: 'REMBOURSE'
  },

  USER_STATUS: {
    ACTIVE: 'actif',
    BLOCKED: 'bloque',
    PENDING: 'en_attente',
    SUSPENDED: 'suspendu'
  },

  WALLET_STATUS: {
    ACTIVE: 'actif',
    BLOCKED: 'bloque',
    SUSPENDED: 'suspendu'
  },

  // ============================================
  // DEVISES SUPPORTÉES
  // ============================================
  SUPPORTED_CURRENCIES: ['XOF', 'XAF', 'EUR', 'USD'],
  DEFAULT_CURRENCY: 'XOF',

  // ============================================
  // RÔLES UTILISATEUR
  // ============================================
  USER_ROLES: {
    CLIENT: 'client',
    MERCHANT: 'marchand',
    AGENT: 'agent',
    ADMIN: 'admin',
    SUPER_ADMIN: 'super_admin'
  }
};
