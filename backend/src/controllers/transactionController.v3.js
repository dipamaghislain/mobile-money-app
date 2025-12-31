// backend/src/controllers/transactionController.v3.js
// Contrôleur de transactions multi-pays avec sécurité PIN améliorée

const CountryTransactionService = require('../services/countryTransactionService');
const PinService = require('../services/pinService');
const Transaction = require('../models/Transaction');
const User = require('../models/User');
const Wallet = require('../models/Wallet');
const { getCountry, getActiveCountries, validatePhoneNumber } = require('../config/countries');
const ApiError = require('../utils/ApiError');
const logger = require('../utils/logger');

// Helper pour convertir le montant
const toAmount = (value) => {
  const n = Number(value);
  return Number.isNaN(n) ? 0 : n;
};

/**
 * @route   POST /api/v3/transactions/deposit
 * @desc    Initier un dépôt depuis Mobile Money
 * @access  Private
 */
exports.deposit = async (req, res) => {
  try {
    const { montant, telephoneSource, operateur, pin } = req.body;
    const amount = toAmount(montant);

    if (!amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Le montant doit être supérieur à 0'
      });
    }

    const result = await CountryTransactionService.createDeposit({
      userId: req.user.id,
      montant: amount,
      telephoneSource,
      operateur,
      pin,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });

    return res.status(200).json({
      success: true,
      data: result
    });
  } catch (error) {
    logger.error('Deposit error:', error);
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Erreur lors du dépôt'
    });
  }
};

/**
 * @route   POST /api/v3/transactions/withdraw
 * @desc    Initier un retrait vers Mobile Money
 * @access  Private
 */
exports.withdraw = async (req, res) => {
  try {
    const { montant, telephoneDestination, operateur, pin } = req.body;
    const amount = toAmount(montant);

    if (!amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Le montant doit être supérieur à 0'
      });
    }

    if (!pin) {
      return res.status(400).json({
        success: false,
        message: 'Le code PIN est requis pour les retraits'
      });
    }

    const result = await CountryTransactionService.createWithdrawal({
      userId: req.user.id,
      montant: amount,
      telephoneDestination,
      operateur,
      pin,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });

    return res.status(200).json({
      success: true,
      data: result
    });
  } catch (error) {
    logger.error('Withdrawal error:', error);
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Erreur lors du retrait'
    });
  }
};

/**
 * @route   POST /api/v3/transactions/transfer
 * @desc    Transférer de l'argent à un autre utilisateur
 * @access  Private
 */
exports.transfer = async (req, res) => {
  try {
    const { montant, telephoneDestination, paysDestination, description, pin } = req.body;
    const amount = toAmount(montant);

    if (!amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Le montant doit être supérieur à 0'
      });
    }

    if (!telephoneDestination) {
      return res.status(400).json({
        success: false,
        message: 'Le numéro de téléphone du destinataire est requis'
      });
    }

    if (!pin) {
      return res.status(400).json({
        success: false,
        message: 'Le code PIN est requis pour les transferts'
      });
    }

    const result = await CountryTransactionService.createTransfer({
      userId: req.user.id,
      montant: amount,
      telephoneDestination,
      paysDestination,
      description,
      pin,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });

    return res.status(200).json({
      success: true,
      data: result
    });
  } catch (error) {
    logger.error('Transfer error:', error);
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Erreur lors du transfert'
    });
  }
};

/**
 * @route   POST /api/v3/transactions/validate-recipient
 * @desc    Valider un destinataire avant transfert
 * @access  Private
 */
