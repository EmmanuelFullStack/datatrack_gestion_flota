// src/app/features/auth/components/register/register.component.ts
import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

import { AuthService } from '../../../../core/services/auth.service';

// Material Modules
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    RouterModule
  ],
  templateUrl: './register.component.html',
  styleUrl: './register.component.scss'
})
export class RegisterComponent {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);
  private snackBar = inject(MatSnackBar);

  form: FormGroup;
  loading = false;
  hidePassword = true;

  constructor() {
    this.form = this.fb.group({
      empresaNombre: ['', [Validators.required, Validators.maxLength(255)]],
      empresaNit: ['', [Validators.required, Validators.maxLength(50)]],
      empresaCiudad: ['', [Validators.required, Validators.maxLength(100)]],
      nombre: ['', [Validators.required, Validators.maxLength(255)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(8)]],
    });
  }

  onSubmit(): void {
    if (this.form.invalid) return;

    this.loading = true;

    this.authService.register(this.form.value).subscribe({
      next: () => {
        this.snackBar.open('Empresa registrada exitosamente', 'OK', { 
          duration: 3000 
        });
        void this.router.navigate(['/dashboard']);
      },
      error: (err) => {
        this.loading = false;
        const message = err.error?.message || 'Error al registrar la empresa';
        this.snackBar.open(message, 'Cerrar', { 
          duration: 5000, 
          panelClass: ['error-snack'] 
        });
      },
    });
  }
}
