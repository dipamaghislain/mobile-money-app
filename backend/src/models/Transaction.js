// backend/src/models/Transaction.js
// Modèle de transaction multi-pays avec support Mobile Money

const mongoose = require('mongoose');
const { COUNTRIES, getCountry, calculateFees } = require('../config/countries');

// Types de transactions supportés
const TRANSACTION_TYPES = {
  DEPOSIT: 'DEPOSIT',           // Dépôt depuis mobile money
  WITHDRAW: 'WITHDRAW',         // Retrait vers mobile money  
  TRANSFER: 'TRANSFER',         // Transfert entre utilisateurs
  MERCHANT_PAYMENT: 'MERCHANT_PAYMENT', // Paiement marchand
  EPARGNE_IN: 'EPARGNE_IN',     // Vers épargne
  EPARGNE_OUT: 'EPARGNE_OUT',   // Depuis épargne
  CROSS_BORDER: 'CROSS_BORDER'  // Transfert international
};

// Statuts de transaction
const TRANSACTION_STATUS = {
  PENDING: 'EN_ATTENTE',
  SUCCESS: 'SUCCES',
  FAILED: 'ECHEC',
  CANCELLED: 'ANNULE',
  PROCESSING: 'EN_COURS'
};

const transactionSchema = new mongoose.Schema({
  // Référence unique de transaction
  reference: {
    type: String,
    unique: true,
    required: false // Sera généré automatiquement
    // Note: index géré via schema.index() ci-dessous
  },
  
  type: {
    type: String,
    required: [true, 'Le type de transaction est requis'],
    enum: Object.values(TRANSACTION_TYPES)
  },
  
  montant: {
    type: Number,
    required: [true, 'Le montant est requis'],
    min: [0, 'Le montant doit être positif']
  },
  
  devise: {
    type: String,
    default: 'XOF',
    enum: ['XOF', 'XAF', 'EUR', 'USD']
  },

  // ============================================
  // INFORMATIONS PAYS SOURCE
  // ============================================
  paysSource: {
    type: String,
    enum: Object.keys(COUNTRIES),
    required: true
  },
  
  telephoneSource: {
    type: String,
    trim: true
  },
  
  operateurSource: {
    type: String,
    trim: true
  },

  // ============================================
  // INFORMATIONS PAYS DESTINATION  
  // ============================================
  paysDestination: {
    type: String,
    enum: Object.keys(COUNTRIES)
  },
  
  telephoneDestination: {
    type: String,
    trim: true
  },
  
  operateurDestination: {
    type: String,
    trim: true
  },

  // ============================================
  // RELATIONS
  // ============================================
  walletSourceId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Wallet',
    required: false
  },
  walletDestinationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Wallet',
    required: false
  },
  utilisateurSourceId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false
  },
  utilisateurDestinationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false
  },
  
  description: {
    type: String,
    trim: true,
    maxlength: [200, 'La description ne peut pas dépasser 200 caractères']
  },
  
  statut: {
    type: String,
    enum: Object.values(TRANSACTION_STATUS),
    default: TRANSACTION_STATUS.PENDING
  },
  
  messageErreur: {
    type: String,
    trim: true
  },

  // ============================================
  // FRAIS ET CONVERSION
  // ============================================
  fraisTransaction: {
    type: Number,
    default: 0,
    min: 0
  },
  
  tauxFrais: {
    type: Number,
    default: 0
  },
  
  // Pour les transferts cross-border
  tauxChange: {
    type: Number,
    default: 1
  },
  
  montantConverti: {
    type: Number
  },
  
  deviseDestination: {
    type: String,
    enum: ['XOF', 'XAF', 'EUR', 'USD']
  },

  // ============================================
  // SOLDES AVANT/APRES
  // ============================================
  soldeAvantSource: {
    type: Number,
    default: 0
  },
  soldeApresSource: {
    type: Number,
    default: 0
  },
  soldeAvantDestination: {
    type: Number,
    default: 0
  },
  soldeApresDestination: {
    type: Number,
    default: 0
  },

  // ============================================
  // MOBILE MONEY PROVIDER INFO
  // ============================================
  providerTransaction: {
    providerId: String,         // ID de transaction chez le provider
    providerName: String,       // Nom du provider (Orange Money, MTN, etc.)
    providerStatus: String,     // Statut côté provider
    providerResponse: mongoose.Schema.Types.Mixed
  },

  // ============================================
  // METADATA
  // ============================================
  referenceExterne: {
    type: String,
    trim: true
  },
  
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  
  // IP et device pour sécurité
  ipAddress: String,
  userAgent: String,
  
  // PIN vérifié pour cette transaction
  pinVerified: {
    type: Boolean,
    default: false
  },

  dateCreation: {
    type: Date,
    default: Date.now
  },
  
  dateTraitement: Date,
  dateAnnulation: Date
}, {
  timestamps: true
});