exports.validateRecipient = async (req, res) => {
  try {
    const { telephone, pays } = req.body;
    const user = await User.findById(req.user.id);
    
    // Utiliser le pays de l'utilisateur si non spécifié
    const targetPays = pays || user.pays;

    // Valider le format du numéro
    const phoneValidation = validatePhoneNumber(telephone, targetPays);
    if (!phoneValidation.valid) {
      return res.status(400).json({
        success: false,
        valid: false,
        message: phoneValidation.error
      });
    }

    // Chercher le destinataire
    const recipient = await User.findOne({
      $or: [
        { telephone: phoneValidation.numeroFormate },
        { telephone: phoneValidation.numeroLocal },
        { telephone }
      ]
    });

    if (!recipient) {
      return res.status(404).json({
        success: false,
        valid: false,
        message: 'Aucun compte trouvé avec ce numéro'
      });
    }

    if (recipient._id.equals(req.user.id)) {
      return res.status(400).json({
        success: false,
        valid: false,
        message: 'Vous ne pouvez pas vous transférer de l\'argent'
      });
    }

    // Détecter le provider
    const provider = CountryTransactionService.detectMobileMoneyProvider(
      telephone, 
      recipient.pays
    );

    // Vérifier si cross-border
    const isCrossBorder = recipient.pays !== user.pays;
    const countryDest = getCountry(recipient.pays);

    return res.status(200).json({
      success: true,
      valid: true,
      recipient: {
        nom: recipient.nomComplet,
        telephone: phoneValidation.numeroFormate,
        pays: recipient.pays,
        paysNom: countryDest?.nom,
        provider: provider.provider
      },
      isCrossBorder,
      warnings: isCrossBorder ? [{
        code: 'CROSS_BORDER',
        message: `Transfert international vers ${countryDest?.nom}`
      }] : []
    });
  } catch (error) {
    logger.error('Validate recipient error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Erreur lors de la validation'
    });
  }
};

/**
 * @route   GET /api/v3/transactions/history
 * @desc    Historique des transactions de l'utilisateur
 * @access  Private
 */
exports.getHistory = async (req, res) => {
  try {
    const { page = 1, limit = 20, type, status, startDate, endDate } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const query = {
      $or: [
        { utilisateurSourceId: req.user.id },
        { utilisateurDestinationId: req.user.id }
      ]
    };

    if (type) {
      query.type = type.toUpperCase();
    }

    if (status) {
      query.statut = status.toUpperCase();
    }

    if (startDate || endDate) {
      query.dateCreation = {};
      if (startDate) query.dateCreation.$gte = new Date(startDate);
      if (endDate) query.dateCreation.$lte = new Date(endDate);
    }

    const [transactions, total] = await Promise.all([
      Transaction.find(query)
        .sort({ dateCreation: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .populate('utilisateurSourceId', 'nomComplet telephone')
        .populate('utilisateurDestinationId', 'nomComplet telephone'),
      Transaction.countDocuments(query)
    ]);

    const formattedTransactions = transactions.map(t => ({
      ...t.obtenirResume(),
      direction: t.utilisateurSourceId?._id?.equals(req.user.id) ? 'OUT' : 'IN',
      correspondant: t.utilisateurSourceId?._id?.equals(req.user.id) 
        ? t.utilisateurDestinationId 
        : t.utilisateurSourceId
    }));

    return res.status(200).json({
      success: true,
      data: {
        transactions: formattedTransactions,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit))
        }
      }
    });
  } catch (error) {
    logger.error('Get history error:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération de l\'historique'
    });
  }
};

/**
 * @route   GET /api/v3/transactions/:id
 * @desc    Détails d'une transaction
 * @access  Private
 */
exports.getTransaction = async (req, res) => {
  try {
    const transaction = await Transaction.findOne({
      _id: req.params.id,
      $or: [
        { utilisateurSourceId: req.user.id },
        { utilisateurDestinationId: req.user.id }
      ]
    })
      .populate('utilisateurSourceId', 'nomComplet telephone pays')
      .populate('utilisateurDestinationId', 'nomComplet telephone pays');

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: 'Transaction non trouvée'
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        ...transaction.obtenirResume(),
        details: {
          source: transaction.utilisateurSourceId,
          destination: transaction.utilisateurDestinationId,
          soldeAvantSource: transaction.soldeAvantSource,
          soldeApresSource: transaction.soldeApresSource,
          soldeAvantDestination: transaction.soldeAvantDestination,
          soldeApresDestination: transaction.soldeApresDestination,
          provider: transaction.providerTransaction,
          dateTraitement: transaction.dateTraitement
        }
      }
    });
  } catch (error) {
    logger.error('Get transaction error:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération de la transaction'
    });
  }
};

