// backend/src/routes/transactionRoutes.v3.js
// Routes API v3 pour les transactions multi-pays

const express = require('express');
const router = express.Router();
const transactionController = require('../controllers/transactionController.v3');
const { protect } = require('../middleware/auth');

// ============================================
// ROUTES PUBLIQUES
// ============================================

// Informations sur les pays
router.get('/countries', transactionController.getCountries);
router.get('/country/:code', transactionController.getCountryInfo);

// ============================================
// ROUTES PROTÉGÉES (nécessitent authentification)
// ============================================

// Transactions
router.post('/deposit', protect, transactionController.deposit);
router.post('/withdraw', protect, transactionController.withdraw);
router.post('/transfer', protect, transactionController.transfer);
router.post('/validate-recipient', protect, transactionController.validateRecipient);
router.post('/calculate-fees', protect, transactionController.calculateFees);

// Historique
router.get('/history', protect, transactionController.getHistory);
router.get('/:id', protect, transactionController.getTransaction);

// ============================================
// ROUTES PIN
// ============================================

router.post('/pin/setup', protect, transactionController.setupPin);
router.post('/pin/change', protect, transactionController.changePin);
router.post('/pin/verify', protect, transactionController.verifyPin);
router.get('/pin/status', protect, transactionController.getPinStatus);

// ============================================
// ROUTES VÉRIFICATION TÉLÉPHONE
// ============================================

router.post('/phone/request-verification', protect, transactionController.requestPhoneVerification);
router.post('/phone/verify', protect, transactionController.verifyPhone);

module.exports = router;
