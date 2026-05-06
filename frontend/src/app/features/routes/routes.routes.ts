// src/app/features/routes/routes.routes.ts
import { Routes } from '@angular/router';

export const ROUTES_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./components/route-list/route-list.component')
      .then(m => m.RouteListComponent),
    title: 'Rutas'
  },
  {
    path: ':id',
    loadComponent: () => import('./components/route-detail/route-detail.component')
      .then(m => m.RouteDetailComponent),
    title: 'Detalle de Ruta'
  }
];
