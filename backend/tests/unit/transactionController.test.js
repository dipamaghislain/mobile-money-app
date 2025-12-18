const transactionController = require('../../src/controllers/transactionController');
const Wallet = require('../../src/models/Wallet');
const Transaction = require('../../src/models/Transaction');

jest.mock('../../src/models/Wallet');
jest.mock('../../src/models/Transaction');

describe('Transaction Controller - Deposit', () => {
    let req, res;

    beforeEach(() => {
        req = {
            body: { montant: 1000, source: 'test' },
            user: { id: 'user123' }
        };
        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        };
        jest.clearAllMocks();
    });

    it('devrait effectuer un dépôt avec succès', async () => {
        const mockWallet = {
            _id: 'wallet123',
            utilisateurId: 'user123',
            statut: 'actif',
            devise: 'FCFA',
            solde: 5000,
            crediter: jest.fn(),
            save: jest.fn()
        };
        Wallet.findOne.mockResolvedValue(mockWallet);
        Transaction.create.mockResolvedValue({
            _id: 'trans123',
            type: 'DEPOSIT',
            montant: 1000,
            save: jest.fn(),
            createdAt: new Date()
        });
        Transaction.genererReference = jest.fn().mockReturnValue('REF123');

        await transactionController.deposit(req, res);

        expect(Wallet.findOne).toHaveBeenCalledWith({ utilisateurId: 'user123' });
        expect(mockWallet.crediter).toHaveBeenCalledWith(1000);
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
            message: 'Dépôt effectué avec succès',
            nouveauSolde: 5000
        }));
    });

    it('devrait retourner une erreur si le montant est invalide', async () => {
        req.body.montant = -100;
        await transactionController.deposit(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
            message: 'Le montant doit être supérieur à 0'
        }));
    });

    it('devrait retourner une erreur si le portefeuille est introuvable', async () => {
        Wallet.findOne.mockResolvedValue(null);
        await transactionController.deposit(req, res);

        expect(res.status).toHaveBeenCalledWith(404);
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
            message: 'Portefeuille non trouvé'
        }));
    });

    it('devrait retourner une erreur si le portefeuille est inactif', async () => {
        Wallet.findOne.mockResolvedValue({ statut: 'inactif' });
        await transactionController.deposit(req, res);

        expect(res.status).toHaveBeenCalledWith(403);
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
            message: 'Portefeuille inactif'
        }));
    });
});
