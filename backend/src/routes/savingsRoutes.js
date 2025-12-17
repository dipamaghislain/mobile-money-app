// backend/src/routes/savingsRoutes.js

const express = require('express');
const router = express.Router();
const savingsController = require('../controllers/savingsController');
const { protect } = require('../middleware/auth');

// Toutes les routes savings sont protégées
router.use(protect);

router.get('/', savingsController.getSavings);
router.post('/', savingsController.createSaving);
router.get('/statistics', savingsController.getSavingsStatistics);

router.get('/:id', savingsController.getSavingById);
router.put('/:id', savingsController.updateSaving);
router.delete('/:id', savingsController.deleteSaving);
router.post('/:id/deposit', savingsController.depositToSaving);
router.post('/:id/withdraw', savingsController.withdrawFromSaving);

module.exports = router;