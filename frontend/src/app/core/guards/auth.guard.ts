import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const authGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (!auth.isAuthenticated) return router.createUrlTree(['/auth/login']);

  // SUPER_ADMIN must pick a tenant before accessing the app
  if (auth.isSuperAdmin && !auth.hasTenantSelected) {
    return router.createUrlTree(['/admin/select-tenant']);
  }

  return true;
};

export const guestGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (!auth.isAuthenticated) return true;

  return router.createUrlTree(['/dashboard']);
};

export const superAdminGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (!auth.isAuthenticated) return router.createUrlTree(['/auth/login']);
  if (auth.isSuperAdmin) return true;

  return router.createUrlTree(['/dashboard']);
};
