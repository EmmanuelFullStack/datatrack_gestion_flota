import { Routes } from '@angular/router';

export const CLIENTS_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./components/client-list/client-list.component')
      .then(m => m.ClientListComponent),
    title: 'Clientes'
  }
];
