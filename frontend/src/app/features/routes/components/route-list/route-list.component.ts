import { Component, OnInit, ViewChild, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatChipsModule } from '@angular/material/chips';
import { MatMenuModule } from '@angular/material/menu';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';

import { MatPaginator, PageEvent } from '@angular/material/paginator';
import { RoutesService } from '../../../../core/services/routes.service';
import { Route } from '../../../../core/models/models';
import { RouteFormComponent } from '../route-form/route-form.component';
import { ConfirmDialogComponent } from '../../../../shared/components/confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-route-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    ReactiveFormsModule,
    FormsModule,
    MatSidenavModule,
    MatToolbarModule,
    MatListModule,
    MatIconModule,
    MatButtonModule,
    MatTooltipModule,
    MatCardModule,
    MatTableModule,
    MatPaginatorModule,
    MatProgressSpinnerModule,
    MatChipsModule,
    MatMenuModule,
    MatDialogModule,
    MatSnackBarModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule
  ],
  templateUrl: './route-list.component.html',
  styleUrls: ['./route-list.component.scss'],
})
export class RouteListComponent implements OnInit {
  private readonly routesService = inject(RoutesService);
  private readonly snackBar = inject(MatSnackBar);
  private readonly dialog = inject(MatDialog);

  @ViewChild(MatPaginator) paginator!: MatPaginator;

  routes: Route[] = [];
  total = 0;
  page = 1;
  limit = 10;
  loading = false;
  searchQuery = '';

  displayedColumns = ['nombre', 'origen', 'destino', 'capacidad', 'estado', 'acciones'];

  constructor() {}

  ngOnInit(): void {
    this.loadRoutes();
  }

  loadRoutes(): void {
    this.loading = true;
    this.routesService.getAll({ page: this.page, limit: this.limit, search: this.searchQuery || undefined }).subscribe({
      next: (res) => {
        this.routes = res.items;
        this.total = res.total;
        this.loading = false;
      },
      error: () => { this.loading = false; },
    });
  }

  onPageChange(event: PageEvent): void {
    this.page = event.pageIndex + 1;
    this.limit = event.pageSize;
    this.loadRoutes();
  }

  onSearch(): void {
    this.page = 1;
    this.loadRoutes();
  }

  createRoute(): void {
    const dialogRef = this.dialog.open(RouteFormComponent, {
      data: { id: null },
      width: '600px',
      panelClass: 'liquid-glass-dialog'
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) this.loadRoutes();
    });
  }

  editRoute(id: string): void {
    const dialogRef = this.dialog.open(RouteFormComponent, {
      data: { id },
      width: '600px',
      panelClass: 'liquid-glass-dialog'
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) this.loadRoutes();
    });
  }

  viewRoute(id: string): void {
    const dialogRef = this.dialog.open(RouteFormComponent, {
      data: { id },
      width: '600px',
      panelClass: 'liquid-glass-dialog'
    });
    // For now we just use the form, could create a detail modal later if needed
  }

  deleteRoute(route: Route, event: Event): void {
    event.stopPropagation();
    
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: {
        title: 'Eliminar Ruta',
        message: `¿Estás seguro que deseas eliminar la ruta "${route.nombre}"?`,
        confirmText: 'Eliminar',
        isDestructive: true
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.routesService.delete(route.id).subscribe({
          next: () => {
            this.snackBar.open('Ruta eliminada', 'OK', { duration: 3000 });
            this.loadRoutes();
          },
          error: (err) => {
            this.snackBar.open(err.error?.message || 'Error al eliminar', 'Cerrar', { duration: 4000 });
          },
        });
      }
    });
  }

  getStatusColor(estado: string): string {
    return { ACTIVA: 'primary', EN_SERVICIO: 'accent', INACTIVA: 'warn' }[estado] ?? '';
  }
}
