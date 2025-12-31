// src/app/features/savings/savings-list/savings-list.ts
import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatMenuModule } from '@angular/material/menu';
import { MatDividerModule } from '@angular/material/divider';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';

import { SavingsService, SavingsGoal } from '../../../core/services/savings.service';
import { WalletService } from '../../../core/services/wallet.service';
import { CurrencyXOFPipe } from '../../../shared/pipes/currency-xof.pipe';
import { BottomNavComponent } from '../../../shared/components/bottom-nav/bottom-nav';
import { SavingsDepositDialog } from './savings-deposit-dialog.component';
import { SavingsWithdrawDialog } from './savings-withdraw-dialog.component';
import { SavingsCreateDialog } from './savings-create-dialog.component';

@Component({
  selector: 'app-savings-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatMenuModule,
    MatDividerModule,
    MatTooltipModule,
    MatSnackBarModule,
    MatDialogModule,
    CurrencyXOFPipe,
    BottomNavComponent
  ],
  templateUrl: './savings-list.html',
  styleUrl: './savings-list.scss'
})
export class SavingsList implements OnInit {
  private readonly savingsService = inject(SavingsService);
  private readonly walletService = inject(WalletService);
  private readonly snackBar = inject(MatSnackBar);
  private readonly dialog = inject(MatDialog);

  // State
  loading = signal(true);
  walletBalance = signal(0);
  savingsGoals = signal<SavingsGoal[]>([]);

  // Computed
  totalSavings = computed(() => 
    this.savingsGoals().reduce((sum, goal) => sum + (goal.montantActuel || 0), 0)
  );

  ngOnInit(): void {
    this.refreshData();
  }

  refreshData(): void {
    this.loading.set(true);

    // Load wallet balance
    this.walletService.getWallet().subscribe({
      next: (wallet) => this.walletBalance.set(wallet.solde || 0),
      error: () => this.snackBar.open('Erreur chargement solde', 'OK', { duration: 3000 })
    });

    // Load savings goals
    this.savingsService.getSavings().subscribe({
      next: (response) => {
        this.savingsGoals.set(response.tirelires || []);
        this.loading.set(false);
        
        // If no savings goals, create a default one
        if (response.tirelires.length === 0) {
          this.createDefaultGoal();
        }
      },
      error: () => {
        this.snackBar.open('Erreur chargement épargne', 'OK', { duration: 3000 });
        this.loading.set(false);
      }
    });
  }

  private createDefaultGoal(): void {
    this.savingsService.createSaving({
      nom: 'Mon Épargne',
      description: 'Compte épargne principal',
      icone: 'savings',
      couleur: '#ff9500'
    }).subscribe({
      next: (response) => {
        this.savingsGoals.set([response.tirelire]);
      }
    });
  }

  getProgress(goal: SavingsGoal): number {
    if (!goal.objectifMontant || goal.objectifMontant === 0) return 0;
    return Math.min(100, (goal.montantActuel / goal.objectifMontant) * 100);
  }

  getDaysLeft(goal: SavingsGoal): number {
    if (!goal.dateObjectif) return 0;
    const today = new Date();
    const deadline = new Date(goal.dateObjectif);
    const diff = deadline.getTime() - today.getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  }

  openCreateGoal(): void {
    const dialogRef = this.dialog.open(SavingsCreateDialog, {
      width: '400px',
      panelClass: 'custom-dialog'
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loading.set(true);
        this.savingsService.createSaving(result).subscribe({
          next: () => {
            this.snackBar.open('Objectif créé avec succès !', 'OK', { duration: 3000 });
            this.refreshData();
          },
          error: (err) => {
            this.snackBar.open(err.error?.message || 'Erreur création', 'OK', { duration: 3000 });
            this.loading.set(false);
          }
        });
      }
    });
  }

  openDeposit(goal?: SavingsGoal): void {
    const targetGoal = goal || this.savingsGoals()[0];
    if (!targetGoal) return;

    const dialogRef = this.dialog.open(SavingsDepositDialog, {
      width: '400px',
      data: { 
        goal: targetGoal, 
        maxAmount: this.walletBalance() 
      },
      panelClass: 'custom-dialog'
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loading.set(true);
        this.savingsService.depositToSaving(targetGoal.id, result.amount, result.pin).subscribe({
          next: () => {
            this.snackBar.open('Épargne créditée avec succès !', 'OK', { duration: 3000 });
            this.refreshData();
          },
          error: (err) => {
            this.snackBar.open(err.error?.message || 'Erreur lors du dépôt', 'OK', { duration: 4000 });
            this.loading.set(false);
          }
        });
      }
    });
  }

  openWithdraw(goal?: SavingsGoal): void {
    const targetGoal = goal || this.savingsGoals()[0];
    if (!targetGoal || targetGoal.montantActuel === 0) return;

    const dialogRef = this.dialog.open(SavingsWithdrawDialog, {
      width: '400px',
      data: { 
        goal: targetGoal, 
        maxAmount: targetGoal.montantActuel 
      },
      panelClass: 'custom-dialog'
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loading.set(true);
        this.savingsService.withdrawFromSaving(targetGoal.id, result.amount, result.pin).subscribe({
          next: () => {
            this.snackBar.open('Retrait effectué avec succès !', 'OK', { duration: 3000 });
            this.refreshData();
          },
          error: (err) => {
            this.snackBar.open(err.error?.message || 'Erreur lors du retrait', 'OK', { duration: 4000 });
            this.loading.set(false);
          }
        });
      }
    });
  }

  editGoal(goal: SavingsGoal): void {
    this.snackBar.open('Fonctionnalité à venir', 'OK', { duration: 2000 });
  }

  deleteGoal(goal: SavingsGoal): void {
    if (goal.montantActuel > 0) {
      this.snackBar.open('Veuillez d\'abord retirer le solde', 'OK', { duration: 3000 });
      return;
    }
    this.snackBar.open('Fonctionnalité à venir', 'OK', { duration: 2000 });
  }
}
