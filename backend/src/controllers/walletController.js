// backend/src/controllers/walletController.js

const Wallet = require('../models/Wallet');
const Transaction = require('../models/Transaction');

// @desc    Consulter le solde du portefeuille
// @route   GET /api/wallet
// @access  Private
exports.getWallet = async (req, res) => {
  try {
    const wallet = await Wallet.findOne({ utilisateurId: req.user.id });

    if (!wallet) {
      return res.status(404).json({
        message: 'Portefeuille non trouvé'
      });
    }

    return res.status(200).json({
      id: wallet._id,
      solde: wallet.solde,
      devise: wallet.devise,
      statut: wallet.statut
    });
  } catch (error) {
    console.error('Erreur lors de la consultation du solde:', error);
    return res.status(500).json({
      message: 'Erreur lors de la consultation du solde',
      error: error.message
    });
  }
};

// @desc    Définir ou modifier le code PIN
// @route   PATCH /api/wallet/pin
// @access  Private
exports.setPin = async (req, res) => {
  try {
    const { ancienPin, nouveauPin } = req.body;

    if (!nouveauPin) {
      return res.status(400).json({
        message: 'Le nouveau PIN est requis'
      });
    }

    // Vérifier la longueur du PIN
    if (nouveauPin.length < 4 || nouveauPin.length > 6) {
      return res.status(400).json({
        message: 'Le PIN doit contenir entre 4 et 6 chiffres'
      });
    }

    // Vérifier que le PIN ne contient que des chiffres
    if (!/^\d+$/.test(nouveauPin)) {
      return res.status(400).json({
        message: 'Le PIN doit contenir uniquement des chiffres'
      });
    }

    const wallet = await Wallet.findOne({ utilisateurId: req.user.id }).select('+pin');

    if (!wallet) {
      return res.status(404).json({
        message: 'Portefeuille non trouvé'
      });
    }

    // Cas 1 : un PIN existe déjà → on exige l'ancien PIN
    if (wallet.pin) {
      if (!ancienPin) {
        return res.status(400).json({
          message: 'L\'ancien PIN est requis pour modifier le PIN'
        });
      }

      const isPinValid = await wallet.comparePin(ancienPin);
      if (!isPinValid) {
        return res.status(401).json({
          message: 'Ancien PIN incorrect'
        });
      }
    }

    // Cas 2 : aucun PIN n'existe encore → premier paramétrage
    // Dans les deux cas, on applique le nouveau PIN
    wallet.pin = nouveauPin;
    // On réinitialise les tentatives et le blocage
    wallet.tentativesPinEchouees = 0;
    wallet.dateBlocagePin = null;

    await wallet.save();

    return res.status(200).json({
      message: wallet.pin ? 'PIN mis à jour avec succès' : 'PIN défini avec succès'
    });
  } catch (error) {
    console.error('Erreur lors de la mise à jour du PIN:', error);
    return res.status(500).json({
      message: 'Erreur lors de la mise à jour du PIN',
      error: error.message
    });
  }
};

// @desc    Vérifier le code PIN
// @route   POST /api/wallet/verify-pin
// @access  Private
exports.verifyPin = async (req, res) => {
  try {
    const { pin } = req.body;

    if (!pin) {
      return res.status(400).json({
        message: 'Le PIN est requis'
      });
    }

    const wallet = await Wallet.findOne({ utilisateurId: req.user.id }).select('+pin');

    if (!wallet) {
      return res.status(404).json({
        message: 'Portefeuille non trouvé'
      });
    }

    if (!wallet.pin) {
      return res.status(400).json({
        message: 'Aucun PIN n\'a été défini pour ce portefeuille'
      });
    }

    // Vérifier si le portefeuille est bloqué
    if (wallet.estBloque()) {
      return res.status(403).json({
        message: 'Portefeuille bloqué temporairement. Réessayez plus tard.'
      });
    }

    // Vérifier le PIN
    const isPinValid = await wallet.comparePin(pin);

    if (!isPinValid) {
      // Incrémente les tentatives et gère le blocage éventuel
      await wallet.incrementerTentativesEchouees();

      const maxTentatives = parseInt(process.env.MAX_PIN_ATTEMPTS) || 3;
      const tentativesRestantes = maxTentatives - wallet.tentativesPinEchouees;

      if (tentativesRestantes <= 0) {
        return res.status(403).json({
          message: 'Portefeuille bloqué pour 30 minutes suite à trop de tentatives échouées'
        });
      }

      return res.status(401).json({
        message: `PIN incorrect. ${tentativesRestantes} tentative(s) restante(s)`
      });
    }

    // PIN correct - réinitialiser les tentatives
    await wallet.reinitialiserTentatives();

    return res.status(200).json({
      message: 'PIN correct',
      valide: true
    });
  } catch (error) {
    console.error('Erreur lors de la vérification du PIN:', error);
    return res.status(500).json({
      message: 'Erreur lors de la vérification du PIN',
      error: error.message
    });
  }
};

// @desc    Obtenir l'historique des transactions
// @route   GET /api/wallet/transactions
// @access  Private
exports.getTransactions = async (req, res) => {
  try {
    const { type, startDate, endDate, limit, skip } = req.query;

    const wallet = await Wallet.findOne({ utilisateurId: req.user.id });

    if (!wallet) {
      return res.status(404).json({
        message: 'Portefeuille non trouvé'
      });
    }

    const options = {
      type: type || null,
      startDate: startDate || null,
      endDate: endDate || null,
      limit: parseInt(limit, 10) || 50,
      skip: parseInt(skip, 10) || 0
    };

    const transactions = await Transaction.obtenirParWallet(wallet._id, options);

    return res.status(200).json({
      count: transactions.length,
      transactions
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des transactions:', error);
    return res.status(500).json({
      message: 'Erreur lors de la récupération des transactions',
      error: error.message
    });
  }
};

// @desc    Obtenir les statistiques du portefeuille
// @route   GET /api/wallet/statistics
// @access  Private
exports.getStatistics = async (req, res) => {
  try {
    const { periode } = req.query;

    const wallet = await Wallet.findOne({ utilisateurId: req.user.id });

    if (!wallet) {
      return res.status(404).json({
        message: 'Portefeuille non trouvé'
      });
    }

    const days = parseInt(periode, 10) || 30;

    const stats = await Transaction.obtenirStatistiques(wallet._id, days);

    return res.status(200).json({
      soldeActuel: wallet.solde,
      devise: wallet.devise,
      statistiques: stats
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des statistiques:', error);
    return res.status(500).json({
      message: 'Erreur lors de la récupération des statistiques',
      error: error.message
    });
  }
};
