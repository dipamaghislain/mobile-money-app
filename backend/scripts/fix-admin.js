// Script pour réinitialiser le mot de passe admin
require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

async function fixAdmin() {
  try {
    await mongoose.connect('mongodb://localhost:27017/mobile_money');
    console.log('Connecté à MongoDB');

    const hash = await bcrypt.hash('Admin123!', 10);
    
    const result = await mongoose.connection.db.collection('users').updateOne(
      { email: 'admin@example.com' },
      { 
        $set: { 
          motDePasse: hash, 
          compteurTentatives: 0, 
          dateVerrouillage: null,
          isActive: true
        },
        $unset: {
          blockedUntil: '',
          lockUntil: ''
        }
      }
    );

    if (result.modifiedCount > 0) {
      console.log('✅ Mot de passe réinitialisé avec succès!');
      console.log('Email: admin@example.com');
      console.log('Mot de passe: Admin123!');
    } else {
      console.log('⚠️ Utilisateur non trouvé ou déjà à jour');
    }

    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('Erreur:', err.message);
    process.exit(1);
  }
}

fixAdmin();
