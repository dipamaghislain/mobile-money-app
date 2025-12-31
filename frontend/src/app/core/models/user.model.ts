// Modèle utilisateur adapté au backend multi-pays
export interface User {
  id: string;
  email: string;
  nomComplet: string;
  telephone: string;
  pays: string;
  devise: string;
  role: UserRole;
  statut: UserStatus;
  codeMarchand?: string;
  nomCommerce?: string;
  adresse?: string;
  kycLevel?: number;
  pinConfigured: boolean;
  wallet?: Wallet;
  dateCreation?: Date;
  paysConfig?: {
    nom: string;
    symbole: string;
    indicatif: string;
    limites: any;
  };
}

export enum UserRole {
  CLIENT = 'client',
  MERCHANT = 'marchand',
  AGENT = 'agent',
  ADMIN = 'admin'
}

export enum UserStatus {
  ACTIVE = 'actif',
  INACTIVE = 'inactif',
  SUSPENDED = 'suspendu',
  BLOCKED = 'bloque'
}

export interface Wallet {
  id: string;
  utilisateurId: string;
  solde: number;
  devise: string;
  statut: string;
}

export interface ApiResponse<T> {
  message: string;
  user?: T;
  token?: string;
  data?: T;
}