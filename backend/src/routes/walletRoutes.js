// backend/src/routes/walletRoutes.js

const express = require('express');
const router = express.Router();
const walletController = require('../controllers/walletController');
const { protect } = require('../middleware/auth');

// Toutes les routes wallet sont protégées
router.use(protect);

router.get('/', walletController.getWallet);
router.patch('/pin', walletController.setPin);
router.post('/verify-pin', walletController.verifyPin);
router.get('/transactions', walletController.getTransactions);
router.get('/statistics', walletController.getStatistics);

module.exports = router;