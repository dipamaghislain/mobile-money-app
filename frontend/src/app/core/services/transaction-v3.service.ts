// src/app/core/services/transaction-v3.service.ts
// Service de transactions API v3 - Multi-pays avec opérateurs Mobile Money

import { Injectable, inject, signal } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, tap, catchError, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';

// ============================================
// INTERFACES - PAYS ET OPÉRATEURS
// ============================================

export interface MobileOperator {
  nom: string;
  code: string;
  logo?: string;
  icon?: string;
  couleur?: string;
}

// Mapping des opérateurs par pays avec leurs détails
export const OPERATORS_BY_COUNTRY: Record<string, MobileOperator[]> = {
  'BF': [
    { nom: 'Orange', code: 'ORANGE', icon: '🟠', couleur: '#ff6b00' },
    { nom: 'Moov', code: 'MOOV', icon: '🔵', couleur: '#0066cc' },
    { nom: 'Telecel', code: 'TELECEL', icon: '📱', couleur: '#009900' }
  ],
  'CI': [
    { nom: 'Orange', code: 'ORANGE', icon: '🟠', couleur: '#ff6b00' },
    { nom: 'MTN', code: 'MTN', icon: '🟡', couleur: '#ffcc00' },
    { nom: 'Moov', code: 'MOOV', icon: '🔵', couleur: '#0066cc' },
    { nom: 'Wave', code: 'WAVE', icon: '🌊', couleur: '#1dc3e0' }
  ],
  'SN': [
    { nom: 'Orange', code: 'ORANGE', icon: '🟠', couleur: '#ff6b00' },
    { nom: 'Free', code: 'FREE', icon: '🟢', couleur: '#00cc66' },
    { nom: 'Expresso', code: 'EXPRESSO', icon: '🔴', couleur: '#cc0000' },
    { nom: 'Wave', code: 'WAVE', icon: '🌊', couleur: '#1dc3e0' }
  ],
  'ML': [
    { nom: 'Orange', code: 'ORANGE', icon: '🟠', couleur: '#ff6b00' },
    { nom: 'Malitel', code: 'MALITEL', icon: '📞', couleur: '#006699' },
    { nom: 'Telecel', code: 'TELECEL', icon: '📱', couleur: '#009900' }
  ],
  'CM': [
    { nom: 'MTN', code: 'MTN', icon: '🟡', couleur: '#ffcc00' },
    { nom: 'Orange', code: 'ORANGE', icon: '🟠', couleur: '#ff6b00' },
    { nom: 'Camtel', code: 'CAMTEL', icon: '📡', couleur: '#003366' }
  ],
  'TG': [
    { nom: 'Togocel', code: 'TOGOCEL', icon: '📶', couleur: '#ff3300' },
    { nom: 'Moov', code: 'MOOV', icon: '🔵', couleur: '#0066cc' }
  ],
  'BJ': [
    { nom: 'MTN', code: 'MTN', icon: '🟡', couleur: '#ffcc00' },
    { nom: 'Moov', code: 'MOOV', icon: '🔵', couleur: '#0066cc' },
    { nom: 'Celtiis', code: 'CELTIIS', icon: '📲', couleur: '#9933cc' }
  ]
}

export interface PhoneFormat {
  regex: string;
  longueur: number;
  exemple: string;
  description: string;
}

export interface TransactionLimits {
  depotMin: number;
  depotMax: number;
  retraitMin: number;
  retraitMax: number;
  transfertMin: number;
  transfertMax: number;
  soldeMax: number;
}

export interface TransactionFees {
  depot: number;
  retrait: number;
  transfertInterne: number;
  transfertExterne: number;
}

export interface Country {
  code: string;
  nom: string;
  indicatif: string;
  devise: string;
  deviseNom: string;
  symbole: string;
  formatTelephone: PhoneFormat;
  operateurs: string[];
  limites: TransactionLimits;
  frais: TransactionFees;
  actif: boolean;
}