/**
 * @route   GET /api/v3/transactions/countries
 * @desc    Liste des pays supportés avec leurs informations
 * @access  Public
 */
exports.getCountries = async (req, res) => {
  try {
    const countries = getActiveCountries().map(country => ({
      code: country.code,
      nom: country.nom,
      indicatif: country.indicatif,
      devise: country.devise,
      symbole: country.symbole,
      formatTelephone: country.formatTelephone,
      providers: CountryTransactionService.getProvidersForCountry(country.code),
      operateurs: CountryTransactionService.getProvidersForCountry(country.code),
      limites: country.limites,
      frais: country.frais
    }));

    return res.status(200).json({
      success: true,
      data: { countries }
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des pays'
    });
  }
};

/**
 * @route   GET /api/v3/transactions/country/:code
 * @desc    Informations d'un pays spécifique
 * @access  Public
 */
exports.getCountryInfo = async (req, res) => {
  try {
    const countryInfo = CountryTransactionService.getCountryTransactionInfo(req.params.code);
    return res.status(200).json({
      success: true,
      data: countryInfo
    });
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Pays non trouvé'
    });
  }
};

/**
 * @route   POST /api/v3/transactions/calculate-fees
 * @desc    Calculer les frais pour une transaction
 * @access  Private
 */
exports.calculateFees = async (req, res) => {
  try {
    const { montant, type, paysDestination } = req.body;
    const amount = toAmount(montant);
    const user = await User.findById(req.user.id);

    if (!amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Montant invalide'
      });
    }

    const { calculateFees, getCountry } = require('../config/countries');
    const frais = calculateFees(amount, type || 'TRANSFER', user.pays, paysDestination);
    const country = getCountry(user.pays);

    return res.status(200).json({
      success: true,
      data: {
        montant: amount,
        frais,
        montantTotal: amount + frais,
        tauxFrais: ((frais / amount) * 100).toFixed(2),
        devise: country.devise,
        symbole: country.symbole,
        isCrossBorder: paysDestination && paysDestination !== user.pays
      }
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Erreur lors du calcul des frais'
    });
  }
};

// ============================================
// GESTION DU PIN
// ============================================

/**
 * @route   POST /api/v3/pin/setup
 * @desc    Configurer le code PIN
 * @access  Private
 */
exports.setupPin = async (req, res) => {
  try {
    const { pin, confirmPin } = req.body;

    if (!pin || !confirmPin) {
      return res.status(400).json({
        success: false,
        message: 'Le code PIN et sa confirmation sont requis'
      });
    }

    if (pin !== confirmPin) {
      return res.status(400).json({
        success: false,
        message: 'Les codes PIN ne correspondent pas'
      });
    }

    const result = await PinService.setupPin(req.user.id, pin);

    return res.status(200).json({
      success: true,
      message: result.message
    });
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Erreur lors de la configuration du PIN'
    });
  }
};

/**
 * @route   POST /api/v3/pin/change
 * @desc    Changer le code PIN
 * @access  Private
 */
exports.changePin = async (req, res) => {
  try {
    const { currentPin, newPin, confirmNewPin } = req.body;

    if (!currentPin || !newPin || !confirmNewPin) {
      return res.status(400).json({
        success: false,
        message: 'Tous les champs sont requis'
      });
    }

    if (newPin !== confirmNewPin) {
      return res.status(400).json({
        success: false,
        message: 'Les nouveaux codes PIN ne correspondent pas'
      });
    }

    const result = await PinService.changePin(req.user.id, currentPin, newPin);

    return res.status(200).json({
      success: true,
      message: 'Code PIN modifié avec succès'
    });
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Erreur lors du changement du PIN'
    });
  }
};

