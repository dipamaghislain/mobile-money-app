// backend/src/services/transactionService.js
// Service métier pour les transactions avec calcul des frais et limites

const { TRANSACTION_FEES, KYC_LEVELS, TRANSACTION_LIMITS, ERROR_CODES } = require('../config/constants');
const Transaction = require('../models/Transaction');
const ApiError = require('../utils/ApiError');
const logger = require('../utils/logger');

class TransactionService {
  /**
   * Calculer les frais de transaction
   */
  static calculateFees(type, amount) {
    const feeConfig = TRANSACTION_FEES[type];
    if (!feeConfig) {
      return { fees: 0, netAmount: amount };
    }

    let fees = 0;

    // Calcul des frais en pourcentage
    if (feeConfig.percentage > 0) {
      fees = (amount * feeConfig.percentage) / 100;
    }

    // Ajouter les frais fixes
    fees += feeConfig.fixedFee;

    // Appliquer les limites min/max
    fees = Math.max(fees, feeConfig.minFee);
    fees = Math.min(fees, feeConfig.maxFee);

    // Arrondir à l'entier supérieur
    fees = Math.ceil(fees);

    return {
      fees,
      netAmount: amount,
      totalAmount: amount + fees,
      feeDetails: {
        percentage: feeConfig.percentage,
        fixedFee: feeConfig.fixedFee,
        calculatedFee: fees
      }
    };
  }

  /**
   * Vérifier les limites de transaction pour un utilisateur
   */
  static async checkTransactionLimits(userId, kycLevel, type, amount) {
    const limits = KYC_LEVELS[`LEVEL_${kycLevel || 0}`] || KYC_LEVELS.LEVEL_0;

    // Vérifier le montant maximum par transaction
    if (amount > limits.maxTransactionAmount) {
      throw ApiError.badRequest(
        `Montant maximum par transaction: ${limits.maxTransactionAmount.toLocaleString()} XOF`,
        { maxAllowed: limits.maxTransactionAmount, requested: amount }
      );
    }

    // Vérifier les limites générales par type
    const typeLimit = TRANSACTION_LIMITS[`MAX_${type}`];
    if (typeLimit && amount > typeLimit) {
      throw ApiError.badRequest(
        `Montant maximum pour ce type de transaction: ${typeLimit.toLocaleString()} XOF`,
        { maxAllowed: typeLimit, requested: amount }
      );
    }

    // Vérifier le montant minimum
    if (amount < TRANSACTION_LIMITS.MIN_AMOUNT) {
      throw ApiError.badRequest(
        `Montant minimum: ${TRANSACTION_LIMITS.MIN_AMOUNT} XOF`,
        { minRequired: TRANSACTION_LIMITS.MIN_AMOUNT, requested: amount }
      );
    }

    // Calculer les totaux journaliers et mensuels
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    // Transactions du jour (débit)
    const dailyTransactions = await Transaction.aggregate([
      {
        $match: {
          utilisateurSourceId: userId,
          statut: 'SUCCES',
          dateCreation: { $gte: today },
          type: { $in: ['WITHDRAW', 'TRANSFER', 'MERCHANT_PAYMENT', 'EPARGNE_IN'] }
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$montant' }
        }
      }
    ]);

    const dailyTotal = (dailyTransactions[0]?.total || 0) + amount;

    if (dailyTotal > limits.dailyLimit) {
      throw ApiError.dailyLimitExceeded(limits.dailyLimit, dailyTransactions[0]?.total || 0);
    }

    // Transactions du mois
    const monthlyTransactions = await Transaction.aggregate([
      {
        $match: {
          utilisateurSourceId: userId,
          statut: 'SUCCES',
          dateCreation: { $gte: startOfMonth },
          type: { $in: ['WITHDRAW', 'TRANSFER', 'MERCHANT_PAYMENT', 'EPARGNE_IN'] }
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$montant' }
        }
      }
    ]);

    const monthlyTotal = (monthlyTransactions[0]?.total || 0) + amount;

    if (monthlyTotal > limits.monthlyLimit) {
      throw ApiError.monthlyLimitExceeded(limits.monthlyLimit, monthlyTransactions[0]?.total || 0);
    }

    return {
      dailyUsed: dailyTransactions[0]?.total || 0,
      dailyRemaining: limits.dailyLimit - dailyTotal,
      monthlyUsed: monthlyTransactions[0]?.total || 0,
      monthlyRemaining: limits.monthlyLimit - monthlyTotal,
      limits
    };
  }

  /**
   * Vérifier si le solde après transaction ne dépasse pas le plafond
   */
  static checkMaxBalance(currentBalance, amount, kycLevel) {
    const limits = KYC_LEVELS[`LEVEL_${kycLevel || 0}`] || KYC_LEVELS.LEVEL_0;
    const newBalance = currentBalance + amount;

    if (newBalance > limits.maxBalance) {
      throw new ApiError(
        ERROR_CODES.WALLET_MAX_BALANCE_EXCEEDED,
        `Plafond de solde atteint. Maximum: ${limits.maxBalance.toLocaleString()} XOF`,
        400,
        { maxBalance: limits.maxBalance, currentBalance, requestedAmount: amount }
      );
    }

    return true;
  }

