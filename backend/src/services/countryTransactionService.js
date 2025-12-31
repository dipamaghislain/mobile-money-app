// backend/src/services/countryTransactionService.js
// Service de transactions avec support multi-pays

const { 
  COUNTRIES, 
  validatePhoneNumber, 
  getCountry, 
  calculateFees, 
  checkTransactionLimits,
  convertAmount 
} = require('../config/countries');
const Transaction = require('../models/Transaction');
const User = require('../models/User');
const Wallet = require('../models/Wallet');
const PinService = require('./pinService');
const ApiError = require('../utils/ApiError');
const logger = require('../utils/logger');

// Providers Mobile Money par pays
const MOBILE_MONEY_PROVIDERS = {
  BF: {
    'Orange Money': { prefix: ['07', '70', '71', '72', '73', '74', '75', '76', '77'], code: 'OM_BF' },
    'Mobicash': { prefix: ['54', '55', '56', '57', '58', '59'], code: 'MC_BF' },
    'Moov Money': { prefix: ['01', '02', '03', '60', '61', '62', '63', '64', '65'], code: 'MV_BF' }
  },
  CI: {
    'Orange Money': { prefix: ['07', '08', '09'], code: 'OM_CI' },
    'MTN Mobile Money': { prefix: ['05', '04'], code: 'MTN_CI' },
    'Moov Money': { prefix: ['01', '02', '03'], code: 'MV_CI' }
  },
  SN: {
    'Orange Money': { prefix: ['77', '78'], code: 'OM_SN' },
    'Free Money': { prefix: ['76'], code: 'FM_SN' },
    'Wave': { prefix: ['77', '78', '76', '70'], code: 'WV_SN' }
  },
  ML: {
    'Orange Money': { prefix: ['70', '71', '72', '73', '74', '75', '76', '77', '78', '79'], code: 'OM_ML' },
    'Mobicash': { prefix: ['60', '61', '62', '63', '64', '65', '66', '67', '68', '69'], code: 'MC_ML' }
  },
  CM: {
    'MTN Mobile Money': { prefix: ['67', '68', '69', '65'], code: 'MTN_CM' },
    'Orange Money': { prefix: ['69', '65', '66'], code: 'OM_CM' }
  },
  TG: {
    'Flooz': { prefix: ['90', '91', '92', '93', '98', '99'], code: 'FZ_TG' },
    'T-Money': { prefix: ['70', '71', '79'], code: 'TM_TG' }
  },
  BJ: {
    'MTN Mobile Money': { prefix: ['96', '97', '98', '99'], code: 'MTN_BJ' },
    'Moov Money': { prefix: ['94', '95', '64', '65', '66', '67', '68', '69'], code: 'MV_BJ' }
  }
};

class CountryTransactionService {
  /**
   * Détecte le provider Mobile Money à partir du numéro de téléphone
   */
  static detectMobileMoneyProvider(telephone, codePays) {
    const providers = MOBILE_MONEY_PROVIDERS[codePays];
    if (!providers) {
      return { provider: null, code: null };
    }

    // Nettoyer le numéro
    let cleanNumber = telephone.replace(/[\s\-\.]/g, '');
    const country = getCountry(codePays);
    
    if (cleanNumber.startsWith(country.indicatif)) {
      cleanNumber = cleanNumber.substring(country.indicatif.length);
    }

    // Chercher le provider correspondant au préfixe
    for (const [providerName, config] of Object.entries(providers)) {
      for (const prefix of config.prefix) {
        if (cleanNumber.startsWith(prefix)) {
          return { provider: providerName, code: config.code };
        }
      }
    }

    return { provider: 'Inconnu', code: null };
  }

