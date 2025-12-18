// Modèle utilisateur adapté au backend
export interface User {
  id: string;
  nomComplet: string;
  telephone: string;
  email?: string;
  role: UserRole;
  statut: UserStatus;
  codeMarchand?: string;
  nomCommerce?: string;
  adresse?: string;
  wallet?: Wallet;
  dateCreation: Date;
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