  /**
   * Vérifier si l'utilisateur peut effectuer ce type de transaction
   */
  static checkTransactionPermission(kycLevel, transactionType) {
    const limits = KYC_LEVELS[`LEVEL_${kycLevel || 0}`] || KYC_LEVELS.LEVEL_0;

    const permissionMap = {
      WITHDRAW: 'canWithdraw',
      TRANSFER: 'canTransfer',
      MERCHANT_PAYMENT: 'canMerchantPayment',
      DEPOSIT: 'canReceive'
    };

    const permission = permissionMap[transactionType];
    if (permission && !limits[permission]) {
      throw ApiError.kycRequired(transactionType === 'WITHDRAW' ? 'LEVEL_1' : 'LEVEL_0');
    }

    return true;
  }

  /**
   * Générer un résumé de transaction pour les notifications
   */
  static generateTransactionSummary(transaction, user, recipient = null) {
    const summary = {
      reference: transaction.referenceExterne,
      type: transaction.type,
      montant: transaction.montant,
      frais: transaction.fraisTransaction,
      devise: transaction.devise,
      date: transaction.createdAt,
      statut: transaction.statut
    };

    switch (transaction.type) {
      case 'DEPOSIT':
        summary.description = `Dépôt de ${transaction.montant.toLocaleString()} ${transaction.devise}`;
        break;
      case 'WITHDRAW':
        summary.description = `Retrait de ${transaction.montant.toLocaleString()} ${transaction.devise}`;
        break;
      case 'TRANSFER':
        summary.description = recipient
          ? `Transfert vers ${recipient.nomComplet}`
          : `Transfert de ${transaction.montant.toLocaleString()} ${transaction.devise}`;
        summary.destinataire = recipient?.nomComplet;
        break;
      case 'MERCHANT_PAYMENT':
        summary.description = `Paiement à ${recipient?.nomCommerce || recipient?.nomComplet}`;
        summary.marchand = recipient?.nomCommerce || recipient?.nomComplet;
        break;
      default:
        summary.description = transaction.description;
    }

    return summary;
  }

  /**
   * Détecter les transactions potentiellement frauduleuses
   */
  static async detectSuspiciousActivity(userId, amount, type) {
    const warnings = [];

    // Vérifier le nombre de transactions dans les dernières 10 minutes
    const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);
    const recentCount = await Transaction.countDocuments({
      utilisateurSourceId: userId,
      dateCreation: { $gte: tenMinutesAgo }
    });

    if (recentCount >= 5) {
      warnings.push('HIGH_FREQUENCY');
      logger.logSecurity('HIGH_FREQUENCY_TRANSACTIONS', {
        userId,
        count: recentCount,
        period: '10 minutes'
      });
    }

    // Vérifier si le montant est inhabituel (> 2x la moyenne)
    const avgTransaction = await Transaction.aggregate([
      {
        $match: {
          utilisateurSourceId: userId,
          statut: 'SUCCES',
          type
        }
      },
      {
        $group: {
          _id: null,
          avgAmount: { $avg: '$montant' },
          maxAmount: { $max: '$montant' }
        }
      }
    ]);

    if (avgTransaction[0] && amount > avgTransaction[0].avgAmount * 3) {
      warnings.push('UNUSUAL_AMOUNT');
      logger.logSecurity('UNUSUAL_TRANSACTION_AMOUNT', {
        userId,
        amount,
        averageAmount: avgTransaction[0].avgAmount
      });
    }

    return {
      isSuspicious: warnings.length > 0,
      warnings,
      requiresReview: warnings.length >= 2
    };
  }

  /**
   * Obtenir les statistiques de transaction d'un utilisateur
   */
  static async getUserTransactionStats(userId) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const startOfYear = new Date(today.getFullYear(), 0, 1);

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
        $facet: {
          daily: [
            { $match: { dateCreation: { $gte: today } } },
            {
              $group: {
                _id: '$type',
                count: { $sum: 1 },
                total: { $sum: '$montant' }
              }
            }
          ],
          monthly: [
            { $match: { dateCreation: { $gte: startOfMonth } } },
            {
              $group: {
                _id: '$type',
                count: { $sum: 1 },
                total: { $sum: '$montant' }
              }
            }
          ],
          yearly: [
            { $match: { dateCreation: { $gte: startOfYear } } },
            {
              $group: {
                _id: '$type',
                count: { $sum: 1 },
                total: { $sum: '$montant' }
              }
            }
          ],
          totals: [
            {
              $group: {
                _id: null,
                totalTransactions: { $sum: 1 },
                totalVolume: { $sum: '$montant' },
                totalFees: { $sum: '$fraisTransaction' }
              }
            }
          ]
        }
      }
    ]);

    return stats[0];
  }
}

module.exports = TransactionService;