// ============================================
// INTERFACES - REQUÊTES
// ============================================

export interface DepositRequestV3 {
  montant: number;
  telephoneSource?: string;
  operateur?: string;
  pin?: string;
  description?: string;
}

export interface WithdrawRequestV3 {
  montant: number;
  telephoneDestination?: string;
  operateur?: string;
  pin: string;
  description?: string;
}

export interface TransferRequestV3 {
  destinataire: string;
  paysDestinataire?: string;
  montant: number;
  pin: string;
  description?: string;
}

export interface ValidateRecipientRequest {
  telephone: string;
  pays?: string;
}

export interface CalculateFeesRequest {
  type: 'DEPOSIT' | 'WITHDRAW' | 'TRANSFER';
  montant: number;
  paysSource?: string;
  paysDestination?: string;
}

// ============================================
// INTERFACES - RÉPONSES
// ============================================

export interface TransactionResponseV3 {
  success: boolean;
  message?: string;
  data?: {
    transaction: TransactionV3;
    nouveauSolde: number;
    frais?: number;
  };
}

export interface TransactionV3 {
  _id: string;
  reference: string;
  type: string;
  montant: number;
  devise: string;
  frais: number;
  montantNet: number;
  statut: string;
  paysSource: string;
  paysDestination?: string;
  telephoneSource?: string;
  telephoneDestination?: string;
  operateurSource?: string;
  operateurDestination?: string;
  description?: string;
  dateCreation: Date;
  utilisateurSource?: {
    _id: string;
    nomComplet: string;
    telephone: string;
    pays: string;
  };
  utilisateurDestination?: {
    _id: string;
    nomComplet: string;
    telephone: string;
    pays: string;
  };
}

export interface CountriesResponse {
  success: boolean;
  data: {
    countries: Country[];
  };
}

export interface CountryInfoResponse {
  success: boolean;
  data: {
    country: Country;
    operateurs: MobileOperator[];
  };
}

export interface RecipientValidationResponse {
  success: boolean;
  data: {
    valide: boolean;
    utilisateur?: {
      nomComplet: string;
      telephone: string;
      pays: string;
    };
    message?: string;
  };
}

export interface FeesCalculationResponse {
  success: boolean;
  data: {
    montant: number;
    frais: number;
    montantTotal: number;
    tauxFrais: number;
    devise: string;
    estTransfertInternational: boolean;
  };
}

export interface PinStatusResponse {
  success: boolean;
  data: {
    pinConfigured: boolean;
    tentativesRestantes?: number;
    bloqueJusqua?: Date;
    niveauBlocage?: number;
  };
}

export interface HistoryFiltersV3 {
  page?: number;
  limit?: number;
  type?: string;
  statut?: string;
  dateDebut?: string;
  dateFin?: string;
  pays?: string;
  tri?: 'date_desc' | 'date_asc' | 'montant_desc' | 'montant_asc';
}

export interface HistoryResponseV3 {
  success: boolean;
  data: {
    transactions: TransactionV3[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      pages: number;
    };
    resume?: {
      totalEntrees: number;
      totalSorties: number;
      fraisTotal: number;
    };
  };
}

// ============================================
// SERVICE
// ============================================

@Injectable({
  providedIn: 'root'
})
export class TransactionV3Service {
  private readonly http = inject(HttpClient);
  private readonly API_URL = `${environment.apiUrl}/v3/transactions`;

  // Cache des pays
  private countriesCache = signal<Country[]>([]);
  private countriesCacheTime = 0;
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  // ============================================
  // PAYS ET OPÉRATEURS
  // ============================================

