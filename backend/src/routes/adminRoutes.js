// backend/src/routes/adminRoutes.js

const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { protect, admin } = require('../middleware/auth');

// Toutes les routes admin sont protégées et nécessitent le rôle admin
router.use(protect);
router.use(admin);

router.get('/users', adminController.getUsers);
router.get('/users/:id', adminController.getUserById);
router.patch('/users/:id/status', adminController.updateUserStatus);

router.get('/transactions', adminController.getTransactions);

router.get('/statistics', adminController.getStatistics);
router.get('/dashboard', adminController.getDashboard);

module.exports = router;