/**
 * @route   POST /api/v3/pin/verify
 * @desc    Vérifier le code PIN
 * @access  Private
 */
exports.verifyPin = async (req, res) => {
  try {
    const { pin } = req.body;

    if (!pin) {
      return res.status(400).json({
        success: false,
        message: 'Le code PIN est requis'
      });
    }

    await PinService.verifyPin(req.user.id, pin);

    return res.status(200).json({
      success: true,
      message: 'Code PIN valide'
    });
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Erreur de vérification'
    });
  }
};

/**
 * @route   GET /api/v3/pin/status
 * @desc    Statut du PIN de l'utilisateur
 * @access  Private
 */
exports.getPinStatus = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select(
      'pinConfigured pinBloqueJusqua tentativesPinEchouees niveauBlocagePin'
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Utilisateur non trouvé'
      });
    }

    const isLocked = user.pinEstBloque();
    let lockTimeRemaining = null;

    if (isLocked && user.pinBloqueJusqua) {
      lockTimeRemaining = Math.ceil((user.pinBloqueJusqua - new Date()) / 60000);
    }

    return res.status(200).json({
      success: true,
      data: {
        configured: user.pinConfigured,
        locked: isLocked,
        lockTimeRemaining,
        failedAttempts: user.tentativesPinEchouees,
        lockLevel: user.niveauBlocagePin
      }
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération du statut'
    });
  }
};

// ============================================
// VÉRIFICATION TÉLÉPHONE
// ============================================

/**
 * @route   POST /api/v3/phone/request-verification
 * @desc    Demander la vérification du téléphone
 * @access  Private
 */
exports.requestPhoneVerification = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    if (user.telephoneVerifie) {
      return res.status(400).json({
        success: false,
        message: 'Votre numéro est déjà vérifié'
      });
    }

    // Générer OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    user.otpVerificationTelephone = {
      code: otp,
      expiresAt,
      tentatives: 0
    };
    await user.save();

    // TODO: Envoyer le SMS (intégration avec provider SMS)
    logger.info(`OTP for ${user.telephone}: ${otp}`);

    return res.status(200).json({
      success: true,
      message: 'Code de vérification envoyé par SMS',
      // En dev, on peut retourner l'OTP
      otp: process.env.NODE_ENV === 'development' ? otp : undefined
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Erreur lors de l\'envoi du code'
    });
  }
};

/**
 * @route   POST /api/v3/phone/verify
 * @desc    Vérifier le code OTP
 * @access  Private
 */
exports.verifyPhone = async (req, res) => {
  try {
    const { code } = req.body;
    const user = await User.findById(req.user.id);

    if (!user.otpVerificationTelephone?.code) {
      return res.status(400).json({
        success: false,
        message: 'Aucune demande de vérification en cours'
      });
    }

    if (new Date() > user.otpVerificationTelephone.expiresAt) {
      return res.status(400).json({
        success: false,
        message: 'Code expiré. Veuillez en demander un nouveau'
      });
    }

    if (user.otpVerificationTelephone.tentatives >= 3) {
      return res.status(429).json({
        success: false,
        message: 'Trop de tentatives. Veuillez demander un nouveau code'
      });
    }

    if (user.otpVerificationTelephone.code !== code) {
      user.otpVerificationTelephone.tentatives += 1;
      await user.save();
      return res.status(400).json({
        success: false,
        message: 'Code incorrect'
      });
    }

    // Code correct
    user.telephoneVerifie = true;
    user.otpVerificationTelephone = undefined;
    await user.save();

    return res.status(200).json({
      success: true,
      message: 'Numéro de téléphone vérifié avec succès'
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Erreur lors de la vérification'
    });
  }
};

module.exports = exports;
