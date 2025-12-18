// backend/src/config/env.js
// Validation des variables d'environnement

const requiredEnvVars = [
  'JWT_SECRET',
  'MONGODB_URI'
];

const optionalEnvVars = {
  NODE_ENV: 'development',
  PORT: '3000',
  JWT_EXPIRE: '7d',
  DEFAULT_CURRENCY: 'XOF',
  MAX_PIN_ATTEMPTS: '3',
  PIN_LOCK_DURATION_MINUTES: '30',
  TRANSACTION_FEE_PERCENT: '0'
};

/**
 * Valide et charge les variables d'environnement
 * @throws {Error} Si une variable requise est manquante
 */
const validateEnv = () => {
  const missing = [];

  // Vérifier les variables requises
  for (const envVar of requiredEnvVars) {
    if (!process.env[envVar]) {
      missing.push(envVar);
    }
  }

  // En production, on exige toutes les variables requises
  if (process.env.NODE_ENV === 'production' && missing.length > 0) {
    throw new Error(
      `Variables d'environnement manquantes en production: ${missing.join(', ')}\n` +
      `Veuillez définir ces variables dans votre fichier .env ou vos variables d'environnement système.`
    );
  }

  // En développement, on affiche un avertissement
  if (missing.length > 0) {
    console.warn('⚠️  Variables d\'environnement manquantes:', missing.join(', '));
    console.warn('⚠️  Utilisation de valeurs par défaut pour le développement.');
  }

  // Appliquer les valeurs par défaut pour les optionnelles
  for (const [key, defaultValue] of Object.entries(optionalEnvVars)) {
    if (!process.env[key]) {
      process.env[key] = defaultValue;
    }
  }

  // Validation spécifique du JWT_SECRET
  if (process.env.JWT_SECRET) {
    if (process.env.JWT_SECRET.length < 32) {
      console.warn('⚠️  JWT_SECRET devrait avoir au moins 32 caractères pour une sécurité optimale.');
    }
    if (process.env.JWT_SECRET === 'changeme' || process.env.JWT_SECRET === 'secret') {
      if (process.env.NODE_ENV === 'production') {
        throw new Error('JWT_SECRET non sécurisé détecté en production !');
      }
      console.warn('⚠️  JWT_SECRET non sécurisé. Ne pas utiliser en production !');
    }
  }

  return true;
};

/**
 * Récupère une variable d'environnement avec validation
 * @param {string} key - Nom de la variable
 * @param {string} defaultValue - Valeur par défaut (optionnel)
 * @returns {string} - Valeur de la variable
 */
const getEnv = (key, defaultValue = undefined) => {
  const value = process.env[key];
  
  if (value === undefined && defaultValue === undefined) {
    throw new Error(`Variable d'environnement ${key} non définie`);
  }
  
  return value || defaultValue;
};

/**
 * Récupère une variable d'environnement en tant que nombre
 * @param {string} key - Nom de la variable
 * @param {number} defaultValue - Valeur par défaut
 * @returns {number}
 */
const getEnvNumber = (key, defaultValue) => {
  const value = process.env[key];
  if (value === undefined) return defaultValue;
  
  const parsed = parseInt(value, 10);
  if (isNaN(parsed)) {
    console.warn(`⚠️  ${key} n'est pas un nombre valide, utilisation de la valeur par défaut: ${defaultValue}`);
    return defaultValue;
  }
  
  return parsed;
};

/**
 * Récupère une variable d'environnement en tant que booléen
 * @param {string} key - Nom de la variable
 * @param {boolean} defaultValue - Valeur par défaut
 * @returns {boolean}
 */
const getEnvBoolean = (key, defaultValue) => {
  const value = process.env[key];
  if (value === undefined) return defaultValue;
  
  return value.toLowerCase() === 'true' || value === '1';
};

module.exports = {
  validateEnv,
  getEnv,
  getEnvNumber,
  getEnvBoolean
};