  /**
   * Récupère la liste des pays disponibles
   */
  getCountries(forceRefresh = false): Observable<CountriesResponse> {
    const now = Date.now();
    
    // Utiliser le cache si disponible et pas expiré
    if (!forceRefresh && this.countriesCache().length > 0 && 
        (now - this.countriesCacheTime) < this.CACHE_DURATION) {
      return new Observable(observer => {
        observer.next({ success: true, data: { countries: this.countriesCache() } });
        observer.complete();
      });
    }

    return this.http.get<CountriesResponse>(`${this.API_URL}/countries`).pipe(
      tap(response => {
        if (response.success && response.data?.countries) {
          this.countriesCache.set(response.data.countries);
          this.countriesCacheTime = now;
        }
      })
    );
  }

  /**
   * Récupère les informations d'un pays
   */
  getCountryInfo(code: string): Observable<CountryInfoResponse> {
    return this.http.get<CountryInfoResponse>(`${this.API_URL}/country/${code}`);
  }

  /**
   * Récupère les opérateurs d'un pays depuis le cache (noms seulement)
   */
  getOperatorsForCountry(countryCode: string): string[] {
    const country = this.countriesCache().find(c => c.code === countryCode);
    return country?.operateurs || [];
  }

  /**
   * Récupère les opérateurs détaillés d'un pays (avec icônes et couleurs)
   */
  getOperatorsDetailedForCountry(countryCode: string): MobileOperator[] {
    return OPERATORS_BY_COUNTRY[countryCode] || [];
  }

  /**
   * Récupère l'icône d'un opérateur
   */
  getOperatorIcon(operatorName: string): string {
    const icons: Record<string, string> = {
      'Orange': '🟠',
      'MTN': '🟡',
      'Moov': '🔵',
      'Free': '🟢',
      'Wave': '🌊',
      'Expresso': '🔴',
      'Telecel': '📱',
      'Malitel': '📞',
      'Togocel': '📶',
      'Camtel': '📡',
      'Celtiis': '📲',
      'T-Money': '💰',
      'Flooz': '💸'
    };
    return icons[operatorName] || '📱';
  }

  /**
   * Récupère la couleur d'un opérateur
   */
  getOperatorColor(operatorName: string): string {
    const colors: Record<string, string> = {
      'Orange': '#ff6b00',
      'MTN': '#ffcc00',
      'Moov': '#0066cc',
      'Free': '#00cc66',
      'Wave': '#1dc3e0',
      'Expresso': '#cc0000',
      'Telecel': '#009900',
      'Malitel': '#006699',
      'Togocel': '#ff3300',
      'Camtel': '#003366',
      'Celtiis': '#9933cc'
    };
    return colors[operatorName] || '#666666';
  }

  /**
   * Récupère les limites d'un pays depuis le cache
   */
  getLimitsForCountry(countryCode: string): TransactionLimits | null {
    const country = this.countriesCache().find(c => c.code === countryCode);
    return country?.limites || null;
  }

  // ============================================
  // TRANSACTIONS
  // ============================================

  /**
   * Effectue un dépôt
   */
  deposit(data: DepositRequestV3): Observable<TransactionResponseV3> {
    return this.http.post<TransactionResponseV3>(`${this.API_URL}/deposit`, data).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Effectue un retrait
   */
  withdraw(data: WithdrawRequestV3): Observable<TransactionResponseV3> {
    return this.http.post<TransactionResponseV3>(`${this.API_URL}/withdraw`, data).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Effectue un transfert
   */
  transfer(data: TransferRequestV3): Observable<TransactionResponseV3> {
    return this.http.post<TransactionResponseV3>(`${this.API_URL}/transfer`, data).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Valide un destinataire avant transfert
   */
  validateRecipient(data: ValidateRecipientRequest): Observable<RecipientValidationResponse> {
    return this.http.post<RecipientValidationResponse>(`${this.API_URL}/validate-recipient`, data);
  }

  /**
   * Calcule les frais d'une transaction
   */
  calculateFees(data: CalculateFeesRequest): Observable<FeesCalculationResponse> {
    return this.http.post<FeesCalculationResponse>(`${this.API_URL}/calculate-fees`, data);
  }

  // ============================================
  // HISTORIQUE
  // ============================================

  /**
   * Récupère l'historique des transactions
   */
  getHistory(filters: HistoryFiltersV3 = {}): Observable<HistoryResponseV3> {
    let params = new HttpParams();
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params = params.set(key, String(value));
      }
    });

    return this.http.get<HistoryResponseV3>(`${this.API_URL}/history`, { params });
  }

