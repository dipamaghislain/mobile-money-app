// backend/tests/unit/transactionController.extended.test.js
// Tests étendus pour les transactions (retrait, transfert, paiement marchand)

const mongoose = require('mongoose');
const transactionController = require('../../src/controllers/transactionController');
const Wallet = require('../../src/models/Wallet');
const Transaction = require('../../src/models/Transaction');
const User = require('../../src/models/User');

jest.mock('../../src/models/Wallet');
jest.mock('../../src/models/Transaction');
jest.mock('../../src/models/User');

// Mock de mongoose.startSession pour les transactions atomiques
const mockSession = {
  startTransaction: jest.fn(),
  commitTransaction: jest.fn(),
  abortTransaction: jest.fn(),
  endSession: jest.fn()
};
jest.spyOn(mongoose, 'startSession').mockResolvedValue(mockSession);

describe('Transaction Controller - Withdraw', () => {
  let req, res;

  beforeEach(() => {
    req = {
      body: { montant: 1000, pin: '1234' },
      user: { id: 'user123' }
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    jest.clearAllMocks();
  });

  it('devrait effectuer un retrait avec succès', async () => {
    const mockWallet = {
      _id: 'wallet123',
      utilisateurId: 'user123',
      statut: 'actif',
      devise: 'XOF',
      solde: 5000,
      pin: 'hashedpin',
      estBloque: jest.fn().mockReturnValue(false),
      comparePin: jest.fn().mockResolvedValue(true),
      reinitialiserTentatives: jest.fn(),
      aSoldeSuffisant: jest.fn().mockReturnValue(true),
      debiter: jest.fn(),
      save: jest.fn()
    };

    Wallet.findOne.mockReturnValue({
      select: jest.fn().mockResolvedValue(mockWallet)
    });
    Transaction.create.mockResolvedValue({
      _id: 'trans123',
      type: 'WITHDRAW',
      montant: 1000,
      save: jest.fn(),
      createdAt: new Date()
    });
    Transaction.genererReference = jest.fn().mockReturnValue('REF123');

    await transactionController.withdraw(req, res);

    expect(mockWallet.comparePin).toHaveBeenCalledWith('1234');
    expect(mockWallet.debiter).toHaveBeenCalledWith(1000);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      message: 'Retrait effectué avec succès'
    }));
  });

  it('devrait refuser si le PIN est manquant', async () => {
    req.body.pin = undefined;

    await transactionController.withdraw(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      message: 'Le PIN est requis'
    }));
  });

  it('devrait refuser si le PIN est incorrect', async () => {
    const mockWallet = {
      _id: 'wallet123',
      statut: 'actif',
      estBloque: jest.fn().mockReturnValue(false),
      comparePin: jest.fn().mockResolvedValue(false),
      incrementerTentativesEchouees: jest.fn()
    };
    Wallet.findOne.mockReturnValue({
      select: jest.fn().mockResolvedValue(mockWallet)
    });

    await transactionController.withdraw(req, res);

    expect(mockWallet.incrementerTentativesEchouees).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      message: 'PIN incorrect'
    }));
  });

  it('devrait refuser si le portefeuille est bloqué', async () => {
    const mockWallet = {
      _id: 'wallet123',
      statut: 'actif',
      estBloque: jest.fn().mockReturnValue(true)
    };
    Wallet.findOne.mockReturnValue({
      select: jest.fn().mockResolvedValue(mockWallet)
    });

    await transactionController.withdraw(req, res);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      message: 'Portefeuille bloqué temporairement'
    }));
  });

  it('devrait refuser si le solde est insuffisant', async () => {
    const mockWallet = {
      _id: 'wallet123',
      statut: 'actif',
      estBloque: jest.fn().mockReturnValue(false),
      comparePin: jest.fn().mockResolvedValue(true),
      reinitialiserTentatives: jest.fn(),
      aSoldeSuffisant: jest.fn().mockReturnValue(false)
    };
    Wallet.findOne.mockReturnValue({
      select: jest.fn().mockResolvedValue(mockWallet)
    });

    await transactionController.withdraw(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      message: 'Solde insuffisant'
    }));
  });
});

