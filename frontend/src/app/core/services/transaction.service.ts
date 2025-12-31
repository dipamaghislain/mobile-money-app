import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface TransactionResponse {
    message: string;
    transaction?: {
        id: string;
        type: string;
        montant: number;
        statut: string;
        dateCreation: Date;
    };
    nouveauSolde?: number;
}

export interface DepositRequest {
    montant: number;
    description?: string;
    source?: string;
}

export interface WithdrawRequest {
    montant: number;
    pin: string;
    description?: string;
}

export interface TransferRequest {
    destinataire: string; // Numéro de téléphone du destinataire
    montant: number;
    pin: string;
    description?: string;
}

export interface MerchantPaymentRequest {
    codeMarchand: string;
    montant: number;
    pin: string;
    description?: string;
}

// Interfaces pour l'historique amélioré
export interface HistoryFilters {
    page?: number;
    limit?: number;
    type?: string;
    statut?: string;
    dateDebut?: string;
    dateFin?: string;
    montantMin?: number;
    montantMax?: number;
    recherche?: string;
    tri?: 'date_desc' | 'date_asc' | 'montant_desc' | 'montant_asc';
}

export interface Transaction {
    _id: string;
    type: string;
    montant: number;
    devise: string;
    description?: string;
    referenceExterne: string;
    statut: string;
    createdAt: Date;
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
}

export interface HistoryResponse {
    transactions: Transaction[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        pages: number;
    };
    resume?: {
        totalEntrees: number;
        totalSorties: number;
    };
    filtres: HistoryFilters;
}

export interface ExportOptions {
    format: 'csv' | 'json';
    type?: string;
    dateDebut?: string;
    dateFin?: string;
}

@Injectable({
    providedIn: 'root'
})
export class TransactionService {
    private readonly http = inject(HttpClient);
    private readonly API_URL = `${environment.apiUrl}/transactions`;

    /**
     * Effectue un dépôt sur le portefeuille
     */
    deposit(data: DepositRequest): Observable<TransactionResponse> {
        return this.http.post<TransactionResponse>(`${this.API_URL}/deposit`, data);
    }

    /**
     * Effectue un retrait du portefeuille
     */
    withdraw(data: WithdrawRequest): Observable<TransactionResponse> {
        return this.http.post<TransactionResponse>(`${this.API_URL}/withdraw`, data);
    }

    /**
     * Effectue un transfert vers un autre utilisateur
     */
    transfer(data: TransferRequest): Observable<TransactionResponse> {
        return this.http.post<TransactionResponse>(`${this.API_URL}/transfer`, data);
    }

    /**
     * Effectue un paiement marchand
     */
    merchantPayment(data: MerchantPaymentRequest): Observable<TransactionResponse> {
        return this.http.post<TransactionResponse>(`${this.API_URL}/merchant-payment`, data);
    }

    /**
     * Récupère l'historique des transactions avec filtres
     */
    getHistory(filters: HistoryFilters = {}): Observable<HistoryResponse> {
        let params = new HttpParams();
        
        Object.entries(filters).forEach(([key, value]) => {
            if (value !== undefined && value !== null && value !== '') {
                params = params.set(key, String(value));
            }
        });

        return this.http.get<HistoryResponse>(`${this.API_URL}/history`, { params });
    }

    /**
     * Récupère les détails d'une transaction
     */
    getTransaction(id: string): Observable<{ transaction: Transaction }> {
        return this.http.get<{ transaction: Transaction }>(`${this.API_URL}/${id}`);
    }

    /**
     * Exporte l'historique des transactions
     */
    exportHistory(options: ExportOptions): Observable<Blob | any> {
        let params = new HttpParams();
        
        Object.entries(options).forEach(([key, value]) => {
            if (value) {
                params = params.set(key, String(value));
            }
        });

        if (options.format === 'csv') {
            return this.http.get(`${this.API_URL}/export`, { 
                params, 
                responseType: 'blob' 
            });
        }

        return this.http.get(`${this.API_URL}/export`, { params });
    }

    /**
     * Récupère les statistiques
     */
    getStats(): Observable<{ stats: any[] }> {
        return this.http.get<{ stats: any[] }>(`${this.API_URL}/stats`);
    }
}
