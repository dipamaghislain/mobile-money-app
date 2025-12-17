// backend/src/controllers/transactionController.js

const Transaction = require('../models/Transaction');
const Wallet = require('../models/Wallet');
const User = require('../models/User');

// Petite fonction utilitaire pour convertir proprement le montant
const toAmount = (value) => {
  const n = Number(value);
  if (Number.isNaN(n)) return 0;
  return n;
};

// -----------------------------------------------------------
//  Dépôt d'argent (cash-in simulé)
//  POST /api/transactions/deposit
// -----------------------------------------------------------
exports.deposit = async (req, res) => {
  try {
    const { montant, source } = req.body;
    const amount = toAmount(montant);

    if (!amount || amount <= 0) {
      return res.status(400).json({
        message: 'Le montant doit être supérieur à 0',
      });
    }

    const wallet = await Wallet.findOne({ utilisateurId: req.user.id });

    if (!wallet) {
      return res.status(404).json({ message: 'Portefeuille non trouvé' });
    }

    if (wallet.statut !== 'actif') {
      return res.status(403).json({ message: 'Portefeuille inactif' });
    }

    // Créer la transaction en "en_attente"
    const transaction = await Transaction.create({
      type: 'DEPOSIT',
      montant: amount,
      devise: wallet.devise,
      walletDestinationId: wallet._id,
      utilisateurDestinationId: req.user.id,
      description: `Dépôt depuis ${source || 'agent'}`,
      referenceExterne: Transaction.genererReference(),
      statut: 'en_attente',
    });

    const soldeAvant = wallet.solde;

    // Créditer le portefeuille
    await wallet.crediter(amount);

    // Mettre à jour la transaction comme réussie
    transaction.statut = 'reussie';
    transaction.soldeAvantDestination = soldeAvant;
    transaction.soldeApresDestination = wallet.solde;
    await transaction.save();

    return res.status(200).json({
      message: 'Dépôt effectué avec succès',
      nouveauSolde: wallet.solde,
      transaction: {
        id: transaction._id,
        type: transaction.type,
        montant: transaction.montant,
        reference: transaction.referenceExterne,
        date: transaction.createdAt,
      },
    });
  } catch (error) {
    console.error('Erreur lors du dépôt:', error);
    return res.status(500).json({
      message: 'Erreur lors du dépôt',
      error: error.message,
    });
  }
};

// -----------------------------------------------------------
//  Retrait d'argent (cash-out simulé)
//  POST /api/transactions/withdraw
// -----------------------------------------------------------
exports.withdraw = async (req, res) => {
  try {
    const { montant, pin } = req.body;
    const amount = toAmount(montant);

    if (!amount || amount <= 0) {
      return res.status(400).json({
        message: 'Le montant doit être supérieur à 0',
      });
    }

    if (!pin) {
      return res.status(400).json({
        message: 'Le PIN est requis',
      });
    }

    const wallet = await Wallet.findOne({ utilisateurId: req.user.id }).select(
      '+pin'
    );

    if (!wallet) {
      return res.status(404).json({ message: 'Portefeuille non trouvé' });
    }

    if (wallet.statut !== 'actif') {
      return res.status(403).json({ message: 'Portefeuille inactif' });
    }

    // Vérifier si le portefeuille est bloqué
    if (wallet.estBloque()) {
      return res.status(403).json({
        message: 'Portefeuille bloqué temporairement',
      });
    }

    // Vérifier le PIN
    const isPinValid = await wallet.comparePin(pin);
    if (!isPinValid) {
      await wallet.incrementerTentativesEchouees();
      return res.status(401).json({ message: 'PIN incorrect' });
    }

    // PIN correct → réinitialiser les tentatives
    await wallet.reinitialiserTentatives();

    // Vérifier le solde
    if (!wallet.aSoldeSuffisant(amount)) {
      return res.status(400).json({ message: 'Solde insuffisant' });
    }

    // Créer la transaction en "en_attente"
    const transaction = await Transaction.create({
      type: 'WITHDRAW',
      montant: amount,
      devise: wallet.devise,
      walletSourceId: wallet._id,
      utilisateurSourceId: req.user.id,
      description: "Retrait d'argent",
      referenceExterne: Transaction.genererReference(),

    });

    const soldeAvant = wallet.solde;

    // Débiter le portefeuille
    await wallet.debiter(amount);

    // Marquer la transaction comme réussie
    transaction.statut = 'reussie';
    transaction.soldeAvantSource = soldeAvant;
    transaction.soldeApresSource = wallet.solde;
    await transaction.save();

    return res.status(200).json({
      message: 'Retrait effectué avec succès',
      nouveauSolde: wallet.solde,
      transaction: {
        id: transaction._id,
        type: transaction.type,
        montant: transaction.montant,
        reference: transaction.referenceExterne,
        date: transaction.createdAt,
      },
    });
  } catch (error) {
    console.error('Erreur lors du retrait:', error);
    return res.status(500).json({
      message: 'Erreur lors du retrait',
      error: error.message,
    });
  }
};

