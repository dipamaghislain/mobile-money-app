// backend/src/config/database.js

const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/mobile_money';

    // Avec Mongoose récent : PAS d'options type useNewUrlParser / useUnifiedTopology
    const conn = await mongoose.connect(uri);

    console.log(`MongoDB connecté: ${conn.connection.host}`);
    console.log(`Base de données: ${conn.connection.name}`);

    // Gestion des événements de connexion
    mongoose.connection.on('connected', () => {
      console.log(' Mongoose connecté à MongoDB');
    });

    mongoose.connection.on('error', (err) => {
      console.error(' Erreur de connexion MongoDB:', err);
    });

    mongoose.connection.on('disconnected', () => {
      console.log(' Mongoose déconnecté de MongoDB');
    });

    // Fermeture propre lors de l'arrêt de l'application
    process.on('SIGINT', async () => {
      await mongoose.connection.close();
      console.log('🔌 Connexion MongoDB fermée suite à l\'arrêt de l\'application');
      process.exit(0);
    });

    return conn;
  } catch (error) {
    console.error(' Erreur de connexion à MongoDB:', error.message);
    process.exit(1);
  }
};

module.exports = connectDB;
