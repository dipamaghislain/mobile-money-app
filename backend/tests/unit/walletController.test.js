// backend/tests/unit/walletController.test.js

const walletController = require('../../src/controllers/walletController');
const Wallet = require('../../src/models/Wallet');
const Transaction = require('../../src/models/Transaction');

jest.mock('../../src/models/Wallet');
jest.mock('../../src/models/Transaction');

describe('Wallet Controller', () => {
  let req, res;

  beforeEach(() => {
    req = { body: {}, user: { id: 'user123' }, params: {}, query: {} };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    jest.clearAllMocks();
  });

  // ===========================================
  // TESTS GET WALLET
  // ===========================================
  describe('getWallet', () => {
    it('devrait retourner le portefeuille de l\'utilisateur', async () => {
      const mockWallet = {
        _id: 'wallet123',
        utilisateurId: 'user123',
        solde: 5000,
        devise: 'XOF',
        statut: 'actif'
      };
      Wallet.findOne.mockResolvedValue(mockWallet);

      await walletController.getWallet(req, res);

      expect(Wallet.findOne).toHaveBeenCalledWith({ utilisateurId: 'user123' });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        solde: 5000,
        devise: 'XOF'
      }));
    });

    it('devrait retourner une erreur si le portefeuille n\'existe pas', async () => {
      Wallet.findOne.mockResolvedValue(null);

      await walletController.getWallet(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        message: expect.stringContaining('non trouvé')
      }));
    });
  });

  // ===========================================
  // TESTS SET PIN
  // ===========================================
  describe('setPin', () => {
    beforeEach(() => {
      req.body = { nouveauPin: '1234' };
    });

    it('devrait définir un nouveau PIN avec succès', async () => {
      const mockWallet = {
        _id: 'wallet123',
        pin: null,
        save: jest.fn()
      };
      Wallet.findOne.mockReturnValue({
        select: jest.fn().mockResolvedValue(mockWallet)
      });

      await walletController.setPin(req, res);

      expect(mockWallet.pin).toBe('1234');
      expect(mockWallet.save).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('devrait exiger l\'ancien PIN si un PIN existe déjà', async () => {
      const mockWallet = {
        _id: 'wallet123',
        pin: 'hashedpin',
        comparePin: jest.fn().mockResolvedValue(false)
      };
      Wallet.findOne.mockReturnValue({
        select: jest.fn().mockResolvedValue(mockWallet)
      });
      req.body.ancienPin = '0000';

      await walletController.setPin(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
    });

    it('devrait retourner une erreur si le nouveau PIN est invalide', async () => {
      req.body.nouveauPin = '12'; // Trop court

      const mockWallet = {
        _id: 'wallet123',
        pin: null
      };
      Wallet.findOne.mockReturnValue({
        select: jest.fn().mockResolvedValue(mockWallet)
      });

      await walletController.setPin(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });
  });

  // ===========================================
  // TESTS VERIFY PIN
  // ===========================================
  describe('verifyPin', () => {
    beforeEach(() => {
      req.body = { pin: '1234' };
    });

    it('devrait valider un PIN correct', async () => {
      const mockWallet = {
        _id: 'wallet123',
        pin: 'hashedpin',
        estBloque: jest.fn().mockReturnValue(false),
        comparePin: jest.fn().mockResolvedValue(true),
        reinitialiserTentatives: jest.fn()
      };
      Wallet.findOne.mockReturnValue({
        select: jest.fn().mockResolvedValue(mockWallet)
      });

      await walletController.verifyPin(req, res);

      expect(mockWallet.comparePin).toHaveBeenCalledWith('1234');
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        valide: true
      }));
    });

    it('devrait refuser un PIN incorrect', async () => {
      const mockWallet = {
        _id: 'wallet123',
        pin: 'hashedpin',
        estBloque: jest.fn().mockReturnValue(false),
        comparePin: jest.fn().mockResolvedValue(false),
        incrementerTentativesEchouees: jest.fn()
      };
      Wallet.findOne.mockReturnValue({
        select: jest.fn().mockResolvedValue(mockWallet)
      });

      await walletController.verifyPin(req, res);

      expect(mockWallet.incrementerTentativesEchouees).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(401);
    });

    it('devrait bloquer si le portefeuille est bloqué', async () => {
      const mockWallet = {
        _id: 'wallet123',
        estBloque: jest.fn().mockReturnValue(true)
      };
      Wallet.findOne.mockReturnValue({
        select: jest.fn().mockResolvedValue(mockWallet)
      });

      await walletController.verifyPin(req, res);

      expect(res.status).toHaveBeenCalledWith(403);
    });
  });

  // ===========================================
  // TESTS GET TRANSACTIONS
  // ===========================================
  describe('getTransactions', () => {
    it('devrait retourner l\'historique des transactions', async () => {
      const mockWallet = { _id: 'wallet123' };
      const mockTransactions = [
        { _id: 'trans1', type: 'DEPOSIT', montant: 1000 },
        { _id: 'trans2', type: 'WITHDRAW', montant: 500 }
      ];
      
      Wallet.findOne.mockResolvedValue(mockWallet);
      Transaction.obtenirParWallet = jest.fn().mockResolvedValue(mockTransactions);

      await walletController.getTransactions(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        count: 2,
        transactions: mockTransactions
      }));
    });

    it('devrait filtrer par type de transaction', async () => {
      req.query = { type: 'DEPOSIT' };
      const mockWallet = { _id: 'wallet123' };
      
      Wallet.findOne.mockResolvedValue(mockWallet);
      Transaction.obtenirParWallet = jest.fn().mockResolvedValue([]);

      await walletController.getTransactions(req, res);

      expect(Transaction.obtenirParWallet).toHaveBeenCalledWith(
        'wallet123',
        expect.objectContaining({ type: 'DEPOSIT' })
      );
    });

    it('devrait paginer les résultats', async () => {
      req.query = { limit: '10', skip: '20' };
      const mockWallet = { _id: 'wallet123' };
      
      Wallet.findOne.mockResolvedValue(mockWallet);
      Transaction.obtenirParWallet = jest.fn().mockResolvedValue([]);

      await walletController.getTransactions(req, res);

      expect(Transaction.obtenirParWallet).toHaveBeenCalledWith(
        'wallet123',
        expect.objectContaining({ limit: 10, skip: 20 })
      );
    });
  });

  // ===========================================
  // TESTS GET STATISTICS
  // ===========================================
  describe('getStatistics', () => {
    it('devrait retourner les statistiques du portefeuille', async () => {
      const mockWallet = { _id: 'wallet123', solde: 5000, devise: 'XOF' };
      const mockStats = [
        { _id: 'DEPOSIT', count: 5, totalMontant: 10000 },
        { _id: 'WITHDRAW', count: 2, totalMontant: 3000 }
      ];
      
      Wallet.findOne.mockResolvedValue(mockWallet);
      Transaction.obtenirStatistiques = jest.fn().mockResolvedValue(mockStats);

      await walletController.getStatistics(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        soldeActuel: 5000,
        devise: 'XOF',
        statistiques: mockStats
      }));
    });

    it('devrait utiliser une période personnalisée', async () => {
      req.query = { periode: '60' };
      const mockWallet = { _id: 'wallet123', solde: 5000, devise: 'XOF' };
      
      Wallet.findOne.mockResolvedValue(mockWallet);
      Transaction.obtenirStatistiques = jest.fn().mockResolvedValue([]);

      await walletController.getStatistics(req, res);

      expect(Transaction.obtenirStatistiques).toHaveBeenCalledWith('wallet123', 60);
    });
  });
});