// -----------------------------------------------------------
//  Transfert vers un autre utilisateur
//  POST /api/transactions/transfer
// -----------------------------------------------------------
exports.transfer = async (req, res) => {
  try {
    const { telephoneDestinataire, montant, pin } = req.body;
    const amount = toAmount(montant);

    if (!telephoneDestinataire || !amount || !pin) {
      return res.status(400).json({
        message: 'Tous les champs sont requis',
      });
    }

    if (amount <= 0) {
      return res.status(400).json({
        message: 'Le montant doit être supérieur à 0',
      });
    }

    const destinataire = await User.findOne({ telephone: telephoneDestinataire });

    if (!destinataire) {
      return res.status(404).json({ message: 'Destinataire non trouvé' });
    }

    if (destinataire._id.toString() === req.user.id) {
      return res.status(400).json({
        message: 'Vous ne pouvez pas effectuer un transfert vers vous-même',
      });
    }

    const walletSource = await Wallet.findOne({
      utilisateurId: req.user.id,
    }).select('+pin');
    const walletDest = await Wallet.findOne({
      utilisateurId: destinataire._id,
    });

    if (!walletSource || !walletDest) {
      return res.status(404).json({ message: 'Portefeuille non trouvé' });
    }

    if (walletSource.statut !== 'actif' || walletDest.statut !== 'actif') {
      return res.status(403).json({
        message: 'Un des portefeuilles est inactif',
      });
    }

    if (walletSource.estBloque()) {
      return res.status(403).json({
        message: 'Portefeuille bloqué temporairement',
      });
    }

    const isPinValid = await walletSource.comparePin(pin);
    if (!isPinValid) {
      await walletSource.incrementerTentativesEchouees();
      return res.status(401).json({ message: 'PIN incorrect' });
    }

    await walletSource.reinitialiserTentatives();

    if (!walletSource.aSoldeSuffisant(amount)) {
      return res.status(400).json({ message: 'Solde insuffisant' });
    }

    const transaction = await Transaction.create({
      type: 'TRANSFER',
      montant: amount,
      devise: walletSource.devise,
      walletSourceId: walletSource._id,
      walletDestinationId: walletDest._id,
      utilisateurSourceId: req.user.id,
      utilisateurDestinationId: destinataire._id,
      description: `Transfert vers ${destinataire.nomComplet}`,
      referenceExterne: Transaction.genererReference(),
      statut: 'en_attente',
    });

    const soldeAvantSource = walletSource.solde;
    const soldeAvantDest = walletDest.solde;

    try {
      await walletSource.debiter(amount);
      await walletDest.crediter(amount);

      transaction.statut = 'reussie';
      transaction.soldeAvantSource = soldeAvantSource;
      transaction.soldeApresSource = walletSource.solde;
      transaction.soldeAvantDestination = soldeAvantDest;
      transaction.soldeApresDestination = walletDest.solde;
      await transaction.save();

      return res.status(200).json({
        message: 'Transfert effectué avec succès',
        soldeEmetteur: walletSource.solde,
        transaction: {
          id: transaction._id,
          type: transaction.type,
          montant: transaction.montant,
          destinataire: destinataire.nomComplet,
          reference: transaction.referenceExterne,
          date: transaction.createdAt,
        },
      });
    } catch (err) {
      transaction.statut = 'echouee';
      transaction.messageErreur = err.message;
      await transaction.save();
      throw err;
    }
  } catch (error) {
    console.error('Erreur lors du transfert:', error);
    return res.status(500).json({
      message: 'Erreur lors du transfert',
      error: error.message,
    });
  }
};

