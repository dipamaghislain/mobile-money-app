import { HttpInterceptorFn } from '@angular/common/http';
import { inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { environment } from '../../../environments/environment';

/**
 * Intercepteur HTTP fonctionnel moderne pour l'authentification.
 * Compatible SSR (Server-Side Rendering).
 * Ajoute automatiquement le token JWT aux requêtes.
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
    const platformId = inject(PLATFORM_ID);

    // Ne pas accéder à localStorage côté serveur (SSR)
    if (!isPlatformBrowser(platformId)) {
        return next(req);
    }

    const token = localStorage.getItem(environment.tokenKey);

    if (token) {
        const clonedRequest = req.clone({
            setHeaders: {
                Authorization: `Bearer ${token}`
            }
        });
        return next(clonedRequest);
    }

    return next(req);
};
