// backend/tests/integration/api.test.js
// Tests d'intégration pour l'API Mobile Money

const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../../src/app');
const User = require('../../src/models/User');
const Wallet = require('../../src/models/Wallet');
const Transaction = require('../../src/models/Transaction');

// Configuration de la base de données de test
const TEST_DB_URI = process.env.TEST_MONGODB_URI || 'mongodb://127.0.0.1:27017/mobile_money_test';

let authToken;
let testUser;
let testWallet;

beforeAll(async () => {
  // Connexion à la base de données de test
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(TEST_DB_URI);
  }
});

afterAll(async () => {
  // Nettoyage et fermeture de la connexion
  await User.deleteMany({});
  await Wallet.deleteMany({});
  await Transaction.deleteMany({});
  await mongoose.connection.close();
});

beforeEach(async () => {
  // Nettoyer la base avant chaque test
  await User.deleteMany({});
  await Wallet.deleteMany({});
  await Transaction.deleteMany({});
});

// ===========================================
// TESTS API RACINE
// ===========================================
describe('GET /', () => {
  it('devrait retourner les informations de l\'API', async () => {
    const res = await request(app).get('/');

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('message');
    expect(res.body).toHaveProperty('version');
    expect(res.body).toHaveProperty('endpoints');
  });
});

// ===========================================
// TESTS AUTHENTIFICATION
// ===========================================
describe('API Auth', () => {
  describe('POST /api/auth/register', () => {
    it('devrait créer un nouvel utilisateur', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          nomComplet: 'Test User',
          telephone: '0612345678',
          email: 'test@example.com',
          motDePasse: 'password123'
        });

      expect(res.statusCode).toBe(201);
      expect(res.body).toHaveProperty('token');
      expect(res.body).toHaveProperty('user');
      expect(res.body.user.nomComplet).toBe('Test User');
      expect(res.body.user.role).toBe('client');
    });

    it('devrait créer un marchand avec un code', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          nomComplet: 'Test Marchand',
          telephone: '0612345679',
          email: 'marchand@example.com',
          motDePasse: 'password123',
          role: 'marchand'
        });

      expect(res.statusCode).toBe(201);
      expect(res.body.user.role).toBe('marchand');
      expect(res.body.user.codeMarchand).toBeDefined();
    });

    it('devrait refuser si le téléphone existe déjà', async () => {
      // Créer un premier utilisateur
      await request(app)
        .post('/api/auth/register')
        .send({
          nomComplet: 'First User',
          telephone: '0612345678',
          email: 'first@example.com',
          motDePasse: 'password123'
        });

      // Essayer de créer avec le même téléphone
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          nomComplet: 'Second User',
          telephone: '0612345678',
          email: 'second@example.com',
          motDePasse: 'password123'
        });

      expect(res.statusCode).toBe(400);
      expect(res.body.message).toContain('existe déjà');
    });

    it('devrait refuser si les champs obligatoires sont manquants', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          nomComplet: 'Test User'
        });

      expect(res.statusCode).toBe(400);
    });
  });

  describe('POST /api/auth/login', () => {
    beforeEach(async () => {
      // Créer un utilisateur de test
      await request(app)
        .post('/api/auth/register')
        .send({
          nomComplet: 'Test User',
          telephone: '0612345678',
          email: 'test@example.com',
          motDePasse: 'password123'
        });
    });

    it('devrait connecter un utilisateur avec succès', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          telephone: '0612345678',
          motDePasse: 'password123'
        });

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('token');
      expect(res.body).toHaveProperty('user');
      expect(res.body.message).toBe('Connexion réussie');
    });

    it('devrait refuser avec un mauvais mot de passe', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          telephone: '0612345678',
          motDePasse: 'wrongpassword'
        });

      expect(res.statusCode).toBe(401);
      expect(res.body.message).toBe('Identifiants incorrects');
    });

    it('devrait refuser un utilisateur inexistant', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          telephone: '0699999999',
          motDePasse: 'password123'
        });

      expect(res.statusCode).toBe(401);
    });
  });

  describe('GET /api/auth/me', () => {
    beforeEach(async () => {
      // Créer et connecter un utilisateur
      const registerRes = await request(app)
        .post('/api/auth/register')
        .send({
          nomComplet: 'Test User',
          telephone: '0612345678',
          email: 'test@example.com',
          motDePasse: 'password123'
        });
      
      authToken = registerRes.body.token;
      testUser = registerRes.body.user;
    });

    it('devrait retourner le profil de l\'utilisateur connecté', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.nomComplet).toBe('Test User');
      expect(res.body.telephone).toBe('0612345678');
    });

    it('devrait refuser sans token', async () => {
      const res = await request(app)
        .get('/api/auth/me');

      expect(res.statusCode).toBe(401);
    });

    it('devrait refuser avec un token invalide', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer invalid_token');

      expect(res.statusCode).toBe(401);
    });
  });
});

