// backend/src/controllers/authController.js

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../models/User');
const Wallet = require('../models/Wallet');
const { getEnv } = require('../config/env');

// Récupération sécurisée du JWT_SECRET via le helper config/env
const getJwtSecret = () => {
  try {
    // Utilise getEnv pour appliquer la validation centrale
    return getEnv('JWT_SECRET', 'dev_secret_key_minimum_32_chars_long');
  } catch (err) {
    // En cas d'erreur, fallback en développement tout en loggant
    if (process.env.NODE_ENV === 'production') {
      throw err;
    }
    console.warn('⚠️  JWT_SECRET manquant ou invalide — utilisation d\'un secret de développement');
    return 'dev_secret_key_minimum_32_chars_long';
  }
};

const JWT_EXPIRE = process.env.JWT_EXPIRE || '7d';

// Générer un token JWT
const generateToken = (id, role) => {
  return jwt.sign({ id, role }, getJwtSecret(), {
    expiresIn: JWT_EXPIRE
  });
};

// =========================
//  INSCRIPTION
// =========================
// @desc    Inscription d'un nouvel utilisateur
// @route   POST /api/auth/register
// @access  Public
exports.register = async (req, res) => {
  try {
    const { nomComplet, telephone, phoneE164, email, motDePasse, password, role, pin, devise } = req.body;

    // ... (rest of code)

    const walletData = {
      utilisateurId: user._id,
      solde: 0,
      devise: devise || process.env.DEFAULT_CURRENCY || 'XOF',
      statut: 'actif'
    };

    if (pin) {
      // stocker le PIN brut ici : le pre('save') du modèle Wallet le hachera
      walletData.pin = String(pin);
    }

    await Wallet.create(walletData);

    // 6) Générer le token
    const token = generateToken(user._id, user.role);

    return res.status(201).json({
      message: 'Inscription réussie',
      user: {
        id: user._id,
        nomComplet: user.nomComplet,
        telephone: user.telephone,
        email: user.email,
        role: user.role,
        codeMarchand: user.codeMarchand
      },
      token
    });

  } catch (error) {
    console.error('Erreur lors de l\'inscription:', error);
    return res.status(500).json({
      message: 'Erreur lors de l\'inscription',
      error: error.message
    });
  }
};

// =========================
//  CONNEXION
// =========================
// @desc    Connexion d'un utilisateur
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res) => {
  try {
    // Connexion par email (ou fallback telephone si fourni)
    const { email, telephone, motDePasse } = req.body;

    if ((!email && !telephone) || !motDePasse) {
      return res.status(400).json({
        message: 'Veuillez fournir un email (ou téléphone) et un mot de passe'
      });
    }

    const findQuery = email ? { email: email.trim() } : { telephone };
    const user = await User.findOne(findQuery).select('+motDePasse');

    if (!user) {
      return res.status(401).json({
        message: 'Identifiants incorrects'
      });
    }

    // Vérifier le statut
    if (user.statut === 'bloque') {
      return res.status(403).json({
        message: 'Votre compte est bloqué. Contactez l\'administrateur.'
      });
    }

    // Vérifier le mot de passe via la méthode du modèle
    const isPasswordValid = await user.comparePassword(motDePasse);

    if (!isPasswordValid) {
      return res.status(401).json({
        message: 'Identifiants incorrects'
      });
    }

    const token = generateToken(user._id, user.role);

    return res.status(200).json({
      message: 'Connexion réussie',
      user: {
        id: user._id,
        nomComplet: user.nomComplet,
        telephone: user.telephone,
        email: user.email,
        role: user.role,
        codeMarchand: user.codeMarchand
      },
      token
    });

  } catch (error) {
    console.error('Erreur lors de la connexion:', error);
    return res.status(500).json({
      message: 'Erreur lors de la connexion',
      error: error.message
    });
  }
};

// =========================
//  PROFIL (GET /me)
// =========================
// @desc    Obtenir le profil de l'utilisateur connecté
// @route   GET /api/auth/me
// @access  Private
exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-motDePasse');

    if (!user) {
      return res.status(404).json({
        message: 'Utilisateur non trouvé'
      });
    }

    return res.status(200).json({
      id: user._id,
      nomComplet: user.nomComplet,
      telephone: user.telephone,
      email: user.email,
      role: user.role,
      statut: user.statut,
      codeMarchand: user.codeMarchand,
      nomCommerce: user.nomCommerce,
      adresse: user.adresse,
      dateCreation: user.dateCreation
    });

  } catch (error) {
    console.error('Erreur lors de la récupération du profil:', error);
    return res.status(500).json({
      message: 'Erreur lors de la récupération du profil',
      error: error.message
    });
  }
};

// =========================
//  MISE À JOUR PROFIL
// =========================
exports.updateProfile = async (req, res) => {
  try {
    const { nomComplet, email, adresse, nomCommerce } = req.body;

    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        message: 'Utilisateur non trouvé'
      });
    }

    if (nomComplet) user.nomComplet = nomComplet;
    if (email) user.email = email;
    if (adresse) user.adresse = adresse;
    if (nomCommerce && user.role === 'marchand') {
      user.nomCommerce = nomCommerce;
    }

    await user.save();

    return res.status(200).json({
      message: 'Profil mis à jour avec succès',
      user: {
        id: user._id,
        nomComplet: user.nomComplet,
        telephone: user.telephone,
        email: user.email,
        role: user.role,
        codeMarchand: user.codeMarchand,
        nomCommerce: user.nomCommerce,
        adresse: user.adresse
      }
    });

  } catch (error) {
    console.error('Erreur lors de la mise à jour du profil:', error);
    return res.status(500).json({
      message: 'Erreur lors de la mise à jour du profil',
      error: error.message
    });
  }
};

