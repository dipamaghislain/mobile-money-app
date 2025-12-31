import { Injectable, inject } from '@angular/core';
import { HttpRequest, HttpHandler, HttpEvent, HttpInterceptor, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';

// Messages d'erreur par code HTTP
const ERROR_MESSAGES: Record<number, string> = {
  400: 'Requête invalide. Vérifiez les données saisies.',
  401: 'Session expirée. Veuillez vous reconnecter.',
  403: 'Accès refusé. Vous n\'avez pas les permissions nécessaires.',
  404: 'Ressource non trouvée.',
  409: 'Conflit de données. L\'opération ne peut pas être effectuée.',
  422: 'Données de validation incorrectes.',
  429: 'Trop de requêtes. Veuillez patienter.',
  500: 'Erreur serveur. Veuillez réessayer plus tard.',
  502: 'Service temporairement indisponible.',
  503: 'Service en maintenance. Veuillez réessayer plus tard.',
  0: 'Impossible de contacter le serveur. Vérifiez votre connexion.'
};

@Injectable()
export class ErrorInterceptor implements HttpInterceptor {
  private router = inject(Router);
  private snackBar = inject(MatSnackBar);

  intercept(request: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    return next.handle(request).pipe(
      catchError((error: HttpErrorResponse) => {
        let errorMessage = 'Une erreur est survenue';
        let shouldRedirect = false;

        if (error.error instanceof ErrorEvent) {
          // Erreur côté client
          errorMessage = error.error.message || 'Erreur de connexion';
        } else {
          // Erreur côté serveur
          errorMessage = error.error?.message || ERROR_MESSAGES[error.status] || ERROR_MESSAGES[500];
          
          // Gestion spéciale pour 401 (session expirée)
          if (error.status === 401) {
            shouldRedirect = true;
            localStorage.removeItem('token');
            localStorage.removeItem('user');
          }
        }

        // Afficher le message d'erreur (sauf pour certaines routes silencieuses)
        const silentRoutes = ['/api/auth/me', '/api/notifications/count'];
        const isSilent = silentRoutes.some(route => request.url.includes(route));
        
        if (!isSilent) {
          this.snackBar.open(errorMessage, 'Fermer', {
            duration: 5000,
            horizontalPosition: 'center',
            verticalPosition: 'top',
            panelClass: error.status >= 500 ? ['error-snackbar'] : ['warning-snackbar']
          });
        }

        // Rediriger vers login si session expirée
        if (shouldRedirect) {
          this.router.navigate(['/auth/login']);
        }

        console.error(`[HTTP Error ${error.status}]`, errorMessage, request.url);
        return throwError(() => ({ message: errorMessage, status: error.status }));
      })
    );
  }
}