// backend/src/controllers/authController.js
// Contrôleur d'authentification Multi-Pays
// Connexion : EMAIL + MOT DE PASSE
// Transactions : TELEPHONE + PIN

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Wallet = require('../models/Wallet');
const { 
  validatePhoneNumber, 
  getCountry, 
  getActiveCountries,
  DEFAULT_COUNTRY,
  COUNTRIES 
} = require('../config/countries');

const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret_key_minimum_32_chars_long';
const JWT_EXPIRE = process.env.JWT_EXPIRE || '7d';

// Générer un token JWT
const generateToken = (id, role) => {
  return jwt.sign({ id, role }, JWT_SECRET, { expiresIn: JWT_EXPIRE });
};

// =========================
//  INSCRIPTION
// =========================
exports.register = async (req, res) => {
  try {
    console.log('📥 Register request body:', JSON.stringify(req.body, null, 2));
    
    const { 
      nomComplet, 
      email,
      telephone, 
      phoneE164,
      motDePasse, 
      password, 
      pays = DEFAULT_COUNTRY,
      role 
    } = req.body;

    // Support motDePasse (FR) et password (EN)
    const finalPassword = motDePasse || password;
    
    // Support telephone et phoneE164
    const finalTelephone = telephone || phoneE164;

    // Validation : email obligatoire
    if (!email) {
      return res.status(400).json({
        message: 'L\'email est obligatoire'
      });
    }

    // Validation : nom obligatoire
    if (!nomComplet || nomComplet.trim().length < 2) {
      return res.status(400).json({
        message: 'Le nom complet est obligatoire (minimum 2 caractères)'
      });
    }

    // Validation : téléphone obligatoire
    if (!finalTelephone) {
      return res.status(400).json({
        message: 'Le numéro de téléphone est obligatoire'
      });
    }

    // Validation : mot de passe obligatoire et format
    if (!finalPassword) {
      return res.status(400).json({
        message: 'Le mot de passe est obligatoire'
      });
    }

    if (finalPassword.length < 6) {
      return res.status(400).json({
        message: 'Le mot de passe doit contenir au moins 6 caractères'
      });
    }

    // Validation : pays
    const paysConfig = getCountry(pays);
    if (!paysConfig) {
      return res.status(400).json({
        message: 'Pays non supporté',
        paysSupportes: Object.keys(COUNTRIES)
      });
    }

    // Validation : format téléphone selon le pays
    const phoneValidation = validatePhoneNumber(finalTelephone, pays);
    if (!phoneValidation.valid) {
      return res.status(400).json({
        message: phoneValidation.error,
        exemple: paysConfig.formatTelephone.exemple,
        indicatif: paysConfig.indicatif
      });
    }

    // Vérifier si l'email existe déjà
    const emailExists = await User.findOne({ email: email.trim().toLowerCase() });
    if (emailExists) {
      return res.status(400).json({ message: 'Cet email est déjà utilisé' });
    }

    // Vérifier si le téléphone existe déjà
    const phoneExists = await User.findOne({ telephone: phoneValidation.numeroFormate });
    if (phoneExists) {
      return res.status(400).json({ message: 'Ce numéro de téléphone est déjà utilisé' });
    }

    // Créer le code marchand si nécessaire
    const finalRole = role || 'client';
    let codeMarchand;
    if (finalRole === 'marchand') {
      codeMarchand = 'M' + Date.now().toString().slice(-6);
    }

    // Créer l'utilisateur
    const newUser = await User.create({
      email: email.trim().toLowerCase(),
      nomComplet: nomComplet.trim(),
      telephone: phoneValidation.numeroFormate,
      motDePasse: finalPassword,
      pays: pays,
      devise: paysConfig.devise,
      role: finalRole,
      codeMarchand,
      pinConfigured: false
    });

    // Créer le portefeuille
    await Wallet.create({
      utilisateurId: newUser._id,
      solde: 0,
      devise: paysConfig.devise,
      statut: 'actif'
    });

    // Générer le token
    const token = generateToken(newUser._id, newUser.role);

    return res.status(201).json({
      message: 'Inscription réussie. Veuillez configurer votre code PIN.',
      user: {
        id: newUser._id,
        email: newUser.email,
        nomComplet: newUser.nomComplet,
        telephone: newUser.telephone,
        pays: newUser.pays,
        devise: newUser.devise,
        role: newUser.role,
        codeMarchand: newUser.codeMarchand,
        pinConfigured: newUser.pinConfigured
      },
      token,
      nextStep: 'SETUP_PIN'
    });

  } catch (error) {
    console.error('Erreur inscription:', error);
    
    // Gérer les erreurs de validation Mongoose
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(e => e.message);
      return res.status(400).json({
        message: messages.join('. ')
      });
    }
    
    // Gérer les erreurs de duplication
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      return res.status(400).json({
        message: `Ce ${field === 'email' ? 'email' : 'numéro de téléphone'} est déjà utilisé`
      });
    }

    return res.status(500).json({
      message: 'Erreur lors de l\'inscription',
      error: error.message
    });
  }
};

