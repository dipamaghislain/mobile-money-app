// backend/src/models/Transaction.js

const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  type: {
    type: String,
    required: [true, 'Le type de transaction est requis'],
    enum: ['DEPOSIT', 'WITHDRAW', 'TRANSFER', 'MERCHANT_PAYMENT', 'EPARGNE_IN', 'EPARGNE_OUT']
  },
  montant: {
    type: Number,
    required: [true, 'Le montant est requis'],
    min: [0, 'Le montant doit être positif']
  },
  devise: {
    type: String,
    default: 'XOF',
    enum: ['XOF', 'EUR', 'USD']
  },
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
    enum: ['SUCCES', 'ECHEC', 'EN_ATTENTE'],
    default: 'EN_ATTENTE'
  },
  messageErreur: {
    type: String,
    trim: true
  },
  fraisTransaction: {
    type: Number,
    default: 0,
    min: 0
  },
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
  referenceExterne: {
    type: String,
    trim: true
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  dateCreation: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

transactionSchema.index({ walletSourceId: 1, dateCreation: -1 });
transactionSchema.index({ walletDestinationId: 1, dateCreation: -1 });
transactionSchema.index({ utilisateurSourceId: 1, dateCreation: -1 });
transactionSchema.index({ utilisateurDestinationId: 1, dateCreation: -1 });
transactionSchema.index({ type: 1, dateCreation: -1 });
transactionSchema.index({ statut: 1, dateCreation: -1 });
// Index sur referenceExterne (sparse car la référence est optionnelle)
transactionSchema.index({ referenceExterne: 1 }, { sparse: true });

transactionSchema.statics.genererReference = function() {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 7).toUpperCase();
  return `TXN-${timestamp}-${random}`;
};

transactionSchema.methods.marquerReussie = async function(soldeAvantSource, soldeApresSource, soldeAvantDestination, soldeApresDestination) {
  this.statut = 'SUCCES';
  this.soldeAvantSource = soldeAvantSource || 0;
  this.soldeApresSource = soldeApresSource || 0;
  this.soldeAvantDestination = soldeAvantDestination || 0;
  this.soldeApresDestination = soldeApresDestination || 0;
  await this.save();
};

transactionSchema.methods.marquerEchouee = async function(messageErreur) {
  this.statut = 'ECHEC';
  this.messageErreur = messageErreur;
  await this.save();
};

transactionSchema.methods.calculerFrais = function() {
  const pourcentageFrais = parseFloat(process.env.TRANSACTION_FEE_PERCENT) || 0;
  
  if (pourcentageFrais > 0) {
    this.fraisTransaction = (this.montant * pourcentageFrais) / 100;
  } else {
    this.fraisTransaction = 0;
  }
  
  return this.fraisTransaction;
};

transactionSchema.virtual('montantTotal').get(function() {
  return this.montant + this.fraisTransaction;
});

transactionSchema.methods.obtenirResume = function() {
  return {
    id: this._id,
    type: this.type,
    montant: this.montant,
    frais: this.fraisTransaction,
    montantTotal: this.montant + this.fraisTransaction,
    devise: this.devise,
    statut: this.statut,
    description: this.description,
    date: this.dateCreation
  };
};

transactionSchema.statics.obtenirParWallet = async function(walletId, options = {}) {
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

transactionSchema.statics.obtenirStatistiques = async function(walletId, periode = 30) {
  const dateDebut = new Date();
  dateDebut.setDate(dateDebut.getDate() - periode);

  const stats = await this.aggregate([
    {
      $match: {
        $or: [
          { walletSourceId: new mongoose.Types.ObjectId(walletId) },  // ✅ Ajout de 'new'
          { walletDestinationId: new mongoose.Types.ObjectId(walletId) }  // ✅ Ajout de 'new'
        ],
        dateCreation: { $gte: dateDebut },
        statut: 'SUCCES'
      }
    },
    {
      $group: {
        _id: '$type',
        count: { $sum: 1 },
        totalMontant: { $sum: '$montant' }
      }
    }
  ]);

  return stats;
};
const Transaction = mongoose.model('Transaction', transactionSchema);

module.exports = Transaction;