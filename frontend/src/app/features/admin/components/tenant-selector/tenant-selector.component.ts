import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatChipsModule } from '@angular/material/chips';
import { AuthService } from '../../../../core/services/auth.service';
import { Tenant } from '../../../../core/models/models';

@Component({
  selector: 'app-tenant-selector',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatChipsModule,
  ],
  templateUrl: './tenant-selector.component.html',
  styleUrl: './tenant-selector.component.scss',
})
export class TenantSelectorComponent implements OnInit {
  tenants: Pick<Tenant, 'id' | 'nombre' | 'nit' | 'ciudad' | 'estado'>[] = [];
  loadingId: string | null = null;
  error = '';

  constructor(
    private authService: AuthService,
    private router: Router,
  ) {}

  ngOnInit(): void {
    this.tenants = this.authService.availableTenants;
    if (!this.authService.isSuperAdmin) {
      void this.router.navigate(['/dashboard']);
    }
  }

  select(tenantId: string): void {
    this.loadingId = tenantId;
    this.error = '';
    this.authService.selectTenant(tenantId).subscribe({
      next: () => {
        this.loadingId = null;
        void this.router.navigate(['/dashboard']);
      },
      error: (err) => {
        this.loadingId = null;
        this.error = err?.error?.message ?? 'Error al seleccionar tenant';
      },
    });
  }

  logout(): void {
    this.authService.logout();
  }
}
