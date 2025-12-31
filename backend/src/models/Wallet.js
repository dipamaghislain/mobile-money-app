// backend/src/models/Wallet.js
// Portefeuille Mobile Money simplifié

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Constantes inline
const WALLET_STATUS = {
  ACTIVE: 'actif',
  INACTIVE: 'inactif',
  SUSPENDED: 'suspendu',
  BLOCKED: 'bloque'
};

const SUPPORTED_CURRENCIES = ['XOF', 'XAF', 'GNF', 'EUR', 'USD'];
const DEFAULT_CURRENCY = 'XOF';

const walletSchema = new mongoose.Schema(
  {
    utilisateurId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, "L'ID utilisateur est requis"],
      unique: true,
    },
    solde: {
      type: Number,
      default: 0,
      min: [0, 'Le solde ne peut pas être négatif'],
    },
    devise: {
      type: String,
      default: DEFAULT_CURRENCY,
      uppercase: true,
      enum: SUPPORTED_CURRENCIES,
    },
    pin: {
      type: String,
      required: false,
      select: false,
    },
    statut: {
      type: String,
      enum: Object.values(WALLET_STATUS),
      default: WALLET_STATUS.ACTIVE,
    },
    tentativesPinEchouees: {
      type: Number,
      default: 0,
    },
    dateBlocagePin: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Hash PIN avant sauvegarde
walletSchema.pre('save', async function () {
  if (this.isModified('pin') && this.pin) {
    // Ne pas re-hasher si déjà hashé
    if (!this.pin.startsWith('$2')) {
      const salt = await bcrypt.genSalt(10);
      this.pin = await bcrypt.hash(this.pin, salt);
    }
  }
});

// Comparer le PIN
walletSchema.methods.comparePin = async function (pinCandidat) {
  if (!this.pin) return false;
  return bcrypt.compare(String(pinCandidat), this.pin);
};

// Vérifier si bloqué
walletSchema.methods.estBloque = function () {
  if (this.statut === 'bloque' || this.statut === 'suspendu') return true;

  if (this.dateBlocagePin) {
    const maintenant = new Date();
    const finBlocage = new Date(this.dateBlocagePin.getTime() + 15 * 60000); // 15 min

    if (maintenant < finBlocage) {
      return true;
    } else {
      this.dateBlocagePin = null;
      this.tentativesPinEchouees = 0;
    }
  }
  return false;
};

// Incrémenter tentatives échouées
walletSchema.methods.incrementerTentativesEchouees = async function () {
  this.tentativesPinEchouees += 1;

  if (this.tentativesPinEchouees >= 3) {
    this.dateBlocagePin = new Date();
  }

  await this.save();
  return {
    tentatives: this.tentativesPinEchouees,
    bloque: this.tentativesPinEchouees >= 3
  };
};

// Réinitialiser tentatives
walletSchema.methods.reinitialiserTentatives = async function () {
  this.tentativesPinEchouees = 0;
  this.dateBlocagePin = null;
  await this.save();
};

// Créditer le compte
walletSchema.methods.crediter = async function (montant) {
  if (montant <= 0) {
    throw new Error('Le montant doit être positif');
  }
  this.solde += montant;
  await this.save();
  return this.solde;
};

// Débiter le compte
walletSchema.methods.debiter = async function (montant) {
  if (montant <= 0) {
    throw new Error('Le montant doit être positif');
  }
  if (this.solde < montant) {
    throw new Error('Solde insuffisant');
  }
  this.solde -= montant;
  await this.save();
  return this.solde;
};

// Vérifier solde suffisant
walletSchema.methods.aSoldeSuffisant = function (montant) {
  return this.solde >= montant;
};

const Wallet = mongoose.model('Wallet', walletSchema);

module.exports = Wallet;
module.exports.WALLET_STATUS = WALLET_STATUS;