// ===========================================
// TESTS PORTEFEUILLE
// ===========================================
describe('API Wallet', () => {
  beforeEach(async () => {
    // Créer et connecter un utilisateur
    const registerRes = await request(app)
      .post('/api/auth/register')
      .send({
        nomComplet: 'Test User',
        telephone: '0612345678',
        email: 'test@example.com',
        motDePasse: 'password123'
      });
    
    authToken = registerRes.body.token;
    testUser = registerRes.body.user;
    testWallet = await Wallet.findOne({ utilisateurId: testUser.id });
  });

  describe('GET /api/wallet', () => {
    it('devrait retourner le portefeuille de l\'utilisateur', async () => {
      const res = await request(app)
        .get('/api/wallet')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('solde');
      expect(res.body).toHaveProperty('devise');
      expect(res.body.solde).toBe(0);
    });
  });

  describe('PATCH /api/wallet/pin', () => {
    it('devrait définir un nouveau PIN', async () => {
      const res = await request(app)
        .patch('/api/wallet/pin')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ nouveauPin: '1234' });

      expect(res.statusCode).toBe(200);
      expect(res.body.message).toContain('succès');
    });

    it('devrait refuser un PIN trop court', async () => {
      const res = await request(app)
        .patch('/api/wallet/pin')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ nouveauPin: '12' });

      expect(res.statusCode).toBe(400);
    });
  });
});

