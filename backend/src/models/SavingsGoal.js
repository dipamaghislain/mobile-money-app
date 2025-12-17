// backend/src/models/SavingsGoal.js

const mongoose = require('mongoose');

const savingsGoalSchema = new mongoose.Schema({
  utilisateurId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'L\'ID utilisateur est requis']
  },
  nom: {
    type: String,
    required: [true, 'Le nom de la tirelire est requis'],
    trim: true,
    maxlength: [100, 'Le nom ne peut pas dépasser 100 caractères']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [500, 'La description ne peut pas dépasser 500 caractères']
  },
  objectifMontant: {
    type: Number,
    required: false,
    min: [0, 'L\'objectif doit être positif'],
    default: null
  },
  montantActuel: {
    type: Number,
    default: 0,
    min: [0, 'Le montant ne peut pas être négatif']
  },
  devise: {
    type: String,
    default: 'XOF',
    enum: ['XOF', 'EUR', 'USD']
  },
  statut: {
    type: String,
    enum: ['actif', 'termine', 'annule'],
    default: 'actif'
  },
  dateObjectif: {
    type: Date,
    required: false
  },
  icone: {
    type: String,
    default: 'piggy-bank'
  },
  couleur: {
    type: String,
    default: '#4CAF50'
  },
  dateCreation: {
    type: Date,
    default: Date.now
  },
  dateMiseAJour: {
    type: Date,
    default: Date.now
  },
  dateCompletion: {
    type: Date,
    default: null
  }
}, {
  timestamps: true
});

savingsGoalSchema.index({ utilisateurId: 1, dateCreation: -1 });
savingsGoalSchema.index({ statut: 1 });

savingsGoalSchema.pre('save', function(next) {
  this.dateMiseAJour = Date.now();
  next();
});

savingsGoalSchema.virtual('pourcentageProgression').get(function() {
  if (!this.objectifMontant || this.objectifMontant === 0) {
    return 0;
  }
  const pourcentage = (this.montantActuel / this.objectifMontant) * 100;
  return Math.min(Math.round(pourcentage * 100) / 100, 100);
});

savingsGoalSchema.virtual('montantRestant').get(function() {
  if (!this.objectifMontant) {
    return null;
  }
  const restant = this.objectifMontant - this.montantActuel;
  return Math.max(restant, 0);
});

savingsGoalSchema.virtual('objectifAtteint').get(function() {
  if (!this.objectifMontant) {
    return false;
  }
  return this.montantActuel >= this.objectifMontant;
});

savingsGoalSchema.methods.ajouterMontant = async function(montant) {
  if (montant <= 0) {
    throw new Error('Le montant doit être positif');
  }
  
  if (this.statut !== 'actif') {
    throw new Error('Cette tirelire n\'est pas active');
  }

  this.montantActuel += montant;
  this.dateMiseAJour = Date.now();

  if (this.objectifMontant && this.montantActuel >= this.objectifMontant) {
    this.statut = 'termine';
    this.dateCompletion = Date.now();
  }

  await this.save();
  return this.montantActuel;
};

savingsGoalSchema.methods.retirerMontant = async function(montant) {
  if (montant <= 0) {
    throw new Error('Le montant doit être positif');
  }

  if (this.montantActuel < montant) {
    throw new Error('Montant insuffisant dans la tirelire');
  }

  this.montantActuel -= montant;
  this.dateMiseAJour = Date.now();

  if (this.statut === 'termine') {
    this.statut = 'actif';
    this.dateCompletion = null;
  }

  await this.save();
  return this.montantActuel;
};

savingsGoalSchema.methods.annuler = async function() {
  if (this.montantActuel > 0) {
    throw new Error('Impossible d\'annuler une tirelire contenant de l\'argent. Retirez d\'abord les fonds.');
  }
  
  this.statut = 'annule';
  await this.save();
};

savingsGoalSchema.methods.obtenirResume = function() {
  return {
    id: this._id,
    nom: this.nom,
    description: this.description,
    montantActuel: this.montantActuel,
    objectifMontant: this.objectifMontant,
    pourcentageProgression: this.pourcentageProgression,
    montantRestant: this.montantRestant,
    objectifAtteint: this.objectifAtteint,
    statut: this.statut,
    devise: this.devise,
    icone: this.icone,
    couleur: this.couleur,
    dateCreation: this.dateCreation,
    dateObjectif: this.dateObjectif
  };
};

savingsGoalSchema.statics.obtenirParUtilisateur = async function(utilisateurId, options = {}) {
  const {
    statut = null,
    limit = 20,
    skip = 0
  } = options;

  const query = { utilisateurId };
  
  if (statut) {
    query.statut = statut;
  }

  return await this.find(query)
    .sort({ dateCreation: -1 })
    .limit(limit)
    .skip(skip);
};

// ✅ CORRECTION ICI - Ligne 189 et 203
savingsGoalSchema.statics.obtenirStatistiques = async function(utilisateurId) {
  const stats = await this.aggregate([
    {
      $match: { utilisateurId: new mongoose.Types.ObjectId(utilisateurId) }  // ✅ Correction
    },
    {
      $group: {
        _id: '$statut',
        count: { $sum: 1 },
        totalEpargne: { $sum: '$montantActuel' },
        totalObjectif: { $sum: '$objectifMontant' }
      }
    }
  ]);

  const totalGlobal = await this.aggregate([
    {
      $match: { 
        utilisateurId: new mongoose.Types.ObjectId(utilisateurId),  // ✅ Correction
        statut: { $in: ['actif', 'termine'] }
      }
    },
    {
      $group: {
        _id: null,
        totalEpargne: { $sum: '$montantActuel' },
        nombreTirelires: { $sum: 1 }
      }
    }
  ]);

  return {
    parStatut: stats,
    global: totalGlobal[0] || { totalEpargne: 0, nombreTirelires: 0 }
  };
};

savingsGoalSchema.set('toJSON', { virtuals: true });
savingsGoalSchema.set('toObject', { virtuals: true });

const SavingsGoal = mongoose.model('SavingsGoal', savingsGoalSchema);

module.exports = SavingsGoal;