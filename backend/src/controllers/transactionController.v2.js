// backend/src/controllers/transactionController.v2.js
// Contrôleur de transactions Mobile Money simplifié

const Transaction = require('../models/Transaction');
const Wallet = require('../models/Wallet');
const User = require('../models/User');
const NotificationService = require('../services/notificationService');

// Convertir montant en nombre
const toAmount = (value) => {
  const n = Number(value);
  return Number.isNaN(n) || n < 0 ? 0 : Math.round(n);
};

// ============================================
// DÉPÔT D'ARGENT
// POST /api/transactions/deposit
// ============================================
exports.deposit = async (req, res) => {
  try {
    const { montant, source = 'CASH' } = req.body;
    const amount = toAmount(montant);

    if (!amount || amount <= 0) {
      return res.status(400).json({ message: 'Le montant doit être supérieur à 0' });
    }

    const wallet = await Wallet.findOne({ utilisateurId: req.user.id });
    
    if (!wallet) {
      return res.status(404).json({ message: 'Portefeuille non trouvé' });
    }

    if (wallet.statut !== 'actif') {
      return res.status(403).json({ message: 'Portefeuille inactif' });
    }

    const soldeAvant = wallet.solde;

    // Créer la transaction
    const transaction = await Transaction.create({
      type: 'DEPOSIT',
      montant: amount,
      devise: wallet.devise,
      walletDestinationId: wallet._id,
      utilisateurDestinationId: req.user.id,
      description: `Dépôt ${source}`,
      referenceExterne: Transaction.genererReference(),
      statut: 'SUCCES',
      soldeAvantDestination: soldeAvant,
      soldeApresDestination: soldeAvant + amount
    });

    // Créditer le portefeuille
    await wallet.crediter(amount);

    // Envoyer notification
    const user = await User.findById(req.user.id);
    if (user) {
      NotificationService.notifyTransaction(user, transaction, 'credit').catch(err => {
        console.error('Erreur notification dépôt:', err);
      });
    }

    return res.status(200).json({
      message: 'Dépôt effectué avec succès',
      nouveauSolde: wallet.solde,
      transaction: {
        id: transaction._id,
        type: 'DEPOSIT',
        montant: amount,
        reference: transaction.referenceExterne,
        date: transaction.createdAt
      }
    });

  } catch (error) {
    console.error('Erreur dépôt:', error);
    return res.status(500).json({ message: 'Erreur lors du dépôt', error: error.message });
  }
};

// ============================================
// RETRAIT D'ARGENT
// POST /api/transactions/withdraw
// ============================================
exports.withdraw = async (req, res) => {
  try {
    const { montant, pin } = req.body;
    const amount = toAmount(montant);

    if (!amount || amount <= 0) {
      return res.status(400).json({ message: 'Le montant doit être supérieur à 0' });
    }

    if (!pin) {
      return res.status(400).json({ message: 'Le PIN est requis' });
    }

    const wallet = await Wallet.findOne({ utilisateurId: req.user.id }).select('+pin');

    if (!wallet) {
      return res.status(404).json({ message: 'Portefeuille non trouvé' });
    }

    if (wallet.statut !== 'actif') {
      return res.status(403).json({ message: 'Portefeuille inactif' });
    }

    if (wallet.estBloque()) {
      return res.status(403).json({ message: 'Portefeuille bloqué temporairement' });
    }

    // Vérifier le PIN
    const isPinValid = await wallet.comparePin(pin);
    if (!isPinValid) {
      await wallet.incrementerTentativesEchouees();
      return res.status(401).json({ message: 'PIN incorrect' });
    }

    await wallet.reinitialiserTentatives();

    // Vérifier le solde
    if (!wallet.aSoldeSuffisant(amount)) {
      return res.status(400).json({ message: 'Solde insuffisant' });
    }

    const soldeAvant = wallet.solde;

    // Créer la transaction
    const transaction = await Transaction.create({
      type: 'WITHDRAW',
      montant: amount,
      devise: wallet.devise,
      walletSourceId: wallet._id,
      utilisateurSourceId: req.user.id,
      description: 'Retrait d\'argent',
      referenceExterne: Transaction.genererReference(),
      statut: 'SUCCES',
      soldeAvantSource: soldeAvant,
      soldeApresSource: soldeAvant - amount
    });

    // Débiter
    await wallet.debiter(amount);

    // Envoyer notification
    const user = await User.findById(req.user.id);
    if (user) {
      NotificationService.notifyTransaction(user, transaction, 'debit').catch(err => {
        console.error('Erreur notification retrait:', err);
      });
    }

    return res.status(200).json({
      message: 'Retrait effectué avec succès',
      nouveauSolde: wallet.solde,
      transaction: {
        id: transaction._id,
        type: 'WITHDRAW',
        montant: amount,
        reference: transaction.referenceExterne,
        date: transaction.createdAt
      }
    });

  } catch (error) {
    console.error('Erreur retrait:', error);
    return res.status(500).json({ message: 'Erreur lors du retrait', error: error.message });
  }
};

