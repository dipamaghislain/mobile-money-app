// backend/scripts/create-admin.js
// Usage:
// ADMIN_EMAIL=admin@example.com ADMIN_PASSWORD=secret ADMIN_NAME="Admin User" node scripts/create-admin.js

require('dotenv').config();
const mongoose = require('mongoose');
const path = require('path');

const { validateEnv } = require('../src/config/env');

(async () => {
  try {
    // Attempt to validate env (will warn in dev)
    try { validateEnv(); } catch (e) { console.warn(e.message); }

    const MONGO = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/mobile_money_dev';

    console.log('Connexion à MongoDB ->', MONGO);
    // Mongoose v6+ gère les options de parsing en interne — ne pas passer
    // les anciennes options `useNewUrlParser` / `useUnifiedTopology`.
    await mongoose.connect(MONGO);

    // Load models
    const User = require('../src/models/User');
    const Wallet = require('../src/models/Wallet');

    const email = process.env.ADMIN_EMAIL || 'admin@example.com';
    const motDePasse = process.env.ADMIN_PASSWORD || 'admin123';
    const nomComplet = process.env.ADMIN_NAME || 'Administrateur';
    // Si la base a un index unique sur `telephone` avec des nulls, la création
    // peut échouer. Fournir un numéro de téléphone temporaire valide et unique
    // si `ADMIN_TELEPHONE` n'est pas fourni.
    const adminTelephone = process.env.ADMIN_TELEPHONE || ('999' + Date.now().toString().slice(-8));

    console.log(`Recherche d'un utilisateur avec l'email ${email} ...`);
    let existing = await User.findOne({ email: email.toLowerCase().trim() });

    if (existing) {
      if (existing.role === 'admin') {
        console.log('Un admin avec cet email existe déjà :', existing.email);
        process.exit(0);
      } else {
        console.log('Un utilisateur existe avec cet email mais n\'est pas admin. Mise à jour du rôle...');
        existing.role = 'admin';
        if (motDePasse) existing.motDePasse = motDePasse;
        if (nomComplet) existing.nomComplet = nomComplet;
        await existing.save();

        // Ensure wallet exists
        const wallet = await Wallet.findOne({ utilisateurId: existing._id });
        if (!wallet) {
          await Wallet.create({ utilisateurId: existing._id, solde: 0, devise: process.env.DEFAULT_CURRENCY || 'XOF' });
        }

        console.log('Utilisateur promu en admin et informations mises à jour. Email:', existing.email);
        process.exit(0);
      }
    }

    console.log('Création d\'un nouvel admin...');
    const user = await User.create({ nomComplet, email: email.toLowerCase().trim(), motDePasse, role: 'admin', telephone: adminTelephone });

    await Wallet.create({ utilisateurId: user._id, solde: 0, devise: process.env.DEFAULT_CURRENCY || 'XOF' });

    console.log('Admin créé avec succès :');
    console.log({ email: user.email, nomComplet: user.nomComplet, role: user.role });
    console.log('Vous pouvez maintenant vous connecter avec cet utilisateur.');

    process.exit(0);
  } catch (err) {
    console.error('Erreur lors de la création de l\'admin:', err);
    process.exit(1);
  }
})();
