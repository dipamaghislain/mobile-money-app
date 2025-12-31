// backend/src/models/SystemParameter.js

const mongoose = require('mongoose');

const systemParameterSchema = new mongoose.Schema({
  // Limites de transactions
  plafondRetraitJour: {
    type: Number,
    default: 1000000,
    min: 0
  },
  plafondTransfertOperation: {
    type: Number,
    default: 500000,
    min: 0
  },
  plafondDepotJour: {
    type: Number,
    default: 5000000,
    min: 0
  },
  montantMinTransaction: {
    type: Number,
    default: 100,
    min: 0
  },
  montantMaxTransaction: {
    type: Number,
    default: 500000,
    min: 0
  },

  // Sécurité PIN
  nbMaxTentativesPIN: {
    type: Number,
    default: 3,
    min: 1,
    max: 10
  },
  delaiBlocagePIN: {
    type: Number,
    default: 30,
    min: 1,
    max: 1440
  },
  longueurPIN: {
    type: Number,
    default: 4,
    min: 4,
    max: 6
  },

  // Frais de transaction
  fraisTransfert: {
    type: Number,
    default: 0,
    min: 0
  },
  fraisRetrait: {
    type: Number,
    default: 0,
    min: 0
  },
  fraisPaiementMarchand: {
    type: Number,
    default: 0,
    min: 0
  },
  pourcentageFraisTransaction: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },

  // Devise
  deviseParDefaut: {
    type: String,
    default: 'XOF',
    enum: ['XOF', 'EUR', 'USD']
  },
  devisesAcceptees: {
    type: [String],
    default: ['XOF'],
    enum: ['XOF', 'EUR', 'USD']
  },

  // Délais et temporisations
  delaiExpirationToken: {
    type: Number,
    default: 7,
    min: 1
  },
  delaiExpirationOTP: {
    type: Number,
    default: 10,
    min: 1,
    max: 60
  },

  // Maintenance
  modeMaintenanceActif: {
    type: Boolean,
    default: false
  },
  messageMaintenance: {
    type: String,
    default: 'Le système est en maintenance. Veuillez réessayer plus tard.'
  },

  // Notifications
  notificationsEmail: {
    type: Boolean,
    default: true
  },
  notificationsSMS: {
    type: Boolean,
    default: true
  },

  // Metadata
  version: {
    type: String,
    default: '1.0.0'
  },
  dateMiseAJour: {
    type: Date,
    default: Date.now
  },
  modifiePar: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Il ne devrait y avoir qu'un seul document de paramètres système
// Créer un index unique pour s'assurer de cela
systemParameterSchema.index({ version: 1 }, { unique: true });

// Middleware pre-save
systemParameterSchema.pre('save', function() {
  this.dateMiseAJour = Date.now();
});

// Méthode statique pour obtenir les paramètres système
systemParameterSchema.statics.obtenirParametres = async function() {
  let params = await this.findOne();
  
  // Si aucun paramètre n'existe, en créer un avec les valeurs par défaut
  if (!params) {
    params = await this.create({});
  }
  
  return params;
};

// Méthode statique pour mettre à jour les paramètres
systemParameterSchema.statics.mettreAJourParametres = async function(nouvellesValeurs, userId) {
  let params = await this.obtenirParametres();
  
  // Mettre à jour les valeurs
  Object.keys(nouvellesValeurs).forEach(key => {
    if (params.schema.paths[key]) {
      params[key] = nouvellesValeurs[key];
    }
  });
  
  params.modifiePar = userId;
  params.dateMiseAJour = Date.now();
  
  await params.save();
  return params;
};

// Méthode pour vérifier si le montant respecte les limites
systemParameterSchema.methods.verifierMontantValide = function(montant, type = 'transaction') {
  if (montant < this.montantMinTransaction) {
    return {
      valide: false,
      message: `Le montant minimum est de ${this.montantMinTransaction} ${this.deviseParDefaut}`
    };
  }

  let limite;
  switch (type) {
    case 'retrait':
      limite = this.plafondRetraitJour;
      break;
    case 'transfert':
      limite = this.plafondTransfertOperation;
      break;
    case 'depot':
      limite = this.plafondDepotJour;
      break;
    default:
      limite = this.montantMaxTransaction;
  }

  if (montant > limite) {
    return {
      valide: false,
      message: `Le montant maximum pour cette opération est de ${limite} ${this.deviseParDefaut}`
    };
  }

  return { valide: true };
};

// Méthode pour calculer les frais selon le type de transaction
systemParameterSchema.methods.calculerFrais = function(montant, type = 'transfert') {
  let fraisFixes = 0;
  
  switch (type) {
    case 'transfert':
      fraisFixes = this.fraisTransfert;
      break;
    case 'retrait':
      fraisFixes = this.fraisRetrait;
      break;
    case 'paiement_marchand':
      fraisFixes = this.fraisPaiementMarchand;
      break;
    default:
      fraisFixes = 0;
  }

  const fraisPourcentage = (montant * this.pourcentageFraisTransaction) / 100;
  
  return fraisFixes + fraisPourcentage;
};

// Méthode pour vérifier si le système est en maintenance
systemParameterSchema.methods.estEnMaintenance = function() {
  return this.modeMaintenanceActif;
};

// Méthode pour obtenir un résumé des paramètres
systemParameterSchema.methods.obtenirResume = function() {
  return {
    limites: {
      montantMin: this.montantMinTransaction,
      montantMax: this.montantMaxTransaction,
      plafondRetraitJour: this.plafondRetraitJour,
      plafondTransfert: this.plafondTransfertOperation,
      plafondDepot: this.plafondDepotJour
    },
    securite: {
      maxTentativesPIN: this.nbMaxTentativesPIN,
      delaiBlocagePIN: this.delaiBlocagePIN,
      longueurPIN: this.longueurPIN
    },
    frais: {
      transfert: this.fraisTransfert,
      retrait: this.fraisRetrait,
      paiementMarchand: this.fraisPaiementMarchand,
      pourcentage: this.pourcentageFraisTransaction
    },
    devise: {
      defaut: this.deviseParDefaut,
      acceptees: this.devisesAcceptees
    },
    maintenance: {
      actif: this.modeMaintenanceActif,
      message: this.messageMaintenance
    }
  };
};

const SystemParameter = mongoose.model('SystemParameter', systemParameterSchema);

module.exports = SystemParameter;