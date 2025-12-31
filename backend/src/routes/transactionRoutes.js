// backend/src/routes/transactionRoutes.js

const express = require('express');
const router = express.Router();

const transactionController = require('../controllers/transactionController.v2');
const { protect } = require('../middleware/auth');

// Toutes les routes sont protégées
router.use(protect);

// Opérations financières
router.post('/deposit', transactionController.deposit);
router.post('/withdraw', transactionController.withdraw);
router.post('/transfer', transactionController.transfer);
router.post('/merchant-payment', transactionController.merchantPayment);

// Historique amélioré et export
router.get('/history', transactionController.getHistory);
router.get('/export', transactionController.exportHistory);
router.get('/stats', transactionController.getStats);
router.get('/:id', transactionController.getTransactionById);

module.exports = router;