// =========================
//  CHANGEMENT DE MOT DE PASSE
// =========================
exports.changePassword = async (req, res) => {
  try {
    const { ancienMotDePasse, nouveauMotDePasse } = req.body;

    if (!ancienMotDePasse || !nouveauMotDePasse) {
      return res.status(400).json({
        message: 'Veuillez fournir l\'ancien et le nouveau mot de passe'
      });
    }

    const user = await User.findById(req.user.id).select('+motDePasse');

    if (!user) {
      return res.status(404).json({
        message: 'Utilisateur non trouvé'
      });
    }

    const isPasswordValid = await user.comparePassword(ancienMotDePasse);
    if (!isPasswordValid) {
      return res.status(401).json({
        message: 'Ancien mot de passe incorrect'
      });
    }

    // On met le nouveau mot de passe en clair : le pre('save') le hash
    user.motDePasse = nouveauMotDePasse;
    await user.save();

    return res.status(200).json({
      message: 'Mot de passe modifié avec succès'
    });

  } catch (error) {
    console.error('Erreur lors du changement de mot de passe:', error);
    return res.status(500).json({
      message: 'Erreur lors du changement de mot de passe',
      error: error.message
    });
  }
};

// =========================
//  MOT DE PASSE OUBLIÉ
// =========================
// @desc    Demander une réinitialisation de mot de passe
// @route   POST /api/auth/forgot-password
// @access  Public
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        message: 'Veuillez fournir votre adresse email'
      });
    }

    const user = await User.findOne({ email: email.trim().toLowerCase() });

    // Pour la sécurité, on ne révèle pas si l'email existe ou non
    if (!user) {
      return res.status(200).json({
        message: 'Si cet email existe, un lien de réinitialisation vous a été envoyé'
      });
    }

    // Générer un token de réinitialisation
    const resetToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto
      .createHash('sha256')
      .update(resetToken)
      .digest('hex');

    // Sauvegarder le token hashé et la date d'expiration (1 heure)
    user.resetPasswordToken = hashedToken;
    user.resetPasswordExpires = Date.now() + 60 * 60 * 1000; // 1 heure
    await user.save({ validateBeforeSave: false });

    // TODO: Envoyer l'email avec le lien de réinitialisation
    // Pour l'instant, on retourne le token en développement
    // En production, il faudra envoyer un email avec le lien
    const resetUrl = process.env.FRONTEND_URL
      ? `${process.env.FRONTEND_URL}/auth/reset-password?token=${resetToken}`
      : `http://localhost:4200/auth/reset-password?token=${resetToken}`;

    // En développement, on peut logger l'URL (à retirer en production)
    if (process.env.NODE_ENV === 'development') {
      console.log('🔗 Lien de réinitialisation:', resetUrl);
    }

    // TODO: Implémenter l'envoi d'email
    // await sendEmail({
    //   to: user.email,
    //   subject: 'Réinitialisation de votre mot de passe',
    //   html: `Cliquez sur ce lien pour réinitialiser votre mot de passe: ${resetUrl}`
    // });

    return res.status(200).json({
      message: 'Si cet email existe, un lien de réinitialisation vous a été envoyé',
      // En développement seulement
      ...(process.env.NODE_ENV === 'development' && { resetToken, resetUrl })
    });

  } catch (error) {
    console.error('Erreur lors de la demande de réinitialisation:', error);

    // Réinitialiser les champs en cas d'erreur
    if (req.user) {
      const user = await User.findById(req.user.id);
      if (user) {
        user.resetPasswordToken = undefined;
        user.resetPasswordExpires = undefined;
        await user.save({ validateBeforeSave: false });
      }
    }

    return res.status(500).json({
      message: 'Erreur lors de la demande de réinitialisation',
      error: error.message
    });
  }
};

// =========================
//  RÉINITIALISATION MOT DE PASSE
// =========================
// @desc    Réinitialiser le mot de passe avec un token
// @route   POST /api/auth/reset-password
// @access  Public
exports.resetPassword = async (req, res) => {
  try {
    const { token, nouveauMotDePasse } = req.body;

    if (!token || !nouveauMotDePasse) {
      return res.status(400).json({
        message: 'Le token et le nouveau mot de passe sont requis'
      });
    }

    // Valider la longueur du mot de passe
    if (nouveauMotDePasse.length < 6) {
      return res.status(400).json({
        message: 'Le mot de passe doit contenir au moins 6 caractères'
      });
    }

    // Hasher le token pour le comparer avec celui en base
    const hashedToken = crypto
      .createHash('sha256')
      .update(token)
      .digest('hex');

    // Trouver l'utilisateur avec le token valide et non expiré
    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { $gt: Date.now() }
    }).select('+resetPasswordToken +resetPasswordExpires');

    if (!user) {
      return res.status(400).json({
        message: 'Token invalide ou expiré'
      });
    }

    // Mettre à jour le mot de passe
    user.motDePasse = nouveauMotDePasse;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    return res.status(200).json({
      message: 'Mot de passe réinitialisé avec succès'
    });

  } catch (error) {
    console.error('Erreur lors de la réinitialisation du mot de passe:', error);
    return res.status(500).json({
      message: 'Erreur lors de la réinitialisation du mot de passe',
      error: error.message
    });
  }
};
