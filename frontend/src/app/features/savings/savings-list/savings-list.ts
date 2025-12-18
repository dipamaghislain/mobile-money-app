import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatChipsModule } from '@angular/material/chips';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { SavingsService, SavingsGoal } from '../../../core/services/savings.service';

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
    MatChipsModule,
    MatSnackBarModule,
    CurrencyPipe,
    DatePipe
  ],
  templateUrl: './savings-list.html',
  styleUrl: './savings-list.scss',
})
export class SavingsList implements OnInit {
  private readonly savingsService = inject(SavingsService);
  private readonly snackBar = inject(MatSnackBar);

  savings = signal<SavingsGoal[]>([]);
  loading = signal(true);
  error = signal<string | null>(null);

  ngOnInit(): void {
    this.loadSavings();
  }

  loadSavings(): void {
    this.loading.set(true);
    this.error.set(null);

    this.savingsService.getSavings().subscribe({
      next: (response) => {
        this.savings.set(response.tirelires);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(err.error?.message || 'Erreur lors du chargement des tirelires');
        this.loading.set(false);
        this.snackBar.open('Erreur lors du chargement', 'OK', { duration: 3000 });
      }
    });
  }

  getProgress(saving: SavingsGoal): number {
    if (!saving.objectifMontant || saving.objectifMontant === 0) return 0;
    return Math.min((saving.montantActuel / saving.objectifMontant) * 100, 100);
  }

  getStatusColor(statut: string): string {
    switch (statut) {
      case 'active': return 'primary';
      case 'terminee': return 'accent';
      case 'annulee': return 'warn';
      default: return '';
    }
  }

  getStatusLabel(statut: string): string {
    switch (statut) {
      case 'active': return 'Active';
      case 'terminee': return 'Terminée';
      case 'annulee': return 'Annulée';
      default: return statut;
    }
  }
}
