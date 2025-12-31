// backend/src/utils/ApiResponse.js
// Classe pour standardiser les réponses API

class ApiResponse {
  /**
   * Réponse de succès standard
   */
  static success(res, data = null, message = 'Opération réussie', statusCode = 200) {
    return res.status(statusCode).json({
      success: true,
      message,
      data,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Réponse de création réussie
   */
  static created(res, data = null, message = 'Ressource créée avec succès') {
    return ApiResponse.success(res, data, message, 201);
  }

  /**
   * Réponse paginée
   */
  static paginated(res, data, pagination, message = 'Données récupérées avec succès') {
    return res.status(200).json({
      success: true,
      message,
      data,
      pagination: {
        page: pagination.page,
        limit: pagination.limit,
        total: pagination.total,
        totalPages: Math.ceil(pagination.total / pagination.limit),
        hasNextPage: pagination.page < Math.ceil(pagination.total / pagination.limit),
        hasPrevPage: pagination.page > 1
      },
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Réponse de transaction
   */
  static transaction(res, transaction, wallet, message = 'Transaction effectuée avec succès') {
    return res.status(200).json({
      success: true,
      message,
      data: {
        transaction: {
          id: transaction._id,
          reference: transaction.referenceExterne,
          type: transaction.type,
          montant: transaction.montant,
          frais: transaction.fraisTransaction,
          montantTotal: transaction.montant + (transaction.fraisTransaction || 0),
          devise: transaction.devise,
          statut: transaction.statut,
          description: transaction.description,
          date: transaction.createdAt
        },
        solde: {
          disponible: wallet.solde,
          devise: wallet.devise
        }
      },
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Réponse d'authentification
   */
  static auth(res, user, token, message = 'Authentification réussie') {
    return res.status(200).json({
      success: true,
      message,
      data: {
        user: {
          id: user._id,
          nomComplet: user.nomComplet,
          email: user.email,
          telephone: user.telephone,
          role: user.role,
          kycLevel: user.kycLevel,
          statut: user.statut,
          codeMarchand: user.codeMarchand,
          nomCommerce: user.nomCommerce
        },
        token,
        expiresIn: process.env.JWT_EXPIRE || '7d'
      },
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Réponse sans contenu
   */
  static noContent(res) {
    return res.status(204).send();
  }
}

module.exports = ApiResponse;
