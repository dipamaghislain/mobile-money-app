// frontend/src/app/core/models/country.model.ts
// Modèle pour les pays supportés

export interface PhoneFormat {
  regex?: RegExp | string;
  longueur: number;
  exemple: string;
  description: string;
}

export interface Country {
  code: string;
  nom: string;
  indicatif: string;
  devise: string;
  symbole: string;
  formatTelephone: PhoneFormat;
  operateurs?: string[];
  limites?: {
    depotMin: number;
    depotMax: number;
    retraitMin: number;
    retraitMax: number;
    transfertMin: number;
    transfertMax: number;
    soldeMax: number;
  };
  frais?: {
    depot: number;
    retrait: number;
    transfertInterne: number;
    transfertExterne: number;
  };
}

export interface CountriesResponse {
  countries: Country[];
  default: string;
}

// Constantes des pays
export const COUNTRY_CODES = {
  BF: 'BF',
  CI: 'CI',
  SN: 'SN',
  ML: 'ML',
  CM: 'CM',
  TG: 'TG',
  BJ: 'BJ'
} as const;

export type CountryCode = keyof typeof COUNTRY_CODES;