// ============================================
// TRANSFERT D'ARGENT
// POST /api/transactions/transfer
// ============================================
exports.transfer = async (req, res) => {
  try {
    const { destinataire, telephoneDestinataire, montant, pin, motif } = req.body;
    const amount = toAmount(montant);
    const telephone = destinataire || telephoneDestinataire;

    if (!amount || amount <= 0) {
      return res.status(400).json({ message: 'Le montant doit être supérieur à 0' });
    }

    if (!telephone) {
      return res.status(400).json({ message: 'Le destinataire est requis' });
    }

    if (!pin) {
      return res.status(400).json({ message: 'Le PIN est requis' });
    }

    // Trouver le destinataire par téléphone
    const destUser = await User.findOne({ telephone });
    if (!destUser) {
      return res.status(404).json({ message: 'Destinataire non trouvé' });
    }

    // Empêcher le transfert vers soi-même
    if (destUser._id.toString() === req.user.id) {
      return res.status(400).json({ message: 'Impossible de transférer vers vous-même' });
    }

    // Portefeuille source
    const walletSource = await Wallet.findOne({ utilisateurId: req.user.id }).select('+pin');
    if (!walletSource) {
      return res.status(404).json({ message: 'Portefeuille source non trouvé' });
    }

    if (walletSource.estBloque()) {
      return res.status(403).json({ message: 'Votre portefeuille est bloqué' });
    }

    // Vérifier le PIN
    const isPinValid = await walletSource.comparePin(pin);
    if (!isPinValid) {
      await walletSource.incrementerTentativesEchouees();
      return res.status(401).json({ message: 'PIN incorrect' });
    }

    await walletSource.reinitialiserTentatives();

    // Vérifier le solde
    if (!walletSource.aSoldeSuffisant(amount)) {
      return res.status(400).json({ message: 'Solde insuffisant' });
    }

    // Portefeuille destination
    const walletDest = await Wallet.findOne({ utilisateurId: destUser._id });
    if (!walletDest) {
      return res.status(404).json({ message: 'Portefeuille destinataire non trouvé' });
    }

    const soldeAvantSource = walletSource.solde;
    const soldeAvantDest = walletDest.solde;

    // Créer la transaction
    const transaction = await Transaction.create({
      type: 'TRANSFER',
      montant: amount,
      devise: walletSource.devise,
      walletSourceId: walletSource._id,
      utilisateurSourceId: req.user.id,
      walletDestinationId: walletDest._id,
      utilisateurDestinationId: destUser._id,
      description: motif || 'Transfert d\'argent',
      referenceExterne: Transaction.genererReference(),
      statut: 'SUCCES',
      soldeAvantSource,
      soldeApresSource: soldeAvantSource - amount,
      soldeAvantDestination: soldeAvantDest,
      soldeApresDestination: soldeAvantDest + amount
    });

    // Effectuer le transfert
    await walletSource.debiter(amount);
    await walletDest.crediter(amount);

    // Envoyer notifications aux deux parties
    const sourceUser = await User.findById(req.user.id);
    if (sourceUser) {
      NotificationService.notifyTransferSender(sourceUser, transaction, destUser).catch(err => {
        console.error('Erreur notification expéditeur:', err);
      });
    }
    NotificationService.notifyTransferReceiver(destUser, transaction, sourceUser || { telephone: 'Inconnu' }).catch(err => {
      console.error('Erreur notification destinataire:', err);
    });

    return res.status(200).json({
      message: 'Transfert effectué avec succès',
      nouveauSolde: walletSource.solde,
      soldeEmetteur: walletSource.solde,
      transaction: {
        id: transaction._id,
        type: 'TRANSFER',
        montant: amount,
        destinataire: {
          nom: destUser.nomComplet,
          telephone: destUser.telephone
        },
        reference: transaction.referenceExterne,
        date: transaction.createdAt
      }
    });

  } catch (error) {
    console.error('Erreur transfert:', error);
    return res.status(500).json({ message: 'Erreur lors du transfert', error: error.message });
  }
};

