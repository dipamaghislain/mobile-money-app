// backend/src/models/User.js

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    nomComplet: {
      type: String,
      required: [true, 'Le nom complet est requis'],
      trim: true,
    },
    telephone: {
      type: String,
      required: [true, 'Le numéro de téléphone est requis'],
      unique: true,
      trim: true,
      match: [/^[0-9]{8,15}$/, 'Numéro de téléphone invalide'],
    },
    email: {
      type: String,
      required: [true, "L'email est requis"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Email invalide'],
    },
    motDePasse: {
      type: String,
      required: [true, 'Le mot de passe est requis'],
      minlength: [6, 'Le mot de passe doit contenir au moins 6 caractères'],
      select: false, // ne pas renvoyer le mot de passe par défaut
    },
    role: {
      type: String,
      enum: ['client', 'marchand', 'admin'],
      default: 'client',
    },
    statut: {
      type: String,
      enum: ['actif', 'bloque'],
      default: 'actif',
    },
    codeMarchand: {
      type: String,
      unique: true,
      sparse: true, // unique seulement s'il existe
      trim: true,
    },
    nomCommerce: {
      type: String,
      trim: true,
    },
    adresse: {
      type: String,
      trim: true,
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
    timestamps: true, // createdAt / updatedAt en plus
  }
);

// ⚠️ PAS de userSchema.index(...) ici,
// pour éviter les warnings "Duplicate schema index".
// Les `unique: true` créent déjà les index nécessaires.

// Hash du mot de passe avant sauvegarde
userSchema.pre('save', async function () {
  // ne hasher que si le mot de passe a changé
  if (!this.isModified('motDePasse')) return;

  const salt = await bcrypt.genSalt(10);
  this.motDePasse = await bcrypt.hash(this.motDePasse, salt);
});

// Mise à jour de la date de modification
userSchema.pre('save', function () {
  this.dateMiseAJour = Date.now();
});

// Comparer un mot de passe en clair avec le hash
userSchema.methods.comparePassword = async function (motDePasseCandidat) {
  return bcrypt.compare(motDePasseCandidat, this.motDePasse);
};

// Générer un code marchand unique
userSchema.methods.generateCodeMarchand = function () {
  if (this.codeMarchand) return this.codeMarchand;

  const prefix = 'MERC';
  const randomNum = Math.floor(100000 + Math.random() * 900000);
  this.codeMarchand = `${prefix}-${randomNum}`;
  return this.codeMarchand;
};

// Nettoyer l'objet renvoyé (pas de mot de passe, pas de __v)
userSchema.methods.toJSON = function () {
  const user = this.toObject();
  delete user.motDePasse;
  delete user.__v;
  return user;
};

const User = mongoose.model('User', userSchema);

module.exports = User;
