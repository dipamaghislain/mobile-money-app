// backend/src/config/countries.js
// Configuration multi-pays pour l'application Mobile Money

const COUNTRIES = {
  // ============================================
  // ZONE UEMOA (Franc CFA - XOF)
  // ============================================
  BF: {
    code: 'BF',
    nom: 'Burkina Faso',
    indicatif: '+226',
    devise: 'XOF',
    deviseNom: 'Franc CFA (BCEAO)',
    symbole: 'FCFA',
    formatTelephone: {
      regex: /^(\+226)?[0-9]{8}$/,
      longueur: 8,
      exemple: '70123456',
      description: '8 chiffres'
    },
    operateurs: ['Orange', 'Moov', 'Telecel'],
    limites: {
      depotMin: 100,
      depotMax: 2000000,
      retraitMin: 500,
      retraitMax: 500000,
      transfertMin: 100,
      transfertMax: 1000000,
      soldeMax: 2000000
    },
    frais: {
      depot: 0,
      retrait: 1.5, // 1.5%
      transfertInterne: 1, // 1%
      transfertExterne: 2.5 // 2.5% vers autre pays
    },
    actif: true
  },

  CI: {
    code: 'CI',
    nom: 'Côte d\'Ivoire',
    indicatif: '+225',
    devise: 'XOF',
    deviseNom: 'Franc CFA (BCEAO)',
    symbole: 'FCFA',
    formatTelephone: {
      regex: /^(\+225)?[0-9]{10}$/,
      longueur: 10,
      exemple: '0701234567',
      description: '10 chiffres (07, 05, 01)'
    },
    operateurs: ['Orange', 'MTN', 'Moov'],
    limites: {
      depotMin: 100,
      depotMax: 3000000,
      retraitMin: 500,
      retraitMax: 1000000,
      transfertMin: 100,
      transfertMax: 2000000,
      soldeMax: 3000000
    },
    frais: {
      depot: 0,
      retrait: 1.5,
      transfertInterne: 1,
      transfertExterne: 2.5
    },
    actif: true
  },

  SN: {
    code: 'SN',
    nom: 'Sénégal',
    indicatif: '+221',
    devise: 'XOF',
    deviseNom: 'Franc CFA (BCEAO)',
    symbole: 'FCFA',
    formatTelephone: {
      regex: /^(\+221)?[0-9]{9}$/,
      longueur: 9,
      exemple: '771234567',
      description: '9 chiffres (77, 78, 76, 70)'
    },
    operateurs: ['Orange', 'Free', 'Expresso'],
    limites: {
      depotMin: 100,
      depotMax: 2000000,
      retraitMin: 500,
      retraitMax: 500000,
      transfertMin: 100,
      transfertMax: 1500000,
      soldeMax: 2000000
    },
    frais: {
      depot: 0,
      retrait: 1.5,
      transfertInterne: 1,
      transfertExterne: 2.5
    },
    actif: true
  },

  ML: {
    code: 'ML',
    nom: 'Mali',
    indicatif: '+223',
    devise: 'XOF',
    deviseNom: 'Franc CFA (BCEAO)',
    symbole: 'FCFA',
    formatTelephone: {
      regex: /^(\+223)?[0-9]{8}$/,
      longueur: 8,
      exemple: '70123456',
      description: '8 chiffres'
    },
    operateurs: ['Orange', 'Malitel', 'Telecel'],
    limites: {
      depotMin: 100,
      depotMax: 2000000,
      retraitMin: 500,
      retraitMax: 500000,
      transfertMin: 100,
      transfertMax: 1000000,
      soldeMax: 2000000
    },
    frais: {
      depot: 0,
      retrait: 1.5,
      transfertInterne: 1,
      transfertExterne: 2.5
    },
    actif: true
  },

  // ============================================
  // ZONE CEMAC (Franc CFA - XAF)
  // ============================================
  CM: {
    code: 'CM',
    nom: 'Cameroun',
    indicatif: '+237',
    devise: 'XAF',
    deviseNom: 'Franc CFA (BEAC)',
    symbole: 'FCFA',
    formatTelephone: {
      regex: /^(\+237)?[0-9]{9}$/,
      longueur: 9,
      exemple: '690123456',
      description: '9 chiffres (6xx)'
    },
    operateurs: ['MTN', 'Orange', 'Camtel'],
    limites: {
      depotMin: 100,
      depotMax: 3000000,
      retraitMin: 500,
      retraitMax: 1000000,
      transfertMin: 100,
      transfertMax: 2000000,
      soldeMax: 3000000
    },
    frais: {
      depot: 0,
      retrait: 1.5,
      transfertInterne: 1,
      transfertExterne: 3 // Plus cher car zone différente
    },
    actif: true
  },

  // ============================================
  // AUTRES PAYS (pour extension future)
  // ============================================
  TG: {
    code: 'TG',
    nom: 'Togo',
    indicatif: '+228',
    devise: 'XOF',
    deviseNom: 'Franc CFA (BCEAO)',
    symbole: 'FCFA',
    formatTelephone: {
      regex: /^(\+228)?[0-9]{8}$/,
      longueur: 8,
      exemple: '90123456',
      description: '8 chiffres'
    },
    operateurs: ['Togocel', 'Moov'],
    limites: {
      depotMin: 100,
      depotMax: 2000000,
      retraitMin: 500,
      retraitMax: 500000,
      transfertMin: 100,
      transfertMax: 1000000,
      soldeMax: 2000000
    },
    frais: {
      depot: 0,
      retrait: 1.5,
      transfertInterne: 1,
      transfertExterne: 2.5
    },
    actif: true
  },

  BJ: {
    code: 'BJ',
    nom: 'Bénin',
    indicatif: '+229',
    devise: 'XOF',
    deviseNom: 'Franc CFA (BCEAO)',
    symbole: 'FCFA',
    formatTelephone: {
      regex: /^(\+229)?[0-9]{8}$/,
      longueur: 8,
      exemple: '90123456',
      description: '8 chiffres'
    },
    operateurs: ['MTN', 'Moov'],
    limites: {
      depotMin: 100,
      depotMax: 2000000,
      retraitMin: 500,
      retraitMax: 500000,
      transfertMin: 100,
      transfertMax: 1000000,
      soldeMax: 2000000
    },
    frais: {
      depot: 0,
      retrait: 1.5,
      transfertInterne: 1,
      transfertExterne: 2.5
    },
    actif: true
  }
};

