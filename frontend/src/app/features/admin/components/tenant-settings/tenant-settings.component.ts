import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatSelectModule } from '@angular/material/select';
import { AuthService } from '../../../../core/services/auth.service';
import { TenantService } from '../../../../core/services/tenant.service';
import { Tenant } from '../../../../core/models/models';

@Component({
  selector: 'app-tenant-settings',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatSnackBarModule,
    MatSelectModule,
  ],
  templateUrl: './tenant-settings.component.html',
  styleUrl: './tenant-settings.component.scss',
})
export class TenantSettingsComponent implements OnInit {
  form: FormGroup;
  loading = false;
  tenant: Tenant | null = null;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private tenantService: TenantService,
    private snackBar: MatSnackBar,
  ) {
    this.form = this.fb.group({
      nombre: ['', [Validators.required, Validators.maxLength(255)]],
      nit: [{ value: '', disabled: true }],
      ciudad: ['', [Validators.required, Validators.maxLength(100)]],
      logoUrl: ['', [Validators.maxLength(500)]],
      planSuscripcion: ['', [Validators.required]],
    });
  }

  ngOnInit(): void {
    const tenantId = this.authService.tenantId;
    if (tenantId) {
      this.loadTenant(tenantId);
    }
    
    // Solo Super Admin puede editar el plan
    if (!this.authService.isSuperAdmin) {
      this.form.get('planSuscripcion')?.disable();
    }
  }

  loadTenant(id: string): void {
    this.loading = true;
    this.tenantService.getById(id).subscribe({
      next: (t) => {
        this.tenant = t;
        this.form.patchValue(t);
        this.loading = false;
      },
      error: () => {
        this.snackBar.open('Error al cargar la información de la empresa', 'Cerrar', { duration: 3000 });
        this.loading = false;
      },
    });
  }

  onSubmit(): void {
    if (this.form.invalid || !this.tenant) return;
    this.loading = true;

    this.tenantService.update(this.tenant.id, this.form.getRawValue()).subscribe({
      next: () => {
        this.snackBar.open('Configuración actualizada correctamente', 'Cerrar', { duration: 3000 });
        this.loading = false;
      },
      error: (err) => {
        this.snackBar.open(err?.error?.message ?? 'Error al actualizar', 'Cerrar', { duration: 3000 });
        this.loading = false;
      },
    });
  }
}