// ============================================
// PAIEMENT MARCHAND
// POST /api/transactions/merchant-payment
// ============================================
exports.merchantPayment = async (req, res) => {
  try {
    const { codeMarchand, montant, pin, motif } = req.body;
    const amount = toAmount(montant);

    if (!amount || amount <= 0) {
      return res.status(400).json({ message: 'Le montant doit être supérieur à 0' });
    }

    if (!codeMarchand) {
      return res.status(400).json({ message: 'Le code marchand est requis' });
    }

    if (!pin) {
      return res.status(400).json({ message: 'Le PIN est requis' });
    }

    // Trouver le marchand
    const marchand = await User.findOne({ codeMarchand, role: 'marchand' });
    if (!marchand) {
      return res.status(404).json({ message: 'Code marchand invalide ou introuvable' });
    }

    // Portefeuille client
    const walletClient = await Wallet.findOne({ utilisateurId: req.user.id }).select('+pin');
    if (!walletClient) {
      return res.status(404).json({ message: 'Portefeuille non trouvé' });
    }

    // Vérifier le PIN
    const isPinValid = await walletClient.comparePin(pin);
    if (!isPinValid) {
      await walletClient.incrementerTentativesEchouees();
      return res.status(401).json({ message: 'PIN incorrect' });
    }

    await walletClient.reinitialiserTentatives();

    // Vérifier le solde
    if (!walletClient.aSoldeSuffisant(amount)) {
      return res.status(400).json({ message: 'Solde insuffisant' });
    }

    // Portefeuille marchand
    const walletMarchand = await Wallet.findOne({ utilisateurId: marchand._id });
    if (!walletMarchand) {
      return res.status(404).json({ message: 'Portefeuille marchand non trouvé' });
    }

    const soldeAvantClient = walletClient.solde;
    const soldeAvantMarchand = walletMarchand.solde;

    // Créer la transaction
    const transaction = await Transaction.create({
      type: 'MERCHANT_PAYMENT',
      montant: amount,
      devise: walletClient.devise,
      walletSourceId: walletClient._id,
      utilisateurSourceId: req.user.id,
      walletDestinationId: walletMarchand._id,
      utilisateurDestinationId: marchand._id,
      description: motif || `Paiement ${marchand.nomCommerce || marchand.nomComplet}`,
      referenceExterne: Transaction.genererReference(),
      statut: 'SUCCES',
      soldeAvantSource: soldeAvantClient,
      soldeApresSource: soldeAvantClient - amount,
      soldeAvantDestination: soldeAvantMarchand,
      soldeApresDestination: soldeAvantMarchand + amount,
      metadata: { codeMarchand }
    });

    // Effectuer le paiement
    await walletClient.debiter(amount);
    await walletMarchand.crediter(amount);

    return res.status(200).json({
      message: 'Paiement marchand réussi',
      nouveauSolde: walletClient.solde,
      soldeClient: walletClient.solde,
      transaction: {
        id: transaction._id,
        type: 'MERCHANT_PAYMENT',
        montant: amount,
        marchand: {
          nom: marchand.nomCommerce || marchand.nomComplet,
          code: codeMarchand
        },
        reference: transaction.referenceExterne,
        date: transaction.createdAt
      }
    });

  } catch (error) {
    console.error('Erreur paiement marchand:', error);
    return res.status(500).json({ message: 'Erreur lors du paiement', error: error.message });
  }
};

