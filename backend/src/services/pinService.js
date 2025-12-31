// backend/src/services/pinService.js
// Service de gestion du code PIN sécurisé

const bcrypt = require('bcryptjs');
const User = require('../models/User');
const ApiError = require('../utils/ApiError');

// Configuration de sécurité PIN
const PIN_CONFIG = {
  MIN_LENGTH: 4,
  MAX_LENGTH: 6,
  MAX_ATTEMPTS: 3,
  LOCK_DURATIONS: {
    1: 30 * 60 * 1000,      // 30 minutes
    2: 2 * 60 * 60 * 1000,   // 2 heures
    3: 24 * 60 * 60 * 1000,  // 24 heures
    4: Infinity              // Permanent (nécessite support)
  },
  HISTORY_SIZE: 3,  // Nombre d'anciens PINs à conserver
  SIMPLE_PINS: [
    '0000', '1111', '2222', '3333', '4444', '5555', '6666', '7777', '8888', '9999',
    '1234', '4321', '0123', '3210', '1212', '2121',
    '00000', '11111', '12345', '54321',
    '000000', '111111', '123456', '654321'
  ]
};

class PinService {
  /**
   * Valide le format du PIN
   */
  static validatePinFormat(pin) {
    if (!pin || typeof pin !== 'string') {
      return { valid: false, error: 'Le code PIN est requis' };
    }

    // Vérifier que ce sont uniquement des chiffres
    if (!/^\d+$/.test(pin)) {
      return { valid: false, error: 'Le code PIN ne doit contenir que des chiffres' };
    }

    // Vérifier la longueur
    if (pin.length < PIN_CONFIG.MIN_LENGTH || pin.length > PIN_CONFIG.MAX_LENGTH) {
      return { 
        valid: false, 
        error: `Le code PIN doit contenir entre ${PIN_CONFIG.MIN_LENGTH} et ${PIN_CONFIG.MAX_LENGTH} chiffres` 
      };
    }

    // Vérifier si c'est un PIN simple/facile à deviner
    if (PIN_CONFIG.SIMPLE_PINS.includes(pin)) {
      return { 
        valid: false, 
        error: 'Ce code PIN est trop simple. Choisissez un code plus sécurisé' 
      };
    }

    // Vérifier les séquences répétitives
    if (/^(.)\1+$/.test(pin)) {
      return { 
        valid: false, 
        error: 'Le code PIN ne peut pas être une répétition du même chiffre' 
      };
    }

    return { valid: true };
  }

  /**
   * Hash le code PIN de manière sécurisée
   */
  static async hashPin(pin) {
    const salt = await bcrypt.genSalt(12); // Plus fort que 10
    return bcrypt.hash(pin, salt);
  }

  /**
   * Compare un PIN avec son hash
   */
  static async comparePin(pin, hash) {
    return bcrypt.compare(pin, hash);
  }

  /**
   * Configure le PIN pour un utilisateur (première fois ou reset)
   */
  static async setupPin(userId, pin) {
    const validation = this.validatePinFormat(pin);
    if (!validation.valid) {
      throw new ApiError(400, validation.error);
    }

    const user = await User.findById(userId).select('+codePin +historiquePin');
    if (!user) {
      throw new ApiError(404, 'Utilisateur non trouvé');
    }

    // Vérifier que le PIN n'est pas dans l'historique
    if (user.historiquePin && user.historiquePin.length > 0) {
      for (const oldPin of user.historiquePin) {
        const isReused = await this.comparePin(pin, oldPin.hash);
        if (isReused) {
          throw new ApiError(400, 'Vous ne pouvez pas réutiliser un ancien code PIN');
        }
      }
    }

    // Hash et sauvegarder le nouveau PIN
    const hashedPin = await this.hashPin(pin);
    
    // Ajouter l'ancien PIN à l'historique si existant
    if (user.codePin) {
      if (!user.historiquePin) {
        user.historiquePin = [];
      }
      user.historiquePin.push({
        hash: user.codePin,
        date: new Date()
      });
      // Garder seulement les N derniers
      if (user.historiquePin.length > PIN_CONFIG.HISTORY_SIZE) {
        user.historiquePin = user.historiquePin.slice(-PIN_CONFIG.HISTORY_SIZE);
      }
    }

    user.codePin = hashedPin;
    user.pinConfigured = true;
    user.pinModifieLe = new Date();
    user.tentativesPinEchouees = 0;
    user.pinBloqueJusqua = null;
    user.niveauBlocagePin = 0;

    await user.save();

    return {
      success: true,
      message: 'Code PIN configuré avec succès'
    };
  }

