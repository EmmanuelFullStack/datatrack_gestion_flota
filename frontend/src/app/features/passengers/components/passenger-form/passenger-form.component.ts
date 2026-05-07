import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ReactiveFormsModule, FormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';

import { Subject, switchMap, of, takeUntil } from 'rxjs';
import { PassengersService } from '../../../../core/services/passengers.service';
import { RoutesService } from '../../../../core/services/routes.service';
import { DatatrackService, DatatrackUnit } from '../../../../core/services/datatrack.service';
import { Route } from '../../../../core/models/models';
import { MatSelectChange } from '@angular/material/select';

interface PassengerFormDialogData {
  id: string | null;
}

@Component({
  selector: 'app-passenger-form',
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
  ],
  templateUrl: './passenger-form.component.html',
  styleUrls: ['./passenger-form.component.scss'],
})
export class PassengerFormComponent implements OnInit, OnDestroy {
  private readonly destroy$ = new Subject<void>();

  private readonly fb               = inject(FormBuilder);
  private readonly passengersService = inject(PassengersService);
  private readonly routesService    = inject(RoutesService);
  private readonly datatrkService   = inject(DatatrackService);
  private readonly snackBar         = inject(MatSnackBar);
  private readonly dialogRef        = inject(MatDialogRef<PassengerFormComponent>);
  public  readonly data             = inject<PassengerFormDialogData>(MAT_DIALOG_DATA);

  form: FormGroup;
  isEdit      = false;
  passengerId: string | null = null;
  loading      = false;
  saving       = false;
  loadingUnits = false;
  routes: Route[]          = [];
  units:  DatatrackUnit[]  = [];

  private originalRouteId: string | null = null;

  readonly estadoOptions = ['PENDIENTE', 'EMBARCADO', 'EN_TRANSITO', 'LLEGO'];

  constructor() {
    this.form = this.fb.group({
      nombre:              ['', [Validators.required, Validators.maxLength(255)]],
      documento:           ['', [Validators.required, Validators.maxLength(50)]],
      telefono:            ['', [Validators.maxLength(30)]],
      deviceIdDatatrack:   [null],
      deviceNameDatatrack: [null],
      routeId:             [null],
      estado:              ['PENDIENTE'],
    });
  }

  ngOnInit(): void {
    this.passengerId = this.data?.id ?? null;
    this.isEdit      = !!this.passengerId;

    this.routesService.getActive()
      .pipe(takeUntil(this.destroy$))
      .subscribe((r) => (this.routes = r));

    this.loadingUnits = true;
    this.datatrkService.getUnits()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (units) => { this.units = units; this.loadingUnits = false; },
        error: ()      => { this.loadingUnits = false; },
      });

    if (this.isEdit && this.passengerId) {
      this.loading = true;
      this.passengersService
        .getById(this.passengerId)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (p) => {
            this.form.patchValue(p);
            this.originalRouteId = p.routeId;
            this.loading = false;
          },
          error: () => { this.loading = false; this.dialogRef.close(); },
        });
    }
  }

  onUnitSelected(event: MatSelectChange): void {
    const unit = this.units.find((u) => String(u.id) === event.value);
    this.form.patchValue({ deviceNameDatatrack: unit?.name ?? null });
  }

  onSubmit(): void {
    if (this.form.invalid || this.saving) return;
    this.saving = true;

    const { nombre, documento, telefono, estado, deviceIdDatatrack, deviceNameDatatrack, routeId } = this.form.value as {
      nombre: string; documento: string; telefono: string;
      estado: 'PENDIENTE' | 'EMBARCADO' | 'EN_TRANSITO' | 'LLEGO';
      deviceIdDatatrack: string | null; deviceNameDatatrack: string | null;
      routeId: string | null;
    };

    if (!this.isEdit || !this.passengerId) {
      this.passengersService
        .create(this.form.value)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => { this.snackBar.open('Pasajero creado', 'OK', { duration: 3000 }); this.dialogRef.close(true); },
          error: (err: { error?: { message?: string } }) => {
            this.saving = false;
            this.snackBar.open(err.error?.message ?? 'Error al guardar', 'Cerrar', { duration: 4000 });
          },
        });
      return;
    }

    this.passengersService
      .update(this.passengerId, { nombre, documento, telefono, estado, deviceIdDatatrack, deviceNameDatatrack })
      .pipe(
        switchMap(() => {
          const newRouteId: string | null = routeId || null;
          if (newRouteId === this.originalRouteId) return of(null);
          if (newRouteId) return this.passengersService.assignToRoute(this.passengerId!, newRouteId);
          return this.passengersService.unassign(this.passengerId!);
        }),
        takeUntil(this.destroy$),
      )
      .subscribe({
        next: () => { this.snackBar.open('Pasajero actualizado', 'OK', { duration: 3000 }); this.dialogRef.close(true); },
        error: (err: { error?: { message?: string } }) => {
          this.saving = false;
          this.snackBar.open(err.error?.message ?? 'Error al guardar', 'Cerrar', { duration: 4000 });
        },
      });
  }

  cancel(): void {
    this.dialogRef.close();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
