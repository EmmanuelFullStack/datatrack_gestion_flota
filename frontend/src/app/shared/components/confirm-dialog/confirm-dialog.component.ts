import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

export interface ConfirmDialogData {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  isDestructive?: boolean;
}

@Component({
  selector: 'app-confirm-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule, MatIconModule],
  template: `
    <div class="confirm-container">
      <div class="icon-header" [class.destructive]="data.isDestructive">
        <mat-icon>{{ data.isDestructive ? 'report_problem' : 'help_outline' }}</mat-icon>
      </div>
      
      <h2 mat-dialog-title>{{ data.title }}</h2>
      
      <mat-dialog-content>
        <p>{{ data.message }}</p>
        <p *ngIf="data.isDestructive" class="warning-text">
          <mat-icon>warning</mat-icon>
          Esta acción no se puede deshacer.
        </p>
      </mat-dialog-content>
      
      <mat-dialog-actions align="end">
        <button mat-button (click)="dialogRef.close(false)">{{ data.cancelText || 'Cancelar' }}</button>
        <button 
          mat-raised-button 
          [color]="data.isDestructive ? 'warn' : 'primary'" 
          (click)="dialogRef.close(true)">
          {{ data.confirmText || 'Confirmar' }}
        </button>
      </mat-dialog-actions>
    </div>
  `,
  styles: [`
    .confirm-container {
      padding: 8px;
    }
    .icon-header {
      width: 64px;
      height: 64px;
      border-radius: 50%;
      background: rgba(79, 70, 229, 0.1);
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto 16px;
      
      mat-icon {
        font-size: 32px;
        height: 32px;
        width: 32px;
        color: #4f46e5;
      }
      
      &.destructive {
        background: rgba(239, 68, 68, 0.1);
        mat-icon { color: #ef4444; }
      }
    }
    h2 {
      text-align: center;
      font-family: 'Outfit', sans-serif !important;
      font-weight: 700 !important;
      margin-bottom: 12px !important;
    }
    p {
      text-align: center;
      color: #4b5563;
      font-size: 15px;
      line-height: 1.5;
    }
    .warning-text {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
      color: #ef4444;
      font-weight: 600;
      font-size: 13px;
      margin-top: 16px;
      mat-icon { font-size: 18px; width: 18px; height: 18px; }
    }
    mat-dialog-actions {
      padding-top: 16px !important;
      gap: 12px;
    }
  `]
})
export class ConfirmDialogComponent {
  public readonly dialogRef = inject(MatDialogRef<ConfirmDialogComponent>);
  public readonly data = inject<ConfirmDialogData>(MAT_DIALOG_DATA);
}
