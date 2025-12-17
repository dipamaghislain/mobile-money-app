// backend/src/controllers/savingsController.js

const SavingsGoal = require('../models/SavingsGoal');
const Wallet = require('../models/Wallet');
const Transaction = require('../models/Transaction');

// @desc    Lister les tirelires de l'utilisateur
// @route   GET /api/savings
// @access  Private
exports.getSavings = async (req, res) => {
  try {
    const { statut, limit, skip } = req.query;

    const options = {
      statut: statut || null,
      limit: parseInt(limit) || 20,
      skip: parseInt(skip) || 0
    };

    const tirelires = await SavingsGoal.obtenirParUtilisateur(req.user.id, options);

    res.status(200).json({
      count: tirelires.length,
      tirelires
    });

  } catch (error) {
    console.error('Erreur lors de la récupération des tirelires:', error);
    res.status(500).json({
      message: 'Erreur lors de la récupération des tirelires',
      error: error.message
    });
  }
};

// @desc    Obtenir une tirelire par ID
// @route   GET /api/savings/:id
// @access  Private
exports.getSavingById = async (req, res) => {
  try {
    const tirelire = await SavingsGoal.findById(req.params.id);

    if (!tirelire) {
      return res.status(404).json({
        message: 'Tirelire non trouvée'
      });
    }

    // Vérifier que la tirelire appartient à l'utilisateur
    if (tirelire.utilisateurId.toString() !== req.user.id) {
      return res.status(403).json({
        message: 'Accès non autorisé à cette tirelire'
      });
    }

    res.status(200).json(tirelire);

  } catch (error) {
    console.error('Erreur lors de la récupération de la tirelire:', error);
    res.status(500).json({
      message: 'Erreur lors de la récupération de la tirelire',
      error: error.message
    });
  }
};

// @desc    Créer une nouvelle tirelire
// @route   POST /api/savings
// @access  Private
exports.createSaving = async (req, res) => {
  try {
    const { nom, description, objectifMontant, dateObjectif, icone, couleur } = req.body;

    if (!nom) {
      return res.status(400).json({
        message: 'Le nom de la tirelire est requis'
      });
    }

    if (objectifMontant && objectifMontant < 0) {
      return res.status(400).json({
        message: 'L\'objectif doit être un montant positif'
      });
    }

    const tirelire = await SavingsGoal.create({
      utilisateurId: req.user.id,
      nom,
      description,
      objectifMontant: objectifMontant || null,
      dateObjectif: dateObjectif || null,
      icone: icone || 'piggy-bank',
      couleur: couleur || '#4CAF50'
    });

    res.status(201).json({
      message: 'Tirelire créée avec succès',
      tirelire: tirelire.obtenirResume()
    });

  } catch (error) {
    console.error('Erreur lors de la création de la tirelire:', error);
    res.status(500).json({
      message: 'Erreur lors de la création de la tirelire',
      error: error.message
    });
  }
};

// @desc    Mettre à jour une tirelire
// @route   PUT /api/savings/:id
// @access  Private
exports.updateSaving = async (req, res) => {
  try {
    const { nom, description, objectifMontant, dateObjectif, icone, couleur } = req.body;

    const tirelire = await SavingsGoal.findById(req.params.id);

    if (!tirelire) {
      return res.status(404).json({
        message: 'Tirelire non trouvée'
      });
    }

    // Vérifier que la tirelire appartient à l'utilisateur
    if (tirelire.utilisateurId.toString() !== req.user.id) {
      return res.status(403).json({
        message: 'Accès non autorisé à cette tirelire'
      });
    }

    // Mise à jour des champs
    if (nom) tirelire.nom = nom;
    if (description !== undefined) tirelire.description = description;
    if (objectifMontant !== undefined) tirelire.objectifMontant = objectifMontant;
    if (dateObjectif !== undefined) tirelire.dateObjectif = dateObjectif;
    if (icone) tirelire.icone = icone;
    if (couleur) tirelire.couleur = couleur;

    await tirelire.save();

    res.status(200).json({
      message: 'Tirelire mise à jour avec succès',
      tirelire: tirelire.obtenirResume()
    });

  } catch (error) {
    console.error('Erreur lors de la mise à jour de la tirelire:', error);
    res.status(500).json({
      message: 'Erreur lors de la mise à jour de la tirelire',
      error: error.message
    });
  }
};

