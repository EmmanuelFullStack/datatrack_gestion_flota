import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatChipsModule } from '@angular/material/chips';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';

import { RoutesService } from '../../../../core/services/routes.service';
import { PassengersService } from '../../../../core/services/passengers.service';
import { Route, Passenger } from '../../../../core/models/models';
import { ConfirmDialogComponent } from '../../../../shared/components/confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-route-detail',
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
    MatSnackBarModule,
    MatDialogModule
  ],
  templateUrl: './route-detail.component.html',
  styleUrls: ['./route-detail.component.scss'],
})
export class RouteDetailComponent implements OnInit {
  private readonly routesService = inject(RoutesService);
  private readonly passengersService = inject(PassengersService);
  private readonly activatedRoute = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly snackBar = inject(MatSnackBar);
  private readonly dialog = inject(MatDialog);

  route: Route | null = null;
  passengers: Passenger[] = [];
  loading = true;
  locatorUrl: string | null = null;
  creatingLocator = false;

  displayedColumns = ['nombre', 'documento', 'estado', 'gps', 'acciones'];

  constructor() {}

  ngOnInit(): void {
    const id = this.activatedRoute.snapshot.paramMap.get('id')!;
    this.routesService.getById(id).subscribe({
      next: (r) => {
        this.route = r;
        this.loading = false;
        this.loadPassengers(id);
      },
      error: () => {
        this.loading = false;
        void this.router.navigate(['/routes']);
      },
    });
  }

  loadPassengers(routeId: string): void {
    this.passengersService.getAll({ routeId, limit: 100 }).subscribe((res) => {
      this.passengers = res.items;
    });
  }

  createLocator(): void {
    if (!this.route) return;
    this.creatingLocator = true;
    this.routesService.createLocator(this.route.id).subscribe({
      next: (res) => {
        this.locatorUrl = res.locatorUrl;
        this.creatingLocator = false;
        if (res.locatorUrl) {
          this.snackBar.open('Locator creado correctamente', 'Abrir', { duration: 5000 })
            .onAction().subscribe(() => window.open(res.locatorUrl, '_blank'));
        } else {
          this.snackBar.open('No hay pasajeros con GPS asignado en esta ruta', 'OK', { duration: 4000 });
        }
      },
      error: () => {
        this.creatingLocator = false;
        this.snackBar.open('Error al crear locator', 'Cerrar', { duration: 4000 });
      },
    });
  }

  unassignPassenger(passenger: Passenger): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: {
        title: 'Desasignar Pasajero',
        message: `¿Estás seguro que deseas quitar a "${passenger.nombre}" de esta ruta?`,
        confirmText: 'Desasignar',
        isDestructive: false
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.passengersService.unassign(passenger.id).subscribe({
          next: () => {
            this.snackBar.open(`${passenger.nombre} desasignado de la ruta`, 'OK', { duration: 3000 });
            this.loadPassengers(this.route!.id);
          },
        });
      }
    });
  }
}