// Pays par défaut
const DEFAULT_COUNTRY = 'BF';

// Liste des devises supportées
const DEVISES = {
  XOF: {
    code: 'XOF',
    nom: 'Franc CFA (BCEAO)',
    symbole: 'FCFA',
    pays: ['BF', 'CI', 'SN', 'ML', 'TG', 'BJ', 'NE', 'GW']
  },
  XAF: {
    code: 'XAF',
    nom: 'Franc CFA (BEAC)',
    symbole: 'FCFA',
    pays: ['CM', 'GA', 'CG', 'TD', 'CF', 'GQ']
  }
};

// Taux de change entre devises (XOF et XAF ont parité 1:1)
const TAUX_CHANGE = {
  'XOF-XAF': 1,
  'XAF-XOF': 1
};

// ============================================
// FONCTIONS UTILITAIRES
// ============================================

/**
 * Récupère la configuration d'un pays
 */
function getCountry(codeOuIndicatif) {
  // Par code pays (BF, CI, etc.)
  if (COUNTRIES[codeOuIndicatif]) {
    return COUNTRIES[codeOuIndicatif];
  }
  
  // Par indicatif (+226, +225, etc.)
  const country = Object.values(COUNTRIES).find(c => c.indicatif === codeOuIndicatif);
  return country || null;
}

/**
 * Récupère tous les pays actifs
 */
function getActiveCountries() {
  return Object.values(COUNTRIES).filter(c => c.actif);
}

/**
 * Valide un numéro de téléphone pour un pays
 */
