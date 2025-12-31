// backend/src/models/User.js
// Modèle Mobile Money Multi-Pays
// Authentification : EMAIL + MOT DE PASSE
// Transactions : TELEPHONE + PIN

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { validatePhoneNumber, COUNTRIES, DEFAULT_COUNTRY } = require('../config/countries');

const USER_ROLES = {
  CLIENT: 'client',
  MARCHAND: 'marchand',
  AGENT: 'agent',
  ADMIN: 'admin'
};

const USER_STATUS = {
  ACTIVE: 'actif',
  INACTIVE: 'inactif',
  SUSPENDED: 'suspendu',
  BLOCKED: 'bloque'
};

const userSchema = new mongoose.Schema(
  {
    // ============================================
    // EMAIL = Identifiant pour connexion
    // ============================================
    email: {
      type: String,
      required: [true, 'L\'email est requis'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Email invalide']
    },

    // Mot de passe pour connexion
    motDePasse: {
      type: String,
      required: [true, 'Le mot de passe est requis'],
      minlength: [6, 'Le mot de passe doit contenir au moins 6 caractères'],
      select: false,
    },

    nomComplet: {
      type: String,
      required: [true, 'Le nom complet est requis'],
      trim: true,
      minlength: [2, 'Le nom doit contenir au moins 2 caractères']
    },

    // ============================================
    // TELEPHONE = Pour les transactions (Mobile Money)
    // ============================================
    telephone: {
      type: String,
      required: [true, 'Le numéro de téléphone est requis'],
      unique: true,
      trim: true,
    },

    // Statut de vérification du téléphone
    telephoneVerifie: {
      type: Boolean,
      default: false
    },

    // Code OTP pour vérification téléphone
    otpVerificationTelephone: {
      code: String,
      expiresAt: Date,
      tentatives: { type: Number, default: 0 }
    },

    // ============================================
    // PAYS = Configuration régionale
    // ============================================
    pays: {
      type: String,
      enum: Object.keys(COUNTRIES),
      default: DEFAULT_COUNTRY,
      required: true
    },

    // Devise de l'utilisateur (automatiquement définie par le pays)
    devise: {
      type: String,
      enum: ['XOF', 'XAF'],
      default: 'XOF'
    },

    // ============================================
    // CODE PIN = Pour sécuriser les transactions
    // ============================================
    codePin: {
      type: String,
      select: false,
      minlength: 4,
      maxlength: 6
    },

    // Le PIN a été configuré ?
    pinConfigured: {
      type: Boolean,
      default: false
    },

    // Date de dernière modification du PIN
    pinModifieLe: {
      type: Date
    },

    // Historique des PINs (pour éviter réutilisation)
    historiquePin: [{
      hash: String,
      date: { type: Date, default: Date.now }
    }],

    role: {
      type: String,
      enum: Object.values(USER_ROLES),
      default: USER_ROLES.CLIENT,
    },

    statut: {
      type: String,
      enum: Object.values(USER_STATUS),
      default: USER_STATUS.ACTIVE,
    },

    // KYC simplifié
    kycLevel: {
      type: Number,
      default: 0,
      min: 0,
      max: 3
    },

    // Marchand
    codeMarchand: {
      type: String,
      unique: true,
      sparse: true,
    },
    nomCommerce: String,

    // Sécurité connexion
    tentativesEchouees: {
      type: Number,
      default: 0
    },
    bloqueJusqua: Date,
    dernierAcces: Date,

    // Sécurité PIN - Amélioré avec plus de contrôles
    tentativesPinEchouees: {
      type: Number,
      default: 0
    },
    pinBloqueJusqua: Date,
    
    // Niveau de blocage PIN (1: 30min, 2: 2h, 3: 24h, 4: permanent)
    niveauBlocagePin: {
      type: Number,
      default: 0,
      max: 4
    },

    // Parrainage
    codeParrainage: {
      type: String,
      unique: true,
      sparse: true
    },

    // Préférences de notification
    preferencesNotification: {
      sms: { type: Boolean, default: true },
      email: { type: Boolean, default: true },
      push: { type: Boolean, default: true },
      transactions: { type: Boolean, default: true },
      securite: { type: Boolean, default: true },
      promotions: { type: Boolean, default: false }
    },

    // Token push notification (Firebase)
    pushToken: String,

    // ============================================
    // RESET PASSWORD
    // ============================================
    resetPasswordToken: {
      type: String,
      select: false
    },
    resetPasswordExpires: {
      type: Date,
      select: false
    },
  },
  {
    timestamps: true,
  }
);

// Hash mot de passe et PIN avant sauvegarde
userSchema.pre('save', async function () {
  // Hash du mot de passe
  if (this.isModified('motDePasse') && this.motDePasse) {
    const salt = await bcrypt.genSalt(10);
    this.motDePasse = await bcrypt.hash(this.motDePasse, salt);
  }

  // Hash du code PIN
  if (this.isModified('codePin') && this.codePin) {
    const salt = await bcrypt.genSalt(10);
    this.codePin = await bcrypt.hash(this.codePin, salt);
    this.pinConfigured = true;
  }
  
  // Définir la devise selon le pays
  if (this.isModified('pays') || !this.devise) {
    const paysConfig = COUNTRIES[this.pays];
    if (paysConfig) {
      this.devise = paysConfig.devise;
    }
  }

  // Générer code parrainage unique
  if (!this.codeParrainage) {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    // Ajouter timestamp pour unicité
    this.codeParrainage = code + Date.now().toString(36).slice(-2).toUpperCase();
  }
});

// Comparer mot de passe
userSchema.methods.comparePassword = async function (motDePasse) {
  if (!this.motDePasse) return false;
  return bcrypt.compare(motDePasse, this.motDePasse);
};

// Comparer code PIN
userSchema.methods.comparePin = async function (pin) {
  if (!this.codePin) return false;
  return bcrypt.compare(pin, this.codePin);
};

// Vérifier si bloqué (connexion)
userSchema.methods.estBloque = function () {
  if (this.statut === 'bloque') return true;
  if (this.bloqueJusqua && this.bloqueJusqua > new Date()) return true;
  return false;
};

// Vérifier si PIN bloqué
userSchema.methods.pinEstBloque = function () {
  if (this.pinBloqueJusqua && this.pinBloqueJusqua > new Date()) return true;
  return false;
};

// Incrémenter tentatives connexion
userSchema.methods.incrementerTentatives = async function () {
  this.tentativesEchouees += 1;
  if (this.tentativesEchouees >= 3) {
    this.bloqueJusqua = new Date(Date.now() + 15 * 60 * 1000);
    this.tentativesEchouees = 0;
  }
  await this.save();
};

// Incrémenter tentatives PIN
userSchema.methods.incrementerTentativesPin = async function () {
  this.tentativesPinEchouees += 1;
  if (this.tentativesPinEchouees >= 3) {
    // Bloquer le PIN pour 30 minutes après 3 échecs
    this.pinBloqueJusqua = new Date(Date.now() + 30 * 60 * 1000);
    this.tentativesPinEchouees = 0;
  }
  await this.save();
};

// Réinitialiser tentatives connexion
userSchema.methods.reinitialiserTentatives = async function () {
  if (this.tentativesEchouees > 0) {
    this.tentativesEchouees = 0;
    this.bloqueJusqua = null;
    await this.save();
  }
};

// Réinitialiser tentatives PIN
userSchema.methods.reinitialiserTentativesPin = async function () {
  if (this.tentativesPinEchouees > 0) {
    this.tentativesPinEchouees = 0;
    this.pinBloqueJusqua = null;
    await this.save();
  }
};

// Obtenir configuration pays
userSchema.methods.getCountryConfig = function () {
  return COUNTRIES[this.pays] || COUNTRIES[DEFAULT_COUNTRY];
};

// Limites KYC (combinées avec limites pays)
userSchema.methods.getLimites = function () {
  const countryConfig = this.getCountryConfig();
  const kycLimites = {
    0: { soldeMax: 200000, transfertJour: 50000, retraitJour: 25000 },
    1: { soldeMax: 1000000, transfertJour: 500000, retraitJour: 200000 },
    2: { soldeMax: 5000000, transfertJour: 2000000, retraitJour: 1000000 },
    3: { soldeMax: 10000000, transfertJour: 5000000, retraitJour: 2500000 }
  };
  
  const kycLimit = kycLimites[this.kycLevel] || kycLimites[0];
  
  // Combiner avec les limites du pays
  return {
    soldeMax: Math.min(kycLimit.soldeMax, countryConfig.limites.soldeMax),
    transfertJour: Math.min(kycLimit.transfertJour, countryConfig.limites.transfertMax),
    retraitJour: Math.min(kycLimit.retraitJour, countryConfig.limites.retraitMax),
    depotMin: countryConfig.limites.depotMin,
    depotMax: countryConfig.limites.depotMax,
    retraitMin: countryConfig.limites.retraitMin,
    transfertMin: countryConfig.limites.transfertMin
  };
};

// JSON sans mot de passe
userSchema.methods.toJSON = function () {
  const user = this.toObject();
  delete user.motDePasse;
  delete user.__v;
  return user;
};

module.exports = mongoose.model('User', userSchema);
module.exports.USER_ROLES = USER_ROLES;
module.exports.USER_STATUS = USER_STATUS;
