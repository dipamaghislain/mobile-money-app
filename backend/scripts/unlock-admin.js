// Script pour débloquer le compte admin
require('dotenv').config();
const mongoose = require('mongoose');

(async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/mobile_money');
    console.log('Connecté à MongoDB');

    const result = await mongoose.connection.db.collection('users').updateOne(
      { email: 'admin@example.com' },
      { 
        $set: { 
          loginAttempts: 0, 
          isActive: true
        },
        $unset: { lockUntil: "" }
      }
    );

    console.log('Résultat:', result.modifiedCount > 0 ? 'Compte débloqué avec succès!' : 'Aucune modification');
    
    // Vérifier l'utilisateur
    const user = await mongoose.connection.db.collection('users').findOne({ email: 'admin@example.com' });
    console.log('Utilisateur:', {
      email: user.email,
      role: user.role,
      loginAttempts: user.loginAttempts,
      lockUntil: user.lockUntil,
      isActive: user.isActive
    });

    await mongoose.disconnect();
  } catch (err) {
    console.error('Erreur:', err.message);
    process.exit(1);
  }
})();