// ============================================
// HISTORIQUE DES TRANSACTIONS AMÉLIORÉ
// GET /api/transactions/history
// Filtres: type, statut, dateDebut, dateFin, montantMin, montantMax, recherche
// ============================================
exports.getHistory = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 20, 
      type,
      statut,
      dateDebut,
      dateFin,
      montantMin,
      montantMax,
      recherche,
      tri = 'date_desc'
    } = req.query;

    // Construction de la requête de base
    const query = {
      $or: [
        { utilisateurSourceId: req.user.id },
        { utilisateurDestinationId: req.user.id }
      ]
    };

    // Filtre par type
    if (type) {
      const types = type.split(',').map(t => t.toUpperCase().trim());
      query.type = { $in: types };
    }

    // Filtre par statut
    if (statut) {
      query.statut = statut.toUpperCase();
    }

    // Filtre par date
    if (dateDebut || dateFin) {
      query.createdAt = {};
      if (dateDebut) {
        query.createdAt.$gte = new Date(dateDebut);
      }
      if (dateFin) {
        const endDate = new Date(dateFin);
        endDate.setHours(23, 59, 59, 999);
        query.createdAt.$lte = endDate;
      }
    }

    // Filtre par montant
    if (montantMin || montantMax) {
      query.montant = {};
      if (montantMin) query.montant.$gte = Number(montantMin);
      if (montantMax) query.montant.$lte = Number(montantMax);
    }

    // Recherche textuelle (référence, description)
    if (recherche) {
      query.$and = query.$and || [];
      query.$and.push({
        $or: [
          { referenceExterne: { $regex: recherche, $options: 'i' } },
          { description: { $regex: recherche, $options: 'i' } }
        ]
      });
    }

    // Options de tri
    const sortOptions = {
      'date_desc': { createdAt: -1 },
      'date_asc': { createdAt: 1 },
      'montant_desc': { montant: -1 },
      'montant_asc': { montant: 1 }
    };
    const sortOrder = sortOptions[tri] || { createdAt: -1 };

    const transactions = await Transaction.find(query)
      .sort(sortOrder)
      .skip((page - 1) * limit)
      .limit(Number(limit))
      .populate('utilisateurSourceId', 'nomComplet telephone')
      .populate('utilisateurDestinationId', 'nomComplet telephone');

    const total = await Transaction.countDocuments(query);

    // Calcul des totaux pour la période filtrée
    const totaux = await Transaction.aggregate([
      { $match: { ...query, statut: 'SUCCES' } },
      {
        $group: {
          _id: null,
          totalEntrees: {
            $sum: {
              $cond: [
                { $eq: ['$utilisateurDestinationId', req.user._id] },
                '$montant',
                0
              ]
            }
          },
          totalSorties: {
            $sum: {
              $cond: [
                { $eq: ['$utilisateurSourceId', req.user._id] },
                '$montant',
                0
              ]
            }
          }
        }
      }
    ]);

    return res.status(200).json({
      transactions,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / limit)
      },
      resume: totaux[0] || { totalEntrees: 0, totalSorties: 0 },
      filtres: { type, statut, dateDebut, dateFin, montantMin, montantMax, recherche, tri }
    });

  } catch (error) {
    console.error('Erreur historique:', error);
    return res.status(500).json({ message: 'Erreur lors de la récupération', error: error.message });
  }
};

