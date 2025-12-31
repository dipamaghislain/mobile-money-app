// backend/src/controllers/notificationController.js
// Contrôleur des notifications utilisateur

const Notification = require('../models/Notification');
const User = require('../models/User');

// ============================================
// RÉCUPÉRER LES NOTIFICATIONS
// GET /api/notifications
// ============================================
exports.getNotifications = async (req, res) => {
  try {
    const { page = 1, limit = 20, lu, type } = req.query;
    
    const query = { utilisateurId: req.user.id };
    
    if (lu !== undefined) {
      query.lu = lu === 'true';
    }
    
    if (type) {
      query.type = type;
    }

    const notifications = await Notification.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    const total = await Notification.countDocuments(query);
    const nonLues = await Notification.compterNonLues(req.user.id);

    return res.status(200).json({
      notifications,
      nonLues,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Erreur récupération notifications:', error);
    return res.status(500).json({ message: 'Erreur', error: error.message });
  }
};

// ============================================
// COMPTER LES NOTIFICATIONS NON LUES
// GET /api/notifications/count
// ============================================
exports.getUnreadCount = async (req, res) => {
  try {
    const count = await Notification.compterNonLues(req.user.id);
    return res.status(200).json({ nonLues: count });
  } catch (error) {
    return res.status(500).json({ message: 'Erreur', error: error.message });
  }
};

// ============================================
// MARQUER COMME LU
// PUT /api/notifications/:id/read
// ============================================
exports.markAsRead = async (req, res) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, utilisateurId: req.user.id },
      { lu: true, dateLecture: new Date() },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({ message: 'Notification non trouvée' });
    }

    return res.status(200).json({ notification });

  } catch (error) {
    return res.status(500).json({ message: 'Erreur', error: error.message });
  }
};

// ============================================
// MARQUER TOUTES COMME LUES
// PUT /api/notifications/read-all
// ============================================
exports.markAllAsRead = async (req, res) => {
  try {
    const result = await Notification.marquerCommeLues(req.user.id);
    
    return res.status(200).json({ 
      message: 'Notifications marquées comme lues',
      count: result.modifiedCount 
    });

  } catch (error) {
    return res.status(500).json({ message: 'Erreur', error: error.message });
  }
};

// ============================================
// SUPPRIMER UNE NOTIFICATION
// DELETE /api/notifications/:id
// ============================================
exports.deleteNotification = async (req, res) => {
  try {
    const notification = await Notification.findOneAndDelete({
      _id: req.params.id,
      utilisateurId: req.user.id
    });

    if (!notification) {
      return res.status(404).json({ message: 'Notification non trouvée' });
    }

    return res.status(200).json({ message: 'Notification supprimée' });

  } catch (error) {
    return res.status(500).json({ message: 'Erreur', error: error.message });
  }
};

// ============================================
// RÉCUPÉRER LES PRÉFÉRENCES DE NOTIFICATION
// GET /api/notifications/preferences
// ============================================
exports.getPreferences = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('preferencesNotification');
    
    // Préférences par défaut si non définies
    const preferences = user?.preferencesNotification || {
      sms: true,
      email: true,
      push: true,
      transactions: true,
      securite: true,
      promotions: false
    };

    return res.status(200).json({ preferences });

  } catch (error) {
    return res.status(500).json({ message: 'Erreur', error: error.message });
  }
};

// ============================================
// METTRE À JOUR LES PRÉFÉRENCES
// PUT /api/notifications/preferences
// ============================================
exports.updatePreferences = async (req, res) => {
  try {
    const { sms, email, push, transactions, securite, promotions } = req.body;

    const preferences = {
      sms: sms !== false,
      email: email !== false,
      push: push !== false,
      transactions: transactions !== false,
      securite: securite !== false,
      promotions: promotions === true
    };

    await User.findByIdAndUpdate(req.user.id, {
      preferencesNotification: preferences
    });

    return res.status(200).json({ 
      message: 'Préférences mises à jour',
      preferences 
    });

  } catch (error) {
    return res.status(500).json({ message: 'Erreur', error: error.message });
  }
};
