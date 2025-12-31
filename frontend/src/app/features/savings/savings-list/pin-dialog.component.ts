import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { FormsModule } from '@angular/forms';

@Component({
    selector: 'app-pin-dialog',
    standalone: true,
    imports: [CommonModule, MatDialogModule, MatButtonModule, MatFormFieldModule, MatInputModule, MatIconModule, FormsModule],
    template: `
    <div class="dialog-container">
      <div class="dialog-header">
        <div class="header-icon">
          <mat-icon>lock</mat-icon>
        </div>
        <h2>Confirmation PIN</h2>
        <p>Entrez votre code PIN pour valider</p>
      </div>
      
      <div class="dialog-body">
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Code PIN</mat-label>
          <input matInput [(ngModel)]="pin" [type]="showPin ? 'text' : 'password'" maxlength="6" pattern="[0-9]*" inputmode="numeric" (keyup.enter)="confirm()">
          <mat-icon matPrefix>dialpad</mat-icon>
          <button mat-icon-button matSuffix type="button" (click)="showPin = !showPin">
            <mat-icon>{{ showPin ? 'visibility_off' : 'visibility' }}</mat-icon>
          </button>
          <mat-hint>Entrez votre code à 4-6 chiffres</mat-hint>
        </mat-form-field>
      </div>
      
      <div class="dialog-actions">
        <button mat-button mat-dialog-close>Annuler</button>
        <button mat-raised-button color="primary" [disabled]="!pin || pin.length < 4" (click)="confirm()">
          <mat-icon>check</mat-icon>
          Confirmer
        </button>
      </div>
    </div>
  `,
    styles: [`
    :host {
      display: block;
    }
    ::ng-deep .mat-mdc-dialog-surface {
      background: white !important;
      border-radius: 16px !important;
    }
    .dialog-container {
      padding: 0;
      background: white;
      border-radius: 16px;
      overflow: hidden;
    }
    .dialog-header {
      text-align: center;
      padding: 24px 24px 16px;
      background: linear-gradient(135deg, #ff9500 0%, #ff6b00 100%);
      color: white;
    }
    .header-icon {
      width: 56px;
      height: 56px;
      margin: 0 auto 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: rgba(255,255,255,0.2);
      border-radius: 50%;
    }
    .header-icon mat-icon {
      font-size: 28px;
      width: 28px;
      height: 28px;
    }
    h2 {
      margin: 0;
      font-size: 1.25rem;
    }
    .dialog-header p {
      margin: 4px 0 0;
      opacity: 0.9;
      font-size: 0.9rem;
    }
    .dialog-body {
      padding: 0 24px;
    }
    .full-width { 
      width: 100%; 
    }
    .dialog-actions {
      display: flex;
      justify-content: flex-end;
      gap: 8px;
      padding: 16px 24px 24px;
    }
    .dialog-actions button[mat-raised-button] {
      display: flex;
      align-items: center;
      gap: 4px;
    }
  `]
})
export class PinDialogComponent {
    readonly dialogRef = inject(MatDialogRef<PinDialogComponent>);
    pin = '';
    showPin = false;

    confirm() {
        if (this.pin && this.pin.length >= 4) {
            this.dialogRef.close(this.pin);
        }
    }
}
