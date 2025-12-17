// backend/src/controllers/adminController.js

const User = require('../models/User');
const Wallet = require('../models/Wallet');
const Transaction = require('../models/Transaction');
const SavingsGoal = require('../models/SavingsGoal');

// @desc    Lister tous les utilisateurs
// @route   GET /api/admin/users
// @access  Private/Admin
exports.getUsers = async (req, res) => {
  try {
    const { role, statut, limit, skip, search } = req.query;

    const query = {};

    // Filtres
    if (role) query.role = role;
    if (statut) query.statut = statut;
    
    // Recherche par nom ou téléphone
    if (search) {
      query.$or = [
        { nomComplet: { $regex: search, $options: 'i' } },
        { telephone: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    const users = await User.find(query)
      .select('-motDePasse')
      .limit(parseInt(limit) || 50)
      .skip(parseInt(skip) || 0)
      .sort({ dateCreation: -1 });

    const total = await User.countDocuments(query);

    res.status(200).json({
      count: users.length,
      total,
      users
    });

  } catch (error) {
    console.error('Erreur lors de la récupération des utilisateurs:', error);
    res.status(500).json({
      message: 'Erreur lors de la récupération des utilisateurs',
      error: error.message
    });
  }
};

// @desc    Obtenir les détails d'un utilisateur
// @route   GET /api/admin/users/:id
// @access  Private/Admin
exports.getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-motDePasse');

    if (!user) {
      return res.status(404).json({
        message: 'Utilisateur non trouvé'
      });
    }

    // Récupérer le portefeuille
    const wallet = await Wallet.findOne({ utilisateurId: user._id });

    // Récupérer les statistiques
    const transactionsCount = await Transaction.countDocuments({
      $or: [
        { utilisateurSourceId: user._id },
        { utilisateurDestinationId: user._id }
      ]
    });

    const tirelires = await SavingsGoal.find({ utilisateurId: user._id });

    res.status(200).json({
      user,
      wallet: wallet ? {
        solde: wallet.solde,
        devise: wallet.devise,
        statut: wallet.statut
      } : null,
      statistiques: {
        nombreTransactions: transactionsCount,
        nombreTirelires: tirelires.length,
        totalEpargne: tirelires.reduce((sum, t) => sum + t.montantActuel, 0)
      }
    });

  } catch (error) {
    console.error('Erreur lors de la récupération de l\'utilisateur:', error);
    res.status(500).json({
      message: 'Erreur lors de la récupération de l\'utilisateur',
      error: error.message
    });
  }
};

// @desc    Changer le statut d'un utilisateur (bloquer/débloquer)
// @route   PATCH /api/admin/users/:id/status
// @access  Private/Admin
exports.updateUserStatus = async (req, res) => {
  try {
    const { statut } = req.body;

    if (!statut || !['actif', 'bloque'].includes(statut)) {
      return res.status(400).json({
        message: 'Statut invalide. Valeurs autorisées : actif, bloque'
      });
    }

    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        message: 'Utilisateur non trouvé'
      });
    }

    // Ne pas permettre de bloquer un admin
    if (user.role === 'admin' && statut === 'bloque') {
      return res.status(403).json({
        message: 'Impossible de bloquer un administrateur'
      });
    }

    user.statut = statut;
    await user.save();

    // Bloquer/débloquer aussi le portefeuille
    const wallet = await Wallet.findOne({ utilisateurId: user._id });
    if (wallet) {
      wallet.statut = statut;
      await wallet.save();
    }

    res.status(200).json({
      message: `Utilisateur ${statut === 'actif' ? 'débloqué' : 'bloqué'} avec succès`,
      user: {
        id: user._id,
        nomComplet: user.nomComplet,
        telephone: user.telephone,
        statut: user.statut
      }
    });

  } catch (error) {
    console.error('Erreur lors de la mise à jour du statut:', error);
    res.status(500).json({
      message: 'Erreur lors de la mise à jour du statut',
      error: error.message
    });
  }
};

// @desc    Lister toutes les transactions (avec filtres)
// @route   GET /api/admin/transactions
// @access  Private/Admin
exports.getTransactions = async (req, res) => {
  try {
    const { type, statut, startDate, endDate, telephone, limit, skip } = req.query;

    const query = {};

    // Filtres
    if (type) query.type = type;
    if (statut) query.statut = statut;

    // Filtre par période
    if (startDate || endDate) {
      query.dateCreation = {};
      if (startDate) query.dateCreation.$gte = new Date(startDate);
      if (endDate) query.dateCreation.$lte = new Date(endDate);
    }

    // Filtre par téléphone
    if (telephone) {
      const user = await User.findOne({ telephone });
      if (user) {
        query.$or = [
          { utilisateurSourceId: user._id },
          { utilisateurDestinationId: user._id }
        ];
      } else {
        return res.status(404).json({
          message: 'Utilisateur non trouvé avec ce numéro de téléphone'
        });
      }
    }

    const transactions = await Transaction.find(query)
      .populate('utilisateurSourceId', 'nomComplet telephone')
      .populate('utilisateurDestinationId', 'nomComplet telephone')
      .limit(parseInt(limit) || 50)
      .skip(parseInt(skip) || 0)
      .sort({ dateCreation: -1 });

    const total = await Transaction.countDocuments(query);

    res.status(200).json({
      count: transactions.length,
      total,
      transactions
    });

  } catch (error) {
    console.error('Erreur lors de la récupération des transactions:', error);
    res.status(500).json({
      message: 'Erreur lors de la récupération des transactions',
      error: error.message
    });
  }
};

