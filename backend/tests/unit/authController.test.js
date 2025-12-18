// backend/tests/unit/authController.test.js

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
  // TESTS INSCRIPTION
  // ===========================================
  describe('register', () => {
    beforeEach(() => {
      req.body = {
        nomComplet: 'Jean Dupont',
        telephone: '0612345678',
        email: 'jean@test.com',
        motDePasse: 'password123'
      };
    });

    it('devrait créer un nouvel utilisateur avec succès', async () => {
      User.findOne.mockResolvedValue(null);
      User.create.mockResolvedValue({
        _id: 'user123',
        nomComplet: 'Jean Dupont',
        telephone: '0612345678',
        email: 'jean@test.com',
        role: 'client'
      });
      Wallet.create.mockResolvedValue({ _id: 'wallet123' });

      await authController.register(req, res);

      expect(User.findOne).toHaveBeenCalled();
      expect(User.create).toHaveBeenCalledWith(expect.objectContaining({
        nomComplet: 'Jean Dupont',
        telephone: '0612345678'
      }));
      expect(Wallet.create).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        message: 'Inscription réussie',
        token: expect.any(String)
      }));
    });

    it('devrait retourner une erreur si les champs obligatoires sont manquants', async () => {
      req.body = { nomComplet: 'Jean' };

      await authController.register(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        message: expect.stringContaining('obligatoires')
      }));
    });

    it('devrait retourner une erreur si l\'utilisateur existe déjà', async () => {
      User.findOne.mockResolvedValue({ telephone: '0612345678' });

      await authController.register(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        message: expect.stringContaining('existe déjà')
      }));
    });

    it('devrait créer un code marchand pour un marchand', async () => {
      req.body.role = 'marchand';
      User.findOne.mockResolvedValue(null);
      User.create.mockResolvedValue({
        _id: 'user123',
        nomComplet: 'Jean Dupont',
        role: 'marchand',
        codeMarchand: 'M123456'
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
  // TESTS CONNEXION
  // ===========================================
  describe('login', () => {
    beforeEach(() => {
      req.body = {
        telephone: '0612345678',
        motDePasse: 'password123'
      };
    });

    it('devrait connecter un utilisateur avec succès', async () => {
      const mockUser = {
        _id: 'user123',
        nomComplet: 'Jean Dupont',
        telephone: '0612345678',
        email: 'jean@test.com',
        role: 'client',
        statut: 'actif',
        comparePassword: jest.fn().mockResolvedValue(true)
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

    it('devrait retourner une erreur si les identifiants sont manquants', async () => {
      req.body = {};

      await authController.login(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('devrait retourner une erreur si l\'utilisateur n\'existe pas', async () => {
      User.findOne.mockReturnValue({
        select: jest.fn().mockResolvedValue(null)
      });

      await authController.login(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        message: 'Identifiants incorrects'
      }));
    });

    it('devrait retourner une erreur si le compte est bloqué', async () => {
      const mockUser = {
        _id: 'user123',
        statut: 'bloque'
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
        comparePassword: jest.fn().mockResolvedValue(false)
      };
      User.findOne.mockReturnValue({
        select: jest.fn().mockResolvedValue(mockUser)
      });

      await authController.login(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        message: 'Identifiants incorrects'
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
      const mockUser = {
        _id: 'user123',
        nomComplet: 'Jean Dupont',
        telephone: '0612345678',
        email: 'jean@test.com',
        role: 'client',
        statut: 'actif',
        dateCreation: new Date()
      };
      User.findById.mockReturnValue({
        select: jest.fn().mockResolvedValue(mockUser)
      });

      await authController.getMe(req, res);

      expect(User.findById).toHaveBeenCalledWith('user123');
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        nomComplet: 'Jean Dupont'
      }));
    });

    it('devrait retourner une erreur si l\'utilisateur n\'existe pas', async () => {
      User.findById.mockReturnValue({
        select: jest.fn().mockResolvedValue(null)
      });

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
      req.body = { nomComplet: 'Jean Dupont Modifié' };
    });

    it('devrait mettre à jour le profil avec succès', async () => {
      const mockUser = {
        _id: 'user123',
        nomComplet: 'Jean Dupont',
        role: 'client',
        save: jest.fn()
      };
      User.findById.mockResolvedValue(mockUser);

      await authController.updateProfile(req, res);

      expect(mockUser.nomComplet).toBe('Jean Dupont Modifié');
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
        ancienMotDePasse: 'oldpass123',
        nouveauMotDePasse: 'newpass123'
      };
    });

    it('devrait changer le mot de passe avec succès', async () => {
      const mockUser = {
        _id: 'user123',
        comparePassword: jest.fn().mockResolvedValue(true),
        save: jest.fn()
      };
      User.findById.mockReturnValue({
        select: jest.fn().mockResolvedValue(mockUser)
      });

      await authController.changePassword(req, res);

      expect(mockUser.motDePasse).toBe('newpass123');
      expect(mockUser.save).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('devrait retourner une erreur si l\'ancien mot de passe est incorrect', async () => {
      const mockUser = {
        comparePassword: jest.fn().mockResolvedValue(false)
      };
      User.findById.mockReturnValue({
        select: jest.fn().mockResolvedValue(mockUser)
      });

      await authController.changePassword(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        message: expect.stringContaining('incorrect')
      }));
    });

    it('devrait retourner une erreur si les mots de passe sont manquants', async () => {
      req.body = {};

      await authController.changePassword(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });
  });
});


