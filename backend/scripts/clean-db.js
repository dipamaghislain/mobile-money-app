// Script de nettoyage de la base de données
const mongoose = require('mongoose');
require('dotenv').config();

async function cleanDatabase() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/mobile_money');
    console.log('=== Nettoyage COMPLET de la base de données ===\n');

    // Supprimer TOUS les utilisateurs
    const result = await mongoose.connection.db.collection('users').deleteMany({});
    console.log(`✓ Tous les utilisateurs supprimés: ${result.deletedCount}`);

    // Supprimer tous les wallets
    const walletsResult = await mongoose.connection.db.collection('wallets').deleteMany({});
    console.log(`✓ Wallets supprimés: ${walletsResult.deletedCount}`);

    // Supprimer toutes les transactions
    const transResult = await mongoose.connection.db.collection('transactions').deleteMany({});
    console.log(`✓ Transactions supprimées: ${transResult.deletedCount}`);

    // Compter les utilisateurs restants
    const remaining = await mongoose.connection.db.collection('users').countDocuments();
    console.log(`\nUtilisateurs restants: ${remaining}`);

    console.log('\n=== Base de données nettoyée ! ===');
    console.log('Vous pouvez maintenant créer un nouveau compte.');
    
    process.exit(0);
  } catch (error) {
    console.error('Erreur:', error.message);
    process.exit(1);
  }
}

cleanDatabase();
