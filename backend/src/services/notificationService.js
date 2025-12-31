// backend/src/services/notificationService.js
// Service de notifications (email, SMS, push, in-app)

const logger = require('../utils/logger');
const Notification = require('../models/Notification');
const { NOTIFICATION_TYPES } = require('../models/Notification');

class NotificationService {
  
  // ============================================
  // MÉTHODES D'ENVOI PAR CANAL
  // ============================================

  /**
   * Envoyer une notification par email
   */
  static async sendEmail(to, subject, template, data = {}) {
    try {
      // En production, intégrer avec SendGrid, AWS SES, Mailgun
      logger.info('EMAIL_SENT', { to, subject, template });

      if (process.env.NODE_ENV === 'development') {
        console.log(`📧 Email envoyé à ${to}: ${subject}`);
      }

      return { sent: true, channel: 'email', to };

    } catch (error) {
      logger.logError(error, { context: 'EMAIL_SEND_FAILED', to, subject });
      return { sent: false, error: error.message };
    }
  }

  /**
   * Envoyer un SMS
   */
  static async sendSMS(phoneNumber, message) {
    try {
      // En production, intégrer avec Twilio, Orange SMS API
      logger.info('SMS_SENT', {
        phoneNumber: phoneNumber.slice(-4).padStart(phoneNumber.length, '*'),
        messageLength: message.length
      });

      if (process.env.NODE_ENV === 'development') {
        console.log(`📱 SMS envoyé à ${phoneNumber}: ${message}`);
      }

      return { sent: true, channel: 'sms', to: phoneNumber };

    } catch (error) {
      logger.logError(error, { context: 'SMS_SEND_FAILED', phoneNumber });
      return { sent: false, error: error.message };
    }
  }

  /**
   * Envoyer une notification push
   */
  static async sendPush(userId, title, body, data = {}) {
    try {
      // En production, intégrer avec Firebase Cloud Messaging, OneSignal
      logger.info('PUSH_SENT', { userId, title });

      if (process.env.NODE_ENV === 'development') {
        console.log(`🔔 Push à ${userId}: ${title} - ${body}`);
      }

      return { sent: true, channel: 'push', userId };

    } catch (error) {
      logger.logError(error, { context: 'PUSH_SEND_FAILED', userId });
      return { sent: false, error: error.message };
    }
  }

  /**
   * Créer une notification in-app (stockée en base)
   */
  static async createInAppNotification(userId, type, titre, message, data = {}) {
    try {
      const notification = await Notification.creerNotification({
        utilisateurId: userId,
        type,
        titre,
        message,
        data,
        canal: 'in_app',
        envoye: true,
        dateEnvoi: new Date()
      });

      return { sent: true, channel: 'in_app', notification };

    } catch (error) {
      logger.logError(error, { context: 'IN_APP_NOTIFICATION_FAILED', userId });
      return { sent: false, error: error.message };
    }
  }

  // ============================================
  // NOTIFICATIONS DE TRANSACTION
  // ============================================

  /**
   * Notifier une transaction (tous les canaux)
   */
  static async notifyTransaction(user, transaction, type = 'debit') {
    const amount = transaction.montant.toLocaleString('fr-FR');
    const currency = transaction.devise || 'XOF';
    const reference = transaction.referenceExterne;

    let titre, message, emoji;

    switch (transaction.type) {
      case 'DEPOSIT':
        emoji = '💰';
        titre = `${emoji} Dépôt reçu`;
        message = `Vous avez reçu ${amount} ${currency}. Ref: ${reference}`;
        break;

      case 'WITHDRAW':
        emoji = '💸';
        titre = `${emoji} Retrait effectué`;
        message = `Retrait de ${amount} ${currency} effectué. Ref: ${reference}`;
        break;

      case 'TRANSFER':
        if (type === 'debit') {
          emoji = '📤';
          titre = `${emoji} Transfert envoyé`;
          message = `Vous avez envoyé ${amount} ${currency}. Ref: ${reference}`;
        } else {
          emoji = '📥';
          titre = `${emoji} Transfert reçu`;
          message = `Vous avez reçu ${amount} ${currency}. Ref: ${reference}`;
        }
        break;

      case 'MERCHANT_PAYMENT':
        emoji = '🛒';
        titre = `${emoji} Paiement effectué`;
        message = `Paiement de ${amount} ${currency} effectué. Ref: ${reference}`;
        break;

      default:
        emoji = '💳';
        titre = `${emoji} Transaction`;
        message = `Transaction de ${amount} ${currency}. Ref: ${reference}`;
    }

    // Créer notification in-app
    await this.createInAppNotification(
      user._id,
      NOTIFICATION_TYPES.TRANSACTION,
      titre,
      message,
      { 
        transactionId: transaction._id,
        type: transaction.type,
        montant: transaction.montant,
        reference
      }
    );

    // Envoyer par les autres canaux (SMS, Push)
    const results = await Promise.allSettled([
      user.telephone && this.sendSMS(user.telephone, message),
      this.sendPush(user._id.toString(), titre, message, { transactionId: transaction._id?.toString() })
    ]);

    return {
      inApp: true,
      sms: results[0]?.value || null,
      push: results[1]?.value || null
    };
  }

