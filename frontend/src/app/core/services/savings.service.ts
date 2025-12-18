import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface SavingsGoal {
    id: string;
    nom: string;
    description?: string;
    montantActuel: number;
    objectifMontant?: number;
    dateObjectif?: Date;
    statut: 'active' | 'terminee' | 'annulee';
    icone?: string;
    couleur?: string;
    dateCreation: Date;
}

export interface SavingsResponse {
    count: number;
    tirelires: SavingsGoal[];
}

@Injectable({
    providedIn: 'root'
})
export class SavingsService {
    private readonly http = inject(HttpClient);
    private readonly API_URL = `${environment.apiUrl}/savings`;

    /**
     * Récupère toutes les tirelires de l'utilisateur
     */
    getSavings(): Observable<SavingsResponse> {
        return this.http.get<SavingsResponse>(this.API_URL);
    }

    /**
     * Récupère une tirelire par ID
     */
    getSavingById(id: string): Observable<SavingsGoal> {
        return this.http.get<SavingsGoal>(`${this.API_URL}/${id}`);
    }

    /**
     * Crée une nouvelle tirelire
     */
    createSaving(data: {
        nom: string;
        description?: string;
        objectifMontant?: number;
        dateObjectif?: Date;
        icone?: string;
        couleur?: string;
    }): Observable<{ message: string; tirelire: SavingsGoal }> {
        return this.http.post<{ message: string; tirelire: SavingsGoal }>(this.API_URL, data);
    }

    /**
     * Verser de l'argent dans une tirelire
     */
    depositToSaving(id: string, montant: number, pin: string): Observable<{ message: string }> {
        return this.http.post<{ message: string }>(`${this.API_URL}/${id}/deposit`, {
            montant,
            pin
        });
    }

    /**
     * Retirer de l'argent d'une tirelire
     */
    withdrawFromSaving(id: string, montant: number, pin: string): Observable<{ message: string }> {
        return this.http.post<{ message: string }>(`${this.API_URL}/${id}/withdraw`, {
            montant,
            pin
        });
    }

    /**
     * Supprime une tirelire
     */
    deleteSaving(id: string): Observable<{ message: string }> {
        return this.http.delete<{ message: string }>(`${this.API_URL}/${id}`);
    }
}