// Index pour les recherches (reference a déjà unique:true donc pas besoin de l'indexer ici)
transactionSchema.index({ walletSourceId: 1, dateCreation: -1 });
transactionSchema.index({ walletDestinationId: 1, dateCreation: -1 });
transactionSchema.index({ utilisateurSourceId: 1, dateCreation: -1 });
transactionSchema.index({ utilisateurDestinationId: 1, dateCreation: -1 });
transactionSchema.index({ type: 1, dateCreation: -1 });
transactionSchema.index({ statut: 1, dateCreation: -1 });
transactionSchema.index({ paysSource: 1, dateCreation: -1 });
transactionSchema.index({ paysDestination: 1, dateCreation: -1 });
transactionSchema.index({ referenceExterne: 1 }, { sparse: true });
transactionSchema.index({ 'providerTransaction.providerId': 1 }, { sparse: true });

// Générer référence unique AVANT validation
transactionSchema.pre('validate', function() {
  if (!this.reference) {
    this.reference = transactionSchema.statics.genererReference();
  }
});

// Hook pre-save pour autres modifications
transactionSchema.pre('save', function() {
  // Si transfert cross-border, définir le type
  if (this.type === 'TRANSFER' && this.paysSource && this.paysDestination && this.paysSource !== this.paysDestination) {
    this.type = 'CROSS_BORDER';
  }
  
  // Définir devise destination si non définie
  if (!this.deviseDestination && this.paysDestination) {
    const countryDest = getCountry(this.paysDestination);
    if (countryDest) {
      this.deviseDestination = countryDest.devise;
    }
  }
});

transactionSchema.statics.genererReference = function () {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 7).toUpperCase();
  return `TXN-${timestamp}-${random}`;
};

// Vérifier si la transaction est cross-border
transactionSchema.methods.isCrossBorder = function() {
  return this.paysSource && this.paysDestination && this.paysSource !== this.paysDestination;
};

// Calculer les frais selon le pays et type
transactionSchema.methods.calculerFrais = function () {
  if (this.paysSource) {
    this.fraisTransaction = calculateFees(
      this.montant, 
      this.type, 
      this.paysSource, 
      this.paysDestination
    );
    this.tauxFrais = (this.fraisTransaction / this.montant) * 100;
  } else {
    const pourcentageFrais = parseFloat(process.env.TRANSACTION_FEE_PERCENT) || 0;
    this.fraisTransaction = (this.montant * pourcentageFrais) / 100;
  }
  return this.fraisTransaction;
};

transactionSchema.virtual('montantTotal').get(function () {
  return this.montant + this.fraisTransaction;
});

transactionSchema.methods.marquerReussie = async function (soldeAvantSource, soldeApresSource, soldeAvantDestination, soldeApresDestination) {
  this.statut = TRANSACTION_STATUS.SUCCESS;
  this.dateTraitement = new Date();
  this.soldeAvantSource = soldeAvantSource || 0;
  this.soldeApresSource = soldeApresSource || 0;
  this.soldeAvantDestination = soldeAvantDestination || 0;
  this.soldeApresDestination = soldeApresDestination || 0;
  await this.save();
};