  /**
   * Valide une transaction avant exécution
   */
  static async validateTransaction(params) {
    const { 
      userId, 
      type, 
      montant, 
      telephoneDestination, 
      paysDestination,
      pin 
    } = params;

    const errors = [];
    const warnings = [];

    // 1. Récupérer l'utilisateur
    const user = await User.findById(userId);
    if (!user) {
      throw new ApiError(404, 'Utilisateur non trouvé');
    }

    // 2. Vérifier le téléphone vérifié
    if (!user.telephoneVerifie) {
      throw new ApiError(403, 'Votre numéro de téléphone doit être vérifié pour effectuer des transactions');
    }

    // 3. Vérifier le PIN (si fourni)
    if (pin) {
      await PinService.verifyPin(userId, pin);
    }

    // 4. Valider le pays source
    const paysSource = user.pays;
    const countrySource = getCountry(paysSource);
    if (!countrySource || !countrySource.actif) {
      throw new ApiError(400, 'Votre pays n\'est pas actif pour les transactions');
    }

    // 5. Vérifier les limites
    const limitCheck = checkTransactionLimits(montant, type, paysSource);
    if (!limitCheck.valid) {
      throw new ApiError(400, limitCheck.error);
    }

    // 6. Pour les transferts, valider la destination
    if (type === 'TRANSFER' && telephoneDestination) {
      const pays = paysDestination || paysSource;
      const phoneValidation = validatePhoneNumber(telephoneDestination, pays);
      
      if (!phoneValidation.valid) {
        throw new ApiError(400, `Numéro de destination invalide: ${phoneValidation.error}`);
      }

      // Détecter si cross-border
      if (paysDestination && paysDestination !== paysSource) {
        const countryDest = getCountry(paysDestination);
        if (!countryDest || !countryDest.actif) {
          throw new ApiError(400, 'Le pays de destination n\'est pas supporté');
        }
        
        warnings.push({
          code: 'CROSS_BORDER',
          message: `Transfert international vers ${countryDest.nom}. Des frais supplémentaires s'appliquent.`
        });
      }
    }

    // 7. Calculer les frais
    const frais = calculateFees(montant, type, paysSource, paysDestination);
    const montantTotal = montant + frais;

    // 8. Vérifier le solde
    const wallet = await Wallet.findOne({ utilisateurId: userId });
    if (wallet && type !== 'DEPOSIT') {
      if (wallet.solde < montantTotal) {
        throw new ApiError(400, `Solde insuffisant. Vous avez ${wallet.solde} ${countrySource.symbole}, il vous faut ${montantTotal} ${countrySource.symbole}`);
      }
    }

    return {
      valid: true,
      user,
      paysSource,
      countrySource,
      frais,
      montantTotal,
      warnings
    };
  }

  /**
   * Crée une transaction de dépôt (depuis Mobile Money)
   */
  static async createDeposit(params) {
    const { userId, montant, telephoneSource, operateur, pin, ipAddress, userAgent } = params;

    console.log('📥 createDeposit called with:', { userId, montant, operateur });

    // Valider
    console.log('📥 Validating transaction...');
    const validation = await this.validateTransaction({
      userId,
      type: 'DEPOSIT',
      montant,
      pin
    });
    console.log('📥 Validation passed');

    const { user, paysSource, countrySource, frais } = validation;

    // Valider le téléphone source
    const phoneValidation = validatePhoneNumber(telephoneSource || user.telephone, paysSource);
    if (!phoneValidation.valid) {
      throw new ApiError(400, `Numéro invalide: ${phoneValidation.error}`);
    }

    // Détecter le provider
    const providerInfo = this.detectMobileMoneyProvider(
      telephoneSource || user.telephone, 
      paysSource
    );

    // Créer la transaction
    const transaction = new Transaction({
      type: 'DEPOSIT',
      montant,
      devise: countrySource.devise,
      paysSource,
      telephoneSource: phoneValidation.numeroFormate,
      operateurSource: operateur || providerInfo.provider,
      utilisateurDestinationId: userId,
      fraisTransaction: frais,
      tauxFrais: (frais / montant) * 100,
      description: `Dépôt depuis ${operateur || providerInfo.provider}`,
      providerTransaction: {
        providerName: operateur || providerInfo.provider,
        providerStatus: 'PENDING'
      },
      ipAddress,
      userAgent,
      pinVerified: !!pin
    });

    transaction.calculerFrais();
    await transaction.save();

    logger.logTransaction(transaction._id, 'DEPOSIT_CREATED', {
      userId,
      montant,
      provider: providerInfo.provider
    });

    // ============================================
    // MODE DÉVELOPPEMENT: Auto-confirmer le dépôt
    // En production, ceci serait fait par webhook du provider
    // ============================================
    if (process.env.NODE_ENV !== 'production') {
      // Récupérer le wallet
      const wallet = await Wallet.findOne({ utilisateurId: userId });
      if (wallet) {
        // Créditer le wallet
        await wallet.crediter(montant);
        
        // Mettre à jour la transaction comme réussie
        transaction.statut = 'SUCCES';
        transaction.providerTransaction.providerStatus = 'SUCCESS';
        transaction.providerTransaction.confirmedAt = new Date();
        await transaction.save();

        logger.logTransaction(transaction._id, 'DEPOSIT_AUTO_CONFIRMED', {
          userId,
          montant,
          nouveauSolde: wallet.solde
        });

        return {
          success: true,
          transaction: transaction.obtenirResume(),
          nouveauSolde: wallet.solde,
          message: `Dépôt de ${montant} FCFA confirmé (mode test)`
        };
      }
    }

    return {
      success: true,
      transaction: transaction.obtenirResume(),
      message: 'Dépôt initié. En attente de confirmation du paiement mobile.'
    };
  }