// @desc    Verser dans une tirelire
// @route   POST /api/savings/:id/deposit
// @access  Private
exports.depositToSaving = async (req, res) => {
  try {
    const { montant, pin } = req.body;

    if (!montant || montant <= 0) {
      return res.status(400).json({
        message: 'Le montant doit être supérieur à 0'
      });
    }

    if (!pin) {
      return res.status(400).json({
        message: 'Le PIN est requis'
      });
    }

    const tirelire = await SavingsGoal.findById(req.params.id);

    if (!tirelire) {
      return res.status(404).json({
        message: 'Tirelire non trouvée'
      });
    }

    // Vérifier que la tirelire appartient à l'utilisateur
    if (tirelire.utilisateurId.toString() !== req.user.id) {
      return res.status(403).json({
        message: 'Accès non autorisé à cette tirelire'
      });
    }

    // Trouver le portefeuille
    const wallet = await Wallet.findOne({ utilisateurId: req.user.id }).select('+pin');

    if (!wallet) {
      return res.status(404).json({
        message: 'Portefeuille non trouvé'
      });
    }

    // Vérifier le PIN
    if (wallet.estBloque()) {
      return res.status(403).json({
        message: 'Portefeuille bloqué temporairement'
      });
    }

    const isPinValid = await wallet.comparePin(pin);
    if (!isPinValid) {
      await wallet.incrementerTentativesEchouees();
      return res.status(401).json({
        message: 'PIN incorrect'
      });
    }

    await wallet.reinitialiserTentatives();

    // Vérifier le solde
    if (!wallet.aSoldeSuffisant(montant)) {
      return res.status(400).json({
        message: 'Solde insuffisant'
      });
    }

    // Créer la transaction
    const transaction = await Transaction.create({
      type: 'EPARGNE_IN',
      montant,
      devise: wallet.devise,
      walletSourceId: wallet._id,
      utilisateurSourceId: req.user.id,
      description: `Versement dans ${tirelire.nom}`,
      referenceExterne: Transaction.genererReference(),
      metadata: {
        tirelireId: tirelire._id,
        tirelireNom: tirelire.nom
      }
    });

    // Sauvegarder les montants avant
    const soldeAvantWallet = wallet.solde;
    const montantAvantTirelire = tirelire.montantActuel;

    try {
      // Débiter le portefeuille
      await wallet.debiter(montant);

      // Créditer la tirelire
      await tirelire.ajouterMontant(montant);

      // Marquer la transaction comme réussie
      await transaction.marquerReussie(soldeAvantWallet, wallet.solde, 0, 0);

      res.status(200).json({
        message: 'Montant ajouté à la tirelire',
        montantActuel: tirelire.montantActuel,
        soldePortefeuille: wallet.solde,
        objectifAtteint: tirelire.objectifAtteint,
        pourcentageProgression: tirelire.pourcentageProgression,
        transaction: {
          id: transaction._id,
          reference: transaction.referenceExterne,
          date: transaction.dateCreation
        }
      });

    } catch (error) {
      await transaction.marquerEchouee(error.message);
      throw error;
    }

  } catch (error) {
    console.error('Erreur lors du versement dans la tirelire:', error);
    res.status(500).json({
      message: 'Erreur lors du versement dans la tirelire',
      error: error.message
    });
  }
};

