import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatChipsModule } from '@angular/material/chips';
import { MatMenuModule } from '@angular/material/menu';
import { MatSnackBarModule } from '@angular/material/snack-bar';

import { Subject, takeUntil, interval } from 'rxjs';
import { PassengersService } from '../../../../core/services/passengers.service';
import { RoutesService } from '../../../../core/services/routes.service';
import { ClientsService } from '../../../../core/services/clients.service';
import { WebsocketService } from '../../../../core/services/websocket.service';
import { DashboardStats, Passenger, Route, GpsUpdateEvent } from '../../../../core/models/models';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    ReactiveFormsModule,
    FormsModule,
    MatIconModule,
    MatButtonModule,
    MatTooltipModule,
    MatCardModule,
    MatTableModule,
    MatProgressSpinnerModule,
    MatChipsModule,
    MatMenuModule,
    MatSnackBarModule
  ],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss'],
})
export class DashboardComponent implements OnInit, OnDestroy {
  private readonly destroy$ = new Subject<void>();
  private readonly passengersService = inject(PassengersService);
  private readonly routesService = inject(RoutesService);
  private readonly clientsService = inject(ClientsService);
  private readonly wsService = inject(WebsocketService);

  stats: DashboardStats = { inTransit: 0, boarded: 0, arrived: 0, pending: 0 };
  activeRoutes: Route[] = [];
  inTransitPassengers: Passenger[] = [];
  clientsCount = 0;
  loading = true;
  lastGpsUpdate: Date | null = null;

  displayedColumns = ['nombre', 'documento', 'estado', 'ruta'];

  constructor() {}

  ngOnInit(): void {
    this.loadDashboard();
    this.subscribeToGpsUpdates();

    // Refresh every 60 seconds
    interval(60_000)
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.loadDashboard());
  }

  private loadDashboard(): void {
    this.passengersService.getDashboardStats().subscribe((s) => {
      this.stats = s;
      this.loading = false;
    });
    this.passengersService.getInTransit().subscribe((p) => (this.inTransitPassengers = p));
    this.routesService.getActive().subscribe((r) => (this.activeRoutes = r));
    this.clientsService.getAll({ limit: 1 }).subscribe((r) => (this.clientsCount = r.total));
  }

  private subscribeToGpsUpdates(): void {
    this.wsService.gpsUpdates
      .pipe(takeUntil(this.destroy$))
      .subscribe((events: GpsUpdateEvent[]) => {
        this.lastGpsUpdate = new Date();
        events.forEach((event) => {
          const passenger = this.inTransitPassengers.find((p) => p.id === event.passengerId);
          if (passenger) {
            Object.assign(passenger, { lat: event.lat, lon: event.lon, estado: event.estado });
          }
        });
      });
  }

  getStatusColor(estado: string): string {
    const colors: Record<string, string> = {
      EN_TRANSITO: 'primary',
      EMBARCADO: 'accent',
      LLEGO: 'warn',
      PENDIENTE: '',
    };
    return colors[estado] ?? '';
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
