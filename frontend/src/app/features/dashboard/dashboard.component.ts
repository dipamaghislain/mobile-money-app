import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatListModule } from '@angular/material/list';
import { MatDividerModule } from '@angular/material/divider';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';

import { AuthService } from '../../core/services/auth.service';
import { WalletService, WalletResponse, TransactionHistoryItem } from '../../core/services/wallet.service';
import { TransactionService } from '../../core/services/transaction.service';
import { amountValidator } from '../../core/validators/amount.validator';
import {
  TRANSACTION_TYPES,
  TransactionType,
  getTransactionLabel,
  getTransactionIcon,
  getTransactionColorClass
} from '../../core/constants/transaction-types';
import { CurrencyXOFPipe } from '../../shared/pipes/currency-xof.pipe';

@Component({
  selector: 'app-dashboard',
  imports: [
    CommonModule,
    RouterModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
    MatProgressSpinnerModule,
    MatListModule,
    MatDividerModule,
    MatSnackBarModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    ReactiveFormsModule,
    DatePipe,
    CurrencyXOFPipe
  ],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit {
  private readonly authService = inject(AuthService);
  private readonly walletService = inject(WalletService);
  private readonly transactionService = inject(TransactionService);
  private readonly snackBar = inject(MatSnackBar);
  private readonly dialog = inject(MatDialog);
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);

  // Signals pour l'état
  wallet = signal<WalletResponse | null>(null);
  transactions = signal<TransactionHistoryItem[]>([]);
  loading = signal(true);
  error = signal<string | null>(null);
  showBalance = signal(true);

  now = new Date();

  // Statistiques simples basées sur les transactions récentes
  get monthlyIncome(): number {
    return this.transactions()
      .filter(t => t.type === TRANSACTION_TYPES.DEPOSIT || t.type === TRANSACTION_TYPES.EPARGNE_OUT)
      .reduce((sum, t) => sum + (t.montant || 0), 0);
  }

  get monthlyExpense(): number {
    return this.transactions()
      .filter(t => t.type === TRANSACTION_TYPES.WITHDRAW || t.type === TRANSACTION_TYPES.TRANSFER || t.type === TRANSACTION_TYPES.MERCHANT_PAYMENT || t.type === TRANSACTION_TYPES.EPARGNE_IN)
      .reduce((sum, t) => sum + (t.montant || 0), 0);
  }

  get totalSavings(): number {
    return this.transactions()
      .filter(t => t.type === TRANSACTION_TYPES.EPARGNE_IN || t.type === TRANSACTION_TYPES.EPARGNE_OUT)
      .reduce((sum, t) => sum + (t.montant || 0), 0);
  }

  // Computed
  user = computed(() => this.authService.currentUserValue);
  greeting = computed(() => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Bonjour';
    if (hour < 18) return 'Bon après-midi';
    return 'Bonsoir';
  });

  ngOnInit(): void {
    this.loadDashboardData();
  }

  // Exposés simplifiés pour le template
  get transactionCount(): number {
    return this.transactions().length;
  }

  get recentTransactions(): TransactionHistoryItem[] {
    return this.transactions();
  }

  loadDashboardData(): void {
    this.loading.set(true);
    this.error.set(null);

    // Charger le portefeuille
    this.walletService.getWallet().subscribe({
      next: (wallet) => {
        this.wallet.set(wallet);
        this.loadTransactions();
      },
      error: (err) => {
        this.error.set(err.message || 'Erreur lors du chargement du portefeuille');
        this.loading.set(false);
      }
    });
  }

  private loadTransactions(): void {
    this.walletService.getTransactions({ limit: 5 }).subscribe({
      next: (response) => {
        this.transactions.set(response.transactions);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Erreur transactions:', err);
        this.loading.set(false);
      }
    });
  }

  // Actions rapides sur la carte de solde
  quickAction(action: 'recharge' | 'history' | 'export'): void {
    switch (action) {
      case 'recharge':
        this.openDepositModal();
        break;
      case 'history':
        this.router.navigateByUrl('/transactions/history');
        break;
      case 'export':
        this.exportTransactions();
        break;
    }
  }

  private exportTransactions(): void {
    const transactions = this.transactions();
    if (transactions.length === 0) {
      this.snackBar.open('Aucune transaction à exporter', 'OK', { duration: 3000 });
      return;
    }

    // Créer le contenu CSV
    const headers = ['Date', 'Type', 'Montant', 'Devise', 'Statut', 'Description', 'Référence'];
    const rows = transactions.map(t => [
      new Date(t.dateCreation).toLocaleString(),
      this.getTransactionLabel(t.type),
      t.montant,
      t.devise,
      this.getTransactionStatusLabel(t.statut),
      t.description || '',
      t.referenceExterne || ''
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    // Créer le blob et le lien de téléchargement
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `transactions_export_${new Date().toISOString().slice(0, 10)}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      this.snackBar.open('Export téléchargé avec succès', 'OK', { duration: 3000 });
    }
  }

  navigateTo(path: string): void {
    this.router.navigateByUrl(path);
  }

  toggleBalanceVisibility(): void {
    this.showBalance.update(v => !v);
  }

  openScanner(): void {
    this.snackBar.open('Scanner QR code - Fonctionnalité à venir', 'OK', { duration: 3000 });
  }

  /**
   * Retourne l'icône Material correspondant au type de transaction
   */
  getTransactionIcon(type: string): string {
    return getTransactionIcon(type as TransactionType);
  }

  /**
   * Retourne la classe CSS pour la couleur de la transaction
   */
  getTransactionColor(type: string): string {
    return getTransactionColorClass(type as TransactionType).replace('transaction-', '');
  }

  /**
   * Retourne le libellé en français du type de transaction
   */
  getTransactionLabel(type: string): string {
    return getTransactionLabel(type as TransactionType);
  }

  getTransactionIconClass(type: string): string {
    switch (type as TransactionType) {
      case TRANSACTION_TYPES.DEPOSIT:
        return 'deposit-icon';
      case TRANSACTION_TYPES.WITHDRAW:
        return 'withdraw-icon';
      case TRANSACTION_TYPES.TRANSFER:
        return 'transfer-icon';
      case TRANSACTION_TYPES.MERCHANT_PAYMENT:
        return 'payment-icon';
      case TRANSACTION_TYPES.EPARGNE_IN:
      case TRANSACTION_TYPES.EPARGNE_OUT:
        return 'savings-icon';
      default:
        return 'deposit-icon';
    }
  }

  getTransactionTitle(transaction: TransactionHistoryItem): string {
    return this.getTransactionLabel(transaction.type);
  }

  getTransactionStatusLabel(status: string): string {
    switch (status) {
      case 'COMPLETED':
        return 'Terminée';
      case 'PENDING':
        return 'En attente';
      case 'PROCESSING':
        return 'En cours';
      case 'FAILED':
        return 'Échouée';
      case 'CANCELLED':
        return 'Annulée';
      default:
        return status;
    }
  }

  getAmountClass(type: string): string {
    switch (type as TransactionType) {
      case TRANSACTION_TYPES.DEPOSIT:
      case TRANSACTION_TYPES.EPARGNE_OUT:
        return 'positive';
      case TRANSACTION_TYPES.WITHDRAW:
      case TRANSACTION_TYPES.TRANSFER:
      case TRANSACTION_TYPES.MERCHANT_PAYMENT:
      case TRANSACTION_TYPES.EPARGNE_IN:
        return 'negative';
      default:
        return '';
    }
  }

  getAmountSign(type: string): string {
    switch (type as TransactionType) {
      case TRANSACTION_TYPES.DEPOSIT:
      case TRANSACTION_TYPES.EPARGNE_OUT:
        return '+';
      case TRANSACTION_TYPES.WITHDRAW:
      case TRANSACTION_TYPES.TRANSFER:
      case TRANSACTION_TYPES.MERCHANT_PAYMENT:
      case TRANSACTION_TYPES.EPARGNE_IN:
        return '-';
      default:
        return '';
    }
  }

  viewTransaction(transaction: TransactionHistoryItem): void {
    // Pour l'instant on redirige simplement vers l'historique
    this.router.navigate(['/transactions/history'], {
      queryParams: { id: transaction.id }
    });
  }

  logout(): void {
    this.authService.logout();
  }

  refresh(): void {
    this.loadDashboardData();
    this.snackBar.open('Données actualisées', 'OK', { duration: 2000 });
  }

  // Ouvrir modal de dépôt
  openDepositModal(): void {
    const dialogRef = this.dialog.open(DepositModalComponent, {
      width: '100%',
      maxWidth: '520px',
      disableClose: true,
      panelClass: 'app-transaction-dialog',
      backdropClass: 'app-dialog-backdrop'
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result === 'success') {
        this.loadDashboardData();
      }
    });
  }

  // Ouvrir modal de retrait
  openWithdrawModal(): void {
    const dialogRef = this.dialog.open(WithdrawModalComponent, {
      width: '100%',
      maxWidth: '520px',
      disableClose: true,
      panelClass: 'app-transaction-dialog',
      backdropClass: 'app-dialog-backdrop'
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result === 'success') {
        this.loadDashboardData();
      }
    });
  }

  // Ouvrir modal de transfert
  openTransferModal(): void {
    const dialogRef = this.dialog.open(TransferModalComponent, {
      width: '100%',
      maxWidth: '520px',
      disableClose: true,
      panelClass: 'app-transaction-dialog',
      backdropClass: 'app-dialog-backdrop'
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result === 'success') {
        this.loadDashboardData();
      }
    });
  }
}

// ============================================
// COMPOSANT MODAL DÉPÔT
// ============================================
@Component({
  selector: 'app-deposit-modal',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule
  ],
  template: `
    <div class="modal-container">
      <div class="modal-header">
        <h2>
          <mat-icon>account_balance_wallet</mat-icon>
          Effectuer un dépôt
        </h2>
        <button mat-icon-button (click)="close()">
          <mat-icon>close</mat-icon>
        </button>
      </div>

      <div class="modal-content">
        <div class="info-box">
          <mat-icon class="info-icon">info</mat-icon>
          <div class="info-content">
            <p><strong>Le dépôt crédite directement votre compte.</strong></p>
            <p>Aucun numéro de bénéficiaire ni code PIN requis.</p>
          </div>
        </div>

        <form [formGroup]="form" (ngSubmit)="onSubmit()">
          @if (error()) {
          <div class="error-message">
            <mat-icon>error</mat-icon>
            <span>{{ error() }}</span>
          </div>
          }

          @if (success()) {
          <div class="success-message">
            <mat-icon>check_circle</mat-icon>
            <span>{{ success() }}</span>
          </div>
          }

          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Montant à déposer</mat-label>
            <input matInput type="number" formControlName="amount" placeholder="Ex: 5000" min="100">
            <mat-icon matPrefix>attach_money</mat-icon>
            <span matTextSuffix>XOF</span>
            <mat-hint>Montant minimum : 100 XOF</mat-hint>
            <mat-error *ngIf="form.get('amount')?.hasError('required')">
              Le montant est requis
            </mat-error>
            <mat-error *ngIf="form.get('amount')?.hasError('min')">
              Le montant minimum est de 100 XOF
            </mat-error>
          </mat-form-field>

          <div class="modal-actions">
            <button mat-button type="button" (click)="close()">Annuler</button>
            <button mat-raised-button color="primary" type="submit" [disabled]="form.invalid || loading()">
              @if (loading()) {
              <mat-spinner diameter="20"></mat-spinner>
              <span>En cours...</span>
              } @else {
              <ng-container matButtonIcon>
                <mat-icon>check</mat-icon>
                <span>Valider</span>
              </ng-container>
              }
            </button>
          </div>
        </form>
      </div>
    </div>
  `,
  styles: [`
    .modal-container {
      padding: 0;
    }
    .modal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 20px 24px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
    }
    .modal-header h2 {
      margin: 0;
      display: flex;
      align-items: center;
      gap: 12px;
      font-size: 20px;
    }
    .modal-content {
      padding: 24px;
    }
    .info-box {
      display: flex;
      gap: 12px;
      padding: 16px;
      margin-bottom: 24px;
      background: #e3f2fd;
      border-left: 4px solid #2196f3;
      border-radius: 8px;
    }
    .info-icon {
      color: #2196f3;
      flex-shrink: 0;
    }
    .full-width {
      width: 100%;
      margin-bottom: 20px;
    }
    .modal-actions {
      display: flex;
      justify-content: flex-end;
      gap: 12px;
      margin-top: 24px;
    }
    .error-message, .success-message {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 14px 16px;
      margin-bottom: 20px;
      border-radius: 8px;
    }
    .error-message {
      background: #ffebee;
      color: #c62828;
      border-left: 4px solid #f44336;
    }
    .success-message {
      background: #e8f5e9;
      color: #2e7d32;
      border-left: 4px solid #4caf50;
    }
  `]
})
class DepositModalComponent {
  private fb = inject(FormBuilder);
  private transactionService = inject(TransactionService);
  private dialogRef = inject(MatDialog);
  private snackBar = inject(MatSnackBar);

  loading = signal(false);
  error = signal<string | null>(null);
  success = signal<string | null>(null);

  form = this.fb.group({
    amount: [null as number | null, [Validators.required, amountValidator(100)]]
  });

  close(): void {
    this.dialogRef.closeAll();
  }

  onSubmit(): void {
    if (this.form.invalid) return;

    this.loading.set(true);
    this.error.set(null);
    this.success.set(null);

    const { amount } = this.form.value;

    this.transactionService.deposit({ montant: amount! }).subscribe({
      next: (res) => {
        this.loading.set(false);
        this.success.set('Dépôt effectué avec succès !');
        this.snackBar.open('Dépôt effectué avec succès', 'OK', { duration: 3000 });
        setTimeout(() => {
          this.dialogRef.closeAll();
        }, 1500);
      },
      error: (err) => {
        this.loading.set(false);
        this.error.set(err.error?.message || 'Une erreur est survenue');
      }
    });
  }
}

// ============================================
// COMPOSANT MODAL RETRAIT
// ============================================
@Component({
  selector: 'app-withdraw-modal',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule
  ],
  template: `
    <div class="modal-container">
      <div class="modal-header">
        <h2>
          <mat-icon>account_balance</mat-icon>
          Effectuer un retrait
        </h2>
        <button mat-icon-button (click)="close()">
          <mat-icon>close</mat-icon>
        </button>
      </div>

      <div class="modal-content">
        <div class="info-box">
          <mat-icon class="info-icon">info</mat-icon>
          <div class="info-content">
            <p><strong>Le retrait débite votre compte.</strong></p>
            <p>Le code PIN est requis pour confirmer.</p>
          </div>
        </div>

        <form [formGroup]="form" (ngSubmit)="onSubmit()">
          @if (error()) {
          <div class="error-message">
            <mat-icon>error</mat-icon>
            <span>{{ error() }}</span>
          </div>
          }

          @if (success()) {
          <div class="success-message">
            <mat-icon>check_circle</mat-icon>
            <span>{{ success() }}</span>
          </div>
          }

          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Montant à retirer</mat-label>
            <input matInput type="number" formControlName="amount" placeholder="Ex: 5000" min="100">
            <mat-icon matPrefix>attach_money</mat-icon>
            <span matTextSuffix>XOF</span>
            <mat-hint>Montant minimum : 100 XOF</mat-hint>
            <mat-error *ngIf="form.get('amount')?.hasError('required')">
              Le montant est requis
            </mat-error>
            <mat-error *ngIf="form.get('amount')?.hasError('min')">
              Le montant minimum est de 100 XOF
            </mat-error>
          </mat-form-field>

          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Code PIN</mat-label>
            <input matInput type="password" formControlName="pin" placeholder="****" maxlength="4" autocomplete="off">
            <mat-icon matPrefix>lock</mat-icon>
            <mat-hint>4 chiffres requis</mat-hint>
            <mat-error *ngIf="form.get('pin')?.hasError('required')">
              Le code PIN est requis
            </mat-error>
            <mat-error *ngIf="form.get('pin')?.hasError('pattern')">
              Le code PIN doit contenir uniquement des chiffres
            </mat-error>
          </mat-form-field>

          <div class="modal-actions">
            <button mat-button type="button" (click)="close()">Annuler</button>
            <button mat-raised-button color="warn" type="submit" [disabled]="form.invalid || loading()">
              @if (loading()) {
              <mat-spinner diameter="20"></mat-spinner>
              <span>En cours...</span>
              } @else {
              <ng-container matButtonIcon>
                <mat-icon>account_balance</mat-icon>
                <span>Valider</span>
              </ng-container>
              }
            </button>
          </div>
        </form>
      </div>
    </div>
  `,
  styles: [`
    .modal-container {
      padding: 0;
    }
    .modal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 20px 24px;
      background: linear-gradient(135deg, #ff9800 0%, #f57c00 100%);
      color: white;
    }
    .modal-header h2 {
      margin: 0;
      display: flex;
      align-items: center;
      gap: 12px;
      font-size: 20px;
    }
    .modal-content {
      padding: 24px;
    }
    .info-box {
      display: flex;
      gap: 12px;
      padding: 16px;
      margin-bottom: 24px;
      background: #fff3e0;
      border-left: 4px solid #ff9800;
      border-radius: 8px;
    }
    .info-icon {
      color: #ff9800;
      flex-shrink: 0;
    }
    .full-width {
      width: 100%;
      margin-bottom: 20px;
    }
    .modal-actions {
      display: flex;
      justify-content: flex-end;
      gap: 12px;
      margin-top: 24px;
    }
    .error-message, .success-message {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 14px 16px;
      margin-bottom: 20px;
      border-radius: 8px;
    }
    .error-message {
      background: #ffebee;
      color: #c62828;
      border-left: 4px solid #f44336;
    }
    .success-message {
      background: #e8f5e9;
      color: #2e7d32;
      border-left: 4px solid #4caf50;
    }
  `]
})
class WithdrawModalComponent {
  private fb = inject(FormBuilder);
  private transactionService = inject(TransactionService);
  private dialogRef = inject(MatDialog);
  private snackBar = inject(MatSnackBar);

  loading = signal(false);
  error = signal<string | null>(null);
  success = signal<string | null>(null);

  form = this.fb.group({
    amount: [null, [Validators.required, Validators.min(100)]],
    pin: ['', [Validators.required, Validators.minLength(4), Validators.maxLength(4), Validators.pattern('^[0-9]*$')]]
  });

  close(): void {
    this.dialogRef.closeAll();
  }

  onSubmit(): void {
    if (this.form.invalid) return;

    this.loading.set(true);
    this.error.set(null);
    this.success.set(null);

    const { amount, pin } = this.form.value;

    this.transactionService.withdraw({ montant: amount!, pin: pin! }).subscribe({
      next: (res) => {
        this.loading.set(false);
        this.success.set('Retrait effectué avec succès !');
        this.snackBar.open('Retrait effectué avec succès', 'OK', { duration: 3000 });
        setTimeout(() => {
          this.dialogRef.closeAll();
        }, 1500);
      },
      error: (err) => {
        this.loading.set(false);
        this.error.set(err.error?.message || 'Une erreur est survenue');
      }
    });
  }
}

// ============================================
// COMPOSANT MODAL TRANSFERT
// ============================================
@Component({
  selector: 'app-transfer-modal',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule
  ],
  template: `
    <div class="modal-container">
      <div class="modal-header">
        <h2>
          <mat-icon>send</mat-icon>
          Effectuer un transfert
        </h2>
        <button mat-icon-button (click)="close()">
          <mat-icon>close</mat-icon>
        </button>
      </div>

      <div class="modal-content">
        <div class="info-box">
          <mat-icon class="info-icon">info</mat-icon>
          <div class="info-content">
            <p><strong>Envoyez de l'argent à un autre utilisateur.</strong></p>
            <p>Le numéro de téléphone du destinataire et le code PIN sont requis.</p>
          </div>
        </div>

        <form [formGroup]="form" (ngSubmit)="onSubmit()">
          @if (error()) {
          <div class="error-message">
            <mat-icon>error</mat-icon>
            <span>{{ error() }}</span>
          </div>
          }

          @if (success()) {
          <div class="success-message">
            <mat-icon>check_circle</mat-icon>
            <span>{{ success() }}</span>
          </div>
          }

          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Numéro de téléphone du destinataire</mat-label>
            <input matInput type="tel" formControlName="telephoneDestinataire" placeholder="Ex: 0612345678">
            <mat-icon matPrefix>phone</mat-icon>
            <mat-hint>10 chiffres requis</mat-hint>
            <mat-error *ngIf="form.get('telephoneDestinataire')?.hasError('required')">
              Le numéro de téléphone est requis
            </mat-error>
            <mat-error *ngIf="form.get('telephoneDestinataire')?.hasError('pattern')">
              Format invalide (10 chiffres)
            </mat-error>
          </mat-form-field>

          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Montant à transférer</mat-label>
            <input matInput type="number" formControlName="amount" placeholder="Ex: 5000" min="100">
            <mat-icon matPrefix>attach_money</mat-icon>
            <span matTextSuffix>XOF</span>
            <mat-hint>Montant minimum : 100 XOF</mat-hint>
            <mat-error *ngIf="form.get('amount')?.hasError('required')">
              Le montant est requis
            </mat-error>
            <mat-error *ngIf="form.get('amount')?.hasError('min')">
              Le montant minimum est de 100 XOF
            </mat-error>
          </mat-form-field>

          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Code PIN</mat-label>
            <input matInput type="password" formControlName="pin" placeholder="****" maxlength="4" autocomplete="off">
            <mat-icon matPrefix>lock</mat-icon>
            <mat-hint>4 chiffres requis</mat-hint>
            <mat-error *ngIf="form.get('pin')?.hasError('required')">
              Le code PIN est requis
            </mat-error>
            <mat-error *ngIf="form.get('pin')?.hasError('pattern')">
              Le code PIN doit contenir uniquement des chiffres
            </mat-error>
          </mat-form-field>

          <div class="modal-actions">
            <button mat-button type="button" (click)="close()">Annuler</button>
            <button mat-raised-button color="primary" type="submit" [disabled]="form.invalid || loading()">
              @if (loading()) {
              <mat-spinner diameter="20"></mat-spinner>
              <span>En cours...</span>
              } @else {
              <ng-container matButtonIcon>
                <mat-icon>send</mat-icon>
                <span>Envoyer</span>
              </ng-container>
              }
            </button>
          </div>
        </form>
      </div>
    </div>
  `,
  styles: [`
    .modal-container {
      padding: 0;
    }
    .modal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 20px 24px;
      background: linear-gradient(135deg, #4caf50 0%, #2e7d32 100%);
      color: white;
    }
    .modal-header h2 {
      margin: 0;
      display: flex;
      align-items: center;
      gap: 12px;
      font-size: 20px;
    }
    .modal-content {
      padding: 24px;
    }
    .info-box {
      display: flex;
      gap: 12px;
      padding: 16px;
      margin-bottom: 24px;
      background: #e8f5e9;
      border-left: 4px solid #4caf50;
      border-radius: 8px;
    }
    .info-icon {
      color: #4caf50;
      flex-shrink: 0;
    }
    .full-width {
      width: 100%;
      margin-bottom: 20px;
    }
    .modal-actions {
      display: flex;
      justify-content: flex-end;
      gap: 12px;
      margin-top: 24px;
    }
    .error-message, .success-message {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 14px 16px;
      margin-bottom: 20px;
      border-radius: 8px;
    }
    .error-message {
      background: #ffebee;
      color: #c62828;
      border-left: 4px solid #f44336;
    }
    .success-message {
      background: #e8f5e9;
      color: #2e7d32;
      border-left: 4px solid #4caf50;
    }
  `]
})
class TransferModalComponent {
  private fb = inject(FormBuilder);
  private transactionService = inject(TransactionService);
  private dialogRef = inject(MatDialog);
  private snackBar = inject(MatSnackBar);

  loading = signal(false);
  error = signal<string | null>(null);
  success = signal<string | null>(null);

  form = this.fb.group({
    telephoneDestinataire: ['', [Validators.required, Validators.pattern('^[0-9]{10}$')]],
    amount: [null, [Validators.required, Validators.min(100)]],
    pin: ['', [Validators.required, Validators.minLength(4), Validators.maxLength(4), Validators.pattern('^[0-9]*$')]]
  });

  close(): void {
    this.dialogRef.closeAll();
  }

  onSubmit(): void {
    if (this.form.invalid) return;

    this.loading.set(true);
    this.error.set(null);
    this.success.set(null);

    const { telephoneDestinataire, amount, pin } = this.form.value;

    this.transactionService.transfer({ destinataire: telephoneDestinataire!, montant: amount!, pin: pin! }).subscribe({
      next: (res) => {
        this.loading.set(false);
        this.success.set('Transfert effectué avec succès !');
        this.snackBar.open('Transfert effectué avec succès', 'OK', { duration: 3000 });
        setTimeout(() => {
          this.dialogRef.closeAll();
        }, 1500);
      },
      error: (err) => {
        this.loading.set(false);
        this.error.set(err.error?.message || 'Une erreur est survenue');
      }
    });
  }
}
