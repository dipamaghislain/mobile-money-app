// backend/src/routes/authRoutes.js

const express = require('express');
const router = express.Router();

const authController = require('../controllers/authController');
const { protect, admin, merchant } = require('../middleware/auth');

// Inscription
router.post('/register', authController.register);

// Connexion
router.post('/login', authController.login);

// Profil utilisateur connecté
router.get('/me', protect, authController.getMe);

// Mise à jour du profil
router.put('/me', protect, authController.updateProfile);

// Changement de mot de passe
router.put('/change-password', protect, authController.changePassword);

// (Exemples de routes protégées par rôle, si tu veux plus tard)
// router.get('/admin-only', protect, admin, ...);
// router.get('/merchant-only', protect, merchant, ...);

module.exports = router;
