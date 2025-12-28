// backend/src/middleware/auth.js

const jwt = require('jsonwebtoken');
const User = require('../models/User');

const { getEnv } = require('../config/env');

// Récupération sécurisée du JWT_SECRET via le helper central
const getJwtSecret = () => {
  try {
    return getEnv('JWT_SECRET', 'dev_secret_key_minimum_32_chars_long');
  } catch (err) {
    if (process.env.NODE_ENV === 'production') throw err;
    return 'dev_secret_key_minimum_32_chars_long';
  }
};

// Protéger les routes (vérifier le token JWT)
exports.protect = async (req, res, next) => {
  try {
    let token;

    // Vérifier si le token est dans les headers
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({
        message: 'Non autorisé. Aucun token fourni.'
      });
    }

    try {
      // Vérifier le token
      const decoded = jwt.verify(token, getJwtSecret());

      // Récupérer l'utilisateur
      req.user = await User.findById(decoded.id).select('-motDePasse');

      if (!req.user) {
        return res.status(401).json({
          message: 'Utilisateur non trouvé'
        });
      }

      // Vérifier si le compte est actif
      if (req.user.statut === 'bloque') {
        return res.status(403).json({
          message: 'Votre compte est bloqué. Contactez l\'administrateur.'
        });
      }

      next();

    } catch (error) {
      return res.status(401).json({
        message: 'Token invalide ou expiré'
      });
    }

  } catch (error) {
    console.error('Erreur middleware auth:', error);
    res.status(500).json({
      message: 'Erreur serveur',
      error: error.message
    });
  }
};

// Middleware pour vérifier le rôle admin
exports.admin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(403).json({
      message: 'Accès refusé. Vous devez être administrateur.'
    });
  }
};

// Middleware pour vérifier le rôle marchand
exports.merchant = (req, res, next) => {
  if (req.user && req.user.role === 'marchand') {
    next();
  } else {
    res.status(403).json({
      message: 'Accès refusé. Vous devez être marchand.'
    });
  }
};