// =========================
//  CONNEXION (EMAIL + MOT DE PASSE)
// =========================
exports.login = async (req, res) => {
  try {
    const { email, telephone, motDePasse, password } = req.body;
    const finalPassword = motDePasse || password;

    // Connexion principalement par email
    if (!email && !telephone) {
      return res.status(400).json({
        message: 'Email requis pour la connexion'
      });
    }

    if (!finalPassword) {
      return res.status(400).json({
        message: 'Mot de passe requis'
      });
    }

    // Rechercher par email (prioritaire) ou téléphone (compatibilité)
    let user;
    if (email) {
      user = await User.findOne({ email: email.trim().toLowerCase() }).select('+motDePasse');
    } else if (telephone) {
      user = await User.findOne({ telephone: telephone.trim() }).select('+motDePasse');
    }

    if (!user) {
      return res.status(401).json({ message: 'Email ou mot de passe incorrect' });
    }

    // Vérifier le statut du compte
    if (user.estBloque && user.estBloque()) {
      const tempsRestant = user.bloqueJusqua ? 
        Math.ceil((user.bloqueJusqua - new Date()) / 60000) : 0;
      return res.status(403).json({ 
        message: `Compte temporairement bloqué. Réessayez dans ${tempsRestant} minutes.` 
      });
    }

    // Vérifier le mot de passe
    const isValid = await user.comparePassword(finalPassword);
    if (!isValid) {
      if (user.incrementerTentatives) await user.incrementerTentatives();
      return res.status(401).json({ message: 'Email ou mot de passe incorrect' });
    }

    // Réinitialiser les tentatives
    if (user.reinitialiserTentatives) await user.reinitialiserTentatives();

    // Mettre à jour le dernier accès (sans validation complète)
    await User.updateOne(
      { _id: user._id },
      { $set: { dernierAcces: new Date() } }
    );

    // Générer le token
    const token = generateToken(user._id, user.role);

    // Récupérer la configuration pays
    const paysConfig = getCountry(user.pays);

    return res.status(200).json({
      message: 'Connexion réussie',
      user: {
        id: user._id,
        email: user.email,
        nomComplet: user.nomComplet,
        telephone: user.telephone,
        pays: user.pays,
        devise: user.devise,
        role: user.role,
        codeMarchand: user.codeMarchand,
        pinConfigured: user.pinConfigured,
        kycLevel: user.kycLevel
      },
      paysConfig: paysConfig ? {
        nom: paysConfig.nom,
        symbole: paysConfig.symbole,
        limites: paysConfig.limites
      } : null,
      token,
      nextStep: user.pinConfigured ? null : 'SETUP_PIN'
    });

  } catch (error) {
    console.error('Erreur connexion:', error);
    return res.status(500).json({
      message: 'Erreur lors de la connexion',
      error: error.message
    });
  }
};

