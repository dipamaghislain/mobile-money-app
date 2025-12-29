import { Component, EventEmitter, Input, Output, signal } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';

@Component({
    selector: 'app-transaction-form',
    standalone: true,
    imports: [
        CommonModule,
        MatCardModule,
        MatButtonModule,
        MatIconModule,
        MatProgressSpinnerModule,
        RouterModule,
        FormsModule,
        CurrencyPipe
    ],
    template: `
    <div class="transaction-page">
      <div class="header-bg" [style.background]="backgroundGradient">
        <div class="header-content">
          <button mat-icon-button *ngIf="backUrl" [routerLink]="backUrl" class="back-btn">
            <mat-icon>arrow_back</mat-icon>
          </button>
          <h1>{{ title }}</h1>
          <p class="subtitle">{{ subtitle }}</p>
          
          <div class="balance-row">
            <div class="balance-item">
              <span class="label">Solde Compte</span>
              <span class="amount">{{ (balance | currency:'XOF':'symbol':'1.0-0') || '...' }}</span>
            </div>
          </div>
        </div>
      </div>

      <div class="content-container">
        <mat-card class="form-card">
          <mat-card-header>
             <mat-card-title>Montant de la transaction</mat-card-title>
          </mat-card-header>
          <mat-card-content>
            <div class="input-section">
              <label>Montant (FCFA)</label>
              <div class="amount-input-wrapper">
                <input type="number" [(ngModel)]="amount" placeholder="0" class="large-input">
                <span class="currency">FCFA</span>
              </div>
            </div>

            <div class="chips-grid">
              @for (chip of chips; track chip) {
                <button class="chip" (click)="setAmount(chip)" [class.active]="amount === chip">
                  {{ chip | number:'1.0-0' }}
                </button>
              }
            </div>
          </mat-card-content>
        </mat-card>

        <div class="actions">
          <button mat-raised-button color="primary" class="confirm-btn" 
                  [disabled]="!amount || amount <= 0 || loading"
                  (click)="onSubmit()">
            @if (loading) {
              <mat-spinner diameter="24"></mat-spinner>
            } @else {
              Confirmer
            }
          </button>
        </div>
      </div>
    </div>
  `,
    styles: [`
    .transaction-page {
      min-height: 100vh;
      background: #f5f5f5;
      position: relative;
    }

    .header-bg {
      color: white;
      padding: 24px 24px 100px;
      border-radius: 0 0 24px 24px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.1);

      .header-content {
        max-width: 500px;
        margin: 0 auto;
        text-align: center;
        position: relative;

        .back-btn {
          position: absolute;
          left: 0;
          top: 0;
          color: white;
        }

        h1 { margin: 0; font-size: 24px; font-weight: 600; }
        .subtitle { margin: 4px 0 32px; opacity: 0.9; font-size: 14px; }

        .balance-row {
            background: rgba(255, 255, 255, 0.15);
            border-radius: 16px;
            padding: 16px;
            backdrop-filter: blur(5px);
            display: inline-block;
            min-width: 200px;

            .balance-item {
                display: flex;
                flex-direction: column;
                gap: 4px;
                .label { font-size: 12px; opacity: 0.9; text-transform: uppercase; }
                .amount { font-size: 24px; font-weight: 700; text-shadow: 0 2px 4px rgba(0,0,0,0.1); }
            }
        }
      }
    }

    .content-container {
      max-width: 500px;
      margin: -80px auto 0;
      padding: 0 16px;
      position: relative;
      z-index: 2;
    }

    .form-card {
      border-radius: 20px;
      box-shadow: 0 8px 24px rgba(0,0,0,0.08);
      background: white;
      margin-bottom: 32px;
      overflow: hidden;

      mat-card-header { padding: 24px 24px 0; margin-bottom: 16px; mat-card-title { font-size:18px; font-weight:600; } }
      mat-card-content { padding: 0 24px 32px; }
    }

    .input-section {
      margin-bottom: 32px;
      label { font-weight: 600; color: #666; display: block; margin-bottom: 12px; font-size: 14px; }
      .amount-input-wrapper {
        background: #f9f9f9;
        border-radius: 12px;
        padding: 16px;
        display: flex; align-items: center;
        border: 2px solid transparent; transition: border-color 0.2s;
        &:focus-within { border-color: var(--primary-color, #ff9500); background: white; }
        .large-input { border: none; background: none; font-size: 28px; font-weight: 700; width: 100%; text-align: center; color: #333; outline: none; }
        .currency { font-weight: 600; color: #999; margin-left: 8px; }
      }
    }

    .chips-grid {
      display: flex; flex-wrap: wrap; gap: 12px; justify-content: center;
      .chip {
        background: white; border: 1px solid #e0e0e0; border-radius: 24px; padding: 8px 16px; font-size: 14px; font-weight: 600; color: #666; cursor: pointer; transition: all 0.2s;
        &:hover { background: #f5f5f5; }
        &.active { background: #fff3e0; color: #ff9500; border-color: #ff9500; }
      }
    }

    .actions {
      .confirm-btn { width: 100%; padding: 16px; font-size: 18px; font-weight: 600; border-radius: 16px; height: 56px; }
    }
  `]
})
export class TransactionFormComponent {
    @Input() title: string = 'Transaction';
    @Input() subtitle: string = '';
    @Input() balance: number = 0;
    @Input() backUrl: string = '/dashboard';
    @Input() loading: boolean = false;
    @Input() backgroundGradient: string = 'linear-gradient(135deg, #ff9500 0%, #ff6b00 100%)';

    @Output() formSubmit = new EventEmitter<number>();

    amount: number | null = null;
    chips = [5000, 10000, 25000, 50000, 100000];

    setAmount(value: number) {
        this.amount = value;
    }

    onSubmit() {
        if (this.amount && this.amount > 0) {
            this.formSubmit.emit(this.amount);
        }
    }
}
