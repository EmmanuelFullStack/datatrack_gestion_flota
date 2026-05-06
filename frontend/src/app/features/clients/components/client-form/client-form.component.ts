import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';

import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ClientsService } from '../../../../core/services/clients.service';

@Component({
  selector: 'app-client-form',
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
    MatInputModule
  ],
  template: `
    <h2 mat-dialog-title>{{ isEdit ? 'Editar Cliente' : 'Nuevo Cliente' }}</h2>
    <mat-dialog-content>
      <form [formGroup]="form" style="padding-top: 8px;">
        <div style="display:flex;flex-direction:column;gap:8px">
          <div style="display:flex;gap:16px">
            <mat-form-field appearance="outline" style="flex:1">
              <mat-label>Nombre / Razón Social</mat-label>
              <input matInput formControlName="nombre" placeholder="Empresa XYZ S.A.S">
              <mat-error>Requerido</mat-error>
            </mat-form-field>
            <mat-form-field appearance="outline" style="flex:1">
              <mat-label>Documento / NIT</mat-label>
              <input matInput formControlName="documento" placeholder="900987654-3">
              <mat-error>Requerido</mat-error>
            </mat-form-field>
          </div>
          <div style="display:flex;gap:16px">
            <mat-form-field appearance="outline" style="flex:1">
              <mat-label>Teléfono</mat-label>
              <mat-icon matPrefix>phone</mat-icon>
              <input matInput formControlName="telefono">
            </mat-form-field>
            <mat-form-field appearance="outline" style="flex:1">
              <mat-label>Email de Contacto</mat-label>
              <mat-icon matPrefix>email</mat-icon>
              <input matInput type="email" formControlName="email">
              <mat-error>Email inválido</mat-error>
            </mat-form-field>
          </div>
        </div>
      </form>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button (click)="cancel()">Cancelar</button>
      <button mat-raised-button color="primary" (click)="onSubmit()" [disabled]="saving || form.invalid">
        <mat-spinner *ngIf="saving" diameter="20" style="display:inline-block; margin-right: 8px;"></mat-spinner>
        <span>{{ isEdit ? 'Actualizar' : 'Guardar' }}</span>
      </button>
    </mat-dialog-actions>
  `,
})
export class ClientFormComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly clientsService = inject(ClientsService);
  private readonly snackBar = inject(MatSnackBar);
  private readonly dialogRef = inject(MatDialogRef<ClientFormComponent>);
  public data = inject<{ id: string | null }>(MAT_DIALOG_DATA);

  form: FormGroup;
  isEdit = false;
  clientId: string | null = null;
  saving = false;

  constructor() {
    this.form = this.fb.group({
      nombre: ['', [Validators.required]],
      documento: ['', [Validators.required]],
      telefono: [''],
      email: ['', [Validators.email]],
    });
  }

  ngOnInit(): void {
    this.clientId = this.data?.id || null;
    this.isEdit = !!this.clientId;
    if (this.isEdit && this.clientId) {
      this.clientsService.getById(this.clientId).subscribe((c) => this.form.patchValue(c));
    }
  }

  onSubmit(): void {
    if (this.form.invalid) return;
    this.saving = true;
    const obs = this.isEdit && this.clientId
      ? this.clientsService.update(this.clientId, this.form.value)
      : this.clientsService.create(this.form.value);
    obs.subscribe({
      next: () => {
        this.snackBar.open(this.isEdit ? 'Cliente actualizado' : 'Cliente creado', 'OK', { duration: 3000 });
        this.dialogRef.close(true);
      },
      error: (err) => {
        this.saving = false;
        this.snackBar.open(err.error?.message || 'Error', 'Cerrar', { duration: 4000 });
      },
    });
  }

  cancel(): void {
    this.dialogRef.close();
  }
}
