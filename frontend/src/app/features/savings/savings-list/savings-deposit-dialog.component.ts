// src/app/features/savings/savings-list/savings-deposit-dialog.component.ts
import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { SavingsGoal } from '../../../core/services/savings.service';
import { CurrencyXOFPipe } from '../../../shared/pipes/currency-xof.pipe';

@Component({
  selector: 'app-savings-deposit-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    CurrencyXOFPipe
  ],
  template: `
    <div class="dialog-container">
      <div class="dialog-header">
        <div class="header-icon deposit">
          <mat-icon>add</mat-icon>
        </div>
        <h2>Épargner</h2>
        <p class="goal-name">{{ data.goal.nom }}</p>
      </div>

      <div class="dialog-body">
        <div class="balance-info">
          <span class="label">Solde disponible</span>
          <span class="value">{{ data.maxAmount | currencyXOF }}</span>
        </div>

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Montant à épargner</mat-label>
          <input matInput type="number" [(ngModel)]="amount" [max]="data.maxAmount" min="100" placeholder="0">
          <span matTextPrefix>FCFA&nbsp;</span>
        </mat-form-field>

        <div class="quick-amounts">
          @for (q of quickAmounts; track q) {
            <button type="button" class="quick-btn" (click)="setAmount(q)" [disabled]="q > data.maxAmount">
              {{ q | number }}
            </button>
          }
        </div>

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Code PIN</mat-label>
          <input matInput type="password" [(ngModel)]="pin" maxlength="6" placeholder="****">
          <mat-icon matSuffix>lock</mat-icon>
        </mat-form-field>
      </div>

      <div class="dialog-actions">
        <button mat-button (click)="cancel()">Annuler</button>
        <button mat-raised-button color="primary" 
                [disabled]="!isValid()" 
                (click)="confirm()">
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
    .goal-name {
      margin: 4px 0 0;
      opacity: 0.9;
      font-size: 0.9rem;
    }
    .dialog-body {
      padding: 0 24px;
    }
    .balance-info {
      display: flex;
      justify-content: space-between;
      padding: 12px 16px;
      background: linear-gradient(135deg, rgba(255, 149, 0, 0.08), rgba(255, 149, 0, 0.04));
      border: 1px solid rgba(255, 149, 0, 0.2);
      border-radius: 12px;
      margin-bottom: 16px;
    }
    .balance-info .label {
      color: #666;
    }
    .balance-info .value {
      font-weight: 600;
      color: #ff9500;
    }
    .full-width {
      width: 100%;
    }
    .quick-amounts {
      display: flex;
      gap: 8px;
      margin-bottom: 16px;
      flex-wrap: wrap;
    }
    .quick-btn {
      flex: 1;
      min-width: 70px;
      padding: 8px;
      border: 1px solid #ddd;
      border-radius: 8px;
      background: white;
      cursor: pointer;
      transition: all 0.2s;
    }
    .quick-btn:hover:not(:disabled) {
      border-color: #ff9500;
      background: #fff5e6;
    }
    .quick-btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
    .dialog-actions {
      display: flex;
      justify-content: flex-end;
      gap: 8px;
      padding: 16px 24px 24px;
    }
  `]
})
export class SavingsDepositDialog {
  private dialogRef = inject(MatDialogRef<SavingsDepositDialog>);
  data = inject<{ goal: SavingsGoal; maxAmount: number }>(MAT_DIALOG_DATA);

  amount: number = 0;
  pin: string = '';
  quickAmounts = [1000, 5000, 10000, 25000];

  setAmount(value: number): void {
    this.amount = Math.min(value, this.data.maxAmount);
  }

  isValid(): boolean {
    return this.amount > 0 && 
           this.amount <= this.data.maxAmount && 
           this.pin.length >= 4;
  }

  cancel(): void {
    this.dialogRef.close();
  }

  confirm(): void {
    if (this.isValid()) {
      this.dialogRef.close({ amount: this.amount, pin: this.pin });
    }
  }
}
