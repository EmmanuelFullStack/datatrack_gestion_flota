import { Routes } from '@angular/router';

export const PASSENGERS_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./components/passenger-list/passenger-list.component')
      .then(m => m.PassengerListComponent),
    title: 'Pasajeros'
  },
  {
    path: 'map',
    loadComponent: () => import('./components/passenger-map/passenger-map.component')
      .then(m => m.PassengerMapComponent),
    title: 'Mapa de Pasajeros'
  }
];
