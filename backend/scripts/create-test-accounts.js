// Script pour créer des comptes de test pour chaque pays
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Configuration des pays avec leurs préfixes téléphoniques
const TEST_ACCOUNTS = [
  {
    pays: 'BF',
    nom: 'Burkina Faso',
    email: 'test.bf@demo.com',
    telephone: '+22670000001',
    devise: 'XOF'
  },
  {
    pays: 'CI',
    nom: 'Côte d\'Ivoire',
    email: 'test.ci@demo.com',
    telephone: '+22507000001',
    devise: 'XOF'
  },
  {
    pays: 'SN',
    nom: 'Sénégal',
    email: 'test.sn@demo.com',
    telephone: '+22177000001',
    devise: 'XOF'
  },
  {
    pays: 'ML',
    nom: 'Mali',
    email: 'test.ml@demo.com',
    telephone: '+22370000001',
    devise: 'XOF'
  },
  {
    pays: 'CM',
    nom: 'Cameroun',
    email: 'test.cm@demo.com',
    telephone: '+23767000001',
    devise: 'XAF'
  },
  {
    pays: 'TG',
    nom: 'Togo',
    email: 'test.tg@demo.com',
    telephone: '+22890000001',
    devise: 'XOF'
  },
  {
    pays: 'BJ',
    nom: 'Bénin',
    email: 'test.bj@demo.com',
    telephone: '+22997000001',
    devise: 'XOF'
  }
];

const PASSWORD = 'Test1234';
const PIN = '1234';

async function createTestAccounts() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/mobile_money');
    console.log('\n╔══════════════════════════════════════════════════════════════════╗');
    console.log('║         CRÉATION DES COMPTES DE TEST                              ║');
    console.log('╚══════════════════════════════════════════════════════════════════╝\n');

    const usersCollection = mongoose.connection.db.collection('users');
    const walletsCollection = mongoose.connection.db.collection('wallets');

    // Hash du mot de passe et du PIN
    const hashedPassword = await bcrypt.hash(PASSWORD, 12);
    const hashedPin = await bcrypt.hash(PIN, 10);

    const createdAccounts = [];

    for (const account of TEST_ACCOUNTS) {
      // Vérifier si le compte existe déjà
      const existing = await usersCollection.findOne({ email: account.email });
      
      if (existing) {
        console.log(`⚠️  ${account.nom} (${account.pays}) - Compte existe déjà`);
        createdAccounts.push({ ...account, status: 'existant' });
        continue;
      }

      // Créer l'utilisateur
      const userId = new mongoose.Types.ObjectId();
      const user = {
        _id: userId,
        email: account.email,
        motDePasse: hashedPassword,
        nomComplet: `Utilisateur Test ${account.pays}`,
        telephone: account.telephone,
        telephoneVerifie: true,
        pays: account.pays,
        devise: account.devise,
        codePin: hashedPin,
        pinConfigured: true,
        role: 'client',
        statut: 'actif',
        kycLevel: 2,
        tentativesConnexion: 0,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      await usersCollection.insertOne(user);

      // Créer le wallet avec un solde de test
      const wallet = {
        _id: new mongoose.Types.ObjectId(),
        utilisateur: userId,
        solde: 100000, // 100,000 FCFA de solde initial
        devise: account.devise,
        actif: true,
        limiteJournaliere: 500000,
        limiteMensuelle: 5000000,
        totalDepenses: 0,
        totalRevenus: 0,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      await walletsCollection.insertOne(wallet);

      console.log(`✅ ${account.nom} (${account.pays}) - Compte créé avec succès`);
      createdAccounts.push({ ...account, status: 'créé' });
    }

    // Afficher le tableau récapitulatif
    console.log('\n');
    console.log('╔══════════════════════════════════════════════════════════════════════════════════════╗');
    console.log('║                    COMPTES DE TEST DISPONIBLES                                       ║');
    console.log('╠══════════════════════════════════════════════════════════════════════════════════════╣');
    console.log('║  Mot de passe: Test1234          |  Code PIN: 1234          |  Solde: 100,000 FCFA   ║');
    console.log('╠══════════════════════════════════════════════════════════════════════════════════════╣');
    console.log('║  PAYS              │  EMAIL                │  TÉLÉPHONE       │  DEVISE              ║');
    console.log('╠══════════════════════════════════════════════════════════════════════════════════════╣');
    
    for (const acc of TEST_ACCOUNTS) {
      const paysStr = acc.nom.padEnd(18);
      const emailStr = acc.email.padEnd(21);
      const telStr = acc.telephone.padEnd(16);
      const deviseStr = acc.devise.padEnd(20);
      console.log(`║  ${paysStr}│  ${emailStr}│  ${telStr}│  ${deviseStr}║`);
    }
    
    console.log('╚══════════════════════════════════════════════════════════════════════════════════════╝');
    console.log('\n📋 INSTRUCTIONS:');
    console.log('   1. Allez sur http://localhost:4200/auth/login');
    console.log('   2. Connectez-vous avec un email ci-dessus');
    console.log('   3. Mot de passe: Test1234');
    console.log('   4. Code PIN pour transactions: 1234');
    console.log('\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Erreur:', error.message);
    process.exit(1);
  }
}

createTestAccounts();