  /**
   * Crée une transaction de retrait (vers Mobile Money)
   */
  static async createWithdrawal(params) {
    const { userId, montant, telephoneDestination, operateur, pin, ipAddress, userAgent } = params;

    // Valider avec PIN obligatoire
    if (!pin) {
      throw new ApiError(400, 'Le code PIN est requis pour les retraits');
    }

    const validation = await this.validateTransaction({
      userId,
      type: 'WITHDRAW',
      montant,
      pin
    });

    const { user, paysSource, countrySource, frais, montantTotal } = validation;

    // Utiliser le téléphone de l'utilisateur si non spécifié
    const telephone = telephoneDestination || user.telephone;
    const phoneValidation = validatePhoneNumber(telephone, paysSource);
    if (!phoneValidation.valid) {
      throw new ApiError(400, `Numéro invalide: ${phoneValidation.error}`);
    }

    // Détecter le provider
    const providerInfo = this.detectMobileMoneyProvider(telephone, paysSource);

    // Récupérer le wallet et vérifier le solde
    const wallet = await Wallet.findOne({ utilisateurId: userId });
    if (!wallet || wallet.solde < montantTotal) {
      throw new ApiError(400, 'Solde insuffisant');
    }

    // Créer la transaction
    const transaction = new Transaction({
      type: 'WITHDRAW',
      montant,
      devise: countrySource.devise,
      paysSource,
      telephoneDestination: phoneValidation.numeroFormate,
      operateurDestination: operateur || providerInfo.provider,
      utilisateurSourceId: userId,
      walletSourceId: wallet._id,
      fraisTransaction: frais,
      tauxFrais: (frais / montant) * 100,
      soldeAvantSource: wallet.solde,
      description: `Retrait vers ${operateur || providerInfo.provider}`,
      providerTransaction: {
        providerName: operateur || providerInfo.provider,
        providerStatus: 'PENDING'
      },
      ipAddress,
      userAgent,
      pinVerified: true
    });

    transaction.calculerFrais();
    await transaction.save();

    // Débiter le wallet (en attente de confirmation)
    wallet.solde -= montantTotal;
    wallet.dernierMouvement = new Date();
    await wallet.save();

    transaction.soldeApresSource = wallet.solde;
    await transaction.save();

    logger.logTransaction(transaction._id, 'WITHDRAWAL_CREATED', {
      userId,
      montant,
      telephone: phoneValidation.numeroFormate,
      provider: providerInfo.provider
    });

    // ============================================
    // MODE DÉVELOPPEMENT: Auto-confirmer le retrait
    // En production, ceci serait fait par webhook du provider
    // ============================================
    if (process.env.NODE_ENV !== 'production') {
      transaction.statut = 'SUCCES';
      transaction.providerTransaction.providerStatus = 'SUCCESS';
      transaction.providerTransaction.confirmedAt = new Date();
      await transaction.save();

      logger.logTransaction(transaction._id, 'WITHDRAWAL_AUTO_CONFIRMED', {
        userId,
        montant,
        nouveauSolde: wallet.solde
      });

      return {
        success: true,
        transaction: transaction.obtenirResume(),
        nouveauSolde: wallet.solde,
        message: `Retrait de ${montant} ${countrySource.symbole} confirmé vers ${phoneValidation.numeroFormate}`
      };
    }

    return {
      success: true,
      transaction: transaction.obtenirResume(),
      nouveauSolde: wallet.solde,
      message: `Retrait de ${montant} ${countrySource.symbole} initié vers ${phoneValidation.numeroFormate}`
    };
  }

