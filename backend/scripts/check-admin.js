// Script pour vérifier le compte admin
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('../src/config/env');
require('../src/config/database');

setTimeout(async () => {
  try {
    const User = require('../src/models/User');
    const admin = await User.findOne({ email: 'admin@example.com' }).select('+motDePasse');
    
    if (!admin) {
      console.log('❌ Admin non trouvé dans la base de données');
      process.exit(1);
    }
    
    console.log('📋 Admin trouvé:');
    console.log('   - ID:', admin._id);
    console.log('   - Email:', admin.email);
    console.log('   - Role:', admin.role);
    console.log('   - Statut:', admin.statut);
    console.log('   - Bloque Jusqua:', admin.bloqueJusqua);
    console.log('   - Tentatives echouees:', admin.tentativesEchouees);
    console.log('   - Mot de passe (hash):', admin.motDePasse ? admin.motDePasse.substring(0, 25) + '...' : 'NON DEFINI');
    
    // Test du mot de passe
    const testPassword = 'Admin123!';
    const isValid = await bcrypt.compare(testPassword, admin.motDePasse);
    console.log('');
    console.log('🔑 Test mot de passe "Admin123!":', isValid ? '✅ VALIDE' : '❌ INVALIDE');
    
    if (!isValid) {
      console.log('');
      console.log('⚠️  Le mot de passe ne correspond pas. Reinitialisation...');
      
      const hashedPassword = await bcrypt.hash('Admin123!', 10);
      await User.updateOne(
        { email: 'admin@example.com' },
        { 
          $set: { 
            motDePasse: hashedPassword,
            statut: 'actif',
            bloqueJusqua: null,
            tentativesEchouees: 0
          }
        }
      );
      console.log('✅ Mot de passe reinitialise a "Admin123!"');
    }
    
    process.exit(0);
  } catch (err) {
    console.error('Erreur:', err.message);
    process.exit(1);
  }
}, 2000);
