// backend/src/routes/transactionRoutes.js

const express = require('express');
const router = express.Router();
const transactionController = require('../controllers/transactionController');
const { protect } = require('../middleware/auth');

// Toutes les routes transaction sont protégées
router.use(protect);

router.post('/deposit', transactionController.deposit);
router.post('/withdraw', transactionController.withdraw);
router.post('/transfer', transactionController.transfer);
router.post('/merchant-payment', transactionController.merchantPayment);

module.exports = router;