  /**
   * Crée un transfert entre utilisateurs
   */
  static async createTransfer(params) {
    const { 
      userId, 
      montant, 
      telephoneDestination, 
      paysDestination,
      description,
      pin, 
      ipAddress, 
      userAgent 
    } = params;

    // Valider avec PIN obligatoire
    if (!pin) {
      throw new ApiError(400, 'Le code PIN est requis pour les transferts');
    }

    const validation = await this.validateTransaction({
      userId,
      type: 'TRANSFER',
      montant,
      telephoneDestination,
      paysDestination,
      pin
    });

    const { user, paysSource, countrySource, frais, montantTotal, warnings } = validation;

    // Déterminer le pays de destination
    const paysDest = paysDestination || paysSource;
    const countryDest = getCountry(paysDest);

    // Valider le téléphone destination
    const phoneValidation = validatePhoneNumber(telephoneDestination, paysDest);
    if (!phoneValidation.valid) {
      throw new ApiError(400, `Numéro de destination invalide: ${phoneValidation.error}`);
    }

    // Chercher le destinataire
    const destinataire = await User.findOne({
      $or: [
        { telephone: phoneValidation.numeroFormate },
        { telephone: phoneValidation.numeroLocal },
        { telephone: telephoneDestination }
      ]
    });

    if (!destinataire) {
      throw new ApiError(404, 'Aucun compte trouvé avec ce numéro de téléphone');
    }

    if (destinataire._id.equals(userId)) {
      throw new ApiError(400, 'Vous ne pouvez pas vous transférer de l\'argent');
    }

    // Récupérer les wallets
    const walletSource = await Wallet.findOne({ utilisateurId: userId });
    const walletDest = await Wallet.findOne({ utilisateurId: destinataire._id });

    if (!walletSource || walletSource.solde < montantTotal) {
      throw new ApiError(400, 'Solde insuffisant');
    }

    if (!walletDest) {
      throw new ApiError(400, 'Le destinataire n\'a pas de portefeuille actif');
    }

    // Calculer le montant converti si cross-border
    let montantConverti = montant;
    let tauxChange = 1;
    const isCrossBorder = paysDest !== paysSource;

    if (isCrossBorder) {
      montantConverti = convertAmount(montant, countrySource.devise, countryDest.devise);
      // Note: XOF et XAF ont parité 1:1, mais on garde la logique pour d'autres devises
    }

    // Créer la transaction
    const transaction = new Transaction({
      type: isCrossBorder ? 'CROSS_BORDER' : 'TRANSFER',
      montant,
      devise: countrySource.devise,
      paysSource,
      telephoneSource: user.telephone,
      paysDestination: paysDest,
      telephoneDestination: phoneValidation.numeroFormate,
      utilisateurSourceId: userId,
      utilisateurDestinationId: destinataire._id,
      walletSourceId: walletSource._id,
      walletDestinationId: walletDest._id,
      fraisTransaction: frais,
      tauxFrais: (frais / montant) * 100,
      tauxChange,
      montantConverti,
      deviseDestination: countryDest.devise,
      soldeAvantSource: walletSource.solde,
      soldeAvantDestination: walletDest.solde,
      description: description || `Transfert vers ${destinataire.nomComplet}`,
      ipAddress,
      userAgent,
      pinVerified: true
    });

    await transaction.save();

    // Effectuer le transfert
    walletSource.solde -= montantTotal;
    walletDest.solde += montantConverti;
    walletSource.dernierMouvement = new Date();
    walletDest.dernierMouvement = new Date();

    await walletSource.save();
    await walletDest.save();

    transaction.soldeApresSource = walletSource.solde;
    transaction.soldeApresDestination = walletDest.solde;
    transaction.statut = 'SUCCES';
    transaction.dateTraitement = new Date();
    await transaction.save();

    logger.logTransaction(transaction._id, 'TRANSFER_COMPLETED', {
      from: userId,
      to: destinataire._id,
      montant,
      isCrossBorder
    });

    return {
      success: true,
      transaction: transaction.obtenirResume(),
      destinataire: {
        nom: destinataire.nomComplet,
        telephone: phoneValidation.numeroFormate,
        pays: paysDest
      },
      nouveauSolde: walletSource.solde,
      warnings,
      message: isCrossBorder 
        ? `Transfert international de ${montant} ${countrySource.symbole} vers ${destinataire.nomComplet} (${countryDest.nom}) effectué`
        : `Transfert de ${montant} ${countrySource.symbole} vers ${destinataire.nomComplet} effectué`
    };
  }

  /**
   * Obtient les providers disponibles pour un pays
   */
  static getProvidersForCountry(codePays) {
    const providers = MOBILE_MONEY_PROVIDERS[codePays];
    if (!providers) {
      return [];
    }
    return Object.keys(providers);
  }

  /**
   * Obtient les informations de transaction pour un pays
   */
  static getCountryTransactionInfo(codePays) {
    const country = getCountry(codePays);
    if (!country) {
      throw new ApiError(404, 'Pays non trouvé');
    }

    return {
      pays: country.nom,
      code: country.code,
      indicatif: country.indicatif,
      devise: country.devise,
      symbole: country.symbole,
      formatTelephone: country.formatTelephone,
      providers: this.getProvidersForCountry(codePays),
      limites: country.limites,
      frais: country.frais
    };
  }
}

module.exports = CountryTransactionService;
module.exports.MOBILE_MONEY_PROVIDERS = MOBILE_MONEY_PROVIDERS;