// =========================
//  CONFIGURATION DU PIN
// =========================
exports.setupPin = async (req, res) => {
  try {
    const { pin, confirmPin } = req.body;

    // Validation : PIN requis
    if (!pin) {
      return res.status(400).json({
        message: 'Le code PIN est requis'
      });
    }

    // Validation : confirmation requise
    if (!confirmPin) {
      return res.status(400).json({
        message: 'La confirmation du code PIN est requise'
      });
    }

    // Validation : PIN et confirmation doivent correspondre
    if (pin !== confirmPin) {
      return res.status(400).json({
        message: 'Les codes PIN ne correspondent pas'
      });
    }

    // Validation : format PIN (4-6 chiffres)
    if (!/^\d{4,6}$/.test(pin)) {
      return res.status(400).json({
        message: 'Le code PIN doit contenir 4 à 6 chiffres'
      });
    }

    // Validation : PIN pas trop simple
    const simplePatterns = ['1234', '0000', '1111', '2222', '3333', '4444', '5555', '6666', '7777', '8888', '9999', '123456'];
    if (simplePatterns.includes(pin)) {
      return res.status(400).json({
        message: 'Code PIN trop simple. Choisissez un code plus sécurisé.'
      });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }

    // Si PIN déjà configuré, refuser (utiliser changePin à la place)
    if (user.pinConfigured) {
      return res.status(400).json({
        message: 'Code PIN déjà configuré. Utilisez la fonction de modification.'
      });
    }

    // Définir le PIN (sera hashé par le middleware pre-save)
    user.codePin = pin;
    await user.save();

    // Mettre à jour le wallet aussi (pour compatibilité)
    const wallet = await Wallet.findOne({ utilisateurId: user._id });
    if (wallet) {
      wallet.pin = pin;
      await wallet.save();
    }

    return res.status(200).json({
      message: 'Code PIN configuré avec succès',
      pinConfigured: true
    });

  } catch (error) {
    console.error('Erreur setup PIN:', error);
    return res.status(500).json({
      message: 'Erreur lors de la configuration du PIN',
      error: error.message
    });
  }
};

// =========================
//  CHANGEMENT DE PIN
// =========================
exports.changePin = async (req, res) => {
  try {
    const { ancienPin, nouveauPin, confirmPin } = req.body;

    // Validation
    if (!ancienPin) {
      return res.status(400).json({ message: 'Ancien code PIN requis' });
    }

    if (!nouveauPin) {
      return res.status(400).json({ message: 'Nouveau code PIN requis' });
    }

    if (!confirmPin) {
      return res.status(400).json({ message: 'Confirmation du nouveau PIN requise' });
    }

    if (nouveauPin !== confirmPin) {
      return res.status(400).json({ message: 'Les nouveaux codes PIN ne correspondent pas' });
    }

    if (!/^\d{4,6}$/.test(nouveauPin)) {
      return res.status(400).json({ message: 'Le code PIN doit contenir 4 à 6 chiffres' });
    }

    // PIN pas trop simple
    const simplePatterns = ['1234', '0000', '1111', '2222', '3333', '4444', '5555', '6666', '7777', '8888', '9999', '123456'];
    if (simplePatterns.includes(nouveauPin)) {
      return res.status(400).json({
        message: 'Code PIN trop simple. Choisissez un code plus sécurisé.'
      });
    }

    const user = await User.findById(req.user.id).select('+codePin');
    if (!user) {
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }

    // Vérifier si PIN bloqué
    if (user.pinEstBloque && user.pinEstBloque()) {
      const tempsRestant = user.pinBloqueJusqua ? 
        Math.ceil((user.pinBloqueJusqua - new Date()) / 60000) : 0;
      return res.status(403).json({ 
        message: `PIN bloqué. Réessayez dans ${tempsRestant} minutes.` 
      });
    }

    // Vérifier l'ancien PIN
    const wallet = await Wallet.findOne({ utilisateurId: user._id }).select('+pin');
    let pinValid = false;

    // Vérifier contre le PIN du user (nouveau système)
    if (user.codePin) {
      pinValid = await user.comparePin(ancienPin);
    }
    // Fallback : vérifier contre le PIN du wallet (ancien système)
    else if (wallet && wallet.pin) {
      pinValid = await wallet.verifyPin(ancienPin);
    }

    if (!pinValid) {
      if (user.incrementerTentativesPin) await user.incrementerTentativesPin();
      return res.status(401).json({ message: 'Ancien code PIN incorrect' });
    }

    // Réinitialiser tentatives
    if (user.reinitialiserTentativesPin) await user.reinitialiserTentativesPin();

    // Mettre à jour le PIN
    user.codePin = nouveauPin;
    await user.save();

    // Mettre à jour le wallet aussi
    if (wallet) {
      wallet.pin = nouveauPin;
      await wallet.save();
    }

    return res.status(200).json({ message: 'Code PIN modifié avec succès' });

  } catch (error) {
    console.error('Erreur changement PIN:', error);
    return res.status(500).json({ message: 'Erreur', error: error.message });
  }
};

