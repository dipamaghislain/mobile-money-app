// backend/scripts/reset-admin-password.js
// Usage:
// ADMIN_EMAIL=admin@local.test ADMIN_PASSWORD='newPass' node scripts/reset-admin-password.js

require('dotenv').config();
const mongoose = require('mongoose');
const { validateEnv } = require('../src/config/env');

(async () => {
  try {
    try { validateEnv(); } catch (e) { console.warn(e.message); }

    const MONGO = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/mobile_money';
    console.log('Connexion à MongoDB ->', MONGO);
    await mongoose.connect(MONGO);

    const User = require('../src/models/User');

    const email = (process.env.ADMIN_EMAIL || 'admin@local.test').toLowerCase().trim();
    const newPass = process.env.ADMIN_PASSWORD || 'admin1234!';

    console.log(`Recherche de l'utilisateur ${email}...`);
    const user = await User.findOne({ email }).select('+motDePasse');
    if (!user) {
      console.error('Utilisateur non trouvé:', email);
      process.exit(2);
    }

    user.motDePasse = newPass;
    await user.save();

    console.log('Mot de passe mis à jour avec succès pour', email);
    process.exit(0);
  } catch (err) {
    console.error('Erreur lors de la réinitialisation du mot de passe:', err);
    process.exit(1);
  }
})();
