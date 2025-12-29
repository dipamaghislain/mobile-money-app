import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { Router } from '@angular/router';

import { SavingsService } from '../../../core/services/savings.service';
import { WalletService } from '../../../core/services/wallet.service';
import { PinDialogComponent } from './pin-dialog.component';
import { TransactionFormComponent } from '../../../shared/components/transaction-form/transaction-form.component';

@Component({
  selector: 'app-savings-list',
  standalone: true,
  imports: [
    CommonModule,
    MatSnackBarModule,
    MatDialogModule,
    TransactionFormComponent
  ],
  template: `
    <app-transaction-form 
      title="Mon Épargne"
      subtitle="Économiser pour le futur"
      [balance]="walletBalance()"
      [loading]="loading()"
      (formSubmit)="onConfirm($event)">
    </app-transaction-form>
  `
})
export class SavingsList implements OnInit {
  private readonly savingsService = inject(SavingsService);
  private readonly walletService = inject(WalletService);
  private readonly snackBar = inject(MatSnackBar);
  private readonly dialog = inject(MatDialog);
  private readonly router = inject(Router);

  walletBalance = signal<number>(0);
  loading = signal(false);
  savingId = signal<string | null>(null);

  ngOnInit(): void {
    this.refreshData();
  }

  refreshData() {
    this.loading.set(true);
    // 1. Get Wallet Balance
    this.walletService.getWallet().subscribe({
      next: (w) => this.walletBalance.set(w.solde),
      error: () => this.snackBar.open('Impossible de récupérer le solde', 'OK', { duration: 3000 })
    });

    // 2. Get Single Savings Account (Singleton)
    this.savingsService.getSavings().subscribe({
      next: (res) => {
        if (res.tirelires && res.tirelires.length > 0) {
          this.savingId.set(res.tirelires[0].id);
          this.loading.set(false);
        } else {
          this.createDefaultSaving();
        }
      },
      error: () => {
        this.snackBar.open('Erreur chargement épargne', 'OK', { duration: 3000 });
        this.loading.set(false);
      }
    });
  }

  createDefaultSaving() {
    const defaultGoal = {
      nom: 'Mon Épargne',
      description: 'Compte Épargne Principal',
      icone: 'savings',
      couleur: '#ff9500'
    };
    this.savingsService.createSaving(defaultGoal).subscribe({
      next: (res) => {
        this.savingId.set(res.tirelire.id);
        this.loading.set(false);
      },
      error: () => {
        this.snackBar.open('Erreur initialisation épargne', 'OK', { duration: 3000 });
        this.loading.set(false);
      }
    });
  }

  onConfirm(amount: number) {
    if (amount > this.walletBalance()) {
      this.snackBar.open('Solde insuffisant', 'OK', { duration: 3000 });
      return;
    }

    const dialogRef = this.dialog.open(PinDialogComponent, { width: '300px' });

    dialogRef.afterClosed().subscribe(pin => {
      if (pin) {
        this.deposit(amount, pin);
      }
    });
  }

  deposit(amount: number, pin: string) {
    this.loading.set(true);
    const id = this.savingId();
    if (!id) return;

    this.savingsService.depositToSaving(id, amount, pin).subscribe({
      next: (res) => {
        this.snackBar.open('Épargne créditée avec succès !', 'OK', { duration: 3000 });
        this.refreshData(); // Refresh balance
        setTimeout(() => this.router.navigate(['/dashboard']), 500);
      },
      error: (err) => {
        this.snackBar.open(err.error?.message || 'Erreur lors du dépôt', 'OK', { duration: 4000 });
        this.loading.set(false);
      }
    });
  }
}