// =========================
//  VÉRIFICATION DU PIN
// =========================
exports.verifyPin = async (req, res) => {
  try {
    const { pin } = req.body;

    if (!pin) {
      return res.status(400).json({ message: 'Code PIN requis' });
    }

    const user = await User.findById(req.user.id).select('+codePin');
    if (!user) {
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }

    // Vérifier si PIN bloqué
    if (user.pinEstBloque && user.pinEstBloque()) {
      return res.status(403).json({ 
        message: 'PIN bloqué temporairement suite à trop de tentatives' 
      });
    }

    // Vérifier le PIN
    const wallet = await Wallet.findOne({ utilisateurId: user._id }).select('+pin');
    let pinValid = false;

    if (user.codePin) {
      pinValid = await user.comparePin(pin);
    } else if (wallet && wallet.pin) {
      pinValid = await wallet.verifyPin(pin);
    }

    if (!pinValid) {
      if (user.incrementerTentativesPin) await user.incrementerTentativesPin();
      return res.status(401).json({ 
        message: 'Code PIN incorrect',
        valid: false
      });
    }

    // Réinitialiser tentatives
    if (user.reinitialiserTentativesPin) await user.reinitialiserTentativesPin();

    return res.status(200).json({
      message: 'Code PIN valide',
      valid: true
    });

  } catch (error) {
    return res.status(500).json({ message: 'Erreur', error: error.message });
  }
};

// =========================
//  PROFIL
// =========================
exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }

    const paysConfig = getCountry(user.pays);

    return res.status(200).json({
      id: user._id,
      email: user.email,
      nomComplet: user.nomComplet,
      telephone: user.telephone,
      pays: user.pays,
      devise: user.devise,
      role: user.role,
      statut: user.statut,
      codeMarchand: user.codeMarchand,
      nomCommerce: user.nomCommerce,
      kycLevel: user.kycLevel,
      pinConfigured: user.pinConfigured,
      paysConfig: paysConfig ? {
        nom: paysConfig.nom,
        symbole: paysConfig.symbole,
        indicatif: paysConfig.indicatif,
        limites: paysConfig.limites
      } : null
    });

  } catch (error) {
    return res.status(500).json({ message: 'Erreur', error: error.message });
  }
};

// =========================
//  MISE À JOUR PROFIL
// =========================
exports.updateProfile = async (req, res) => {
  try {
    const { nomComplet, nomCommerce, pays } = req.body;
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }

    if (nomComplet) user.nomComplet = nomComplet;
    if (nomCommerce && user.role === 'marchand') user.nomCommerce = nomCommerce;
    
    // Changement de pays (attention: peut changer la devise)
    if (pays && pays !== user.pays) {
      const paysConfig = getCountry(pays);
      if (!paysConfig) {
        return res.status(400).json({ message: 'Pays non supporté' });
      }
      user.pays = pays;
      user.devise = paysConfig.devise;
      
      // Mettre à jour la devise du wallet
      const wallet = await Wallet.findOne({ utilisateurId: user._id });
      if (wallet) {
        wallet.devise = paysConfig.devise;
        await wallet.save();
      }
    }

    await user.save();

    return res.status(200).json({
      message: 'Profil mis à jour',
      user: {
        id: user._id,
        email: user.email,
        nomComplet: user.nomComplet,
        telephone: user.telephone,
        pays: user.pays,
        devise: user.devise,
        role: user.role,
        codeMarchand: user.codeMarchand,
        nomCommerce: user.nomCommerce
      }
    });

  } catch (error) {
    return res.status(500).json({ message: 'Erreur', error: error.message });
  }
};

// =========================
//  CHANGEMENT MOT DE PASSE
// =========================
exports.changePassword = async (req, res) => {
  try {
    const { ancienMotDePasse, nouveauMotDePasse, confirmMotDePasse } = req.body;

    if (!ancienMotDePasse || !nouveauMotDePasse) {
      return res.status(400).json({ message: 'Ancien et nouveau mot de passe requis' });
    }

    if (confirmMotDePasse && nouveauMotDePasse !== confirmMotDePasse) {
      return res.status(400).json({ message: 'Les nouveaux mots de passe ne correspondent pas' });
    }

    if (nouveauMotDePasse.length < 6) {
      return res.status(400).json({ message: 'Le mot de passe doit contenir au moins 6 caractères' });
    }

    const user = await User.findById(req.user.id).select('+motDePasse');

    if (!user) {
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }

    const isValid = await user.comparePassword(ancienMotDePasse);
    if (!isValid) {
      return res.status(401).json({ message: 'Ancien mot de passe incorrect' });
    }

    user.motDePasse = nouveauMotDePasse;
    await user.save();

    return res.status(200).json({ message: 'Mot de passe modifié avec succès' });

  } catch (error) {
    return res.status(500).json({ message: 'Erreur', error: error.message });
  }
};