// @desc    Retirer d'une tirelire vers le portefeuille principal
// @route   POST /api/savings/:id/withdraw
// @access  Private
exports.withdrawFromSaving = async (req, res) => {
  try {
    const { montant, pin } = req.body;

    if (!montant || montant <= 0) {
      return res.status(400).json({
        message: 'Le montant doit être supérieur à 0'
      });
    }

    if (!pin) {
      return res.status(400).json({
        message: 'Le PIN est requis'
      });
    }

    const tirelire = await SavingsGoal.findById(req.params.id);

    if (!tirelire) {
      return res.status(404).json({
        message: 'Tirelire non trouvée'
      });
    }

    // Vérifier que la tirelire appartient à l'utilisateur
    if (tirelire.utilisateurId.toString() !== req.user.id) {
      return res.status(403).json({
        message: 'Accès non autorisé à cette tirelire'
      });
    }

    // Trouver le portefeuille
    const wallet = await Wallet.findOne({ utilisateurId: req.user.id }).select('+pin');

    if (!wallet) {
      return res.status(404).json({
        message: 'Portefeuille non trouvé'
      });
    }

    // Vérifier le PIN
    if (wallet.estBloque()) {
      return res.status(403).json({
        message: 'Portefeuille bloqué temporairement'
      });
    }

    const isPinValid = await wallet.comparePin(pin);
    if (!isPinValid) {
      await wallet.incrementerTentativesEchouees();
      return res.status(401).json({
        message: 'PIN incorrect'
      });
    }

    await wallet.reinitialiserTentatives();

    // Vérifier que la tirelire a assez d'argent
    if (tirelire.montantActuel < montant) {
      return res.status(400).json({
        message: 'Montant insuffisant dans la tirelire'
      });
    }

    // Créer la transaction
    const transaction = await Transaction.create({
      type: 'EPARGNE_OUT',
      montant,
      devise: wallet.devise,
      walletDestinationId: wallet._id,
      utilisateurDestinationId: req.user.id,
      description: `Retrait depuis ${tirelire.nom}`,
      referenceExterne: Transaction.genererReference(),
      metadata: {
        tirelireId: tirelire._id,
        tirelireNom: tirelire.nom
      }
    });

    // Sauvegarder les montants avant
    const soldeAvantWallet = wallet.solde;
    const montantAvantTirelire = tirelire.montantActuel;

    try {
      // Retirer de la tirelire
      await tirelire.retirerMontant(montant);

      // Créditer le portefeuille
      await wallet.crediter(montant);

      // Marquer la transaction comme réussie
      await transaction.marquerReussie(0, 0, soldeAvantWallet, wallet.solde);

      res.status(200).json({
        message: 'Montant transféré vers le portefeuille principal',
        montantActuel: tirelire.montantActuel,
        soldePortefeuille: wallet.solde,
        transaction: {
          id: transaction._id,
          reference: transaction.referenceExterne,
          date: transaction.dateCreation
        }
      });

    } catch (error) {
      await transaction.marquerEchouee(error.message);
      throw error;
    }

  } catch (error) {
    console.error('Erreur lors du retrait de la tirelire:', error);
    res.status(500).json({
      message: 'Erreur lors du retrait de la tirelire',
      error: error.message
    });
  }
};

// @desc    Supprimer une tirelire (annuler)
// @route   DELETE /api/savings/:id
// @access  Private
exports.deleteSaving = async (req, res) => {
  try {
    const tirelire = await SavingsGoal.findById(req.params.id);

    if (!tirelire) {
      return res.status(404).json({
        message: 'Tirelire non trouvée'
      });
    }

    // Vérifier que la tirelire appartient à l'utilisateur
    if (tirelire.utilisateurId.toString() !== req.user.id) {
      return res.status(403).json({
        message: 'Accès non autorisé à cette tirelire'
      });
    }

    // Vérifier que la tirelire est vide
    if (tirelire.montantActuel > 0) {
      return res.status(400).json({
        message: 'Impossible de supprimer une tirelire contenant de l\'argent. Retirez d\'abord les fonds.'
      });
    }

    // Annuler la tirelire
    await tirelire.annuler();

    res.status(200).json({
      message: 'Tirelire supprimée avec succès'
    });

  } catch (error) {
    console.error('Erreur lors de la suppression de la tirelire:', error);
    res.status(500).json({
      message: 'Erreur lors de la suppression de la tirelire',
      error: error.message
    });
  }
};

// @desc    Obtenir les statistiques d'épargne de l'utilisateur
// @route   GET /api/savings/statistics
// @access  Private
exports.getSavingsStatistics = async (req, res) => {
  try {
    const stats = await SavingsGoal.obtenirStatistiques(req.user.id);

    res.status(200).json(stats);

  } catch (error) {
    console.error('Erreur lors de la récupération des statistiques:', error);
    res.status(500).json({
      message: 'Erreur lors de la récupération des statistiques',
      error: error.message
    });
  }
};