// @desc    Obtenir les statistiques globales du système
// @route   GET /api/admin/statistics
// @access  Private/Admin
exports.getStatistics = async (req, res) => {
  try {
    // Compter les utilisateurs
    const totalUsers = await User.countDocuments();
    const activeUsers = await User.countDocuments({ statut: 'actif' });
    const blockedUsers = await User.countDocuments({ statut: 'bloque' });
    const merchants = await User.countDocuments({ role: 'marchand' });

    // Compter les transactions
    const totalTransactions = await Transaction.countDocuments();
    const successTransactions = await Transaction.countDocuments({ statut: 'SUCCES' });
    const failedTransactions = await Transaction.countDocuments({ statut: 'ECHEC' });

    // Volume total des transactions réussies
    const volumeStats = await Transaction.aggregate([
      { $match: { statut: 'SUCCES' } },
      {
        $group: {
          _id: null,
          volumeTotal: { $sum: '$montant' }
        }
      }
    ]);

    // Transactions par type
    const transactionsByType = await Transaction.aggregate([
      { $match: { statut: 'SUCCES' } },
      {
        $group: {
          _id: '$type',
          count: { $sum: 1 },
          volumeTotal: { $sum: '$montant' }
        }
      }
    ]);

    // Solde total dans tous les portefeuilles
    const walletStats = await Wallet.aggregate([
      {
        $group: {
          _id: null,
          soldeTotal: { $sum: '$solde' }
        }
      }
    ]);

    // Épargne totale
    const savingsStats = await SavingsGoal.aggregate([
      { $match: { statut: { $in: ['actif', 'termine'] } } },
      {
        $group: {
          _id: null,
          totalEpargne: { $sum: '$montantActuel' },
          nombreTirelires: { $sum: 1 }
        }
      }
    ]);

    // Transactions des 7 derniers jours
    const dateDebut = new Date();
    dateDebut.setDate(dateDebut.getDate() - 7);

    const recentTransactions = await Transaction.countDocuments({
      dateCreation: { $gte: dateDebut },
      statut: 'SUCCES'
    });

    res.status(200).json({
      utilisateurs: {
        total: totalUsers,
        actifs: activeUsers,
        bloques: blockedUsers,
        marchands: merchants
      },
      transactions: {
        total: totalTransactions,
        reussies: successTransactions,
        echouees: failedTransactions,
        derniers7jours: recentTransactions,
        volumeTotal: volumeStats[0]?.volumeTotal || 0,
        parType: transactionsByType
      },
      finance: {
        soldeTotal: walletStats[0]?.soldeTotal || 0,
        totalEpargne: savingsStats[0]?.totalEpargne || 0,
        nombreTirelires: savingsStats[0]?.nombreTirelires || 0
      }
    });

  } catch (error) {
    console.error('Erreur lors de la récupération des statistiques:', error);
    res.status(500).json({
      message: 'Erreur lors de la récupération des statistiques',
      error: error.message
    });
  }
};

// @desc    Obtenir le tableau de bord admin
// @route   GET /api/admin/dashboard
// @access  Private/Admin
exports.getDashboard = async (req, res) => {
  try {
    // Dernières inscriptions (7 derniers jours)
    const dateDebut = new Date();
    dateDebut.setDate(dateDebut.getDate() - 7);

    const newUsers = await User.find({
      dateCreation: { $gte: dateDebut }
    })
      .select('nomComplet telephone role dateCreation')
      .sort({ dateCreation: -1 })
      .limit(10);

    // Dernières transactions
    const recentTransactions = await Transaction.find({ statut: 'SUCCES' })
      .populate('utilisateurSourceId', 'nomComplet telephone')
      .populate('utilisateurDestinationId', 'nomComplet telephone')
      .sort({ dateCreation: -1 })
      .limit(10);

    // Alertes (transactions échouées récentes)
    const failedTransactions = await Transaction.find({
      statut: 'ECHEC',
      dateCreation: { $gte: dateDebut }
    })
      .populate('utilisateurSourceId', 'nomComplet telephone')
      .sort({ dateCreation: -1 })
      .limit(5);

    // Utilisateurs bloqués
    const blockedUsers = await User.find({ statut: 'bloque' })
      .select('nomComplet telephone role dateCreation')
      .limit(10);

    res.status(200).json({
      nouvellesInscriptions: newUsers,
      dernieresTransactions: recentTransactions,
      transactionsEchouees: failedTransactions,
      utilisateursBloques: blockedUsers
    });

  } catch (error) {
    console.error('Erreur lors de la récupération du tableau de bord:', error);
    res.status(500).json({
      message: 'Erreur lors de la récupération du tableau de bord',
      error: error.message
    });
  }
};