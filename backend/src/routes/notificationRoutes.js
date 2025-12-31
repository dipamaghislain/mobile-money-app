// backend/src/routes/notificationRoutes.js
// Routes pour les notifications

const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');
const { protect } = require('../middleware/auth');

// Toutes les routes nécessitent une authentification
router.use(protect);

// Routes des notifications
router.get('/', notificationController.getNotifications);
router.get('/count', notificationController.getUnreadCount);
router.put('/read-all', notificationController.markAllAsRead);
router.get('/preferences', notificationController.getPreferences);
router.put('/preferences', notificationController.updatePreferences);
router.put('/:id/read', notificationController.markAsRead);
router.delete('/:id', notificationController.deleteNotification);

module.exports = router;
