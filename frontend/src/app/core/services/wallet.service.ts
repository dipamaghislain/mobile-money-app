import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface WalletResponse {
    id: string;
    solde: number;
    devise: string;
    statut: string;
}

export interface TransactionHistoryItem {
    id: string;
    type: string;
    montant: number;
    devise: string;
    statut: string;
    description?: string;
    dateCreation: Date;
}

export interface TransactionsResponse {
    count: number;
    transactions: TransactionHistoryItem[];
}

export interface StatisticsResponse {
    soldeActuel: number;
    devise: string;
    statistiques: any;
}

@Injectable({
    providedIn: 'root'
})
export class WalletService {
    private readonly http = inject(HttpClient);
    private readonly API_URL = `${environment.apiUrl}/wallet`;

    /**
     * Récupère les informations du portefeuille de l'utilisateur connecté
     */
    getWallet(): Observable<WalletResponse> {
        return this.http.get<WalletResponse>(this.API_URL);
    }

    /**
     * Définit ou modifie le code PIN du portefeuille
     */
    setPin(nouveauPin: string, ancienPin?: string): Observable<{ message: string }> {
        return this.http.patch<{ message: string }>(`${this.API_URL}/pin`, {
            nouveauPin,
            ancienPin
        });
    }

    /**
     * Vérifie le code PIN
     */
    verifyPin(pin: string): Observable<{ message: string; valide: boolean }> {
        return this.http.post<{ message: string; valide: boolean }>(`${this.API_URL}/verify-pin`, { pin });
    }

    /**
     * Récupère l'historique des transactions
     */
    getTransactions(options?: {
        type?: string;
        startDate?: string;
        endDate?: string;
        limit?: number;
        skip?: number;
    }): Observable<TransactionsResponse> {
        let params = new HttpParams();

        if (options) {
            if (options.type) params = params.set('type', options.type);
            if (options.startDate) params = params.set('startDate', options.startDate);
            if (options.endDate) params = params.set('endDate', options.endDate);
            if (options.limit) params = params.set('limit', options.limit.toString());
            if (options.skip) params = params.set('skip', options.skip.toString());
        }

        return this.http.get<TransactionsResponse>(`${this.API_URL}/transactions`, { params });
    }

    /**
     * Récupère les statistiques du portefeuille
     */
    getStatistics(periode: number = 30): Observable<StatisticsResponse> {
        const params = new HttpParams().set('periode', periode.toString());
        return this.http.get<StatisticsResponse>(`${this.API_URL}/statistics`, { params });
    }
}
