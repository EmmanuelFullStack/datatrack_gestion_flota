// src/app/features/auth/auth.routes.ts
import { Routes } from '@angular/router';

export const AUTH_ROUTES: Routes = [
  {
    path: 'login',
    loadComponent: () => import('./components/login/login.component')
      .then(m => m.LoginComponent),
    title: 'Iniciar Sesión'
  },
  {
    path: 'register',
    loadComponent: () => import('./components/register/register.component')
      .then(m => m.RegisterComponent),
    title: 'Registrarse'
  },
  {
    path: 'admin-login',
    loadComponent: () => import('./components/admin-login/admin-login.component')
      .then(m => m.AdminLoginComponent),
    title: 'Acceso Super Admin'
  },
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full'
  }
];