transactionSchema.methods.marquerEchouee = async function (messageErreur) {
  this.statut = TRANSACTION_STATUS.FAILED;
  this.dateTraitement = new Date();
  this.messageErreur = messageErreur;
  await this.save();
};

transactionSchema.methods.marquerAnnulee = async function (raison) {
  this.statut = TRANSACTION_STATUS.CANCELLED;
  this.dateAnnulation = new Date();
  this.messageErreur = raison || 'Transaction annulée';
  await this.save();
};

transactionSchema.methods.obtenirResume = function () {
  return {
    id: this._id,
    reference: this.reference,
    type: this.type,
    montant: this.montant,
    frais: this.fraisTransaction,
    montantTotal: this.montant + this.fraisTransaction,
    devise: this.devise,
    paysSource: this.paysSource,
    paysDestination: this.paysDestination,
    statut: this.statut,
    description: this.description,
    date: this.dateCreation,
    isCrossBorder: this.isCrossBorder()
  };
};

transactionSchema.statics.obtenirParWallet = async function (walletId, options = {}) {
  const {
    type = null,
    startDate = null,
    endDate = null,
    limit = 50,
    skip = 0
  } = options;

  const query = {
    $or: [
      { walletSourceId: walletId },
      { walletDestinationId: walletId }
    ]
  };

  if (type) {
    query.type = type;
  }

  if (startDate || endDate) {
    query.dateCreation = {};
    if (startDate) query.dateCreation.$gte = new Date(startDate);
    if (endDate) query.dateCreation.$lte = new Date(endDate);
  }

  return await this.find(query)
    .sort({ dateCreation: -1 })
    .limit(limit)
    .skip(skip)
    .populate('utilisateurSourceId', 'nomComplet telephone')
    .populate('utilisateurDestinationId', 'nomComplet telephone');
};

transactionSchema.statics.obtenirStatistiques = async function (walletId, periode = 30) {
  const dateDebut = new Date();
  dateDebut.setDate(dateDebut.getDate() - periode);

  const stats = await this.aggregate([
    {
      $match: {
        $or: [
          { walletSourceId: new mongoose.Types.ObjectId(walletId) },
          { walletDestinationId: new mongoose.Types.ObjectId(walletId) }
        ],
        dateCreation: { $gte: dateDebut },
        statut: TRANSACTION_STATUS.SUCCESS
      }
    },
    {
      $group: {
        _id: '$type',
        count: { $sum: 1 },
        totalMontant: { $sum: '$montant' },
        totalFrais: { $sum: '$fraisTransaction' }
      }
    }
  ]);

  return stats;
};

// Statistiques par pays
transactionSchema.statics.obtenirStatistiquesParPays = async function (periode = 30) {
  const dateDebut = new Date();
  dateDebut.setDate(dateDebut.getDate() - periode);

  const stats = await this.aggregate([
    {
      $match: {
        dateCreation: { $gte: dateDebut },
        statut: TRANSACTION_STATUS.SUCCESS
      }
    },
    {
      $group: {
        _id: { paysSource: '$paysSource', type: '$type' },
        count: { $sum: 1 },
        totalMontant: { $sum: '$montant' },
        totalFrais: { $sum: '$fraisTransaction' }
      }
    },
    {
      $sort: { '_id.paysSource': 1, 'totalMontant': -1 }
    }
  ]);

  return stats;
};

const Transaction = mongoose.model('Transaction', transactionSchema);

// Exports
module.exports = Transaction;
module.exports.TRANSACTION_TYPES = TRANSACTION_TYPES;
module.exports.TRANSACTION_STATUS = TRANSACTION_STATUS;