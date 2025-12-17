// backend/src/models/Wallet.js

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

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
      default: 'XOF',
      enum: ['XOF', 'EUR', 'USD'],
    },
    pin: {
      type: String,
      required: false,
      select: false,
    },
    statut: {
      type: String,
      enum: ['actif', 'bloque', 'suspendu'],
      default: 'actif',
    },
    tentativesPinEchouees: {
      type: Number,
      default: 0,
    },
    dateBlocagePin: {
      type: Date,
      default: null,
    },
    dateCreation: {
      type: Date,
      default: Date.now,
    },
    dateMiseAJour: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

walletSchema.index({ utilisateurId: 1 });

walletSchema.pre('save', async function (next) {
  try {
    this.dateMiseAJour = Date.now();
    
    if (this.isModified('pin') && this.pin) {
      if (!this.pin.startsWith('$2')) {
        const salt = await bcrypt.genSalt(10);
        this.pin = await bcrypt.hash(this.pin, salt);
      }
    }
    
    next();
  } catch (error) {
    next(error);
  }
});

walletSchema.methods.comparePin = async function (pinCandidat) {
  try {
    if (!this.pin) return false;
    return await bcrypt.compare(pinCandidat, this.pin);
  } catch (error) {
    throw new Error('Erreur lors de la comparaison du PIN');
  }
};

walletSchema.methods.estBloque = function () {
  if (this.statut === 'bloque') return true;

  if (this.dateBlocagePin) {
    const maintenant = new Date();
    const dureeBloquage = parseInt(process.env.PIN_LOCK_DURATION_MINUTES, 10) || 30;
    const finBlocage = new Date(
      this.dateBlocagePin.getTime() + dureeBloquage * 60000
    );

    if (maintenant < finBlocage) {
      return true;
    } else {
      this.dateBlocagePin = null;
      this.tentativesPinEchouees = 0;
    }
  }
  return false;
};

walletSchema.methods.incrementerTentativesEchouees = async function () {
  this.tentativesPinEchouees += 1;
  const maxTentatives = parseInt(process.env.MAX_PIN_ATTEMPTS, 10) || 3;
  
  if (this.tentativesPinEchouees >= maxTentatives) {
    this.dateBlocagePin = new Date();
  }
  
  await this.save();
};

walletSchema.methods.reinitialiserTentatives = async function () {
  await this.constructor.updateOne(
    { _id: this._id },
    { 
      $set: {
        tentativesPinEchouees: 0, 
        dateBlocagePin: null,
        dateMiseAJour: new Date()
      }
    }
  );
  
  this.tentativesPinEchouees = 0;
  this.dateBlocagePin = null;
  this.dateMiseAJour = new Date();
};

walletSchema.methods.crediter = async function (montant) {
  if (montant <= 0) {
    throw new Error('Le montant doit être positif');
  }
  this.solde += montant;
  await this.save();
  return this.solde;
};

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

walletSchema.methods.aSoldeSuffisant = function (montant) {
  return this.solde >= montant;
};

const Wallet = mongoose.model('Wallet', walletSchema);

module.exports = Wallet;