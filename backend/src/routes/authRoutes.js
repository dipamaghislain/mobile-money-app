// backend/src/routes/authRoutes.js

const express = require('express');
const router = express.Router();

const authController = require('../controllers/authController');
const { protect } = require('../middleware/auth');

// ============================================
// ROUTES PUBLIQUES
// ============================================
router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/forgot-password', authController.forgotPassword);
router.post('/reset-password', authController.resetPassword);

// Liste des pays supportés (pour formulaire inscription)
router.get('/countries', authController.getCountries);

// ============================================
// ROUTES PROTÉGÉES
// ============================================
router.get('/me', protect, authController.getMe);
router.put('/me', protect, authController.updateProfile);
router.put('/change-password', protect, authController.changePassword);

// Configuration et gestion du PIN
router.post('/setup-pin', protect, authController.setupPin);
router.put('/change-pin', protect, authController.changePin);
router.post('/verify-pin', protect, authController.verifyPin);

module.exports = router;