// ============================================
// EXPORT DES TRANSACTIONS (CSV/JSON)
// GET /api/transactions/export
// ============================================
exports.exportHistory = async (req, res) => {
  try {
    const { 
      format = 'csv',
      type,
      dateDebut,
      dateFin,
      limit = 500
    } = req.query;

    // Construction de la requête
    const query = {
      $or: [
        { utilisateurSourceId: req.user.id },
        { utilisateurDestinationId: req.user.id }
      ],
      statut: 'SUCCES'
    };

    if (type) {
      query.type = type.toUpperCase();
    }

    if (dateDebut || dateFin) {
      query.createdAt = {};
      if (dateDebut) query.createdAt.$gte = new Date(dateDebut);
      if (dateFin) {
        const endDate = new Date(dateFin);
        endDate.setHours(23, 59, 59, 999);
        query.createdAt.$lte = endDate;
      }
    }

    const transactions = await Transaction.find(query)
      .sort({ createdAt: -1 })
      .limit(Number(limit))
      .populate('utilisateurSourceId', 'nomComplet telephone')
      .populate('utilisateurDestinationId', 'nomComplet telephone')
      .lean();

    // Format JSON
    if (format === 'json') {
      return res.status(200).json({
        exportDate: new Date().toISOString(),
        totalTransactions: transactions.length,
        transactions: transactions.map(t => ({
          reference: t.referenceExterne,
          type: t.type,
          montant: t.montant,
          devise: t.devise,
          date: t.createdAt,
          description: t.description,
          de: t.utilisateurSourceId?.nomComplet || '-',
          vers: t.utilisateurDestinationId?.nomComplet || '-'
        }))
      });
    }

    // Format CSV
    const csvHeader = 'Reference,Type,Montant,Devise,Date,Description,De,Vers\n';
    const csvRows = transactions.map(t => {
      const date = new Date(t.createdAt).toLocaleString('fr-FR');
      return [
        t.referenceExterne || '',
        t.type,
        t.montant,
        t.devise,
        date,
        (t.description || '').replace(/,/g, ';'),
        t.utilisateurSourceId?.nomComplet || '-',
        t.utilisateurDestinationId?.nomComplet || '-'
      ].join(',');
    }).join('\n');

    const csv = csvHeader + csvRows;

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename=transactions_${Date.now()}.csv`);
    return res.status(200).send(csv);

  } catch (error) {
    console.error('Erreur export:', error);
    return res.status(500).json({ message: 'Erreur lors de l\'export', error: error.message });
  }
};

// ============================================
// STATISTIQUES
// GET /api/transactions/stats
// ============================================
exports.getStats = async (req, res) => {
  try {
    const userId = req.user.id;

    const stats = await Transaction.aggregate([
      {
        $match: {
          $or: [
            { utilisateurSourceId: userId },
            { utilisateurDestinationId: userId }
          ],
          statut: 'SUCCES'
        }
      },
      {
        $group: {
          _id: '$type',
          total: { $sum: '$montant' },
          count: { $sum: 1 }
        }
      }
    ]);

    return res.status(200).json({ stats });

  } catch (error) {
    console.error('Erreur stats:', error);
    return res.status(500).json({ message: 'Erreur', error: error.message });
  }
};

// ============================================
// DÉTAILS D'UNE TRANSACTION
// GET /api/transactions/:id
// ============================================
exports.getTransactionById = async (req, res) => {
  try {
    const transaction = await Transaction.findById(req.params.id)
      .populate('utilisateurSourceId', 'nomComplet telephone')
      .populate('utilisateurDestinationId', 'nomComplet telephone');

    if (!transaction) {
      return res.status(404).json({ message: 'Transaction non trouvée' });
    }

    // Vérifier que l'utilisateur est impliqué
    const isInvolved = 
      transaction.utilisateurSourceId?._id?.toString() === req.user.id ||
      transaction.utilisateurDestinationId?._id?.toString() === req.user.id;

    if (!isInvolved) {
      return res.status(403).json({ message: 'Accès non autorisé' });
    }

    return res.status(200).json({ transaction });

  } catch (error) {
    console.error('Erreur détails transaction:', error);
    return res.status(500).json({ message: 'Erreur', error: error.message });
  }
};