// -----------------------------------------------------------
//  Paiement marchand par code
//  POST /api/transactions/merchant-payment
// -----------------------------------------------------------
exports.merchantPayment = async (req, res) => {
  try {
    const { codeMarchand, montant, pin } = req.body;
    const amount = toAmount(montant);

    if (!codeMarchand || !amount || !pin) {
      return res.status(400).json({
        message: 'Tous les champs sont requis',
      });
    }

    if (amount <= 0) {
      return res.status(400).json({
        message: 'Le montant doit être supérieur à 0',
      });
    }

    const marchand = await User.findOne({ codeMarchand, role: 'marchand' });

    if (!marchand) {
      return res.status(404).json({ message: 'Code marchand invalide' });
    }

    const walletClient = await Wallet.findOne({
      utilisateurId: req.user.id,
    }).select('+pin');
    const walletMarchand = await Wallet.findOne({
      utilisateurId: marchand._id,
    });

    if (!walletClient || !walletMarchand) {
      return res.status(404).json({ message: 'Portefeuille non trouvé' });
    }

    if (walletClient.statut !== 'actif' || walletMarchand.statut !== 'actif') {
      return res.status(403).json({
        message: 'Un des portefeuilles est inactif',
      });
    }

    if (walletClient.estBloque()) {
      return res.status(403).json({
        message: 'Portefeuille bloqué temporairement',
      });
    }

    const isPinValid = await walletClient.comparePin(pin);
    if (!isPinValid) {
      await walletClient.incrementerTentativesEchouees();
      return res.status(401).json({ message: 'PIN incorrect' });
    }

    await walletClient.reinitialiserTentatives();

    if (!walletClient.aSoldeSuffisant(amount)) {
      return res.status(400).json({ message: 'Solde insuffisant' });
    }

    const transaction = await Transaction.create({
      type: 'MERCHANT_PAYMENT',
      montant: amount,
      devise: walletClient.devise,
      walletSourceId: walletClient._id,
      walletDestinationId: walletMarchand._id,
      utilisateurSourceId: req.user.id,
      utilisateurDestinationId: marchand._id,
      description: `Paiement à ${marchand.nomCommerce || marchand.nomComplet}`,
      referenceExterne: Transaction.genererReference(),
      statut: 'en_attente',
    });

    const soldeAvantClient = walletClient.solde;
    const soldeAvantMarchand = walletMarchand.solde;

    try {
      await walletClient.debiter(amount);
      await walletMarchand.crediter(amount);

      transaction.statut = 'reussie';
      transaction.soldeAvantSource = soldeAvantClient;
      transaction.soldeApresSource = walletClient.solde;
      transaction.soldeAvantDestination = soldeAvantMarchand;
      transaction.soldeApresDestination = walletMarchand.solde;
      await transaction.save();

      return res.status(200).json({
        message: 'Paiement marchand réussi',
        soldeClient: walletClient.solde,
        transaction: {
          id: transaction._id,
          type: transaction.type,
          montant: transaction.montant,
          marchand: marchand.nomCommerce || marchand.nomComplet,
          reference: transaction.referenceExterne,
          date: transaction.createdAt,
        },
      });
    } catch (err) {
      transaction.statut = 'echouee';
      transaction.messageErreur = err.message;
      await transaction.save();
      throw err;
    }
  } catch (error) {
    console.error('Erreur lors du paiement marchand:', error);
    return res.status(500).json({
      message: 'Erreur lors du paiement marchand',
      error: error.message,
    });
  }
};