function validatePhoneNumber(telephone, codePays) {
  const country = getCountry(codePays);
  if (!country) {
    return { valid: false, error: 'Pays non supporté' };
  }

  // Nettoyer le numéro (enlever espaces, tirets)
  let cleanNumber = telephone.replace(/[\s\-\.]/g, '');
  
  // Si commence par l'indicatif, l'enlever pour la validation
  if (cleanNumber.startsWith(country.indicatif)) {
    cleanNumber = cleanNumber.substring(country.indicatif.length);
  } else if (cleanNumber.startsWith(country.indicatif.substring(1))) {
    // Gère le cas où l'indicatif est sans le +
    cleanNumber = cleanNumber.substring(country.indicatif.length - 1);
  }

  // Vérifier la longueur
  if (cleanNumber.length !== country.formatTelephone.longueur) {
    return { 
      valid: false, 
      error: `Le numéro doit contenir ${country.formatTelephone.longueur} chiffres` 
    };
  }

  // Vérifier que ce sont tous des chiffres
  if (!/^\d+$/.test(cleanNumber)) {
    return { valid: false, error: 'Le numéro ne doit contenir que des chiffres' };
  }

  return { 
    valid: true, 
    numeroFormate: country.indicatif + cleanNumber,
    numeroLocal: cleanNumber
  };
}

/**
 * Formate un numéro de téléphone avec l'indicatif du pays
 */
function formatPhoneNumber(telephone, codePays) {
  const validation = validatePhoneNumber(telephone, codePays);
  if (!validation.valid) {
    return telephone; // Retourne tel quel si invalide
  }
  return validation.numeroFormate;
}

/**
 * Détermine le pays à partir d'un numéro de téléphone
 */
function getCountryFromPhone(telephone) {
  const cleanNumber = telephone.replace(/[\s\-\.]/g, '');
  
  for (const country of Object.values(COUNTRIES)) {
    if (cleanNumber.startsWith(country.indicatif)) {
      return country;
    }
  }
  
  return null;
}

/**
 * Calcule les frais de transaction
 */
function calculateFees(montant, typeTransaction, paysSource, paysDestination = null) {
  const country = getCountry(paysSource);
  if (!country) return 0;

  let tauxFrais = 0;

  switch (typeTransaction) {
    case 'DEPOSIT':
      tauxFrais = country.frais.depot;
      break;
    case 'WITHDRAW':
      tauxFrais = country.frais.retrait;
      break;
    case 'TRANSFER':
      if (paysDestination && paysDestination !== paysSource) {
        tauxFrais = country.frais.transfertExterne;
      } else {
        tauxFrais = country.frais.transfertInterne;
      }
      break;
    default:
      tauxFrais = country.frais.transfertInterne;
  }

  return Math.ceil(montant * tauxFrais / 100);
}

/**
 * Vérifie les limites de transaction
 */
function checkTransactionLimits(montant, typeTransaction, codePays) {
  const country = getCountry(codePays);
  if (!country) {
    return { valid: false, error: 'Pays non supporté' };
  }

  const limites = country.limites;
  let min, max;

  switch (typeTransaction) {
    case 'DEPOSIT':
      min = limites.depotMin;
      max = limites.depotMax;
      break;
    case 'WITHDRAW':
      min = limites.retraitMin;
      max = limites.retraitMax;
      break;
    case 'TRANSFER':
    case 'MERCHANT_PAYMENT':
      min = limites.transfertMin;
      max = limites.transfertMax;
      break;
    default:
      min = 100;
      max = limites.transfertMax;
  }

  if (montant < min) {
    return { valid: false, error: `Montant minimum: ${min.toLocaleString()} ${country.symbole}` };
  }

  if (montant > max) {
    return { valid: false, error: `Montant maximum: ${max.toLocaleString()} ${country.symbole}` };
  }

  return { valid: true };
}

/**
 * Convertit un montant entre devises
 */
function convertAmount(montant, deviseSource, deviseDestination) {
  if (deviseSource === deviseDestination) {
    return montant;
  }

  const key = `${deviseSource}-${deviseDestination}`;
  const taux = TAUX_CHANGE[key];
  
  if (!taux) {
    throw new Error(`Conversion ${deviseSource} vers ${deviseDestination} non supportée`);
  }

  return Math.round(montant * taux);
}

module.exports = {
  COUNTRIES,
  DEFAULT_COUNTRY,
  DEVISES,
  TAUX_CHANGE,
  getCountry,
  getActiveCountries,
  validatePhoneNumber,
  formatPhoneNumber,
  getCountryFromPhone,
  calculateFees,
  checkTransactionLimits,
  convertAmount
};