// =========================
//  LISTE DES PAYS
// =========================
exports.getCountries = async (req, res) => {
  try {
    const countries = getActiveCountries().map(c => ({
      code: c.code,
      nom: c.nom,
      indicatif: c.indicatif,
      devise: c.devise,
      symbole: c.symbole,
      formatTelephone: c.formatTelephone.description,
      exemple: c.formatTelephone.exemple
    }));

    return res.status(200).json({
      countries,
      default: DEFAULT_COUNTRY
    });

  } catch (error) {
    return res.status(500).json({ message: 'Erreur', error: error.message });
  }
};

// =========================
//  MOT DE PASSE OUBLIÉ
// =========================
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: 'Email requis' });
    }

    const user = await User.findOne({ email: email.toLowerCase() });

    // Pour la sécurité, toujours répondre le même message (éviter l'énumération)
    if (!user) {
      return res.status(200).json({
        success: true,
        message: 'Si ce compte existe, un code de réinitialisation a été envoyé'
      });
    }

    // Générer un code à 6 chiffres (plus simple pour mobile)
    const resetCode = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Hash le code avant stockage
    const crypto = require('crypto');
    const hashedCode = crypto.createHash('sha256').update(resetCode).digest('hex');

    // Sauvegarder le token hashé avec expiration de 15 minutes
    user.resetPasswordToken = hashedCode;
    user.resetPasswordExpires = Date.now() + 15 * 60 * 1000; // 15 minutes
    await user.save({ validateBeforeSave: false });

    // En production, envoyer le code par email/SMS
    // Pour le développement, on le retourne dans la réponse
    const isDevelopment = process.env.NODE_ENV !== 'production';

    return res.status(200).json({
      success: true,
      message: 'Si ce compte existe, un code de réinitialisation a été envoyé',
      // SEULEMENT EN DEV - à supprimer en production
      ...(isDevelopment && { 
        devCode: resetCode,
        devNote: 'Ce code est visible uniquement en mode développement'
      })
    });

  } catch (error) {
    console.error('Erreur forgotPassword:', error);
    return res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
};

// =========================
//  RÉINITIALISATION MOT DE PASSE
// =========================
exports.resetPassword = async (req, res) => {
  try {
    const { email, code, nouveauMotDePasse, confirmMotDePasse } = req.body;

    if (!email || !code || !nouveauMotDePasse) {
      return res.status(400).json({ 
        message: 'Email, code et nouveau mot de passe requis' 
      });
    }

    if (nouveauMotDePasse.length < 6) {
      return res.status(400).json({ 
        message: 'Le mot de passe doit contenir au moins 6 caractères' 
      });
    }

    if (confirmMotDePasse && nouveauMotDePasse !== confirmMotDePasse) {
      return res.status(400).json({ 
        message: 'Les mots de passe ne correspondent pas' 
      });
    }

    // Hash le code fourni pour comparaison
    const crypto = require('crypto');
    const hashedCode = crypto.createHash('sha256').update(code).digest('hex');

    // Trouver l'utilisateur avec le token valide et non expiré
    const user = await User.findOne({
      email: email.toLowerCase(),
      resetPasswordToken: hashedCode,
      resetPasswordExpires: { $gt: Date.now() }
    }).select('+resetPasswordToken +resetPasswordExpires');

    if (!user) {
      return res.status(400).json({ 
        message: 'Code invalide ou expiré. Veuillez demander un nouveau code.' 
      });
    }

    // Mettre à jour le mot de passe
    user.motDePasse = nouveauMotDePasse;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    user.tentativesEchouees = 0; // Réinitialiser les tentatives échouées
    user.bloqueJusqua = undefined;
    
    await user.save();

    return res.status(200).json({
      success: true,
      message: 'Mot de passe réinitialisé avec succès. Vous pouvez maintenant vous connecter.'
    });

  } catch (error) {
    console.error('Erreur resetPassword:', error);
    return res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
};

