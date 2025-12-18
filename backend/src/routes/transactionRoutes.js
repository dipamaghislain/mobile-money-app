// backend/src/routes/transactionRoutes.js

const express = require('express');
const router = express.Router();
const transactionController = require('../controllers/transactionController');
const { protect } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const {
    depositValidator,
    withdrawValidator,
    transferValidator,
    merchantPaymentValidator
} = require('../validators/transactionValidator');

// Toutes les routes transaction sont protégées
router.use(protect);

router.post('/deposit', depositValidator, validate, transactionController.deposit);
router.post('/withdraw', withdrawValidator, validate, transactionController.withdraw);
router.post('/transfer', transferValidator, validate, transactionController.transfer);
router.post('/merchant-payment', merchantPaymentValidator, validate, transactionController.merchantPayment);

module.exports = router;