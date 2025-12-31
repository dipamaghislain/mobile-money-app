// frontend/src/app/core/services/admin.service.ts
import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

// ==========================================
// INTERFACES
// ==========================================

export interface AdminUser {
  _id: string;
  nomComplet: string;
  telephone: string;
  email?: string;
  role: 'client' | 'marchand' | 'admin';
  statut: 'actif' | 'bloque';
  codeMarchand?: string;
  nomCommerce?: string;
  dateCreation: Date;
  wallet?: {
    solde: number;
    devise: string;
  };
}

export interface UserListResponse {
  count: number;
  total: number;
  users: AdminUser[];
}

export interface UserDetailResponse {
  user: AdminUser;
  wallet: {
    solde: number;
    devise: string;
    statut: string;
  } | null;
  statistiques: {
    nombreTransactions: number;
    nombreTirelires: number;
    totalEpargne: number;
  };
}

export interface AdminTransaction {
  _id: string;
  type: string;
  montant: number;
  devise: string;
  statut: 'SUCCES' | 'ECHEC' | 'EN_ATTENTE';
  description?: string;
  referenceExterne?: string;
  utilisateurSourceId?: {
    _id: string;
    nomComplet: string;
    telephone: string;
  };
  utilisateurDestinationId?: {
    _id: string;
    nomComplet: string;
    telephone: string;
  };
  dateCreation: Date;
  messageErreur?: string;
}

export interface TransactionListResponse {
  count: number;
  total: number;
  transactions: AdminTransaction[];
}

export interface SystemStatistics {
  utilisateurs: {
    total: number;
    actifs: number;
    bloques: number;
    marchands: number;
  };
  transactions: {
    total: number;
    reussies: number;
    echouees: number;
    derniers7jours: number;
    volumeTotal: number;
    parType: Array<{
      _id: string;
      count: number;
      volumeTotal: number;
    }>;
  };
  finance: {
    soldeTotal: number;
    totalEpargne: number;
    nombreTirelires: number;
  };
}

export interface DashboardData {
  nouvellesInscriptions: AdminUser[];
  dernieresTransactions: AdminTransaction[];
  transactionsEchouees: AdminTransaction[];
  utilisateursBloques: AdminUser[];
}

export interface UserFilters {
  role?: string;
  statut?: string;
  search?: string;
  limit?: number;
  skip?: number;
}

export interface TransactionFilters {
  type?: string;
  statut?: string;
  startDate?: string;
  endDate?: string;
  telephone?: string;
  limit?: number;
  skip?: number;
}

// ==========================================
// SERVICE
// ==========================================

@Injectable({
  providedIn: 'root'
})
export class AdminService {
  private readonly http = inject(HttpClient);
  private readonly API_URL = `${environment.apiUrl}/admin`;

  // ==========================================
  // UTILISATEURS
  // ==========================================

  /**
   * Récupère la liste des utilisateurs avec filtres
   */
  getUsers(filters?: UserFilters): Observable<UserListResponse> {
    let params = new HttpParams();

    if (filters) {
      if (filters.role) params = params.set('role', filters.role);
      if (filters.statut) params = params.set('statut', filters.statut);
      if (filters.search) params = params.set('search', filters.search);
      if (filters.limit) params = params.set('limit', filters.limit.toString());
      if (filters.skip) params = params.set('skip', filters.skip.toString());
    }

    return this.http.get<UserListResponse>(`${this.API_URL}/users`, { params });
  }

  /**
   * Récupère les détails d'un utilisateur
   */
  getUserById(id: string): Observable<UserDetailResponse> {
    return this.http.get<UserDetailResponse>(`${this.API_URL}/users/${id}`);
  }

  /**
   * Change le statut d'un utilisateur (bloquer/débloquer)
   */
  updateUserStatus(id: string, statut: 'actif' | 'bloque'): Observable<{ message: string; user: AdminUser }> {
    return this.http.patch<{ message: string; user: AdminUser }>(
      `${this.API_URL}/users/${id}/status`,
      { statut }
    );
  }

  // ==========================================
  // TRANSACTIONS
  // ==========================================

  /**
   * Récupère la liste des transactions avec filtres
   */
  getTransactions(filters?: TransactionFilters): Observable<TransactionListResponse> {
    let params = new HttpParams();

    if (filters) {
      if (filters.type) params = params.set('type', filters.type);
      if (filters.statut) params = params.set('statut', filters.statut);
      if (filters.startDate) params = params.set('startDate', filters.startDate);
      if (filters.endDate) params = params.set('endDate', filters.endDate);
      if (filters.telephone) params = params.set('telephone', filters.telephone);
      if (filters.limit) params = params.set('limit', filters.limit.toString());
      if (filters.skip) params = params.set('skip', filters.skip.toString());
    }

    return this.http.get<TransactionListResponse>(`${this.API_URL}/transactions`, { params });
  }

  // ==========================================
  // STATISTIQUES & DASHBOARD
  // ==========================================

  /**
   * Récupère les statistiques globales du système
   */
  getStatistics(): Observable<SystemStatistics> {
    return this.http.get<SystemStatistics>(`${this.API_URL}/statistics`);
  }

  /**
   * Récupère les données du tableau de bord admin
   */
  getDashboard(): Observable<DashboardData> {
    return this.http.get<DashboardData>(`${this.API_URL}/dashboard`);
  }
}

