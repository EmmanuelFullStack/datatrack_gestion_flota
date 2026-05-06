import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AlarmsService, AlarmPosition } from '../../../../core/services/alarms.service';
import { Subscription, timer } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { Router } from '@angular/router';

@Component({
  selector: 'app-alarms',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatTableModule,
    MatIconModule,
    MatButtonModule,
    MatTooltipModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './alarms.component.html',
  styleUrl: './alarms.component.scss',
})
export class AlarmsComponent implements OnInit, OnDestroy {
  alarms: AlarmPosition[] = [];
  loading = true;
  private refreshSub?: Subscription;

  displayedColumns: string[] = ['unit', 'lastSeen', 'speed', 'reason', 'actions'];

  constructor(
    private readonly alarmsService: AlarmsService,
    private readonly router: Router
  ) {}

  ngOnInit(): void {
    this.refreshSub = timer(0, 30000) // Refresh every 30s
      .pipe(switchMap(() => this.alarmsService.getAlarms()))
      .subscribe({
        next: (data) => {
          this.alarms = data;
          this.loading = false;
        },
        error: () => {
          this.loading = false;
        },
      });
  }

  ngOnDestroy(): void {
    this.refreshSub?.unsubscribe();
  }

  viewOnMap(alarm: AlarmPosition): void {
    if (alarm.passengerId) {
      this.router.navigate(['/passengers/map'], { 
        queryParams: { focus: alarm.passengerId } 
      });
    }
  }
}
