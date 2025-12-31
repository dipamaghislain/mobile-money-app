import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatChipsModule } from '@angular/material/chips';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatMenuModule } from '@angular/material/menu';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { TransactionService, Transaction, HistoryFilters, HistoryResponse } from '../../../core/services/transaction.service';
import { BottomNavComponent } from '../../../shared/components/bottom-nav/bottom-nav';

@Component({
  selector: 'app-transaction-history',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatListModule,
    MatIconModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    MatChipsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatExpansionModule,
    MatPaginatorModule,
    MatMenuModule,
    MatSnackBarModule,
    BottomNavComponent
  ],
  templateUrl: './history.html',
  styleUrl: './history.scss'
})
export class TransactionHistoryComponent implements OnInit {
  private transactionService = inject(TransactionService);
  private snackBar = inject(MatSnackBar);

  // État
  transactions = signal<Transaction[]>([]);
  loading = signal(true);
  error = signal<string | null>(null);
  exporting = signal(false);

  // Pagination
  totalItems = signal(0);
  pageSize = signal(20);
  currentPage = signal(1);

  // Résumé
  resume = signal<{ totalEntrees: number; totalSorties: number } | null>(null);

  // Filtres
  filters = signal<HistoryFilters>({
    page: 1,
    limit: 20,
    tri: 'date_desc'
  });

  // Filtres UI
  selectedType = signal<string>('');
  selectedStatut = signal<string>('');
  searchQuery = signal<string>('');
  dateDebut = signal<Date | null>(null);
  dateFin = signal<Date | null>(null);
  montantMin = signal<number | null>(null);
  montantMax = signal<number | null>(null);
  selectedTri = signal<string>('date_desc');

  // Types disponibles
  transactionTypes = [
    { value: '', label: 'Tous les types' },
    { value: 'DEPOSIT', label: 'Dépôts' },
    { value: 'WITHDRAW', label: 'Retraits' },
    { value: 'TRANSFER', label: 'Transferts' },
    { value: 'MERCHANT_PAYMENT', label: 'Paiements' }
  ];

  statuts = [
    { value: '', label: 'Tous les statuts' },
    { value: 'SUCCES', label: 'Réussi' },
    { value: 'ECHEC', label: 'Échoué' },
    { value: 'EN_ATTENTE', label: 'En attente' }
  ];

  triOptions = [
    { value: 'date_desc', label: 'Plus récent' },
    { value: 'date_asc', label: 'Plus ancien' },
    { value: 'montant_desc', label: 'Montant décroissant' },
    { value: 'montant_asc', label: 'Montant croissant' }
  ];

  // Panneau de filtres ouvert/fermé
  filterPanelOpen = signal(false);

  ngOnInit() {
    this.loadTransactions();
  }

  loadTransactions() {
    this.loading.set(true);
    this.error.set(null);

    const filters: HistoryFilters = {
      page: this.currentPage(),
      limit: this.pageSize(),
      tri: this.selectedTri() as any
    };

    if (this.selectedType()) filters.type = this.selectedType();
    if (this.selectedStatut()) filters.statut = this.selectedStatut();
    if (this.searchQuery()) filters.recherche = this.searchQuery();
    if (this.dateDebut()) filters.dateDebut = this.dateDebut()!.toISOString().split('T')[0];
    if (this.dateFin()) filters.dateFin = this.dateFin()!.toISOString().split('T')[0];
    if (this.montantMin()) filters.montantMin = this.montantMin()!;
    if (this.montantMax()) filters.montantMax = this.montantMax()!;

    this.transactionService.getHistory(filters).subscribe({
      next: (response: HistoryResponse) => {
        this.transactions.set(response.transactions);
        this.totalItems.set(response.pagination.total);
        this.resume.set(response.resume || null);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set('Impossible de charger les transactions');
        this.loading.set(false);
      }
    });
  }

  // Pagination
  onPageChange(event: PageEvent) {
    this.currentPage.set(event.pageIndex + 1);
    this.pageSize.set(event.pageSize);
    this.loadTransactions();
  }

  // Appliquer les filtres
  applyFilters() {
    this.currentPage.set(1);
    this.loadTransactions();
  }

  // Réinitialiser les filtres
  resetFilters() {
    this.selectedType.set('');
    this.selectedStatut.set('');
    this.searchQuery.set('');
    this.dateDebut.set(null);
    this.dateFin.set(null);
    this.montantMin.set(null);
    this.montantMax.set(null);
    this.selectedTri.set('date_desc');
    this.currentPage.set(1);
    this.loadTransactions();
  }

  // Export
  exportToCSV() {
    this.exporting.set(true);
    
    const options = {
      format: 'csv' as const,
      type: this.selectedType() || undefined,
      dateDebut: this.dateDebut()?.toISOString().split('T')[0],
      dateFin: this.dateFin()?.toISOString().split('T')[0]
    };

    this.transactionService.exportHistory(options).subscribe({
      next: (blob: Blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `transactions_${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        window.URL.revokeObjectURL(url);
        this.exporting.set(false);
        this.snackBar.open('Export téléchargé', 'OK', { duration: 3000 });
      },
      error: () => {
        this.exporting.set(false);
        this.snackBar.open('Erreur lors de l\'export', 'OK', { duration: 3000 });
      }
    });
  }

  exportToJSON() {
    this.exporting.set(true);
    
    const options = {
      format: 'json' as const,
      type: this.selectedType() || undefined,
      dateDebut: this.dateDebut()?.toISOString().split('T')[0],
      dateFin: this.dateFin()?.toISOString().split('T')[0]
    };

    this.transactionService.exportHistory(options).subscribe({
      next: (data: any) => {
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `transactions_${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        window.URL.revokeObjectURL(url);
        this.exporting.set(false);
        this.snackBar.open('Export téléchargé', 'OK', { duration: 3000 });
      },
      error: () => {
        this.exporting.set(false);
        this.snackBar.open('Erreur lors de l\'export', 'OK', { duration: 3000 });
      }
    });
  }

  // Helpers
  getTransactionIcon(type: string): string {
    const icons: Record<string, string> = {
      'DEPOSIT': 'add_circle',
      'WITHDRAW': 'remove_circle',
      'TRANSFER': 'send',
      'MERCHANT_PAYMENT': 'store'
    };
    return icons[type] || 'receipt';
  }

  getTransactionColor(type: string): string {
    const colors: Record<string, string> = {
      'DEPOSIT': 'success',
      'WITHDRAW': 'warn',
      'TRANSFER': 'primary',
      'MERCHANT_PAYMENT': 'accent'
    };
    return colors[type] || '';
  }

  getTransactionLabel(type: string): string {
    const labels: Record<string, string> = {
      'DEPOSIT': 'Dépôt',
      'WITHDRAW': 'Retrait',
      'TRANSFER': 'Transfert',
      'MERCHANT_PAYMENT': 'Paiement'
    };
    return labels[type] || type;
  }

  getStatusLabel(statut: string): string {
    const labels: Record<string, string> = {
      'SUCCES': 'Réussi',
      'ECHEC': 'Échoué',
      'EN_ATTENTE': 'En attente'
    };
    return labels[statut] || statut;
  }

  getStatusColor(statut: string): string {
    const colors: Record<string, string> = {
      'SUCCES': 'primary',
      'ECHEC': 'warn',
      'EN_ATTENTE': 'accent'
    };
    return colors[statut] || '';
  }

  formatAmount(amount: number): string {
    return new Intl.NumberFormat('fr-FR').format(amount);
  }
}
