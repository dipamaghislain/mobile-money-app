// backend/src/models/Notification.js
// Modèle pour stocker les notifications utilisateur

const mongoose = require('mongoose');

const NOTIFICATION_TYPES = {
  TRANSACTION: 'transaction',
  SECURITY: 'security',
  PROMO: 'promo',
  SYSTEM: 'system',
  KYC: 'kyc'
};

const NOTIFICATION_CHANNELS = {
  PUSH: 'push',
  SMS: 'sms',
  EMAIL: 'email',
  IN_APP: 'in_app'
};

const notificationSchema = new mongoose.Schema({
  utilisateurId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  
  type: {
    type: String,
    enum: Object.values(NOTIFICATION_TYPES),
    default: NOTIFICATION_TYPES.SYSTEM
  },

  titre: {
    type: String,
    required: true,
    maxlength: 100
  },

  message: {
    type: String,
    required: true,
    maxlength: 500
  },

  // Données supplémentaires (ex: transactionId, lien)
  data: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },

  // Canal de notification
  canal: {
    type: String,
    enum: Object.values(NOTIFICATION_CHANNELS),
    default: NOTIFICATION_CHANNELS.IN_APP
  },

  // Statuts
  lu: {
    type: Boolean,
    default: false
  },

  dateLecture: Date,

  // Pour les notifications envoyées par SMS/Email
  envoye: {
    type: Boolean,
    default: false
  },

  dateEnvoi: Date,

  erreurEnvoi: String

}, {
  timestamps: true
});

// Index pour récupérer les notifications récentes non lues
notificationSchema.index({ utilisateurId: 1, lu: 1, createdAt: -1 });
notificationSchema.index({ createdAt: 1 }, { expireAfterSeconds: 30 * 24 * 60 * 60 }); // TTL 30 jours

// Méthodes statiques
notificationSchema.statics.creerNotification = async function(data) {
  return this.create(data);
};

notificationSchema.statics.getNotificationsNonLues = async function(utilisateurId) {
  return this.find({ utilisateurId, lu: false })
    .sort({ createdAt: -1 })
    .limit(50);
};

notificationSchema.statics.compterNonLues = async function(utilisateurId) {
  return this.countDocuments({ utilisateurId, lu: false });
};

notificationSchema.statics.marquerCommeLues = async function(utilisateurId, notificationIds = null) {
  const query = { utilisateurId, lu: false };
  if (notificationIds && notificationIds.length > 0) {
    query._id = { $in: notificationIds };
  }
  return this.updateMany(query, { 
    $set: { lu: true, dateLecture: new Date() }
  });
};

// Méthode pour formater la notification
notificationSchema.methods.toJSON = function() {
  return {
    id: this._id,
    type: this.type,
    titre: this.titre,
    message: this.message,
    data: this.data,
    lu: this.lu,
    date: this.createdAt,
    dateLecture: this.dateLecture
  };
};

const Notification = mongoose.model('Notification', notificationSchema);

module.exports = Notification;
module.exports.NOTIFICATION_TYPES = NOTIFICATION_TYPES;
module.exports.NOTIFICATION_CHANNELS = NOTIFICATION_CHANNELS;
