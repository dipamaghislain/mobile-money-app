import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
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
}