// ===========================================
// TESTS TRANSACTIONS
// ===========================================
describe('API Transactions', () => {
  beforeEach(async () => {
    // Créer et connecter un utilisateur avec PIN
    const registerRes = await request(app)
      .post('/api/auth/register')
      .send({
        nomComplet: 'Test User',
        telephone: '0612345678',
        email: 'test@example.com',
        motDePasse: 'password123'
      });
    
    authToken = registerRes.body.token;
    testUser = registerRes.body.user;

    // Définir un PIN
    await request(app)
      .patch('/api/wallet/pin')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ nouveauPin: '1234' });

    // Récupérer le wallet
    testWallet = await Wallet.findOne({ utilisateurId: testUser.id });
  });

  describe('POST /api/transactions/deposit', () => {
    it('devrait effectuer un dépôt', async () => {
      const res = await request(app)
        .post('/api/transactions/deposit')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ montant: 10000, source: 'agent' });

      expect(res.statusCode).toBe(200);
      expect(res.body.message).toContain('succès');
      expect(res.body.nouveauSolde).toBe(10000);
      expect(res.body.transaction).toHaveProperty('reference');
    });

    it('devrait refuser un montant négatif', async () => {
      const res = await request(app)
        .post('/api/transactions/deposit')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ montant: -100 });

      expect(res.statusCode).toBe(400);
    });
  });

  describe('POST /api/transactions/withdraw', () => {
    beforeEach(async () => {
      // Ajouter du solde au portefeuille
      await Wallet.findOneAndUpdate(
        { utilisateurId: testUser.id },
        { solde: 10000 }
      );
    });

    it('devrait effectuer un retrait', async () => {
      const res = await request(app)
        .post('/api/transactions/withdraw')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ montant: 5000, pin: '1234' });

      expect(res.statusCode).toBe(200);
      expect(res.body.message).toContain('succès');
      expect(res.body.nouveauSolde).toBe(5000);
    });

    it('devrait refuser si le solde est insuffisant', async () => {
      const res = await request(app)
        .post('/api/transactions/withdraw')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ montant: 50000, pin: '1234' });

      expect(res.statusCode).toBe(400);
      expect(res.body.message).toContain('insuffisant');
    });

    it('devrait refuser avec un PIN incorrect', async () => {
      const res = await request(app)
        .post('/api/transactions/withdraw')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ montant: 1000, pin: '9999' });

      expect(res.statusCode).toBe(401);
      expect(res.body.message).toContain('PIN incorrect');
    });
  });

  describe('POST /api/transactions/transfer', () => {
    let destinataire;
    let destToken;

    beforeEach(async () => {
      // Créer un destinataire
      const destRes = await request(app)
        .post('/api/auth/register')
        .send({
          nomComplet: 'Destinataire User',
          telephone: '0698765432',
          email: 'dest@example.com',
          motDePasse: 'password123'
        });
      
      destinataire = destRes.body.user;
      destToken = destRes.body.token;

      // Ajouter du solde au portefeuille source
      await Wallet.findOneAndUpdate(
        { utilisateurId: testUser.id },
        { solde: 10000 }
      );
    });

    it('devrait effectuer un transfert', async () => {
      const res = await request(app)
        .post('/api/transactions/transfer')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          telephoneDestinataire: '0698765432',
          montant: 5000,
          pin: '1234'
        });

      expect(res.statusCode).toBe(200);
      expect(res.body.message).toContain('succès');
      expect(res.body.soldeEmetteur).toBe(5000);

      // Vérifier que le destinataire a reçu l'argent
      const walletDest = await Wallet.findOne({ utilisateurId: destinataire.id });
      expect(walletDest.solde).toBe(5000);
    });

    it('devrait refuser un transfert vers soi-même', async () => {
      const res = await request(app)
        .post('/api/transactions/transfer')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          telephoneDestinataire: '0612345678',
          montant: 1000,
          pin: '1234'
        });

      expect(res.statusCode).toBe(400);
      expect(res.body.message).toContain('vous-même');
    });

    it('devrait refuser si le destinataire n\'existe pas', async () => {
      const res = await request(app)
        .post('/api/transactions/transfer')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          telephoneDestinataire: '0600000000',
          montant: 1000,
          pin: '1234'
        });

      expect(res.statusCode).toBe(404);
      expect(res.body.message).toContain('non trouvé');
    });
  });

  describe('POST /api/transactions/merchant-payment', () => {
    let marchand;

    beforeEach(async () => {
      // Créer un marchand
      const merchantRes = await request(app)
        .post('/api/auth/register')
        .send({
          nomComplet: 'Boutique Test',
          telephone: '0611111111',
          email: 'boutique@example.com',
          motDePasse: 'password123',
          role: 'marchand'
        });
      
      marchand = merchantRes.body.user;

      // Ajouter du solde au portefeuille client
      await Wallet.findOneAndUpdate(
        { utilisateurId: testUser.id },
        { solde: 10000 }
      );
    });

    it('devrait effectuer un paiement marchand', async () => {
      const res = await request(app)
        .post('/api/transactions/merchant-payment')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          codeMarchand: marchand.codeMarchand,
          montant: 2000,
          pin: '1234'
        });

      expect(res.statusCode).toBe(200);
      expect(res.body.message).toContain('réussi');
      expect(res.body.soldeClient).toBe(8000);

      // Vérifier que le marchand a reçu l'argent
      const walletMarchand = await Wallet.findOne({ utilisateurId: marchand.id });
      expect(walletMarchand.solde).toBe(2000);
    });

    it('devrait refuser avec un code marchand invalide', async () => {
      const res = await request(app)
        .post('/api/transactions/merchant-payment')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          codeMarchand: 'INVALID_CODE',
          montant: 1000,
          pin: '1234'
        });

      expect(res.statusCode).toBe(404);
      expect(res.body.message).toContain('invalide');
    });
  });
});

// ===========================================
// TESTS ROUTE 404
// ===========================================
describe('Route 404', () => {
  it('devrait retourner 404 pour une route inexistante', async () => {
    const res = await request(app).get('/api/nonexistent');

    expect(res.statusCode).toBe(404);
    expect(res.body.message).toContain('non trouvée');
  });
});


