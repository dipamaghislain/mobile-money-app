// src/app/core/services/auth.service.ts
import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { Router } from '@angular/router';
import { isPlatformBrowser } from '@angular/common';
import { environment } from '../../../environments/environment';
import { User } from '../models';

export interface LoginRequest {
  email: string;
  motDePasse: string;
}

export interface RegisterRequest {
  nomComplet: string;
  telephone?: string;
  email: string;
  motDePasse: string;
  role?: 'client' | 'marchand';
  pin?: string;
}

export interface AuthResponse {
  message: string;
  user: User;
  token: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private currentUserSubject: BehaviorSubject<User | null>;
  public currentUser$: Observable<User | null>;

  private readonly API_URL = `${environment.apiUrl}/auth`;

  constructor(
    private http: HttpClient,
    private router: Router,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    let storedUser = null;
    if (isPlatformBrowser(this.platformId)) {
      const stored = localStorage.getItem(environment.userKey);
      if (stored) {
        try {
          storedUser = JSON.parse(stored);
        } catch (e) {
          console.error('Error parsing stored user', e);
        }
      }
    }
    this.currentUserSubject = new BehaviorSubject<User | null>(storedUser);
    this.currentUser$ = this.currentUserSubject.asObservable();
  }

  public get currentUserValue(): User | null {
    return this.currentUserSubject.value;
  }

  public get isAuthenticated(): boolean {
    return !!this.getToken();
  }

  public getToken(): string | null {
    if (isPlatformBrowser(this.platformId)) {
      return localStorage.getItem(environment.tokenKey);
    }
    return null;
  }

  login(credentials: LoginRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.API_URL}/login`, credentials)
      .pipe(
        tap(response => {
          if (response.token && response.user) {
            this.setSession(response);
          }
        }),
        catchError(this.handleError)
      );
  }

  register(userData: RegisterRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.API_URL}/register`, userData)
      .pipe(
        tap(response => {
          if (response.token && response.user) {
            this.setSession(response);
          }
        }),
        catchError(this.handleError)
      );
  }

  logout(): void {
    if (isPlatformBrowser(this.platformId)) {
      localStorage.removeItem(environment.tokenKey);
      localStorage.removeItem(environment.userKey);
      localStorage.removeItem(environment.refreshTokenKey);
    }

    this.currentUserSubject.next(null);
    this.router.navigate(['/auth/login']);
  }

  getCurrentUser(): Observable<User> {
    return this.http.get<User>(`${this.API_URL}/me`)
      .pipe(
        tap(user => {
          this.currentUserSubject.next(user);
          if (isPlatformBrowser(this.platformId)) {
            localStorage.setItem(environment.userKey, JSON.stringify(user));
          }
        }),
        catchError(this.handleError)
      );
  }

  private setSession(authData: AuthResponse): void {
    const { token, user } = authData;

    if (isPlatformBrowser(this.platformId)) {
      localStorage.setItem(environment.tokenKey, token);
      localStorage.setItem(environment.userKey, JSON.stringify(user));
    }

    this.currentUserSubject.next(user);
  }

  changePassword(ancienMotDePasse: string, nouveauMotDePasse: string): Observable<{ message: string }> {
    return this.http.put<{ message: string }>(`${this.API_URL}/change-password`, {
      ancienMotDePasse,
      nouveauMotDePasse
    }).pipe(
      catchError(this.handleError)
    );
  }

  updateProfile(payload: { nomComplet?: string; email?: string; adresse?: string; nomCommerce?: string }): Observable<{ message: string; user: User }> {
    return this.http.put<{ message: string; user: User }>(`${this.API_URL}/me`, payload).pipe(
      tap(res => {
        if (res.user) {
          this.currentUserSubject.next(res.user);
          if (isPlatformBrowser(this.platformId)) {
            localStorage.setItem(environment.userKey, JSON.stringify(res.user));
          }
        }
      }),
      catchError(this.handleError)
    );
  }

  forgotPassword(email: string): Observable<{ message: string; resetToken?: string; resetUrl?: string }> {
    return this.http.post<{ message: string; resetToken?: string; resetUrl?: string }>(
      `${this.API_URL}/forgot-password`,
      { email }
    ).pipe(
      catchError(this.handleError)
    );
  }

  resetPassword(token: string, nouveauMotDePasse: string): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.API_URL}/reset-password`, {
      token,
      nouveauMotDePasse
    }).pipe(
      catchError(this.handleError)
    );
  }

  private handleError(error: any): Observable<never> {
    let errorMessage = 'Une erreur est survenue';

    if (error.error instanceof ErrorEvent) {
      errorMessage = error.error.message;
    } else {
      errorMessage = error.error?.message || error.message || errorMessage;
    }

    return throwError(() => new Error(errorMessage));
  }
}