describe('Transaction Controller - Transfer (Atomic)', () => {
  let req, res;

  beforeEach(() => {
    req = {
      body: { 
        telephoneDestinataire: '0698765432',
        montant: 1000, 
        pin: '1234' 
      },
      user: { id: 'user123' }
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    jest.clearAllMocks();
    mockSession.startTransaction.mockClear();
    mockSession.commitTransaction.mockClear();
    mockSession.abortTransaction.mockClear();
    mockSession.endSession.mockClear();
  });

  it('devrait effectuer un transfert atomique avec succès', async () => {
    const destinataire = {
      _id: 'dest123',
      nomComplet: 'Marie Martin',
      telephone: '0698765432'
    };

    const mockWalletSource = {
      _id: 'wallet123',
      utilisateurId: 'user123',
      statut: 'actif',
      devise: 'XOF',
      solde: 5000,
      estBloque: jest.fn().mockReturnValue(false),
      comparePin: jest.fn().mockResolvedValue(true),
      reinitialiserTentatives: jest.fn(),
      aSoldeSuffisant: jest.fn().mockReturnValue(true),
      save: jest.fn()
    };

    const mockWalletDest = {
      _id: 'wallet456',
      utilisateurId: 'dest123',
      statut: 'actif',
      solde: 2000,
      save: jest.fn()
    };

    User.findOne.mockResolvedValue(destinataire);
    Wallet.findOne
      .mockReturnValueOnce({ select: jest.fn().mockResolvedValue(mockWalletSource) })
      .mockResolvedValueOnce(mockWalletDest);
    
    Transaction.genererReference = jest.fn().mockReturnValue('TXN-123');
    Transaction.create.mockResolvedValue([{
      _id: 'trans123',
      type: 'TRANSFER',
      montant: 1000,
      referenceExterne: 'TXN-123',
      createdAt: new Date()
    }]);

    await transactionController.transfer(req, res);

    expect(mockSession.startTransaction).toHaveBeenCalled();
    expect(mockSession.commitTransaction).toHaveBeenCalled();
    expect(mockSession.endSession).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      message: 'Transfert effectué avec succès'
    }));
  });

  it('devrait refuser un transfert vers soi-même', async () => {
    const destinataire = {
      _id: 'user123', // Même ID que l'utilisateur source
      nomComplet: 'Jean Dupont',
      telephone: '0698765432'
    };
    destinataire._id.toString = () => 'user123';

    User.findOne.mockResolvedValue(destinataire);

    await transactionController.transfer(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      message: expect.stringContaining('vous-même')
    }));
  });

  it('devrait refuser si le destinataire n\'existe pas', async () => {
    User.findOne.mockResolvedValue(null);

    await transactionController.transfer(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      message: 'Destinataire non trouvé'
    }));
  });

  it('devrait annuler la transaction en cas d\'erreur', async () => {
    const destinataire = {
      _id: 'dest123',
      nomComplet: 'Marie Martin'
    };

    const mockWalletSource = {
      _id: 'wallet123',
      statut: 'actif',
      solde: 5000,
      devise: 'XOF',
      estBloque: jest.fn().mockReturnValue(false),
      comparePin: jest.fn().mockResolvedValue(true),
      reinitialiserTentatives: jest.fn(),
      aSoldeSuffisant: jest.fn().mockReturnValue(true),
      save: jest.fn().mockRejectedValue(new Error('Erreur DB'))
    };

    const mockWalletDest = { _id: 'wallet456', statut: 'actif', solde: 2000 };

    User.findOne.mockResolvedValue(destinataire);
    Wallet.findOne
      .mockReturnValueOnce({ select: jest.fn().mockResolvedValue(mockWalletSource) })
      .mockResolvedValueOnce(mockWalletDest);
    
    Transaction.genererReference = jest.fn().mockReturnValue('TXN-123');
    Transaction.create.mockResolvedValue({});

    await transactionController.transfer(req, res);

    expect(mockSession.abortTransaction).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(500);
  });
});

describe('Transaction Controller - Merchant Payment (Atomic)', () => {
  let req, res;

  beforeEach(() => {
    req = {
      body: { 
        codeMarchand: 'M123456',
        montant: 500, 
        pin: '1234' 
      },
      user: { id: 'user123' }
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    jest.clearAllMocks();
    mockSession.startTransaction.mockClear();
    mockSession.commitTransaction.mockClear();
    mockSession.abortTransaction.mockClear();
    mockSession.endSession.mockClear();
  });

  it('devrait effectuer un paiement marchand avec succès', async () => {
    const marchand = {
      _id: 'marchand123',
      nomCommerce: 'Boutique Express',
      codeMarchand: 'M123456',
      role: 'marchand'
    };

    const mockWalletClient = {
      _id: 'wallet123',
      utilisateurId: 'user123',
      statut: 'actif',
      devise: 'XOF',
      solde: 5000,
      estBloque: jest.fn().mockReturnValue(false),
      comparePin: jest.fn().mockResolvedValue(true),
      reinitialiserTentatives: jest.fn(),
      aSoldeSuffisant: jest.fn().mockReturnValue(true),
      save: jest.fn()
    };

    const mockWalletMarchand = {
      _id: 'wallet456',
      utilisateurId: 'marchand123',
      statut: 'actif',
      solde: 10000,
      save: jest.fn()
    };

    User.findOne.mockResolvedValue(marchand);
    Wallet.findOne
      .mockReturnValueOnce({ select: jest.fn().mockResolvedValue(mockWalletClient) })
      .mockResolvedValueOnce(mockWalletMarchand);
    
    Transaction.genererReference = jest.fn().mockReturnValue('TXN-MP-123');
    Transaction.create.mockResolvedValue([{
      _id: 'trans123',
      type: 'MERCHANT_PAYMENT',
      montant: 500,
      referenceExterne: 'TXN-MP-123',
      createdAt: new Date()
    }]);

    await transactionController.merchantPayment(req, res);

    expect(mockSession.startTransaction).toHaveBeenCalled();
    expect(mockSession.commitTransaction).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      message: 'Paiement marchand réussi',
      transaction: expect.objectContaining({
        marchand: 'Boutique Express'
      })
    }));
  });

  it('devrait refuser si le code marchand est invalide', async () => {
    User.findOne.mockResolvedValue(null);

    await transactionController.merchantPayment(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      message: 'Code marchand invalide'
    }));
  });

  it('devrait refuser si tous les champs ne sont pas fournis', async () => {
    req.body = { codeMarchand: 'M123456' };

    await transactionController.merchantPayment(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      message: 'Tous les champs sont requis'
    }));
  });

  it('devrait refuser si le montant est négatif', async () => {
    req.body.montant = -100;

    await transactionController.merchantPayment(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      message: 'Le montant doit être supérieur à 0'
    }));
  });
});