  /**
   * Notifier l'expéditeur d'un transfert
   */
  static async notifyTransferSender(user, transaction, destinataire) {
    const amount = transaction.montant.toLocaleString('fr-FR');
    const titre = '📤 Transfert envoyé';
    const message = `Transfert de ${amount} ${transaction.devise} vers ${destinataire.telephone} effectué. Ref: ${transaction.referenceExterne}`;

    await this.createInAppNotification(
      user._id,
      NOTIFICATION_TYPES.TRANSACTION,
      titre,
      message,
      { transactionId: transaction._id, type: 'TRANSFER_SENT' }
    );

    if (user.telephone) {
      await this.sendSMS(user.telephone, message);
    }
  }

  /**
   * Notifier le destinataire d'un transfert
   */
  static async notifyTransferReceiver(user, transaction, expediteur) {
    const amount = transaction.montant.toLocaleString('fr-FR');
    const titre = '📥 Transfert reçu';
    const message = `Vous avez reçu ${amount} ${transaction.devise} de ${expediteur.nomComplet || expediteur.telephone}. Ref: ${transaction.referenceExterne}`;

    await this.createInAppNotification(
      user._id,
      NOTIFICATION_TYPES.TRANSACTION,
      titre,
      message,
      { transactionId: transaction._id, type: 'TRANSFER_RECEIVED' }
    );

    if (user.telephone) {
      await this.sendSMS(user.telephone, message);
    }
  }

  // ============================================
  // NOTIFICATIONS DE SÉCURITÉ
  // ============================================

  static async notifySecurityAlert(user, alertType, details = {}) {
    const alerts = {
      LOGIN_NEW_DEVICE: {
        titre: '🔐 Nouvelle connexion',
        message: `Connexion détectée depuis ${details.device || 'un nouvel appareil'}.`
      },
      PIN_BLOCKED: {
        titre: '⚠️ PIN bloqué',
        message: 'Votre PIN a été bloqué après plusieurs tentatives incorrectes.'
      },
      PASSWORD_CHANGED: {
        titre: '🔑 Mot de passe modifié',
        message: 'Votre mot de passe a été modifié avec succès.'
      },
      SUSPICIOUS_ACTIVITY: {
        titre: '⚠️ Activité suspecte',
        message: 'Une activité inhabituelle a été détectée sur votre compte.'
      },
      LARGE_TRANSACTION: {
        titre: '💰 Transaction importante',
        message: `Transaction de ${details.amount?.toLocaleString()} ${details.currency || 'XOF'} effectuée.`
      }
    };

    const alert = alerts[alertType] || {
      titre: '🔔 Alerte de sécurité',
      message: 'Une alerte a été déclenchée sur votre compte.'
    };

    // Notification in-app
    await this.createInAppNotification(
      user._id,
      NOTIFICATION_TYPES.SECURITY,
      alert.titre,
      alert.message,
      { alertType, ...details }
    );

    // SMS pour les alertes de sécurité (toujours)
    if (user.telephone) {
      await this.sendSMS(user.telephone, `[ALERTE] ${alert.message}`);
    }

    return alert;
  }

  // ============================================
  // NOTIFICATIONS SYSTÈME
  // ============================================

  static async sendWelcome(user) {
    const titre = '🎉 Bienvenue sur Mobile Money!';
    const message = `Bonjour ${user.nomComplet}! Votre compte est prêt. Configurez votre PIN pour sécuriser vos transactions.`;

    await this.createInAppNotification(
      user._id,
      NOTIFICATION_TYPES.SYSTEM,
      titre,
      message,
      { action: 'setup_pin' }
    );

    if (user.telephone) {
      await this.sendSMS(user.telephone, message);
    }
  }

  static async sendOTPNotification(user, code, purpose) {
    const message = `Votre code Mobile Money: ${code}. Valide 5 min. Ne le partagez jamais.`;
    
    if (user.telephone) {
      return this.sendSMS(user.telephone, message);
    }
    return { sent: false, reason: 'No phone number' };
  }

  static async notifyKYCStatus(user, status, reason = null) {
    const notifications = {
      pending: {
        titre: '📋 Vérification en cours',
        message: 'Vos documents sont en cours de vérification (24-48h).'
      },
      approved: {
        titre: '✅ Compte vérifié',
        message: 'Félicitations! Vous avez accès aux limites élevées.'
      },
      rejected: {
        titre: '❌ Vérification rejetée',
        message: `Raison: ${reason || 'Documents non conformes'}. Veuillez réessayer.`
      }
    };

    const notif = notifications[status] || notifications.pending;

    await this.createInAppNotification(
      user._id,
      NOTIFICATION_TYPES.KYC,
      notif.titre,
      notif.message,
      { status, reason }
    );

    if (user.telephone) {
      await this.sendSMS(user.telephone, notif.message);
    }
  }

  // ============================================
  // NOTIFICATIONS PROMOTIONNELLES
  // ============================================

  static async sendPromoNotification(user, titre, message, data = {}) {
    // Vérifier les préférences utilisateur
    if (user.preferencesNotification?.promotions === false) {
      return { sent: false, reason: 'User opted out of promos' };
    }

    await this.createInAppNotification(
      user._id,
      NOTIFICATION_TYPES.PROMO,
      titre,
      message,
      data
    );

    return { sent: true };
  }
}

module.exports = NotificationService;

