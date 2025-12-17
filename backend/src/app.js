// backend/src/app.js
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

// Charger les variables d'environnement
dotenv.config();

// Importer les routes
const authRoutes = require('./routes/authRoutes');
const walletRoutes = require('./routes/walletRoutes');
const transactionRoutes = require('./routes/transactionRoutes');
const savingsRoutes = require('./routes/savingsRoutes');
const adminRoutes = require('./routes/adminRoutes');

// Créer l'application Express
const app = express();

// Middlewares globaux
app.use(cors()); // Activer CORS
app.use(express.json()); // Parser le JSON
app.use(express.urlencoded({ extended: true })); // Parser les données URL encodées

// Logger les requêtes en développement
if (process.env.NODE_ENV === 'development') {
  app.use((req, res, next) => {
    console.log(`${req.method} ${req.path}`);  // ✅ CORRECTION ICI
    next();
  });
}

// Route de test
app.get('/', (req, res) => {
  res.json({
    message: 'Bienvenue sur l\'API Mobile Money',
    version: '1.0.0',
    endpoints: {
      auth: '/api/auth',
      wallet: '/api/wallet',
      transactions: '/api/transactions',
      savings: '/api/savings',
      admin: '/api/admin'
    }
  });
});

// Enregistrer les routes
app.use('/api/auth', authRoutes);
app.use('/api/wallet', walletRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/savings', savingsRoutes);
app.use('/api/admin', adminRoutes);

// Route 404 - Non trouvée
app.use((req, res) => {
  res.status(404).json({
    message: 'Route non trouvée'
  });
});

// Middleware de gestion des erreurs globales
app.use((err, req, res, next) => {
  console.error('Erreur globale:', err);
  
  res.status(err.status || 500).json({
    message: err.message || 'Erreur serveur',
    error: process.env.NODE_ENV === 'development' ? err : {}
  });
});

module.exports = app;