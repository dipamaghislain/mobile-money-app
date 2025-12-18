// frontend/src/app/core/guards/admin.guard.ts
import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

/**
 * Guard pour protéger les routes d'administration.
 * Vérifie que l'utilisateur est connecté ET a le rôle admin.
 */
export const adminGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  const user = authService.currentUserValue;

  // Vérifier si l'utilisateur est connecté
  if (!user) {
    router.navigate(['/auth/login'], {
      queryParams: { returnUrl: state.url }
    });
    return false;
  }

  // Vérifier si l'utilisateur est admin
  if (user.role !== 'admin') {
    // Rediriger vers le dashboard normal avec un message
    router.navigate(['/dashboard']);
    return false;
  }

  return true;
};

