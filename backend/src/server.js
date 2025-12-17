// backend/src/server.js

const app = require('./app');
const connectDB = require('./config/database');

// Connecter à MongoDB
connectDB();

// Définir le port
const PORT = process.env.PORT || 3000;

// Démarrer le serveur
const server = app.listen(PORT, () => {
  console.log('');
  console.log('========================================');
  console.log(`Serveur démarré sur le port ${PORT}`);
  console.log(` Environnement: ${process.env.NODE_ENV || 'development'}`);
  console.log(` URL: http://localhost:${PORT}`);
  console.log('========================================');
  console.log('');
  console.log(' Endpoints disponibles:');
  console.log(`   POST   /api/auth/register`);
  console.log(`   POST   /api/auth/login`);
  console.log(`   GET    /api/auth/me`);
  console.log(`   GET    /api/wallet`);
  console.log(`   POST   /api/transactions/deposit`);
  console.log(`   POST   /api/transactions/withdraw`);
  console.log(`   POST   /api/transactions/transfer`);
  console.log(`   GET    /api/savings`);
  console.log(`   GET    /api/admin/users`);
  console.log('');
  console.log('Prêt à recevoir des requêtes !');
  console.log('');
});

// Gestion des erreurs non capturées
process.on('unhandledRejection', (err) => {
  console.error('Erreur non gérée (Promise Rejection):', err);
  server.close(() => {
    process.exit(1);
  });
});

process.on('uncaughtException', (err) => {
  console.error(' Erreur non capturée (Exception):', err);
  process.exit(1);
});