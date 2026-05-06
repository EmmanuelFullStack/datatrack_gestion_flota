import { Component, OnInit, inject } from '@angular/core';
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
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatChipsModule } from '@angular/material/chips';
import { MatMenuModule } from '@angular/material/menu';
import { MatCardModule } from '@angular/material/card';

import { ClientsService } from '../../../../core/services/clients.service';
import { Client } from '../../../../core/models/models';
import { ClientFormComponent } from '../client-form/client-form.component';
import { ConfirmDialogComponent } from '../../../../shared/components/confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-client-list',
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
    MatTableModule,
    MatPaginatorModule,
    MatChipsModule,
    MatMenuModule,
    MatCardModule
  ],
  template: `
    <div class="page-container">
      <div class="page-header">
        <div>
          <h1><mat-icon>business</mat-icon> Clientes</h1>
          <p>Gestión de clientes y socios comerciales</p>
        </div>
        <button mat-raised-button color="primary" (click)="createClient()">
          <mat-icon>add</mat-icon> Nuevo Cliente
        </button>
      </div>
      <mat-card>
        <mat-card-content>
          <div class="filter-bar">
            <mat-form-field appearance="outline" class="search-field">
              <mat-label>Buscar cliente...</mat-label>
              <mat-icon matPrefix>search</mat-icon>
              <input matInput [(ngModel)]="searchQuery" (keyup.enter)="onSearch()" placeholder="Nombre o NIT">
            </mat-form-field>
            <button mat-stroked-button (click)="onSearch()">Buscar</button>
          </div>
          
          <div *ngIf="loading" style="display:flex;justify-content:center;padding:40px"><mat-spinner diameter="40"></mat-spinner></div>
          
          <table mat-table [dataSource]="clients" *ngIf="!loading" style="width:100%">
            <ng-container matColumnDef="nombre">
              <th mat-header-cell *matHeaderCellDef>Nombre</th>
              <td mat-cell *matCellDef="let c"><strong>{{ c.nombre }}</strong></td>
            </ng-container>
            <ng-container matColumnDef="documento">
              <th mat-header-cell *matHeaderCellDef>Documento</th>
              <td mat-cell *matCellDef="let c">{{ c.documento }}</td>
            </ng-container>
            <ng-container matColumnDef="telefono">
              <th mat-header-cell *matHeaderCellDef>Teléfono</th>
              <td mat-cell *matCellDef="let c">{{ c.telefono || '—' }}</td>
            </ng-container>
            <ng-container matColumnDef="email">
              <th mat-header-cell *matHeaderCellDef>Email</th>
              <td mat-cell *matCellDef="let c">{{ c.email || '—' }}</td>
            </ng-container>
            <ng-container matColumnDef="activo">
              <th mat-header-cell *matHeaderCellDef>Estado</th>
              <td mat-cell *matCellDef="let c">
                <mat-chip [color]="c.activo ? 'primary' : 'warn'" selected>{{ c.activo ? 'Activo' : 'Inactivo' }}</mat-chip>
              </td>
            </ng-container>
            <ng-container matColumnDef="acciones">
              <th mat-header-cell *matHeaderCellDef>Acciones</th>
              <td mat-cell *matCellDef="let c">
                <button mat-icon-button matTooltip="Editar" (click)="editClient(c.id)"><mat-icon>edit</mat-icon></button>
                <button mat-icon-button matTooltip="Eliminar" color="warn" (click)="deleteClient(c, $event)"><mat-icon>delete</mat-icon></button>
              </td>
            </ng-container>
            <tr mat-header-row *matHeaderRowDef="cols"></tr>
            <tr mat-row *matRowDef="let row; columns: cols;"></tr>
          </table>

          <div *ngIf="!loading && clients.length === 0" style="display:flex;flex-direction:column;align-items:center;padding:60px;color:#bdbdbd">
            <mat-icon style="font-size:64px;height:64px;width:64px">business_center</mat-icon>
            <p>No hay clientes registrados</p>
            <button mat-raised-button color="primary" (click)="createClient()">Crear primer cliente</button>
          </div>

          <mat-paginator [length]="total" [pageSize]="limit" [pageSizeOptions]="[5,10,25]" (page)="onPage($event)" showFirstLastButtons></mat-paginator>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .page-container { max-width: 1200px; margin: 0 auto; }
    .page-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 24px; }
    h1 { display: flex; align-items: center; gap: 8px; margin: 0; font-size: 22px; font-weight: 700; color: #1a237e; }
    .filter-bar { display: flex; align-items: center; gap: 12px; margin-bottom: 16px; }
    .search-field { flex: 1; max-width: 400px; }
  `],
})
export class ClientListComponent implements OnInit {
  private readonly clientsService = inject(ClientsService);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);

  clients: Client[] = [];
  total = 0;
  page = 1;
  limit = 10;
  loading = false;
  searchQuery = '';
  cols = ['nombre', 'documento', 'telefono', 'email', 'activo', 'acciones'];

  constructor() {}

  ngOnInit(): void { this.load(); }

  load(): void {
    this.loading = true;
    this.clientsService.getAll({ page: this.page, limit: this.limit, search: this.searchQuery || undefined }).subscribe({
      next: (r) => { this.clients = r.items; this.total = r.total; this.loading = false; },
      error: () => { this.loading = false; },
    });
  }

  onSearch(): void { this.page = 1; this.load(); }
  onPage(e: PageEvent): void { this.page = e.pageIndex + 1; this.limit = e.pageSize; this.load(); }

  createClient(): void {
    const dialogRef = this.dialog.open(ClientFormComponent, {
      data: { id: null },
      width: '600px',
      panelClass: 'liquid-glass-dialog'
    });
    dialogRef.afterClosed().subscribe(res => res && this.load());
  }

  editClient(id: string): void {
    const dialogRef = this.dialog.open(ClientFormComponent, {
      data: { id },
      width: '600px',
      panelClass: 'liquid-glass-dialog'
    });
    dialogRef.afterClosed().subscribe(res => res && this.load());
  }

  deleteClient(client: Client, e: Event): void {
    e.stopPropagation();
    
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: {
        title: 'Eliminar Cliente',
        message: `¿Estás seguro que deseas eliminar al cliente "${client.nombre}"?`,
        confirmText: 'Eliminar',
        isDestructive: true
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.clientsService.delete(client.id).subscribe({
          next: () => {
            this.snackBar.open('Cliente eliminado', 'OK', { duration: 3000 });
            this.load();
          },
          error: (err) => {
            this.snackBar.open(err.error?.message || 'Error al eliminar', 'Cerrar', { duration: 4000 });
          },
        });
      }
    });
  }
}