  /**
   * Vérifie le PIN pour une transaction
   */
  static async verifyPin(userId, pin) {
    const user = await User.findById(userId).select('+codePin');
    if (!user) {
      throw new ApiError(404, 'Utilisateur non trouvé');
    }

    // Vérifier si le PIN a été configuré
    if (!user.pinConfigured || !user.codePin) {
      throw new ApiError(400, 'Le code PIN n\'a pas été configuré. Veuillez d\'abord configurer votre PIN.');
    }

    // Vérifier si le PIN est bloqué
    if (user.pinEstBloque()) {
      const tempsRestant = Math.ceil((user.pinBloqueJusqua - new Date()) / 60000);
      throw new ApiError(423, `PIN bloqué. Réessayez dans ${tempsRestant} minute(s)`);
    }

    // Vérifier le PIN
    const isValid = await this.comparePin(pin, user.codePin);

    if (!isValid) {
      await this.handleFailedAttempt(user);
      
      const tentativesRestantes = PIN_CONFIG.MAX_ATTEMPTS - user.tentativesPinEchouees;
      
      if (tentativesRestantes > 0) {
        throw new ApiError(401, `Code PIN incorrect. ${tentativesRestantes} tentative(s) restante(s)`);
      } else {
        throw new ApiError(423, 'Trop de tentatives échouées. PIN temporairement bloqué');
      }
    }

    // Réinitialiser les tentatives en cas de succès
    await user.reinitialiserTentativesPin();

    return {
      valid: true,
      userId: user._id
    };
  }

  /**
   * Gère une tentative de PIN échouée
   */
  static async handleFailedAttempt(user) {
    user.tentativesPinEchouees += 1;

    if (user.tentativesPinEchouees >= PIN_CONFIG.MAX_ATTEMPTS) {
      // Augmenter le niveau de blocage
      user.niveauBlocagePin = Math.min(user.niveauBlocagePin + 1, 4);
      
      const lockDuration = PIN_CONFIG.LOCK_DURATIONS[user.niveauBlocagePin];
      
      if (lockDuration === Infinity) {
        // Blocage permanent - nécessite support
        user.statut = 'bloque';
        user.pinBloqueJusqua = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000); // 1 an
      } else {
        user.pinBloqueJusqua = new Date(Date.now() + lockDuration);
      }
      
      user.tentativesPinEchouees = 0;
    }

    await user.save();
  }

  /**
   * Change le PIN de l'utilisateur
   */
  static async changePin(userId, currentPin, newPin) {
    // Vérifier l'ancien PIN
    await this.verifyPin(userId, currentPin);

    // Valider le nouveau PIN
    const validation = this.validatePinFormat(newPin);
    if (!validation.valid) {
      throw new ApiError(400, validation.error);
    }

    // Vérifier que le nouveau PIN est différent
    const user = await User.findById(userId).select('+codePin');
    const isSame = await this.comparePin(newPin, user.codePin);
    if (isSame) {
      throw new ApiError(400, 'Le nouveau PIN doit être différent de l\'ancien');
    }

    // Configurer le nouveau PIN
    return this.setupPin(userId, newPin);
  }

  /**
   * Réinitialise le PIN (admin ou récupération)
   */
  static async resetPin(userId, adminId = null) {
    const user = await User.findById(userId);
    if (!user) {
      throw new ApiError(404, 'Utilisateur non trouvé');
    }

    // Générer un PIN temporaire aléatoire
    const tempPin = Math.floor(1000 + Math.random() * 9000).toString();
    const hashedPin = await this.hashPin(tempPin);

    user.codePin = hashedPin;
    user.pinConfigured = false; // Forcer la reconfiguration
    user.tentativesPinEchouees = 0;
    user.pinBloqueJusqua = null;
    user.niveauBlocagePin = 0;

    await user.save();

    // TODO: Envoyer le PIN temporaire par SMS
    return {
      success: true,
      message: 'PIN réinitialisé. Un nouveau PIN temporaire a été envoyé par SMS',
      tempPin: process.env.NODE_ENV === 'development' ? tempPin : undefined
    };
  }

  /**
   * Vérifie si le téléphone est vérifié pour les transactions
   */
  static async checkPhoneVerified(userId) {
    const user = await User.findById(userId);
    if (!user) {
      throw new ApiError(404, 'Utilisateur non trouvé');
    }

    if (!user.telephoneVerifie) {
      throw new ApiError(403, 'Votre numéro de téléphone doit être vérifié pour effectuer des transactions');
    }

    return true;
  }

  /**
   * Vérifie toutes les conditions pour une transaction
   */
  static async validateTransactionSecurity(userId, pin) {
    // 1. Vérifier que le téléphone est vérifié
    await this.checkPhoneVerified(userId);

    // 2. Vérifier le PIN
    await this.verifyPin(userId, pin);

    return { authorized: true };
  }
}

module.exports = PinService;
module.exports.PIN_CONFIG = PIN_CONFIG;