  /**
   * Récupère une transaction par ID
   */
  getTransaction(id: string): Observable<{ success: boolean; data: { transaction: TransactionV3 } }> {
    return this.http.get<{ success: boolean; data: { transaction: TransactionV3 } }>(`${this.API_URL}/${id}`);
  }

  // ============================================
  // PIN
  // ============================================

  /**
   * Configure le PIN
   */
  setupPin(pin: string, confirmPin: string): Observable<{ success: boolean; message: string }> {
    return this.http.post<{ success: boolean; message: string }>(`${this.API_URL}/pin/setup`, {
      pin,
      confirmPin
    });
  }

  /**
   * Change le PIN
   */
  changePin(ancienPin: string, nouveauPin: string, confirmPin: string): Observable<{ success: boolean; message: string }> {
    return this.http.post<{ success: boolean; message: string }>(`${this.API_URL}/pin/change`, {
      ancienPin,
      nouveauPin,
      confirmPin
    });
  }

  /**
   * Vérifie le PIN
   */
  verifyPin(pin: string): Observable<{ success: boolean; data: { valide: boolean } }> {
    return this.http.post<{ success: boolean; data: { valide: boolean } }>(`${this.API_URL}/pin/verify`, { pin });
  }

  /**
   * Récupère le statut du PIN
   */
  getPinStatus(): Observable<PinStatusResponse> {
    return this.http.get<PinStatusResponse>(`${this.API_URL}/pin/status`);
  }

  // ============================================
  // VÉRIFICATION TÉLÉPHONE
  // ============================================

  /**
   * Demande une vérification de téléphone (envoie OTP)
   */
  requestPhoneVerification(): Observable<{ success: boolean; message: string }> {
    return this.http.post<{ success: boolean; message: string }>(`${this.API_URL}/phone/request-verification`, {});
  }

  /**
   * Vérifie le code OTP téléphone
   */
  verifyPhone(code: string): Observable<{ success: boolean; message: string }> {
    return this.http.post<{ success: boolean; message: string }>(`${this.API_URL}/phone/verify`, { code });
  }

  // ============================================
  // UTILITAIRES
  // ============================================

  /**
   * Valide un numéro de téléphone selon le format du pays
   */
  validatePhoneForCountry(phone: string, countryCode: string): { valid: boolean; message?: string } {
    const country = this.countriesCache().find(c => c.code === countryCode);
    if (!country) {
      return { valid: false, message: 'Pays non trouvé' };
    }

    const cleanPhone = phone.replace(/\s+/g, '').replace(country.indicatif, '');
    
    if (cleanPhone.length !== country.formatTelephone.longueur) {
      return { 
        valid: false, 
        message: `Le numéro doit contenir ${country.formatTelephone.longueur} chiffres (${country.formatTelephone.description})` 
      };
    }

    return { valid: true };
  }

  /**
   * Formate un numéro avec l'indicatif du pays
   */
  formatPhoneWithIndicatif(phone: string, countryCode: string): string {
    const country = this.countriesCache().find(c => c.code === countryCode);
    if (!country) return phone;

    const cleanPhone = phone.replace(/\s+/g, '').replace(/^\+/, '');
    if (cleanPhone.startsWith(country.indicatif.replace('+', ''))) {
      return `+${cleanPhone}`;
    }
    return `${country.indicatif}${cleanPhone}`;
  }

  /**
   * Gestion des erreurs
   */
  private handleError = (error: any) => {
    let errorMessage = 'Une erreur est survenue';
    
    if (error.error?.message) {
      errorMessage = error.error.message;
    } else if (error.message) {
      errorMessage = error.message;
    }

    return throwError(() => new Error(errorMessage));
  }
}
