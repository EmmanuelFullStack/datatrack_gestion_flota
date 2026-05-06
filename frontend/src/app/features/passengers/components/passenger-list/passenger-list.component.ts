import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatChipsModule } from '@angular/material/chips';
import { MatMenuModule } from '@angular/material/menu';
import { MatCardModule } from '@angular/material/card';

import { Subject, debounceTime, distinctUntilChanged, takeUntil } from 'rxjs';
import { PassengersService } from '../../../../core/services/passengers.service';
import { RoutesService } from '../../../../core/services/routes.service';
import { Passenger, Route } from '../../../../core/models/models';
import { PassengerFormComponent } from '../passenger-form/passenger-form.component';
import { ConfirmDialogComponent } from '../../../../shared/components/confirm-dialog/confirm-dialog.component';

const STATUS_COLOR_MAP: Record<string, string> = {
  EN_TRANSITO: 'primary',
  EMBARCADO:   'accent',
  LLEGO:       'warn',
  PENDIENTE:   '',
};

@Component({
  selector: 'app-passenger-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    ReactiveFormsModule,
    FormsModule,
    MatIconModule,
    MatButtonModule,
    MatTooltipModule,
    MatProgressSpinnerModule,
    MatDialogModule,
    MatSnackBarModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatTableModule,
    MatPaginatorModule,
    MatChipsModule,
    MatMenuModule,
    MatCardModule,
  ],
  templateUrl: './passenger-list.component.html',
  styleUrls: ['./passenger-list.component.scss'],
})
export class PassengerListComponent implements OnInit, OnDestroy {
  private readonly destroy$     = new Subject<void>();
  private readonly searchInput$ = new Subject<string>();

  private readonly passengersService = inject(PassengersService);
  private readonly routesService     = inject(RoutesService);
  private readonly snackBar          = inject(MatSnackBar);
  private readonly dialog            = inject(MatDialog);

  passengers: Passenger[] = [];
  routes:     Route[]     = [];
  total    = 0;
  page     = 1;
  limit    = 10;
  loading  = false;

  searchQuery   = '';
  filterEstado  = '';
  filterRouteId = '';

  readonly estadoOptions   = ['PENDIENTE', 'EMBARCADO', 'EN_TRANSITO', 'LLEGO'];
  readonly displayedColumns = ['nombre', 'documento', 'telefono', 'estado', 'gps', 'acciones'];

  ngOnInit(): void {
    this.loadPassengers();

    this.routesService.getActive()
      .pipe(takeUntil(this.destroy$))
      .subscribe((r) => (this.routes = r));

    // Debounce search — avoids an API call per keystroke
    this.searchInput$
      .pipe(debounceTime(350), distinctUntilChanged(), takeUntil(this.destroy$))
      .subscribe(() => {
        this.page = 1;
        this.loadPassengers();
      });
  }

  onSearchChange(value: string): void {
    this.searchQuery = value;
    this.searchInput$.next(value);
  }

  loadPassengers(): void {
    this.loading = true;
    this.passengersService
      .getAll({
        page:    this.page,
        limit:   this.limit,
        search:  this.searchQuery  || undefined,
        estado:  this.filterEstado || undefined,
        routeId: this.filterRouteId || undefined,
      })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          this.passengers = res.items;
          this.total      = res.total;
          this.loading    = false;
        },
        error: () => { this.loading = false; },
      });
  }

  onPageChange(event: PageEvent): void {
    this.page  = event.pageIndex + 1;
    this.limit = event.pageSize;
    this.loadPassengers();
  }

  onFilter(): void {
    this.page = 1;
    this.loadPassengers();
  }

  getStatusColor(estado: string): string {
    return STATUS_COLOR_MAP[estado] ?? '';
  }

  createPassenger(): void {
    this.dialog
      .open(PassengerFormComponent, { data: { id: null }, width: '600px', panelClass: 'liquid-glass-dialog' })
      .afterClosed()
      .pipe(takeUntil(this.destroy$))
      .subscribe((result) => { if (result) this.loadPassengers(); });
  }

  editPassenger(id: string): void {
    this.dialog
      .open(PassengerFormComponent, { data: { id }, width: '600px', panelClass: 'liquid-glass-dialog' })
      .afterClosed()
      .pipe(takeUntil(this.destroy$))
      .subscribe((result) => { if (result) this.loadPassengers(); });
  }

  deletePassenger(passenger: Passenger, event: Event): void {
    event.stopPropagation();

    this.dialog
      .open(ConfirmDialogComponent, {
        width: '400px',
        data: {
          title:       'Eliminar Pasajero',
          message:     `¿Estás seguro que deseas eliminar al pasajero "${passenger.nombre}"?`,
          confirmText: 'Eliminar',
          isDestructive: true,
        },
      })
      .afterClosed()
      .pipe(takeUntil(this.destroy$))
      .subscribe((confirmed) => {
        if (!confirmed) return;
        this.passengersService
          .delete(passenger.id)
          .pipe(takeUntil(this.destroy$))
          .subscribe({
            next: () => {
              this.snackBar.open('Pasajero eliminado', 'OK', { duration: 3000 });
              this.loadPassengers();
            },
            error: (err: { error?: { message?: string } }) => {
              this.snackBar.open(err.error?.message ?? 'Error al eliminar', 'Cerrar', { duration: 4000 });
            },
          });
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
