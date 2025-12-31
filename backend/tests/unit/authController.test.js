// backend/tests/unit/authController.test.js
// Tests pour le système d'authentification multi-pays
// Authentification: EMAIL + MOT DE PASSE
// Transactions: TELEPHONE + PIN

const authController = require('../../src/controllers/authController');
const User = require('../../src/models/User');
const Wallet = require('../../src/models/Wallet');

jest.mock('../../src/models/User');
jest.mock('../../src/models/Wallet');

describe('Auth Controller', () => {
  let req, res;

  beforeEach(() => {
    req = { body: {}, user: {} };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    jest.clearAllMocks();
  });

  // ===========================================
  // TESTS INSCRIPTION (EMAIL + TÉLÉPHONE + MOT DE PASSE)
  // ===========================================
  describe('register', () => {
    beforeEach(() => {
      req.body = {
        email: 'jean@test.com',
        nomComplet: 'Jean Dupont',
        telephone: '70123456',
        motDePasse: 'password123',
        pays: 'BF'  // Burkina Faso par défaut
      };
    });

    it('devrait créer un nouvel utilisateur avec succès', async () => {
      User.findOne.mockResolvedValue(null);  // Ni email ni téléphone existant
      User.create.mockResolvedValue({
        _id: 'user123',
        email: 'jean@test.com',
        nomComplet: 'Jean Dupont',
        telephone: '+22670123456',
        pays: 'BF',
        devise: 'XOF',
        role: 'client',
        pinConfigured: false
      });
      Wallet.create.mockResolvedValue({ _id: 'wallet123' });

      await authController.register(req, res);

      expect(User.findOne).toHaveBeenCalled();
      expect(User.create).toHaveBeenCalledWith(expect.objectContaining({
        email: 'jean@test.com',
        nomComplet: 'Jean Dupont',
        pays: 'BF'
      }));
      expect(Wallet.create).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        message: expect.stringContaining('Inscription réussie'),
        token: expect.any(String),
        nextStep: 'SETUP_PIN'  // Nouveau: indique qu'il faut configurer le PIN
      }));
    });

    it('devrait retourner une erreur si l\'email est manquant', async () => {
      req.body = { nomComplet: 'Jean', telephone: '70123456', motDePasse: 'test123', pays: 'BF' };

      await authController.register(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        message: expect.stringContaining('email')
      }));
    });

    it('devrait retourner une erreur si le téléphone est manquant', async () => {
      req.body = { email: 'test@test.com', nomComplet: 'Jean', motDePasse: 'test123', pays: 'BF' };

      await authController.register(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        message: expect.stringContaining('téléphone')
      }));
    });

    it('devrait retourner une erreur si l\'email existe déjà', async () => {
      User.findOne.mockResolvedValue({ email: 'jean@test.com' });

      await authController.register(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        message: expect.stringContaining('email')
      }));
    });

    it('devrait créer un code marchand pour un marchand', async () => {
      req.body.role = 'marchand';
      User.findOne.mockResolvedValue(null);
      User.create.mockResolvedValue({
        _id: 'user123',
        email: 'jean@test.com',
        nomComplet: 'Jean Dupont',
        telephone: '+22670123456',
        role: 'marchand',
        codeMarchand: 'M123456',
        pinConfigured: false
      });
      Wallet.create.mockResolvedValue({ _id: 'wallet123' });

      await authController.register(req, res);

      expect(User.create).toHaveBeenCalledWith(expect.objectContaining({
        role: 'marchand',
        codeMarchand: expect.any(String)
      }));
    });
  });

  // ===========================================
  // TESTS CONNEXION (EMAIL + MOT DE PASSE)
  // ===========================================
  describe('login', () => {
    beforeEach(() => {
      req.body = {
        email: 'jean@test.com',
        motDePasse: 'password123'
      };
    });

    it('devrait connecter un utilisateur avec succès', async () => {
      const mockUser = {
        _id: 'user123',
        email: 'jean@test.com',
        nomComplet: 'Jean Dupont',
        telephone: '+22670123456',
        pays: 'BF',
        devise: 'XOF',
        role: 'client',
        statut: 'actif',
        pinConfigured: true,
        comparePassword: jest.fn().mockResolvedValue(true),
        reinitialiserTentatives: jest.fn().mockResolvedValue(true),
        save: jest.fn().mockResolvedValue(true)
      };
      User.findOne.mockReturnValue({
        select: jest.fn().mockResolvedValue(mockUser)
      });

      await authController.login(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        message: 'Connexion réussie',
        token: expect.any(String)
      }));
    });

    it('devrait retourner une erreur si l\'email est manquant', async () => {
      req.body = { motDePasse: 'test123' };

      await authController.login(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        message: expect.stringContaining('Email')
      }));
    });

    it('devrait retourner une erreur si l\'utilisateur n\'existe pas', async () => {
      User.findOne.mockReturnValue({
        select: jest.fn().mockResolvedValue(null)
      });

      await authController.login(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        message: expect.stringContaining('incorrect')
      }));
    });

    it('devrait retourner une erreur si le compte est bloqué', async () => {
      const mockUser = {
        _id: 'user123',
        statut: 'bloque',
        estBloque: jest.fn().mockReturnValue(true),
        bloqueJusqua: new Date(Date.now() + 15 * 60 * 1000),
        comparePassword: jest.fn()
      };
      User.findOne.mockReturnValue({
        select: jest.fn().mockResolvedValue(mockUser)
      });

      await authController.login(req, res);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        message: expect.stringContaining('bloqué')
      }));
    });

    it('devrait retourner une erreur si le mot de passe est incorrect', async () => {
      const mockUser = {
        _id: 'user123',
        statut: 'actif',
        comparePassword: jest.fn().mockResolvedValue(false),
        incrementerTentatives: jest.fn().mockResolvedValue(true)
      };
      User.findOne.mockReturnValue({
        select: jest.fn().mockResolvedValue(mockUser)
      });

      await authController.login(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        message: expect.stringContaining('incorrect')
      }));
    });

    it('devrait indiquer nextStep=SETUP_PIN si PIN non configuré', async () => {
      const mockUser = {
        _id: 'user123',
        email: 'jean@test.com',
        nomComplet: 'Jean Dupont',
        pays: 'BF',
        devise: 'XOF',
        pinConfigured: false,
        comparePassword: jest.fn().mockResolvedValue(true),
        reinitialiserTentatives: jest.fn().mockResolvedValue(true),
        save: jest.fn().mockResolvedValue(true)
      };
      User.findOne.mockReturnValue({
        select: jest.fn().mockResolvedValue(mockUser)
      });

      await authController.login(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        nextStep: 'SETUP_PIN'
      }));
    });
  });

  // ===========================================
  // TESTS PROFIL
  // ===========================================
  describe('getMe', () => {
    beforeEach(() => {
      req.user = { id: 'user123' };
    });

    it('devrait retourner le profil de l\'utilisateur', async () => {
      User.findById.mockResolvedValue({
        _id: 'user123',
        email: 'jean@test.com',
        nomComplet: 'Jean Dupont',
        telephone: '+22670123456',
        pays: 'BF',
        devise: 'XOF',
        role: 'client',
        statut: 'actif',
        pinConfigured: true
      });

      await authController.getMe(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        email: 'jean@test.com',
        nomComplet: 'Jean Dupont',
        pays: 'BF'
      }));
    });

    it('devrait retourner une erreur si l\'utilisateur n\'existe pas', async () => {
      User.findById.mockResolvedValue(null);

      await authController.getMe(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });
  });

  // ===========================================
  // TESTS MISE À JOUR PROFIL
  // ===========================================
  describe('updateProfile', () => {
    beforeEach(() => {
      req.user = { id: 'user123' };
      req.body = { nomComplet: 'Jean Martin' };
    });

    it('devrait mettre à jour le profil avec succès', async () => {
      const mockUser = {
        _id: 'user123',
        nomComplet: 'Jean Dupont',
        pays: 'BF',
        save: jest.fn().mockResolvedValue(true)
      };
      User.findById.mockResolvedValue(mockUser);
      Wallet.findOne.mockResolvedValue(null);

      await authController.updateProfile(req, res);

      expect(mockUser.save).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('devrait retourner une erreur si l\'utilisateur n\'existe pas', async () => {
      User.findById.mockResolvedValue(null);

      await authController.updateProfile(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });
  });

  // ===========================================
  // TESTS CHANGEMENT MOT DE PASSE
  // ===========================================
  describe('changePassword', () => {
    beforeEach(() => {
      req.user = { id: 'user123' };
      req.body = {
        ancienMotDePasse: 'oldpass',
        nouveauMotDePasse: 'newpass123'
      };
    });

    it('devrait changer le mot de passe avec succès', async () => {
      const mockUser = {
        _id: 'user123',
        motDePasse: 'hashedpass',
        comparePassword: jest.fn().mockResolvedValue(true),
        save: jest.fn().mockResolvedValue(true)
      };
      User.findById.mockReturnValue({
        select: jest.fn().mockResolvedValue(mockUser)
      });

      await authController.changePassword(req, res);

      expect(mockUser.save).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('devrait retourner une erreur si l\'ancien mot de passe est incorrect', async () => {
      const mockUser = {
        _id: 'user123',
        comparePassword: jest.fn().mockResolvedValue(false)
      };
      User.findById.mockReturnValue({
        select: jest.fn().mockResolvedValue(mockUser)
      });

      await authController.changePassword(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
    });

    it('devrait retourner une erreur si les mots de passe sont manquants', async () => {
      req.body = {};

      await authController.changePassword(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });
  });

  // ===========================================
  // TESTS LISTE DES PAYS
  // ===========================================
  describe('getCountries', () => {
    it('devrait retourner la liste des pays actifs', async () => {
      await authController.getCountries(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        countries: expect.any(Array),
        default: expect.any(String)
      }));
    });
  });

  // ===========================================
  // TESTS CONFIGURATION PIN
  // ===========================================
  describe('setupPin', () => {
    beforeEach(() => {
      req.user = { id: 'user123' };
      req.body = {
        pin: '1357',
        confirmPin: '1357'
      };
    });

    it('devrait configurer le PIN avec succès', async () => {
      const mockUser = {
        _id: 'user123',
        pinConfigured: false,
        save: jest.fn().mockResolvedValue(true)
      };
      User.findById.mockResolvedValue(mockUser);
      Wallet.findOne.mockResolvedValue({
        save: jest.fn().mockResolvedValue(true)
      });

      await authController.setupPin(req, res);

      expect(mockUser.save).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        pinConfigured: true
      }));
    });

    it('devrait refuser si PIN déjà configuré', async () => {
      const mockUser = {
        _id: 'user123',
        pinConfigured: true
      };
      User.findById.mockResolvedValue(mockUser);

      await authController.setupPin(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('devrait refuser les PIN trop simples', async () => {
      req.body = { pin: '1234', confirmPin: '1234' };

      const mockUser = {
        _id: 'user123',
        pinConfigured: false
      };
      User.findById.mockResolvedValue(mockUser);

      await authController.setupPin(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        message: expect.stringContaining('simple')
      }));
    });

    it('devrait refuser si les PIN ne correspondent pas', async () => {
      req.body = { pin: '1357', confirmPin: '2468' };

      await authController.setupPin(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        message: expect.stringContaining('correspondent pas')
      }));
    });
  });
});


