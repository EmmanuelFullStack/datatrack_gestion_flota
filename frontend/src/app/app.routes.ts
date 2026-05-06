// src/app/app.routes.ts
import { Routes } from '@angular/router';
import { authGuard, superAdminGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  // ====================== AUTH (Público) ======================
  {
    path: 'auth',
    loadChildren: () => import('./features/auth/auth.routes')
      .then(m => m.AUTH_ROUTES)
  },

  // ====================== ADMIN (Super Admin only) ======================
  {
    path: 'admin/select-tenant',
    canActivate: [superAdminGuard],
    loadComponent: () => import('./features/admin/components/tenant-selector/tenant-selector.component')
      .then(m => m.TenantSelectorComponent),
    title: 'Seleccionar Empresa'
  },

  // ====================== APP (Protegido) ======================
  {
    path: '',
    canActivate: [authGuard],
    loadComponent: () => import('./shared/components/layout/layout.component')
      .then(m => m.LayoutComponent),
    children: [
      {
        path: 'dashboard',
        loadComponent: () => import('./features/dashboard/components/dashboard/dashboard.component')
          .then(m => m.DashboardComponent),
        title: 'Dashboard - DataTrack',
        data: { breadcrumb: 'Dashboard' }
      },

      // Passengers
      {
        path: 'passengers',
        loadChildren: () => import('./features/passengers/passengers.routes')
          .then(m => m.PASSENGERS_ROUTES),
        title: 'Pasajeros',
        data: { breadcrumb: 'Pasajeros' }
      },

      // Routes / Rutas
      {
        path: 'routes',
        loadChildren: () => import('./features/routes/routes.routes')
          .then(m => m.ROUTES_ROUTES),
        title: 'Rutas',
        data: { breadcrumb: 'Rutas' }
      },

      // Clients
      {
        path: 'clients',
        loadChildren: () => import('./features/clients/clients.routes')
          .then(m => m.CLIENTS_ROUTES),
        title: 'Clientes',
        data: { breadcrumb: 'Clientes' }
      },

      // Tenant Settings
      {
        path: 'settings',
        loadComponent: () => import('./features/admin/components/tenant-settings/tenant-settings.component')
          .then(m => m.TenantSettingsComponent),
        title: 'Configuración de Empresa',
        data: { breadcrumb: 'Configuración' }
      },

      // Alarms
      {
        path: 'alarms',
        loadComponent: () => import('./features/alarms/components/alarms/alarms.component')
          .then(m => m.AlarmsComponent),
        title: 'Alarmas de Posición',
        data: { breadcrumb: 'Alarmas' }
      },

      // Redirecciones
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full'
      }
    ]
  },

  // Fallback
  {
    path: '**',
    redirectTo: 'auth/login'
  }
];
