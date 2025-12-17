// backend/src/controllers/authController.js

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Wallet = require('../models/Wallet');

const JWT_SECRET = process.env.JWT_SECRET || 'changeme';
const JWT_EXPIRE = process.env.JWT_EXPIRE || '7d';

// Générer un token JWT
const generateToken = (id, role) => {
  return jwt.sign({ id, role }, JWT_SECRET, {
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
    const { nomComplet, telephone, email, motDePasse, role } = req.body;

    // 1) Vérifications de base
    if (!nomComplet || !telephone || !motDePasse) {
      return res.status(400).json({
        message: 'nomComplet, telephone et motDePasse sont obligatoires'
      });
    }

    // 2) Vérifier si l'utilisateur existe déjà
    const userExists = await User.findOne({
      $or: [{ telephone }, { email }]
    });

    if (userExists) {
      return res.status(400).json({
        message: 'Un utilisateur avec ce téléphone ou email existe déjà'
      });
    }

    // 3) Rôle + code marchand éventuel
    const finalRole = role || 'client';
    let codeMarchand;
    if (finalRole === 'marchand') {
      codeMarchand = 'M' + Date.now().toString().slice(-6);
    }

    // 4) Créer l'utilisateur
    // ⚠️ motDePasse en clair ici : le pre('save') dans le modèle s'occupe de le hasher
    const user = await User.create({
      nomComplet,
      telephone,
      email,
      motDePasse,
      role: finalRole,
      codeMarchand
    });

    // 5) Créer le portefeuille associé
    await Wallet.create({
      utilisateurId: user._id,
      solde: 0,
      devise: process.env.DEFAULT_CURRENCY || 'XOF',
      statut: 'actif'
    });

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
    const { telephone, motDePasse } = req.body;

    if (!telephone || !motDePasse) {
      return res.status(400).json({
        message: 'Veuillez fournir un téléphone et un mot de passe'
      });
    }

    // Récupérer l'utilisateur AVEC le mot de passe (select: false dans le schema)
    const user = await User.findOne({ telephone }).select('+motDePasse');

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
